/**
 * Export Manager - Export projects to various destinations
 */

import { createChildLogger, createTimer } from '@/lib/logger';
import type { 
  ExportFormat, 
  ExportOptions, 
  GitHubExportOptions, 
  VercelExportOptions, 
  ExportResult 
} from './types';
import type { ProjectFile } from '@/lib/projects/types';

const logger = createChildLogger('export');

export class ExportManager {
  /**
   * Export project files to the specified format
   */
  async export(
    files: ProjectFile[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const timer = createTimer(`export:${options.format}`);
    
    try {
      let result: ExportResult;
      
      switch (options.format) {
        case 'zip':
          result = await this.exportToZip(files, options);
          break;
        case 'github':
          result = await this.exportToGitHub(files, options as GitHubExportOptions);
          break;
        case 'vercel':
          result = await this.exportToVercel(files, options as VercelExportOptions);
          break;
        case 'codesandbox':
          result = await this.exportToCodeSandbox(files, options);
          break;
        default:
          throw new Error(`Unknown export format: ${options.format}`);
      }
      
      timer.end('Export completed', { format: options.format, success: result.success });
      return result;
    } catch (error: any) {
      logger.error({ error, format: options.format }, 'Export failed');
      timer.end('Export failed');
      return {
        success: false,
        format: options.format,
        error: error.message,
      };
    }
  }

  /**
   * Export to ZIP file
   */
  private async exportToZip(
    files: ProjectFile[],
    options: ExportOptions
  ): Promise<ExportResult> {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    
    const projectName = options.projectName || 'project';
    const folder = zip.folder(projectName);
    
    if (!folder) {
      throw new Error('Failed to create zip folder');
    }
    
    // Add project files
    for (const file of files) {
      folder.file(file.path, file.content);
    }
    
    // Add README if requested
    if (options.includeReadme) {
      folder.file('README.md', this.generateReadme(projectName));
    }
    
    // Add package.json if not present
    if (!files.some(f => f.path === 'package.json')) {
      folder.file('package.json', this.generatePackageJson(projectName));
    }
    
    // Generate blob
    const blob = await zip.generateAsync({ type: 'blob' });
    const dataUrl = URL.createObjectURL(blob);
    
    return {
      success: true,
      format: 'zip',
      downloadUrl: dataUrl,
    };
  }

  /**
   * Export to GitHub repository
   */
  private async exportToGitHub(
    files: ProjectFile[],
    options: GitHubExportOptions
  ): Promise<ExportResult> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GitHub token not configured');
    }
    
    const apiBase = 'https://api.github.com';
    const owner = options.organization || 'user';
    const repo = options.repoName;
    
    // Create repository
    const createRepoUrl = options.organization
      ? `${apiBase}/orgs/${options.organization}/repos`
      : `${apiBase}/user/repos`;
    
    const createRepoResponse = await fetch(createRepoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        name: repo,
        description: options.repoDescription,
        private: options.isPrivate ?? false,
        auto_init: false,
      }),
    });
    
    if (!createRepoResponse.ok && createRepoResponse.status !== 422) {
      const error = await createRepoResponse.json();
      throw new Error(`Failed to create repository: ${error.message}`);
    }
    
    // Upload files using the Trees API
    const blobs = await Promise.all(
      files.map(async (file) => {
        const blobResponse = await fetch(`${apiBase}/repos/${owner}/${repo}/git/blobs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          }),
        });
        const blob = await blobResponse.json();
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      })
    );
    
    // Create tree
    const treeResponse = await fetch(`${apiBase}/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tree: blobs }),
    });
    const tree = await treeResponse.json();
    
    // Create commit
    const commitResponse = await fetch(`${apiBase}/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Initial commit from Open Lovable',
        tree: tree.sha,
      }),
    });
    const commit = await commitResponse.json();
    
    // Update main branch
    await fetch(`${apiBase}/repos/${owner}/${repo}/git/refs/heads/main`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'refs/heads/main',
        sha: commit.sha,
      }),
    });
    
    logger.info({ owner, repo }, 'Project exported to GitHub');
    
    return {
      success: true,
      format: 'github',
      url: `https://github.com/${owner}/${repo}`,
    };
  }

  /**
   * Export to Vercel deployment
   */
  private async exportToVercel(
    files: ProjectFile[],
    options: VercelExportOptions
  ): Promise<ExportResult> {
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      throw new Error('Vercel token not configured');
    }
    
    const apiBase = 'https://api.vercel.com';
    
    // Prepare files for deployment
    const deployFiles = files.map(file => ({
      file: file.path,
      data: file.content,
    }));
    
    // Create deployment
    const deployResponse = await fetch(`${apiBase}/v13/deployments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: options.projectName,
        files: deployFiles,
        projectSettings: {
          framework: options.framework || 'vite',
        },
        target: 'production',
        ...(options.teamId && { teamId: options.teamId }),
      }),
    });
    
    if (!deployResponse.ok) {
      const error = await deployResponse.json();
      throw new Error(`Failed to create deployment: ${error.message || 'Unknown error'}`);
    }
    
    const deployment = await deployResponse.json();
    
    logger.info({ deploymentId: deployment.id, url: deployment.url }, 'Project deployed to Vercel');
    
    return {
      success: true,
      format: 'vercel',
      url: `https://${deployment.url}`,
    };
  }

  /**
   * Export to CodeSandbox
   */
  private async exportToCodeSandbox(
    files: ProjectFile[],
    options: ExportOptions
  ): Promise<ExportResult> {
    // Prepare files for CodeSandbox API
    const sandboxFiles: Record<string, { content: string }> = {};
    
    for (const file of files) {
      sandboxFiles[file.path] = { content: file.content };
    }
    
    // Ensure package.json exists
    if (!sandboxFiles['package.json']) {
      sandboxFiles['package.json'] = {
        content: this.generatePackageJson(options.projectName || 'project'),
      };
    }
    
    // Create sandbox
    const response = await fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: sandboxFiles }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create CodeSandbox');
    }
    
    const result = await response.json();
    
    logger.info({ sandboxId: result.sandbox_id }, 'Project exported to CodeSandbox');
    
    return {
      success: true,
      format: 'codesandbox',
      url: `https://codesandbox.io/s/${result.sandbox_id}`,
    };
  }

  private generateReadme(projectName: string): string {
    return `# ${projectName}

Generated with [Open Lovable](https://github.com/open-lovable/open-lovable)

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Built With

- React
- Vite
- Tailwind CSS
`;
  }

  private generatePackageJson(projectName: string): string {
    return JSON.stringify({
      name: projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.0.0',
        vite: '^5.0.0',
        tailwindcss: '^3.4.0',
        autoprefixer: '^10.4.0',
        postcss: '^8.4.0',
      },
    }, null, 2);
  }
}

let exportManagerInstance: ExportManager | null = null;

export function getExportManager(): ExportManager {
  if (!exportManagerInstance) {
    exportManagerInstance = new ExportManager();
  }
  return exportManagerInstance;
}

export default getExportManager;