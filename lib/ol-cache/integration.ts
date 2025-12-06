/**
 * OL-Cache Integration
 * 
 * Integration utilities for connecting OL-Cache with the code generation pipeline.
 * This module provides hooks and utilities to:
 * - Generate cache documentation after code changes
 * - Inject cached context into AI prompts
 * - Update cache incrementally as files change
 */

import { OLCacheManager } from './cache-manager';
import type { CacheContext, CacheGenerateOptions, FileType } from './types';

/**
 * Integration manager for code generation pipeline
 */
export class OLCacheIntegration {
  private manager: OLCacheManager;
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.manager = new OLCacheManager(rootDir);
  }

  /**
   * Pre-generation hook: Get relevant context for the AI
   * Call this before generating code to add documentation context
   */
  async preGenerate(stepDescription: string): Promise<string> {
    try {
      const context = await this.manager.getContextForStep(stepDescription);
      
      if (!context.cacheFound) {
        // No cache exists - generate one first
        await this.manager.generateCache({ force: false });
        const freshContext = await this.manager.getContextForStep(stepDescription);
        return this.formatContextForPrompt(freshContext, stepDescription);
      }

      return this.formatContextForPrompt(context, stepDescription);
    } catch (error) {
      console.error('[OLCache Integration] Error in pre-generate:', error);
      return ''; // Return empty string on error to not block generation
    }
  }

  /**
   * Post-generation hook: Update cache with new/modified files
   * Call this after generating code to keep cache up to date
   */
  async postGenerate(modifiedFiles: string[]): Promise<void> {
    try {
      if (modifiedFiles.length === 0) return;

      // Update cache for modified files
      await this.manager.updateFiles(modifiedFiles);
      
      console.log(`[OLCache] Updated cache for ${modifiedFiles.length} files`);
    } catch (error) {
      console.error('[OLCache Integration] Error in post-generate:', error);
      // Don't throw - cache update failure shouldn't break the generation
    }
  }

  /**
   * Full cache regeneration (use sparingly)
   */
  async regenerateCache(options?: Partial<CacheGenerateOptions>): Promise<void> {
    await this.manager.generateCache({ ...options, force: true });
  }

  /**
   * Get context filtered by file types
   */
  async getContextByTypes(types: FileType[]): Promise<string> {
    const context = await this.manager.readCache({ fileTypes: types });
    return context.contextString;
  }

  /**
   * Get context for component development
   */
  async getComponentContext(): Promise<string> {
    return this.getContextByTypes(['component', 'page', 'layout']);
  }

  /**
   * Get context for hook/utility development
   */
  async getUtilityContext(): Promise<string> {
    return this.getContextByTypes(['hook', 'utility', 'store']);
  }

  /**
   * Get context for API route development
   */
  async getApiContext(): Promise<string> {
    return this.getContextByTypes(['api-route', 'utility', 'type-definition']);
  }

  /**
   * Format context for inclusion in AI prompt
   */
  private formatContextForPrompt(context: CacheContext, stepDescription: string): string {
    if (!context.cacheFound || !context.contextString) {
      return '';
    }

    const sections: string[] = [];

    sections.push(`
## 📚 AI Documentation Cache (Auto-Generated)

The following context is from cached project documentation to help you understand the codebase:

${context.contextString}
`);

    if (context.relevantPatterns.length > 0) {
      sections.push(`
### Patterns Used in This Project
${context.relevantPatterns.map(p => `- ${p}`).join('\n')}
`);
    }

    if (context.filesIncluded.length > 0) {
      sections.push(`
### Related Files (${context.filesIncluded.length} files)
${context.filesIncluded.slice(0, 10).map(f => `- ${f}`).join('\n')}
${context.filesIncluded.length > 10 ? `\n... and ${context.filesIncluded.length - 10} more files` : ''}
`);
    }

    sections.push(`
### Current Task
${stepDescription}

Use the above context to ensure consistency with existing code patterns and conventions.
---
`);

    return sections.join('\n');
  }
}

/**
 * Create a cache integration instance for a sandbox/project directory
 */
export function createCacheIntegration(rootDir: string): OLCacheIntegration {
  return new OLCacheIntegration(rootDir);
}

/**
 * Quick helper for adding cache context to a prompt
 */
export async function addCacheContextToPrompt(
  rootDir: string,
  prompt: string,
  stepDescription: string
): Promise<string> {
  const integration = new OLCacheIntegration(rootDir);
  const cacheContext = await integration.preGenerate(stepDescription);
  
  if (cacheContext) {
    return `${cacheContext}\n\n${prompt}`;
  }
  
  return prompt;
}

/**
 * Quick helper for updating cache after file changes
 */
export async function updateCacheAfterChanges(
  rootDir: string,
  modifiedFiles: string[]
): Promise<void> {
  const integration = new OLCacheIntegration(rootDir);
  await integration.postGenerate(modifiedFiles);
}