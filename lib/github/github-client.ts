/**
 * GitHub Client Service
 * 
 * Wrapper around Octokit for GitHub API operations.
 */

import { Octokit } from '@octokit/rest';
import type {
  GitHubRepository,
  FileTreeNode,
  FileContent,
  FileChange,
  GitCommit,
  GitBranch,
  GitHubUser,
} from './types';

/**
 * GitHub API client
 */
export class GitHubClient {
  private octokit: Octokit;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  /**
   * Get authenticated user info
   */
  async getUser(): Promise<GitHubUser> {
    const { data } = await this.octokit.users.getAuthenticated();
    return {
      id: data.id,
      login: data.login,
      name: data.name,
      email: data.email,
      avatar_url: data.avatar_url,
      html_url: data.html_url,
    };
  }

  /**
   * List user's repositories
   * @param options - Filter options
   */
  async listRepositories(options: {
    type?: 'all' | 'owner' | 'public' | 'private' | 'member';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    perPage?: number;
    page?: number;
  } = {}): Promise<GitHubRepository[]> {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      type: options.type || 'owner',
      sort: options.sort || 'pushed',
      per_page: options.perPage || 100,
      page: options.page || 1,
      direction: 'desc',
    });

    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
      },
      private: repo.private,
      default_branch: repo.default_branch,
      description: repo.description,
      html_url: repo.html_url,
      pushed_at: repo.pushed_at,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      size: repo.size,
      language: repo.language,
      topics: repo.topics,
    }));
  }

  /**
   * List repositories that have a package.json file
   */
  async listNodeProjects(): Promise<GitHubRepository[]> {
    const repos = await this.listRepositories();
    const nodeProjects: GitHubRepository[] = [];

    // Check each repo for package.json
    for (const repo of repos) {
      try {
        await this.octokit.repos.getContent({
          owner: repo.owner.login,
          repo: repo.name,
          path: 'package.json',
        });
        nodeProjects.push({ ...repo, hasPackageJson: true });
      } catch {
        // No package.json, skip
      }
    }

    return nodeProjects;
  }

  /**
   * Get repository details
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const { data } = await this.octokit.repos.get({ owner, repo });
    
    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      owner: {
        login: data.owner.login,
        avatar_url: data.owner.avatar_url,
      },
      private: data.private,
      default_branch: data.default_branch,
      description: data.description,
      html_url: data.html_url,
      pushed_at: data.pushed_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
      size: data.size,
      language: data.language,
      topics: data.topics,
    };
  }

  /**
   * Get repository contents (file tree)
   */
  async getContents(
    owner: string,
    repo: string,
    path: string = '',
    ref?: string
  ): Promise<FileTreeNode[]> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if (!Array.isArray(data)) {
      // Single file, wrap in array
      return [{
        path: data.path,
        type: data.type as 'file' | 'dir',
        size: data.size,
        sha: data.sha,
        url: data.html_url || undefined,
      }];
    }

    return data.map(item => ({
      path: item.path,
      type: item.type as 'file' | 'dir',
      size: item.size,
      sha: item.sha,
      url: item.html_url || undefined,
    }));
  }

  /**
   * Get full file tree recursively
   */
  async getFileTree(
    owner: string,
    repo: string,
    ref?: string
  ): Promise<FileTreeNode[]> {
    const { data } = await this.octokit.git.getTree({
      owner,
      repo,
      tree_sha: ref || 'HEAD',
      recursive: 'true',
    });

    return data.tree
      .filter(item => item.type === 'blob' || item.type === 'tree')
      .map(item => ({
        path: item.path || '',
        type: item.type === 'blob' ? 'file' : 'dir',
        size: item.size,
        sha: item.sha || '',
      }));
  }

  /**
   * Get file content
   */
  async getFile(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<FileContent> {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    if (Array.isArray(data)) {
      throw new Error(`Path ${path} is a directory, not a file`);
    }

    if (data.type !== 'file' || !('content' in data)) {
      throw new Error(`Cannot read content of ${path}`);
    }

    // Decode base64 content
    const content = Buffer.from(data.content, 'base64').toString('utf-8');

    return {
      path: data.path,
      content,
      sha: data.sha,
      encoding: 'utf-8',
      size: data.size,
    };
  }

  /**
   * Get multiple files in parallel
   */
  async getFiles(
    owner: string,
    repo: string,
    paths: string[],
    ref?: string
  ): Promise<Map<string, FileContent>> {
    const results = new Map<string, FileContent>();

    const filePromises = paths.map(async (path) => {
      try {
        const file = await this.getFile(owner, repo, path, ref);
        results.set(path, file);
      } catch {
        // Skip files that can't be read
        console.warn(`Could not read file: ${path}`);
      }
    });

    await Promise.all(filePromises);
    return results;
  }

  /**
   * Create or update a single file
   */
  async upsertFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
    branch?: string
  ): Promise<{ sha: string; commit: string }> {
    const { data } = await this.octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha,
      branch,
    });

    return {
      sha: data.content?.sha || '',
      commit: data.commit?.sha || '',
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(
    owner: string,
    repo: string,
    path: string,
    sha: string,
    message: string,
    branch?: string
  ): Promise<void> {
    await this.octokit.repos.deleteFile({
      owner,
      repo,
      path,
      message,
      sha,
      branch,
    });
  }

  /**
   * Create a commit with multiple file changes
   */
  async createCommit(
    owner: string,
    repo: string,
    changes: FileChange[],
    message: string,
    branch?: string
  ): Promise<GitCommit> {
    // Get the reference to the branch
    const targetBranch = branch || (await this.getRepository(owner, repo)).default_branch;
    const ref = `heads/${targetBranch}`;
    
    const { data: refData } = await this.octokit.git.getRef({
      owner,
      repo,
      ref,
    });

    const baseSha = refData.object.sha;

    // Get the base tree
    const { data: baseCommit } = await this.octokit.git.getCommit({
      owner,
      repo,
      commit_sha: baseSha,
    });

    // Create blobs for each file
    const treeItems: Array<{
      path: string;
      mode: '100644' | '100755' | '040000' | '160000' | '120000';
      type: 'blob' | 'tree' | 'commit';
      sha?: string;
    }> = [];

    for (const change of changes) {
      if (change.operation === 'delete') {
        // For deletions, we just don't include the file in the new tree
        continue;
      }

      // Create a blob for the file content
      const { data: blob } = await this.octokit.git.createBlob({
        owner,
        repo,
        content: Buffer.from(change.content).toString('base64'),
        encoding: 'base64',
      });

      treeItems.push({
        path: change.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
    }

    // Create a new tree
    const { data: newTree } = await this.octokit.git.createTree({
      owner,
      repo,
      base_tree: baseCommit.tree.sha,
      tree: treeItems,
    });

    // Create the commit
    const { data: newCommit } = await this.octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.sha,
      parents: [baseSha],
    });

    // Update the reference
    await this.octokit.git.updateRef({
      owner,
      repo,
      ref,
      sha: newCommit.sha,
    });

    return {
      sha: newCommit.sha,
      message: newCommit.message,
      author: {
        name: newCommit.author?.name || '',
        email: newCommit.author?.email || '',
        date: newCommit.author?.date || '',
      },
      committer: {
        name: newCommit.committer?.name || '',
        email: newCommit.committer?.email || '',
        date: newCommit.committer?.date || '',
      },
      html_url: newCommit.html_url || '',
      parents: newCommit.parents.map(p => ({ sha: p.sha })),
    };
  }

  /**
   * List commits
   */
  async listCommits(
    owner: string,
    repo: string,
    options: {
      branch?: string;
      path?: string;
      perPage?: number;
      page?: number;
    } = {}
  ): Promise<GitCommit[]> {
    const { data } = await this.octokit.repos.listCommits({
      owner,
      repo,
      sha: options.branch,
      path: options.path,
      per_page: options.perPage || 30,
      page: options.page || 1,
    });

    return data.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author?.name || '',
        email: commit.commit.author?.email || '',
        date: commit.commit.author?.date || '',
      },
      committer: {
        name: commit.commit.committer?.name || '',
        email: commit.commit.committer?.email || '',
        date: commit.commit.committer?.date || '',
      },
      html_url: commit.html_url,
      parents: commit.parents.map(p => ({ sha: p.sha })),
    }));
  }

  /**
   * Get a specific commit
   */
  async getCommit(owner: string, repo: string, sha: string): Promise<GitCommit> {
    const { data } = await this.octokit.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });

    return {
      sha: data.sha,
      message: data.commit.message,
      author: {
        name: data.commit.author?.name || '',
        email: data.commit.author?.email || '',
        date: data.commit.author?.date || '',
      },
      committer: {
        name: data.commit.committer?.name || '',
        email: data.commit.committer?.email || '',
        date: data.commit.committer?.date || '',
      },
      html_url: data.html_url,
      parents: data.parents.map(p => ({ sha: p.sha })),
    };
  }

  /**
   * List branches
   */
  async listBranches(owner: string, repo: string): Promise<GitBranch[]> {
    const { data } = await this.octokit.repos.listBranches({
      owner,
      repo,
    });

    return data.map(branch => ({
      name: branch.name,
      protected: branch.protected,
      commit: {
        sha: branch.commit.sha,
        url: branch.commit.url,
      },
    }));
  }

  /**
   * Compare two commits
   */
  async compareCommits(
    owner: string,
    repo: string,
    base: string,
    head: string
  ): Promise<{
    ahead_by: number;
    behind_by: number;
    total_commits: number;
    files: Array<{
      filename: string;
      status: 'added' | 'removed' | 'modified' | 'renamed' | 'changed' | 'copied';
      additions: number;
      deletions: number;
    }>;
  }> {
    const { data } = await this.octokit.repos.compareCommits({
      owner,
      repo,
      base,
      head,
    });

    return {
      ahead_by: data.ahead_by,
      behind_by: data.behind_by,
      total_commits: data.total_commits,
      files: (data.files || []).map(file => ({
        filename: file.filename,
        status: file.status as 'added' | 'removed' | 'modified' | 'renamed' | 'changed' | 'copied',
        additions: file.additions,
        deletions: file.deletions,
      })),
    };
  }
}

/**
 * Create a GitHub client from an access token
 */
export function createGitHubClient(accessToken: string): GitHubClient {
  return new GitHubClient(accessToken);
}

export default GitHubClient;