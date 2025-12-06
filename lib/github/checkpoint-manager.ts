/**
 * Checkpoint Manager
 * 
 * Manages checkpoints (named commits) for project state snapshots.
 * Supports manual, auto, and milestone checkpoints.
 */

import { GitHubClient } from './github-client';
import type { Checkpoint, GitCommit, FileChange } from './types';

interface CheckpointOptions {
  /** Owner of the repository */
  owner: string;
  /** Repository name */
  repo: string;
  /** Branch to create checkpoints on */
  branch?: string;
  /** Maximum auto-checkpoints to keep */
  maxAutoCheckpoints?: number;
  /** Interval for auto-checkpoints (ms) */
  autoCheckpointInterval?: number;
}

/**
 * Checkpoint type icons/prefixes for commit messages
 */
const CHECKPOINT_PREFIXES = {
  manual: '📌',
  auto: '🔄',
  milestone: '🏆',
};

/**
 * Checkpoint Manager
 * 
 * Creates and manages named commit snapshots.
 */
export class CheckpointManager {
  private client: GitHubClient;
  private owner: string;
  private repo: string;
  private branch: string;
  private maxAutoCheckpoints: number;
  private autoCheckpointInterval: number;
  
  private checkpoints: Checkpoint[] = [];
  private autoCheckpointTimer: NodeJS.Timeout | null = null;
  private lastAutoCheckpoint: Date | null = null;

