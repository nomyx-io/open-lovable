/**
 * OL-Cache Manager
 * 
 * Manages the creation, reading, and updating of AI-friendly documentation cache.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  ProjectDocumentation,
  FileDocumentation,
  FileType,
  ExportInfo,
  ImportInfo,
  ComponentDocumentation,
  FunctionDocumentation,
  DirectoryNode,
  CacheReadOptions,
  CacheGenerateOptions,
  CacheContext,
} from './types';

const CACHE_DIR = '.ol-cache';
const CACHE_FILE = 'project-docs.json';
const CACHE_VERSION = '1.0.0';

/**
 * Cache Manager for AI documentation
 */
export class OLCacheManager {
  private rootDir: string;
  private cacheDir: string;
  private cacheFile: string;
  private projectDoc: ProjectDocumentation | null = null;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.cacheDir = path.join(rootDir, CACHE_DIR);
    this.cacheFile = path.join(this.cacheDir, CACHE_FILE);
  }

  /**
   * Generate documentation for the entire project
   */
  async generateCache(options: Partial<CacheGenerateOptions> = {}): Promise<ProjectDocumentation> {
    const {
      excludePatterns = ['node_modules', '.git', 'dist', 'build', '.next', '.ol-cache'],
      force = false,
      projectType = this.detectProjectType(),
    } = options;

    if (!force && await this.isCacheFresh()) {
      const cached = await this.loadCache();
      if (cached) return cached;
    }

    await this.ensureCacheDir();

    const now = new Date().toISOString();
    this.projectDoc = {
      name: path.basename(this.rootDir),
      projectType,
      rootDir: this.rootDir,
      createdAt: now,
      updatedAt: now,
      cacheVersion: CACHE_VERSION,
      description: await this.generateProjectDescription(projectType),
      technologies: this.detectTechnologies(),
      structure: await this.buildDirectoryStructure(excludePatterns),
      componentTree: {},
      routes: [],
      patterns: [],
      conventions: this.getProjectConventions(projectType),
      files: {},
    };

    await this.scanDirectory(this.rootDir, excludePatterns);
    this.buildComponentTree();
    this.detectRoutes();
    this.extractPatterns();
    await this.saveCache();

    return this.projectDoc;
  }

  /**
   * Update documentation for specific files
   */
  async updateFiles(filePaths: string[]): Promise<void> {
    if (!this.projectDoc) await this.loadCache();
    if (!this.projectDoc) { await this.generateCache(); return; }

    for (const filePath of filePaths) {
      const relativePath = path.relative(this.rootDir, filePath);
      if (fs.existsSync(filePath)) {
        const doc = await this.documentFile(filePath, relativePath);
        this.projectDoc.files[relativePath] = doc;
      } else {
        delete this.projectDoc.files[relativePath];
      }
    }

    this.projectDoc.updatedAt = new Date().toISOString();
    await this.saveCache();
  }

  /**
   * Read cached documentation with filters
   */
  async readCache(options: CacheReadOptions = {}): Promise<CacheContext> {
    const cached = await this.loadCache();
    if (!cached) {
      return { contextString: '', filesIncluded: [], cacheFound: false, isFresh: false, relevantPatterns: [] };
    }

    const { fileTypes, pathPatterns, maxFiles = 50, includeContent = false } = options;
    let files = Object.entries(cached.files);

    if (fileTypes?.length) {
      files = files.filter(([, doc]) => fileTypes.includes(doc.type));
    }
    if (pathPatterns?.length) {
      files = files.filter(([filePath]) =>
        pathPatterns.some(pattern => new RegExp(pattern.replace(/\*/g, '.*')).test(filePath))
      );
    }

    files = files.slice(0, maxFiles);
    const contextString = this.buildContextString(cached, files, includeContent);

    return {
      contextString,
      filesIncluded: files.map(([p]) => p),
      cacheFound: true,
      isFresh: await this.isCacheFresh(),
      relevantPatterns: cached.patterns,
    };
  }

  /**
   * Get context relevant to a specific implementation step
   */
  async getContextForStep(stepDescription: string): Promise<CacheContext> {
    const cached = await this.loadCache();
    if (!cached) {
      return { contextString: '', filesIncluded: [], cacheFound: false, isFresh: false, relevantPatterns: [] };
    }

    const relevantTypes = this.inferRelevantTypes(stepDescription);
    const relevantFiles = this.findRelevantFiles(cached, stepDescription, relevantTypes);
    const contextString = this.buildFocusedContext(cached, relevantFiles, stepDescription);

    return {
      contextString,
      filesIncluded: relevantFiles.map(f => f.path),
      cacheFound: true,
      isFresh: await this.isCacheFresh(),
      relevantPatterns: this.getRelevantPatterns(cached, stepDescription),
    };
  }

  private async ensureCacheDir(): Promise<void> {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private async loadCache(): Promise<ProjectDocumentation | null> {
    if (this.projectDoc) return this.projectDoc;
    try {
      if (fs.existsSync(this.cacheFile)) {
        const content = fs.readFileSync(this.cacheFile, 'utf-8');
        this.projectDoc = JSON.parse(content);
        return this.projectDoc;
      }
    } catch (error) {
      console.error('[OLCache] Error loading cache:', error);
    }
    return null;
  }

  private async saveCache(): Promise<void> {
    if (!this.projectDoc) return;
    await this.ensureCacheDir();
    fs.writeFileSync(this.cacheFile, JSON.stringify(this.projectDoc, null, 2), 'utf-8');
  }

  private async isCacheFresh(): Promise<boolean> {
    if (!fs.existsSync(this.cacheFile)) return false;
    try {
      const cached = await this.loadCache();
      if (!cached || cached.cacheVersion !== CACHE_VERSION) return false;
      const cacheStat = fs.statSync(this.cacheFile);
      const cacheTime = cacheStat.mtimeMs;
      for (const filePath of Object.keys(cached.files).slice(0, 20)) {
        const fullPath = path.join(this.rootDir, filePath);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).mtimeMs > cacheTime) return false;
      }
      return true;
    } catch { return false; }
  }

  private detectProjectType(): string {
    if (fs.existsSync(path.join(this.rootDir, 'next.config.js')) ||
        fs.existsSync(path.join(this.rootDir, 'next.config.ts')) ||
        fs.existsSync(path.join(this.rootDir, 'next.config.mjs'))) {
      return fs.existsSync(path.join(this.rootDir, 'app')) ? 'nextjs-app' : 'nextjs-pages';
    }
    if (fs.existsSync(path.join(this.rootDir, 'astro.config.mjs')) ||
        fs.existsSync(path.join(this.rootDir, 'astro.config.ts'))) return 'astro';
    if (fs.existsSync(path.join(this.rootDir, 'vite.config.js')) ||
        fs.existsSync(path.join(this.rootDir, 'vite.config.ts'))) return 'vite-react';
    return 'unknown';
  }

  private detectTechnologies(): string[] {
    const techs: string[] = [];
    const pkgPath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps['react']) techs.push('React');
        if (allDeps['next']) techs.push('Next.js');
        if (allDeps['tailwindcss']) techs.push('Tailwind CSS');
        if (allDeps['typescript']) techs.push('TypeScript');
        if (allDeps['zustand']) techs.push('Zustand');
      } catch {}
    }
    return techs;
  }

  private async generateProjectDescription(projectType: string): Promise<string> {
    const pkgPath = path.join(this.rootDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.description) return pkg.description;
      } catch {}
    }
    return `A ${projectType} project`;
  }

  private getProjectConventions(projectType: string): string[] {
    const conventions = ['Use consistent file naming', 'Export components as default exports'];
    if (projectType === 'nextjs-app') {
      conventions.push('Use App Router conventions', 'Use server components by default');
    }
    return conventions;
  }

  private async buildDirectoryStructure(excludePatterns: string[]): Promise<DirectoryNode> {
    return this.scanDirRecursive(this.rootDir, excludePatterns, 0, 3);
  }

  private scanDirRecursive(dir: string, excludePatterns: string[], depth: number, maxDepth: number): DirectoryNode {
    const node: DirectoryNode = { name: path.basename(dir), type: 'directory', children: [] };
    if (depth >= maxDepth) return node;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (excludePatterns.some(p => entry.name.includes(p))) continue;
        if (entry.isDirectory()) {
          node.children!.push(this.scanDirRecursive(path.join(dir, entry.name), excludePatterns, depth + 1, maxDepth));
        } else {
          node.children!.push({ name: entry.name, type: 'file', fileType: this.inferFileType(entry.name) });
        }
      }
    } catch {}
    return node;
  }

  private async scanDirectory(dir: string, excludePatterns: string[]): Promise<void> {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (excludePatterns.some(p => entry.name.includes(p))) continue;
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.rootDir, fullPath);
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, excludePatterns);
        } else if (this.isSourceFile(entry.name)) {
          const doc = await this.documentFile(fullPath, relativePath);
          this.projectDoc!.files[relativePath] = doc;
        }
      }
    } catch (error) {
      console.error(`[OLCache] Error scanning ${dir}:`, error);
    }
  }

  private isSourceFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ['.ts', '.tsx', '.js', '.jsx', '.css', '.json'].includes(ext);
  }

  private inferFileType(filename: string): FileType {
    const ext = path.extname(filename).toLowerCase();
    const name = filename.toLowerCase();
    if (name.includes('.test.') || name.includes('.spec.')) return 'test';
    if (name.includes('.config.')) return 'config';
    if (ext === '.css') return 'style';
    if (name.includes('hook') || name.startsWith('use')) return 'hook';
    if (name.includes('store')) return 'store';
    if (name.includes('util') || name.includes('lib')) return 'utility';
    if (name.includes('page') || name === 'page.tsx') return 'page';
    if (['.tsx', '.jsx'].includes(ext)) return 'component';
    return 'other';
  }

  private async documentFile(fullPath: string, relativePath: string): Promise<FileDocumentation> {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const stat = fs.statSync(fullPath);
    const hash = crypto.createHash('md5').update(content).digest('hex');
    const fileType = this.inferFileType(relativePath);

    const doc: FileDocumentation = {
      path: relativePath,
      type: fileType,
      lastModified: stat.mtime.toISOString(),
      contentHash: hash,
      description: this.generateFileDescription(content, fileType, relativePath),
      exports: this.extractExports(content),
      imports: this.extractImports(content),
      patterns: this.detectFilePatterns(content),
      aiNotes: this.generateAINotes(content, fileType),
    };

    if (['component', 'page', 'layout'].includes(fileType)) {
      doc.componentInfo = this.extractComponentInfo(content, relativePath);
    }
    if (['utility', 'hook'].includes(fileType)) {
      doc.functions = this.extractFunctions(content);
    }
    return doc;
  }

  private generateFileDescription(content: string, type: FileType, filePath: string): string {
    const name = path.basename(filePath, path.extname(filePath));
    const typeNames: Record<string, string> = {
      component: 'React component', page: 'Page component', hook: 'Custom hook',
      store: 'State store', utility: 'Utility functions', config: 'Configuration',
    };
    return `${typeNames[type] || 'File'}: ${name}`;
  }

  private extractExports(content: string): ExportInfo[] {
    const exports: ExportInfo[] = [];
    const defaultMatch = content.match(/export\s+default\s+(\w+)/);
    if (defaultMatch) exports.push({ name: defaultMatch[1], kind: 'default' });
    const namedExports = content.matchAll(/export\s+(const|function|class|type|interface)\s+(\w+)/g);
    for (const match of namedExports) {
      exports.push({ name: match[2], kind: match[1] as ExportInfo['kind'] });
    }
    return exports;
  }

  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const regex = /import\s+(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      imports.push({
        from: match[3],
        isExternal: !match[3].startsWith('.') && !match[3].startsWith('@/'),
        default: match[1],
        named: match[2]?.split(',').map(s => s.trim()).filter(Boolean),
      });
    }
    return imports;
  }

  private extractComponentInfo(content: string, filePath: string): ComponentDocumentation {
    const name = path.basename(filePath, path.extname(filePath));
    const props: ComponentDocumentation['props'] = [];
    const state: ComponentDocumentation['state'] = [];
    const children: string[] = [];

    const stateMatches = content.matchAll(/const\s+\[(\w+),/g);
    for (const match of stateMatches) state.push({ name: match[1], type: 'unknown', purpose: match[1] });

    const jsxMatches = content.matchAll(/<([A-Z]\w+)/g);
    for (const match of jsxMatches) if (!children.includes(match[1])) children.push(match[1]);

    return { name, props, state, children, events: [], a11y: [], styling: 'tailwind' };
  }

  private extractFunctions(content: string): FunctionDocumentation[] {
    const functions: FunctionDocumentation[] = [];
    const regex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      functions.push({ name: match[1], params: [], returns: 'unknown', description: match[1], isAsync: false, behaviors: [] });
    }
    return functions;
  }

  private detectFilePatterns(content: string): string[] {
    const patterns: string[] = [];
    if (content.includes('useState')) patterns.push('useState');
    if (content.includes('useEffect')) patterns.push('useEffect');
    if (content.includes('async')) patterns.push('async/await');
    return patterns;
  }

  private generateAINotes(content: string, type: FileType): string[] {
    const notes: string[] = [];
    if (content.includes("'use client'")) notes.push('Client component');
    if (content.includes('zustand')) notes.push('Uses Zustand');
    return notes;
  }

  private buildComponentTree(): void {
    if (!this.projectDoc) return;
    const tree: Record<string, string[]> = {};
    for (const doc of Object.values(this.projectDoc.files)) {
      if (doc.componentInfo) tree[doc.componentInfo.name] = doc.componentInfo.children;
    }
    this.projectDoc.componentTree = tree;
  }

  private detectRoutes(): void {
    if (!this.projectDoc) return;
    for (const filePath of Object.keys(this.projectDoc.files)) {
      if (filePath.includes('/app/') && filePath.endsWith('page.tsx')) {
        const routePath = filePath.replace(/.*\/app/, '').replace('/page.tsx', '') || '/';
        this.projectDoc.routes.push({ path: routePath, component: filePath, isProtected: false });
      }
    }
  }

  private extractPatterns(): void {
    if (!this.projectDoc) return;
    const counts: Record<string, number> = {};
    for (const doc of Object.values(this.projectDoc.files)) {
      for (const p of doc.patterns) counts[p] = (counts[p] || 0) + 1;
    }
    this.projectDoc.patterns = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([p]) => p);
  }

  private buildContextString(cached: ProjectDocumentation, files: [string, FileDocumentation][], _includeContent: boolean): string {
    const sections = [`## Project: ${cached.name}\nType: ${cached.projectType}\nTechnologies: ${cached.technologies.join(', ')}\n`];
    sections.push('## Files\n');
    for (const [filePath, doc] of files) {
      sections.push(`### ${filePath}\n- ${doc.description}\n- Exports: ${doc.exports.map(e => e.name).join(', ')}\n`);
    }
    return sections.join('\n');
  }

  private inferRelevantTypes(desc: string): FileType[] {
    const types: FileType[] = [];
    if (desc.includes('component')) types.push('component');
    if (desc.includes('page')) types.push('page');
    if (desc.includes('hook')) types.push('hook');
    if (types.length === 0) types.push('component', 'utility');
    return types;
  }

  private findRelevantFiles(cached: ProjectDocumentation, desc: string, types: FileType[]): FileDocumentation[] {
    const keywords = desc.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return Object.values(cached.files)
      .filter(f => types.includes(f.type))
      .filter(f => keywords.some(k => f.path.toLowerCase().includes(k) || f.description.toLowerCase().includes(k)))
      .slice(0, 15);
  }

  private buildFocusedContext(cached: ProjectDocumentation, files: FileDocumentation[], step: string): string {
    const sections = [`## Context for: ${step}\n`];
    for (const f of files) {
      sections.push(`### ${f.path}\n${f.description}\nPatterns: ${f.patterns.join(', ')}\n`);
    }
    return sections.join('\n');
  }

  private getRelevantPatterns(cached: ProjectDocumentation, _desc: string): string[] {
    return cached.patterns.slice(0, 5);
  }
}