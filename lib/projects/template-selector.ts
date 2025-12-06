/**
 * Intelligent Template Selector
 * 
 * Analyzes user requirements to select the appropriate project template
 * and framework. Uses keyword matching and pattern analysis to determine
 * the best fit, and provides clarifying questions when ambiguous.
 */

import type { ProjectTypeId } from './project-type';
import { getProjectTypeOptions, isValidProjectType } from './project-type-manager';
import { getTemplateLibrary } from '@/lib/templates/template-library';
import type { Template, TemplateCategory } from '@/lib/templates/types';

/**
 * Result of template analysis
 */
export interface TemplateSelectionResult {
  /** Whether selection is confident enough to proceed */
  isConfident: boolean;
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** Selected project type (framework) */
  projectType: ProjectTypeId;
  /** Selected template (if matched) */
  template: Template | null;
  /** Reasoning for the selection */
  reasoning: string;
  /** Clarifying questions if not confident */
  clarifyingQuestions?: ClarifyingQuestion[];
  /** Alternative options to consider */
  alternatives?: AlternativeOption[];
}

/**
 * A clarifying question to ask the user
 */
export interface ClarifyingQuestion {
  /** The question to ask */
  question: string;
  /** Possible answers with their implications */
  options: ClarifyingOption[];
  /** Priority of this question (lower = ask first) */
  priority: number;
}

/**
 * An option for a clarifying question
 */
export interface ClarifyingOption {
  /** Display text for this option */
  label: string;
  /** Value to use if selected */
  value: string;
  /** How this affects project type selection */
  projectTypeHint?: ProjectTypeId;
  /** How this affects template selection */
  templateCategoryHint?: TemplateCategory;
}

/**
 * An alternative option for template selection
 */
export interface AlternativeOption {
  projectType: ProjectTypeId;
  template: Template | null;
  reason: string;
}

/**
 * Keywords and patterns for each project type
 */
const PROJECT_TYPE_PATTERNS: Record<ProjectTypeId, {
  keywords: string[];
  strongIndicators: string[];
  negativeIndicators: string[];
  weight: number;
}> = {
  'vite-react': {
    keywords: ['react', 'vite', 'spa', 'single page', 'client', 'frontend only'],
    strongIndicators: ['vite', 'no server', 'static site', 'client-side only'],
    negativeIndicators: ['server', 'ssr', 'api routes', 'native', 'mobile app'],
    weight: 1.0, // Default choice
  },
  'nextjs-app': {
    keywords: ['next', 'nextjs', 'next.js', 'server', 'ssr', 'api', 'fullstack', 'full-stack', 'seo'],
    strongIndicators: ['server-side', 'api routes', 'ssr', 'server components', 'full-stack'],
    negativeIndicators: ['mobile', 'native', 'ios', 'android', 'static only'],
    weight: 0.9,
  },
  'nextjs-pages': {
    keywords: ['next', 'nextjs', 'pages router', 'getServerSideProps'],
    strongIndicators: ['pages router', 'getStaticProps', 'legacy next'],
    negativeIndicators: ['app router', 'server components', 'mobile'],
    weight: 0.7,
  },
  'astro': {
    keywords: ['astro', 'content', 'blog', 'markdown', 'static', 'fast', 'islands'],
    strongIndicators: ['astro', 'islands architecture', 'content-focused', 'markdown heavy'],
    negativeIndicators: ['interactive', 'realtime', 'mobile', 'native'],
    weight: 0.6,
  },
  'expo': {
    keywords: ['mobile', 'native', 'ios', 'android', 'react native', 'expo', 'app store', 'phone'],
    strongIndicators: ['mobile app', 'ios app', 'android app', 'react native', 'expo'],
    negativeIndicators: ['website', 'web only', 'browser only'],
    weight: 0.8,
  },
};

/**
 * Keywords and patterns for template categories
 */
