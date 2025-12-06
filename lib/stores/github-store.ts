/**
 * GitHub Store
 * 
 * Zustand store for GitHub authentication and project state.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  GitHubRepository, 
  GitHubProjectMetadata, 
  Checkpoint, 
  SyncState,
  FileChange
} from '@/lib/github';

interface GitHubProject {
  id: string;
  repository: GitHubRepository;
  metadata: GitHubProjectMetadata;
  pendingChanges: Map<string, FileChange>;
  checkpoints: Checkpoint[];
  openedAt: Date;
}

interface GitHubState {
  // Current project
  currentProject: GitHubProject | null;
  syncState: SyncState;
  isSyncing: boolean;
  lastError: string | null;
  
  // Pending changes
  pendingChangesCount: number;
  
  // Actions
  openProject: (repo: GitHubRepository, branch?: string) => void;
  closeProject: () => void;
  trackChange: (path: string, content: string, sha?: string) => void;
  clearPendingChanges: () => void;
  setSyncState: (state: SyncState) => void;
  addCheckpoint: (checkpoint: Checkpoint) => void;
  setError: (error: string | null) => void;
}

export const useGitHubStore = create<GitHubState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentProject: null,
      syncState: 'disconnected',
      isSyncing: false,
      lastError: null,
      pendingChangesCount: 0,

      // Open a GitHub repository as a project
      openProject: (repo: GitHubRepository, branch?: string) => {
        const project: GitHubProject = {
          id: `github-${repo.full_name}`,
          repository: repo,
          metadata: {
            owner: repo.owner.login,
            repo: repo.name,
            branch: branch || repo.default_branch,
            syncState: 'synced',
          },
          pendingChanges: new Map(),
          checkpoints: [],
          openedAt: new Date(),
        };

        set({
          currentProject: project,
          syncState: 'synced',
          pendingChangesCount: 0,
          lastError: null,
        });
      },

      // Close current project
      closeProject: () => {
        set({
          currentProject: null,
          syncState: 'disconnected',
          pendingChangesCount: 0,
        });
      },

      // Track a file change
      trackChange: (path: string, content: string, sha?: string) => {
        const project = get().currentProject;
        if (!project) return;

        const change: FileChange = {
          path,
          content,
          operation: sha ? 'update' : 'create',
          sha,
        };

        project.pendingChanges.set(path, change);

        set({
          currentProject: { ...project },
          pendingChangesCount: project.pendingChanges.size,
          syncState: 'pending',
        });
      },

      // Clear pending changes (after sync)
      clearPendingChanges: () => {
        const project = get().currentProject;
        if (!project) return;

        project.pendingChanges.clear();

        set({
          currentProject: { ...project },
          pendingChangesCount: 0,
        });
      },

      // Set sync state
      setSyncState: (state: SyncState) => {
        const project = get().currentProject;
        if (project) {
          project.metadata.syncState = state;
        }

        set({
          syncState: state,
          isSyncing: state === 'syncing',
          currentProject: project ? { ...project } : null,
        });
      },

      // Add checkpoint
      addCheckpoint: (checkpoint: Checkpoint) => {
        const project = get().currentProject;
        if (!project) return;

        project.checkpoints.unshift(checkpoint);

        set({
          currentProject: { ...project },
        });
      },

      // Set error
      setError: (error: string | null) => {
        set({ lastError: error });
      },
    }),
    { name: 'github-store' }
  )
);

// Selector hooks
export const useCurrentProject = () => useGitHubStore(state => state.currentProject);
export const useSyncState = () => useGitHubStore(state => state.syncState);
export const usePendingChanges = () => useGitHubStore(state => state.pendingChangesCount);
export const useGitHubActions = () => useGitHubStore(state => ({
  openProject: state.openProject,
  closeProject: state.closeProject,
  trackChange: state.trackChange,
  clearPendingChanges: state.clearPendingChanges,
  setSyncState: state.setSyncState,
  addCheckpoint: state.addCheckpoint,
}));

export default useGitHubStore;