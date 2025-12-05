'use client';

import type { RefObject } from 'react';
import type { SandboxData, GenerationProgress, CodeApplicationState, LoadingStage } from '../types';

interface SandboxPreviewProps {
  sandboxData: SandboxData | null;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  urlScreenshot: string | null;
  isScreenshotLoaded: boolean;
  setIsScreenshotLoaded: (loaded: boolean) => void;
  isCapturingScreenshot: boolean;
  isPreparingDesign: boolean;
  generationProgress: GenerationProgress;
  codeApplicationState: CodeApplicationState;
  loadingStage: LoadingStage;
  isStartingNewGeneration: boolean;
  loading: boolean;
  screenshotError: string | null;
  refreshIframe: () => void;
}

export function SandboxPreview({
  sandboxData,
  iframeRef,
  urlScreenshot,
  isScreenshotLoaded,
  setIsScreenshotLoaded,
  isCapturingScreenshot,
  isPreparingDesign,
  generationProgress,
  codeApplicationState,
  loadingStage,
  isStartingNewGeneration,
  loading,
  screenshotError,
  refreshIframe
}: SandboxPreviewProps) {
  // Show loading state for initial generation or when starting a new generation with existing sandbox
  const isInitialGeneration = !sandboxData?.url && (urlScreenshot || isCapturingScreenshot || isPreparingDesign || loadingStage);
  const isNewGenerationWithSandbox = isStartingNewGeneration && sandboxData?.url;
  const shouldShowLoadingOverlay = (isInitialGeneration || isNewGenerationWithSandbox) && 
    (loading || generationProgress.isGenerating || isPreparingDesign || loadingStage || isCapturingScreenshot || isStartingNewGeneration);
  
  if (isInitialGeneration || isNewGenerationWithSandbox) {
    return (
      <div className="relative w-full h-full bg-gray-900">
        {/* Screenshot as background when available */}
        {urlScreenshot && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src={urlScreenshot} 
            alt="Website preview" 
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ 
              opacity: isScreenshotLoaded ? 1 : 0,
              willChange: 'opacity'
            }}
            onLoad={() => setIsScreenshotLoaded(true)}
            loading="eager"
          />
        )}
        
        {/* Loading overlay - only show when actively processing initial generation */}
        {shouldShowLoadingOverlay && (
          <LoadingOverlay 
            isCapturingScreenshot={isCapturingScreenshot}
            isPreparingDesign={isPreparingDesign}
            generationProgress={generationProgress}
          />
        )}
      </div>
    );
  }
  
  // Show sandbox iframe - keep showing during edits, only hide during initial loading
  if (sandboxData?.url) {
    return (
      <div className="relative w-full h-full">
        <iframe
          ref={iframeRef}
          src={sandboxData.url}
          className="w-full h-full border-none"
          title="Open Lovable Sandbox"
          allow="clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
        
        {/* Package installation overlay */}
        {codeApplicationState.stage && codeApplicationState.stage !== 'complete' && (
          <CodeApplicationOverlay state={codeApplicationState} />
        )}
        
        {/* Subtle indicator when code is being edited/generated */}
        {generationProgress.isGenerating && generationProgress.isEdit && !codeApplicationState.stage && (
          <div className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">Generating code...</span>
          </div>
        )}
        
        {/* Refresh button */}
        <button
          onClick={refreshIframe}
          className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
          title="Refresh sandbox"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    );
  }
  
  // Default state when no sandbox and no screenshot
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 text-gray-600 text-lg">
      {screenshotError ? (
        <div className="text-center">
          <p className="mb-2">Failed to capture screenshot</p>
          <p className="text-sm text-gray-500">{screenshotError}</p>
        </div>
      ) : sandboxData ? (
        <div className="text-gray-500">
          <div className="w-16 h-16 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading preview...</p>
        </div>
      ) : (
        <div className="text-gray-500 text-center">
          <p className="text-sm">Start chatting to create your first app</p>
        </div>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  isCapturingScreenshot: boolean;
  isPreparingDesign: boolean;
  generationProgress: GenerationProgress;
}

function LoadingOverlay({ isCapturingScreenshot, isPreparingDesign, generationProgress }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
      <div className="text-center max-w-md">
        {/* Animated skeleton lines */}
        <div className="mb-6 space-y-3">
          <div className="h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded animate-pulse" 
               style={{ animationDuration: '1.5s', animationDelay: '0s' }} />
          <div className="h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded animate-pulse w-4/5 mx-auto" 
               style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
          <div className="h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded animate-pulse w-3/5 mx-auto" 
               style={{ animationDuration: '1.5s', animationDelay: '0.4s' }} />
        </div>
        
        {/* Status text */}
        <p className="text-white text-lg font-medium">
          {isCapturingScreenshot ? 'Analyzing website...' :
           isPreparingDesign ? 'Preparing design...' :
           generationProgress.isGenerating ? 'Generating code...' :
           'Loading...'}
        </p>
        
        {/* Subtle progress hint */}
        <p className="text-white/60 text-sm mt-2">
          {isCapturingScreenshot ? 'Taking a screenshot of the site' :
           isPreparingDesign ? 'Understanding the layout and structure' :
           generationProgress.isGenerating ? 'Writing React components' :
           'Please wait...'}
        </p>
      </div>
    </div>
  );
}

interface CodeApplicationOverlayProps {
  state: CodeApplicationState;
}

function CodeApplicationOverlay({ state }: CodeApplicationOverlayProps) {
  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-10">
      <div className="text-center max-w-md">
        <div className="mb-6">
          {state.stage === 'installing' && (
            <div className="w-16 h-16 mx-auto">
              <svg className="w-full h-full animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {state.stage === 'analyzing' && 'Analyzing code...'}
          {state.stage === 'installing' && 'Installing packages...'}
          {state.stage === 'applying' && 'Applying changes...'}
        </h3>
        
        {/* Package list during installation */}
        {state.stage === 'installing' && state.packages && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {state.packages.map((pkg, index) => (
                <span 
                  key={index}
                  className={`px-2 py-1 text-xs rounded-full transition-all ${
                    state.installedPackages?.includes(pkg)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {pkg}
                  {state.installedPackages?.includes(pkg) && (
                    <span className="ml-1">✓</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Files being generated */}
        {state.stage === 'applying' && state.filesGenerated && (
          <div className="text-sm text-gray-600">
            Creating {state.filesGenerated.length} files...
          </div>
        )}
        
        <p className="text-sm text-gray-500 mt-2">
          {state.stage === 'analyzing' && 'Parsing generated code and detecting dependencies...'}
          {state.stage === 'installing' && 'This may take a moment while npm installs the required packages...'}
          {state.stage === 'applying' && 'Writing files to your sandbox environment...'}
        </p>
      </div>
    </div>
  );
}