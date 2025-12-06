/**
 * Projects Module
 *
 * Provides:
 * - Project type abstraction (Vite, Next.js, Astro, Expo, etc.)
 * - Project type management
 * - Save/load functionality with version history
 */

// Project Type System
export * from './project-type';
export * from './project-type-manager';
export { viteReactConfig, nextjsAppConfig, astroConfig, expoConfig } from './project-types';

// Project Persistence
export * from './types';
export * from './project-store';