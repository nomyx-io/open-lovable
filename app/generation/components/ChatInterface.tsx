'use client';

import { useRef, useEffect, useState, useMemo, RefObject, useCallback } from 'react';
import Image from 'next/image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import HeroInput from '@/components/HeroInput';
import CodeApplicationProgress from '@/components/CodeApplicationProgress';
import { AINextSteps, generateNextSteps, commonNextSteps, type NextStep } from '@/components/shared/ai-next-steps/ai-next-steps';
import { ScreenshotButton, type ScreenshotAttachment } from '@/components/shared/ScreenshotButton';
import type {
  ChatMessage,
  GenerationProgress,
  CodeApplicationState,
  ConversationContext
} from '../types';

interface ChatInterfaceProps {
  chatMessages: ChatMessage[];
  conversationContext: ConversationContext;
  generationProgress: GenerationProgress;
  codeApplicationState: CodeApplicationState;
  aiChatInput: string;
  setAiChatInput: (value: string) => void;
  onSendMessage: (screenshot?: ScreenshotAttachment | null) => void;
  screenshotCollapsed: boolean;
  setScreenshotCollapsed: (value: boolean) => void;
  iframeRef?: RefObject<HTMLIFrameElement | null>;
}

const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 500, damping: 30 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

export function ChatInterface({
  chatMessages, conversationContext, generationProgress, codeApplicationState,
  aiChatInput, setAiChatInput, onSendMessage, screenshotCollapsed, setScreenshotCollapsed,
  iframeRef
}: ChatInterfaceProps) {
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [pendingScreenshot, setPendingScreenshot] = useState<ScreenshotAttachment | null>(null);

  // Handle screenshot capture
  const handleScreenshotCapture = useCallback((screenshot: ScreenshotAttachment) => {
    setPendingScreenshot(screenshot);
  }, []);

  // Handle removing pending screenshot
  const handleRemoveScreenshot = useCallback(() => {
    setPendingScreenshot(null);
  }, []);

  // Handle sending message with screenshot
  const handleSendMessage = useCallback(() => {
    onSendMessage(pendingScreenshot);
    setPendingScreenshot(null);
  }, [onSendMessage, pendingScreenshot]);

  // Keyboard shortcut for screenshot (Cmd/Ctrl + Shift + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        // Trigger screenshot capture
        const event = new CustomEvent('captureScreenshot');
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScroll = () => {
    if (chatMessagesRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
      setIsNearBottom(scrollHeight - scrollTop - clientHeight < 100);
    }
  };

  useEffect(() => {
    if (chatMessagesRef.current && isNearBottom) {
      chatMessagesRef.current.scrollTo({ top: chatMessagesRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatMessages, isNearBottom]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-gray-50/30 to-white dark:from-gray-900 dark:to-gray-900/95">
      <AnimatePresence mode="wait">
        {conversationContext.scrapedWebsites.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-b border-gray-200/60 dark:border-gray-700/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-soft-sm">
            <div className="p-4">
              {conversationContext.scrapedWebsites.map((site, idx) => {
                const metadata = site.content?.metadata || {};
                const sourceURL = metadata.sourceURL || site.url;
                const favicon = metadata.favicon || `https://www.google.com/s2/favicons?domain=${new URL(sourceURL).hostname}&sz=128`;
                const siteName = metadata.ogSiteName || metadata.title || new URL(sourceURL).hostname;
                const screenshot = site.content?.screenshot || sessionStorage.getItem('websiteScreenshot');
                return (
                  <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="relative">
                        <img src={favicon} alt={siteName} className="w-10 h-10 rounded-lg shadow-sm border border-gray-100" onError={(e) => { e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${new URL(sourceURL).hostname}&sz=128`; }} />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <a href={sourceURL} target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-orange-600 truncate block font-semibold transition-colors" title={sourceURL}>{siteName}</a>
                        <span className="text-xs text-gray-500 truncate block">{sourceURL}</span>
                      </div>
                    </div>
                    {screenshot && (
                      <div className="w-full">
                        <button onClick={() => setScreenshotCollapsed(!screenshotCollapsed)} className="flex items-center justify-between w-full mb-2 group">
                          <span className="text-xs font-medium text-gray-500 group-hover:text-gray-700 transition-colors">{screenshotCollapsed ? 'Show Preview' : 'Hide Preview'}</span>
                          <motion.div animate={{ rotate: screenshotCollapsed ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400 group-hover:text-gray-600 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </motion.div>
                        </button>
                        <motion.div initial={false} animate={{ opacity: screenshotCollapsed ? 0 : 1, height: screenshotCollapsed ? 0 : 'auto', scale: screenshotCollapsed ? 0.95 : 1 }} transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }} className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                          <img src={screenshot} alt={`${siteName} preview`} className="w-full h-auto object-cover" style={{ maxHeight: '180px' }} />
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="flex-1 overflow-y-auto px-8 lg:px-10 py-8 flex flex-col gap-8 scrollbar-premium"
        ref={chatMessagesRef}
        onScroll={handleScroll}
        data-lenis-prevent
      >
        <AnimatePresence initial={false}>
          {chatMessages.map((msg, idx) => (
            <motion.div key={idx} variants={messageVariants} initial="hidden" animate="visible" exit="exit" layout>
              <MessageBubble message={msg} isLast={idx === chatMessages.length - 1} generationProgress={generationProgress} />
            </motion.div>
          ))}
        </AnimatePresence>
        <AnimatePresence>{codeApplicationState.stage && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><CodeApplicationProgress state={codeApplicationState} /></motion.div>}</AnimatePresence>
        <AnimatePresence>{generationProgress.isGenerating && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><GenerationProgressIndicator progress={generationProgress} /></motion.div>}</AnimatePresence>
        
        {/* AI Suggested Next Steps */}
        <AINextStepsSuggestions
          chatMessages={chatMessages}
          generationProgress={generationProgress}
          onSelectStep={(step) => {
            setAiChatInput(step.prompt);
          }}
        />
        <AnimatePresence>
          {!isNearBottom && chatMessages.length > 5 && (
            <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onClick={() => { chatMessagesRef.current?.scrollTo({ top: chatMessagesRef.current.scrollHeight, behavior: 'smooth' }); }} className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-gray-800 transition-colors z-10">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M6 10L2.5 6.5M6 10L9.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="text-xs font-medium">New messages</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 lg:px-10 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
        {/* Screenshot indicator when attached */}
        <AnimatePresence>
          {pendingScreenshot && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              className="mb-3"
            >
              <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200/60 dark:border-orange-700/60">
                <div className="relative group">
                  <div className="w-20 h-14 rounded-md overflow-hidden border border-orange-200 dark:border-orange-700 shadow-sm">
                    <img
                      src={pendingScreenshot.dataUrl}
                      alt="Attached screenshot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={handleRemoveScreenshot}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors"
                    aria-label="Remove screenshot"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-orange-700 dark:text-orange-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    Screenshot attached
                  </div>
                  <p className="text-xs text-orange-600/80 dark:text-orange-500/80">
                    {pendingScreenshot.width}×{pendingScreenshot.height} • Will be sent with your message
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex items-end gap-2">
          {/* Screenshot capture button */}
          <ScreenshotButton
            iframeRef={iframeRef}
            onScreenshotCapture={handleScreenshotCapture}
            compact
            className="flex-shrink-0 mb-1"
          />
          
          {/* Chat input */}
          <div className="flex-1">
            <HeroInput
              value={aiChatInput}
              onChange={setAiChatInput}
              onSubmit={handleSendMessage}
              placeholder={pendingScreenshot ? "Describe what you'd like me to do with this screenshot..." : "Describe what you want to build..."}
              showSearchFeatures={false}
              showScreenshotButton={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps { message: ChatMessage; isLast: boolean; generationProgress: GenerationProgress; }

function MessageBubble({ message, isLast, generationProgress }: MessageBubbleProps) {
  const msg = message;
  const isGenerationComplete = msg.content.includes('Successfully recreated') || msg.content.includes('AI recreation generated!') || msg.content.includes('Code generated!');
  
  const messageStyles: Record<string, { container: string; bubble: string; icon: React.ReactNode | null }> = {
    user: {
      container: 'justify-end',
      bubble: 'bg-orange-500 text-white ml-auto max-w-[80%] shadow-sm',
      icon: null
    },
    ai: {
      container: 'justify-start',
      bubble: 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-auto max-w-[80%] border border-gray-200 dark:border-gray-700',
      icon: <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    },
    system: {
      container: 'justify-start',
      bubble: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm',
      icon: <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-gray-500 dark:text-gray-400"><path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    },
    command: {
      container: 'justify-start',
      bubble: 'bg-gray-900 dark:bg-gray-950 text-green-400 font-mono text-sm border border-gray-700',
      icon: <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-green-400"><path d="M4 17L10 11L4 5M12 19H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    },
    error: {
      container: 'justify-start',
      bubble: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800',
      icon: <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-red-500"><path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
    }
  };
  
  const style = messageStyles[msg.type] || messageStyles.system;
  
  // Check if message has a screenshot attachment
  const hasScreenshot = msg.metadata?.screenshotAttachment;
  
  return (
    <div className="group">
      <div className={`flex gap-2.5 items-start ${style.container}`}>
        {msg.type !== 'user' && style.icon}
        <div className="flex-1 min-w-0">
          <div className={`rounded-2xl px-5 py-4 ${style.bubble}`}>
            {msg.type === 'command' ? (
              <CommandMessage message={msg} />
            ) : msg.type === 'error' ? (
              <ErrorMessage message={msg} />
            ) : (
              <div className="flex flex-col gap-2">
                {/* Screenshot attachment preview */}
                {hasScreenshot && (
                  <div className="mb-2">
                    <div className="relative rounded-lg overflow-hidden border border-white/20 shadow-sm max-w-[280px]">
                      <img
                        src={msg.metadata!.screenshotAttachment}
                        alt="Screenshot attachment"
                        className="w-full h-auto object-cover"
                        style={{ maxHeight: '160px' }}
                      />
                      {msg.metadata?.screenshotDimensions && (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded backdrop-blur-sm">
                          {msg.metadata.screenshotDimensions.width}×{msg.metadata.screenshotDimensions.height}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <span className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</span>
              </div>
            )}
          </div>
          <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 px-1">{msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {msg.metadata?.brandingData && <BrandingDataDisplay metadata={msg.metadata} />}
          {msg.metadata?.appliedFiles && msg.metadata.appliedFiles.length > 0 && <AppliedFilesDisplay files={msg.metadata.appliedFiles} message={msg} />}
          {isGenerationComplete && generationProgress.files.length > 0 && isLast && !msg.metadata?.appliedFiles && <GeneratedFilesDisplay files={generationProgress.files} />}
        </div>
      </div>
    </div>
  );
}

function CommandMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`text-xs font-medium ${message.metadata?.commandType === 'input' ? 'text-blue-400' : message.metadata?.commandType === 'error' ? 'text-red-400' : message.metadata?.commandType === 'success' ? 'text-green-400' : 'text-gray-400'}`}>{message.metadata?.commandType === 'input' ? '$' : '>'}</span>
      <span className="flex-1 whitespace-pre-wrap">{message.content}</span>
    </div>
  );
}

function ErrorMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <div className="font-semibold mb-1 text-red-700">Build Errors Detected</div>
        <div className="whitespace-pre-wrap text-sm text-red-600">{message.content}</div>
        <div className="mt-2 text-xs text-red-500/70">Press 'F' or click the Fix button above to resolve</div>
      </div>
    </div>
  );
}

function BrandingDataDisplay({ metadata }: { metadata: ChatMessage['metadata'] }) {
  const brandingData = metadata?.brandingData;
  if (!brandingData) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl overflow-hidden max-w-[500px] shadow-sm">
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3">
        <div className="flex items-center gap-3">
          <Image src={`https://www.google.com/s2/favicons?domain=${metadata?.sourceUrl}&sz=32`} alt="" width={24} height={24} className="w-6 h-6 rounded" />
          <div className="text-sm font-semibold text-white">Brand Guidelines</div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {brandingData.colorScheme && <div><div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Color Scheme</div><div className="text-sm font-semibold text-gray-900 capitalize">{brandingData.colorScheme}</div></div>}
        {brandingData.colors && <div><div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Colors</div><div className="flex flex-wrap gap-2">{Object.entries(brandingData.colors).map(([key, value]) => <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5"><div className="w-5 h-5 rounded-md border border-gray-200 shadow-inner" style={{ backgroundColor: value as string }} /><div><div className="text-xs font-medium text-gray-700 capitalize">{key}</div><div className="text-[10px] text-gray-400 font-mono">{value}</div></div></div>)}</div></div>}
        {brandingData.typography && <div><div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Typography</div><div className="grid grid-cols-2 gap-3 text-sm">{brandingData.typography.fontFamilies?.primary && <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="text-xs text-gray-500">Primary</span><div className="font-semibold text-gray-900">{brandingData.typography.fontFamilies.primary}</div></div>}{brandingData.typography.fontSizes?.h1 && <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="text-xs text-gray-500">H1 Size</span><div className="font-semibold text-gray-900">{brandingData.typography.fontSizes.h1}</div></div>}</div></div>}
        {brandingData.personality && <div><div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Personality</div><div className="flex gap-2"><span className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-xs font-medium">{brandingData.personality.tone} tone</span><span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">{brandingData.personality.energy} energy</span></div></div>}
      </div>
    </motion.div>
  );
}

function AppliedFilesDisplay({ files, message }: { files: string[]; message: ChatMessage }) {
  const isApplied = message.content.includes('Applied');
  const fileColors: Record<string, { bg: string; dot: string; text: string }> = { jsx: { bg: 'bg-yellow-50', dot: 'bg-yellow-400', text: 'text-yellow-700' }, tsx: { bg: 'bg-blue-50', dot: 'bg-blue-400', text: 'text-blue-700' }, js: { bg: 'bg-yellow-50', dot: 'bg-yellow-400', text: 'text-yellow-700' }, ts: { bg: 'bg-blue-50', dot: 'bg-blue-400', text: 'text-blue-700' }, css: { bg: 'bg-purple-50', dot: 'bg-purple-400', text: 'text-purple-700' }, json: { bg: 'bg-green-50', dot: 'bg-green-400', text: 'text-green-700' }, html: { bg: 'bg-orange-50', dot: 'bg-orange-400', text: 'text-orange-700' } };
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200/80 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isApplied ? 'bg-green-100' : 'bg-blue-100'}`}><svg width="10" height="10" viewBox="0 0 12 12" fill="none" className={isApplied ? 'text-green-600' : 'text-blue-600'}><path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        <span className="text-sm font-medium text-gray-700">{isApplied ? 'Files Updated' : 'Generated Files'}</span>
        <span className="text-xs text-gray-400">({files.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {files.map((filePath, fileIdx) => { const fileName = filePath.split('/').pop() || filePath; const fileExt = fileName.split('.').pop() || ''; const colors = fileColors[fileExt] || { bg: 'bg-gray-50', dot: 'bg-gray-400', text: 'text-gray-700' }; return <motion.div key={`applied-${fileIdx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: fileIdx * 0.03 }} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 ${colors.bg} rounded-lg text-xs font-medium ${colors.text}`}><span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />{fileName}</motion.div>; })}
      </div>
    </motion.div>
  );
}

function GeneratedFilesDisplay({ files }: { files: GenerationProgress['files'] }) {
  const fileColors: Record<string, { bg: string; dot: string; text: string }> = { javascript: { bg: 'bg-yellow-50', dot: 'bg-yellow-400', text: 'text-yellow-700' }, typescript: { bg: 'bg-blue-50', dot: 'bg-blue-400', text: 'text-blue-700' }, css: { bg: 'bg-purple-50', dot: 'bg-purple-400', text: 'text-purple-700' }, json: { bg: 'bg-green-50', dot: 'bg-green-400', text: 'text-green-700' }, html: { bg: 'bg-orange-50', dot: 'bg-orange-400', text: 'text-orange-700' } };
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200/80 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-green-600"><path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
        <span className="text-sm font-medium text-gray-700">Generated Files</span>
        <span className="text-xs text-gray-400">({files.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {files.map((file, fileIdx) => { const fileName = file.path.split('/').pop() || file.path; const colors = fileColors[file.type] || { bg: 'bg-gray-50', dot: 'bg-gray-400', text: 'text-gray-700' }; return <motion.div key={`complete-${fileIdx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: fileIdx * 0.03 }} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 ${colors.bg} rounded-lg text-xs font-medium ${colors.text}`}><span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />{fileName}</motion.div>; })}
      </div>
    </motion.div>
  );
}

function GenerationProgressIndicator({ progress }: { progress: GenerationProgress }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-soft-md overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/80 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="relative"><div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm shadow-green-500/50" /><div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping" /></div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{progress.status}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {progress.files.map((file, idx) => <motion.div key={`file-${idx}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.03 }} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 rounded-lg text-xs font-medium text-green-700"><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>{file.path.split('/').pop()}</motion.div>)}
          {progress.currentFile && <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium animate-pulse"><div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />{progress.currentFile.path.split('/').pop()}</div>}
        </div>
        {progress.streamedCode && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-xs font-medium text-gray-600">Live Stream</span></div>
            <div className="bg-gray-900 rounded-lg overflow-hidden max-h-32">
              <SyntaxHighlighter language="jsx" style={vscDarkPlus} customStyle={{ margin: 0, padding: '0.75rem', fontSize: '11px', lineHeight: '1.5', background: 'transparent', maxHeight: '8rem', overflow: 'hidden' }}>
                {(() => { const lastContent = progress.streamedCode.slice(-800); const startIndex = lastContent.indexOf('<'); return startIndex !== -1 ? lastContent.slice(startIndex) : lastContent; })()}
              </SyntaxHighlighter>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// AI Next Steps Suggestions Component
function AINextStepsSuggestions({
  chatMessages,
  generationProgress,
  onSelectStep
}: {
  chatMessages: ChatMessage[];
  generationProgress: GenerationProgress;
  onSelectStep: (step: NextStep) => void;
}) {
  // Determine if we should show suggestions
  const shouldShowSuggestions = useMemo(() => {
    if (chatMessages.length === 0) return false;
    if (generationProgress.isGenerating) return false;
    
    const lastMessage = chatMessages[chatMessages.length - 1];
    // Show suggestions after AI responses that indicate completion
    return lastMessage?.type === 'ai' && (
      lastMessage.content.includes('generated') ||
      lastMessage.content.includes('created') ||
      lastMessage.content.includes('Applied') ||
      lastMessage.content.includes('Successfully') ||
      lastMessage.content.includes('Here') ||
      lastMessage.content.includes('I\'ve') ||
      lastMessage.metadata?.appliedFiles?.length
    );
  }, [chatMessages, generationProgress.isGenerating]);

  // Generate context-aware suggestions
  const suggestions = useMemo(() => {
    if (!shouldShowSuggestions) return [];
    
    const lastMessage = chatMessages[chatMessages.length - 1];
    const content = lastMessage?.content?.toLowerCase() || '';
    
    // Determine project context from message content
    const context: Parameters<typeof generateNextSteps>[0] = {
      lastAction: content,
      hasErrors: chatMessages.some(m => m.type === 'error'),
    };

    // Detect specific scenarios for targeted suggestions
    if (content.includes('landing') || content.includes('hero') || content.includes('homepage')) {
      return commonNextSteps.afterLandingPage;
    }
    
    if (content.includes('dashboard') || content.includes('analytics') || content.includes('admin')) {
      return commonNextSteps.afterDashboard;
    }
    
    if (content.includes('form') || content.includes('input') || content.includes('submit')) {
      return commonNextSteps.afterForm;
    }

    // Default to generated suggestions
    return generateNextSteps(context);
  }, [shouldShowSuggestions, chatMessages]);

  if (!shouldShowSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <AINextSteps
        steps={suggestions}
        onSelectStep={onSelectStep}
        isExpanded={true}
      />
    </motion.div>
  );
}