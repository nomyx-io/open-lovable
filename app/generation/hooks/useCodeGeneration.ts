'use client';

import { useState, useCallback, useRef } from 'react';
import { appConfig } from '@/config/app.config';
import type { 
  GenerationProgress, 
  GeneratedFile, 
  ConversationContext, 
  SandboxData,
  CodeApplicationState,
  ChatMessage
} from '../types';

interface UseCodeGenerationReturn {
  generationProgress: GenerationProgress;
  setGenerationProgress: React.Dispatch<React.SetStateAction<GenerationProgress>>;
  codeApplicationState: CodeApplicationState;
  setCodeApplicationState: React.Dispatch<React.SetStateAction<CodeApplicationState>>;
  promptInput: string;
  setPromptInput: React.Dispatch<React.SetStateAction<string>>;
  sendChatMessage: (message: string, sandboxData: SandboxData | null, createSandbox: () => Promise<SandboxData | null>) => Promise<void>;
  applyGeneratedCode: (code: string, isEdit: boolean, sandboxData: SandboxData | null, overrideSandboxData?: SandboxData) => Promise<void>;
}

const initialGenerationProgress: GenerationProgress = {
  isGenerating: false,
  status: '',
  components: [],
  currentComponent: 0,
  streamedCode: '',
  isStreaming: false,
  isThinking: false,
  files: [],
  lastProcessedPosition: 0
};