const TEMPLATE_PATTERNS: Record<TemplateCategory, {
  keywords: string[];
  strongIndicators: string[];
}> = {
  landing: {
    keywords: ['landing', 'hero', 'homepage', 'marketing', 'launch', 'product page'],
    strongIndicators: ['landing page', 'hero section', 'call to action', 'cta'],
  },
  dashboard: {
    keywords: ['dashboard', 'admin', 'analytics', 'charts', 'stats', 'metrics', 'panel'],
    strongIndicators: ['admin dashboard', 'analytics dashboard', 'admin panel'],
  },
  ecommerce: {
    keywords: ['shop', 'store', 'ecommerce', 'e-commerce', 'product', 'cart', 'checkout', 'buy'],
    strongIndicators: ['online store', 'shopping cart', 'product page', 'e-commerce'],
  },
  portfolio: {
    keywords: ['portfolio', 'personal', 'resume', 'cv', 'projects', 'showcase'],
    strongIndicators: ['portfolio site', 'personal website', 'showcase projects'],
  },
  blog: {
    keywords: ['blog', 'posts', 'articles', 'content', 'cms', 'writing'],
    strongIndicators: ['blog site', 'blog posts', 'article listing'],
  },
  saas: {
    keywords: ['saas', 'pricing', 'subscription', 'plans', 'features', 'app'],
    strongIndicators: ['saas app', 'pricing page', 'subscription service'],
  },
};

/**
 * Requirements that suggest clarification is needed
 */
const AMBIGUOUS_PATTERNS = [
  { pattern: /app|application/i, question: 'web_or_mobile' },
  { pattern: /site|website/i, question: 'static_or_dynamic' },
  { pattern: /full[- ]?stack/i, question: 'api_needs' },
];

/**
 * Predefined clarifying questions
 */
const CLARIFYING_QUESTIONS: Record<string, ClarifyingQuestion> = {
  web_or_mobile: {
    question: 'Is this a web application or a mobile app?',
    priority: 1,
    options: [
      { label: 'Web application (browser)', value: 'web', projectTypeHint: 'vite-react' },
      { label: 'Mobile app (iOS/Android)', value: 'mobile', projectTypeHint: 'expo' },
      { label: 'Both (web + mobile)', value: 'both', projectTypeHint: 'nextjs-app' },
    ],
  },
  static_or_dynamic: {
    question: 'Does your site need server-side features (API, database, authentication)?',
    priority: 2,
    options: [
      { label: 'No, just a static website', value: 'static', projectTypeHint: 'vite-react' },
      { label: 'Yes, I need backend features', value: 'dynamic', projectTypeHint: 'nextjs-app' },
      { label: 'Mostly content/blog focused', value: 'content', projectTypeHint: 'astro' },
    ],
  },
  api_needs: {
    question: 'What kind of API do you need?',
    priority: 2,
    options: [
      { label: 'Built-in API routes (Next.js style)', value: 'builtin', projectTypeHint: 'nextjs-app' },
      { label: 'External API (already have backend)', value: 'external', projectTypeHint: 'vite-react' },
      { label: 'No API needed', value: 'none', projectTypeHint: 'vite-react' },
    ],
  },
  template_type: {
    question: 'What type of project are you building?',
    priority: 1,
    options: [
      { label: 'Landing/Marketing page', value: 'landing', templateCategoryHint: 'landing' },
      { label: 'Admin Dashboard', value: 'dashboard', templateCategoryHint: 'dashboard' },
      { label: 'E-commerce/Store', value: 'ecommerce', templateCategoryHint: 'ecommerce' },
      { label: 'Portfolio/Personal site', value: 'portfolio', templateCategoryHint: 'portfolio' },
      { label: 'Blog', value: 'blog', templateCategoryHint: 'blog' },
      { label: 'SaaS application', value: 'saas', templateCategoryHint: 'saas' },
      { label: 'Something else', value: 'other' },
    ],
  },
};

/**
 * Main template selector class
 */
export class TemplateSelector {
  private library = getTemplateLibrary();

  /**
   * Analyze user requirements and select appropriate template/project type
   */
  analyzeRequirements(userInput: string): TemplateSelectionResult {
    const input = userInput.toLowerCase();
    
    // Score each project type
    const projectTypeScores = this.scoreProjectTypes(input);
    const templateScores = this.scoreTemplateCategories(input);
    
    // Find best matches
    const bestProjectType = this.getBestMatch(projectTypeScores);
    const bestTemplateCategory = this.getBestTemplateCategory(templateScores);
    
    // Get template if category matched
    let selectedTemplate: Template | null = null;
    if (bestTemplateCategory.category && bestTemplateCategory.score > 0.3) {
      const templates = this.library.getTemplatesByCategory(bestTemplateCategory.category);
      selectedTemplate = templates[0] || null;
    }
    
    // Calculate overall confidence
    const confidence = this.calculateConfidence(
      bestProjectType.score,
      bestTemplateCategory.score,
      input
    );
    
    // Build result
    const result: TemplateSelectionResult = {
      isConfident: confidence >= 0.6,
      confidence,
      projectType: bestProjectType.type,
      template: selectedTemplate,
      reasoning: this.buildReasoning(bestProjectType, bestTemplateCategory, input),
      alternatives: this.getAlternatives(projectTypeScores, templateScores),
    };
    
    // Add clarifying questions if not confident
    if (!result.isConfident) {
      result.clarifyingQuestions = this.generateClarifyingQuestions(input, projectTypeScores);
    }
    
    return result;
  }

