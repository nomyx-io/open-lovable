/**
 * Project Type Abstraction Layer
 * 
 * This module provides a flexible abstraction for different project types
 * (Vite + React, Next.js App Router, etc.) allowing the code generator
 * to support multiple frameworks in a modular fashion.
 */

export type ProjectTypeId = 'vite-react' | 'nextjs-app' | 'nextjs-pages' | 'astro' | 'expo';

export interface ProjectTypeFile {
  path: string;
  content: string;
}

export interface ProjectTypeConfig {
  /** Unique identifier for this project type */
  id: ProjectTypeId;
  
  /** Display name */
  name: string;
  
  /** Description for UI */
  description: string;
  
  // === File Structure ===
  
  /** Main source directory ('src' for Vite, 'app' for Next.js) */
  sourceDir: string;
  
  /** Components directory ('src/components' or 'components') */
  componentsDir: string;
  
  /** Pages/routes directory (null for Vite, 'app' for Next.js App Router) */
  pagesDir: string | null;
  
  /** API routes directory (null for Vite, 'app/api' for Next.js) */
  apiDir: string | null;
  
  /** Public assets directory */
  publicDir: string;
  
  // === Build Configuration ===
  
  /** Development command */
  devCommand: string;
  
  /** Build command */
  buildCommand: string;
  
  /** Development server port */
  devPort: number;
  
  /** Time to wait for dev server startup (ms) */
  startupDelay: number;
  
  // === Dependencies ===
  
  /** Base runtime dependencies */
  baseDependencies: Record<string, string>;
  
  /** Base dev dependencies */
  baseDevDependencies: Record<string, string>;
  
  // === Entry Files ===
  
  /** Core entry files to create on project setup */
  entryFiles: ProjectTypeFile[];
  
  /** Configuration files to create on project setup */
  configFiles: ProjectTypeFile[];
  
  // === Path Transformation ===
  
  /** 
   * Transform a generic file path to this project type's structure
   * e.g., 'src/components/Header.jsx' might become 'components/Header.tsx' for Next.js
   */
  filePathTransform: (path: string) => string;
  
  /** File extension for components (.jsx, .tsx) */
  componentExtension: string;
  
  // === Templates ===
  
  /** Template for generating components */
  componentTemplate: string;
  
  /** Template for generating pages (if applicable) */
  pageTemplate: string | null;
  
  /** Template for generating API routes (if applicable) */
  apiRouteTemplate: string | null;
  
  // === Capabilities ===
  
  /** Whether this project type supports API routes */
  supportsApiRoutes: boolean;
  
  /** Whether this project type supports server-side rendering */
  supportsSSR: boolean;
  
  /** Whether this project type uses TypeScript by default */
  usesTypeScript: boolean;
}

/**
 * Helper function to get file extension based on project type
 */
export function getFileExtension(config: ProjectTypeConfig, isComponent: boolean = true): string {
  return config.componentExtension;
}

/**
 * Helper function to transform a path for a specific project type
 */
export function transformPath(config: ProjectTypeConfig, path: string): string {
  return config.filePathTransform(path);
}

/**
 * Check if a file is a page file for this project type
 */
export function isPageFile(config: ProjectTypeConfig, path: string): boolean {
  if (!config.pagesDir) return false;
  return path.includes(config.pagesDir) && (path.endsWith('page.tsx') || path.endsWith('page.jsx'));
}

/**
 * Check if a file is an API route for this project type
 */
export function isApiRoute(config: ProjectTypeConfig, path: string): boolean {
  if (!config.apiDir) return false;
  return path.includes(config.apiDir) && (path.endsWith('route.ts') || path.endsWith('route.js'));
}