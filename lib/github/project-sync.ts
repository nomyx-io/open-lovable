/**
 * Project Sync Service
 * 
 * Handles synchronization of project files with GitHub.
 * Supports debounced auto-sync, manual sync, and conflict detection.
 */

import { GitHubClient } from './github-client';
import type {
  FileChange,
  GitCommit,
  SyncState,
  SyncResult,
  PullResult,
  ConflictInfo,
  FileContent,
  FileTreeNode,
} from './types';

interface SyncOptions {
  /** Debounce delay for auto-sync (ms) */
  debounceMs?: number;
  /** Auto-sync on changes */
  autoSync?: boolean;
  /** Branch to sync with */
  branch?: string;
}

interface TrackedFile {
  path: string;
  content: string;
  sha: string | null;
  isDirty: boolean;
  lastModified: number;
}

interface PendingSync {
  changes: FileChange[];
  message: string;
  timestamp: number;
}

/**
 * Project Sync Manager
 * 
 * Tracks file changes and syncs with GitHub repository.
 */
export class ProjectSyncManager {
  private client: GitHubClient;
  private owner: string;
  private repo: string;
  private branch: string;
  
  private trackedFiles: Map<string, TrackedFile> = new Map();
  private pendingSync: PendingSync | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private options: Required<SyncOptions>;
  
  private _syncState: SyncState = 'synced';
  private _lastCommitSha: string | null = null;
  private _lastSyncAt: Date | null = null;
  
  private onSyncStateChange?: (state: SyncState) => void;
  private onSyncComplete?: (result: SyncResult) => void;
  private onConflict?: (conflicts: ConflictInfo[]) => void;

  constructor(
    accessToken: string,
    owner: string,
    repo: string,
    options: SyncOptions = {}
  ) {
    this.client = new GitHubClient(accessToken);
    this.owner = owner;
    this.repo = repo;
    this.branch = options.branch || 'main';
    
    this.options = {
      debounceMs: options.debounceMs ?? 5000,
      autoSync: options.autoSync ?? true,
      branch: this.branch,
    };
  }

  /**
   * Get current sync state
   */
  get syncState(): SyncState {
    return this._syncState;
  }

  /**
   * Get last commit SHA
   */
  get lastCommitSha(): string | null {
    return this._lastCommitSha;
  }

  /**
   * Get last sync timestamp
   */
  get lastSyncAt(): Date | null {
    return this._lastSyncAt;
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: {
    onSyncStateChange?: (state: SyncState) => void;
    onSyncComplete?: (result: SyncResult) => void;
    onConflict?: (conflicts: ConflictInfo[]) => void;
  }): void {
    this.onSyncStateChange = callbacks.onSyncStateChange;
    this.onSyncComplete = callbacks.onSyncComplete;
    this.onConflict = callbacks.onConflict;
  }

  /**
   * Initialize by loading remote file tree
   */
  async initialize(): Promise<void> {
    try {
      const tree = await this.client.getFileTree(this.owner, this.repo, this.branch);
      
      // Track all files from remote
      for (const node of tree) {
        if (node.type === 'file') {
          this.trackedFiles.set(node.path, {
            path: node.path,
            content: '', // Content loaded on demand
            sha: node.sha,
            isDirty: false,
            lastModified: Date.now(),
          });
        }
      }
      
      this.setSyncState('synced');
    } catch (error) {
      console.error('[ProjectSync] Failed to initialize:', error);
      this.setSyncState('error');
      throw error;
    }
  }

  /**
   * Load file content from GitHub
   */
  async loadFile(path: string): Promise<FileContent | null> {
    try {
      const content = await this.client.getFile(this.owner, this.repo, path, this.branch);
      
      // Update tracked file
      this.trackedFiles.set(path, {
        path: content.path,
        content: content.content,
        sha: content.sha,
        isDirty: false,
        lastModified: Date.now(),
      });
      
      return content;
    } catch (error) {
      console.error(`[ProjectSync] Failed to load file ${path}:`, error);
      return null;
    }
  }

  /**
   * Track a file change
   */
  trackChange(path: string, content: string): void {
    const existing = this.trackedFiles.get(path);
    
    this.trackedFiles.set(path, {
      path,
      content,
      sha: existing?.sha || null,
      isDirty: true,
      lastModified: Date.now(),
    });
    
    this.setSyncState('pending');
    
    // Schedule auto-sync if enabled
    if (this.options.autoSync) {
      this.scheduleSync();
    }
  }

  /**
   * Track a file deletion
   */
  trackDeletion(path: string): void {
    const existing = this.trackedFiles.get(path);
    if (!existing) return;
    
    // Mark for deletion by setting content to null indicator
    this.trackedFiles.set(path, {
      ...existing,
      content: '__DELETED__',
      isDirty: true,
      lastModified: Date.now(),
    });
    
    this.setSyncState('pending');
    
    if (this.options.autoSync) {
      this.scheduleSync();
    }
  }

  /**
   * Schedule a debounced sync
   */
  private scheduleSync(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
    
    this.syncTimer = setTimeout(() => {
      this.sync('Auto-save changes');
    }, this.options.debounceMs);
  }

