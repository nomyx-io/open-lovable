/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  X, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Terminal,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Loader2,
  ExternalLink,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { SessionInfo, ConsoleEntry } from '@/lib/browser';

interface BrowserTestPanelProps {
  sandboxUrl?: string;
  onClose?: () => void;
  className?: string;
}

/**
 * Console log entry component
 */
function ConsoleLogEntry({ entry }: { entry: ConsoleEntry }) {
  const getIcon = () => {
    switch (entry.type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      default:
        return <Terminal className="w-4 h-4 text-gray-400 flex-shrink-0" />;
    }
  };
  
  const getTextColor = () => {
    switch (entry.type) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-300';
    }
  };
  
  return (
    <div className="flex items-start gap-2 py-1 px-2 hover:bg-gray-800/50 rounded text-sm font-mono">
      {getIcon()}
      <span className={`${getTextColor()} break-all`}>
        {entry.message}
      </span>
      <span className="text-gray-500 text-xs ml-auto flex-shrink-0">
        {new Date(entry.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
}

/**
 * Browser Test Panel Component
 * 
 * Displays browser testing session information including:
 * - Session status and controls
 * - Live screenshot preview
 * - Console logs
 */
export function BrowserTestPanel({ 
  sandboxUrl, 
  onClose,
  className = '' 
}: BrowserTestPanelProps) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleEntry[]>([]);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  /**
   * Take a screenshot of the current page
   */
  const takeScreenshot = useCallback(async (sessionId?: string) => {
    const sid = sessionId || session?.sessionId;
    if (!sid) return;
    
    try {
      const response = await fetch('/api/browser/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid }),
      });
      
      const data = await response.json();
      
      if (data.success && data.screenshot) {
        setScreenshot(data.screenshot);
      }
    } catch (err) {
      console.error('Failed to take screenshot:', err);
    }
  }, [session?.sessionId]);
  
  /**
   * Create a new browser session
   */
  const createSession = useCallback(async () => {
    if (!sandboxUrl) {
      setError('No sandbox URL provided');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/browser/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialUrl: sandboxUrl,
          sandboxId: 'current'
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create session');
      }
      
      setSession(data.session);
      
      // Take initial screenshot
      await takeScreenshot(data.session.sessionId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [sandboxUrl, takeScreenshot]);
  
  /**
   * Refresh console logs
   */
  const refreshConsoleLogs = useCallback(async () => {
    if (!session?.sessionId) return;
    
    try {
      const response = await fetch(
        `/api/browser/console?sessionId=${session.sessionId}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        setConsoleLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch console logs:', err);
    }
  }, [session?.sessionId]);
  
  /**
   * Close the browser session
   */
  const closeSession = async () => {
    if (!session?.sessionId) return;
    
    try {
      await fetch(`/api/browser/session/${session.sessionId}`, {
        method: 'DELETE',
      });
      
      setSession(null);
      setScreenshot(null);
      setConsoleLogs([]);
    } catch (err) {
      console.error('Failed to close session:', err);
    }
  };
  
  /**
   * Refresh the page in the browser session
   */
  const refreshPage = async () => {
    if (!session?.sessionId) return;
    
    setIsLoading(true);
    
    try {
      await fetch('/api/browser/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          action: 'refresh',
          params: {},
        }),
      });
      
      await takeScreenshot();
      await refreshConsoleLogs();
    } catch (err) {
      console.error('Failed to refresh page:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Periodically refresh console logs when session is active
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      refreshConsoleLogs();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [session, refreshConsoleLogs]);
  
  return (
    <div 
      className={`bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-200">
            Browser Testing
          </span>
          {session && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              session.status === 'active' ? 'bg-green-500/20 text-green-400' :
              session.status === 'error' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {session.status}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {session && (
            <>
              <button
                onClick={refreshPage}
                disabled={isLoading}
                className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                title="Refresh page"
              >
                <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => window.open(session.currentUrl, '_blank')}
                className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
              title="Close panel"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* No session state */}
        {!session && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <Monitor className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              Browser Testing
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm">
              Test your application in a real browser. See screenshots, console logs, and interact with the page.
            </p>
            <button
              onClick={createSession}
              disabled={!sandboxUrl}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Browser Session
            </button>
            {!sandboxUrl && (
              <p className="text-xs text-gray-500 mt-2">
                Create a sandbox first to enable browser testing
              </p>
            )}
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && !session && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="m-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={createSession}
                className="text-xs text-red-400 hover:text-red-300 underline mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        )}
        
        {/* Active session */}
        {session && (
          <>
            {/* Screenshot preview */}
            <div className="flex-1 relative bg-black overflow-hidden">
              {screenshot ? (
                <img 
                  src={screenshot} 
                  alt="Browser screenshot" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
                </div>
              )}
              
              {/* Page info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-xs text-gray-400 truncate">
                  {session.currentUrl}
                </p>
              </div>
            </div>
            
            {/* Console logs */}
            <div className="border-t border-gray-700">
              <button
                onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Console</span>
                  <span className="text-xs text-gray-500">
                    ({consoleLogs.length} logs)
                  </span>
                  {consoleLogs.some(l => l.type === 'error') && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                {isConsoleExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              <AnimatePresence>
                {isConsoleExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto bg-gray-950 p-2">
                      {consoleLogs.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-4">
                          No console logs yet
                        </p>
                      ) : (
                        consoleLogs.map((log, index) => (
                          <ConsoleLogEntry key={index} entry={log} />
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Session controls */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-t border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Session active
              </div>
              <button
                onClick={closeSession}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                End Session
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BrowserTestPanel;