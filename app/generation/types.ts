/**
 * Shared types for the Generation page components
 */

import type { ProjectTypeId } from '@/lib/projects/project-type';

export interface SandboxData {
  sandboxId: string;
  url: string;
  provider?: 'e2b' | 'vercel';
  projectType?: ProjectTypeId;
  [key: string]: any;
}

export interface ChatMessage {
  content: string;
  type: 'user' | 'ai' | 'system' | 'file-update' | 'command' | 'error';
  timestamp: Date;
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  scrapedUrl?: string;
  scrapedContent?: any;
  generatedCode?: string;
  appliedFiles?: string[];
  commandType?: 'input' | 'output' | 'error' | 'success';
  brandingData?: BrandingData;
  sourceUrl?: string;
}

export interface BrandingData {
  colorScheme?: 'light' | 'dark';
  colors?: {
    primary?: string;
    accent?: string;
    background?: string;
    textPrimary?: string;
    link?: string;
  };
  typography?: {
    fontFamilies?: {
      primary?: string;
      heading?: string;
    };
    fontStacks?: {
      body?: string[];
      heading?: string[];
    };
    fontSizes?: {
      h1?: string;
      h2?: string;
      body?: string;
    };
  };
  spacing?: {
    baseUnit?: number;
    borderRadius?: string;
  };
  components?: {
    buttonPrimary?: ButtonStyle;
    buttonSecondary?: ButtonStyle;
    input?: {
      borderColor?: string;
      borderRadius?: string;
    };
  };
  personality?: {
    tone?: string;
    energy?: string;
    targetAudience?: string;
  };
  images?: {
    logo?: string;
    favicon?: string;
  };
  designSystem?: {
    framework?: string;
    componentLibrary?: string;
  };
}

export interface ButtonStyle {
  background?: string;
  textColor?: string;
  borderRadius?: string;
  shadow?: string;
}

export interface ScrapeData {
  success: boolean;
  content?: string;
  url?: string;
  title?: string;
  source?: string;
  screenshot?: string;
  structured?: any;
  metadata?: any;
  message?: string;
  error?: string;
}

export interface GenerationProgress {
  isGenerating: boolean;
  status: string;
  components: ComponentProgress[];
  currentComponent: number;
  streamedCode: string;
  isStreaming: boolean;
  isThinking: boolean;
  thinkingText?: string;
  thinkingDuration?: number;
  currentFile?: GeneratedFile;
  files: GeneratedFile[];
  lastProcessedPosition: number;
  isEdit?: boolean;
}

export interface ComponentProgress {
  name: string;
  path: string;
  completed: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'javascript' | 'css' | 'json' | 'html' | 'text';
  completed: boolean;
  edited?: boolean;
}

export interface ConversationContext {
  scrapedWebsites: ScrapedWebsite[];
  generatedComponents: GeneratedComponent[];
  appliedCode: AppliedCode[];
  currentProject: string;
  lastGeneratedCode?: string;
  projectType?: ProjectTypeId;
}

export interface ScrapedWebsite {
  url: string;
  content: any;
  timestamp: Date;
}

export interface GeneratedComponent {
  name: string;
  path: string;
  content: string;
}

export interface AppliedCode {
  files: string[];
  timestamp: Date;
}

export interface CodeApplicationState {
  stage: 'analyzing' | 'installing' | 'applying' | 'complete' | null;
  packages?: string[];
  installedPackages?: string[];
  filesGenerated?: string[];
}

export type LoadingStage = 'gathering' | 'planning' | 'generating' | null;

export type ActiveTab = 'generation' | 'preview';