  /**
   * Score each project type based on input
   */
  private scoreProjectTypes(input: string): Map<ProjectTypeId, number> {
    const scores = new Map<ProjectTypeId, number>();
    
    for (const [typeId, patterns] of Object.entries(PROJECT_TYPE_PATTERNS)) {
      let score = 0;
      
      // Check keywords
      for (const keyword of patterns.keywords) {
        if (input.includes(keyword.toLowerCase())) {
          score += 0.2;
        }
      }
      
      // Check strong indicators (higher weight)
      for (const indicator of patterns.strongIndicators) {
        if (input.includes(indicator.toLowerCase())) {
          score += 0.4;
        }
      }
      
      // Check negative indicators (reduce score)
      for (const negative of patterns.negativeIndicators) {
        if (input.includes(negative.toLowerCase())) {
          score -= 0.3;
        }
      }
      
      // Apply base weight
      score = Math.max(0, score) * patterns.weight;
      
      scores.set(typeId as ProjectTypeId, score);
    }
    
    return scores;
  }

  /**
   * Score template categories based on input
   */
  private scoreTemplateCategories(input: string): Map<TemplateCategory, number> {
    const scores = new Map<TemplateCategory, number>();
    
    for (const [category, patterns] of Object.entries(TEMPLATE_PATTERNS)) {
      let score = 0;
      
      for (const keyword of patterns.keywords) {
        if (input.includes(keyword.toLowerCase())) {
          score += 0.25;
        }
      }
      
      for (const indicator of patterns.strongIndicators) {
        if (input.includes(indicator.toLowerCase())) {
          score += 0.5;
        }
      }
      
      scores.set(category as TemplateCategory, Math.min(1, score));
    }
    
    return scores;
  }

  /**
   * Get best matching project type
   */
  private getBestMatch(scores: Map<ProjectTypeId, number>): { type: ProjectTypeId; score: number } {
    let bestType: ProjectTypeId = 'vite-react'; // Default
    let bestScore = 0;
    
    for (const [type, score] of scores) {
      if (score > bestScore) {
        bestType = type;
        bestScore = score;
      }
    }
    
    // If no clear winner, default to vite-react
    if (bestScore < 0.2) {
      return { type: 'vite-react', score: 0.1 };
    }
    
    return { type: bestType, score: bestScore };
  }

