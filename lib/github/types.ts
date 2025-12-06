/**
 * GitHub Integration Types
 * 
 * Type definitions for GitHub API interactions.
 */

/**
 * GitHub repository
 */
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  default_branch: string;
  description?: string | null;
  html_url: string;
  pushed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  size: number;
  language?: string | null;
  topics?: string[];
  hasPackageJson?: boolean;
}

/**
 * File tree node
 */
export interface FileTreeNode {
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha: string;
  url?: string;
  children?: FileTreeNode[];
}

/**
 * File content
 */
export interface FileContent {
  path: string;
  content: string;
  sha: string;
  encoding: 'base64' | 'utf-8';
  size: number;
}

/**
 * File change for commits
 */
export interface FileChange {
  path: string;
  content: string;
  operation: 'create' | 'update' | 'delete';
  sha?: string; // Required for updates
}

/**
 * Git commit
 */
export interface GitCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  html_url: string;
  parents: Array<{ sha: string }>;
}

/**
 * Git branch
 */
export interface GitBranch {
  name: string;
  protected: boolean;
  commit: {
    sha: string;
    url: string;
  };
}

/**
 * GitHub user
 */
export interface GitHubUser {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
  avatar_url: string;
  html_url: string;
}

/**
 * Project sync state
 */
export type SyncState = 
  | 'synced'        // Local matches remote
  | 'pending'       // Local changes not yet synced
  | 'syncing'       // Currently syncing
  | 'conflict'      // Merge conflict detected
  | 'error'         // Sync failed
  | 'disconnected'; // No network/auth

/**
 * Checkpoint (commit snapshot)
 */
export interface Checkpoint {
  id: string;
  message: string;
  type: 'manual' | 'auto' | 'milestone';
  timestamp: Date;
  commit?: {
    sha: string;
    url: string;
  };
  files: number;
  additions: number;
  deletions: number;
}

/**
 * GitHub project metadata
 */
export interface GitHubProjectMetadata {
  owner: string;
  repo: string;
  branch: string;
  lastCommitSha?: string;
  lastSyncAt?: Date;
  syncState: SyncState;
}

/**
 * Project with GitHub backing
 */
export interface GitHubBackedProject {
  id: string;
  name: string;
  description?: string;
  github: GitHubProjectMetadata;
  files: Map<string, FileContent>;
  checkpoints: Checkpoint[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Conflict info
 */
export interface ConflictInfo {
  path: string;
  localSha: string;
  remoteSha: string;
  localContent: string;
  remoteContent: string;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  filesUpdated: number;
  filesCreated: number;
  filesDeleted: number;
  commit?: GitCommit;
  errors?: string[];
}

/**
 * Pull result
 */
export interface PullResult {
  success: boolean;
  filesUpdated: string[];
  conflicts: ConflictInfo[];
  newCommit?: string;
}