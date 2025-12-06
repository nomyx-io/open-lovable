/**
 * Code Auditor
 * 
 * Audits generated code to detect incomplete implementations,
 * placeholder functions, TODO comments, and other signs of
 * partial implementation that the AI may not have clearly indicated.
 */

export interface AuditResult {
  complete: boolean;
  score: number; // 0-100, 100 being fully complete
  issues: AuditIssue[];
  summary: string;
}

export interface AuditIssue {
  type: AuditIssueType;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  filePath?: string;
  lineNumber?: number;
  codeSnippet?: string;
  suggestion?: string;
}

export type AuditIssueType = 
  | 'placeholder_function'
  | 'todo_comment'
  | 'fixme_comment'
  | 'incomplete_implementation'
  | 'stub_function'
  | 'empty_handler'
  | 'missing_error_handling'
  | 'hardcoded_data'
  | 'mock_data'
  | 'unimplemented_feature'
  | 'console_debug'
  | 'incomplete_component'
  | 'missing_validation'
  | 'placeholder_text';

/**
 * Patterns that indicate incomplete implementations
 */
const INCOMPLETE_PATTERNS: Array<{
  pattern: RegExp;
  type: AuditIssueType;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}> = [
  // TODO/FIXME comments
  {
    pattern: /\/\/\s*TODO:?\s*(.*)/gi,
    type: 'todo_comment',
    severity: 'warning',
    message: 'TODO comment found',
    suggestion: 'Complete the TODO item or remove if no longer needed'
  },
  {
    pattern: /\/\/\s*FIXME:?\s*(.*)/gi,
    type: 'fixme_comment',
    severity: 'critical',
    message: 'FIXME comment found - indicates known issue',
    suggestion: 'Fix the issue or document why it cannot be fixed now'
  },
  {
    pattern: /\/\*\s*TODO[\s\S]*?\*\//gi,
    type: 'todo_comment',
    severity: 'warning',
    message: 'Multi-line TODO comment found'
  },
  
  // Placeholder functions and implementations
  {
    pattern: /(?:function|const|let|var)\s+\w+\s*=?\s*(?:\([^)]*\)|async\s*\([^)]*\))\s*(?:=>|{)\s*\{\s*(?:\/\/.*\n\s*)?\}/gm,
    type: 'empty_handler',
    severity: 'critical',
    message: 'Empty function body detected',
    suggestion: 'Implement the function logic or remove if not needed'
  },
  {
    pattern: /throw\s+new\s+Error\s*\(\s*['"`](?:Not\s+implemented|TODO|FIXME|Implement|TBD)[^'"]*['"`]\s*\)/gi,
    type: 'placeholder_function',
    severity: 'critical',
    message: 'Placeholder error throw found',
    suggestion: 'Implement the actual functionality'
  },
  {
    pattern: /return\s+null\s*;?\s*\/\/\s*(?:TODO|placeholder|implement)/gi,
    type: 'incomplete_implementation',
    severity: 'critical',
    message: 'Placeholder return statement found'
  },
  
  // Stub implementations
  {
    pattern: /console\.log\s*\(\s*['"`](?:TODO|implement|stub|placeholder)[^'"]*['"`]\s*\)/gi,
    type: 'stub_function',
    severity: 'warning',
    message: 'Stub console.log found',
    suggestion: 'Replace with actual implementation'
  },
  {
    pattern: /(?:\/\/|\/\*)\s*(?:stub|mock|fake|dummy|placeholder)\s*(?:implementation)?/gi,
    type: 'stub_function',
    severity: 'warning',
    message: 'Stub/mock implementation comment found'
  },
  
  // Placeholder text in UI
  {
    pattern: /['"`](?:Lorem ipsum|Placeholder|Sample text|TODO|TBD|Coming soon|Under construction)['"`]/gi,
    type: 'placeholder_text',
    severity: 'warning',
    message: 'Placeholder text in UI',
    suggestion: 'Replace with actual content'
  },
  {
    pattern: />\s*(?:Lorem ipsum|Placeholder|TODO|TBD|xxx+|...+)\s*</gi,
    type: 'placeholder_text',
    severity: 'warning',
    message: 'Placeholder content in JSX'
  },
  
  // Hardcoded/mock data
  {
    pattern: /(?:const|let|var)\s+(?:mock|fake|dummy|sample|test)Data\s*=/gi,
    type: 'mock_data',
    severity: 'info',
    message: 'Mock/sample data variable found',
    suggestion: 'Replace with actual data source or API call'
  },
  {
    pattern: /\/\/\s*(?:mock|fake|hardcoded|temporary)\s+data/gi,
    type: 'mock_data',
    severity: 'info',
    message: 'Hardcoded data comment found'
  },
  
  // Incomplete error handling
  {
    pattern: /catch\s*\(\s*(?:e|err|error)?\s*\)\s*\{\s*\}/gm,
    type: 'missing_error_handling',
    severity: 'critical',
    message: 'Empty catch block - errors are silently ignored',
    suggestion: 'Add proper error handling or logging'
  },
  {
    pattern: /catch\s*\(\s*(?:e|err|error)?\s*\)\s*\{\s*(?:\/\/.*\n\s*)*\s*\}/gm,
    type: 'missing_error_handling',
    severity: 'warning',
    message: 'Catch block with only comments',
    suggestion: 'Implement error handling logic'
  },
  
  // Console debugging left in
  {
    pattern: /console\.(?:log|debug|trace)\s*\(\s*['"`](?:debug|test|temp|xxx)/gi,
    type: 'console_debug',
    severity: 'info',
    message: 'Debug console statement found',
    suggestion: 'Remove debug statements before production'
  },
  
  // Incomplete feature indicators
  {
    pattern: /\/\/\s*(?:feature|functionality)\s+(?:not\s+)?(?:implemented|complete|ready)/gi,
    type: 'unimplemented_feature',
    severity: 'critical',
    message: 'Unimplemented feature comment found'
  },
  {
    pattern: /(?:disabled|hidden)\s*=\s*\{\s*true\s*\}\s*\/\*\s*(?:TODO|temporary|until)/gi,
    type: 'unimplemented_feature',
    severity: 'warning',
    message: 'Feature disabled with TODO comment'
  },
  
  // Incomplete form validation
  {
    pattern: /onSubmit\s*=\s*\{\s*(?:\(\s*e?\s*\)\s*=>|function)\s*\{\s*(?:e\.preventDefault\(\);?\s*)?\/\/.*\s*\}/gm,
    type: 'missing_validation',
    severity: 'critical',
    message: 'Empty form submit handler',
    suggestion: 'Implement form submission logic'
  },
  
  // Placeholder event handlers
  {
    pattern: /on(?:Click|Change|Submit|Press|Focus|Blur)\s*=\s*\{\s*\(\s*\)\s*=>\s*(?:undefined|null|void\s+0|\{\s*\})\s*\}/gi,
    type: 'empty_handler',
    severity: 'warning',
    message: 'Empty event handler',
    suggestion: 'Implement the event handler or remove if not needed'
  },
  
  // Ellipsis patterns (code truncation)
  {
    pattern: /\.{3,}\s*(?:more|rest|etc|continued)/gi,
    type: 'incomplete_implementation',
    severity: 'critical',
    message: 'Code appears to be truncated',
    suggestion: 'Complete the implementation'
  },
  {
    pattern: /\/\/\s*\.{3,}\s*(?:rest of|remaining|other)/gi,
    type: 'incomplete_implementation',
    severity: 'critical',
    message: 'Truncated code indicator found'
  },
  
  // Pass/skip placeholders
  {
    pattern: /(?:pass|skip|noop)\s*;?\s*\/\//gi,
    type: 'placeholder_function',
    severity: 'warning',
    message: 'Pass/skip placeholder found'
  },
  
  // API URL placeholders
  {
    pattern: /['"`]https?:\/\/(?:api\.example\.com|your-api|placeholder|TODO)[^'"]*['"`]/gi,
    type: 'hardcoded_data',
    severity: 'critical',
    message: 'Placeholder API URL found',
    suggestion: 'Replace with actual API endpoint or environment variable'
  },
  {
    pattern: /['"`](?:YOUR_API_KEY|API_KEY_HERE|REPLACE_ME|xxx+)['"`]/gi,
    type: 'hardcoded_data',
    severity: 'critical',
    message: 'Placeholder API key/secret found'
  }
];

/**
 * Additional React/JSX specific patterns
 */
const REACT_INCOMPLETE_PATTERNS: Array<{
  pattern: RegExp;
  type: AuditIssueType;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}> = [
  // Empty components
  {
    pattern: /(?:function|const)\s+(\w+)\s*(?::\s*React\.FC)?\s*=?\s*\([^)]*\)\s*(?:=>|{)\s*\{\s*return\s+null\s*;?\s*\}/gm,
    type: 'incomplete_component',
    severity: 'critical',
    message: 'Component returns null - appears incomplete'
  },
  {
    pattern: /return\s*\(\s*<>\s*<\/>\s*\)/gm,
    type: 'incomplete_component',
    severity: 'warning',
    message: 'Component returns empty fragment',
    suggestion: 'Add content to the component'
  },
  
  // Placeholder component content
  {
    pattern: /return\s*\(\s*<div[^>]*>\s*(?:TODO|Placeholder|Coming soon)\s*<\/div>\s*\)/gi,
    type: 'incomplete_component',
    severity: 'critical',
    message: 'Component has placeholder content'
  },
  
  // useEffect with empty dependency and body
  {
    pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{\s*(?:\/\/.*\n\s*)?\}\s*,\s*\[\s*\]\s*\)/gm,
    type: 'empty_handler',
    severity: 'warning',
    message: 'Empty useEffect hook',
    suggestion: 'Add effect logic or remove if not needed'
  },
  
  // useState without usage
  {
    pattern: /const\s+\[(\w+),\s*set\w+\]\s*=\s*useState\([^)]*\);?\s*\/\/\s*(?:TODO|unused|implement)/gi,
    type: 'incomplete_implementation',
    severity: 'warning',
    message: 'useState with TODO comment - may be unused'
  }
];

/**
 * Audit a single file for incomplete implementations
 */
export function auditFile(
  code: string,
  filePath: string
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const lines = code.split('\n');
  
  // Check general patterns
  for (const pattern of INCOMPLETE_PATTERNS) {
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
    let match;
    
    while ((match = regex.exec(code)) !== null) {
      const lineNumber = getLineNumber(code, match.index);
      const codeSnippet = lines[lineNumber - 1]?.trim() || match[0].slice(0, 100);
      
      issues.push({
        type: pattern.type,
        severity: pattern.severity,
        message: pattern.message,
        filePath,
        lineNumber,
        codeSnippet,
        suggestion: pattern.suggestion
      });
    }
  }
  
  // Check React-specific patterns for JSX files
  if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
    for (const pattern of REACT_INCOMPLETE_PATTERNS) {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        const lineNumber = getLineNumber(code, match.index);
        const codeSnippet = lines[lineNumber - 1]?.trim() || match[0].slice(0, 100);
        
        issues.push({
          type: pattern.type,
          severity: pattern.severity,
          message: pattern.message,
          filePath,
          lineNumber,
          codeSnippet,
          suggestion: pattern.suggestion
        });
      }
    }
  }
  
  // Additional structural checks
  const structuralIssues = checkStructuralCompleteness(code, filePath);
  issues.push(...structuralIssues);
  
  return issues;
}

/**
 * Get line number from character position
 */
function getLineNumber(code: string, position: number): number {
  return code.substring(0, position).split('\n').length;
}

/**
 * Check for structural completeness issues
 */
function checkStructuralCompleteness(code: string, filePath: string): AuditIssue[] {
  const issues: AuditIssue[] = [];
  
  // Check for functions declared but not implemented
  const functionDeclarations = code.match(/(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g) || [];
  const arrowFunctions = code.match(/const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g) || [];
  
  const allFunctions = [...functionDeclarations, ...arrowFunctions];
  
  for (const func of allFunctions) {
    // Find the function in the code
    const funcIndex = code.indexOf(func);
    const afterFunc = code.substring(funcIndex + func.length);
    
    // Check if the function body is minimal (less than 50 chars suggests stub)
    const bodyMatch = afterFunc.match(/^\s*\{([\s\S]*?)\}/);
    if (bodyMatch) {
      const body = bodyMatch[1].trim();
      
      // Very short body might be a stub
      if (body.length < 10 && !body.includes('return')) {
        issues.push({
          type: 'stub_function',
          severity: 'warning',
          message: 'Function appears to have minimal implementation',
          filePath,
          codeSnippet: func
        });
      }
      
      // Body is just a comment
      if (/^\/\/[^\n]*$/.test(body) || /^\/\*[\s\S]*\*\/\s*$/.test(body)) {
        issues.push({
          type: 'incomplete_implementation',
          severity: 'critical',
          message: 'Function body contains only comments',
          filePath,
          codeSnippet: func,
          suggestion: 'Implement the function logic'
        });
      }
    }
  }
  
  // Check for required props not being used
  if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
    // Check if component has props but doesn't use them
    const propsPattern = /(?:function|const)\s+\w+\s*\(\s*\{\s*([^}]+)\}\s*\)/g;
    let propsMatch;
    
    while ((propsMatch = propsPattern.exec(code)) !== null) {
      const props = propsMatch[1].split(',').map(p => p.trim().split(':')[0].trim());
      for (const prop of props) {
        if (prop && !prop.startsWith('...')) {
          // Check if prop is used in the component (excluding the destructuring)
          const propUsagePattern = new RegExp(`(?<!\\{[^}]*?)\\b${prop}\\b(?![^{]*\\})`, 'g');
          const usages = code.match(propUsagePattern);
          
          if (!usages || usages.length <= 1) {
            issues.push({
              type: 'incomplete_implementation',
              severity: 'warning',
              message: `Prop "${prop}" is defined but may not be used`,
              filePath,
              suggestion: 'Use the prop in the component or remove if not needed'
            });
          }
        }
      }
    }
  }
  
  return issues;
}

/**
 * Audit all files in generated code
 */
export function auditGeneratedCode(generatedCode: string): AuditResult {
  const allIssues: AuditIssue[] = [];
  
  // Parse all files from generated code
  const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
  let match;
  let fileCount = 0;
  
  while ((match = fileRegex.exec(generatedCode)) !== null) {
    const filePath = match[1];
    const content = match[2];
    fileCount++;
    
    const fileIssues = auditFile(content, filePath);
    allIssues.push(...fileIssues);
  }
  
  // Calculate completeness score
  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const warningCount = allIssues.filter(i => i.severity === 'warning').length;
  const infoCount = allIssues.filter(i => i.severity === 'info').length;
  
  // Score calculation: start at 100, deduct for issues
  let score = 100;
  score -= criticalCount * 15; // Critical issues heavily penalize
  score -= warningCount * 5;  // Warnings moderately penalize
  score -= infoCount * 1;     // Info issues slightly penalize
  score = Math.max(0, Math.min(100, score)); // Clamp to 0-100
  
  // Determine if code is complete
  const complete = criticalCount === 0 && warningCount < 3;
  
  // Generate summary
  let summary: string;
  if (complete && score >= 90) {
    summary = 'Code appears to be fully implemented with no significant issues.';
  } else if (score >= 70) {
    summary = `Code is mostly complete but has ${criticalCount} critical and ${warningCount} warning issues that should be addressed.`;
  } else if (score >= 50) {
    summary = `Code has significant incomplete sections. Found ${criticalCount} critical issues and ${warningCount} warnings.`;
  } else {
    summary = `Code appears to be substantially incomplete with ${allIssues.length} total issues found.`;
  }
  
  return {
    complete,
    score,
    issues: allIssues,
    summary
  };
}

/**
 * Generate a prompt for the AI to self-audit its code
 */
export function generateAuditPrompt(auditResult: AuditResult): string {
  if (auditResult.complete && auditResult.issues.length === 0) {
    return '';
  }
  
  let prompt = `
## CODE AUDIT REQUIRED

The generated code has been automatically audited and issues were found that require attention.

### Audit Summary
- **Completeness Score**: ${auditResult.score}/100
- **Status**: ${auditResult.complete ? 'Acceptable' : 'NEEDS ATTENTION'}
- **Total Issues**: ${auditResult.issues.length}

### Issues Found

`;

  // Group issues by severity
  const criticalIssues = auditResult.issues.filter(i => i.severity === 'critical');
  const warningIssues = auditResult.issues.filter(i => i.severity === 'warning');
  const infoIssues = auditResult.issues.filter(i => i.severity === 'info');
  
  if (criticalIssues.length > 0) {
    prompt += `#### 🚨 CRITICAL ISSUES (Must Fix)\n\n`;
    for (const issue of criticalIssues.slice(0, 10)) { // Limit to first 10
      prompt += `- **${issue.type}** in \`${issue.filePath}\`${issue.lineNumber ? ` (line ${issue.lineNumber})` : ''}\n`;
      prompt += `  ${issue.message}\n`;
      if (issue.codeSnippet) {
        prompt += `  \`\`\`${issue.codeSnippet}\`\`\`\n`;
      }
      if (issue.suggestion) {
        prompt += `  → ${issue.suggestion}\n`;
      }
      prompt += '\n';
    }
  }
  
  if (warningIssues.length > 0) {
    prompt += `#### ⚠️ WARNINGS (Should Fix)\n\n`;
    for (const issue of warningIssues.slice(0, 5)) { // Limit to first 5
      prompt += `- **${issue.type}** in \`${issue.filePath}\`${issue.lineNumber ? ` (line ${issue.lineNumber})` : ''}\n`;
      prompt += `  ${issue.message}\n`;
      if (issue.suggestion) {
        prompt += `  → ${issue.suggestion}\n`;
      }
      prompt += '\n';
    }
  }
  
  prompt += `
### REQUIRED ACTION

You MUST fix all CRITICAL issues and as many warnings as possible. Regenerate the affected files with complete implementations:

1. Replace all placeholder/stub functions with real implementations
2. Remove all TODO/FIXME comments by implementing the required functionality
3. Ensure all event handlers have proper logic
4. Replace placeholder text with meaningful content
5. Implement proper error handling in all catch blocks

DO NOT leave any partial implementations. Every function must be fully implemented.
`;

  return prompt;
}

/**
 * Quick check if code likely has incomplete implementations
 * (faster than full audit for initial screening)
 */
export function quickIncompleteCheck(code: string): boolean {
  const quickPatterns = [
    /TODO/i,
    /FIXME/i,
    /placeholder/i,
    /not\s+implemented/i,
    /throw\s+new\s+Error\s*\(\s*['"`]implement/i,
    /\{\s*\}\s*\/\//,  // Empty blocks with comments
    /=>\s*\{\s*\}/,    // Empty arrow functions
    /coming\s+soon/i,
    /lorem\s+ipsum/i
  ];
  
  return quickPatterns.some(pattern => pattern.test(code));
}

const _exports = {
  auditFile,
  auditGeneratedCode,
  generateAuditPrompt,
  quickIncompleteCheck
};

export default _exports;