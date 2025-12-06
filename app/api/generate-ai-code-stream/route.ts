import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import type { SandboxState } from '@/types/sandbox';
import { selectFilesForEdit, getFileContents, formatFilesForAI } from '@/lib/context-selector';
import type { ConversationState, ConversationMessage, ConversationEdit } from '@/types/conversation';
import { appConfig } from '@/config/app.config';
import { buildSystemPrompt } from '@/lib/ai/system-prompts';
import type { ProjectTypeId } from '@/lib/projects/project-type';

import {
  type EditContext,
  type StreamProgressData,
  type GenerationContext,
  getProviderAndModel,
  isUsingAIGateway,
  openai,
  buildConversationContext,
  buildSurgicalEditContext,
  buildKeywordEditContext,
  extractPackagesFromCode,
  extractPackagesFromTags,
  validateGeneratedCode,
  handleTruncation,
  auditAndRecover
} from './lib';

// Force dynamic route to enable streaming
export const dynamic = 'force-dynamic';

declare global {
  var sandboxState: SandboxState;
  var conversationState: ConversationState | null;
  var activeSandbox: any;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, model = 'openai/gpt-oss-20b', context, isEdit = false } = await request.json();
    
    console.log('[generate-ai-code-stream] Received request:');
    console.log('[generate-ai-code-stream] - prompt:', prompt);
    console.log('[generate-ai-code-stream] - isEdit:', isEdit);
    console.log('[generate-ai-code-stream] - context.sandboxId:', context?.sandboxId);
    console.log('[generate-ai-code-stream] - context.currentFiles:', context?.currentFiles ? Object.keys(context.currentFiles) : 'none');
    console.log('[generate-ai-code-stream] - currentFiles count:', context?.currentFiles ? Object.keys(context.currentFiles).length : 0);
    
    // Initialize conversation state if not exists
    if (!global.conversationState) {
      global.conversationState = {
        conversationId: `conv-${Date.now()}`,
        startedAt: Date.now(),
        lastUpdated: Date.now(),
        context: {
          messages: [],
          edits: [],
          projectEvolution: { majorChanges: [] },
          userPreferences: {}
        }
      };
    }
    
    // Add user message to conversation history
    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
      metadata: {
        sandboxId: context?.sandboxId
      }
    };
    global.conversationState.context.messages.push(userMessage);
    
    // Clean up old messages to prevent unbounded growth
    if (global.conversationState.context.messages.length > 20) {
      global.conversationState.context.messages = global.conversationState.context.messages.slice(-15);
      console.log('[generate-ai-code-stream] Trimmed conversation history to prevent context overflow');
    }
    
    // Clean up old edits
    if (global.conversationState.context.edits.length > 10) {
      global.conversationState.context.edits = global.conversationState.context.edits.slice(-8);
    }
    
    if (!prompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt is required' 
      }, { status: 400 });
    }
    
    // Create a stream for real-time updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Function to send progress updates with flushing
    const sendProgress = async (data: StreamProgressData) => {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      try {
        await writer.write(encoder.encode(message));
        if (data.type === 'stream' || data.type === 'conversation') {
          await writer.write(encoder.encode(': keepalive\n\n'));
        }
      } catch (error) {
        console.error('[generate-ai-code-stream] Error writing to stream:', error);
      }
    };
    
    // Start processing in background
    (async () => {
      try {
        await sendProgress({ type: 'status', message: 'Initializing AI...' });
        
        // Build edit context if in edit mode
        let editContext: EditContext | null = null;
        let enhancedSystemPrompt = '';
        
        if (isEdit) {
          editContext = await buildEditContext(prompt, model, context, sendProgress);
          if (editContext) {
            enhancedSystemPrompt = editContext.systemPrompt;
            await sendProgress({ 
              type: 'status', 
              message: `Identified edit type: ${editContext.editIntent?.description || 'Code modification'}`
            });
          }
        }
        
        // Build conversation context
        const conversationContext = global.conversationState && global.conversationState.context.messages.length > 1
          ? buildConversationContext(
              global.conversationState.context.messages,
              global.conversationState.context.edits,
              global.conversationState.context.projectEvolution
            )
          : '';
        
        // Get project type from sandbox state
        const projectType: ProjectTypeId = global.sandboxState?.sandboxData?.projectType || 'vite-react';
        console.log('[generate-ai-code-stream] Using project type:', projectType);
        
        // Build additional context
        let additionalContext = '';
        if (editContext?.systemPrompt) {
          additionalContext += editContext.systemPrompt;
        }
        if (conversationContext) {
          additionalContext += '\n\n' + conversationContext;
        }
        
        // Build system prompt using modular prompts
        let systemPrompt = buildSystemPrompt(projectType, isEdit, additionalContext || undefined);
        
        // Add Morph Fast Apply mode if enabled
        const morphFastApplyEnabled = Boolean(isEdit && process.env.MORPH_API_KEY);
        if (morphFastApplyEnabled) {
          systemPrompt += buildMorphPromptAddition();
        }
        
        // Build full prompt with context
        const fullPrompt = buildFullPrompt(prompt, context, isEdit, editContext, enhancedSystemPrompt, morphFastApplyEnabled);
        
        await sendProgress({ type: 'status', message: 'Planning application structure...' });
        
        console.log('\n[generate-ai-code-stream] Starting streaming response...\n');
        
        // Track packages that need to be installed
        const packagesToInstall: string[] = [];
        
        // Get provider and model
        const { provider, actualModel, isAnthropic, isGoogle, isOpenAI, isKimiGroq } = getProviderAndModel(model);
        
        console.log(`[generate-ai-code-stream] Using provider: ${isAnthropic ? 'Anthropic' : isGoogle ? 'Google' : isOpenAI ? 'OpenAI' : 'Groq'}, model: ${actualModel}`);
        console.log(`[generate-ai-code-stream] AI Gateway enabled: ${isUsingAIGateway}`);
        
        // Build streaming options
        const streamOptions = buildStreamOptions(systemPrompt, fullPrompt, provider, actualModel, model, isOpenAI);
        
        // Execute streaming with retry logic
        const result = await executeStreamWithRetry(streamOptions, model, isKimiGroq, isGoogle, isAnthropic, isOpenAI, sendProgress);
        
        // Process the stream
        const { generatedCode, componentCount } = await processStream(result, isEdit, packagesToInstall, sendProgress);
        
        console.log('\n\n[generate-ai-code-stream] Streaming complete.');
        
        // Extract packages from generated code
        if (isEdit) {
          const tagPackages = extractPackagesFromTags(generatedCode);
          tagPackages.forEach(pkg => {
            if (!packagesToInstall.includes(pkg)) {
              packagesToInstall.push(pkg);
              console.log(`[generate-ai-code-stream] Package from tags: ${pkg}`);
            }
          });
        }
        
        // Parse files
        const files = parseGeneratedFiles(generatedCode, isEdit, packagesToInstall, sendProgress);
        
        // Validate and potentially recover from truncation
        const truncationWarnings = validateGeneratedCode(generatedCode);
        const { code: truncationRecoveredCode, warnings: finalWarnings } = await handleTruncation(
          generatedCode,
          truncationWarnings,
          prompt,
          model,
          sendProgress
        );
        
        // Audit for incomplete implementations and attempt recovery
        await sendProgress({ type: 'status', message: 'Auditing code completeness...' });
        const auditConfig = {
          enabled: true,
          maxRetries: 2,
          minScoreThreshold: 70,
          criticalIssuesThreshold: 0
        };
        
        const { code: finalCode, audit: auditResult, recovered: wasRecovered } = await auditAndRecover(
          truncationRecoveredCode,
          prompt,
          model,
          sendProgress,
          auditConfig
        );
        
        // Log audit results
        if (auditResult) {
          console.log(`[generate-ai-code-stream] Audit score: ${auditResult.score}/100, Issues: ${auditResult.issues.length}`);
          if (wasRecovered) {
            console.log('[generate-ai-code-stream] Code was improved by audit recovery');
          }
        }
        
        // Extract explanation
        const explanationMatch = finalCode.match(/<explanation>([\s\S]*?)<\/explanation>/);
        const explanation = explanationMatch ? explanationMatch[1].trim() : 'Code generated successfully!';
        
        // Build audit summary for warnings
        const auditWarnings: string[] = [];
        if (auditResult && !auditResult.complete) {
          auditWarnings.push(`Code completeness: ${auditResult.score}/100`);
          const criticalCount = auditResult.issues.filter(i => i.severity === 'critical').length;
          if (criticalCount > 0) {
            auditWarnings.push(`${criticalCount} incomplete implementations detected`);
          }
        }
        
        // Combine all warnings
        const allWarnings = [...finalWarnings, ...auditWarnings];
        
        // Send completion
        await sendProgress({
          type: 'complete',
          generatedCode: finalCode,
          explanation,
          files: files.length,
          components: componentCount,
          model,
          packagesToInstall: packagesToInstall.length > 0 ? packagesToInstall : undefined,
          warnings: allWarnings.length > 0 ? allWarnings : undefined,
          auditScore: auditResult?.score,
          codeComplete: auditResult?.complete
        });
        
        // Track edit in conversation history
        if (isEdit && editContext && global.conversationState) {
          trackEditInConversation(editContext, prompt, files);
        }
        
      } catch (error) {
        console.error('[generate-ai-code-stream] Stream processing error:', error);
        
        if ((error as any).message?.includes('tool call validation failed')) {
          await sendProgress({ 
            type: 'warning', 
            message: 'Package installation tool encountered an issue. Packages will be detected from imports instead.'
          });
        } else {
          await sendProgress({ 
            type: 'error', 
            error: (error as Error).message 
          });
        }
      } finally {
        await writer.close();
      }
    })();
    
    // Return the stream with proper headers
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
        'Content-Encoding': 'none',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
    
  } catch (error) {
    console.error('[generate-ai-code-stream] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// Helper functions

async function buildEditContext(
  prompt: string,
  model: string,
  context: GenerationContext | undefined,
  sendProgress: (data: StreamProgressData) => Promise<void>
): Promise<EditContext | null> {
  console.log('[generate-ai-code-stream] Edit mode detected - starting agentic search workflow');
  console.log('[generate-ai-code-stream] Has fileCache:', !!global.sandboxState?.fileCache);
  console.log('[generate-ai-code-stream] Has manifest:', !!global.sandboxState?.fileCache?.manifest);
  
  const manifest = global.sandboxState?.fileCache?.manifest;
  
  if (manifest) {
    const fileContents = global.sandboxState.fileCache?.files || {};
    
    const editContext = await buildSurgicalEditContext(prompt, manifest, fileContents, model, sendProgress);
    if (editContext) {
      return editContext;
    }
    
    // Fall back to keyword-based selection
    return selectFilesForEdit(prompt, manifest);
  }
  
  // Try to fetch files from sandbox if we have one
  if (global.activeSandbox) {
    await sendProgress({ type: 'status', message: 'Fetching current files from sandbox...' });
    
    try {
      const filesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/get-sandbox-files`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        
        if (filesData.success && filesData.manifest) {
          console.log('[generate-ai-code-stream] Successfully fetched manifest from sandbox');
          return await buildKeywordEditContext(prompt, filesData.manifest, model, sendProgress);
        }
      }
    } catch (error) {
      console.error('[generate-ai-code-stream] Error fetching sandbox files:', error);
      await sendProgress({ 
        type: 'warning', 
        message: 'Could not analyze existing files for targeted edits. Proceeding with general edit mode.'
      });
    }
  }
  
  console.log('[generate-ai-code-stream] No active sandbox to fetch files from');
  await sendProgress({ 
    type: 'warning', 
    message: 'No existing files found. Consider generating initial code first.'
  });
  
  return null;
}

function buildMorphPromptAddition(): string {
  return `

MORPH FAST APPLY MODE (EDIT-ONLY):
- Output edits as <edit> blocks, not full <file> blocks, for files that already exist.
- Format for each edit:
  <edit target_file="src/components/Header.jsx">
    <instructions>Describe the minimal change, single sentence.</instructions>
    <update>Provide the SMALLEST code snippet necessary to perform the change.</update>
  </edit>
- Only use <file> blocks when you must CREATE a brand-new file.
- Prefer ONE edit block for a simple change; multiple edits only if absolutely needed for separate files.
- Keep updates minimal and precise; do not rewrite entire files.
`;
}

function buildFullPrompt(
  prompt: string,
  context: GenerationContext | undefined,
  isEdit: boolean,
  editContext: EditContext | null,
  enhancedSystemPrompt: string,
  morphFastApplyEnabled: boolean
): string {
  if (!context) {
    return prompt;
  }
  
  const contextParts: string[] = [];
  
  if (context.sandboxId) {
    contextParts.push(`Current sandbox ID: ${context.sandboxId}`);
  }
  
  if (context.structure) {
    contextParts.push(`Current file structure:\n${context.structure}`);
  }
  
  // Use backend file cache
  const backendFiles = global.sandboxState?.fileCache?.files || {};
  const hasBackendFiles = Object.keys(backendFiles).length > 0;
  
  if (hasBackendFiles) {
    if (editContext && editContext.primaryFiles.length > 0) {
      contextParts.push('\nEXISTING APPLICATION - TARGETED EDIT MODE');
      contextParts.push(`\n${editContext.systemPrompt || enhancedSystemPrompt}\n`);
      
      // Note: Would need to implement getFileContents here
      contextParts.push('\nIMPORTANT: Only modify the files listed under "Files to Edit".');
    } else {
      contextParts.push('\nEXISTING APPLICATION - TARGETED EDIT REQUIRED');
      contextParts.push('\n### File List:');
      for (const path of Object.keys(backendFiles)) {
        contextParts.push(`- ${path}`);
      }
    }
  }
  
  // Add edit mode indicators
  if (isEdit) {
    contextParts.push('\nEDIT MODE ACTIVE');
    contextParts.push('This is an incremental update to an existing application.');
  } else if (!hasBackendFiles) {
    contextParts.push('\n🎨 FIRST GENERATION MODE - CREATE SOMETHING BEAUTIFUL!');
  }
  
  // Add Morph mode instructions
  if (morphFastApplyEnabled) {
    contextParts.push('\nOUTPUT FORMAT (REQUIRED IN MORPH MODE):');
    contextParts.push('<edit target_file="src/components/Component.jsx">');
    contextParts.push('<instructions>Minimal, precise instruction.</instructions>');
    contextParts.push('<update>// Smallest necessary snippet</update>');
    contextParts.push('</edit>');
  }
  
  if (contextParts.length > 0) {
    return `CONTEXT:\n${contextParts.join('\n')}\n\nUSER REQUEST:\n${prompt}`;
  }
  
  return prompt;
}

function buildStreamOptions(
  systemPrompt: string,
  fullPrompt: string,
  provider: any,
  actualModel: string,
  model: string,
  isOpenAI: boolean
): any {
  const options: any = {
    model: provider(actualModel),
    messages: [
      { 
        role: 'system', 
        content: systemPrompt + `

🚨 CRITICAL CODE GENERATION RULES - VIOLATION = FAILURE 🚨:
1. NEVER truncate ANY code - ALWAYS write COMPLETE files
2. NEVER use "..." anywhere in your code - this causes syntax errors
3. NEVER cut off strings mid-sentence - COMPLETE every string
4. NEVER leave incomplete class names or attributes
5. ALWAYS close ALL tags, quotes, brackets, and parentheses
6. If you run out of space, prioritize completing the current file

REMEMBER: It's better to generate fewer COMPLETE files than many INCOMPLETE files.`
      },
      { 
        role: 'user', 
        content: fullPrompt + `

CRITICAL: You MUST complete EVERY file you start. 
If you're running out of space, generate FEWER files but make them COMPLETE.
It's better to have 3 complete files than 10 incomplete files.`
      }
    ],
    maxTokens: 8192,
    stopSequences: []
  };
  
  if (!model.startsWith('openai/gpt-5')) {
    options.temperature = 0.7;
  }
  
  if (isOpenAI) {
    options.experimental_providerMetadata = {
      openai: {
        reasoningEffort: 'high'
      }
    };
  }
  
  return options;
}

async function executeStreamWithRetry(
  streamOptions: any,
  model: string,
  isKimiGroq: boolean,
  isGoogle: boolean,
  isAnthropic: boolean,
  isOpenAI: boolean,
  sendProgress: (data: StreamProgressData) => Promise<void>
): Promise<any> {
  let result;
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount <= maxRetries) {
    try {
      result = await streamText(streamOptions);
      break;
    } catch (streamError: any) {
      console.error(`[generate-ai-code-stream] Error calling streamText (attempt ${retryCount + 1}/${maxRetries + 1}):`, streamError);
      
      const isGroqServiceError = isKimiGroq && streamError.message?.includes('Service unavailable');
      const isRetryableError = streamError.message?.includes('Service unavailable') || 
                              streamError.message?.includes('rate limit') ||
                              streamError.message?.includes('timeout');
      
      if (retryCount < maxRetries && isRetryableError) {
        retryCount++;
        console.log(`[generate-ai-code-stream] Retrying in ${retryCount * 2} seconds...`);
        
        await sendProgress({ 
          type: 'info', 
          message: `Service temporarily unavailable, retrying (attempt ${retryCount + 1}/${maxRetries + 1})...` 
        });
        
        await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
        
        if (isGroqServiceError && retryCount === maxRetries) {
          console.log('[generate-ai-code-stream] Groq service unavailable, falling back to GPT-4');
          streamOptions.model = openai('gpt-4-turbo');
        }
      } else {
        await sendProgress({ 
          type: 'error', 
          message: `Failed to initialize ${isGoogle ? 'Gemini' : isAnthropic ? 'Claude' : isOpenAI ? 'GPT-5' : isKimiGroq ? 'Kimi (Groq)' : 'Groq'} streaming: ${streamError.message}` 
        });
        
        if (isGoogle) {
          await sendProgress({ 
            type: 'info', 
            message: 'Tip: Make sure your GEMINI_API_KEY is set correctly and has proper permissions.' 
          });
        }
        
        throw streamError;
      }
    }
  }
  
  return result;
}