  /**
   * Cancel pending sync
   */
  cancelPendingSync(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Get dirty files that need syncing
   */
  getDirtyFiles(): TrackedFile[] {
    return Array.from(this.trackedFiles.values()).filter(f => f.isDirty);
  }

  /**
   * Check if there are pending changes
   */
  hasPendingChanges(): boolean {
    return this.getDirtyFiles().length > 0;
  }

  /**
   * Sync all pending changes to GitHub
   */
  async sync(message: string = 'Update files'): Promise<SyncResult> {
    this.cancelPendingSync();
    
    const dirtyFiles = this.getDirtyFiles();
    if (dirtyFiles.length === 0) {
      return {
        success: true,
        filesUpdated: 0,
        filesCreated: 0,
        filesDeleted: 0,
      };
    }
    
    this.setSyncState('syncing');
    
    try {
      // Build file changes
      const changes: FileChange[] = dirtyFiles.map(file => {
        if (file.content === '__DELETED__') {
          return {
            path: file.path,
            content: '',
            operation: 'delete' as const,
            sha: file.sha || undefined,
          };
        }
        
        return {
          path: file.path,
          content: file.content,
          operation: file.sha ? 'update' as const : 'create' as const,
          sha: file.sha || undefined,
        };
      });
      
      // Create commit
      const commit = await this.client.createCommit(
        this.owner,
        this.repo,
        changes,
        message,
        this.branch
      );
      
      // Update tracked files
      let created = 0;
      let updated = 0;
      let deleted = 0;
      
      for (const file of dirtyFiles) {
        if (file.content === '__DELETED__') {
          this.trackedFiles.delete(file.path);
          deleted++;
        } else {
          const wasNew = !file.sha;
          this.trackedFiles.set(file.path, {
            ...file,
            sha: commit.sha, // This should be the blob SHA, but we'll get it on next fetch
            isDirty: false,
          });
          if (wasNew) created++;
          else updated++;
        }
      }
      
      this._lastCommitSha = commit.sha;
      this._lastSyncAt = new Date();
      this.setSyncState('synced');
      
      const result: SyncResult = {
        success: true,
        filesUpdated: updated,
        filesCreated: created,
        filesDeleted: deleted,
        commit,
      };
      
      this.onSyncComplete?.(result);
      return result;
    } catch (error) {
      console.error('[ProjectSync] Sync failed:', error);
      this.setSyncState('error');
      
      return {
        success: false,
        filesUpdated: 0,
        filesCreated: 0,
        filesDeleted: 0,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * Pull latest changes from GitHub
   */
  async pull(): Promise<PullResult> {
    try {
      const tree = await this.client.getFileTree(this.owner, this.repo, this.branch);
      const conflicts: ConflictInfo[] = [];
      const updated: string[] = [];
      
      for (const node of tree) {
        if (node.type !== 'file') continue;
        
        const local = this.trackedFiles.get(node.path);
        
        // Check for conflicts
        if (local && local.isDirty && local.sha !== node.sha) {
          // Local has changes and remote is different
          const remoteContent = await this.client.getFile(
            this.owner, 
            this.repo, 
            node.path, 
            this.branch
          );
          
          conflicts.push({
            path: node.path,
            localSha: local.sha || 'new',
            remoteSha: node.sha,
            localContent: local.content,
            remoteContent: remoteContent.content,
          });
        } else if (!local || local.sha !== node.sha) {
          // New file or remote is newer
          const content = await this.client.getFile(
            this.owner, 
            this.repo, 
            node.path, 
            this.branch
          );
          
          this.trackedFiles.set(node.path, {
            path: content.path,
            content: content.content,
            sha: content.sha,
            isDirty: false,
            lastModified: Date.now(),
          });
          
          updated.push(node.path);
        }
      }
      
      if (conflicts.length > 0) {
        this.setSyncState('conflict');
        this.onConflict?.(conflicts);
      } else {
        this.setSyncState('synced');
      }
      
      return {
        success: conflicts.length === 0,
        filesUpdated: updated,
        conflicts,
      };
    } catch (error) {
      console.error('[ProjectSync] Pull failed:', error);
      this.setSyncState('error');
      
      return {
        success: false,
        filesUpdated: [],
        conflicts: [],
      };
    }
  }

  /**
   * Resolve a conflict by choosing a version
   */
  async resolveConflict(
    path: string, 
    resolution: 'local' | 'remote' | 'merged',
    mergedContent?: string
  ): Promise<void> {
    const local = this.trackedFiles.get(path);
    if (!local) return;
    
    if (resolution === 'remote') {
      // Keep remote version - reload from GitHub
      await this.loadFile(path);
    } else if (resolution === 'local') {
      // Keep local version - mark as dirty for next sync
      local.isDirty = true;
    } else if (resolution === 'merged' && mergedContent) {
      // Use merged content
      local.content = mergedContent;
      local.isDirty = true;
    }
    
    // Check if there are still conflicts
    const hasConflicts = Array.from(this.trackedFiles.values())
      .some(f => f.isDirty && this._syncState === 'conflict');
    
    if (!hasConflicts) {
      this.setSyncState('pending');
    }
  }

  /**
   * Get all tracked files
   */
  getTrackedFiles(): TrackedFile[] {
    return Array.from(this.trackedFiles.values());
  }

  /**
   * Get file by path
   */
  getFile(path: string): TrackedFile | undefined {
    return this.trackedFiles.get(path);
  }

  /**
   * Set sync state and notify
   */
  private setSyncState(state: SyncState): void {
    this._syncState = state;
    this.onSyncStateChange?.(state);
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.cancelPendingSync();
    this.trackedFiles.clear();
  }
}

export default ProjectSyncManager;