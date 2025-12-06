/**
 * Browser Testing Tool - Type Definitions
 * 
 * This module defines the interfaces for the AI browser testing capability,
 * allowing the AI agent to control a browser and receive visual + console feedback.
 */

import type { Browser, Page } from 'puppeteer';

/**
 * Console log entry captured from the browser
 */
export interface ConsoleEntry {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  timestamp: number;
  source?: string;
  lineNumber?: number;
  url?: string;
}

/**
 * Network request entry captured from the browser
 */
export interface NetworkEntry {
  type: 'request' | 'response' | 'error';
  url: string;
  method?: string;
  status?: number;
  timestamp: number;
  error?: string;
}

/**
 * Browser session state
 */
export type BrowserSessionStatus = 'initializing' | 'active' | 'idle' | 'error' | 'closed';

/**
 * Browser session representing a Puppeteer browser instance
 */
export interface BrowserSession {
  /** Unique session identifier */
  sessionId: string;
  
  /** Associated sandbox ID (for connecting to sandbox apps) */
  sandboxId: string | null;
  
  /** Puppeteer browser instance */
  browser: Browser | null;
  
  /** Puppeteer page instance */
  page: Page | null;
  
  /** Buffered console logs */
  consoleBuffer: ConsoleEntry[];
  
  /** Buffered network activity */
  networkBuffer: NetworkEntry[];
  
  /** Last captured screenshot (base64) */
  lastScreenshot: string | null;
  
  /** Current page URL */
  currentUrl: string;
  
  /** Current page title */
  currentTitle: string;
  
  /** Session creation time */
  createdAt: Date;
  
  /** Last activity time */
  lastAccessed: Date;
  
  /** Current session status */
  status: BrowserSessionStatus;
  
  /** Error message if status is 'error' */
  error?: string;
  
  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };
}

/**
 * Browser action types that the AI can request
 */
export type BrowserActionType = 
  | 'navigate'
  | 'click'
  | 'type'
  | 'screenshot'
  | 'scroll'
  | 'wait'
  | 'evaluate'
  | 'hover'
  | 'select'
  | 'clear'
  | 'goBack'
  | 'goForward'
  | 'refresh';

/**
 * Browser action request from the AI
 */
export interface BrowserAction {
  /** Type of action to perform */
  type: BrowserActionType;
  
  /** Action parameters */
  params: {
    /** URL for navigate action */
    url?: string;
    
    /** CSS selector for click, type, hover, select, clear */
    selector?: string;
    
    /** Text to type for type action */
    text?: string;
    
    /** JavaScript code for evaluate action */
    script?: string;
    
    /** Scroll direction and amount */
    scrollX?: number;
    scrollY?: number;
    
    /** Wait duration in milliseconds */
    waitMs?: number;
    
    /** Wait for selector to appear */
    waitForSelector?: string;
    
    /** Option value for select action */
    value?: string;
    
    /** Screenshot options */
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
  };
}

/**
 * Result of a browser action
 */
export interface BrowserActionResult {
  /** Whether the action succeeded */
  success: boolean;
  
  /** Screenshot after action (base64) */
  screenshot?: string;
  
  /** Console logs captured during action */
  consoleLogs: ConsoleEntry[];
  
  /** Network activity during action */
  networkActivity: NetworkEntry[];
  
  /** Error message if action failed */
  error?: string;
  
  /** Current page information */
  pageInfo: {
    url: string;
    title: string;
  };
  
  /** Result of evaluate action */
  evaluateResult?: unknown;
  
  /** Duration of action in milliseconds */
  duration: number;
}

/**
 * Options for creating a new browser session
 */
export interface CreateSessionOptions {
  /** Associated sandbox ID */
  sandboxId?: string;
  
  /** Initial URL to navigate to */
  initialUrl?: string;
  
  /** Viewport width */
  viewportWidth?: number;
  
  /** Viewport height */
  viewportHeight?: number;
  
  /** Whether to run in headless mode */
  headless?: boolean;
  
  /** Custom user agent */
  userAgent?: string;
}

/**
 * Session info returned to clients (without internal browser references)
 */
export interface SessionInfo {
  sessionId: string;
  sandboxId: string | null;
  status: BrowserSessionStatus;
  currentUrl: string;
  currentTitle: string;
  viewport: { width: number; height: number };
  createdAt: string;
  lastAccessed: string;
  consoleLogCount: number;
  networkRequestCount: number;
  lastScreenshot?: string;
  error?: string;
}

/**
 * AI tool call for browser testing
 */
export interface BrowserToolCall {
  tool: 'browser_test';
  action: BrowserActionType;
  params: BrowserAction['params'];
}

/**
 * Configuration for the browser session manager
 */
export interface BrowserManagerConfig {
  /** Maximum concurrent sessions */
  maxSessions: number;
  
  /** Session idle timeout in milliseconds */
  sessionIdleTimeout: number;
  
  /** Maximum console buffer size per session */
  maxConsoleBufferSize: number;
  
  /** Maximum network buffer size per session */
  maxNetworkBufferSize: number;
  
  /** Default viewport dimensions */
  defaultViewport: { width: number; height: number };
  
  /** Whether to run browsers headless */
  headless: boolean;
  
  /** Screenshot quality (0-100) for JPEG */
  screenshotQuality: number;
}

/**
 * Default configuration values
 */
export const DEFAULT_BROWSER_CONFIG: BrowserManagerConfig = {
  maxSessions: 5,
  sessionIdleTimeout: 10 * 60 * 1000, // 10 minutes
  maxConsoleBufferSize: 500,
  maxNetworkBufferSize: 200,
  defaultViewport: { width: 1280, height: 800 },
  headless: true,
  screenshotQuality: 80,
};