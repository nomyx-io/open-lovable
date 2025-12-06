'use client';

import { ChatInterface } from './ChatInterface';
import type { ChatMessage, ConversationContext, GenerationProgress, CodeApplicationState } from '../types';

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  conversationContext: ConversationContext;
  generationProgress: GenerationProgress;
  codeApplicationState: CodeApplicationState;
  aiChatInput: string;
  setAiChatInput: (value: string) => void;
  onSendMessage: () => Promise<void>;
  screenshotCollapsed: boolean;
  setScreenshotCollapsed: (value: boolean) => void;
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
  setScreenshotCollapsed
}: ChatPanelProps) {
  return (
    <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 order-2 lg:order-1 max-h-[50vh] lg:max-h-none overflow-hidden">
      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
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
        />
      </div>
    </div>
  );
}