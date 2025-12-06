/**
 * Post-Processor
 * 
 * Automatically fixes common issues in generated code before
 * applying it to the sandbox. This includes formatting, missing
 * imports, incomplete code recovery, and Tailwind class fixes.
 */

export interface PostProcessingResult {
  code: string;
  changes: ProcessingChange[];
  hadIssues: boolean;
}

export interface ProcessingChange {
  type: 'fix' | 'enhancement' | 'format';
  description: string;
  location?: string;
}

export interface PostProcessorOptions {
  fixImports?: boolean;
  fixTailwind?: boolean;
  fixAccessibility?: boolean;
  formatCode?: boolean;
  addMissingExports?: boolean;
  fixCommonErrors?: boolean;
}

const DEFAULT_OPTIONS: PostProcessorOptions = {
  fixImports: true,
  fixTailwind: true,
  fixAccessibility: true,
  formatCode: true,
  addMissingExports: true,
  fixCommonErrors: true
};

/**
 * Post-process a single file's code
 */
export function postProcessFile(
  code: string,
  filePath: string,
  options: PostProcessorOptions = DEFAULT_OPTIONS
): PostProcessingResult {
  let processedCode = code;
  const changes: ProcessingChange[] = [];
  
  const isJSX = filePath.endsWith('.jsx') || filePath.endsWith('.tsx');
  const isTS = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
  const isAstro = filePath.endsWith('.astro');
  
  // 1. Fix common syntax errors
  if (options.fixCommonErrors) {
    const syntaxResult = fixCommonSyntaxErrors(processedCode);
    processedCode = syntaxResult.code;
    changes.push(...syntaxResult.changes);
  }
  
  // 2. Fix imports
  if (options.fixImports && (isJSX || isTS)) {
    const importResult = fixImports(processedCode, filePath);
    processedCode = importResult.code;
    changes.push(...importResult.changes);
  }
  
  // 3. Fix Tailwind classes
  if (options.fixTailwind) {
    const tailwindResult = fixTailwindClasses(processedCode);
    processedCode = tailwindResult.code;
    changes.push(...tailwindResult.changes);
  }
  
  // 4. Fix accessibility issues
  if (options.fixAccessibility && (isJSX || isAstro)) {
    const a11yResult = fixAccessibilityIssues(processedCode);
    processedCode = a11yResult.code;
    changes.push(...a11yResult.changes);
  }
  
  // 5. Add missing exports
  if (options.addMissingExports && (isJSX || isTS)) {
    const exportResult = ensureDefaultExport(processedCode, filePath);
    processedCode = exportResult.code;
    changes.push(...exportResult.changes);
  }
  
  // 6. Format code
  if (options.formatCode) {
    const formatResult = formatCode(processedCode);
    processedCode = formatResult.code;
    changes.push(...formatResult.changes);
  }
  
  return {
    code: processedCode,
    changes,
    hadIssues: changes.length > 0
  };
}

/**
 * Fix common syntax errors
 */
function fixCommonSyntaxErrors(code: string): { code: string; changes: ProcessingChange[] } {
  let result = code;
  const changes: ProcessingChange[] = [];
  
  // Fix unclosed JSX tags for void elements
  const voidElements = ['img', 'input', 'br', 'hr', 'meta', 'link'];
  for (const element of voidElements) {
    // Match <element ... > (not self-closing)
    const pattern = new RegExp(`<${element}([^>]*[^/])>(?!\\s*<\\/${element}>)`, 'gi');
    if (pattern.test(result)) {
      result = result.replace(pattern, `<${element}$1 />`);
      changes.push({
        type: 'fix',
        description: `Made <${element}> self-closing`
      });
    }
  }
  
  // Fix class= to className= in JSX
  const classPattern = /(?<![.a-zA-Z])class="([^"]+)"/g;
  if (classPattern.test(result)) {
    result = result.replace(classPattern, 'className="$1"');
    changes.push({
      type: 'fix',
      description: 'Changed class to className'
    });
  }
  
  // Fix missing semicolons after import statements
  const importPattern = /^(import\s+.+from\s+['"][^'"]+['"])(?!\s*;)/gm;
  if (importPattern.test(result)) {
    result = result.replace(importPattern, '$1;');
    changes.push({
      type: 'fix',
      description: 'Added missing semicolons to imports'
    });
  }
  
  // Fix onclick to onClick (and other event handlers)
  const eventHandlers = ['onclick', 'onchange', 'onsubmit', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup', 'onfocus', 'onblur'];
  for (const handler of eventHandlers) {
    const pattern = new RegExp(`\\b${handler}=`, 'g');
    const correctHandler = 'on' + handler.charAt(2).toUpperCase() + handler.slice(3);
    if (pattern.test(result)) {
      result = result.replace(pattern, `${correctHandler}=`);
      changes.push({
        type: 'fix',
        description: `Fixed ${handler} to ${correctHandler}`
      });
    }
  }
  
  // Fix for= to htmlFor= in JSX
  const forPattern = /(?<![a-zA-Z])for="([^"]+)"/g;
  if (forPattern.test(result)) {
    result = result.replace(forPattern, 'htmlFor="$1"');
    changes.push({
      type: 'fix',
      description: 'Changed for to htmlFor'
    });
  }
  
  // Remove trailing commas in object/array that might cause issues
  // (Actually trailing commas are fine in modern JS, so skip this)
  
  // Fix template literals with wrong syntax
  const brokenTemplateLiteral = /className="\$\{([^}]+)\}"/g;
  if (brokenTemplateLiteral.test(result)) {
    result = result.replace(brokenTemplateLiteral, 'className={`${$1}`}');
    changes.push({
      type: 'fix',
      description: 'Fixed template literal in className'
    });
  }
  
  return { code: result, changes };
}

