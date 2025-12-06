/**
 * Browser Session Manager
 * 
 * Manages Puppeteer browser sessions for AI-driven browser testing.
 * Provides stateful browser sessions that can be controlled by the AI agent.
 */

import puppeteer, { Browser, Page, ConsoleMessage } from 'puppeteer';
import {
  BrowserSession,
  BrowserAction,
  BrowserActionResult,
  CreateSessionOptions,
  SessionInfo,
  ConsoleEntry,
  NetworkEntry,
  BrowserManagerConfig,
  DEFAULT_BROWSER_CONFIG,
} from './types';

/**
 * Console capture script to inject into pages
 */
const CONSOLE_CAPTURE_SCRIPT = `
(function() {
  if (window.__browserTestConsoleCapture) return;
  window.__browserTestConsoleCapture = true;
  
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console)
  };
  
  window.__consoleLogs = [];
  
  const capture = (type) => (...args) => {
    const message = args.map(arg => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    window.__consoleLogs.push({
      type: type,
      message: message,
      timestamp: Date.now()
    });
    
    // Keep buffer from growing too large
    if (window.__consoleLogs.length > 500) {
      window.__consoleLogs = window.__consoleLogs.slice(-400);
    }
    
    // Call original console method
    originalConsole[type](...args);
  };
  
  console.log = capture('log');
  console.warn = capture('warn');
  console.error = capture('error');
  console.info = capture('info');
  console.debug = capture('debug');
  
  // Capture uncaught errors
  window.addEventListener('error', (event) => {
    window.__consoleLogs.push({
      type: 'error',
      message: event.message + ' at ' + event.filename + ':' + event.lineno,
      timestamp: Date.now()
    });
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    window.__consoleLogs.push({
      type: 'error',
      message: 'Unhandled Promise Rejection: ' + String(event.reason),
      timestamp: Date.now()
    });
  });
})();
`;

/**
 * Browser Session Manager class
 * Singleton that manages all browser sessions
 */
