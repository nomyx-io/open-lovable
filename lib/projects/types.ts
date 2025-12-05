/**
 * Project Persistence Types - Data models for saved projects
 * 
 * This module defines the data structures for:
 * - Projects (saved website clones)
 * - Versions (change history)
 * - Files (project contents)
 */

/**
 * Project entity - represents a saved website clone project
 */
export interface Project {
  /** Unique identifier (UUID) */
  id: string;
  /** User-defined project name */
  name: string;
  /** Optional description */
  description?: string;
  /** Original URL that was cloned */
  sourceUrl?: string;
  /** Screenshot thumbnail (base64 or URL) */
  thumbnail?: string;
  /** AI model used for generation */
  aiModel: string;
  /** Project status */
  status: 'draft' | 'generating' | 'complete' | 'error';
  /** Project tags for organization */
  tags: string[];
  /** Owner user ID (optional, for multi-user systems) */
  userId?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** Current version number */
  currentVersion: number;
}

/**
 * Project file - a single file in the project
 */
export interface ProjectFile {
  /** Unique identifier */
  id: string;
  /** Parent project ID */
  projectId: string;
  /** File path relative to project root */
  path: string;
  /** File content */
  content: string;
  /** Content hash for change detection */
  contentHash: string;
  /** File language/type */
  language?: string;
  /** Last modified timestamp */
  updatedAt: Date;
}

/**
 * Project version - snapshot for version history
 */
export interface ProjectVersion {
  /** Unique identifier */
  id: string;
  /** Parent project ID */
  projectId: string;
  /** Version number (incrementing) */
  versionNumber: number;
  /** Commit message */
  message: string;
  /** Who created this version */
  createdBy?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Number of files in this version */
  fileCount: number;
  /** Total size in bytes */
  totalSize: number;
}

/**
 * File snapshot - file state at a specific version
 */
export interface FileSnapshot {
  /** Unique identifier */
  id: string;
  /** Parent version ID */
  versionId: string;
  /** File path */
  path: string;
  /** File content */
  content: string;
  /** Content hash */
  contentHash: string;
}

/**
 * Create project input
 */
export interface CreateProjectInput {
  name: string;
  description?: string;
  sourceUrl?: string;
  thumbnail?: string;
  aiModel: string;
  tags?: string[];
  userId?: string;
}

/**
 * Update project input
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  status?: Project['status'];
}

/**
 * Create version input
 */
export interface CreateVersionInput {
  message: string;
  createdBy?: string;
  files: Array<{ path: string; content: string }>;
}

/**
 * Project with files
 */
export interface ProjectWithFiles extends Project {
  files: ProjectFile[];
}

/**
 * Project with version history
 */
export interface ProjectWithVersions extends Project {
  versions: ProjectVersion[];
}

/**
 * Query options for listing projects
 */
export interface ProjectQueryOptions {
  /** Filter by user ID */
  userId?: string;
  /** Filter by status */
  status?: Project['status'];
  /** Filter by tags (any match) */
  tags?: string[];
  /** Search query (name, description) */
  search?: string;
  /** Sort field */
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  /** Sort direction */
  sortDir?: 'asc' | 'desc';
  /** Pagination offset */
  offset?: number;
  /** Pagination limit */
  limit?: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}