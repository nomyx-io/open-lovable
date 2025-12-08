'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { appConfig } from '@/config/app.config';
import type {
  ChatMessage,
  ConversationContext,
  LoadingStage,
  ActiveTab,
  ScreenshotAttachment
} from '../types';
import { useSandbox } from './useSandbox';
import { useCodeGeneration } from './useCodeGeneration';
import { useWebScraping } from './useWebScraping';
import { useSandboxErrors } from './useSandboxErrors';
import type { SandboxError } from '@/components/HMRErrorDetector';

// Session persistence keys
const SESSION_KEYS = {
  SANDBOX_ID: 'open-lovable-sandbox-id',
  SANDBOX_URL: 'open-lovable-sandbox-url',
  CHAT_MESSAGES: 'open-lovable-chat-messages',
  CONVERSATION_CONTEXT: 'open-lovable-context',
  LAST_SESSION_TIME: 'open-lovable-session-time',
  AI_MODEL: 'open-lovable-ai-model',
};

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export interface GenerationPageState {
  // AI Model
  aiModel: string;
  setAiModel: (model: string) => void;
  
  // Chat
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  aiChatInput: string;
  setAiChatInput: (value: string) => void;
  addChatMessage: (content: string, type: ChatMessage['type'], metadata?: ChatMessage['metadata']) => void;
  
  // Conversation Context
  conversationContext: ConversationContext;
  setConversationContext: React.Dispatch<React.SetStateAction<ConversationContext>>;
  
  // UI State
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  expandedFolders: Set<string>;
  toggleFolder: (folderPath: string) => void;
  selectedFile: string | null;
  setSelectedFile: (file: string | null) => void;
  loadingStage: LoadingStage;
  isStartingNewGeneration: boolean;
  screenshotCollapsed: boolean;
  setScreenshotCollapsed: (value: boolean) => void;
  
  // Sandbox
  sandboxData: any;
  loading: boolean;
  createSandbox: (silent?: boolean) => Promise<any>;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  refreshIframe: () => void;
  
  // Code Generation
  generationProgress: any;
  codeApplicationState: any;
  
  // Web Scraping
  urlScreenshot: string | null;
  isScreenshotLoaded: boolean;
  setIsScreenshotLoaded: (value: boolean) => void;
  isCapturingScreenshot: boolean;
  isPreparingDesign: boolean;
  screenshotError: string | null;
  
  // Actions
  handleSendMessage: () => Promise<void>;
  reapplyLastGeneration: () => Promise<void>;
  downloadZip: () => Promise<void>;
  
  // Error handling
  onErrorDetected: (errors: SandboxError[]) => void;
  onErrorCleared: () => void;
  currentError: SandboxError | null;
  isAutoFixing: boolean;
  hasErrors: boolean;
}

// Helper functions for localStorage
const getStoredSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const lastTime = localStorage.getItem(SESSION_KEYS.LAST_SESSION_TIME);
    if (!lastTime) return null;
    
    const timeDiff = Date.now() - parseInt(lastTime, 10);
    if (timeDiff > SESSION_TIMEOUT) {
      // Session expired, clear it
      clearStoredSession();
      return null;
    }
    
    return {
      sandboxId: localStorage.getItem(SESSION_KEYS.SANDBOX_ID),
      sandboxUrl: localStorage.getItem(SESSION_KEYS.SANDBOX_URL),
      chatMessages: JSON.parse(localStorage.getItem(SESSION_KEYS.CHAT_MESSAGES) || '[]'),
      conversationContext: JSON.parse(localStorage.getItem(SESSION_KEYS.CONVERSATION_CONTEXT) || 'null'),
      aiModel: localStorage.getItem(SESSION_KEYS.AI_MODEL),
      lastSessionTime: parseInt(lastTime, 10),
    };
  } catch (e) {
    console.error('[Session] Failed to parse stored session:', e);
    return null;
  }
};

