import { useEffect, useRef, useCallback } from 'react';

export interface SandboxError {
  type: 'npm-missing' | 'syntax-error' | 'runtime-error' | 'build-error' | 'unknown';
  message: string;
  package?: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
  rawError?: string;
  timestamp: number;
}

interface HMRErrorDetectorProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  sandboxUrl?: string;
  onErrorDetected: (errors: SandboxError[]) => void;
  onErrorCleared?: () => void;
  enabled?: boolean;
  pollBackend?: boolean; // Whether to poll backend API for errors
}

export default function HMRErrorDetector({
  iframeRef,
  sandboxUrl,
  onErrorDetected,
  onErrorCleared,
  enabled = true,
  pollBackend = true
}: HMRErrorDetectorProps) {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const backendPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastErrorRef = useRef<string | null>(null);
  const errorClearedRef = useRef<boolean>(false);

  // Parse error details from Vite error overlay
  const parseViteError = useCallback((errorText: string, fileElement?: Element | null): SandboxError => {
    const timestamp = Date.now();
    
    // Parse import/resolution errors
    const importMatch = errorText.match(/Failed to resolve import "([^"]+)"/);
    if (importMatch) {
      const packageName = importMatch[1];
      if (!packageName.startsWith('.') && !packageName.startsWith('/')) {
        // Extract base package name (handle scoped packages)
        let finalPackage = packageName;
        if (packageName.startsWith('@')) {
          const parts = packageName.split('/');
          finalPackage = parts.length >= 2 ? parts.slice(0, 2).join('/') : packageName;
        } else {
          finalPackage = packageName.split('/')[0];
        }
        
        return {
          type: 'npm-missing',
          message: `Failed to resolve import "${packageName}"`,
          package: finalPackage,
          rawError: errorText,
          timestamp
        };
      }
    }
    
    // Parse syntax errors (e.g., "Unterminated regular expression")
    const syntaxPatterns = [
      /Unterminated (regular expression|string|template literal)/i,
      /Unexpected token/i,
      /Unexpected end of input/i,
      /Invalid or unexpected token/i,
      /Missing semicolon/i,
      /Unexpected identifier/i,
      /SyntaxError:/i,
      /Parse error:/i
    ];
    
    for (const pattern of syntaxPatterns) {
      if (pattern.test(errorText)) {
        // Try to extract file and line info
        const fileMatch = errorText.match(/(?:at|in)\s+([^\s:]+):(\d+)(?::(\d+))?/);
        const file = fileMatch?.[1] || fileElement?.textContent || undefined;
        const line = fileMatch?.[2] ? parseInt(fileMatch[2], 10) : undefined;
        const column = fileMatch?.[3] ? parseInt(fileMatch[3], 10) : undefined;
        
        return {
          type: 'syntax-error',
          message: errorText.split('\n')[0].trim(),
          file,
          line,
          column,
          rawError: errorText,
          timestamp
        };
      }
    }
    
    // Parse runtime errors
    const runtimePatterns = [
      /TypeError:/i,
      /ReferenceError:/i,
      /RangeError:/i,
      /is not defined/i,
      /Cannot read propert/i,
      /undefined is not/i,
      /null is not/i
    ];
    
    for (const pattern of runtimePatterns) {
      if (pattern.test(errorText)) {
        const fileMatch = errorText.match(/(?:at|in)\s+([^\s:]+):(\d+)(?::(\d+))?/);
        return {
          type: 'runtime-error',
          message: errorText.split('\n')[0].trim(),
          file: fileMatch?.[1],
          line: fileMatch?.[2] ? parseInt(fileMatch[2], 10) : undefined,
          column: fileMatch?.[3] ? parseInt(fileMatch[3], 10) : undefined,
          stack: errorText,
          rawError: errorText,
          timestamp
        };
      }
    }
    
    // Parse build/transform errors
    const buildPatterns = [
      /Transform failed/i,
      /Build failed/i,
      /Internal server error/i,
      /Pre-transform error/i,
      /\[vite\]/i,
      /\[plugin:/i
    ];
    
    for (const pattern of buildPatterns) {
      if (pattern.test(errorText)) {
        const fileMatch = errorText.match(/(?:at|in|file:)\s*([^\s:]+):(\d+)(?::(\d+))?/);
        return {
          type: 'build-error',
          message: errorText.split('\n')[0].trim(),
          file: fileMatch?.[1],
          line: fileMatch?.[2] ? parseInt(fileMatch[2], 10) : undefined,
          column: fileMatch?.[3] ? parseInt(fileMatch[3], 10) : undefined,
          rawError: errorText,
          timestamp
        };
      }
    }
    
    // Default: unknown error type
    return {
      type: 'unknown',
      message: errorText.split('\n')[0].trim() || 'Unknown error occurred',
      rawError: errorText,
      timestamp
    };
  }, []);

  // Poll backend API for Vite logs/errors
  const pollBackendForErrors = useCallback(async () => {
    if (!enabled || !pollBackend) return;
    
    try {
      const response = await fetch('/api/monitor-vite-logs');
      const data = await response.json();
      
      if (data.success && data.hasErrors && data.errors.length > 0) {
        const errors: SandboxError[] = data.errors.map((err: any) => ({
          type: err.type || 'build-error',
          message: err.message || 'Unknown error',
          package: err.package,
          file: err.file,
          line: err.line,
          column: err.column,
          rawError: err.rawError,
          timestamp: Date.now()
        }));
        
        // Check if this is a new error
        const errorHash = errors.map(e => `${e.type}:${e.message}`).join('|');
        if (errorHash !== lastErrorRef.current) {
          lastErrorRef.current = errorHash;
          errorClearedRef.current = false;
          console.log('[HMRErrorDetector] Backend detected errors:', errors);
          onErrorDetected(errors);
        }
      } else if (lastErrorRef.current && !errorClearedRef.current) {
        // No errors from backend, clear if we had errors before
        lastErrorRef.current = null;
        errorClearedRef.current = true;
        console.log('[HMRErrorDetector] Backend reports no errors');
        onErrorCleared?.();
      }
    } catch (e) {
      // API error - silent fail
      console.debug('[HMRErrorDetector] Backend poll failed:', e);
    }
  }, [enabled, pollBackend, onErrorDetected, onErrorCleared]);

  // Check for errors in the iframe
  const checkForErrors = useCallback(() => {
    if (!iframeRef.current || !enabled) return;

    try {
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) return;

      // Check for Vite error overlay
      const errorOverlay = iframeDoc.querySelector('vite-error-overlay');
      
      if (errorOverlay) {
        // Try to extract error message from shadow DOM
        const shadowRoot = errorOverlay.shadowRoot;
        if (shadowRoot) {
          const messageElement = shadowRoot.querySelector('.message-body');
          const fileElement = shadowRoot.querySelector('.file');
          
          if (messageElement) {
            const errorText = messageElement.textContent || '';
            const errorHash = `${errorText}`;
            
            // Only report if this is a new error
            if (errorHash !== lastErrorRef.current) {
              lastErrorRef.current = errorHash;
              errorClearedRef.current = false;
              
              const error = parseViteError(errorText, fileElement);
              console.log('[HMRErrorDetector] Detected error:', error);
              onErrorDetected([error]);
            }
          }
        }
      } else {
        // Check for React error boundary overlay
        const reactErrorOverlay = iframeDoc.querySelector('[data-reactroot] .error-boundary');
        
        if (reactErrorOverlay) {
          const errorText = reactErrorOverlay.textContent || '';
          const errorHash = `${errorText}`;
          
          if (errorHash !== lastErrorRef.current) {
            lastErrorRef.current = errorHash;
            errorClearedRef.current = false;
            
            const error = parseViteError(errorText);
            console.log('[HMRErrorDetector] Detected React error:', error);
            onErrorDetected([error]);
          }
        } else if (lastErrorRef.current && !errorClearedRef.current) {
          // Error was cleared
          lastErrorRef.current = null;
          errorClearedRef.current = true;
          console.log('[HMRErrorDetector] Error cleared');
          onErrorCleared?.();
        }
      }
    } catch (e) {
      // Cross-origin errors are expected when sandbox is on different origin
      // Try alternative approach using postMessage
    }
  }, [iframeRef, enabled, parseViteError, onErrorDetected, onErrorCleared]);

  // Listen for postMessage errors from the sandbox
  useEffect(() => {
    if (!enabled) return;

    const handleMessage = (event: MessageEvent) => {
      // Verify origin if sandboxUrl is provided
      if (sandboxUrl) {
        try {
          const sandboxOrigin = new URL(sandboxUrl).origin;
          if (event.origin !== sandboxOrigin) return;
        } catch {
          // If URL parsing fails, skip origin check
        }
      }

      const { data } = event;
      
      // Handle Vite HMR error messages
      if (data?.type === 'vite:error' || data?.type === 'vite:beforeUpdate') {
        if (data.err) {
          const error = parseViteError(
            data.err.message || JSON.stringify(data.err),
            null
          );
          error.file = data.err.file || error.file;
          error.line = data.err.loc?.line || error.line;
          error.column = data.err.loc?.column || error.column;
          error.stack = data.err.stack || error.stack;
          
          const errorHash = `${error.message}:${error.file}:${error.line}`;
          if (errorHash !== lastErrorRef.current) {
            lastErrorRef.current = errorHash;
            errorClearedRef.current = false;
            console.log('[HMRErrorDetector] Received error via postMessage:', error);
            onErrorDetected([error]);
          }
        }
      }
      
      // Handle generic error messages from sandbox
      if (data?.type === 'sandbox:error') {
        const error: SandboxError = {
          type: data.errorType || 'unknown',
          message: data.message || 'Unknown error',
          file: data.file,
          line: data.line,
          column: data.column,
          stack: data.stack,
          rawError: data.rawError,
          timestamp: Date.now()
        };
        
        const errorHash = `${error.message}:${error.file}:${error.line}`;
        if (errorHash !== lastErrorRef.current) {
          lastErrorRef.current = errorHash;
          errorClearedRef.current = false;
          console.log('[HMRErrorDetector] Received sandbox error:', error);
          onErrorDetected([error]);
        }
      }
      
      // Handle error cleared message
      if (data?.type === 'sandbox:error-cleared' || data?.type === 'vite:ws:connect') {
        if (lastErrorRef.current && !errorClearedRef.current) {
          lastErrorRef.current = null;
          errorClearedRef.current = true;
          console.log('[HMRErrorDetector] Error cleared via postMessage');
          onErrorCleared?.();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [enabled, sandboxUrl, parseViteError, onErrorDetected, onErrorCleared]);

  // Poll for errors in the iframe (DOM-based)
  useEffect(() => {
    if (!enabled) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Check immediately
    checkForErrors();
    
    // Then check every 2 seconds
    checkIntervalRef.current = setInterval(checkForErrors, 2000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [enabled, checkForErrors]);

  // Poll backend API for errors (works across origins)
  useEffect(() => {
    if (!enabled || !pollBackend) {
      if (backendPollIntervalRef.current) {
        clearInterval(backendPollIntervalRef.current);
        backendPollIntervalRef.current = null;
      }
      return;
    }

    // Initial delay to let sandbox stabilize
    const initialDelay = setTimeout(() => {
      pollBackendForErrors();
      // Then poll every 3 seconds
      backendPollIntervalRef.current = setInterval(pollBackendForErrors, 3000);
    }, 2000);

    return () => {
      clearTimeout(initialDelay);
      if (backendPollIntervalRef.current) {
        clearInterval(backendPollIntervalRef.current);
        backendPollIntervalRef.current = null;
      }
    };
  }, [enabled, pollBackend, pollBackendForErrors]);

  return null;
}