  /**
   * Get best matching template category
   */
  private getBestTemplateCategory(scores: Map<TemplateCategory, number>): { category: TemplateCategory | null; score: number } {
    let bestCategory: TemplateCategory | null = null;
    let bestScore = 0;
    
    for (const [category, score] of scores) {
      if (score > bestScore) {
        bestCategory = category;
        bestScore = score;
      }
    }
    
    return { category: bestCategory, score: bestScore };
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(
    projectTypeScore: number,
    templateScore: number,
    input: string
  ): number {
    // Base confidence from scores
    let confidence = (projectTypeScore + templateScore) / 2;
    
    // Boost if input is very specific
    if (input.length > 100) confidence += 0.1;
    if (input.length > 200) confidence += 0.1;
    
    // Reduce if input is very short/vague
    if (input.length < 20) confidence -= 0.2;
    if (input.length < 10) confidence -= 0.2;
    
    // Check for ambiguous patterns
    for (const { pattern } of AMBIGUOUS_PATTERNS) {
      if (pattern.test(input)) {
        // Only reduce if we don't have strong other signals
        if (projectTypeScore < 0.5) {
          confidence -= 0.15;
        }
      }
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Build reasoning string
   */
  private buildReasoning(
    projectType: { type: ProjectTypeId; score: number },
    templateCategory: { category: TemplateCategory | null; score: number },
    input: string
  ): string {
    const parts: string[] = [];
    
    // Project type reasoning
    if (projectType.score > 0.5) {
      const typeConfig = getProjectTypeOptions().find(o => o.id === projectType.type);
      parts.push(`Selected ${typeConfig?.name || projectType.type} because the requirements strongly match this framework.`);
    } else if (projectType.score > 0.2) {
      parts.push(`${projectType.type} appears to be a reasonable fit based on keywords.`);
    } else {
      parts.push(`Defaulting to vite-react as no specific framework requirements were detected.`);
    }
    
    // Template reasoning
    if (templateCategory.category && templateCategory.score > 0.3) {
      parts.push(`The project appears to be a ${templateCategory.category} type based on the description.`);
    }
    
    return parts.join(' ');
  }

  /**
   * Get alternative options
   */
  private getAlternatives(
    projectScores: Map<ProjectTypeId, number>,
    templateScores: Map<TemplateCategory, number>
  ): AlternativeOption[] {
    const alternatives: AlternativeOption[] = [];
    const sortedProjectTypes = Array.from(projectScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(1, 3); // Get 2nd and 3rd best
    
    for (const [type, score] of sortedProjectTypes) {
      if (score > 0.1) {
        let template: Template | null = null;
        
        // Find best template for this project type
        const sortedTemplates = Array.from(templateScores.entries())
          .sort((a, b) => b[1] - a[1]);
        
        if (sortedTemplates[0] && sortedTemplates[0][1] > 0.2) {
          const templates = this.library.getTemplatesByCategory(sortedTemplates[0][0]);
          template = templates[0] || null;
        }
        
        alternatives.push({
          projectType: type,
          template,
          reason: `Alternative: ${type} could also work for this project.`,
        });
      }
    }
    
    return alternatives;
  }

  /**
   * Generate clarifying questions
   */
  private generateClarifyingQuestions(
    input: string,
    projectScores: Map<ProjectTypeId, number>
  ): ClarifyingQuestion[] {
    const questions: ClarifyingQuestion[] = [];
    
    // Check for ambiguous patterns
    for (const { pattern, question } of AMBIGUOUS_PATTERNS) {
      if (pattern.test(input) && CLARIFYING_QUESTIONS[question]) {
        questions.push(CLARIFYING_QUESTIONS[question]);
      }
    }
    
    // If no project type is clear, ask about template type
    const maxScore = Math.max(...projectScores.values());
    if (maxScore < 0.3) {
      questions.push(CLARIFYING_QUESTIONS['template_type']);
    }
    
    // Sort by priority
    questions.sort((a, b) => a.priority - b.priority);
    
    // Limit to top 2 questions
    return questions.slice(0, 2);
  }

  /**
   * Refine selection based on user's answer to clarifying question
   */
  refineSelection(
    currentResult: TemplateSelectionResult,
    questionValue: string,
    option: ClarifyingOption
  ): TemplateSelectionResult {
    const newResult = { ...currentResult };
    
    // Update project type if hint provided
    if (option.projectTypeHint && isValidProjectType(option.projectTypeHint)) {
      newResult.projectType = option.projectTypeHint;
      newResult.confidence += 0.2;
    }
    
    // Update template if hint provided
    if (option.templateCategoryHint) {
      const templates = this.library.getTemplatesByCategory(option.templateCategoryHint);
      if (templates.length > 0) {
        newResult.template = templates[0];
        newResult.confidence += 0.15;
      }
    }
    
    // Update confidence
    newResult.confidence = Math.min(1, newResult.confidence);
    newResult.isConfident = newResult.confidence >= 0.6;
    
    // Remove answered question
    if (newResult.clarifyingQuestions) {
      newResult.clarifyingQuestions = newResult.clarifyingQuestions.filter(
        q => !q.options.some(o => o.value === questionValue)
      );
      
      // If no more questions, mark as confident
      if (newResult.clarifyingQuestions.length === 0) {
        newResult.isConfident = true;
        delete newResult.clarifyingQuestions;
      }
    }
    
    // Update reasoning
    newResult.reasoning += ` User specified: ${option.label}.`;
    
    return newResult;
  }
}

// Singleton instance
let selectorInstance: TemplateSelector | null = null;

export function getTemplateSelector(): TemplateSelector {
  if (!selectorInstance) {
    selectorInstance = new TemplateSelector();
  }
  return selectorInstance;
}

/**
 * Quick helper to analyze requirements
 */
export function analyzeProjectRequirements(userInput: string): TemplateSelectionResult {
  return getTemplateSelector().analyzeRequirements(userInput);
}

/**
 * Quick helper to refine selection after user answers a question
 */
export function refineProjectSelection(
  currentResult: TemplateSelectionResult,
  questionValue: string,
  option: ClarifyingOption
): TemplateSelectionResult {
  return getTemplateSelector().refineSelection(currentResult, questionValue, option);
}