const saveSessionData = (data: {
  sandboxId?: string;
  sandboxUrl?: string;
  chatMessages?: ChatMessage[];
  conversationContext?: ConversationContext;
  aiModel?: string;
}) => {
  if (typeof window === 'undefined') return;
  try {
    if (data.sandboxId) localStorage.setItem(SESSION_KEYS.SANDBOX_ID, data.sandboxId);
    if (data.sandboxUrl) localStorage.setItem(SESSION_KEYS.SANDBOX_URL, data.sandboxUrl);
    if (data.chatMessages) localStorage.setItem(SESSION_KEYS.CHAT_MESSAGES, JSON.stringify(data.chatMessages));
    if (data.conversationContext) localStorage.setItem(SESSION_KEYS.CONVERSATION_CONTEXT, JSON.stringify(data.conversationContext));
    if (data.aiModel) localStorage.setItem(SESSION_KEYS.AI_MODEL, data.aiModel);
    localStorage.setItem(SESSION_KEYS.LAST_SESSION_TIME, Date.now().toString());
  } catch (e) {
    console.error('[Session] Failed to save session data:', e);
  }
};

const clearStoredSession = () => {
  if (typeof window === 'undefined') return;
  Object.values(SESSION_KEYS).forEach(key => localStorage.removeItem(key));
};

