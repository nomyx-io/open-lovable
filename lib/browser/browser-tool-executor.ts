/**
 * Browser Tool Executor
 * 
 * Parses and executes browser_test tool calls from AI responses.
 */

import { browserSessionManager } from './browser-session-manager';
import type { BrowserAction, BrowserActionResult, BrowserActionType, SessionInfo } from './types';

/**
 * Parsed browser tool call from AI response
 */
export interface ParsedBrowserToolCall {
  action: BrowserActionType;
  params: {
    url?: string;
    selector?: string;
    text?: string;
    script?: string;
    scrollX?: number;
    scrollY?: number;
    waitMs?: number;
    waitForSelector?: string;
    value?: string;
    fullPage?: boolean;
  };
  rawMatch: string;
}

/**
 * Result of browser tool execution with formatted response for AI
 */
export interface BrowserToolExecutionResult {
  success: boolean;
  sessionId: string;
  action: BrowserActionType;
  result: BrowserActionResult;
  formattedResponse: string;
}

/**
 * Browser Tool Executor class
 */
class BrowserToolExecutor {
  private activeSessionId: string | null = null;

  /**
   * Parse browser_test tags from AI response
   */
  parseToolCalls(content: string): ParsedBrowserToolCall[] {
    const calls: ParsedBrowserToolCall[] = [];
    
    // Match self-closing tags: <browser_test action="..." ... />
    const selfClosingRegex = /<browser_test\s+([^>]*?)\/>/g;
    
    // Match regular tags: <browser_test action="...">...</browser_test>
    const regularRegex = /<browser_test\s+([^>]*?)>([^<]*?)<\/browser_test>/g;
    
    // Process self-closing tags
    let match;
    while ((match = selfClosingRegex.exec(content)) !== null) {
      const attributesStr = match[1];
      const parsed = this.parseAttributes(attributesStr);
      if (parsed) {
        calls.push({
          ...parsed,
          rawMatch: match[0],
        });
      }
    }
    
    // Process regular tags
    while ((match = regularRegex.exec(content)) !== null) {
      const attributesStr = match[1];
      const parsed = this.parseAttributes(attributesStr);
      if (parsed) {
        calls.push({
          ...parsed,
          rawMatch: match[0],
        });
      }
    }
    
    return calls;
  }

  /**
   * Parse attributes from a tag
   */
  private parseAttributes(attributesStr: string): Omit<ParsedBrowserToolCall, 'rawMatch'> | null {
    const attrs: Record<string, string> = {};
    
    // Match key="value" pairs
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }
    
    // Action is required
    if (!attrs.action) {
      return null;
    }
    
    const action = attrs.action as BrowserActionType;
    
