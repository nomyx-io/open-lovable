import { streamText } from 'ai';
import { appConfig } from '@/config/app.config';
import { getProviderAndModel, openai, anthropic, groq } from './providers';
import type { StreamProgressData } from './types';
import { 
  auditGeneratedCode, 
  generateAuditPrompt, 
  quickIncompleteCheck,
  type AuditResult, 
  type AuditIssue 
} from '@/lib/code-quality/code-auditor';

/**
 * Configuration for audit recovery
 */
export interface AuditRecoveryConfig {
  enabled: boolean;
  maxRetries: number;
  minScoreThreshold: number; // Score below which we trigger recovery
  criticalIssuesThreshold: number; // Max critical issues allowed
}

const DEFAULT_CONFIG: AuditRecoveryConfig = {
  enabled: true,
  maxRetries: 2,
  minScoreThreshold: 70,
  criticalIssuesThreshold: 0
};

/**
 * Perform a quick incomplete check before full audit
 */
export function quickAuditCheck(generatedCode: string): boolean {
  return quickIncompleteCheck(generatedCode);
}

/**
 * Full audit of generated code
 */
export function performAudit(generatedCode: string): AuditResult {
  return auditGeneratedCode(generatedCode);
}

/**
 * Get files that need to be fixed based on audit
 */
export function getFilesToFix(auditResult: AuditResult): Map<string, AuditIssue[]> {
  const fileIssues = new Map<string, AuditIssue[]>();
  
  for (const issue of auditResult.issues) {
    if (issue.severity === 'critical' || issue.severity === 'warning') {
      const filePath = issue.filePath || 'unknown';
      if (!fileIssues.has(filePath)) {
        fileIssues.set(filePath, []);
      }
      fileIssues.get(filePath)!.push(issue);
    }
  }
  
  return fileIssues;
}

/**
 * Generate a targeted fix prompt for a specific file
 */
export function generateFileFixPrompt(
  filePath: string,
  originalContent: string,
  issues: AuditIssue[]
): string {
  let prompt = `The following file has incomplete implementations that need to be fixed:

**File: ${filePath}**

**Issues Found:**
`;

  for (const issue of issues) {
    prompt += `- [${issue.severity.toUpperCase()}] ${issue.message}`;
    if (issue.lineNumber) {
      prompt += ` (line ${issue.lineNumber})`;
    }
    if (issue.codeSnippet) {
      prompt += `\n  Code: \`${issue.codeSnippet}\``;
    }
    if (issue.suggestion) {
      prompt += `\n  Fix: ${issue.suggestion}`;
    }
    prompt += '\n';
  }

  prompt += `
**Current File Content:**
\`\`\`
${originalContent}
\`\`\`

**Requirements:**
1. Provide the COMPLETE file with ALL issues fixed
2. Replace all placeholder functions with real implementations
3. Remove or implement all TODO/FIXME comments
4. Ensure all event handlers have proper logic
5. Add proper error handling where missing
6. Replace placeholder text with meaningful content

Provide the complete, fully-implemented file content.`;

  return prompt;
}

/**
 * Attempt to recover incomplete implementations
 */
