/**
 * Export Types
 */

export type ExportFormat = 'zip' | 'github' | 'vercel' | 'codesandbox';

export interface ExportOptions {
  format: ExportFormat;
  projectName?: string;
  includeReadme?: boolean;
  includeLicense?: boolean;
}

export interface GitHubExportOptions extends ExportOptions {
  format: 'github';
  repoName: string;
  repoDescription?: string;
  isPrivate?: boolean;
  organization?: string;
}

export interface VercelExportOptions extends ExportOptions {
  format: 'vercel';
  projectName: string;
  teamId?: string;
  framework?: 'vite' | 'nextjs';
}

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  url?: string;
  downloadUrl?: string;
  error?: string;
}