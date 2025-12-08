'use client';

import { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { HeaderProvider } from '@/components/shared/header/HeaderContext';
import { ResizableSplitter } from '@/components/shared/ResizableSplitter';

// Components
import { HeaderBar, ChatPanel, PreviewPanel } from './components';

// Hooks
import { useGenerationPage } from './hooks';

// Animated gradient orb component
function GradientOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        opacity: [0.3, 0.5, 0.3],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}

// Mesh gradient background
function MeshGradientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-orange-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800" />
      
      {/* Animated gradient orbs */}
      <GradientOrb
        className="top-[-10%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-orange-300/40 to-red-200/30 dark:from-orange-900/30 dark:to-red-900/20"
        delay={0}
      />
      <GradientOrb
        className="bottom-[-5%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-tl from-blue-300/30 to-purple-200/20 dark:from-blue-900/25 dark:to-purple-900/15"
        delay={2}
      />
      <GradientOrb
        className="top-[40%] right-[20%] w-[400px] h-[400px] bg-gradient-to-bl from-pink-200/25 to-orange-100/20 dark:from-pink-900/15 dark:to-orange-900/10"
        delay={4}
      />
      <GradientOrb
        className="top-[20%] left-[30%] w-[350px] h-[350px] bg-gradient-to-tr from-cyan-200/20 to-blue-100/15 dark:from-cyan-900/10 dark:to-blue-900/10"
        delay={6}
      />
      
      {/* Mesh overlay pattern */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Gradient line accents */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-orange-300/20 to-transparent dark:via-orange-600/10" />
      <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-300/15 to-transparent dark:via-purple-600/10" />
      <div className="absolute top-0 left-2/3 w-px h-full bg-gradient-to-b from-transparent via-blue-300/10 to-transparent dark:via-blue-600/10" />
      
      {/* Horizontal gradient accent */}
      <div className="absolute left-0 top-1/3 h-px w-full bg-gradient-to-r from-transparent via-orange-200/20 to-transparent dark:via-orange-700/10" />
      
      {/* Noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}

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
    downloadZip,
    
    // Error handling
    onErrorDetected,
    onErrorCleared,
    currentError,
    isAutoFixing
  } = useGenerationPage();

  return (
    <HeaderProvider>
      <div className="font-sans text-foreground h-screen flex flex-col overflow-hidden relative">
        {/* Gorgeous Gradient Background */}
        <MeshGradientBackground />
        
        {/* Content Layer */}
        <div className="relative z-10 flex flex-col h-full">
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

        <ResizableSplitter
          initialLeftWidth={640}
          minLeftWidth={400}
          maxLeftWidth={900}
          storageKey="generation-panel-width"
          className="flex-1"
        >
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
            iframeRef={iframeRef}
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
            onErrorDetected={onErrorDetected}
            onErrorCleared={onErrorCleared}
            currentError={currentError}
            isAutoFixing={isAutoFixing}
          />
        </ResizableSplitter>
        </div>
      </div>
    </HeaderProvider>
  );
}

/**
 * Loading fallback component with gradient background
 */
function LoadingFallback() {
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-orange-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800" />
      
      {/* Animated orbs */}
      <motion.div
        className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-orange-300/40 to-red-200/30 dark:from-orange-900/30 dark:to-red-900/20 blur-3xl"
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-blue-300/30 to-purple-200/20 dark:from-blue-900/25 dark:to-purple-900/15 blur-3xl"
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      
      {/* Loading content */}
      <div className="relative z-10 text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* Outer glow */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/30 to-red-500/30 blur-xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Spinner rings */}
          <div className="absolute inset-0 border-4 border-orange-200/50 dark:border-orange-900/50 rounded-full" />
          <motion.div
            className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 border-4 border-transparent border-b-red-400 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.p
          className="text-gray-600 dark:text-gray-400 font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Loading your workspace...
        </motion.p>
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