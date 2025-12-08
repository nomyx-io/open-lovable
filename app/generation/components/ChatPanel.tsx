'use client';

import { RefObject } from 'react';
import { ChatInterface } from './ChatInterface';
import type { ChatMessage, ConversationContext, GenerationProgress, CodeApplicationState } from '../types';
import type { ScreenshotAttachment } from '@/components/shared/ScreenshotButton';

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  conversationContext: ConversationContext;
  generationProgress: GenerationProgress;
  codeApplicationState: CodeApplicationState;
  aiChatInput: string;
  setAiChatInput: (value: string) => void;
  onSendMessage: (screenshot?: ScreenshotAttachment | null) => Promise<void>;
  screenshotCollapsed: boolean;
  setScreenshotCollapsed: (value: boolean) => void;
  iframeRef?: RefObject<HTMLIFrameElement | null>;
}

export function ChatPanel({
  chatMessages,
  conversationContext,
  generationProgress,
  codeApplicationState,
  aiChatInput,
  setAiChatInput,
  onSendMessage,
  screenshotCollapsed,
  setScreenshotCollapsed,
  iframeRef
}: ChatPanelProps) {
  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Chat Interface */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatInterface
          chatMessages={chatMessages}
          conversationContext={conversationContext}
          generationProgress={generationProgress}
          codeApplicationState={codeApplicationState}
          aiChatInput={aiChatInput}
          setAiChatInput={setAiChatInput}
          onSendMessage={onSendMessage}
          screenshotCollapsed={screenshotCollapsed}
          setScreenshotCollapsed={setScreenshotCollapsed}
          iframeRef={iframeRef}
        />
      </div>
    </div>
  );
}