/**
 * Fix and add missing imports
 */
function fixImports(code: string, filePath: string): { code: string; changes: ProcessingChange[] } {
  let result = code;
  const changes: ProcessingChange[] = [];
  
  // Check for useState/useEffect/etc. usage without import
  const reactHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer'];
  const usedHooks: string[] = [];
  
  for (const hook of reactHooks) {
    const hookPattern = new RegExp(`\\b${hook}\\s*\\(`, 'g');
    if (hookPattern.test(code)) {
      usedHooks.push(hook);
    }
  }
  
  // Check if React hooks are imported
  if (usedHooks.length > 0) {
    const hasReactImport = /import\s+(?:React\s*,?\s*)?{([^}]+)}\s+from\s+['"]react['"]/.test(code);
    const hasDefaultReactImport = /import\s+React\s+from\s+['"]react['"]/.test(code);
    
    if (!hasReactImport && !hasDefaultReactImport) {
      // Add React hooks import at the top
      const importStatement = `import { ${usedHooks.join(', ')} } from 'react';\n`;
      result = importStatement + result;
      changes.push({
        type: 'fix',
        description: `Added missing React hooks import: ${usedHooks.join(', ')}`
      });
    } else if (hasReactImport) {
      // Check which hooks are missing from existing import
      const importMatch = code.match(/import\s+(?:React\s*,?\s*)?{([^}]+)}\s+from\s+['"]react['"]/);
      if (importMatch) {
        const importedItems = importMatch[1].split(',').map(s => s.trim());
        const missingHooks = usedHooks.filter(h => !importedItems.includes(h));
        
        if (missingHooks.length > 0) {
          const newImport = importMatch[0].replace(
            /\{([^}]+)\}/,
            `{ ${[...importedItems, ...missingHooks].join(', ')} }`
          );
          result = result.replace(importMatch[0], newImport);
          changes.push({
            type: 'fix',
            description: `Added missing hooks to React import: ${missingHooks.join(', ')}`
          });
        }
      }
    }
  }
  
  // Check for lucide-react icons used but not imported
  const iconPattern = /<([A-Z][a-zA-Z]*Icon)\s/g;
  const usedIcons: string[] = [];
  let iconMatch;
  while ((iconMatch = iconPattern.exec(code)) !== null) {
    if (!usedIcons.includes(iconMatch[1])) {
      usedIcons.push(iconMatch[1]);
    }
  }
  
  if (usedIcons.length > 0 && !code.includes('from \'lucide-react\'') && !code.includes('from "lucide-react"')) {
    // Add lucide-react import
    const iconImport = `import { ${usedIcons.join(', ')} } from 'lucide-react';\n`;
    
    // Find where to insert (after other imports or at top)
    const lastImportIndex = code.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfImport = code.indexOf('\n', lastImportIndex);
      result = result.slice(0, endOfImport + 1) + iconImport + result.slice(endOfImport + 1);
    } else {
      result = iconImport + result;
    }
    
    changes.push({
      type: 'fix',
      description: `Added lucide-react import for: ${usedIcons.join(', ')}`
    });
  }
  
  // Remove duplicate imports
  const importLines = result.match(/^import\s+.+$/gm) || [];
  const seenImports = new Set<string>();
  const duplicates: string[] = [];
  
  for (const line of importLines) {
    const normalized = line.trim();
    if (seenImports.has(normalized)) {
      duplicates.push(normalized);
    } else {
      seenImports.add(normalized);
    }
  }
  
  if (duplicates.length > 0) {
    for (const dup of duplicates) {
      const pattern = new RegExp(`^${escapeRegex(dup)}\\n?`, 'gm');
      // Replace all but keep one
      let count = 0;
      result = result.replace(pattern, (match) => {
        count++;
        return count > 1 ? '' : match;
      });
    }
    changes.push({
      type: 'fix',
      description: `Removed ${duplicates.length} duplicate imports`
    });
  }
  
  return { code: result, changes };
}

