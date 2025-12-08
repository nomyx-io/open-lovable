'use client';

import { useState } from 'react';
import { CodePreview } from './CodePreview';
import { SandboxPreview } from './SandboxPreview';
import { BrowserTestPanel } from '@/components/browser';
import type { ActiveTab, GenerationProgress, CodeApplicationState, LoadingStage } from '../types';
import type { SandboxError } from '@/components/HMRErrorDetector';

interface PreviewPanelProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  generationProgress: GenerationProgress;
  expandedFolders: Set<string>;
  toggleFolder: (folderPath: string) => void;
  selectedFile: string | null;
  setSelectedFile: (file: string | null) => void;
  sandboxData: any;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  urlScreenshot: string | null;
  isScreenshotLoaded: boolean;
  setIsScreenshotLoaded: (value: boolean) => void;
  isCapturingScreenshot: boolean;
  isPreparingDesign: boolean;
  codeApplicationState: CodeApplicationState;
  loadingStage: LoadingStage;
  isStartingNewGeneration: boolean;
  loading: boolean;
  screenshotError: string | null;
  refreshIframe: () => void;
  // Error handling props
  onErrorDetected?: (errors: SandboxError[]) => void;
  onErrorCleared?: () => void;
  currentError?: SandboxError | null;
  isAutoFixing?: boolean;
}

export function PreviewPanel({
  activeTab,
  setActiveTab,
  generationProgress,
  expandedFolders,
  toggleFolder,
  selectedFile,
  setSelectedFile,
  sandboxData,
  iframeRef,
  urlScreenshot,
  isScreenshotLoaded,
  setIsScreenshotLoaded,
  isCapturingScreenshot,
  isPreparingDesign,
  codeApplicationState,
  loadingStage,
  isStartingNewGeneration,
  loading,
  screenshotError,
  refreshIframe,
  onErrorDetected,
  onErrorCleared,
  currentError,
  isAutoFixing
}: PreviewPanelProps) {
  const [showBrowserTest, setShowBrowserTest] = useState(false);
  
  // Render main content based on active tab
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
    
    if (activeTab === 'browser') {
      return (
        <BrowserTestPanel
          sandboxUrl={sandboxData?.url}
          onClose={() => setActiveTab('preview')}
          className="h-full"
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
        onErrorDetected={onErrorDetected}
        onErrorCleared={onErrorCleared}
        currentError={currentError}
        isAutoFixing={isAutoFixing}
      />
    );
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Tab Header - Enhanced with glassmorphism and premium styling */}
      <div className="px-6 py-5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200/80 dark:border-gray-700/80 flex flex-wrap justify-between items-center gap-4 flex-shrink-0 shadow-soft-sm">
        <div className="flex items-center gap-4">
          {/* Enhanced Tab Bar */}
          <div className="inline-flex bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setActiveTab('generation')}
              className={`relative px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold ${
                activeTab === 'generation'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="hidden sm:inline">Code</span>
              </div>
              {activeTab === 'generation' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`relative px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="hidden sm:inline">Preview</span>
              </div>
              {activeTab === 'preview' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('browser')}
              className={`relative px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold ${
                activeTab === 'browser'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Test</span>
              </div>
              {activeTab === 'browser' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              )}
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 lg:gap-2.5 items-center flex-wrap">
          {/* File count - Enhanced badge */}
          {activeTab === 'generation' && !generationProgress.isEdit && generationProgress.files.length > 0 && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {generationProgress.files.length} files
            </div>
          )}
          
          {/* Generation status - Enhanced with gradient */}
          {generationProgress.isGenerating && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/80 dark:border-green-800/80 rounded-xl text-xs font-semibold text-green-700 dark:text-green-400 shadow-sm">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping" />
              </div>
              <span>{generationProgress.isEdit ? 'Editing' : 'Generating'}</span>
            </div>
          )}
          
          {/* Sandbox status - Enhanced */}
          {sandboxData && !generationProgress.isGenerating && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50" />
              <span className="hidden sm:inline">Active</span>
            </div>
          )}
          
          {/* External link - Enhanced button */}
          {sandboxData && (
            <a
              href={sandboxData.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="p-2 rounded-xl transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:shadow-sm"
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
      
      {/* Main Content - Enhanced background */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50">
        {renderMainContent()}
      </div>
    </div>
  );
}