export function useCodeGeneration(
  aiModel: string,
  conversationContext: ConversationContext,
  setConversationContext: React.Dispatch<React.SetStateAction<ConversationContext>>,
  chatMessages: ChatMessage[],
  addChatMessage: (content: string, type: ChatMessage['type'], metadata?: ChatMessage['metadata']) => void,
  log: (message: string, type?: 'info' | 'error' | 'command') => void,
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  fetchSandboxFiles: () => Promise<void>
): UseCodeGenerationReturn {
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>(initialGenerationProgress);
  const [codeApplicationState, setCodeApplicationState] = useState<CodeApplicationState>({ stage: null });
  const [promptInput, setPromptInput] = useState('');
  
  const codeDisplayRef = useRef<HTMLDivElement>(null);

  const parseFileType = (filePath: string): GeneratedFile['type'] => {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    if (ext === 'jsx' || ext === 'js') return 'javascript';
    if (ext === 'css') return 'css';
    if (ext === 'json') return 'json';
    if (ext === 'html') return 'html';
    return 'text';
  };

  const applyGeneratedCode = useCallback(async (
    code: string, 
    isEdit: boolean = false, 
    sandboxData: SandboxData | null,
    overrideSandboxData?: SandboxData
  ) => {
    log('Applying AI-generated code...');
    
    try {
      setCodeApplicationState({ stage: 'analyzing' });
      
      // Get pending packages from tool calls
      const pendingPackages = ((window as any).pendingPackages || []).filter((pkg: any) => pkg && typeof pkg === 'string');
      if (pendingPackages.length > 0) {
        console.log('[applyGeneratedCode] Sending packages from tool calls:', pendingPackages);
        (window as any).pendingPackages = [];
      }
      
      const effectiveSandboxData = overrideSandboxData || sandboxData;
      const response = await fetch('/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          response: code,
          isEdit: isEdit,
          packages: pendingPackages,
          sandboxId: effectiveSandboxData?.sandboxId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to apply code: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let finalData: any = null;
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'start':
                  setCodeApplicationState({ stage: 'analyzing' });
                  break;
                  
                case 'step':
                  if (data.message.includes('Installing') && data.packages) {
                    setCodeApplicationState({ stage: 'installing', packages: data.packages });
                  } else if (data.message.includes('Creating files') || data.message.includes('Applying')) {
                    setCodeApplicationState({ stage: 'applying', filesGenerated: [] });
                  } else if (data.message.includes('browser tests')) {
                    addChatMessage('Running browser tests...', 'system');
                  }
                  break;
                  
                case 'package-progress':
                  if (data.installedPackages) {
                    setCodeApplicationState(prev => ({ ...prev, installedPackages: data.installedPackages }));
                  }
                  break;
                  
                case 'command':
                  if (data.command && !data.command.includes('npm install')) {
                    addChatMessage(data.command, 'command', { commandType: 'input' });
                  }
                  break;
                  
                case 'success':
                  if (data.installedPackages) {
                    setCodeApplicationState(prev => ({ ...prev, installedPackages: data.installedPackages }));
                  }
                  break;
                  
                case 'browser-tests':
                  // Browser test results
                  if (data.tests && data.tests.length > 0) {
                    const passed = data.tests.filter((t: any) => t.success).length;
                    const failed = data.tests.filter((t: any) => !t.success).length;
                    let message = `Browser tests: ${passed} passed`;
                    if (failed > 0) {
                      message += `, ${failed} failed`;
                    }
                    addChatMessage(message, 'system');
                    
                    // Report failures
                    for (const test of data.tests) {
                      if (!test.success) {
                        addChatMessage(`Test "${test.action}" failed: ${test.error}`, 'error');
                      }
                    }
                  }
                  break;
                  
                case 'browser-console-errors':
                  // Console errors from browser tests
                  if (data.errors && data.errors.length > 0) {
                    addChatMessage(`Console errors detected during testing:\n${data.errors.join('\n')}`, 'error');
                  }
                  break;
                  
                case 'complete':
                  finalData = data;
                  setCodeApplicationState({ stage: 'complete' });
                  setTimeout(() => setCodeApplicationState({ stage: null }), 3000);
                  break;
                  
                case 'error':
                  addChatMessage(`Error: ${data.message || data.error || 'Unknown error'}`, 'system');
                  break;
                  
                case 'warning':
                  addChatMessage(`${data.message}`, 'system');
                  break;
                  
                case 'info':
                  if (data.message) {
                    addChatMessage(data.message, 'system');
                  }
                  break;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
      
      // Process final data
      if (finalData?.type === 'complete') {
        const { results } = finalData;
        
        if (results?.packagesInstalled?.length > 0) {
          log(`Packages installed: ${results.packagesInstalled.join(', ')}`);
        }
        
        if (results?.filesCreated?.length > 0) {
          log('Files created:');
          results.filesCreated.forEach((file: string) => log(`  ${file}`, 'command'));
          
          setConversationContext(prev => ({
            ...prev,
            appliedCode: [...prev.appliedCode, {
              files: results.filesCreated,
              timestamp: new Date()
            }]
          }));
          
          if (isEdit) {
            addChatMessage(`Edit applied successfully!`, 'system');
          } else {
            addChatMessage(`Applied ${results.filesCreated.length} files successfully!`, 'system', {
              appliedFiles: results.filesCreated
            });
          }
          
          await fetchSandboxFiles();
          
          // Refresh iframe after applying code
          const packagesInstalled = results?.packagesInstalled?.length > 0;
          const refreshDelay = packagesInstalled 
            ? appConfig.codeApplication.packageInstallRefreshDelay 
            : appConfig.codeApplication.defaultRefreshDelay;
          
          setTimeout(() => {
            if (iframeRef.current && effectiveSandboxData?.url) {
              const urlWithTimestamp = `${effectiveSandboxData.url}?t=${Date.now()}&force=true`;
              iframeRef.current.src = urlWithTimestamp;
            }
          }, refreshDelay);
        }
        
        log('Code applied successfully!');
      }
    } catch (error: any) {
      log(`Failed to apply code: ${error.message}`, 'error');
    } finally {
      setGenerationProgress(prev => ({ ...prev, isEdit: false }));
    }
  }, [log, addChatMessage, setConversationContext, fetchSandboxFiles, iframeRef]);

  const sendChatMessage = useCallback(async (
    message: string,
    sandboxData: SandboxData | null,
    createSandbox: () => Promise<SandboxData | null>
  ) => {
    if (!message.trim()) return;
    
    addChatMessage(message, 'user');
    
    // Start sandbox creation in parallel if needed
    let sandboxPromise: Promise<SandboxData | null> | null = null;
    let sandboxCreating = false;
    
    if (!sandboxData) {
      sandboxCreating = true;
      addChatMessage('Creating sandbox while I plan your app...', 'system');
      sandboxPromise = createSandbox().catch((error: any) => {
        addChatMessage(`Failed to create sandbox: ${error.message}`, 'system');
        throw error;
      });
    }
    
    const isEdit = conversationContext.appliedCode.length > 0;
    
    try {
      setGenerationProgress(prev => ({
        ...prev,
        isGenerating: true,
        status: 'Starting AI generation...',
        components: [],
        currentComponent: 0,
        streamedCode: '',
        isStreaming: false,
        isThinking: true,
        thinkingText: 'Analyzing your request...',
        thinkingDuration: undefined,
        currentFile: undefined,
        lastProcessedPosition: 0,
        isEdit: isEdit,
        files: prev.files
      }));
      
      const fullContext = {
        sandboxId: sandboxData?.sandboxId || (sandboxCreating ? 'pending' : null),
        recentMessages: chatMessages.slice(-20),
        conversationContext: conversationContext,
        currentCode: promptInput,
        sandboxUrl: sandboxData?.url,
        sandboxCreating: sandboxCreating
      };
      
      const response = await fetch('/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          model: aiModel,
          context: fullContext,
          isEdit: isEdit
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedCode = '';
      let explanation = '';
      let buffer = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'status') {
                  setGenerationProgress(prev => ({ ...prev, status: data.message }));
                } else if (data.type === 'thinking') {
                  setGenerationProgress(prev => ({ 
                    ...prev, 
                    isThinking: true,
                    thinkingText: (prev.thinkingText || '') + data.text
                  }));
                } else if (data.type === 'thinking_complete') {
                  setGenerationProgress(prev => ({ 
                    ...prev, 
                    isThinking: false,
                    thinkingDuration: data.duration
                  }));
                } else if (data.type === 'conversation') {
                  let text = data.text || '';
                  text = text.replace(/<package>[^<]*<\/package>/g, '');
                  text = text.replace(/<packages>[^<]*<\/packages>/g, '');
                  
                  if (!text.includes('<file') && !text.includes('import React') && 
                      !text.includes('export default') && !text.includes('className=') &&
                      text.trim().length > 0) {
                    addChatMessage(text.trim(), 'ai');
                  }
                } else if (data.type === 'stream' && data.raw) {
                  setGenerationProgress(prev => {
                    const newStreamedCode = prev.streamedCode + data.text;
                    
                    const updatedState = { 
                      ...prev, 
                      streamedCode: newStreamedCode,
                      isStreaming: true,
                      isThinking: false,
                      status: 'Generating code...'
                    };
                    
                    // Process complete files from the accumulated stream
                    const fileRegex = /<file path="([^"]+)">([^]*?)<\/file>/g;
                    let match;
                    const processedFiles = new Set(prev.files.map(f => f.path));
                    
                    while ((match = fileRegex.exec(newStreamedCode)) !== null) {
                      const filePath = match[1];
                      const fileContent = match[2];
                      
                      if (!processedFiles.has(filePath)) {
                        const fileType = parseFileType(filePath);
                        const existingFileIndex = updatedState.files.findIndex(f => f.path === filePath);
                        
                        if (existingFileIndex >= 0) {
                          updatedState.files = [
                            ...updatedState.files.slice(0, existingFileIndex),
                            { ...updatedState.files[existingFileIndex], content: fileContent.trim(), type: fileType, completed: true, edited: true },
                            ...updatedState.files.slice(existingFileIndex + 1)
                          ];
                        } else {
                          updatedState.files = [...updatedState.files, {
                            path: filePath,
                            content: fileContent.trim(),
                            type: fileType,
                            completed: true,
                            edited: false
                          }];
                        }
                        
                        if (!prev.isEdit) {
                          updatedState.status = `Completed ${filePath}`;
                        }
                        processedFiles.add(filePath);
                      }
                    }
                    
                    // Check for current file being generated
                    const lastFileMatch = newStreamedCode.match(/<file path="([^"]+)">([^]*?)$/);
                    if (lastFileMatch && !lastFileMatch[0].includes('</file>')) {
                      const filePath = lastFileMatch[1];
                      const partialContent = lastFileMatch[2];
                      
                      if (!processedFiles.has(filePath)) {
                        const fileType = parseFileType(filePath);
                        updatedState.currentFile = { path: filePath, content: partialContent, type: fileType, completed: false };
                        if (!prev.isEdit) {
                          updatedState.status = `Generating ${filePath}`;
                        }
                      }
                    } else {
                      updatedState.currentFile = undefined;
                    }
                    
                    return updatedState;
                  });
                } else if (data.type === 'complete') {
                  generatedCode = data.generatedCode;
                  explanation = data.explanation;
                  
                  setConversationContext(prev => ({
                    ...prev,
                    lastGeneratedCode: generatedCode
                  }));
                  
                  setGenerationProgress(prev => ({
                    ...prev,
                    isThinking: false,
                    thinkingText: undefined,
                    thinkingDuration: undefined
                  }));
                  
                  if (data.packagesToInstall?.length > 0) {
                    (window as any).pendingPackages = data.packagesToInstall;
                  }
                  
                  setGenerationProgress(prev => ({
                    ...prev,
                    status: `Generated ${prev.files.length} file${prev.files.length !== 1 ? 's' : ''}!`,
                    isGenerating: false,
                    isStreaming: false,
                    isEdit: prev.isEdit
                  }));
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }
      
      if (generatedCode) {
        const fileRegex = /<file path="([^"]+)">([^]*?)<\/file>/g;
        const generatedFiles = [];
        let match;
        while ((match = fileRegex.exec(generatedCode)) !== null) {
          generatedFiles.push(match[1]);
        }
        
        if (isEdit && generatedFiles.length > 0) {
          const editedFileNames = generatedFiles.map(f => f.split('/').pop()).join(', ');
          addChatMessage(explanation || `Updated ${editedFileNames}`, 'ai', { appliedFiles: [generatedFiles[0]] });
        } else {
          addChatMessage(explanation || 'Code generated!', 'ai', { appliedFiles: generatedFiles });
        }
        
        setPromptInput(generatedCode);
        
        // Wait for sandbox creation if still in progress
        let activeSandboxData = sandboxData;
        if (sandboxPromise) {
          addChatMessage('Waiting for sandbox to be ready...', 'system');
          try {
            const newSandboxData = await sandboxPromise;
            if (newSandboxData != null) {
              activeSandboxData = newSandboxData;
            }
          } catch {
            addChatMessage('Sandbox creation failed. Cannot apply code.', 'system');
            return;
          }
        }
        
        if (activeSandboxData && generatedCode) {
          if (sandboxCreating) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          await applyGeneratedCode(generatedCode, isEdit, activeSandboxData);
        }
      }
      
      setGenerationProgress(prev => ({
        ...prev,
        isGenerating: false,
        isStreaming: false,
        status: 'Generation complete!',
        isThinking: false,
        thinkingText: undefined,
        thinkingDuration: undefined
      }));
      
    } catch (error: any) {
      addChatMessage(`Error: ${error.message}`, 'system');
      setGenerationProgress(initialGenerationProgress);
    }
  }, [aiModel, conversationContext, chatMessages, promptInput, addChatMessage, setConversationContext, applyGeneratedCode]);

  return {
    generationProgress,
    setGenerationProgress,
    codeApplicationState,
    setCodeApplicationState,
    promptInput,
    setPromptInput,
    sendChatMessage,
    applyGeneratedCode
  };
}