'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { appConfig } from '@/config/app.config';
import type { 
  ChatMessage, 
  ConversationContext, 
  LoadingStage, 
  ActiveTab 
} from '../types';
import { useSandbox } from './useSandbox';
import { useCodeGeneration } from './useCodeGeneration';
import { useWebScraping } from './useWebScraping';

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
}

export function useGenerationPage(): GenerationPageState {
  const searchParams = useSearchParams();
  
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
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);
  const [isStartingNewGeneration, setIsStartingNewGeneration] = useState(false);
  const [screenshotCollapsed, setScreenshotCollapsed] = useState(false);
  const [sandboxFiles, setSandboxFiles] = useState<Record<string, string>>({});

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

  // Fetch sandbox files
  const fetchSandboxFiles = useCallback(async () => {
    try {
      const response = await fetch('/api/get-sandbox-files', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSandboxFiles(data.files || {});
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
  const handleSendMessage = useCallback(async () => {
    const message = aiChatInput.trim();
    if (!message) return;
    
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
    
    await sendChatMessage(message, sandboxData, createSandbox);
    
    setTimeout(() => {
      setActiveTab('preview');
    }, 1000);
  }, [aiChatInput, sandboxData, sendChatMessage, createSandbox, addChatMessage]);

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

  // Initialize page
  useEffect(() => {
    let isMounted = true;
    let sandboxCreated = false;

    const initializePage = async () => {
      if (sandboxCreated) return;
      
      // Check for initial prompt from home page (chat-first flow)
      const initialPrompt = sessionStorage.getItem('initialPrompt');
      const autoStartChat = sessionStorage.getItem('autoStartChat');
      const storedModel = sessionStorage.getItem('selectedModel');
      
      // Set model if stored
      if (storedModel) {
        setAiModel(storedModel);
      }
      
      // Clear old conversation
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
        await createSandbox(true);
        
        // Handle chat-first flow - auto-send initial prompt
        if (initialPrompt && autoStartChat === 'true' && isMounted) {
          sessionStorage.removeItem('initialPrompt');
          sessionStorage.removeItem('autoStartChat');
          sessionStorage.removeItem('selectedModel');
          
          // Wait a moment for sandbox to be ready, then send the message
          setTimeout(() => {
            setAiChatInput(initialPrompt);
            // Trigger the chat message after a brief delay
            setTimeout(() => {
              const event = new CustomEvent('autoSendChat', { detail: { message: initialPrompt } });
              window.dispatchEvent(event);
            }, 500);
          }, 1000);
        }
      } catch (error) {
        console.error('[ai-sandbox] Failed to create sandbox:', error);
      }
    };
    
    initializePage();

    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for auto-send chat event
  useEffect(() => {
    const handleAutoSend = (event: CustomEvent) => {
      const message = event.detail?.message;
      if (message && sandboxData) {
        sendChatMessage(message, sandboxData, createSandbox);
      }
    };
    
    window.addEventListener('autoSendChat', handleAutoSend as EventListener);
    return () => window.removeEventListener('autoSendChat', handleAutoSend as EventListener);
  }, [sandboxData, sendChatMessage, createSandbox]);

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
    downloadZip
  };
}