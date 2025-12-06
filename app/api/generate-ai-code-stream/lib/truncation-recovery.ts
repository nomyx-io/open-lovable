import { streamText } from 'ai';
import { appConfig } from '@/config/app.config';
import { getProviderAndModel, openai, anthropic, groq } from './providers';
import type { StreamProgressData } from './types';

interface TruncationWarning {
  message: string;
  filePath?: string;
}

/**
 * Validate generated code for truncation issues
 */
export function validateGeneratedCode(generatedCode: string): string[] {
  const truncationWarnings: string[] = [];
  
  // Check for unclosed file tags
  const fileOpenCount = (generatedCode.match(/<file path="/g) || []).length;
  const fileCloseCount = (generatedCode.match(/<\/file>/g) || []).length;
  if (fileOpenCount !== fileCloseCount) {
    truncationWarnings.push(`Unclosed file tags detected: ${fileOpenCount} open, ${fileCloseCount} closed`);
  }
  
  // Check for files that seem truncated (very short or ending abruptly)
  const truncationCheckRegex = /<file path="([^"]+)">([\s\S]*?)(?:<\/file>|$)/g;
  let truncationMatch;
  while ((truncationMatch = truncationCheckRegex.exec(generatedCode)) !== null) {
    const filePath = truncationMatch[1];
    const content = truncationMatch[2];
    
    // Only check for really obvious HTML truncation - file ends with opening tag
    if (content.trim().endsWith('<') || content.trim().endsWith('</')) {
      truncationWarnings.push(`File ${filePath} appears to have incomplete HTML tags`);
    }
    
    // Only check for SEVERE truncation issues
    if (filePath.match(/\.(jsx?|tsx?)$/)) {
      // Only check for severely unmatched brackets (more than 3 difference)
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      const braceDiff = Math.abs(openBraces - closeBraces);
      if (braceDiff > 3) { // Only flag severe mismatches
        truncationWarnings.push(`File ${filePath} has severely unmatched braces (${openBraces} open, ${closeBraces} closed)`);
      }
      
      // Check if file is extremely short and looks incomplete
      if (content.length < 20 && content.includes('function') && !content.includes('}')) {
        truncationWarnings.push(`File ${filePath} appears severely truncated`);
      }
    }
  }
  
  return truncationWarnings;
}

/**
 * Identify truncated files that need to be regenerated
 */
export function identifyTruncatedFiles(generatedCode: string): string[] {
  const truncatedFiles: string[] = [];
  const fileRegex = /<file path="([^"]+)">([\s\S]*?)(?:<\/file>|$)/g;
  let match;
  
  while ((match = fileRegex.exec(generatedCode)) !== null) {
    const filePath = match[1];
    const content = match[2];
    
    // Check if this file appears truncated - be more selective
    const hasEllipsis = content.includes('...') && 
                       !content.includes('...rest') && 
                       !content.includes('...props') &&
                       !content.includes('spread');
                       
    const endsAbruptly = content.trim().endsWith('...') || 
                         content.trim().endsWith(',') ||
                         content.trim().endsWith('(');
                         
    const hasUnclosedTags = content.includes('</') && 
                            !content.match(/<\/[a-zA-Z0-9]+>/) &&
                            content.includes('<');
                            
    const tooShort = content.length < 50 && filePath.match(/\.(jsx?|tsx?)$/);
    
    // Check for unmatched braces specifically
    const openBraceCount = (content.match(/{/g) || []).length;
    const closeBraceCount = (content.match(/}/g) || []).length;
    const hasUnmatchedBraces = Math.abs(openBraceCount - closeBraceCount) > 1;
    
    const isTruncated = (hasEllipsis && endsAbruptly) || 
                       hasUnclosedTags || 
                       (tooShort && !content.includes('export')) ||
                       hasUnmatchedBraces;
    
    if (isTruncated) {
      truncatedFiles.push(filePath);
    }
  }
  
  return truncatedFiles;
}

/**
 * Attempt to recover truncated files by regenerating them
 */