export async function recoverIncompleteCode(
  generatedCode: string,
  auditResult: AuditResult,
  prompt: string,
  model: string,
  sendProgress: (data: StreamProgressData) => Promise<void>,
  config: Partial<AuditRecoveryConfig> = {}
): Promise<{ code: string; auditResult: AuditResult; recovered: boolean }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!finalConfig.enabled) {
    return { code: generatedCode, auditResult, recovered: false };
  }
  
  // Check if recovery is needed
  const criticalIssues = auditResult.issues.filter(i => i.severity === 'critical');
  if (auditResult.score >= finalConfig.minScoreThreshold && 
      criticalIssues.length <= finalConfig.criticalIssuesThreshold) {
    return { code: generatedCode, auditResult, recovered: false };
  }
  
  console.log('[audit-recovery] Starting recovery process');
  console.log(`[audit-recovery] Score: ${auditResult.score}, Critical issues: ${criticalIssues.length}`);
  
  await sendProgress({
    type: 'warning',
    message: `Detected ${criticalIssues.length} incomplete implementations. Attempting to complete...`
  });
  
  let recoveredCode = generatedCode;
  let retryCount = 0;
  let currentAudit = auditResult;
  
  while (retryCount < finalConfig.maxRetries) {
    retryCount++;
    
    // Get files that need fixing
    const filesToFix = getFilesToFix(currentAudit);
    
    if (filesToFix.size === 0) {
      break;
    }
    
    console.log(`[audit-recovery] Attempt ${retryCount}: Fixing ${filesToFix.size} files`);
    
    for (const [filePath, issues] of filesToFix) {
      if (filePath === 'unknown') continue;
      
      await sendProgress({
        type: 'info',
        message: `Completing ${filePath} (${issues.length} issues)...`
      });
      
      try {
        // Extract current file content
        const fileMatch = recoveredCode.match(
          new RegExp(`<file path="${filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">([\s\S]*?)</file>`)
        );
        
        if (!fileMatch) {
          console.warn(`[audit-recovery] Could not find file ${filePath} in generated code`);
          continue;
        }
        
        const originalContent = fileMatch[1];
        
        // Generate fix prompt
        const fixPrompt = generateFileFixPrompt(filePath, originalContent, issues);
        
        // Get AI to fix the file
        const { provider } = getProviderAndModel(model);
        
        let completionClient: any;
        let completionModelName: string;
        
        if (model.includes('gpt') || model.includes('openai')) {
          completionClient = openai;
          completionModelName = model.replace('openai/', '');
        } else if (model.includes('claude')) {
          completionClient = anthropic;
          completionModelName = model.replace('anthropic/', '');
        } else if (model === 'moonshotai/kimi-k2-instruct-0905') {
          completionClient = groq;
          completionModelName = 'moonshotai/kimi-k2-instruct-0905';
        } else {
          completionClient = groq;
          completionModelName = model;
        }
        
        const completionResult = await streamText({
          model: completionClient(completionModelName),
          messages: [
            {
              role: 'system',
              content: `You are completing an incomplete code file. 
Provide COMPLETE, FULLY-IMPLEMENTED code. 
DO NOT use placeholders, TODOs, or stub functions.
Every function must have real implementation logic.
Every event handler must have actual behavior.
All error handling must be implemented.`
            },
            { role: 'user', content: fixPrompt }
          ],
          temperature: model.startsWith('openai/gpt-5') ? undefined : 0.3 // Lower temperature for fixes
        });
        
        // Collect the fixed content
        let fixedContent = '';
        for await (const chunk of completionResult.textStream) {
          fixedContent += chunk;
        }
        
        // Clean the content (remove markdown code blocks if present)
        let cleanContent = fixedContent;
        if (cleanContent.includes('```')) {
          const codeMatch = cleanContent.match(/```[\w]*\n([\s\S]*?)```/);
          if (codeMatch) {
            cleanContent = codeMatch[1];
          }
        }
        
        // Replace the file content
        const filePattern = new RegExp(
          `<file path="${filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">[\\s\\S]*?</file>`,
          'g'
        );
        
        recoveredCode = recoveredCode.replace(
          filePattern,
          `<file path="${filePath}">\n${cleanContent.trim()}\n</file>`
        );
        
        console.log(`[audit-recovery] Fixed ${filePath}`);
        
      } catch (error) {
        console.error(`[audit-recovery] Failed to fix ${filePath}:`, error);
        await sendProgress({
          type: 'warning',
          message: `Could not auto-complete ${filePath}. Manual review may be needed.`
        });
      }
    }
    
    // Re-audit after fixes
    currentAudit = auditGeneratedCode(recoveredCode);
    console.log(`[audit-recovery] After attempt ${retryCount}: Score ${currentAudit.score}`);
    
    // Check if we've met our threshold
    const remainingCritical = currentAudit.issues.filter(i => i.severity === 'critical').length;
    if (currentAudit.score >= finalConfig.minScoreThreshold &&
        remainingCritical <= finalConfig.criticalIssuesThreshold) {
      break;
    }
  }
  
  // Final progress update
  const improved = currentAudit.score > auditResult.score;
  if (improved) {
    await sendProgress({
      type: 'info',
      message: `Code completion improved score from ${auditResult.score} to ${currentAudit.score}`
    });
  }
  
  return {
    code: recoveredCode,
    auditResult: currentAudit,
    recovered: improved
  };
}

/**
 * Full audit and recovery pipeline
 */
export async function auditAndRecover(
  generatedCode: string,
  prompt: string,
  model: string,
  sendProgress: (data: StreamProgressData) => Promise<void>,
  config: Partial<AuditRecoveryConfig> = {}
): Promise<{
  code: string;
  audit: AuditResult;
  recovered: boolean;
  prompt?: string;
}> {
  // Quick check first
  if (!quickAuditCheck(generatedCode)) {
    // No obvious issues, do full audit to be sure
    const audit = performAudit(generatedCode);
    if (audit.complete) {
      return { code: generatedCode, audit, recovered: false };
    }
  }
  
  // Full audit
  const initialAudit = performAudit(generatedCode);
  
  await sendProgress({
    type: 'status',
    message: `Code audit: ${initialAudit.score}/100 completeness score`
  });
  
  if (initialAudit.issues.length > 0) {
    console.log('[audit-recovery] Issues found:', initialAudit.issues.length);
    
    // Attempt recovery
    const result = await recoverIncompleteCode(
      generatedCode,
      initialAudit,
      prompt,
      model,
      sendProgress,
      config
    );
    
    // Generate audit prompt for any remaining issues
    let auditPrompt: string | undefined;
    if (!result.auditResult.complete) {
      auditPrompt = generateAuditPrompt(result.auditResult);
    }
    
    return {
      code: result.code,
      audit: result.auditResult,
      recovered: result.recovered,
      prompt: auditPrompt
    };
  }
  
  return {
    code: generatedCode,
    audit: initialAudit,
    recovered: false
  };
}

const _exports = {
  quickAuditCheck,
  performAudit,
  getFilesToFix,
  generateFileFixPrompt,
  recoverIncompleteCode,
  auditAndRecover
};
export default _exports;