async function processStream(
  result: any,
  isEdit: boolean,
  packagesToInstall: string[],
  sendProgress: (data: StreamProgressData) => Promise<void>
): Promise<{ generatedCode: string; componentCount: number }> {
  let generatedCode = '';
  let currentFile = '';
  let currentFilePath = '';
  let componentCount = 0;
  let isInFile = false;
  let isInTag = false;
  let conversationalBuffer = '';
  let tagBuffer = '';
  
  for await (const textPart of result?.textStream || []) {
    const text = textPart || '';
    generatedCode += text;
    currentFile += text;
    
    const searchText = tagBuffer + text;
    process.stdout.write(text);
    
    // Check if we're entering or leaving a tag
    const hasOpenTag = /<(file|package|packages|explanation|command|structure|template)\b/.test(text);
    const hasCloseTag = /<\/(file|package|packages|explanation|command|structure|template)>/.test(text);
    
    if (hasOpenTag) {
      if (conversationalBuffer.trim() && !isInTag) {
        await sendProgress({ type: 'conversation', text: conversationalBuffer.trim() });
        conversationalBuffer = '';
      }
      isInTag = true;
    }
    
    if (hasCloseTag) {
      isInTag = false;
    }
    
    if (!isInTag && !hasOpenTag) {
      conversationalBuffer += text;
    }
    
    await sendProgress({ type: 'stream', text, raw: true });
    
    // Check for package tags in edit mode
    if (isEdit) {
      const packageRegex = /<package>([^<]+)<\/package>/g;
      let packageMatch;
      let lastIndex = 0;
      
      while ((packageMatch = packageRegex.exec(searchText)) !== null) {
        const packageName = packageMatch[1].trim();
        if (packageName && !packagesToInstall.includes(packageName)) {
          packagesToInstall.push(packageName);
          console.log(`[generate-ai-code-stream] Package detected: ${packageName}`);
          await sendProgress({ type: 'package', name: packageName, message: `Package detected: ${packageName}` });
        }
        lastIndex = packageMatch.index + packageMatch[0].length;
      }
      
      tagBuffer = searchText.substring(Math.max(0, lastIndex - 50));
    }
    
    // Check for file boundaries
    if (text.includes('<file path="')) {
      const pathMatch = text.match(/<file path="([^"]+)"/);
      if (pathMatch) {
        currentFilePath = pathMatch[1];
        isInFile = true;
        currentFile = text;
      }
    }
    
    // Check for file end
    if (isInFile && currentFile.includes('</file>')) {
      isInFile = false;
      
      if (currentFilePath.includes('components/')) {
        componentCount++;
        const componentName = currentFilePath.split('/').pop()?.replace('.jsx', '') || 'Component';
        await sendProgress({ type: 'component', name: componentName, path: currentFilePath, index: componentCount });
      } else if (currentFilePath.includes('App.jsx')) {
        await sendProgress({ type: 'app', message: 'Generated main App.jsx', path: currentFilePath });
      }
      
      currentFile = '';
      currentFilePath = '';
    }
  }
  
  // Send remaining conversational text
  if (conversationalBuffer.trim()) {
    await sendProgress({ type: 'conversation', text: conversationalBuffer.trim() });
  }
  
  return { generatedCode, componentCount };
}

