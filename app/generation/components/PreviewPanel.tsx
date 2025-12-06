'use client';

import { useState } from 'react';
import { CodePreview } from './CodePreview';
import { SandboxPreview } from './SandboxPreview';
import { BrowserTestPanel } from '@/components/browser';
import type { ActiveTab, GenerationProgress, CodeApplicationState, LoadingStage } from '../types';

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
  refreshIframe
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
      />
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden order-1 lg:order-2 min-h-[50vh] lg:min-h-0">
      {/* Tab Header */}
      <div className="px-3 py-3 lg:px-4 lg:py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('generation')}
              className={`px-3 py-1.5 rounded-md transition-all text-xs font-medium ${
                activeTab === 'generation'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span className="hidden sm:inline">Code</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md transition-all text-xs font-medium ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="hidden sm:inline">Preview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('browser')}
              className={`px-3 py-1.5 rounded-md transition-all text-xs font-medium ${
                activeTab === 'browser'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Test</span>
              </div>
            </button>
          </div>
        </div>
        
        <div className="flex gap-1.5 lg:gap-2 items-center flex-wrap">
          {/* File count */}
          {activeTab === 'generation' && !generationProgress.isEdit && generationProgress.files.length > 0 && (
            <div className="hidden sm:inline-flex text-gray-500 dark:text-gray-400 text-xs font-medium">
              {generationProgress.files.length} files
            </div>
          )}
          
          {/* Generation status */}
          {generationProgress.isGenerating && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-xs font-medium text-green-700 dark:text-green-400">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
              </div>
              <span className="hidden sm:inline">{generationProgress.isEdit ? 'Editing' : 'Generating'}</span>
            </div>
          )}
          
          {/* Sandbox status */}
          {sandboxData && !generationProgress.isGenerating && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="hidden sm:inline">Active</span>
            </div>
          )}
          
          {/* External link */}
          {sandboxData && (
            <a
              href={sandboxData.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="p-1.5 rounded-lg transition-all text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-900">
        {renderMainContent()}
      </div>
    </div>
  );
}