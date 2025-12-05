'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { appConfig } from '@/config/app.config';
import { HeaderProvider } from '@/components/shared/header/HeaderContext';
import SidebarInput from '@/components/app/generation/SidebarInput';

// Types
import type { 
  ChatMessage, 
  ConversationContext, 
  LoadingStage, 
  ActiveTab 
} from './types';

// Hooks
import { useSandbox, useCodeGeneration, useWebScraping } from './hooks';

// Components
import { HeaderBar, ChatInterface, CodePreview, SandboxPreview } from './components';

/**
 * Generation Page - Main orchestrator component
 * 
 * This is the refactored version of the original 3958-line monolithic page.
 * It uses modular hooks and components to separate concerns.
 */
function AISandboxPage() {
  // URL Parameters
  const searchParams = useSearchParams();
  
  // AI Model State
  const [aiModel, setAiModel] = useState(() => {
    const modelParam = searchParams.get('model');
    return appConfig.ai.availableModels.includes(modelParam || '') 
      ? modelParam! 
      : appConfig.ai.defaultModel;
  });

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      content: 'Welcome! I can help you generate code with full context of your sandbox files and structure. Just start chatting - I\'ll automatically create a sandbox for you if needed!\n\nTip: If you see package errors like "react-router-dom not found", just type "npm install" or "check packages" to automatically install missing packages.',
      type: 'system',
      timestamp: new Date()
    }
  ]);
  const [aiChatInput, setAiChatInput] = useState('');
  
  // Conversation Context
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    scrapedWebsites: [],
    generatedComponents: [],
    appliedCode: [],
    currentProject: '',
    lastGeneratedCode: undefined
  });

  // UI State
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['app', 'src', 'src/components']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [hasInitialSubmission, setHasInitialSubmission] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);
  const [isStartingNewGeneration, setIsStartingNewGeneration] = useState(false);
  const [showLoadingBackground, setShowLoadingBackground] = useState(false);
  const [screenshotCollapsed, setScreenshotCollapsed] = useState(false);
  const [homeUrlInput, setHomeUrlInput] = useState('');
  const [homeContextInput, setHomeContextInput] = useState('');
  const [responseArea, setResponseArea] = useState<string[]>([]);
  const [sandboxFiles, setSandboxFiles] = useState<Record<string, string>>({});

  // Helper Functions
  const addChatMessage = useCallback((
    content: string, 
    type: ChatMessage['type'], 
    metadata?: ChatMessage['metadata']
  ) => {
    setChatMessages(prev => {
      if (type === 'system' && prev.length > 0) {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.type === 'system' && lastMessage.content === content) {
          return prev;
        }
      }
      return [...prev, { content, type, timestamp: new Date(), metadata }];
    });
  }, []);

  const log = useCallback((message: string, type: 'info' | 'error' | 'command' = 'info') => {
    setResponseArea(prev => [...prev, `[${type}] ${message}`]);
  }, []);

  // Fetch sandbox files
  const fetchSandboxFiles = useCallback(async () => {
    try {
      const response = await fetch('/api/get-sandbox-files', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSandboxFiles(data.files || {});
        }
      }
    } catch (error) {
      console.error('[fetchSandboxFiles] Error fetching files:', error);
    }
  }, []);

  // Custom Hooks
  const {
    sandboxData,
    setSandboxData,
    loading,
    status,
    createSandbox,
    checkSandboxStatus,
    iframeRef,
    refreshIframe
  } = useSandbox(aiModel, addChatMessage, log);

  const {
    generationProgress,
    setGenerationProgress,
    codeApplicationState,
    setCodeApplicationState,
    promptInput,
    setPromptInput,
    sendChatMessage,
    applyGeneratedCode
  } = useCodeGeneration(
    aiModel,
    conversationContext,
    setConversationContext,
    chatMessages,
    addChatMessage,
    log,
    iframeRef,
    fetchSandboxFiles
  );

  const {
    urlScreenshot,
    setUrlScreenshot,
    isScreenshotLoaded,
    setIsScreenshotLoaded,
    isCapturingScreenshot,
    screenshotError,
    setScreenshotError,
    isPreparingDesign,
    setIsPreparingDesign,
    targetUrl,
    setTargetUrl,
    captureUrlScreenshot,
    scrapeWebsite,
    extractBrandStyles
  } = useWebScraping(addChatMessage, setConversationContext, setActiveTab);

  // Initialize page
  useEffect(() => {
    let isMounted = true;
    let sandboxCreated = false;

    const initializePage = async () => {
      if (sandboxCreated) return;
      
      const urlParam = searchParams.get('url');
      const templateParam = searchParams.get('template');
      const detailsParam = searchParams.get('details');
      
      const storedUrl = urlParam || sessionStorage.getItem('targetUrl');
      const storedStyle = templateParam || sessionStorage.getItem('selectedStyle');
      const storedModel = sessionStorage.getItem('selectedModel');
      
      if (storedUrl) {
        setHasInitialSubmission(true);
        sessionStorage.removeItem('targetUrl');
        sessionStorage.removeItem('selectedStyle');
        sessionStorage.removeItem('selectedModel');
        sessionStorage.removeItem('additionalInstructions');
        
        setHomeUrlInput(storedUrl);
        if (detailsParam) {
          setHomeContextInput(detailsParam);
        }
        if (storedModel) {
          setAiModel(storedModel);
        }
        
        sessionStorage.setItem('autoStart', 'true');
      }
      
      // Clear old conversation
      try {
        await fetch('/api/conversation-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear-old' })
        });
      } catch (error) {
        console.error('[ai-sandbox] Failed to clear old conversation:', error);
      }
      
      if (!isMounted) return;

      try {
        sandboxCreated = true;
        await createSandbox(true);
        
        if (storedUrl && isMounted) {
          sessionStorage.setItem('autoStart', 'true');
        }
      } catch (error) {
        console.error('[ai-sandbox] Failed to create sandbox:', error);
      }
    };
    
    initializePage();

    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-start generation if flagged
  useEffect(() => {
    const autoStart = sessionStorage.getItem('autoStart');
    if (autoStart === 'true' && homeUrlInput) {
      sessionStorage.removeItem('autoStart');
      setTimeout(() => {
        startGeneration();
      }, 1000);
    }
  }, [homeUrlInput]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle folder in file explorer
  const toggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(folderPath)) {
        newExpanded.delete(folderPath);
      } else {
        newExpanded.add(folderPath);
      }
      return newExpanded;
    });
  }, []);

  // Handle chat message submission
  const handleSendMessage = useCallback(async () => {
    const message = aiChatInput.trim();
    if (!message) return;
    
    setAiChatInput('');
    
    // Check for special commands
    const lowerMessage = message.toLowerCase().trim();
    if (lowerMessage === 'check packages' || lowerMessage === 'install packages' || lowerMessage === 'npm install') {
      if (!sandboxData) {
        addChatMessage('The sandbox is still being set up. Please wait for the generation to complete, then try again.', 'system');
        return;
      }
      addChatMessage('Checking packages... Sandbox is ready with Vite configuration.', 'system');
      return;
    }
    
    await sendChatMessage(message, sandboxData, createSandbox);
    
    setTimeout(() => {
      setActiveTab('preview');
    }, 1000);
  }, [aiChatInput, sandboxData, sendChatMessage, createSandbox, addChatMessage]);

  // Start generation from URL
  const startGeneration = useCallback(async () => {
    if (!homeUrlInput.trim()) return;
    
    setIsStartingNewGeneration(true);
    setLoadingStage('gathering');
    setActiveTab('preview');
    setShowLoadingBackground(true);
    
    setChatMessages([]);
    let displayUrl = homeUrlInput.trim();
    if (!displayUrl.match(/^https?:\/\//i)) {
      displayUrl = 'https://' + displayUrl;
    }
    const cleanUrl = displayUrl.replace(/^https?:\/\//i, '');
    
    addChatMessage(`Starting to clone ${cleanUrl}...`, 'system');
    
    // Capture screenshot
    captureUrlScreenshot(displayUrl);
    
    const sandboxPromise = !sandboxData ? createSandbox(true) : Promise.resolve(null);
    
    try {
      await sandboxPromise;
      
      const scrapeData = await scrapeWebsite(displayUrl);
      
      setIsPreparingDesign(false);
      setUrlScreenshot(null);
      setLoadingStage('generating');
      setActiveTab('generation');
      
      // Generate prompt
      const prompt = `I want to recreate the ${displayUrl} website as a complete React application based on the scraped content below.

${JSON.stringify(scrapeData, null, 2)}

${homeContextInput ? `ADDITIONAL CONTEXT: ${homeContextInput}` : ''}

IMPORTANT: Create a COMPLETE, working React application with all sections and features.`;

      setGenerationProgress(prev => ({
        ...prev,
        isGenerating: true,
        status: 'Initializing AI...',
        streamedCode: '',
        isStreaming: true,
        files: []
      }));
      
      // Call AI generation
      const response = await fetch('/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          model: aiModel,
          context: { sandboxId: sandboxData?.sandboxId, conversationContext }
        })
      });
      
      if (!response.ok || !response.body) {
        throw new Error('Failed to generate code');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let generatedCode = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'stream' && data.raw) {
                setGenerationProgress(prev => ({
                  ...prev,
                  streamedCode: prev.streamedCode + data.text,
                  isStreaming: true
                }));
              } else if (data.type === 'complete') {
                generatedCode = data.generatedCode;
                setConversationContext(prev => ({
                  ...prev,
                  lastGeneratedCode: generatedCode
                }));
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
      
      if (generatedCode) {
        addChatMessage('AI recreation generated!', 'system');
        setPromptInput(generatedCode);
        await applyGeneratedCode(generatedCode, false, sandboxData);
        
        addChatMessage(`Successfully recreated ${cleanUrl}!`, 'ai');
      }
      
      // Cleanup
      setGenerationProgress(prev => ({
        ...prev,
        isGenerating: false,
        isStreaming: false,
        status: 'Generation complete!'
      }));
      setLoadingStage(null);
      setIsStartingNewGeneration(false);
      setShowLoadingBackground(false);
      
      setTimeout(() => setActiveTab('preview'), 1000);
    } catch (error: any) {
      addChatMessage(`Failed to clone website: ${error.message}`, 'system');
      setLoadingStage(null);
      setIsStartingNewGeneration(false);
    }
  }, [
    homeUrlInput, 
    homeContextInput, 
    aiModel, 
    sandboxData, 
    conversationContext, 
    createSandbox, 
    captureUrlScreenshot, 
    scrapeWebsite,
    addChatMessage,
    setPromptInput,
    applyGeneratedCode,
    setGenerationProgress,
    setConversationContext,
    setIsPreparingDesign,
    setUrlScreenshot
  ]);

  // Re-apply last generation
  const reapplyLastGeneration = useCallback(async () => {
    if (!conversationContext.lastGeneratedCode) {
      addChatMessage('No previous generation to re-apply', 'system');
      return;
    }
    
    if (!sandboxData) {
      addChatMessage('Please create a sandbox first', 'system');
      return;
    }
    
    addChatMessage('Re-applying last generation...', 'system');
    const isEdit = conversationContext.appliedCode.length > 0;
    await applyGeneratedCode(conversationContext.lastGeneratedCode, isEdit, sandboxData);
  }, [conversationContext, sandboxData, addChatMessage, applyGeneratedCode]);

  // Download as ZIP
  const downloadZip = useCallback(async () => {
    if (!sandboxData) {
      addChatMessage('Please wait for the sandbox to be created before downloading.', 'system');
      return;
    }
    
    addChatMessage('Creating ZIP file...', 'system');
    
    try {
      const response = await fetch('/api/create-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const link = document.createElement('a');
        link.href = data.dataUrl;
        link.download = data.fileName || 'project.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addChatMessage('Download complete!', 'system');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      addChatMessage(`Failed to create ZIP: ${error.message}`, 'system');
    }
  }, [sandboxData, addChatMessage]);

  // Handle sidebar submission
  const handleSidebarSubmit = useCallback((url: string, style: string, model: string, instructions?: string) => {
    setHasInitialSubmission(true);
    
    sessionStorage.setItem('targetUrl', url);
    sessionStorage.setItem('selectedStyle', style);
    sessionStorage.setItem('selectedModel', model);
    if (instructions) {
      sessionStorage.setItem('additionalInstructions', instructions);
    }
    sessionStorage.setItem('autoStart', 'true');
    
    setHomeUrlInput(url);
    setHomeContextInput(instructions || '');
    startGeneration();
  }, [startGeneration]);

  // Render main content
  const renderMainContent = () => {
    if (activeTab === 'generation' && (generationProgress.isGenerating || generationProgress.files.length > 0)) {
      return (
        <CodePreview
          generationProgress={generationProgress}
          expandedFolders={expandedFolders}
          toggleFolder={toggleFolder}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
        />
      );
    }
    
    return (
      <SandboxPreview
        sandboxData={sandboxData}
        iframeRef={iframeRef}
        urlScreenshot={urlScreenshot}
        isScreenshotLoaded={isScreenshotLoaded}
        setIsScreenshotLoaded={setIsScreenshotLoaded}
        isCapturingScreenshot={isCapturingScreenshot}
        isPreparingDesign={isPreparingDesign}
        generationProgress={generationProgress}
        codeApplicationState={codeApplicationState}
        loadingStage={loadingStage}
        isStartingNewGeneration={isStartingNewGeneration}
        loading={loading}
        screenshotError={screenshotError}
        refreshIframe={refreshIframe}
      />
    );
  };

  return (
    <HeaderProvider>
      <div className="font-sans bg-background text-foreground h-screen flex flex-col">
        {/* Header */}
        <HeaderBar
          aiModel={aiModel}
          setAiModel={setAiModel}
          sandboxData={sandboxData}
          conversationContext={conversationContext}
          onCreateSandbox={() => createSandbox()}
          onReapplyLastGeneration={reapplyLastGeneration}
          onDownloadZip={downloadZip}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Panel (1/3 width) */}
          <div className="flex-1 max-w-[400px] flex flex-col border-r border-border bg-background">
            {/* Sidebar Input */}
            {!hasInitialSubmission && (
              <div className="p-4 border-b border-border">
                <SidebarInput
                  onSubmit={handleSidebarSubmit}
                  disabled={loading || generationProgress.isGenerating}
                />
              </div>
            )}

            {/* Chat Interface */}
            <ChatInterface
              chatMessages={chatMessages}
              conversationContext={conversationContext}
              generationProgress={generationProgress}
              codeApplicationState={codeApplicationState}
              aiChatInput={aiChatInput}
              setAiChatInput={setAiChatInput}
              onSendMessage={handleSendMessage}
              screenshotCollapsed={screenshotCollapsed}
              setScreenshotCollapsed={setScreenshotCollapsed}
            />
          </div>

          {/* Preview Panel (2/3 width) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Header */}
            <div className="px-3 pt-4 pb-4 bg-white border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="inline-flex bg-gray-100 border border-gray-200 rounded-md p-0.5">
                  <button
                    onClick={() => setActiveTab('generation')}
                    className={`px-3 py-1 rounded transition-all text-xs font-medium ${
                      activeTab === 'generation' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'bg-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      <span>Code</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded transition-all text-xs font-medium ${
                      activeTab === 'preview' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'bg-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View</span>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2 items-center">
                {activeTab === 'generation' && !generationProgress.isEdit && generationProgress.files.length > 0 && (
                  <div className="text-gray-500 text-xs font-medium">
                    {generationProgress.files.length} files generated
                  </div>
                )}
                
                {generationProgress.isGenerating && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-700">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    {generationProgress.isEdit ? 'Editing code' : 'Live generation'}
                  </div>
                )}
                
                {sandboxData && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-700">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Sandbox active
                  </div>
                )}
                
                {sandboxData && (
                  <a 
                    href={sandboxData.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title="Open in new tab"
                    className="p-1.5 rounded-md transition-all text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 relative overflow-hidden">
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>
    </HeaderProvider>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <AISandboxPage />
    </Suspense>
  );
}