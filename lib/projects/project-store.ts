/**
 * Project Store - Storage layer for project persistence
 */

import { createChildLogger } from '@/lib/logger';
import type {
  Project,
  ProjectFile,
  ProjectVersion,
  FileSnapshot,
  CreateProjectInput,
  UpdateProjectInput,
  CreateVersionInput,
  ProjectWithFiles,
  ProjectWithVersions,
  ProjectQueryOptions,
  PaginatedResult,
} from './types';

const logger = createChildLogger('project-store');

function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash) + content.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString(36);
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export interface ProjectStorage {
  createProject(input: CreateProjectInput): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  getProjectWithFiles(id: string): Promise<ProjectWithFiles | null>;
  updateProject(id: string, input: UpdateProjectInput): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  listProjects(options?: ProjectQueryOptions): Promise<PaginatedResult<Project>>;
  getProjectFiles(projectId: string): Promise<ProjectFile[]>;
  upsertFile(projectId: string, path: string, content: string): Promise<ProjectFile>;
  deleteFile(projectId: string, path: string): Promise<void>;
  createVersion(projectId: string, input: CreateVersionInput): Promise<ProjectVersion>;
  getVersions(projectId: string): Promise<ProjectVersion[]>;
}

export class LocalStorageProjectStore implements ProjectStorage {
  private readonly prefix = 'open-lovable:';
  
  private getKey(type: string, id?: string): string {
    return id ? `${this.prefix}${type}:${id}` : `${this.prefix}${type}`;
  }
  
  private getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      const parsed = JSON.parse(item);
      if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
      if (parsed.updatedAt) parsed.updatedAt = new Date(parsed.updatedAt);
      return parsed;
    } catch { return null; }
  }
  
  private setItem(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const project: Project = {
      id: generateId(),
      name: input.name,
      description: input.description,
      sourceUrl: input.sourceUrl,
      thumbnail: input.thumbnail,
      aiModel: input.aiModel,
      status: 'draft',
      tags: input.tags || [],
      userId: input.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentVersion: 0,
    };
    this.setItem(this.getKey('project', project.id), project);
    logger.info({ projectId: project.id }, 'Project created');
    return project;
  }
  
  async getProject(id: string): Promise<Project | null> {
    return this.getItem<Project>(this.getKey('project', id));
  }
  
  async getProjectWithFiles(id: string): Promise<ProjectWithFiles | null> {
    const project = await this.getProject(id);
    if (!project) return null;
    const files = await this.getProjectFiles(id);
    return { ...project, files };
  }
  
  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    const project = await this.getProject(id);
    if (!project) throw new Error(`Project not found: ${id}`);
    const updated = { ...project, ...input, updatedAt: new Date() };
    this.setItem(this.getKey('project', id), updated);
    return updated;
  }
  
  async deleteProject(id: string): Promise<void> {
    localStorage.removeItem(this.getKey('project', id));
    logger.info({ projectId: id }, 'Project deleted');
  }
  
  async listProjects(options: ProjectQueryOptions = {}): Promise<PaginatedResult<Project>> {
    const projects: Project[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.prefix}project:`)) {
        const project = this.getItem<Project>(key);
        if (project) projects.push(project);
      }
    }
    projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    return {
      items: projects.slice(offset, offset + limit),
      total: projects.length,
      offset,
      limit,
      hasMore: offset + limit < projects.length,
    };
  }
  
  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    const files: ProjectFile[] = [];
    const prefix = `${this.prefix}file:${projectId}:`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const file = this.getItem<ProjectFile>(key);
        if (file) files.push(file);
      }
    }
    return files.sort((a, b) => a.path.localeCompare(b.path));
  }
  
  async upsertFile(projectId: string, path: string, content: string): Promise<ProjectFile> {
    const file: ProjectFile = {
      id: generateId(),
      projectId,
      path,
      content,
      contentHash: hashContent(content),
      updatedAt: new Date(),
    };
    this.setItem(this.getKey('file', `${projectId}:${path}`), file);
    return file;
  }
  
  async deleteFile(projectId: string, path: string): Promise<void> {
    localStorage.removeItem(this.getKey('file', `${projectId}:${path}`));
  }
  
  async createVersion(projectId: string, input: CreateVersionInput): Promise<ProjectVersion> {
    const project = await this.getProject(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    
    const version: ProjectVersion = {
      id: generateId(),
      projectId,
      versionNumber: project.currentVersion + 1,
      message: input.message,
      createdBy: input.createdBy,
      createdAt: new Date(),
      fileCount: input.files.length,
      totalSize: input.files.reduce((s, f) => s + f.content.length, 0),
    };
    
    this.setItem(this.getKey('version', `${projectId}:${version.id}`), version);
    this.setItem(this.getKey('project', projectId), { ...project, currentVersion: version.versionNumber });
    
    for (const file of input.files) {
      const snapshot: FileSnapshot = {
        id: generateId(),
        versionId: version.id,
        path: file.path,
        content: file.content,
        contentHash: hashContent(file.content),
      };
      this.setItem(this.getKey('snapshot', `${version.id}:${file.path}`), snapshot);
    }
    
    logger.info({ projectId, versionNumber: version.versionNumber }, 'Version created');
    return version;
  }
  
  async getVersions(projectId: string): Promise<ProjectVersion[]> {
    const versions: ProjectVersion[] = [];
    const prefix = `${this.prefix}version:${projectId}:`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const version = this.getItem<ProjectVersion>(key);
        if (version) versions.push(version);
      }
    }
    return versions.sort((a, b) => b.versionNumber - a.versionNumber);
  }
}

let storeInstance: ProjectStorage | null = null;

export function getProjectStore(): ProjectStorage {
  if (!storeInstance && typeof window !== 'undefined') {
    storeInstance = new LocalStorageProjectStore();
  }
  if (!storeInstance) {
    throw new Error('Project store not available on server');
  }
  return storeInstance;
}

export default getProjectStore;