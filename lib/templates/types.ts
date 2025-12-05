/**
 * Template Library Types
 */

export type TemplateCategory = 'landing' | 'dashboard' | 'ecommerce' | 'portfolio' | 'blog' | 'saas';

export interface TemplateFile {
  path: string;
  content: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: TemplateCategory;
  tags: string[];
  files: TemplateFile[];
  dependencies: string[];
  aiPrompt: string;
  createdAt: Date;
  popularity: number;
}

export interface TemplateQueryOptions {
  category?: TemplateCategory;
  tags?: string[];
  search?: string;
  sortBy?: 'popularity' | 'name' | 'createdAt';
  limit?: number;
}