export async function recoverTruncatedFiles(
  generatedCode: string,
  truncatedFiles: string[],
  prompt: string,
  model: string,
  sendProgress: (data: StreamProgressData) => Promise<void>
): Promise<string> {
  let recoveredCode = generatedCode;
  
  for (const filePath of truncatedFiles) {
    await sendProgress({
      type: 'info',
      message: `Completing ${filePath}...`
    });
    
    try {
      // Create a focused prompt to complete just this file
      const completionPrompt = `Complete the following file that was truncated. Provide the FULL file content.
      
File: ${filePath}
Original request: ${prompt}
      
Provide the complete file content without any truncation. Include all necessary imports, complete all functions, and close all tags properly.`;
      
      // Determine the correct client based on the model
      let completionClient: any;
      if (model.includes('gpt') || model.includes('openai')) {
        completionClient = openai;
      } else if (model.includes('claude')) {
        completionClient = anthropic;
      } else if (model === 'moonshotai/kimi-k2-instruct-0905') {
        completionClient = groq;
      } else {
        completionClient = groq;
      }
      
      // Determine the correct model name for the completion
      let completionModelName: string;
      if (model === 'moonshotai/kimi-k2-instruct-0905') {
        completionModelName = 'moonshotai/kimi-k2-instruct-0905';
      } else if (model.includes('openai')) {
        completionModelName = model.replace('openai/', '');
      } else if (model.includes('anthropic')) {
        completionModelName = model.replace('anthropic/', '');
      } else if (model.includes('google')) {
        completionModelName = model.replace('google/', '');
      } else {
        completionModelName = model;
      }
      
      const completionResult = await streamText({
        model: completionClient(completionModelName),
        messages: [
          { 
            role: 'system', 
            content: 'You are completing a truncated file. Provide the complete, working file content.'
          },
          { role: 'user', content: completionPrompt }
        ],
        temperature: model.startsWith('openai/gpt-5') ? undefined : appConfig.ai.defaultTemperature
      });
      
      // Get the full text from the stream
      let completedContent = '';
      for await (const chunk of completionResult.textStream) {
        completedContent += chunk;
      }
      
      // Replace the truncated file in the generatedCode
      const filePattern = new RegExp(
        `<file path="${filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">[\\s\\S]*?(?:</file>|$)`,
        'g'
      );
      
      // Extract just the code content (remove any markdown or explanation)
      let cleanContent = completedContent;
      if (cleanContent.includes('```')) {
        const codeMatch = cleanContent.match(/```[\w]*\n([\s\S]*?)```/);
        if (codeMatch) {
          cleanContent = codeMatch[1];
        }
      }
      
      recoveredCode = recoveredCode.replace(
        filePattern,
        `<file path="${filePath}">\n${cleanContent}\n</file>`
      );
      
      console.log(`[truncation-recovery] Successfully completed ${filePath}`);
      
    } catch (completionError) {
      console.error(`[truncation-recovery] Failed to complete ${filePath}:`, completionError);
      await sendProgress({
        type: 'warning',
        message: `Could not auto-complete ${filePath}. Manual review may be needed.`
      });
    }
  }
  
  return recoveredCode;
}

/**
 * Handle truncation with automatic retry (if enabled in config)
 */
export async function handleTruncation(
  generatedCode: string,
  truncationWarnings: string[],
  prompt: string,
  model: string,
  sendProgress: (data: StreamProgressData) => Promise<void>
): Promise<{ code: string; warnings: string[] }> {
  if (truncationWarnings.length === 0 || !appConfig.codeApplication.enableTruncationRecovery) {
    return { code: generatedCode, warnings: truncationWarnings };
  }
  
  console.warn('[truncation-recovery] Truncation detected, attempting to fix:', truncationWarnings);
  
  await sendProgress({
    type: 'warning',
    message: 'Detected incomplete code generation. Attempting to complete...',
    warnings: truncationWarnings
  });
  
  const truncatedFiles = identifyTruncatedFiles(generatedCode);
  
  if (truncatedFiles.length > 0) {
    console.log('[truncation-recovery] Attempting to regenerate truncated files:', truncatedFiles);
    
    const recoveredCode = await recoverTruncatedFiles(
      generatedCode,
      truncatedFiles,
      prompt,
      model,
      sendProgress
    );
    
    await sendProgress({
      type: 'info',
      message: 'Truncation recovery complete'
    });
    
    // Clear warnings after recovery
    return { code: recoveredCode, warnings: [] };
  }
  
  return { code: generatedCode, warnings: truncationWarnings };
}