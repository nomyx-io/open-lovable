/**
 * Zustand State Stores
 * 
 * Centralized state management using Zustand with devtools integration.
 * 
 * Usage:
 * ```tsx
 * import { useSandboxStore, useConversationStore } from '@/lib/stores';
 * 
 * // Use the full store
 * const sandboxData = useSandboxStore((state) => state.sandboxData);
 * 
 * // Or use selector hooks for optimized re-renders
 * import { useSandboxData, useMessages } from '@/lib/stores';
 * const sandboxData = useSandboxData();
 * const messages = useMessages();
 * ```
 */

// Sandbox Store
export {
  useSandboxStore,
  useSandboxData,
  useSandboxLoading,
  useSandboxStatus,
  useSandboxFiles,
  useSandboxActions,
  type SandboxData,
  type SandboxFile,
} from './sandbox-store';

// Conversation Store
export {
  useConversationStore,
  useMessages,
  useConversationContext,
  useGenerationProgress,
  useCodeApplicationState,
  useAiModel,
  usePromptInput,
  useAiChatInput,
  useMessageActions,
  useContextActions,
  useGenerationActions,
  type MessageType,
  type ChatMessage,
  type ChatMessageMetadata,
  type GeneratedFile,
  type ScrapedWebsite,
  type AppliedCode,
  type ConversationContext,
  type GenerationProgress,
  type CodeApplicationStage,
  type CodeApplicationState,
} from './conversation-store';

// Browser Testing Store
export {
  useBrowserStore,
  browserApi,
} from './browser-store';

// GitHub Store
export {
  useGitHubStore,
  useCurrentProject,
  useSyncState,
  usePendingChanges,
  useGitHubActions,
} from './github-store';