/**
 * Fix Tailwind CSS classes
 */
function fixTailwindClasses(code: string): { code: string; changes: ProcessingChange[] } {
  let result = code;
  const changes: ProcessingChange[] = [];
  
  // Map of invalid classes to valid replacements
  const classReplacements: Record<string, string> = {
    'bg-background': 'bg-white dark:bg-gray-900',
    'bg-foreground': 'bg-gray-900 dark:bg-white',
    'text-foreground': 'text-gray-900 dark:text-white',
    'text-background': 'text-white dark:text-gray-900',
    'bg-primary': 'bg-blue-600',
    'text-primary': 'text-blue-600',
    'bg-secondary': 'bg-gray-600',
    'text-secondary': 'text-gray-600',
    'bg-muted': 'bg-gray-100',
    'text-muted': 'text-gray-500',
    'border-border': 'border-gray-200 dark:border-gray-700',
    'shadow-3xl': 'shadow-2xl',
    'shadow-4xl': 'shadow-2xl',
    'shadow-5xl': 'shadow-2xl',
    'bg-destructive': 'bg-red-600',
    'text-destructive': 'text-red-600',
    'bg-accent': 'bg-blue-100',
    'text-accent': 'text-blue-700',
  };
  
  for (const [invalid, valid] of Object.entries(classReplacements)) {
    const pattern = new RegExp(`\\b${escapeRegex(invalid)}\\b`, 'g');
    if (pattern.test(result)) {
      result = result.replace(pattern, valid);
      changes.push({
        type: 'fix',
        description: `Replaced ${invalid} with ${valid}`
      });
    }
  }
  
  // Remove inline styles and convert to Tailwind where possible
  // This is a simplified version - a full implementation would parse CSS
  const inlineStylePattern = /style=\{\{([^}]+)\}\}/g;
  let styleMatch;
  while ((styleMatch = inlineStylePattern.exec(result)) !== null) {
    // For now, just flag it - full conversion is complex
    changes.push({
      type: 'enhancement',
      description: 'Consider converting inline style to Tailwind classes'
    });
    break; // Just one warning
  }
  
  return { code: result, changes };
}

/**
 * Fix accessibility issues
 */
function fixAccessibilityIssues(code: string): { code: string; changes: ProcessingChange[] } {
  let result = code;
  const changes: ProcessingChange[] = [];
  
  // Add alt="" to decorative images
  const imgWithoutAlt = /<img([^>]*?)(?<!alt=["'][^"']*["'])(?:\/?>|>)/gi;
  if (imgWithoutAlt.test(result)) {
    result = result.replace(/<img([^>]*)(?<!alt=["'][^"']*["'])(\s*\/?>)/gi, (match, attrs, closing) => {
      if (!attrs.includes('alt=')) {
        changes.push({
          type: 'fix',
          description: 'Added alt="" to image'
        });
        return `<img${attrs} alt=""${closing}`;
      }
      return match;
    });
  }
  
  // Add aria-label to icon-only buttons
  // Look for buttons that only contain SVG or icon components
  const iconButtonPattern = /<button([^>]*)>(\s*<(?:svg|[A-Z]\w*Icon)[^>]*\/?>(?:\s*<\/(?:svg|[A-Z]\w*Icon)>)?\s*)<\/button>/gi;
  result = result.replace(iconButtonPattern, (match, attrs, content) => {
    if (!attrs.includes('aria-label')) {
      changes.push({
        type: 'fix',
        description: 'Added aria-label to icon button'
      });
      return `<button${attrs} aria-label="Button">${content}</button>`;
    }
    return match;
  });
  
  // Add role="button" and tabIndex to clickable divs
  const clickableDivPattern = /<div([^>]*onClick[^>]*)>/gi;
  result = result.replace(clickableDivPattern, (match, attrs) => {
    let newAttrs = attrs;
    let modified = false;
    
    if (!attrs.includes('role=')) {
      newAttrs += ' role="button"';
      modified = true;
    }
    if (!attrs.includes('tabIndex')) {
      newAttrs += ' tabIndex={0}';
      modified = true;
    }
    
    if (modified) {
      changes.push({
        type: 'fix',
        description: 'Added role and tabIndex to clickable div'
      });
      return `<div${newAttrs}>`;
    }
    return match;
  });
  
  // Add htmlFor to labels
  const labelPattern = /<label([^>]*)>([^<]*)<\/label>\s*<input([^>]*)id="([^"]+)"/gi;
  result = result.replace(labelPattern, (match, labelAttrs, labelContent, inputAttrs, inputId) => {
    if (!labelAttrs.includes('htmlFor')) {
      changes.push({
        type: 'fix',
        description: 'Connected label to input with htmlFor'
      });
      return `<label${labelAttrs} htmlFor="${inputId}">${labelContent}</label>\n<input${inputAttrs}id="${inputId}"`;
    }
    return match;
  });
  
  return { code: result, changes };
}

