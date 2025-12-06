// Global types for sandbox file management

import type { ProjectTypeId } from '@/lib/projects/project-type';

export interface SandboxFile {
  content: string;
  lastModified: number;
}

export interface SandboxFileCache {
  files: Record<string, SandboxFile>;
  lastSync: number;
  sandboxId: string;
  manifest?: any; // FileManifest type from file-manifest.ts
}

export interface SandboxData {
  sandboxId: string;
  url: string;
  projectType?: ProjectTypeId;
}

export interface SandboxState {
  fileCache: SandboxFileCache | null;
  sandbox: any; // E2B sandbox instance
  sandboxData: SandboxData | null;
}

// Declare global types
declare global {
  var activeSandbox: any;
  var sandboxState: SandboxState;
  var existingFiles: Set<string>;
}

export {};