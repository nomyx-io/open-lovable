'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';
import HeroInput from '@/components/HeroInput';
import CodeApplicationProgress from '@/components/CodeApplicationProgress';
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
  onSendMessage: () => void;
  screenshotCollapsed: boolean;
  setScreenshotCollapsed: (value: boolean) => void;
}

export function ChatInterface({
  chatMessages,
  conversationContext,
  generationProgress,
  codeApplicationState,
  aiChatInput,
  setAiChatInput,
  onSendMessage,
  screenshotCollapsed,
  setScreenshotCollapsed
}: ChatInterfaceProps) {
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Scraped websites header */}
      {conversationContext.scrapedWebsites.length > 0 && (
        <div className="p-4 bg-card border-b border-gray-200">
          <div className="flex flex-col gap-4">
            {conversationContext.scrapedWebsites.map((site, idx) => {
              const metadata = site.content?.metadata || {};
              const sourceURL = metadata.sourceURL || site.url;
              const favicon = metadata.favicon || `https://www.google.com/s2/favicons?domain=${new URL(sourceURL).hostname}&sz=128`;
              const siteName = metadata.ogSiteName || metadata.title || new URL(sourceURL).hostname;
              const screenshot = site.content?.screenshot || sessionStorage.getItem('websiteScreenshot');
              
              return (
                <div key={idx} className="flex flex-col gap-3">
                  <div className="flex items-center gap-4 text-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={favicon} 
                      alt={siteName}
                      className="w-16 h-16 rounded"
                      onError={(e) => {
                        e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${new URL(sourceURL).hostname}&sz=128`;
                      }}
                    />
                    <a 
                      href={sourceURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-black hover:text-gray-700 truncate max-w-[250px] font-medium"
                      title={sourceURL}
                    >
                      {siteName}
                    </a>
                  </div>
                  
                  {screenshot && (
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Screenshot Preview</span>
                        <button
                          onClick={() => setScreenshotCollapsed(!screenshotCollapsed)}
                          className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                          aria-label={screenshotCollapsed ? 'Expand screenshot' : 'Collapse screenshot'}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`transition-transform duration-300 ${screenshotCollapsed ? 'rotate-180' : ''}`}
                          >
                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                      <div
                        className="w-full rounded-lg overflow-hidden border border-gray-200 transition-all duration-300"
                        style={{
                          opacity: screenshotCollapsed ? 0 : 1,
                          transform: screenshotCollapsed ? 'translateY(-20px)' : 'translateY(0)',
                          pointerEvents: screenshotCollapsed ? 'none' : 'auto',
                          maxHeight: screenshotCollapsed ? '0' : '200px'
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={screenshot}
                          alt={`${siteName} preview`}
                          className="w-full h-auto object-cover"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages list */}
      <div
        className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-hide"
        ref={chatMessagesRef}
      >
        {chatMessages.map((msg, idx) => (
          <MessageBubble 
            key={idx} 
            message={msg} 
            isLast={idx === chatMessages.length - 1}
            generationProgress={generationProgress}
          />
        ))}
        
        {/* Code application progress */}
        {codeApplicationState.stage && (
          <CodeApplicationProgress state={codeApplicationState} />
        )}
        
        {/* File generation progress */}
        {generationProgress.isGenerating && (
          <GenerationProgressIndicator progress={generationProgress} />
        )}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-background-base">
        <HeroInput
          value={aiChatInput}
          onChange={setAiChatInput}
          onSubmit={onSendMessage}
          placeholder="Describe what you want to build..."
          showSearchFeatures={false}
        />
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isLast: boolean;
  generationProgress: GenerationProgress;
}

function MessageBubble({ message, isLast, generationProgress }: MessageBubbleProps) {
  const msg = message;
  const isGenerationComplete = msg.content.includes('Successfully recreated') || 
                               msg.content.includes('AI recreation generated!') ||
                               msg.content.includes('Code generated!');
  
  return (
    <div className="block">
      <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className="block">
          <div className={`block rounded-[10px] px-14 py-8 ${
            msg.type === 'user' ? 'bg-[#36322F] text-white ml-auto max-w-[80%]' :
            msg.type === 'ai' ? 'bg-gray-100 text-gray-900 mr-auto max-w-[80%]' :
            msg.type === 'system' ? 'bg-[#36322F] text-white text-sm' :
            msg.type === 'command' ? 'bg-[#36322F] text-white font-mono text-sm' :
            msg.type === 'error' ? 'bg-red-900 text-red-100 text-sm border border-red-700' :
            'bg-[#36322F] text-white text-sm'
          }`}>
            {msg.type === 'command' ? (
              <CommandMessage message={msg} />
            ) : msg.type === 'error' ? (
              <ErrorMessage message={msg} />
            ) : (
              <span className="text-sm">{msg.content}</span>
            )}
          </div>
          
          {/* Branding data display */}
          {msg.metadata?.brandingData && (
            <BrandingDataDisplay metadata={msg.metadata} />
          )}

          {/* Applied files display */}
          {msg.metadata?.appliedFiles && msg.metadata.appliedFiles.length > 0 && (
            <AppliedFilesDisplay files={msg.metadata.appliedFiles} message={msg} />
          )}
          
          {/* Generated files for completion messages */}
          {isGenerationComplete && generationProgress.files.length > 0 && isLast && !msg.metadata?.appliedFiles && (
            <GeneratedFilesDisplay files={generationProgress.files} />
          )}
        </div>
      </div>
    </div>
  );
}

function CommandMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`text-xs ${
        message.metadata?.commandType === 'input' ? 'text-blue-400' :
        message.metadata?.commandType === 'error' ? 'text-red-400' :
        message.metadata?.commandType === 'success' ? 'text-green-400' :
        'text-gray-400'
      }`}>
        {message.metadata?.commandType === 'input' ? '$' : '>'}
      </span>
      <span className="flex-1 whitespace-pre-wrap text-white">{message.content}</span>
    </div>
  );
}

function ErrorMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>
      <div className="flex-1">
        <div className="font-semibold mb-1">Build Errors Detected</div>
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        <div className="mt-2 text-xs opacity-70">Press 'F' or click the Fix button above to resolve</div>
      </div>
    </div>
  );
}

function BrandingDataDisplay({ metadata }: { metadata: ChatMessage['metadata'] }) {
  const brandingData = metadata?.brandingData;
  if (!brandingData) return null;

  return (
    <div className="mt-3 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl overflow-hidden max-w-[500px] shadow-sm">
      <div className="bg-[#36322F] px-16 py-12">
        <div className="flex items-center gap-8">
          <Image
            src={`https://www.google.com/s2/favicons?domain=${metadata?.sourceUrl}&sz=32`}
            alt=""
            width={64}
            height={64}
            className="w-16 h-16"
          />
          <div className="text-sm font-semibold text-white">
            Brand Guidelines
          </div>
        </div>
      </div>

      <div className="p-16">
        {brandingData.colorScheme && (
          <div className="mb-16">
            <div className="text-sm">
              <span className="text-gray-600 font-medium">Mode:</span>{' '}
              <span className="font-semibold text-gray-900 capitalize">{brandingData.colorScheme}</span>
            </div>
          </div>
        )}

        {brandingData.colors && (
          <div className="mb-16">
            <div className="text-sm font-semibold text-gray-900 mb-8">Colors</div>
            <div className="flex flex-wrap gap-12">
              {Object.entries(brandingData.colors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-8">
                  <div className="w-32 h-32 rounded border border-gray-300" style={{ backgroundColor: value as string }} />
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900 capitalize">{key}</div>
                    <div className="text-gray-600 font-mono text-xs">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {brandingData.typography && (
          <div className="mb-16">
            <div className="text-sm font-semibold text-gray-900 mb-8">Typography</div>
            <div className="grid grid-cols-2 gap-12 text-sm">
              {brandingData.typography.fontFamilies?.primary && (
                <div>
                  <span className="text-gray-600 font-medium">Primary:</span>{' '}
                  <span className="font-semibold text-gray-900">{brandingData.typography.fontFamilies.primary}</span>
                </div>
              )}
              {brandingData.typography.fontSizes?.h1 && (
                <div>
                  <span className="text-gray-600 font-medium">H1 Size:</span>{' '}
                  <span className="font-semibold text-gray-900">{brandingData.typography.fontSizes.h1}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {brandingData.personality && (
          <div className="text-sm">
            <span className="text-gray-600 font-medium">Personality:</span>{' '}
            <span className="font-semibold text-gray-900 capitalize">
              {brandingData.personality.tone} tone, {brandingData.personality.energy} energy
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function AppliedFilesDisplay({ files, message }: { files: string[]; message: ChatMessage }) {
  return (
    <div className="mt-3 inline-block bg-gray-100 rounded-[10px] p-5">
      <div className="text-sm font-medium mb-3 text-gray-700">
        {message.content.includes('Applied') ? 'Files Updated:' : 'Generated Files:'}
      </div>
      <div className="flex flex-wrap items-start gap-2">
        {files.map((filePath, fileIdx) => {
          const fileName = filePath.split('/').pop() || filePath;
          const fileExt = fileName.split('.').pop() || '';
          const fileType = fileExt === 'jsx' || fileExt === 'js' ? 'javascript' :
                          fileExt === 'css' ? 'css' :
                          fileExt === 'json' ? 'json' : 'text';

          return (
            <div
              key={`applied-${fileIdx}`}
              className="inline-flex items-center gap-1.5 px-6 py-1.5 bg-[#36322F] text-white rounded-[10px] text-sm animate-fade-in-up"
              style={{ animationDelay: `${fileIdx * 30}ms` }}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                fileType === 'css' ? 'bg-blue-400' :
                fileType === 'javascript' ? 'bg-yellow-400' :
                fileType === 'json' ? 'bg-green-400' :
                'bg-gray-400'
              }`} />
              {fileName}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GeneratedFilesDisplay({ files }: { files: GenerationProgress['files'] }) {
  return (
    <div className="mt-2 inline-block bg-gray-100 rounded-[10px] p-3">
      <div className="text-xs font-medium mb-1 text-gray-700">Generated Files:</div>
      <div className="flex flex-wrap items-start gap-1">
        {files.map((file, fileIdx) => (
          <div
            key={`complete-${fileIdx}`}
            className="inline-flex items-center gap-1.5 px-6 py-1.5 bg-[#36322F] text-white rounded-[10px] text-xs animate-fade-in-up"
            style={{ animationDelay: `${fileIdx * 30}ms` }}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
              file.type === 'css' ? 'bg-blue-400' :
              file.type === 'javascript' ? 'bg-yellow-400' :
              file.type === 'json' ? 'bg-green-400' :
              'bg-gray-400'
            }`} />
            {file.path.split('/').pop()}
          </div>
        ))}
      </div>
    </div>
  );
}

function GenerationProgressIndicator({ progress }: { progress: GenerationProgress }) {
  return (
    <div className="inline-block bg-gray-100 rounded-lg p-3">
      <div className="text-sm font-medium mb-2 text-gray-700">
        {progress.status}
      </div>
      <div className="flex flex-wrap items-start gap-1">
        {/* Show completed files */}
        {progress.files.map((file, idx) => (
          <div
            key={`file-${idx}`}
            className="inline-flex items-center gap-1.5 px-6 py-1.5 bg-[#36322F] text-white rounded-[10px] text-xs animate-fade-in-up"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            {file.path.split('/').pop()}
          </div>
        ))}
        
        {/* Show current file being generated */}
        {progress.currentFile && (
          <div 
            className="flex items-center gap-1 px-2 py-1 bg-[#36322F]/70 text-white rounded-[10px] text-sm animate-pulse"
            style={{ animationDelay: `${progress.files.length * 30}ms` }}
          >
            <div className="w-16 h-16 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {progress.currentFile.path.split('/').pop()}
          </div>
        )}
      </div>
      
      {/* Live streaming display */}
      {progress.streamedCode && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3 border-t border-gray-300 pt-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-gray-600">AI Response Stream</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent" />
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded max-h-128 overflow-y-auto scrollbar-hide">
            <SyntaxHighlighter
              language="jsx"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '0.75rem',
                fontSize: '11px',
                lineHeight: '1.5',
                background: 'transparent',
                maxHeight: '8rem',
                overflow: 'hidden'
              }}
            >
              {(() => {
                const lastContent = progress.streamedCode.slice(-1000);
                const startIndex = lastContent.indexOf('<');
                return startIndex !== -1 ? lastContent.slice(startIndex) : lastContent;
              })()}
            </SyntaxHighlighter>
            <span className="inline-block w-3 h-4 bg-orange-400 ml-3 mb-3 animate-pulse" />
          </div>
        </motion.div>
      )}
    </div>
  );
}