'use client';

import { useState, useEffect, type RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SandboxData, GenerationProgress, CodeApplicationState, LoadingStage } from '../types';
import HMRErrorDetector, { type SandboxError } from '@/components/HMRErrorDetector';

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
  // Error handling props
  onErrorDetected?: (errors: SandboxError[]) => void;
  onErrorCleared?: () => void;
  currentError?: SandboxError | null;
  isAutoFixing?: boolean;
}

export function SandboxPreview({
  sandboxData, iframeRef, urlScreenshot, isScreenshotLoaded, setIsScreenshotLoaded,
  isCapturingScreenshot, isPreparingDesign, generationProgress, codeApplicationState,
  loadingStage, isStartingNewGeneration, loading, screenshotError, refreshIframe,
  onErrorDetected, onErrorCleared, currentError, isAutoFixing
}: SandboxPreviewProps) {
  const isInitialGeneration = !sandboxData?.url && (urlScreenshot || isCapturingScreenshot || isPreparingDesign || loadingStage);
  const isNewGenerationWithSandbox = isStartingNewGeneration && sandboxData?.url;
  const shouldShowLoadingOverlay = (isInitialGeneration || isNewGenerationWithSandbox) && 
    (loading || generationProgress.isGenerating || isPreparingDesign || loadingStage || isCapturingScreenshot || isStartingNewGeneration);
  
  if (isInitialGeneration || isNewGenerationWithSandbox) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)` }} />
        <AnimatePresence>
          {urlScreenshot && (
            <motion.img initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: isScreenshotLoaded ? 0.4 : 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} src={urlScreenshot} alt="Website preview" className="absolute inset-0 w-full h-full object-cover blur-sm" onLoad={() => setIsScreenshotLoaded(true)} loading="eager" />
          )}
        </AnimatePresence>
        <AnimatePresence>{shouldShowLoadingOverlay && <LoadingOverlay isCapturingScreenshot={isCapturingScreenshot} isPreparingDesign={isPreparingDesign} generationProgress={generationProgress} loadingStage={loadingStage} />}</AnimatePresence>
      </div>
    );
  }
  
  if (sandboxData?.url) {
    return (
      <div className="relative w-full h-full bg-white">
        {/* HMR Error Detector - monitors iframe for Vite errors */}
        <HMRErrorDetector
          iframeRef={iframeRef}
          sandboxUrl={sandboxData.url}
          onErrorDetected={onErrorDetected || (() => {})}
          onErrorCleared={onErrorCleared}
          enabled={!generationProgress.isGenerating && (!codeApplicationState.stage || codeApplicationState.stage === 'complete')}
        />
        
        <iframe ref={iframeRef} src={sandboxData.url} className="w-full h-full border-none" title="Open Lovable Sandbox" allow="clipboard-write" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" />
        
        {/* Error Notification Banner */}
        <AnimatePresence>
          {currentError && (
            <ErrorBanner
              error={currentError}
              isAutoFixing={isAutoFixing || false}
            />
          )}
        </AnimatePresence>
        
        <AnimatePresence>{codeApplicationState.stage && codeApplicationState.stage !== 'complete' && <CodeApplicationOverlay state={codeApplicationState} />}</AnimatePresence>
        <AnimatePresence>
          {generationProgress.isGenerating && generationProgress.isEdit && !codeApplicationState.stage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-4 right-4 inline-flex items-center gap-2.5 px-4 py-2 bg-gray-900/90 backdrop-blur-md rounded-xl shadow-lg border border-white/10">
              <div className="relative"><div className="w-2.5 h-2.5 bg-green-400 rounded-full" /><div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping opacity-75" /></div>
              <span className="text-white text-sm font-medium">Updating code...</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute bottom-4 right-4 flex gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={refreshIframe} className="bg-white hover:bg-gray-50 text-gray-700 p-2.5 rounded-xl shadow-lg border border-gray-200 transition-colors" title="Refresh sandbox">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </motion.button>
          <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={sandboxData.url} target="_blank" rel="noopener noreferrer" className="bg-white hover:bg-gray-50 text-gray-700 p-2.5 rounded-xl shadow-lg border border-gray-200 transition-colors" title="Open in new tab">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </motion.a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-white">
      {screenshotError ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-red-500"><path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <p className="text-gray-900 font-medium mb-1">Failed to capture screenshot</p>
          <p className="text-sm text-gray-500">{screenshotError}</p>
        </motion.div>
      ) : sandboxData ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <div className="w-12 h-12 relative mx-auto"><div className="absolute inset-0 rounded-full border-2 border-gray-200" /><div className="absolute inset-0 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" /></div>
          <p className="text-sm text-gray-500 mt-4">Loading preview...</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm px-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center shadow-sm">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-orange-500"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Build</h3>
          <p className="text-sm text-gray-500 leading-relaxed">Enter a URL to clone a website or describe what you want to build in the chat.</p>
        </motion.div>
      )}
    </div>
  );
}

interface LoadingOverlayProps { isCapturingScreenshot: boolean; isPreparingDesign: boolean; generationProgress: GenerationProgress; loadingStage: LoadingStage; }

function LoadingOverlay({ isCapturingScreenshot, isPreparingDesign, generationProgress, loadingStage }: LoadingOverlayProps) {
  const [dots, setDots] = useState('');
  useEffect(() => { const interval = setInterval(() => { setDots(prev => prev.length >= 3 ? '' : prev + '.'); }, 400); return () => clearInterval(interval); }, []);
  
  const stages = [
    { key: 'gathering', label: 'Analyzing', icon: '🔍', active: isCapturingScreenshot || loadingStage === 'gathering' },
    { key: 'preparing', label: 'Designing', icon: '🎨', active: isPreparingDesign },
    { key: 'generating', label: 'Coding', icon: '⚡', active: generationProgress.isGenerating },
  ];
  const currentStage = stages.find(s => s.active) || stages[0];
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
      <div className="text-center max-w-md px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="relative w-24 h-24 mx-auto">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-2 border-dashed border-white/20" />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border-2 border-dashed border-white/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-500/30">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        </motion.div>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          {stages.map((stage, idx) => (
            <motion.div key={stage.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.1 }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${stage.active ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}>
              <span>{stage.icon}</span><span>{stage.label}</span>{stage.active && <span className="w-3">{dots}</span>}
            </motion.div>
          ))}
        </div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <p className="text-white text-xl font-semibold mb-2">{currentStage.label}{dots}</p>
          <p className="text-white/60 text-sm">{isCapturingScreenshot ? 'Capturing and analyzing the website' : isPreparingDesign ? 'Understanding layout and styling' : generationProgress.isGenerating ? 'Writing React components' : 'Please wait...'}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: '100%' }} transition={{ delay: 0.6 }} className="mt-8 max-w-xs mx-auto">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full" initial={{ width: '0%' }} animate={{ width: isCapturingScreenshot ? '30%' : isPreparingDesign ? '60%' : generationProgress.isGenerating ? '90%' : '100%' }} transition={{ duration: 0.5, ease: "easeInOut" }} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

interface CodeApplicationOverlayProps { state: CodeApplicationState; }

function CodeApplicationOverlay({ state }: CodeApplicationOverlayProps) {
  const stageConfig = {
    analyzing: { icon: '🔍', bg: 'bg-blue-100', color: 'text-blue-600', title: 'Analyzing code...', desc: 'Parsing generated code and detecting dependencies' },
    installing: { icon: '📦', bg: 'bg-purple-100', color: 'text-purple-600', title: 'Installing packages...', desc: 'This may take a moment' },
    applying: { icon: '✨', bg: 'bg-green-100', color: 'text-green-600', title: 'Applying changes...', desc: 'Writing files to your sandbox' },
  };
  const config = stageConfig[state.stage as keyof typeof stageConfig] || stageConfig.analyzing;
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/98 backdrop-blur-sm flex items-center justify-center z-10">
      <div className="text-center max-w-md px-6">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mb-6">
          <div className={`w-16 h-16 mx-auto rounded-2xl ${config.bg} flex items-center justify-center text-3xl`}>{config.icon}</div>
        </motion.div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{config.title}</h3>
        
        {state.stage === 'installing' && state.packages && (
          <div className="mb-4 flex flex-wrap gap-2 justify-center">
            {state.packages.map((pkg, idx) => (
              <motion.span key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} className={`px-2.5 py-1 text-xs rounded-lg transition-all ${state.installedPackages?.includes(pkg) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {pkg}{state.installedPackages?.includes(pkg) && ' ✓'}
              </motion.span>
            ))}
          </div>
        )}
        
        {state.stage === 'applying' && state.filesGenerated && (
          <div className="text-sm text-gray-600 mb-2">Creating {state.filesGenerated.length} files...</div>
        )}
        
        <p className="text-sm text-gray-500">{config.desc}</p>
        
        <div className="mt-6 w-48 h-1 bg-gray-100 rounded-full mx-auto overflow-hidden">
          <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="h-full w-1/3 bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
        </div>
      </div>
    </motion.div>
  );
}

