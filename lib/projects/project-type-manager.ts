/**
 * Project Type Manager
 *
 * Manages available project types and provides easy access to configurations.
 * This is the main entry point for project type operations.
 */

import { ProjectTypeConfig, ProjectTypeId } from './project-type';
import { viteReactConfig, nextjsAppConfig, astroConfig, expoConfig } from './project-types';

// Registry of all available project types
const projectTypes: Map<ProjectTypeId, ProjectTypeConfig> = new Map([
  ['vite-react', viteReactConfig],
  ['nextjs-app', nextjsAppConfig],
  ['astro', astroConfig],
  ['expo', expoConfig],
]);

// Default project type
const DEFAULT_PROJECT_TYPE: ProjectTypeId = 'vite-react';

/**
 * Get a project type configuration by ID
 */
export function getProjectType(id: ProjectTypeId): ProjectTypeConfig {
  const config = projectTypes.get(id);
  if (!config) {
    throw new Error(`Unknown project type: ${id}. Available types: ${Array.from(projectTypes.keys()).join(', ')}`);
  }
  return config;
}

/**
 * Get the default project type configuration
 */
export function getDefaultProjectType(): ProjectTypeConfig {
  return getProjectType(DEFAULT_PROJECT_TYPE);
}

/**
 * Get all available project types
 */
export function getAllProjectTypes(): ProjectTypeConfig[] {
  return Array.from(projectTypes.values());
}

/**
 * Get project type IDs for UI selection
 */
export function getProjectTypeOptions(): Array<{ id: ProjectTypeId; name: string; description: string }> {
  return getAllProjectTypes().map(config => ({
    id: config.id,
    name: config.name,
    description: config.description
  }));
}

/**
 * Check if a project type ID is valid
 */
export function isValidProjectType(id: string): id is ProjectTypeId {
  return projectTypes.has(id as ProjectTypeId);
}

/**
 * Register a custom project type (for extensibility)
 */
export function registerProjectType(config: ProjectTypeConfig): void {
  projectTypes.set(config.id, config);
}

/**
 * Project Type Manager Class
 * 
 * Provides an object-oriented interface for managing project types,
 * useful for components that need to track current project type state.
 */
export class ProjectTypeManager {
  private currentType: ProjectTypeId;
  
  constructor(initialType: ProjectTypeId = DEFAULT_PROJECT_TYPE) {
    this.currentType = initialType;
  }
  
  /**
   * Get the current project type configuration
   */
  getCurrentConfig(): ProjectTypeConfig {
    return getProjectType(this.currentType);
  }
  
  /**
   * Get the current project type ID
   */
  getCurrentTypeId(): ProjectTypeId {
    return this.currentType;
  }
  
  /**
   * Set the current project type
   */
  setCurrentType(id: ProjectTypeId): void {
    if (!isValidProjectType(id)) {
      throw new Error(`Invalid project type: ${id}`);
    }
    this.currentType = id;
  }
  
  /**
   * Transform a file path for the current project type
   */
  transformPath(path: string): string {
    return this.getCurrentConfig().filePathTransform(path);
  }
  
  /**
   * Get all available project type options
   */
  getOptions(): Array<{ id: ProjectTypeId; name: string; description: string }> {
    return getProjectTypeOptions();
  }
  
  /**
   * Check if current project type supports API routes
   */
  supportsApiRoutes(): boolean {
    return this.getCurrentConfig().supportsApiRoutes;
  }
  
  /**
   * Check if current project type supports SSR
   */
  supportsSSR(): boolean {
    return this.getCurrentConfig().supportsSSR;
  }
  
  /**
   * Check if current project type uses TypeScript
   */
  usesTypeScript(): boolean {
    return this.getCurrentConfig().usesTypeScript;
  }
  
  /**
   * Get the component file extension for current project type
   */
  getComponentExtension(): string {
    return this.getCurrentConfig().componentExtension;
  }
  
  /**
   * Get the source directory for current project type
   */
  getSourceDir(): string {
    return this.getCurrentConfig().sourceDir;
  }
  
  /**
   * Get the components directory for current project type
   */
  getComponentsDir(): string {
    return this.getCurrentConfig().componentsDir;
  }
  
  /**
   * Get the API directory for current project type (if supported)
   */
  getApiDir(): string | null {
    return this.getCurrentConfig().apiDir;
  }
}

// Singleton instance for global access
let globalManager: ProjectTypeManager | null = null;

/**
 * Get the global ProjectTypeManager instance
 */
export function getProjectTypeManager(): ProjectTypeManager {
  if (!globalManager) {
    globalManager = new ProjectTypeManager();
  }
  return globalManager;
}

/**
 * Reset the global manager (useful for testing)
 */
export function resetProjectTypeManager(): void {
  globalManager = null;
}

export default ProjectTypeManager;