export function useGenerationPage(): GenerationPageState {
  const searchParams = useSearchParams();
  
  // Track if we've initialized from stored session
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  
  // AI Model State
  const [aiModel, setAiModel] = useState(() => {
    const modelParam = searchParams.get('model');
    const storedModel = typeof window !== 'undefined' ? sessionStorage.getItem('selectedModel') : null;
    return appConfig.ai.availableModels.includes(modelParam || '')
      ? modelParam!
      : storedModel && appConfig.ai.availableModels.includes(storedModel)
        ? storedModel
        : appConfig.ai.defaultModel;
  });

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      content: 'Welcome! I\'m your AI assistant. I can help you:\n\n• **Build websites** - Describe what you want to create\n• **Clone existing sites** - Just paste a URL and I\'ll analyze and recreate it\n• **Edit and improve** - Ask me to modify, add features, or fix issues\n\nWhat would you like to build today?',
      type: 'system',
      timestamp: new Date()
    }
  ]);
  const [aiChatInput, setAiChatInput] = useState('');
  
  // Conversation Context
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    scrapedWebsites: [],
    generatedComponents: [],
    appliedCode: [],
    currentProject: '',
    lastGeneratedCode: undefined
  });

  // UI State
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['app', 'src', 'src/components']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loadingStage] = useState<LoadingStage>(null);
  const [isStartingNewGeneration] = useState(false);
  const [screenshotCollapsed, setScreenshotCollapsed] = useState(false);
  const [pendingAutoPrompt, setPendingAutoPrompt] = useState<string | null>(null);

  // Helper Functions
  const addChatMessage = useCallback((
    content: string,
    type: ChatMessage['type'],
    metadata?: ChatMessage['metadata']
  ) => {
    setChatMessages(prev => {
      if (type === 'system' && prev.length > 0) {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.type === 'system' && lastMessage.content === content) {
          return prev;
        }
      }
      return [...prev, { content, type, timestamp: new Date(), metadata }];
    });
  }, []);

  const log = useCallback((message: string, type: 'info' | 'error' | 'command' = 'info') => {
    console.log(`[${type}] ${message}`);
  }, []);

  // Fetch sandbox files - used for refreshing file list after code application
  const fetchSandboxFiles = useCallback(async () => {
    try {
      const response = await fetch('/api/get-sandbox-files', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Files are fetched and can be used for file tree display
          console.log('[fetchSandboxFiles] Fetched files:', Object.keys(data.files || {}).length);
        }
      }
    } catch (error) {
      console.error('[fetchSandboxFiles] Error fetching files:', error);
    }
  }, []);

  // Custom Hooks
  const {
    sandboxData,
    loading,
    createSandbox,
    restoreSandbox,
    iframeRef,
    refreshIframe
  } = useSandbox(aiModel, addChatMessage, log);

  const {
    generationProgress,
    codeApplicationState,
    sendChatMessage,
    applyGeneratedCode
  } = useCodeGeneration(
    aiModel,
    conversationContext,
    setConversationContext,
    chatMessages,
    addChatMessage,
    log,
    iframeRef,
    fetchSandboxFiles
  );

  const {
    urlScreenshot,
    isScreenshotLoaded,
    setIsScreenshotLoaded,
    isCapturingScreenshot,
    screenshotError,
    isPreparingDesign
  } = useWebScraping(addChatMessage, setConversationContext, setActiveTab);

  // Auto-fix handler - sends error context to AI for automatic fixing
  const handleAutoFixRequest = useCallback(async (error: SandboxError, attemptNumber: number) => {
    if (!sandboxData) {
      console.log('[handleAutoFixRequest] No sandbox data, cannot auto-fix');
      return;
    }

    // Generate fix prompt based on error type
    const generateFixPrompt = (err: SandboxError, attempt: number): string => {
      const attemptSuffix = attempt > 1
        ? ` (Attempt ${attempt}/3 - please try a different approach)`
        : '';
      
      switch (err.type) {
        case 'npm-missing':
          return `I'm getting an error: "${err.message}". Please add the missing import or install the package "${err.package || 'unknown'}".${attemptSuffix}`;
        
        case 'syntax-error':
          const fileInfo = err.file ? ` in file ${err.file}` : '';
          const lineInfo = err.line ? ` at line ${err.line}` : '';
          return `There's a syntax error${fileInfo}${lineInfo}: "${err.message}". Please fix this syntax issue.${attemptSuffix}`;
        
        case 'runtime-error':
          return `I'm getting a runtime error: "${err.message}"${err.file ? ` in ${err.file}` : ''}. Please fix this error.${attemptSuffix}`;
        
        case 'build-error':
          return `The build is failing with: "${err.message}"${err.file ? ` in ${err.file}` : ''}. Please fix this build error.${attemptSuffix}`;
        
        default:
          return `I'm getting an error: "${err.message}". Please investigate and fix this issue.${attemptSuffix}`;
      }
    };

    const fixPrompt = generateFixPrompt(error, attemptNumber);
    
    console.log('[handleAutoFixRequest] Sending auto-fix prompt:', fixPrompt);
    
    // Use the existing sendChatMessage to request a fix
    await sendChatMessage(fixPrompt, sandboxData, createSandbox);
  }, [sandboxData, sendChatMessage, createSandbox]);

  // Error handling hook
  const {
    errors: sandboxErrors,
    hasErrors,
    currentError,
    isAutoFixing,
    handleErrorDetected,
    handleErrorCleared,
    clearErrors
  } = useSandboxErrors({
    enabled: true,
    maxAutoFixAttempts: 3,
    autoFixDelay: 3000, // Wait 3 seconds before auto-fixing
    onAutoFixRequest: handleAutoFixRequest,
    addChatMessage
  });

  // Toggle folder in file explorer
  const toggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(folderPath)) {
        newExpanded.delete(folderPath);
      } else {
        newExpanded.add(folderPath);
      }
      return newExpanded;
    });
  }, []);

  // Handle chat message submission
  const handleSendMessage = useCallback(async (screenshot?: ScreenshotAttachment | null) => {
    const message = aiChatInput.trim();
    if (!message && !screenshot) return;
    
    setAiChatInput('');
    
    // Check for special commands
    const lowerMessage = message.toLowerCase().trim();
    if (lowerMessage === 'check packages' || lowerMessage === 'install packages' || lowerMessage === 'npm install') {
      if (!sandboxData) {
        addChatMessage('The sandbox is still being set up. Please wait for the generation to complete, then try again.', 'system');
        return;
      }
      addChatMessage('Checking packages... Sandbox is ready with Vite configuration.', 'system');
      return;
    }
    
    // Send the chat message (the hook handles adding the message to chat)
    await sendChatMessage(message, sandboxData, createSandbox, screenshot);
    
    setTimeout(() => {
      setActiveTab('preview');
    }, 1000);
  }, [aiChatInput, sandboxData, sendChatMessage, createSandbox, addChatMessage, setActiveTab]);

  // Re-apply last generation
  const reapplyLastGeneration = useCallback(async () => {
    if (!conversationContext.lastGeneratedCode) {
      addChatMessage('No previous generation to re-apply', 'system');
      return;
    }
    
    if (!sandboxData) {
      addChatMessage('Please create a sandbox first', 'system');
      return;
    }
    
    addChatMessage('Re-applying last generation...', 'system');
    const isEdit = conversationContext.appliedCode.length > 0;
    await applyGeneratedCode(conversationContext.lastGeneratedCode, isEdit, sandboxData);
  }, [conversationContext, sandboxData, addChatMessage, applyGeneratedCode]);

  // Download as ZIP
  const downloadZip = useCallback(async () => {
    if (!sandboxData) {
      addChatMessage('Please wait for the sandbox to be created before downloading.', 'system');
      return;
    }
    
    addChatMessage('Creating ZIP file...', 'system');
    
    try {
      const response = await fetch('/api/create-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const link = document.createElement('a');
        link.href = data.dataUrl;
        link.download = data.fileName || 'project.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addChatMessage('Download complete!', 'system');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      addChatMessage(`Failed to create ZIP: ${error.message}`, 'system');
    }
  }, [sandboxData, addChatMessage]);

  // Restore session from localStorage on mount
  useEffect(() => {
    if (hasInitialized) return;
    
    const storedSession = getStoredSession();
    if (storedSession) {
      console.log('[useGenerationPage] Found stored session, attempting to restore...');
      setIsRestoringSession(true);
      
      // Restore state from storage
      if (storedSession.chatMessages && storedSession.chatMessages.length > 0) {
        // Parse dates back to Date objects
        const messages = storedSession.chatMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setChatMessages(messages);
      }
      
      if (storedSession.conversationContext) {
        const ctx = storedSession.conversationContext;
        // Parse dates in the context
        const parsedContext: ConversationContext = {
          ...ctx,
          scrapedWebsites: (ctx.scrapedWebsites || []).map((w: any) => ({
            ...w,
            timestamp: new Date(w.timestamp)
          })),
          appliedCode: (ctx.appliedCode || []).map((c: any) => ({
            ...c,
            timestamp: new Date(c.timestamp)
          })),
        };
        setConversationContext(parsedContext);
      }
      
      if (storedSession.aiModel) {
        setAiModel(storedSession.aiModel);
      }
      
      setIsRestoringSession(false);
    }
    
    setHasInitialized(true);
  }, [hasInitialized]);

  // Initialize page
  useEffect(() => {
    if (!hasInitialized) return;
    
    let isMounted = true;
    let sandboxCreated = false;

    const initializePage = async () => {
      if (sandboxCreated) return;
      
      // Check for existing sandbox in storage
      const storedSession = getStoredSession();
      if (storedSession?.sandboxId && storedSession?.sandboxUrl) {
        // Try to restore the sandbox
        console.log('[useGenerationPage] Found stored session, attempting restore...');
        const restored = await restoreSandbox(storedSession.sandboxId, storedSession.sandboxUrl);
        
        if (restored) {
          console.log('[useGenerationPage] Sandbox restored successfully');
          addChatMessage('🔄 Restored your previous session. Your work is preserved!', 'system');
          sandboxCreated = true;
          // Refresh session time
          saveSessionData({ sandboxId: storedSession.sandboxId, sandboxUrl: storedSession.sandboxUrl });
          return;
        } else {
          console.log('[useGenerationPage] Previous sandbox is no longer alive, creating new one');
          // Clear the old session since it's no longer valid
          clearStoredSession();
        }
      }
      
      // Check for initial prompt from home page (chat-first flow)
      const initialPrompt = sessionStorage.getItem('initialPrompt');
      const autoStartChat = sessionStorage.getItem('autoStartChat');
      const storedModel = sessionStorage.getItem('selectedModel');
      
      // Set model if stored
      if (storedModel) {
        setAiModel(storedModel);
      }
      
      // Clear old conversation if starting fresh
      try {
        await fetch('/api/conversation-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear-old' })
        });
      } catch (error) {
        console.error('[ai-sandbox] Failed to clear old conversation:', error);
      }
      
      if (!isMounted) return;

      try {
        sandboxCreated = true;
        const result = await createSandbox(true);
        
        // Store sandbox info for session persistence
        if (result?.sandboxId && result?.url) {
          saveSessionData({ sandboxId: result.sandboxId, sandboxUrl: result.url });
        }
        
        // Handle chat-first flow - queue initial prompt
        if (initialPrompt && autoStartChat === 'true' && isMounted) {
          sessionStorage.removeItem('initialPrompt');
          sessionStorage.removeItem('autoStartChat');
          sessionStorage.removeItem('selectedModel');
          
          setAiChatInput(initialPrompt);
          setPendingAutoPrompt(initialPrompt);
        }
      } catch (error) {
        console.error('[ai-sandbox] Failed to create sandbox:', error);
      }
    };
    
    initializePage();

    return () => {
      isMounted = false;
    };
  }, [hasInitialized]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Persist chat messages and context when they change
  useEffect(() => {
    if (!hasInitialized || chatMessages.length <= 1) return;
    saveSessionData({ chatMessages });
  }, [hasInitialized, chatMessages]);
  
  useEffect(() => {
    if (!hasInitialized) return;
    saveSessionData({ conversationContext });
  }, [hasInitialized, conversationContext]);
  
  useEffect(() => {
    if (!hasInitialized) return;
    saveSessionData({ aiModel });
  }, [hasInitialized, aiModel]);
  
  // Update session time periodically while page is active
  useEffect(() => {
    if (!sandboxData) return;
    
    // Store sandbox info when we get it
    if (sandboxData.sandboxId && sandboxData.url) {
      saveSessionData({ sandboxId: sandboxData.sandboxId, sandboxUrl: sandboxData.url });
    }
    
    // Update session time every minute to keep it fresh
    const interval = setInterval(() => {
      saveSessionData({});
    }, 60000);
    
    return () => clearInterval(interval);
  }, [sandboxData]);

  // Handle pending auto-prompt when sandbox is ready
  useEffect(() => {
    if (pendingAutoPrompt && sandboxData) {
      // Clear pending prompt first to avoid double sending
      setPendingAutoPrompt(null);
      
      // Send the message
      sendChatMessage(pendingAutoPrompt, sandboxData, createSandbox);
    }
  }, [pendingAutoPrompt, sandboxData, sendChatMessage, createSandbox]);

  // Clear errors when generation completes successfully
  useEffect(() => {
    if (!generationProgress.isGenerating && codeApplicationState.stage === 'complete') {
      // Give a short delay to allow iframe to update
      const timer = setTimeout(() => {
        clearErrors();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [generationProgress.isGenerating, codeApplicationState.stage, clearErrors]);

  return {
    // AI Model
    aiModel,
    setAiModel,
    
    // Chat
    chatMessages,
    setChatMessages,
    aiChatInput,
    setAiChatInput,
    addChatMessage,
    
    // Conversation Context
    conversationContext,
    setConversationContext,
    
    // UI State
    activeTab,
    setActiveTab,
    expandedFolders,
    toggleFolder,
    selectedFile,
    setSelectedFile,
    loadingStage,
    isStartingNewGeneration,
    screenshotCollapsed,
    setScreenshotCollapsed,
    
    // Sandbox
    sandboxData,
    loading,
    createSandbox,
    iframeRef,
    refreshIframe,
    
    // Code Generation
    generationProgress,
    codeApplicationState,
    
    // Web Scraping
    urlScreenshot,
    isScreenshotLoaded,
    setIsScreenshotLoaded,
    isCapturingScreenshot,
    isPreparingDesign,
    screenshotError,
    
    // Actions
    handleSendMessage,
    reapplyLastGeneration,
    downloadZip,
    
    // Error handling
    onErrorDetected: handleErrorDetected,
    onErrorCleared: handleErrorCleared,
    currentError,
    isAutoFixing,
    hasErrors
  };
}