// Error Banner Component
interface ErrorBannerProps {
  error: SandboxError;
  isAutoFixing: boolean;
}

function ErrorBanner({ error, isAutoFixing }: ErrorBannerProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'npm-missing':
        return '📦';
      case 'syntax-error':
        return '⚠️';
      case 'runtime-error':
        return '💥';
      case 'build-error':
        return '🔨';
      default:
        return '❌';
    }
  };

  const getErrorLabel = () => {
    switch (error.type) {
      case 'npm-missing':
        return 'Missing Package';
      case 'syntax-error':
        return 'Syntax Error';
      case 'runtime-error':
        return 'Runtime Error';
      case 'build-error':
        return 'Build Error';
      default:
        return 'Error';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-4 left-4 right-4 z-20"
    >
      <div className={`flex items-start gap-3 p-4 rounded-xl backdrop-blur-md shadow-lg border ${
        isAutoFixing
          ? 'bg-blue-50/95 dark:bg-blue-900/95 border-blue-200 dark:border-blue-700'
          : 'bg-red-50/95 dark:bg-red-900/95 border-red-200 dark:border-red-700'
      }`}>
        <div className="text-2xl flex-shrink-0">
          {isAutoFixing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              🔧
            </motion.div>
          ) : (
            getErrorIcon()
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isAutoFixing
                ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                : 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
            }`}>
              {isAutoFixing ? 'Auto-Fixing' : getErrorLabel()}
            </span>
            {error.file && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                {error.file}{error.line ? `:${error.line}` : ''}
              </span>
            )}
          </div>
          
          <p className={`text-sm font-medium ${
            isAutoFixing
              ? 'text-blue-800 dark:text-blue-200'
              : 'text-red-800 dark:text-red-200'
          }`}>
            {error.message}
          </p>
          
          {isAutoFixing && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              AI is analyzing and fixing this issue...
            </p>
          )}
        </div>
        
        {isAutoFixing && (
          <div className="flex-shrink-0">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
}