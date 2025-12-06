/**
 * Code Quality Module
 *
 * Comprehensive code quality system for improving AI-generated code.
 * Includes validation, pattern library, post-processing, and code auditing.
 */

// Code Validator
export {
  validateCode,
  validateGeneratedCode,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ValidationSuggestion
} from './code-validator';

// Pattern Library
export {
  getAllPatterns,
  getPatternsByCategory,
  searchPatterns,
  formatPatternsForPrompt,
  componentPatterns,
  hookPatterns,
  layoutPatterns,
  formPatterns,
  errorPatterns,
  type CodePattern,
  type PatternCategory
} from './pattern-library';

// Post-Processor
export {
  postProcessFile,
  postProcessGeneratedCode,
  type PostProcessingResult,
  type ProcessingChange,
  type PostProcessorOptions
} from './post-processor';

// Code Auditor
export {
  auditFile,
  auditGeneratedCode,
  generateAuditPrompt,
  quickIncompleteCheck,
  type AuditResult,
  type AuditIssue,
  type AuditIssueType
} from './code-auditor';

/**
 * Full quality pipeline - validate, fix, audit, and enhance generated code
 */
export async function runQualityPipeline(
  generatedCode: string,
  options: {
    validate?: boolean;
    postProcess?: boolean;
    audit?: boolean;
    projectType?: 'vite-react' | 'nextjs-app' | 'nextjs-pages' | 'astro' | 'expo';
  } = {}
): Promise<{
  code: string;
  validation: import('./code-validator').ValidationResult | null;
  processing: import('./post-processor').PostProcessingResult | null;
  audit: import('./code-auditor').AuditResult | null;
  summary: QualityPipelineSummary;
}> {
  const {
    validate = true,
    postProcess = true,
    audit = true,
    projectType = 'vite-react'
  } = options;

  let currentCode = generatedCode;
  let validationResult: import('./code-validator').ValidationResult | null = null;
  let processingResult: import('./post-processor').PostProcessingResult | null = null;
  let auditResult: import('./code-auditor').AuditResult | null = null;
  
  // Step 1: Post-process to fix common issues first
  if (postProcess) {
    const { postProcessGeneratedCode } = await import('./post-processor');
    const result = postProcessGeneratedCode(currentCode);
    currentCode = result.code;
    processingResult = {
      code: result.code,
      changes: result.changes,
      hadIssues: result.changes.length > 0
    };
  }
  
  // Step 2: Validate the processed code
  if (validate) {
    const { validateGeneratedCode } = await import('./code-validator');
    validationResult = validateGeneratedCode(currentCode);
  }
  
  // Step 3: Audit for incomplete implementations
  if (audit) {
    const { auditGeneratedCode } = await import('./code-auditor');
    auditResult = auditGeneratedCode(currentCode);
  }
  
  // Build summary
  const summary: QualityPipelineSummary = {
    totalFiles: countFiles(generatedCode),
    issuesFixed: processingResult?.changes.length || 0,
    errorsRemaining: validationResult?.errors.length || 0,
    warningsRemaining: validationResult?.warnings.length || 0,
    suggestionsCount: validationResult?.suggestions.length || 0,
    codeQualityScore: calculateQualityScore(validationResult, processingResult),
    auditScore: auditResult?.score || 100,
    auditIssues: auditResult?.issues.length || 0,
    codeComplete: auditResult?.complete ?? true
  };
  
  return {
    code: currentCode,
    validation: validationResult,
    processing: processingResult,
    audit: auditResult,
    summary
  };
}

export interface QualityPipelineSummary {
  totalFiles: number;
  issuesFixed: number;
  errorsRemaining: number;
  warningsRemaining: number;
  suggestionsCount: number;
  codeQualityScore: number; // 0-100
  auditScore?: number; // 0-100
  auditIssues?: number;
  codeComplete?: boolean;
}

/**
 * Count files in generated code
 */
function countFiles(code: string): number {
  const matches = code.match(/<file path="[^"]+"/g);
  return matches ? matches.length : 0;
}

/**
 * Calculate a quality score based on validation results
 */
function calculateQualityScore(
  validation: import('./code-validator').ValidationResult | null,
  processing: import('./post-processor').PostProcessingResult | null
): number {
  let score = 100;
  
  if (validation) {
    // Deduct points for errors (critical errors are worse)
    for (const error of validation.errors) {
      score -= error.severity === 'critical' ? 15 : 5;
    }
    
    // Deduct fewer points for warnings
    score -= validation.warnings.length * 2;
  }
  
  // Bonus points for issues that were auto-fixed
  if (processing && processing.hadIssues) {
    score += Math.min(10, processing.changes.filter(c => c.type === 'fix').length * 2);
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get quality-related patterns for a specific use case
 */
export async function getRelevantPatterns(
  useCase: string,
  maxPatterns: number = 3
): Promise<import('./pattern-library').CodePattern[]> {
  const { searchPatterns: search } = await import('./pattern-library');
  const patterns = search(useCase);
  return patterns.slice(0, maxPatterns);
}

/**
 * Format quality feedback for the user
 */
export function formatQualityFeedback(
  summary: QualityPipelineSummary,
  validation: import('./code-validator').ValidationResult | null,
  audit?: import('./code-auditor').AuditResult | null
): string {
  const lines: string[] = [];
  
  // Overall score
  const scoreEmoji = summary.codeQualityScore >= 80 ? '✅' :
                     summary.codeQualityScore >= 60 ? '⚠️' : '❌';
  lines.push(`${scoreEmoji} Code Quality Score: ${summary.codeQualityScore}/100`);
  
  // Audit completeness
  if (summary.auditScore !== undefined) {
    const auditEmoji = summary.codeComplete ? '✅' : '⚠️';
    lines.push(`${auditEmoji} Code Completeness: ${summary.auditScore}/100`);
    if (!summary.codeComplete && summary.auditIssues) {
      lines.push(`   ⚠️ ${summary.auditIssues} incomplete implementations detected`);
    }
  }
  
  // Files processed
  lines.push(`📁 ${summary.totalFiles} files generated`);
  
  // Issues fixed
  if (summary.issuesFixed > 0) {
    lines.push(`🔧 ${summary.issuesFixed} issues automatically fixed`);
  }
  
  // Remaining issues
  if (summary.errorsRemaining > 0) {
    lines.push(`❌ ${summary.errorsRemaining} errors need attention`);
    if (validation?.errors) {
      for (const error of validation.errors.slice(0, 3)) {
        lines.push(`   - ${error.message}${error.filePath ? ` (${error.filePath})` : ''}`);
      }
      if (validation.errors.length > 3) {
        lines.push(`   ... and ${validation.errors.length - 3} more`);
      }
    }
  }
  
  if (summary.warningsRemaining > 0) {
    lines.push(`⚠️ ${summary.warningsRemaining} warnings`);
  }
  
  if (summary.suggestionsCount > 0) {
    lines.push(`💡 ${summary.suggestionsCount} improvement suggestions available`);
  }
  
  // Audit details
  if (audit && audit.issues.length > 0) {
    const criticalIssues = audit.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      lines.push(`\n🚨 CRITICAL: ${criticalIssues.length} incomplete implementations found:`);
      for (const issue of criticalIssues.slice(0, 3)) {
        lines.push(`   - ${issue.message}${issue.filePath ? ` (${issue.filePath})` : ''}`);
      }
      if (criticalIssues.length > 3) {
        lines.push(`   ... and ${criticalIssues.length - 3} more`);
      }
    }
  }
  
  return lines.join('\n');
}

export default runQualityPipeline;