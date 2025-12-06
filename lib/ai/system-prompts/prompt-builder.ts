/**
 * Prompt Builder
 *
 * Composes system prompts based on project type and mode (generate/edit).
 */

import type { ProjectTypeId } from '@/lib/projects/project-type';
import { baseSystemPrompt, editModePrompt } from './base-prompt';
import { viteReactPrompt } from './vite-react-prompt';
import { nextjsAppPrompt } from './nextjs-app-prompt';
import { astroPrompt } from './astro-prompt';
import { expoPrompt } from './expo-prompt';
import { buildQualityPrompts } from './quality-prompts';

export interface PromptBuildOptions {
  projectType: ProjectTypeId;
  isEdit?: boolean;
  additionalContext?: string;
  includeQualityPrompts?: boolean;
  qualityOptions?: {
    includeTypeScript?: boolean;
    includeAccessibility?: boolean;
    includePerformance?: boolean;
    includeErrorHandling?: boolean;
    includeLoadingStates?: boolean;
  };
}

/**
 * Get the project-type-specific prompt
 */
export function getProjectTypePrompt(projectType: ProjectTypeId): string {
  switch (projectType) {
    case 'vite-react':
      return viteReactPrompt;
    case 'nextjs-app':
      return nextjsAppPrompt;
    case 'nextjs-pages':
      // For now, use the same as nextjs-app
      return nextjsAppPrompt;
    case 'astro':
      return astroPrompt;
    case 'expo':
      return expoPrompt;
    default:
      return viteReactPrompt; // Default to Vite
  }
}

/**
 * Build the complete system prompt for AI code generation
 *
 * @param projectType - The project type (vite-react, nextjs-app, etc.)
 * @param isEdit - Whether this is an edit operation
 * @param additionalContext - Any additional context to include
 */
export function buildSystemPrompt(
  projectType: ProjectTypeId,
  isEdit: boolean = false,
  additionalContext?: string
): string {
  return buildSystemPromptWithOptions({
    projectType,
    isEdit,
    additionalContext,
    includeQualityPrompts: true,
    qualityOptions: {
      includeAccessibility: true,
      includeErrorHandling: true,
      includeLoadingStates: true
    }
  });
}

/**
 * Build system prompt with full options control
 */
export function buildSystemPromptWithOptions(options: PromptBuildOptions): string {
  const {
    projectType,
    isEdit = false,
    additionalContext,
    includeQualityPrompts = true,
    qualityOptions = {}
  } = options;
  
  const parts: string[] = [];
  
  // 1. Add base prompt (always)
  parts.push(baseSystemPrompt);
  
  // 2. Add project-type-specific prompt
  parts.push(getProjectTypePrompt(projectType));
  
  // 3. Add quality prompts if enabled
  if (includeQualityPrompts) {
    const qualityPrompt = buildQualityPrompts({
      includeTypeScript: qualityOptions.includeTypeScript ?? (projectType === 'nextjs-app' || projectType === 'astro' || projectType === 'expo'),
      includeAccessibility: qualityOptions.includeAccessibility ?? (projectType !== 'expo'), // Mobile has different a11y patterns
      includePerformance: qualityOptions.includePerformance ?? false,
      includeErrorHandling: qualityOptions.includeErrorHandling ?? true,
      includeLoadingStates: qualityOptions.includeLoadingStates ?? true
    });
    
    if (qualityPrompt) {
      parts.push(qualityPrompt);
    }
  }
  
  // 4. Add edit mode instructions if applicable
  if (isEdit) {
    parts.push(editModePrompt);
  }
  
  // 5. Add any additional context
  if (additionalContext) {
    parts.push(`\n## ADDITIONAL CONTEXT\n\n${additionalContext}`);
  }
  
  return parts.join('\n\n');
}

/**
 * Get the display name for a project type
 */
export function getProjectTypeName(projectType: ProjectTypeId): string {
  switch (projectType) {
    case 'vite-react':
      return 'Vite + React';
    case 'nextjs-app':
      return 'Next.js (App Router)';
    case 'nextjs-pages':
      return 'Next.js (Pages Router)';
    case 'astro':
      return 'Astro';
    case 'expo':
      return 'Expo (React Native)';
    default:
      return 'Unknown';
  }
}

/**
 * Check if a project type supports API routes
 */
export function supportsApiRoutes(projectType: ProjectTypeId): boolean {
  return projectType === 'nextjs-app' || projectType === 'nextjs-pages' || projectType === 'astro';
}

/**
 * Check if a project type uses TypeScript by default
 */
export function usesTypeScript(projectType: ProjectTypeId): boolean {
  return projectType === 'nextjs-app' || projectType === 'nextjs-pages' || projectType === 'astro' || projectType === 'expo';
}

/**
 * Check if a project type is for mobile development
 */
export function isMobileProjectType(projectType: ProjectTypeId): boolean {
  return projectType === 'expo';
}

export default buildSystemPrompt;