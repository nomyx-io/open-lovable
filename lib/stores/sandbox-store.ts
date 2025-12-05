/**
 * Sandbox Store - Zustand state management for sandbox lifecycle
 * 
 * This store manages:
 * - Sandbox creation and status
 * - Preview URL and provider
 * - Loading states
 * - Sandbox files cache
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface SandboxData {
  sandboxId: string;
  url: string;
  provider?: 'e2b' | 'vercel';
}

export interface SandboxFile {
  path: string;
  content: string;
  lastModified?: Date;
}

interface SandboxState {
  // Core sandbox data
  sandboxData: SandboxData | null;
  
  // Loading states
  loading: boolean;
  status: string;
  error: string | null;
  
  // Sandbox files
  files: Record<string, string>;
  
  // Actions
  setSandboxData: (data: SandboxData | null) => void;
  setLoading: (loading: boolean) => void;
  setStatus: (status: string) => void;
  setError: (error: string | null) => void;
  setFiles: (files: Record<string, string>) => void;
  updateFile: (path: string, content: string) => void;
  
  // Complex actions
  reset: () => void;
}

const initialState = {
  sandboxData: null,
  loading: false,
  status: 'idle',
  error: null,
  files: {},
};

export const useSandboxStore = create<SandboxState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Simple setters
      setSandboxData: (data) => set({ sandboxData: data }, false, 'setSandboxData'),
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      setStatus: (status) => set({ status }, false, 'setStatus'),
      setError: (error) => set({ error }, false, 'setError'),
      setFiles: (files) => set({ files }, false, 'setFiles'),
      
      updateFile: (path, content) => 
        set(
          (state) => ({
            files: { ...state.files, [path]: content }
          }),
          false,
          'updateFile'
        ),
      
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'sandbox-store' }
  )
);

// Selector hooks for optimized re-renders
export const useSandboxData = () => useSandboxStore((state) => state.sandboxData);
export const useSandboxLoading = () => useSandboxStore((state) => state.loading);
export const useSandboxStatus = () => useSandboxStore((state) => state.status);
export const useSandboxFiles = () => useSandboxStore((state) => state.files);
export const useSandboxActions = () => useSandboxStore((state) => ({
  setSandboxData: state.setSandboxData,
  setLoading: state.setLoading,
  setStatus: state.setStatus,
  setError: state.setError,
  setFiles: state.setFiles,
  updateFile: state.updateFile,
  reset: state.reset,
}));