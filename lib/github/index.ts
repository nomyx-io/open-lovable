/**
 * GitHub Integration Module
 *
 * Provides GitHub authentication, repository management, and project sync.
 */

export * from './types';
export { GitHubClient, createGitHubClient } from './github-client';
export { ProjectSyncManager } from './project-sync';
export { CheckpointManager } from './checkpoint-manager';