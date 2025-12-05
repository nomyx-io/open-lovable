/**
 * Conversation Store - Zustand state management for chat and AI generation
 * 
 * This store manages:
 * - Chat messages history
 * - Conversation context (scraped websites, generated components, applied code)
 * - Generation progress and streaming state
 * - Code application state
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export type MessageType = 'user' | 'ai' | 'system' | 'command' | 'error' | 'branding';

export interface ChatMessageMetadata {
  scrapedContent?: {
    url: string;
    html?: string;
    markdown?: string;
    screenshot?: string;
    links?: { text: string; url: string }[];
    metadata?: Record<string, unknown>;
    error?: string;
    [key: string]: unknown;
  };
  error?: string;
  originalContent?: string;
  expandable?: boolean;
  brandColors?: string[];
  brandFonts?: string[];
  brandStylesUsed?: boolean;
  generatedFiles?: { path: string; content: string }[];
  [key: string]: unknown;
}

export interface ChatMessage {
  content: string;
  type: MessageType;
  timestamp: Date;
  metadata?: ChatMessageMetadata;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language?: string;
}

export interface ScrapedWebsite {
  url: string;
  content: string;
  markdown?: string;
  screenshot?: string;
  links?: { text: string; url: string }[];
  timestamp: Date;
}

export interface AppliedCode {
  code: string;
  timestamp: Date;
  isEdit: boolean;
  filesModified?: string[];
}

export interface ConversationContext {
  scrapedWebsites: ScrapedWebsite[];
  generatedComponents: string[];
  appliedCode: AppliedCode[];
  currentProject: string;
  lastGeneratedCode?: string;
}

export interface GenerationProgress {
  isGenerating: boolean;
  status: string;
  files: GeneratedFile[];
  currentFile: string;
  streamedCode: string;
  isStreaming: boolean;
  isEdit: boolean;
  editTarget?: string;
  streamingFilename?: string;
}

export type CodeApplicationStage = 'analyzing' | 'installing' | 'applying' | 'complete' | null;

export interface CodeApplicationState {
  stage: CodeApplicationStage;
  currentPackage?: string;
  progress?: number;
  filesApplied?: number;
  totalFiles?: number;
}

interface ConversationState {
  // Chat messages
  messages: ChatMessage[];
  
  // Conversation context
  context: ConversationContext;
  
  // Generation state
  generationProgress: GenerationProgress;
  codeApplicationState: CodeApplicationState;
  
  // AI Model
  aiModel: string;
  
  // UI State
  promptInput: string;
  aiChatInput: string;
  
  // Actions - Messages
  addMessage: (content: string, type: MessageType, metadata?: ChatMessageMetadata) => void;
  clearMessages: () => void;
  updateLastMessage: (content: string) => void;
  
  // Actions - Context
  setContext: (context: ConversationContext) => void;
  addScrapedWebsite: (website: ScrapedWebsite) => void;
  addAppliedCode: (code: AppliedCode) => void;
  setLastGeneratedCode: (code: string) => void;
  
  // Actions - Generation
  setGenerationProgress: (progress: Partial<GenerationProgress>) => void;
  resetGenerationProgress: () => void;
  setCodeApplicationState: (state: CodeApplicationState) => void;
  
  // Actions - Input
  setPromptInput: (input: string) => void;
  setAiChatInput: (input: string) => void;
  setAiModel: (model: string) => void;
  
  // Complex actions
  reset: () => void;
}

const initialGenerationProgress: GenerationProgress = {
  isGenerating: false,
  status: '',
  files: [],
  currentFile: '',
  streamedCode: '',
  isStreaming: false,
  isEdit: false,
};

const initialContext: ConversationContext = {
  scrapedWebsites: [],
  generatedComponents: [],
  appliedCode: [],
  currentProject: '',
  lastGeneratedCode: undefined,
};

const initialState = {
  messages: [
    {
      content: 'Welcome! I can help you generate code with full context of your sandbox files and structure. Just start chatting - I\'ll automatically create a sandbox for you if needed!\n\nTip: If you see package errors like "react-router-dom not found", just type "npm install" or "check packages" to automatically install missing packages.',
      type: 'system' as MessageType,
      timestamp: new Date()
    }
  ],
  context: initialContext,
  generationProgress: initialGenerationProgress,
  codeApplicationState: { stage: null } as CodeApplicationState,
  aiModel: 'claude-sonnet-4-20250514',
  promptInput: '',
  aiChatInput: '',
};

export const useConversationStore = create<ConversationState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Message actions
      addMessage: (content, type, metadata) => 
        set(
          (state) => {
            // Deduplicate consecutive identical system messages
            if (type === 'system' && state.messages.length > 0) {
              const lastMessage = state.messages[state.messages.length - 1];
              if (lastMessage.type === 'system' && lastMessage.content === content) {
                return state;
              }
            }
            return {
              messages: [
                ...state.messages,
                { content, type, timestamp: new Date(), metadata }
              ]
            };
          },
          false,
          'addMessage'
        ),
      
      clearMessages: () => set({ messages: [] }, false, 'clearMessages'),
      
      updateLastMessage: (content) =>
        set(
          (state) => {
            if (state.messages.length === 0) return state;
            const messages = [...state.messages];
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content
            };
            return { messages };
          },
          false,
          'updateLastMessage'
        ),
      
      // Context actions
      setContext: (context) => set({ context }, false, 'setContext'),
      
      addScrapedWebsite: (website) =>
        set(
          (state) => ({
            context: {
              ...state.context,
              scrapedWebsites: [...state.context.scrapedWebsites, website]
            }
          }),
          false,
          'addScrapedWebsite'
        ),
      
      addAppliedCode: (code) =>
        set(
          (state) => ({
            context: {
              ...state.context,
              appliedCode: [...state.context.appliedCode, code]
            }
          }),
          false,
          'addAppliedCode'
        ),
      
      setLastGeneratedCode: (code) =>
        set(
          (state) => ({
            context: {
              ...state.context,
              lastGeneratedCode: code
            }
          }),
          false,
          'setLastGeneratedCode'
        ),
      
      // Generation actions
      setGenerationProgress: (progress) =>
        set(
          (state) => ({
            generationProgress: { ...state.generationProgress, ...progress }
          }),
          false,
          'setGenerationProgress'
        ),
      
      resetGenerationProgress: () =>
        set({ generationProgress: initialGenerationProgress }, false, 'resetGenerationProgress'),
      
      setCodeApplicationState: (state) =>
        set({ codeApplicationState: state }, false, 'setCodeApplicationState'),
      
      // Input actions
      setPromptInput: (input) => set({ promptInput: input }, false, 'setPromptInput'),
      setAiChatInput: (input) => set({ aiChatInput: input }, false, 'setAiChatInput'),
      setAiModel: (model) => set({ aiModel: model }, false, 'setAiModel'),
      
      // Reset
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'conversation-store' }
  )
);

// Selector hooks for optimized re-renders
export const useMessages = () => useConversationStore((state) => state.messages);
export const useConversationContext = () => useConversationStore((state) => state.context);
export const useGenerationProgress = () => useConversationStore((state) => state.generationProgress);
export const useCodeApplicationState = () => useConversationStore((state) => state.codeApplicationState);
export const useAiModel = () => useConversationStore((state) => state.aiModel);
export const usePromptInput = () => useConversationStore((state) => state.promptInput);
export const useAiChatInput = () => useConversationStore((state) => state.aiChatInput);

// Action selectors
export const useMessageActions = () => useConversationStore((state) => ({
  addMessage: state.addMessage,
  clearMessages: state.clearMessages,
  updateLastMessage: state.updateLastMessage,
}));

export const useContextActions = () => useConversationStore((state) => ({
  setContext: state.setContext,
  addScrapedWebsite: state.addScrapedWebsite,
  addAppliedCode: state.addAppliedCode,
  setLastGeneratedCode: state.setLastGeneratedCode,
}));

export const useGenerationActions = () => useConversationStore((state) => ({
  setGenerationProgress: state.setGenerationProgress,
  resetGenerationProgress: state.resetGenerationProgress,
  setCodeApplicationState: state.setCodeApplicationState,
}));