function parseGeneratedFiles(
  generatedCode: string,
  isEdit: boolean,
  packagesToInstall: string[],
  sendProgress: (data: StreamProgressData) => Promise<void>
): Array<{ path: string; content: string }> {
  const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
  const files: Array<{ path: string; content: string }> = [];
  let match;
  
  while ((match = fileRegex.exec(generatedCode)) !== null) {
    const filePath = match[1];
    const content = match[2].trim();
    files.push({ path: filePath, content });
    
    // Extract packages from imports in edit mode
    if (isEdit) {
      const filePackages = extractPackagesFromCode(content);
      for (const pkg of filePackages) {
        if (!packagesToInstall.includes(pkg)) {
          packagesToInstall.push(pkg);
          console.log(`[generate-ai-code-stream] Package detected from imports: ${pkg}`);
        }
      }
    }
  }
  
  return files;
}

function trackEditInConversation(
  editContext: EditContext,
  prompt: string,
  files: Array<{ path: string; content: string }>
): void {
  if (!global.conversationState) return;
  
  const editRecord: ConversationEdit = {
    timestamp: Date.now(),
    userRequest: prompt,
    editType: editContext.editIntent.type,
    targetFiles: editContext.primaryFiles,
    confidence: editContext.editIntent.confidence,
    outcome: 'success'
  };
  
  global.conversationState.context.edits.push(editRecord);
  
  // Track major changes
  if (editContext.editIntent.type === 'ADD_FEATURE' || files.length > 3) {
    global.conversationState.context.projectEvolution.majorChanges.push({
      timestamp: Date.now(),
      description: editContext.editIntent.description,
      filesAffected: editContext.primaryFiles
    });
  }
  
  global.conversationState.lastUpdated = Date.now();
  
  console.log('[generate-ai-code-stream] Updated conversation history with edit:', editRecord);
}