'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SandboxData } from '../types';

interface UseSandboxReturn {
  sandboxData: SandboxData | null;
  setSandboxData: React.Dispatch<React.SetStateAction<SandboxData | null>>;
  loading: boolean;
  status: { text: string; active: boolean };
  createSandbox: (fromHomeScreen?: boolean) => Promise<SandboxData | null>;
  restoreSandbox: (sandboxId: string, sandboxUrl: string) => Promise<SandboxData | null>;
  checkSandboxStatus: () => Promise<void>;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  refreshIframe: () => void;
}

export function useSandbox(
  aiModel: string,
  addChatMessage: (content: string, type: 'user' | 'ai' | 'system' | 'file-update' | 'command' | 'error') => void,
  log: (message: string, type?: 'info' | 'error' | 'command') => void
): UseSandboxReturn {
  const [sandboxData, setSandboxData] = useState<SandboxData | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ text: 'Not connected', active: false });
  
  const sandboxCreationRef = useRef<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateStatus = useCallback((text: string, active: boolean) => {
    setStatus({ text, active });
  }, []);

  const checkSandboxStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/sandbox-status');
      const data = await response.json();
      
      if (data.active && data.healthy && data.sandboxData) {
        console.log('[checkSandboxStatus] Setting sandboxData from API:', data.sandboxData);
        setSandboxData(data.sandboxData);
        updateStatus('Sandbox active', true);
      } else if (data.active && !data.healthy) {
        updateStatus('Sandbox not responding', false);
      } else {
        if (!sandboxData) {
          console.log('[checkSandboxStatus] No existing sandboxData, clearing state');
          setSandboxData(null);
          updateStatus('No sandbox', false);
        } else {
          console.log('[checkSandboxStatus] Keeping existing sandboxData, sandbox inactive but data preserved');
          updateStatus('Sandbox status unknown', false);
        }
      }
    } catch (error) {
      console.error('Failed to check sandbox status:', error);
      if (!sandboxData) {
        setSandboxData(null);
        updateStatus('Error', false);
      } else {
        updateStatus('Status check failed', false);
      }
    }
  }, [sandboxData, updateStatus]);

  const createSandbox = useCallback(async (fromHomeScreen = false): Promise<SandboxData | null> => {
    // Prevent duplicate sandbox creation
    if (sandboxCreationRef.current) {
      console.log('[createSandbox] Sandbox creation already in progress, skipping...');
      return null;
    }
    
    sandboxCreationRef.current = true;
    console.log('[createSandbox] Starting sandbox creation...');
    setLoading(true);
    updateStatus('Creating sandbox...', false);
    
    try {
      const response = await fetch('/api/create-ai-sandbox-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      console.log('[createSandbox] Response data:', data);
      
      if (data.success) {
        sandboxCreationRef.current = false;
        console.log('[createSandbox] Setting sandboxData from creation:', data);
        setSandboxData(data);
        updateStatus('Sandbox active', true);
        log('Sandbox created successfully!');
        log(`Sandbox ID: ${data.sandboxId}`);
        log(`URL: ${data.url}`);
        
        // Update URL with sandbox ID
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('sandbox', data.sandboxId);
        newParams.set('model', aiModel);
        router.push(`/generation?${newParams.toString()}`, { scroll: false });
        
        // Only add welcome message if not coming from home screen
        if (!fromHomeScreen) {
          addChatMessage(
            `Sandbox created! ID: ${data.sandboxId}. I now have context of your sandbox and can help you build your app. Just ask me to create components and I'll automatically apply them!\n\nTip: I automatically detect and install npm packages from your code imports (like react-router-dom, axios, etc.)`,
            'system'
          );
        }
        
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = data.url;
          }
        }, 100);
        
        return data;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('[createSandbox] Error:', error);
      updateStatus('Error', false);
      log(`Failed to create sandbox: ${error.message}`, 'error');
      addChatMessage(`Failed to create sandbox: ${error.message}`, 'system');
      throw error;
    } finally {
      setLoading(false);
      sandboxCreationRef.current = false;
    }
  }, [aiModel, searchParams, router, log, addChatMessage, updateStatus]);

  const refreshIframe = useCallback(() => {
    if (iframeRef.current && sandboxData?.url) {
      console.log('[Manual Refresh] Forcing iframe reload...');
      const newSrc = `${sandboxData.url}?t=${Date.now()}&manual=true`;
      iframeRef.current.src = newSrc;
    }
  }, [sandboxData]);

  // Restore a sandbox from stored session data
  const restoreSandbox = useCallback(async (sandboxId: string, sandboxUrl: string): Promise<SandboxData | null> => {
    console.log('[restoreSandbox] Attempting to restore sandbox:', { sandboxId, sandboxUrl });
    
    try {
      // Verify the sandbox is still alive
      const response = await fetch('/api/sandbox-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId })
      });
      
      const data = await response.json();
      
      if (data.success && data.isAlive) {
        console.log('[restoreSandbox] Sandbox is alive, restoring...');
        
        const restoredData: SandboxData = {
          sandboxId,
          url: sandboxUrl,
          provider: data.sandboxInfo?.provider || 'e2b',
          ...data.sandboxInfo
        };
        
        setSandboxData(restoredData);
        updateStatus('Sandbox restored', true);
        log('Sandbox restored from session');
        
        // Update iframe
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = sandboxUrl;
          }
        }, 100);
        
        return restoredData;
      } else {
        console.log('[restoreSandbox] Sandbox is no longer alive');
        return null;
      }
    } catch (error) {
      console.error('[restoreSandbox] Failed to restore sandbox:', error);
      return null;
    }
  }, [setSandboxData, updateStatus, log]);

  return {
    sandboxData,
    setSandboxData,
    loading,
    status,
    createSandbox,
    restoreSandbox,
    checkSandboxStatus,
    iframeRef,
    refreshIframe
  };
}