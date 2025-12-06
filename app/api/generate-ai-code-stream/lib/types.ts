import type { FileManifest } from '@/types/file-manifest';

export interface EditIntent {
  type: string;
  description: string;
  targetFiles: string[];
  confidence: number;
  searchTerms?: string[];
  suggestedContext?: string[];
}

export interface EditContext {
  primaryFiles: string[];
  contextFiles: string[];
  systemPrompt: string;
  editIntent: EditIntent;
}

export interface SearchPlan {
  searchTerms: string[];
  editType: string;
  reasoning: string;
}

export interface StreamProgressData {
  type: 'status' | 'stream' | 'conversation' | 'component' | 'app' | 'package' | 'complete' | 'error' | 'warning' | 'info';
  message?: string;
  text?: string;
  raw?: boolean;
  name?: string;
  path?: string;
  index?: number;
  error?: string;
  generatedCode?: string;
  explanation?: string;
  files?: number;
  components?: number;
  model?: string;
  packagesToInstall?: string[];
  warnings?: string[];
  // Audit-related fields
  auditScore?: number;
  codeComplete?: boolean;
}

export interface GenerationContext {
  sandboxId?: string;
  structure?: string;
  currentFiles?: Record<string, string>;
  conversationContext?: {
    scrapedWebsites?: Array<{
      url: string;
      timestamp: number;
      content?: string;
    }>;
    currentProject?: string;
  };
}

export interface GenerationRequest {
  prompt: string;
  model?: string;
  context?: GenerationContext;
  isEdit?: boolean;
}

export interface UserPreferences {
  commonPatterns: string[];
  preferredEditStyle: 'targeted' | 'comprehensive';
}