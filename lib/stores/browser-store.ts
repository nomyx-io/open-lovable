/**
 * Browser Testing Store
 * 
 * Zustand store for managing browser testing session state.
 */

import { create } from 'zustand';
import type { SessionInfo, ConsoleEntry, BrowserActionResult } from '@/lib/browser';

interface BrowserTestResult {
  action: string;
  success: boolean;
  screenshot?: string;
  consoleLogs: ConsoleEntry[];
  pageInfo: {
    url: string;
    title: string;
  };
  error?: string;
  timestamp: number;
}

interface BrowserStore {
  // Session state
  session: SessionInfo | null;
  isSessionLoading: boolean;
  sessionError: string | null;
  
  // Screenshot state
  currentScreenshot: string | null;
  screenshotHistory: string[];
  
  // Console logs
  consoleLogs: ConsoleEntry[];
  
  // Test results
  testResults: BrowserTestResult[];
  
  // UI state
  isPanelOpen: boolean;
  isConsoleExpanded: boolean;
  
  // Actions
  setSession: (session: SessionInfo | null) => void;
  setSessionLoading: (loading: boolean) => void;
  setSessionError: (error: string | null) => void;
  setScreenshot: (screenshot: string) => void;
  addConsoleLogs: (logs: ConsoleEntry[]) => void;
  clearConsoleLogs: () => void;
  addTestResult: (result: BrowserTestResult) => void;
  clearTestResults: () => void;
  setPanelOpen: (open: boolean) => void;
  setConsoleExpanded: (expanded: boolean) => void;
  reset: () => void;
}

const initialState = {
  session: null,
  isSessionLoading: false,
  sessionError: null,
  currentScreenshot: null,
  screenshotHistory: [],
  consoleLogs: [],
  testResults: [],
  isPanelOpen: false,
  isConsoleExpanded: true,
};

export const useBrowserStore = create<BrowserStore>((set, get) => ({
  ...initialState,
  
  setSession: (session) => set({ session, sessionError: null }),
  
  setSessionLoading: (isSessionLoading) => set({ isSessionLoading }),
  
  setSessionError: (sessionError) => set({ sessionError, isSessionLoading: false }),
  
  setScreenshot: (screenshot) => set((state) => ({
    currentScreenshot: screenshot,
    screenshotHistory: [...state.screenshotHistory.slice(-9), screenshot], // Keep last 10
  })),
  
  addConsoleLogs: (logs) => set((state) => ({
    consoleLogs: [...state.consoleLogs, ...logs].slice(-500), // Keep last 500
  })),
  
  clearConsoleLogs: () => set({ consoleLogs: [] }),
  
  addTestResult: (result) => set((state) => ({
    testResults: [...state.testResults, result].slice(-50), // Keep last 50
  })),
  
  clearTestResults: () => set({ testResults: [] }),
  
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  
  setConsoleExpanded: (isConsoleExpanded) => set({ isConsoleExpanded }),
  
  reset: () => set(initialState),
}));

/**
 * Browser Testing API client
 */
export const browserApi = {
  /**
   * Create a new browser session
   */
  async createSession(options: {
    sandboxUrl?: string;
    sandboxId?: string;
  }): Promise<SessionInfo> {
    const response = await fetch('/api/browser/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initialUrl: options.sandboxUrl,
        sandboxId: options.sandboxId,
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create session');
    }
    
    return data.session;
  },
  
  /**
   * Close a browser session
   */
  async closeSession(sessionId: string): Promise<void> {
    const response = await fetch(`/api/browser/session/${sessionId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to close session');
    }
  },
  
  /**
   * Execute a browser action
   */
  async executeAction(
    sessionId: string,
    action: string,
    params: Record<string, unknown> = {}
  ): Promise<BrowserActionResult> {
    const response = await fetch('/api/browser/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, action, params }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Action failed');
    }
    
    return data.result;
  },
  
  /**
   * Take a screenshot
   */
  async takeScreenshot(sessionId: string): Promise<string> {
    const response = await fetch('/api/browser/screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to take screenshot');
    }
    
    return data.screenshot;
  },
  
  /**
   * Get console logs
   */
  async getConsoleLogs(sessionId: string, since?: number): Promise<ConsoleEntry[]> {
    const url = new URL('/api/browser/console', window.location.origin);
    url.searchParams.set('sessionId', sessionId);
    if (since) {
      url.searchParams.set('since', since.toString());
    }
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get console logs');
    }
    
    return data.logs;
  },
  
  /**
   * Execute browser tool calls from AI content
   */
  async executeToolCalls(
    content: string,
    sandboxUrl?: string,
    sessionId?: string
  ): Promise<{
    toolCalls: Array<{ action: string; params: Record<string, unknown> }>;
    results: Array<{
      success: boolean;
      action: string;
      error?: string;
      pageInfo: { url: string; title: string };
      consoleLogs: ConsoleEntry[];
    }>;
    screenshots: string[];
    sessionId: string;
  }> {
    const response = await fetch('/api/browser/execute-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sandboxUrl, sessionId }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to execute tool calls');
    }
    
    return {
      toolCalls: data.toolCalls,
      results: data.results,
      screenshots: data.screenshots,
      sessionId: data.sessionId,
    };
  },
};

export default useBrowserStore;