/**
 * Ensure file has a default export
 */
function ensureDefaultExport(code: string, filePath: string): { code: string; changes: ProcessingChange[] } {
  let result = code;
  const changes: ProcessingChange[] = [];
  
  // Skip non-component files
  if (!filePath.includes('components/') && !filePath.includes('/app/') && !filePath.includes('/pages/')) {
    return { code: result, changes };
  }
  
  // Check if already has default export
  if (code.includes('export default') || code.includes('export { default }')) {
    return { code: result, changes };
  }
  
  // Look for a component function that should be exported
  const componentPattern = /(?:function|const)\s+([A-Z][a-zA-Z]*)\s*(?:=\s*(?:\([^)]*\)|[^=])\s*=>|=\s*function|\()/;
  const match = code.match(componentPattern);
  
  if (match) {
    const componentName = match[1];
    // Add export default at the end
    result = result + `\n\nexport default ${componentName};`;
    changes.push({
      type: 'fix',
      description: `Added default export for ${componentName}`
    });
  }
  
  return { code: result, changes };
}

/**
 * Basic code formatting
 */
function formatCode(code: string): { code: string; changes: ProcessingChange[] } {
  let result = code;
  const changes: ProcessingChange[] = [];
  
  // Remove excessive blank lines (more than 2 consecutive)
  const excessiveBlankLines = /\n{4,}/g;
  if (excessiveBlankLines.test(result)) {
    result = result.replace(excessiveBlankLines, '\n\n\n');
    changes.push({
      type: 'format',
      description: 'Removed excessive blank lines'
    });
  }
  
  // Ensure file ends with newline
  if (!result.endsWith('\n')) {
    result = result + '\n';
    changes.push({
      type: 'format',
      description: 'Added trailing newline'
    });
  }
  
  // Trim trailing whitespace from lines
  const trailingWhitespace = /[ \t]+$/gm;
  if (trailingWhitespace.test(result)) {
    result = result.replace(trailingWhitespace, '');
    changes.push({
      type: 'format',
      description: 'Removed trailing whitespace'
    });
  }
  
  return { code: result, changes };
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Post-process all files in generated code
 */
export function postProcessGeneratedCode(
  generatedCode: string,
  options: PostProcessorOptions = DEFAULT_OPTIONS
): { code: string; changes: ProcessingChange[]; fileChanges: Record<string, ProcessingChange[]> } {
  let result = generatedCode;
  const allChanges: ProcessingChange[] = [];
  const fileChanges: Record<string, ProcessingChange[]> = {};
  
  // Parse all files
  const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
  let match;
  
  while ((match = fileRegex.exec(generatedCode)) !== null) {
    const filePath = match[1];
    const content = match[2];
    
    const processed = postProcessFile(content, filePath, options);
    
    if (processed.hadIssues) {
      // Replace the file content in the result
      result = result.replace(
        `<file path="${filePath}">${content}</file>`,
        `<file path="${filePath}">${processed.code}</file>`
      );
      
      fileChanges[filePath] = processed.changes;
      allChanges.push(...processed.changes.map(c => ({
        ...c,
        location: filePath
      })));
    }
  }
  
  return {
    code: result,
    changes: allChanges,
    fileChanges
  };
}

export default postProcessFile;