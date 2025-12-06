'use client';

import { Suspense } from 'react';
import { HeaderProvider } from '@/components/shared/header/HeaderContext';

// Components
import { HeaderBar, ChatPanel, PreviewPanel } from './components';

// Hooks
import { useGenerationPage } from './hooks';

/**
 * Generation Page - Main orchestrator component
 * 
 * This is a chat-first experience where users describe what they want to build.
 * The AI can also scrape and clone websites when URLs are provided in conversation.
 */
function AISandboxPage() {
  const {
    // AI Model
    aiModel,
    setAiModel,
    
    // Chat
    chatMessages,
    aiChatInput,
    setAiChatInput,
    
    // Conversation Context
    conversationContext,
    
    // UI State
    activeTab,
    setActiveTab,
    expandedFolders,
    toggleFolder,
    selectedFile,
    setSelectedFile,
    loadingStage,
    isStartingNewGeneration,
    screenshotCollapsed,
    setScreenshotCollapsed,
    
    // Sandbox
    sandboxData,
    loading,
    createSandbox,
    iframeRef,
    refreshIframe,
    
    // Code Generation
    generationProgress,
    codeApplicationState,
    
    // Web Scraping
    urlScreenshot,
    isScreenshotLoaded,
    setIsScreenshotLoaded,
    isCapturingScreenshot,
    isPreparingDesign,
    screenshotError,
    
    // Actions
    handleSendMessage,
    reapplyLastGeneration,
    downloadZip
  } = useGenerationPage();

  return (
    <HeaderProvider>
      <div className="font-sans bg-background text-foreground h-screen flex flex-col overflow-hidden">
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

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Chat Panel */}
          <ChatPanel
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

          {/* Preview Panel */}
          <PreviewPanel
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            generationProgress={generationProgress}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            sandboxData={sandboxData}
            iframeRef={iframeRef}
            urlScreenshot={urlScreenshot}
            isScreenshotLoaded={isScreenshotLoaded}
            setIsScreenshotLoaded={setIsScreenshotLoaded}
            isCapturingScreenshot={isCapturingScreenshot}
            isPreparingDesign={isPreparingDesign}
            codeApplicationState={codeApplicationState}
            loadingStage={loadingStage}
            isStartingNewGeneration={isStartingNewGeneration}
            loading={loading}
            screenshotError={screenshotError}
            refreshIframe={refreshIframe}
          />
        </div>
      </div>
    </HeaderProvider>
  );
}

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-orange-200 dark:border-orange-900 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your workspace...</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AISandboxPage />
    </Suspense>
  );
}