  constructor(accessToken: string, options: CheckpointOptions) {
    this.client = new GitHubClient(accessToken);
    this.owner = options.owner;
    this.repo = options.repo;
    this.branch = options.branch || 'main';
    this.maxAutoCheckpoints = options.maxAutoCheckpoints || 10;
    this.autoCheckpointInterval = options.autoCheckpointInterval || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all checkpoints
   */
  getCheckpoints(): Checkpoint[] {
    return [...this.checkpoints];
  }

  /**
   * Initialize by loading recent commits as checkpoints
   */
  async initialize(): Promise<void> {
    try {
      const commits = await this.client.listCommits(this.owner, this.repo, {
        branch: this.branch,
        perPage: 50,
      });
      
      // Parse commits to extract checkpoints
      this.checkpoints = commits
        .filter(commit => this.isCheckpointCommit(commit.message))
        .map(commit => this.parseCheckpoint(commit))
        .slice(0, 20); // Keep only recent 20
        
    } catch (error) {
      console.error('[CheckpointManager] Failed to initialize:', error);
    }
  }

  /**
   * Check if a commit message is a checkpoint
   */
  private isCheckpointCommit(message: string): boolean {
    return (
      message.startsWith(CHECKPOINT_PREFIXES.manual) ||
      message.startsWith(CHECKPOINT_PREFIXES.auto) ||
      message.startsWith(CHECKPOINT_PREFIXES.milestone)
    );
  }

  /**
   * Parse a commit into a checkpoint
   */
  private parseCheckpoint(commit: GitCommit): Checkpoint {
    const message = commit.message;
    let type: Checkpoint['type'] = 'manual';
    let name = message;
    
    if (message.startsWith(CHECKPOINT_PREFIXES.auto)) {
      type = 'auto';
      name = message.replace(CHECKPOINT_PREFIXES.auto, '').trim();
    } else if (message.startsWith(CHECKPOINT_PREFIXES.milestone)) {
      type = 'milestone';
      name = message.replace(CHECKPOINT_PREFIXES.milestone, '').trim();
    } else if (message.startsWith(CHECKPOINT_PREFIXES.manual)) {
      type = 'manual';
      name = message.replace(CHECKPOINT_PREFIXES.manual, '').trim();
    }
    
    return {
      id: commit.sha,
      message: name,
      type,
      timestamp: new Date(commit.author.date),
      commit: {
        sha: commit.sha,
        url: commit.html_url,
      },
      files: 0, // Would need additional API call to get file count
      additions: 0,
      deletions: 0,
    };
  }

  /**
   * Create a manual checkpoint
   */
  async createCheckpoint(
    name: string,
    changes: FileChange[],
    type: Checkpoint['type'] = 'manual'
  ): Promise<Checkpoint> {
    const prefix = CHECKPOINT_PREFIXES[type];
    const message = `${prefix} ${name}`;
    
    // Create the commit
    const commit = await this.client.createCommit(
      this.owner,
      this.repo,
      changes,
      message,
      this.branch
    );
    
    // Create checkpoint object
    const checkpoint: Checkpoint = {
      id: commit.sha,
      message: name,
      type,
      timestamp: new Date(),
      commit: {
        sha: commit.sha,
        url: commit.html_url,
      },
      files: changes.length,
      additions: changes.filter(c => c.operation === 'create').length,
      deletions: changes.filter(c => c.operation === 'delete').length,
    };
    
    // Add to local list
    this.checkpoints.unshift(checkpoint);
    
    // Cleanup old auto-checkpoints if needed
    if (type === 'auto') {
      await this.cleanupAutoCheckpoints();
    }
    
    return checkpoint;
  }

  /**
   * Create an auto-checkpoint
   */
  async createAutoCheckpoint(changes: FileChange[]): Promise<Checkpoint | null> {
    if (changes.length === 0) {
      return null;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `Auto-save ${timestamp}`;
    
    this.lastAutoCheckpoint = new Date();
    return this.createCheckpoint(name, changes, 'auto');
  }

  /**
   * Create a milestone checkpoint
   */
  async createMilestone(
    name: string,
    changes: FileChange[]
  ): Promise<Checkpoint> {
    return this.createCheckpoint(name, changes, 'milestone');
  }

  /**
   * Get checkpoint by ID
   */
  getCheckpoint(id: string): Checkpoint | undefined {
    return this.checkpoints.find(c => c.id === id);
  }

  /**
   * Get checkpoints by type
   */
  getCheckpointsByType(type: Checkpoint['type']): Checkpoint[] {
    return this.checkpoints.filter(c => c.type === type);
  }

  /**
   * Get files at a specific checkpoint
   */
  async getCheckpointFiles(checkpointId: string): Promise<Map<string, string>> {
    try {
      const tree = await this.client.getFileTree(
        this.owner,
        this.repo,
        checkpointId
      );
      
      const files = new Map<string, string>();
      
      // Load each file's content
      for (const node of tree) {
        if (node.type === 'file' && !this.isBinaryFile(node.path)) {
          try {
            const content = await this.client.getFile(
              this.owner,
              this.repo,
              node.path,
              checkpointId
            );
            files.set(node.path, content.content);
          } catch {
            // Skip files that can't be read
          }
        }
      }
      
      return files;
    } catch (error) {
      console.error(`[CheckpointManager] Failed to get files for ${checkpointId}:`, error);
      throw error;
    }
  }

  /**
   * Compare two checkpoints
   */
  async compareCheckpoints(
    fromId: string,
    toId: string
  ): Promise<{
    added: string[];
    removed: string[];
    modified: string[];
  }> {
    try {
      const comparison = await this.client.compareCommits(
        this.owner,
        this.repo,
        fromId,
        toId
      );
      
      return {
        added: comparison.files
          .filter(f => f.status === 'added')
          .map(f => f.filename),
        removed: comparison.files
          .filter(f => f.status === 'removed')
          .map(f => f.filename),
        modified: comparison.files
          .filter(f => f.status === 'modified')
          .map(f => f.filename),
      };
    } catch (error) {
      console.error('[CheckpointManager] Failed to compare checkpoints:', error);
      throw error;
    }
  }

  /**
   * Restore to a checkpoint
   * This creates a new commit that reverts to the checkpoint state
   */
  async restoreToCheckpoint(checkpointId: string): Promise<GitCommit> {
    try {
      // Get files at the checkpoint
      const files = await this.getCheckpointFiles(checkpointId);
      
      // Convert to file changes
      const changes: FileChange[] = Array.from(files.entries()).map(([path, content]) => ({
        path,
        content,
        operation: 'update' as const,
      }));
      
      // Create a restore commit
      const checkpoint = this.getCheckpoint(checkpointId);
      const message = `🔙 Restored to: ${checkpoint?.message || checkpointId}`;
      
      const commit = await this.client.createCommit(
        this.owner,
        this.repo,
        changes,
        message,
        this.branch
      );
      
      return commit;
    } catch (error) {
      console.error(`[CheckpointManager] Failed to restore to ${checkpointId}:`, error);
      throw error;
    }
  }

  /**
   * Start auto-checkpoint timer
   */
  startAutoCheckpoints(
    getChanges: () => FileChange[],
    onCheckpoint?: (checkpoint: Checkpoint) => void
  ): void {
    this.stopAutoCheckpoints();
    
    this.autoCheckpointTimer = setInterval(async () => {
      const changes = getChanges();
      if (changes.length > 0) {
        try {
          const checkpoint = await this.createAutoCheckpoint(changes);
          if (checkpoint && onCheckpoint) {
            onCheckpoint(checkpoint);
          }
        } catch (error) {
          console.error('[CheckpointManager] Auto-checkpoint failed:', error);
        }
      }
    }, this.autoCheckpointInterval);
  }

  /**
   * Stop auto-checkpoint timer
   */
  stopAutoCheckpoints(): void {
    if (this.autoCheckpointTimer) {
      clearInterval(this.autoCheckpointTimer);
      this.autoCheckpointTimer = null;
    }
  }

  /**
   * Clean up old auto-checkpoints
   */
  private async cleanupAutoCheckpoints(): Promise<void> {
    const autoCheckpoints = this.getCheckpointsByType('auto');
    
    if (autoCheckpoints.length > this.maxAutoCheckpoints) {
      // Keep only the most recent ones in memory
      const toRemove = autoCheckpoints.slice(this.maxAutoCheckpoints);
      
      for (const cp of toRemove) {
        const index = this.checkpoints.findIndex(c => c.id === cp.id);
        if (index !== -1) {
          this.checkpoints.splice(index, 1);
        }
      }
    }
  }

  /**
   * Check if a file is binary
   */
  private isBinaryFile(path: string): boolean {
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
      '.woff', '.woff2', '.ttf', '.eot', '.otf',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx',
      '.zip', '.tar', '.gz', '.rar', '.7z',
      '.mp3', '.mp4', '.wav', '.ogg', '.webm',
      '.exe', '.dll', '.so', '.dylib',
    ];
    
    const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
    return binaryExtensions.includes(ext);
  }

  /**
   * Get time since last auto-checkpoint
   */
  getTimeSinceLastAutoCheckpoint(): number | null {
    if (!this.lastAutoCheckpoint) return null;
    return Date.now() - this.lastAutoCheckpoint.getTime();
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stopAutoCheckpoints();
    this.checkpoints = [];
  }
}

export default CheckpointManager;