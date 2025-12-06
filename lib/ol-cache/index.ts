/**
 * OL-Cache Module
 * 
 * AI-friendly documentation caching system for code generation context.
 * 
 * This module provides:
 * - Automatic project documentation generation
 * - Smart caching of file metadata and structure
 * - Context retrieval for AI-assisted code generation
 * - Integration with the code generation pipeline
 * 
 * Usage:
 * ```typescript
 * import { OLCacheManager, generateCacheContext, readCacheContext } from '@/lib/ol-cache';
 * 
 * // Generate cache for a project
 * const manager = new OLCacheManager('/path/to/project');
 * await manager.generateCache();
 * 
 * // Read context for AI prompts
 * const context = await manager.getContextForStep('Add a new button component');
 * ```
 */

export { OLCacheManager } from './cache-manager';
export type {
  ProjectDocumentation,
  FileDocumentation,
  FileType,
  ExportInfo,
  ImportInfo,
  ComponentDocumentation,
  FunctionDocumentation,
  DirectoryNode,
  CacheReadOptions,
  CacheGenerateOptions,
  CacheContext,
  PropInfo,
  StateInfo,
  ParamInfo,
  RouteInfo,
} from './types';

import { OLCacheManager } from './cache-manager';
import type { CacheContext, CacheGenerateOptions, CacheReadOptions } from './types';
export { OLCacheIntegration, createCacheIntegration, addCacheContextToPrompt, updateCacheAfterChanges } from './integration';

/**
 * Quick helper to generate cache for a directory
 */
export async function generateCacheContext(
  rootDir: string,
  options?: Partial<CacheGenerateOptions>
): Promise<CacheContext> {
  const manager = new OLCacheManager(rootDir);
  await manager.generateCache(options);
  return manager.readCache();
}

/**
 * Quick helper to read existing cache
 */
export async function readCacheContext(
  rootDir: string,
  options?: CacheReadOptions
): Promise<CacheContext> {
  const manager = new OLCacheManager(rootDir);
  return manager.readCache(options);
}

/**
 * Quick helper to get context for a specific implementation step
 */
export async function getStepContext(
  rootDir: string,
  stepDescription: string
): Promise<CacheContext> {
  const manager = new OLCacheManager(rootDir);
  return manager.getContextForStep(stepDescription);
}

/**
 * Quick helper to update cache for modified files
 */
export async function updateCacheFiles(
  rootDir: string,
  filePaths: string[]
): Promise<void> {
  const manager = new OLCacheManager(rootDir);
  await manager.updateFiles(filePaths);
}