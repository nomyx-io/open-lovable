import type { ProjectTypeConfig } from '@/lib/projects/project-type';

export interface SandboxFile {
  path: string;
  content: string;
  lastModified?: number;
}

export interface SandboxInfo {
  sandboxId: string;
  url: string;
  provider: 'e2b' | 'vercel';
  createdAt: Date;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export interface SandboxProviderConfig {
  e2b?: {
    apiKey: string;
    timeoutMs?: number;
    template?: string;
  };
  vercel?: {
    teamId?: string;
    projectId?: string;
    token?: string;
    authMethod?: 'oidc' | 'pat';
  };
}

export abstract class SandboxProvider {
  protected config: SandboxProviderConfig;
  protected sandbox: any;
  protected sandboxInfo: SandboxInfo | null = null;

  constructor(config: SandboxProviderConfig) {
    this.config = config;
  }

  abstract createSandbox(): Promise<SandboxInfo>;
  abstract runCommand(command: string): Promise<CommandResult>;
  abstract writeFile(path: string, content: string): Promise<void>;
  abstract readFile(path: string): Promise<string>;
  abstract listFiles(directory?: string): Promise<string[]>;
  abstract installPackages(packages: string[]): Promise<CommandResult>;
  abstract getSandboxUrl(): string | null;
  abstract getSandboxInfo(): SandboxInfo | null;
  abstract terminate(): Promise<void>;
  abstract isAlive(): boolean;
  
  // === Project Setup Methods ===
  
  /**
   * Generic project setup - sets up a project based on the provided configuration
   * This is the preferred method for setting up projects.
   */
  async setupProject(projectType: ProjectTypeConfig): Promise<void> {
    // Default implementation delegates to specific setup methods based on project type
    switch (projectType.id) {
      case 'vite-react':
        return this.setupViteApp();
      case 'nextjs-app':
        return this.setupNextApp();
      case 'astro':
        return this.setupAstroApp();
      default:
        throw new Error(`setupProject not implemented for project type: ${projectType.id}`);
    }
  }
  
  /**
   * Setup Vite + React app (legacy method, kept for backwards compatibility)
   */
  async setupViteApp(): Promise<void> {
    throw new Error('setupViteApp not implemented for this provider');
  }
  
  /**
   * Setup Next.js App Router project
   */
  async setupNextApp(): Promise<void> {
    throw new Error('setupNextApp not implemented for this provider');
  }
  
  /**
   * Setup Astro project with React integration
   */
  async setupAstroApp(): Promise<void> {
    throw new Error('setupAstroApp not implemented for this provider');
  }
  
  /**
   * Restart the dev server for a specific project type
   */
  async restartDevServer(projectType: ProjectTypeConfig): Promise<void> {
    switch (projectType.id) {
      case 'vite-react':
        return this.restartViteServer();
      case 'nextjs-app':
        return this.restartNextServer();
      case 'astro':
        return this.restartAstroServer();
      default:
        throw new Error(`restartDevServer not implemented for project type: ${projectType.id}`);
    }
  }
  
  /**
   * Restart Vite server (legacy method, kept for backwards compatibility)
   */
  async restartViteServer(): Promise<void> {
    throw new Error('restartViteServer not implemented for this provider');
  }
  
  /**
   * Restart Next.js dev server
   */
  async restartNextServer(): Promise<void> {
    throw new Error('restartNextServer not implemented for this provider');
  }
  
  /**
   * Restart Astro dev server
   */
  async restartAstroServer(): Promise<void> {
    throw new Error('restartAstroServer not implemented for this provider');
  }
}