class BrowserSessionManager {
  private sessions: Map<string, BrowserSession> = new Map();
  private config: BrowserManagerConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<BrowserManagerConfig> = {}) {
    this.config = { ...DEFAULT_BROWSER_CONFIG, ...config };
    this.startCleanupInterval();
  }

  /**
   * Start the cleanup interval to remove idle sessions
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleSessions();
    }, 60 * 1000);
  }

  /**
   * Clean up sessions that have been idle too long
   */
  private async cleanupIdleSessions(): Promise<void> {
    const now = Date.now();
    const sessionsToRemove: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      const idleTime = now - session.lastAccessed.getTime();
      if (idleTime > this.config.sessionIdleTimeout) {
        sessionsToRemove.push(sessionId);
      }
    }

    for (const sessionId of sessionsToRemove) {
      console.log(`[BrowserSessionManager] Cleaning up idle session: ${sessionId}`);
      await this.closeSession(sessionId);
    }
  }

  /**
   * Create a new browser session
   */
  async createSession(options: CreateSessionOptions = {}): Promise<SessionInfo> {
    // Check session limit
    if (this.sessions.size >= this.config.maxSessions) {
      // Try to clean up idle sessions first
      await this.cleanupIdleSessions();
      
      if (this.sessions.size >= this.config.maxSessions) {
        throw new Error(`Maximum session limit (${this.config.maxSessions}) reached`);
      }
    }

    const sessionId = `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`[BrowserSessionManager] Creating new session: ${sessionId}`);

    try {
      // Launch browser
      const browser = await puppeteer.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1280,800',
        ],
      });

      // Create new page
      const page = await browser.newPage();
      
      // Set viewport
      const viewport = {
        width: options.viewportWidth || this.config.defaultViewport.width,
        height: options.viewportHeight || this.config.defaultViewport.height,
      };
      await page.setViewport(viewport);

      // Set user agent if provided
      if (options.userAgent) {
        await page.setUserAgent(options.userAgent);
      }

      // Create session object
      const session: BrowserSession = {
        sessionId,
        sandboxId: options.sandboxId || null,
        browser,
        page,
        consoleBuffer: [],
        networkBuffer: [],
        lastScreenshot: null,
        currentUrl: 'about:blank',
        currentTitle: '',
        createdAt: new Date(),
        lastAccessed: new Date(),
        status: 'active',
        viewport,
      };

      // Set up console capture
      this.setupConsoleCapture(session);
      
      // Set up network capture
      this.setupNetworkCapture(session);

      // Navigate to initial URL if provided
      if (options.initialUrl) {
        await this.navigateTo(session, options.initialUrl);
      }

      // Store session
      this.sessions.set(sessionId, session);

      console.log(`[BrowserSessionManager] Session created successfully: ${sessionId}`);

      return this.getSessionInfo(session);
    } catch (error) {
      console.error(`[BrowserSessionManager] Failed to create session:`, error);
      throw error;
    }
  }

  /**
   * Set up console message capture for a session
   */
  private setupConsoleCapture(session: BrowserSession): void {
    if (!session.page) return;

    session.page.on('console', (msg: ConsoleMessage) => {
      const entry: ConsoleEntry = {
        type: msg.type() as ConsoleEntry['type'],
        message: msg.text(),
        timestamp: Date.now(),
        url: session.currentUrl,
      };
      
      session.consoleBuffer.push(entry);
      
      // Trim buffer if too large
      if (session.consoleBuffer.length > this.config.maxConsoleBufferSize) {
        session.consoleBuffer = session.consoleBuffer.slice(-this.config.maxConsoleBufferSize + 100);
      }
    });

    session.page.on('pageerror', (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      session.consoleBuffer.push({
        type: 'error',
        message: errorMessage,
        timestamp: Date.now(),
        url: session.currentUrl,
      });
    });
  }

  /**
   * Set up network request capture for a session
   */
  private setupNetworkCapture(session: BrowserSession): void {
    if (!session.page) return;

    session.page.on('request', (request) => {
      const entry: NetworkEntry = {
        type: 'request',
        url: request.url(),
        method: request.method(),
        timestamp: Date.now(),
      };
      
      session.networkBuffer.push(entry);
      
      // Trim buffer if too large
      if (session.networkBuffer.length > this.config.maxNetworkBufferSize) {
        session.networkBuffer = session.networkBuffer.slice(-this.config.maxNetworkBufferSize + 50);
      }
    });

    session.page.on('response', (response) => {
      session.networkBuffer.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        timestamp: Date.now(),
      });
    });

    session.page.on('requestfailed', (request) => {
      session.networkBuffer.push({
        type: 'error',
        url: request.url(),
        error: request.failure()?.errorText || 'Request failed',
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Navigate to a URL
   */
  private async navigateTo(session: BrowserSession, url: string): Promise<void> {
    if (!session.page) {
      throw new Error('No page available');
    }

    await session.page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Inject console capture script
    await session.page.evaluate(CONSOLE_CAPTURE_SCRIPT);
    
    session.currentUrl = session.page.url();
    session.currentTitle = await session.page.title();
  }

  /**
   * Execute a browser action
   */
  async executeAction(sessionId: string, action: BrowserAction): Promise<BrowserActionResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (!session.page || !session.browser) {
      throw new Error('Session browser not available');
    }

    session.lastAccessed = new Date();
    const startTime = Date.now();
    const consoleLogsBefore = session.consoleBuffer.length;
    const networkBefore = session.networkBuffer.length;

    try {
      let evaluateResult: unknown;

      switch (action.type) {
        case 'navigate':
          if (!action.params.url) {
            throw new Error('URL is required for navigate action');
          }
          await this.navigateTo(session, action.params.url);
          break;

        case 'click':
          if (!action.params.selector) {
            throw new Error('Selector is required for click action');
          }
          await session.page.waitForSelector(action.params.selector, { timeout: 10000 });
          await session.page.click(action.params.selector);
          // Wait for potential navigation or updates
          await new Promise(resolve => setTimeout(resolve, 500));
          break;

        case 'type':
          if (!action.params.selector || action.params.text === undefined) {
            throw new Error('Selector and text are required for type action');
          }
          await session.page.waitForSelector(action.params.selector, { timeout: 10000 });
          await session.page.type(action.params.selector, action.params.text);
          break;

        case 'clear':
          if (!action.params.selector) {
            throw new Error('Selector is required for clear action');
          }
          await session.page.waitForSelector(action.params.selector, { timeout: 10000 });
          await session.page.click(action.params.selector, { clickCount: 3 });
          await session.page.keyboard.press('Backspace');
          break;

        case 'hover':
          if (!action.params.selector) {
            throw new Error('Selector is required for hover action');
          }
          await session.page.waitForSelector(action.params.selector, { timeout: 10000 });
          await session.page.hover(action.params.selector);
          break;

        case 'select':
          if (!action.params.selector || action.params.value === undefined) {
            throw new Error('Selector and value are required for select action');
          }
          await session.page.waitForSelector(action.params.selector, { timeout: 10000 });
          await session.page.select(action.params.selector, action.params.value);
          break;

        case 'scroll':
          await session.page.evaluate((x, y) => {
            window.scrollBy(x || 0, y || 0);
          }, action.params.scrollX || 0, action.params.scrollY || 300);
          break;

        case 'wait':
          if (action.params.waitForSelector) {
            await session.page.waitForSelector(action.params.waitForSelector, {
              timeout: action.params.waitMs || 10000
            });
          } else if (action.params.waitMs) {
            await new Promise(resolve => setTimeout(resolve, action.params.waitMs));
          }
          break;

        case 'evaluate':
          if (!action.params.script) {
            throw new Error('Script is required for evaluate action');
          }
          evaluateResult = await session.page.evaluate(action.params.script);
          break;

        case 'goBack':
          await session.page.goBack({ waitUntil: 'networkidle2' });
          break;

        case 'goForward':
          await session.page.goForward({ waitUntil: 'networkidle2' });
          break;

        case 'refresh':
          await session.page.reload({ waitUntil: 'networkidle2' });
          break;

        case 'screenshot':
          // Screenshot is always taken at the end
          break;

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      // Update page info
      session.currentUrl = session.page.url();
      session.currentTitle = await session.page.title();

      // Collect console logs from page
      const pageLogs = await session.page.evaluate(() => {
        const logs = (window as any).__consoleLogs || [];
        (window as any).__consoleLogs = [];
        return logs;
      });
      
      if (Array.isArray(pageLogs)) {
        session.consoleBuffer.push(...pageLogs);
      }

      // Take screenshot
      const screenshotBuffer = await session.page.screenshot({
        type: 'jpeg',
        quality: this.config.screenshotQuality,
        fullPage: action.params.fullPage || false,
        clip: action.params.clip,
      });
      
      const screenshot = `data:image/jpeg;base64,${Buffer.from(screenshotBuffer).toString('base64')}`;
      session.lastScreenshot = screenshot;

      // Get new console logs and network activity since action started
      const newConsoleLogs = session.consoleBuffer.slice(consoleLogsBefore);
      const newNetworkActivity = session.networkBuffer.slice(networkBefore);

      return {
        success: true,
        screenshot,
        consoleLogs: newConsoleLogs,
        networkActivity: newNetworkActivity,
        pageInfo: {
          url: session.currentUrl,
          title: session.currentTitle,
        },
        evaluateResult,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error(`[BrowserSessionManager] Action failed:`, error);
      
      // Try to take a screenshot of the error state
      let screenshot: string | undefined;
      try {
        if (session.page) {
          const screenshotBuffer = await session.page.screenshot({
            type: 'jpeg',
            quality: this.config.screenshotQuality,
          });
          screenshot = `data:image/jpeg;base64,${Buffer.from(screenshotBuffer).toString('base64')}`;
          session.lastScreenshot = screenshot;
        }
      } catch (screenshotError) {
        console.error(`[BrowserSessionManager] Failed to take error screenshot:`, screenshotError);
      }

      return {
        success: false,
        screenshot,
        consoleLogs: session.consoleBuffer.slice(consoleLogsBefore),
        networkActivity: session.networkBuffer.slice(networkBefore),
        error: (error as Error).message,
        pageInfo: {
          url: session.currentUrl,
          title: session.currentTitle,
        },
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): BrowserSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessed = new Date();
    }
    return session;
  }

  /**
   * Get session info (safe for sending to clients)
   */
  getSessionInfo(session: BrowserSession): SessionInfo {
    return {
      sessionId: session.sessionId,
      sandboxId: session.sandboxId,
      status: session.status,
      currentUrl: session.currentUrl,
      currentTitle: session.currentTitle,
      viewport: session.viewport,
      createdAt: session.createdAt.toISOString(),
      lastAccessed: session.lastAccessed.toISOString(),
      consoleLogCount: session.consoleBuffer.length,
      networkRequestCount: session.networkBuffer.length,
      lastScreenshot: session.lastScreenshot || undefined,
      error: session.error,
    };
  }

  /**
   * Get session info by ID
   */
  getSessionInfoById(sessionId: string): SessionInfo | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    session.lastAccessed = new Date();
    return this.getSessionInfo(session);
  }

  /**
   * Get console logs for a session
   */
  getConsoleLogs(sessionId: string, since?: number): ConsoleEntry[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    session.lastAccessed = new Date();
    
    if (since) {
      return session.consoleBuffer.filter(log => log.timestamp > since);
    }
    return [...session.consoleBuffer];
  }

  /**
   * Get network activity for a session
   */
  getNetworkActivity(sessionId: string, since?: number): NetworkEntry[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    session.lastAccessed = new Date();
    
    if (since) {
      return session.networkBuffer.filter(entry => entry.timestamp > since);
    }
    return [...session.networkBuffer];
  }

  /**
   * Take a screenshot of the current page
   */
  async takeScreenshot(sessionId: string, options?: { fullPage?: boolean }): Promise<string | null> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.page) return null;

    session.lastAccessed = new Date();

    try {
      const screenshotBuffer = await session.page.screenshot({
        type: 'jpeg',
        quality: this.config.screenshotQuality,
        fullPage: options?.fullPage || false,
      });
      
      const screenshot = `data:image/jpeg;base64,${Buffer.from(screenshotBuffer).toString('base64')}`;
      session.lastScreenshot = screenshot;
      return screenshot;
    } catch (error) {
      console.error(`[BrowserSessionManager] Failed to take screenshot:`, error);
      return null;
    }
  }

  /**
   * Close a browser session
   */
  async closeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    console.log(`[BrowserSessionManager] Closing session: ${sessionId}`);

    try {
      if (session.browser) {
        await session.browser.close();
      }
    } catch (error) {
      console.error(`[BrowserSessionManager] Error closing browser:`, error);
    }

    session.status = 'closed';
    session.browser = null;
    session.page = null;
    this.sessions.delete(sessionId);

    return true;
  }

  /**
   * Close all sessions
   */
  async closeAllSessions(): Promise<void> {
    console.log(`[BrowserSessionManager] Closing all ${this.sessions.size} sessions`);
    
    const closePromises = Array.from(this.sessions.keys()).map(id => 
      this.closeSession(id).catch(err => 
        console.error(`[BrowserSessionManager] Error closing session ${id}:`, err)
      )
    );
    
    await Promise.all(closePromises);
  }

  /**
   * List all active sessions
   */
  listSessions(): SessionInfo[] {
    return Array.from(this.sessions.values()).map(session => this.getSessionInfo(session));
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Shutdown the manager
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    await this.closeAllSessions();
  }
}

// Export singleton instance
export const browserSessionManager = new BrowserSessionManager();

// Global reference for cleanup
declare global {
  var browserSessionManager: BrowserSessionManager | undefined;
}

// Ensure the global reference points to our singleton
if (typeof global !== 'undefined') {
  global.browserSessionManager = browserSessionManager;
}

export { BrowserSessionManager };
export default browserSessionManager;