    return {
      action,
      params: {
        url: attrs.url,
        selector: attrs.selector,
        text: attrs.text,
        script: attrs.script,
        scrollX: attrs.scrollX ? parseInt(attrs.scrollX, 10) : undefined,
        scrollY: attrs.scrollY ? parseInt(attrs.scrollY, 10) : undefined,
        waitMs: attrs.waitMs ? parseInt(attrs.waitMs, 10) : undefined,
        waitForSelector: attrs.waitForSelector,
        value: attrs.value,
        fullPage: attrs.fullPage === 'true',
      },
    };
  }

  /**
   * Execute a browser tool call
   */
  async executeToolCall(
    toolCall: ParsedBrowserToolCall,
    sandboxUrl?: string
  ): Promise<BrowserToolExecutionResult> {
    try {
      // Ensure we have a session
      if (!this.activeSessionId) {
        const sessionInfo = await browserSessionManager.createSession({
          initialUrl: sandboxUrl,
        });
        this.activeSessionId = sessionInfo.sessionId;
      }
      
      // Build the browser action
      const browserAction: BrowserAction = {
        type: toolCall.action,
        params: { ...toolCall.params },
      };
      
      // Handle relative URLs for navigate action
      if (toolCall.action === 'navigate' && toolCall.params.url && sandboxUrl) {
        if (toolCall.params.url.startsWith('/')) {
          browserAction.params.url = sandboxUrl + toolCall.params.url;
        } else if (!toolCall.params.url.startsWith('http')) {
          browserAction.params.url = sandboxUrl + '/' + toolCall.params.url;
        }
      }
      
      // Execute the action
      const result = await browserSessionManager.executeAction(
        this.activeSessionId,
        browserAction
      );
      
      // Format response for AI
      const formattedResponse = this.formatResultForAI(toolCall.action, result);
      
      return {
        success: result.success,
        sessionId: this.activeSessionId,
        action: toolCall.action,
        result,
        formattedResponse,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      return {
        success: false,
        sessionId: this.activeSessionId || 'none',
        action: toolCall.action,
        result: {
          success: false,
          error: errorMessage,
          consoleLogs: [],
          networkActivity: [],
          pageInfo: { url: '', title: '' },
          duration: 0,
        },
        formattedResponse: `Browser action "${toolCall.action}" failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Format the result for AI consumption
   */
  private formatResultForAI(action: BrowserActionType, result: BrowserActionResult): string {
    const parts: string[] = [];
    
    // Status
    if (result.success) {
      parts.push(`Browser action "${action}" completed successfully in ${result.duration}ms.`);
    } else {
      parts.push(`Browser action "${action}" failed: ${result.error}`);
    }
    
    // Page info
    parts.push(`\nCurrent page: ${result.pageInfo.title || 'Untitled'}`);
    parts.push(`URL: ${result.pageInfo.url}`);
    
    // Console logs
    if (result.consoleLogs.length > 0) {
      parts.push('\nConsole output:');
      const recentLogs = result.consoleLogs.slice(-10);
      for (const log of recentLogs) {
        const prefix = log.type === 'error' ? '[ERROR]' : 
                      log.type === 'warn' ? '[WARN]' : 
                      `[${log.type.toUpperCase()}]`;
        parts.push(`  ${prefix} ${log.message}`);
      }
      if (result.consoleLogs.length > 10) {
        parts.push(`  ... and ${result.consoleLogs.length - 10} more log entries`);
      }
    }
    
    // Evaluate result
    if (action === 'evaluate' && result.evaluateResult !== undefined) {
      parts.push(`\nEvaluation result: ${JSON.stringify(result.evaluateResult)}`);
    }
    
    // Screenshot indicator
    if (result.screenshot) {
      parts.push('\n[Screenshot captured - see attached image]');
    }
    
    return parts.join('\n');
  }

  /**
   * Execute all browser tool calls in content
   */
  async executeAllToolCalls(
    content: string,
    sandboxUrl?: string
  ): Promise<{
    toolCalls: ParsedBrowserToolCall[];
    results: BrowserToolExecutionResult[];
    screenshots: string[];
  }> {
    const toolCalls = this.parseToolCalls(content);
    const results: BrowserToolExecutionResult[] = [];
    const screenshots: string[] = [];
    
    for (const toolCall of toolCalls) {
      const result = await this.executeToolCall(toolCall, sandboxUrl);
      results.push(result);
      
      if (result.result.screenshot) {
        screenshots.push(result.result.screenshot);
      }
    }
    
    return { toolCalls, results, screenshots };
  }

  /**
   * Get the active session ID
   */
  getActiveSessionId(): string | null {
    return this.activeSessionId;
  }

  /**
   * Set the active session ID
   */
  setActiveSessionId(sessionId: string | null): void {
    this.activeSessionId = sessionId;
  }

  /**
   * Get the active session info
   */
  getActiveSessionInfo(): SessionInfo | null {
    if (!this.activeSessionId) return null;
    return browserSessionManager.getSessionInfoById(this.activeSessionId);
  }

  /**
   * Close the active session
   */
  async closeActiveSession(): Promise<boolean> {
    if (!this.activeSessionId) return false;
    
    const closed = await browserSessionManager.closeSession(this.activeSessionId);
    if (closed) {
      this.activeSessionId = null;
    }
    return closed;
  }

  /**
   * Reset to a new session (close current and clear reference)
   */
  async resetSession(): Promise<void> {
    await this.closeActiveSession();
    this.activeSessionId = null;
  }
}

// Export singleton instance
export const browserToolExecutor = new BrowserToolExecutor();

export { BrowserToolExecutor };
export default browserToolExecutor;