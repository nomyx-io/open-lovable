/**
 * OL-Cache Types
 * 
 * Type definitions for AI-friendly documentation caching system.
 */

/**
 * Documentation for a single file
 */
export interface FileDocumentation {
  /** Relative file path */
  path: string;
  /** File type (component, utility, config, etc.) */
  type: FileType;
  /** Last modification timestamp */
  lastModified: string;
  /** File hash for change detection */
  contentHash: string;
  /** Brief description of the file's purpose */
  description: string;
  /** Key exports from the file */
  exports: ExportInfo[];
  /** Dependencies this file imports */
  imports: ImportInfo[];
  /** Component-specific information if applicable */
  componentInfo?: ComponentDocumentation;
  /** Function-specific information for utility files */
  functions?: FunctionDocumentation[];
  /** Key patterns and conventions used */
  patterns: string[];
  /** Important notes for AI context */
  aiNotes: string[];
}

/**
 * Types of files in the project
 */
export type FileType = 
  | 'component'
  | 'page'
  | 'layout'
  | 'hook'
  | 'utility'
  | 'store'
  | 'api-route'
  | 'config'
  | 'style'
  | 'type-definition'
  | 'test'
  | 'other';

/**
 * Export information
 */
export interface ExportInfo {
  /** Name of the export */
  name: string;
  /** Type (function, class, const, type, interface, etc.) */
  kind: 'function' | 'class' | 'const' | 'type' | 'interface' | 'enum' | 'default';
  /** Brief description */
  description?: string;
  /** Type signature if available */
  typeSignature?: string;
}

/**
 * Import information
 */
export interface ImportInfo {
  /** Module path */
  from: string;
  /** Whether it's a local or external import */
  isExternal: boolean;
  /** Named imports */
  named?: string[];
  /** Default import name */
  default?: string;
}

/**
 * Component-specific documentation
 */
export interface ComponentDocumentation {
  /** Component name */
  name: string;
  /** Props interface */
  props: PropInfo[];
  /** State variables used */
  state: StateInfo[];
  /** Child components rendered */
  children: string[];
  /** Events emitted or handled */
  events: string[];
  /** Accessibility features */
  a11y: string[];
  /** Styling approach (tailwind, css modules, etc.) */
  styling: string;
}

/**
 * Component prop information
 */
export interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
}

/**
 * Component state information
 */
export interface StateInfo {
  name: string;
  type: string;
  purpose: string;
}

/**
 * Function documentation
 */
export interface FunctionDocumentation {
  /** Function name */
  name: string;
  /** Parameters */
  params: ParamInfo[];
  /** Return type */
  returns: string;
  /** Description */
  description: string;
  /** Whether it's async */
  isAsync: boolean;
  /** Key behaviors */
  behaviors: string[];
}

/**
 * Function parameter information
 */
export interface ParamInfo {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
}

/**
 * Project-level documentation
 */
export interface ProjectDocumentation {
  /** Project name */
  name: string;
  /** Project type (vite-react, nextjs-app, etc.) */
  projectType: string;
  /** Root directory */
  rootDir: string;
  /** Cache creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Version of the cache format */
  cacheVersion: string;
  /** High-level project description */
  description: string;
  /** Key technologies and frameworks */
  technologies: string[];
  /** Directory structure overview */
  structure: DirectoryNode;
  /** Component tree */
  componentTree: Record<string, string[]>;
  /** Available routes */
  routes: RouteInfo[];
  /** Key patterns used across the project */
  patterns: string[];
  /** Important conventions for AI to follow */
  conventions: string[];
  /** Individual file documentation */
  files: Record<string, FileDocumentation>;
}

/**
 * Directory structure node
 */
export interface DirectoryNode {
  name: string;
  type: 'directory' | 'file';
  children?: DirectoryNode[];
  fileType?: FileType;
}

/**
 * Route information
 */
export interface RouteInfo {
  path: string;
  component: string;
  layout?: string;
  isProtected: boolean;
}

/**
 * Cache read options
 */
export interface CacheReadOptions {
  /** Filter by file type */
  fileTypes?: FileType[];
  /** Filter by path patterns */
  pathPatterns?: string[];
  /** Maximum number of files to include */
  maxFiles?: number;
  /** Include full file content summaries */
  includeContent?: boolean;
}

/**
 * Cache generation options
 */
export interface CacheGenerateOptions {
  /** Root directory to scan */
  rootDir: string;
  /** Patterns to exclude */
  excludePatterns?: string[];
  /** Whether to use AI for enhanced documentation */
  useAI?: boolean;
  /** Force regeneration even if cache exists */
  force?: boolean;
  /** Project type hint */
  projectType?: string;
}

/**
 * Context addition for AI prompts
 */
export interface CacheContext {
  /** Formatted context string for AI */
  contextString: string;
  /** Files included in context */
  filesIncluded: string[];
  /** Whether cache was found */
  cacheFound: boolean;
  /** Cache freshness */
  isFresh: boolean;
  /** Relevant patterns for the current task */
  relevantPatterns: string[];
}