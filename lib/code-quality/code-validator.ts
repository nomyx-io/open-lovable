/**
 * Code Validator
 * 
 * Validates generated code for syntax errors, missing imports,
 * and common issues before applying it to the sandbox.
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  fixedCode?: string;
}

export interface ValidationError {
  type: 'syntax' | 'import' | 'jsx' | 'component' | 'hook';
  message: string;
  line?: number;
  column?: number;
  filePath?: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  type: 'accessibility' | 'performance' | 'style' | 'best-practice';
  message: string;
  line?: number;
  suggestion?: string;
}

export interface ValidationSuggestion {
  type: 'improvement' | 'refactor' | 'pattern';
  message: string;
  recommendation: string;
}

/**
 * Validate a single file's code
 */
export function validateCode(
  code: string,
  filePath: string,
  projectType: 'vite-react' | 'nextjs-app' | 'nextjs-pages' | 'astro' | 'expo' = 'vite-react'
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: ValidationSuggestion[] = [];
  
  const isJSX = filePath.endsWith('.jsx') || filePath.endsWith('.tsx');
  const isTS = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
  const isAstro = filePath.endsWith('.astro');
  const isExpo = projectType === 'expo';
  
  // 1. Syntax validation
  const syntaxErrors = validateSyntax(code, isJSX, isTS);
  errors.push(...syntaxErrors);
  
  // 2. Import validation
  const importIssues = validateImports(code, filePath, projectType);
  errors.push(...importIssues.errors);
  warnings.push(...importIssues.warnings);
  
  // 3. JSX-specific validation
  if (isJSX || isAstro) {
    // Skip some web-specific JSX validations for Expo
    if (!isExpo) {
      const jsxErrors = validateJSX(code);
      errors.push(...jsxErrors);
    } else {
      // React Native specific JSX validation
      const rnJsxErrors = validateReactNativeJSX(code);
      errors.push(...rnJsxErrors);
    }
    
    // 4. React-specific validation
    const reactIssues = validateReactPatterns(code);
    warnings.push(...reactIssues.warnings);
    suggestions.push(...reactIssues.suggestions);
    
    // 5. Accessibility validation (different for React Native)
    if (!isExpo) {
      const a11yWarnings = validateAccessibility(code);
      warnings.push(...a11yWarnings);
    } else {
      const rnA11yWarnings = validateReactNativeAccessibility(code);
      warnings.push(...rnA11yWarnings);
    }
  }
  
  // 6. Tailwind/NativeWind CSS validation
  if (isExpo) {
    const nativeWindIssues = validateNativeWind(code);
    errors.push(...nativeWindIssues.errors);
    warnings.push(...nativeWindIssues.warnings);
  } else {
    const tailwindIssues = validateTailwind(code);
    errors.push(...tailwindIssues.errors);
    warnings.push(...tailwindIssues.warnings);
  }
  
  // 7. Component structure validation
  if (isJSX || isAstro) {
    const componentErrors = validateComponentStructure(code, filePath, isExpo);
    errors.push(...componentErrors);
  }
  
  // 8. React Native specific validation
  if (isExpo && isJSX) {
    const rnErrors = validateReactNativePatterns(code);
    errors.push(...rnErrors.errors);
    warnings.push(...rnErrors.warnings);
  }
  
  return {
    valid: errors.filter(e => e.severity === 'critical').length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Validate syntax using pattern matching (lightweight AST-like validation)
 */
function validateSyntax(code: string, isJSX: boolean, isTS: boolean): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for balanced braces
  const braceBalance = checkBraceBalance(code);
  if (braceBalance.unbalanced) {
    errors.push({
      type: 'syntax',
      message: `Unbalanced ${braceBalance.type}: ${braceBalance.openCount} open, ${braceBalance.closeCount} close`,
      severity: 'critical'
    });
  }
  
  // Check for unclosed strings
  const stringErrors = checkUnclosedStrings(code);
  errors.push(...stringErrors);
  
  // Check for invalid template literals
  if (code.includes('${') && !code.includes('`')) {
    errors.push({
      type: 'syntax',
      message: 'Template literal syntax ${} used without backticks',
      severity: 'error'
    });
  }
  
  // Check for common JSX issues
  if (isJSX) {
    // Check for unclosed JSX tags
    const jsxTagErrors = checkJSXTags(code);
    errors.push(...jsxTagErrors);
    
    // Check for invalid className attributes
    const classNameErrors = checkClassNameSyntax(code);
    errors.push(...classNameErrors);
  }
  
  // Check for incomplete function definitions
  const funcErrors = checkFunctionDefinitions(code);
  errors.push(...funcErrors);
  
  return errors;
}

/**
 * Check for balanced braces, brackets, and parentheses
 */
function checkBraceBalance(code: string): { 
  unbalanced: boolean; 
  type?: string; 
  openCount?: number; 
  closeCount?: number; 
} {
  const pairs = [
    { open: '{', close: '}', name: 'braces' },
    { open: '[', close: ']', name: 'brackets' },
    { open: '(', close: ')', name: 'parentheses' }
  ];
  
  // Remove strings and comments to avoid false positives
  const codeWithoutStrings = removeStringsAndComments(code);
  
  for (const pair of pairs) {
    const openCount = (codeWithoutStrings.match(new RegExp('\\' + pair.open, 'g')) || []).length;
    const closeCount = (codeWithoutStrings.match(new RegExp('\\' + pair.close, 'g')) || []).length;
    
    if (openCount !== closeCount) {
      return { unbalanced: true, type: pair.name, openCount, closeCount };
    }
  }
  
  return { unbalanced: false };
}

/**
 * Remove strings and comments from code for analysis
 */
function removeStringsAndComments(code: string): string {
  // Remove template literals
  let result = code.replace(/`[^`]*`/g, '""');
  // Remove double-quoted strings
  result = result.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  // Remove single-quoted strings
  result = result.replace(/'(?:[^'\\]|\\.)*'/g, '""');
  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove single-line comments
  result = result.replace(/\/\/[^\n]*/g, '');
  
  return result;
}

/**
 * Check for unclosed strings
 */
function checkUnclosedStrings(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip comment lines
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
    
    // Count quotes (very basic check)
    const doubleQuotes = (line.match(/(?<!\\)"/g) || []).length;
    const singleQuotes = (line.match(/(?<!\\)'/g) || []).length;
    
    // If odd number of quotes and doesn't end with continuation
    if (doubleQuotes % 2 !== 0 && !line.endsWith('+') && !line.includes('className={')) {
      // Check if it's a JSX attribute that continues to next line
      if (!line.includes('=') || line.includes('{`')) {
        // Might be a template literal, skip
        continue;
      }
    }
  }
  
  return errors;
}

/**
 * Check JSX tags for common issues
 */
function checkJSXTags(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for unclosed self-closing tags
  const selfClosingPattern = /<(\w+)[^>]*[^/]>/g;
  const voidElements = ['img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
  
  let match;
  while ((match = selfClosingPattern.exec(code)) !== null) {
    const tagName = match[1].toLowerCase();
    if (voidElements.includes(tagName)) {
      // Check if it has closing slash or separate closing tag
      const fullMatch = match[0];
      if (!fullMatch.includes('/>') && !code.includes(`</${tagName}>`)) {
        errors.push({
          type: 'jsx',
          message: `JSX requires self-closing tag for <${tagName}> (use <${tagName} /> or add closing tag)`,
          severity: 'error'
        });
      }
    }
  }
  
  // Check for className with plain string when it should be expression
  const dynamicClassPattern = /className="[^"]*\$\{/;
  if (dynamicClassPattern.test(code)) {
    errors.push({
      type: 'jsx',
      message: 'Dynamic className should use template literal: className={`...`}',
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Check className syntax
 */
function checkClassNameSyntax(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for class= instead of className= in JSX
  const classPattern = /(?<!\.)class="[^"]+"/g;
  const matches = code.match(classPattern);
  if (matches) {
    for (const match of matches) {
      // Skip if it's in a comment or string
      if (!isInComment(code, code.indexOf(match))) {
        errors.push({
          type: 'jsx',
          message: 'Use className instead of class in JSX',
          severity: 'error'
        });
      }
    }
  }
  
  return errors;
}

/**
 * Check if position is inside a comment
 */
function isInComment(code: string, position: number): boolean {
  const beforePosition = code.substring(0, position);
  const lastCommentStart = Math.max(
    beforePosition.lastIndexOf('//'),
    beforePosition.lastIndexOf('/*')
  );
  
  if (lastCommentStart === -1) return false;
  
  if (beforePosition.lastIndexOf('//') > beforePosition.lastIndexOf('\n')) {
    return true;
  }
  
  if (beforePosition.lastIndexOf('/*') > beforePosition.lastIndexOf('*/')) {
    return true;
  }
  
  return false;
}

/**
 * Check function definitions
 */
function checkFunctionDefinitions(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for function keyword without body
  const funcPattern = /function\s+\w+\s*\([^)]*\)\s*$/gm;
  if (funcPattern.test(code)) {
    errors.push({
      type: 'syntax',
      message: 'Function definition without body',
      severity: 'critical'
    });
  }
  
  // Check for arrow function without body
  const arrowPattern = /=>\s*$/gm;
  if (arrowPattern.test(code)) {
    errors.push({
      type: 'syntax',
      message: 'Arrow function without body',
      severity: 'critical'
    });
  }
  
  return errors;
}

/**
 * Validate imports
 */
function validateImports(
  code: string, 
  filePath: string,
  projectType: string
): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Extract all imports
  const importPattern = /import\s+(?:{[^}]+}|\w+|\*\s+as\s+\w+)(?:\s*,\s*(?:{[^}]+}|\w+))?\s+from\s+['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let match;
  
  while ((match = importPattern.exec(code)) !== null) {
    imports.push(match[1]);
  }
  
  // Check for React import in JSX files (not needed in React 17+ but good practice)
  if ((filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) && 
      code.includes('<') && 
      !imports.includes('react') &&
      !code.includes("from 'react'") &&
      !code.includes('from "react"')) {
    // Not an error in React 17+, just informational
  }
  
  // Check for duplicate imports
  const importSet = new Set<string>();
  for (const imp of imports) {
    if (importSet.has(imp)) {
      warnings.push({
        type: 'best-practice',
        message: `Duplicate import: ${imp}`,
        suggestion: 'Combine imports from the same module'
      });
    }
    importSet.add(imp);
  }
  
  // Check for CSS file imports in component files (anti-pattern with Tailwind)
  if (code.match(/import\s+['"][^'"]+\.css['"]/)) {
    warnings.push({
      type: 'style',
      message: 'CSS file import detected - prefer Tailwind utility classes',
      suggestion: 'Convert CSS to Tailwind classes or use global styles'
    });
  }
  
  // Check for relative import going too deep
  const deepRelativePattern = /from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\//;
  if (deepRelativePattern.test(code)) {
    warnings.push({
      type: 'best-practice',
      message: 'Deep relative import detected',
      suggestion: 'Consider using path aliases like @/components'
    });
  }
  
  return { errors, warnings };
}

/**
 * Validate JSX structure
 */
function validateJSX(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for multiple root elements (needs fragment)
  const returnPattern = /return\s*\(\s*$/gm;
  // This is a simplified check - real implementation would need proper parsing
  
  // Check for event handlers with inline arrow functions (performance concern)
  // This is actually just a warning, not an error
  
  // Check for key prop in lists
  const mapPattern = /\.map\s*\(\s*(?:\([^)]*\)|[^=]+)\s*=>/g;
  if (mapPattern.test(code) && !code.includes('key=')) {
    errors.push({
      type: 'jsx',
      message: 'List items should have a unique key prop',
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Validate React patterns
 */
function validateReactPatterns(code: string): { 
  warnings: ValidationWarning[]; 
  suggestions: ValidationSuggestion[] 
} {
  const warnings: ValidationWarning[] = [];
  const suggestions: ValidationSuggestion[] = [];
  
  // Check for useState in loops or conditions
  const hookPattern = /(?:if|for|while)\s*\([^)]*\)\s*\{[^}]*use(?:State|Effect|Memo|Callback)/;
  if (hookPattern.test(code)) {
    warnings.push({
      type: 'best-practice',
      message: 'Hooks should not be called inside loops, conditions, or nested functions',
      suggestion: 'Move hook calls to the top level of the component'
    });
  }
  
  // Check for missing dependencies in useEffect
  const useEffectPattern = /useEffect\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*\{[\s\S]*?\},\s*\[\s*\]\s*\)/;
  if (useEffectPattern.test(code)) {
    // Empty dependency array - might be intentional, just suggest checking
    suggestions.push({
      type: 'pattern',
      message: 'useEffect with empty dependency array',
      recommendation: 'Ensure all used values are included in the dependency array, or confirm empty array is intentional'
    });
  }
  
  // Check for inline object/array as props (causes re-renders)
  const inlinePropsPattern = /\w+={(?:\{|\[)[^}]*(?:\}|\])}/;
  if (inlinePropsPattern.test(code)) {
    suggestions.push({
      type: 'pattern',
      message: 'Inline objects/arrays as props may cause unnecessary re-renders',
      recommendation: 'Consider using useMemo or extracting to a constant'
    });
  }
  
  return { warnings, suggestions };
}

/**
 * Validate accessibility
 */
function validateAccessibility(code: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Check for img without alt
  if (code.includes('<img') && !code.includes('alt=')) {
    warnings.push({
      type: 'accessibility',
      message: 'Image missing alt attribute',
      suggestion: 'Add descriptive alt text or alt="" for decorative images'
    });
  }
  
  // Check for button without accessible name
  const buttonPattern = /<button[^>]*>/g;
  let btnMatch;
  while ((btnMatch = buttonPattern.exec(code)) !== null) {
    const buttonTag = btnMatch[0];
    if (!buttonTag.includes('aria-label') && 
        !buttonTag.includes('aria-labelledby') &&
        code.indexOf('</button>', btnMatch.index) === btnMatch.index + buttonTag.length) {
      // Empty button (icon-only likely)
      warnings.push({
        type: 'accessibility',
        message: 'Button without accessible text',
        suggestion: 'Add aria-label for icon-only buttons'
      });
    }
  }
  
  // Check for form inputs without labels
  if (code.includes('<input') && !code.includes('<label') && !code.includes('aria-label')) {
    warnings.push({
      type: 'accessibility',
      message: 'Form input may be missing associated label',
      suggestion: 'Add a <label> with htmlFor or use aria-label'
    });
  }
  
  // Check for onClick on non-interactive elements
  const onClickDivPattern = /<div[^>]*onClick/;
  if (onClickDivPattern.test(code)) {
    warnings.push({
      type: 'accessibility',
      message: 'onClick on div element - may not be keyboard accessible',
      suggestion: 'Use <button> for interactive elements or add keyboard event handlers and role="button"'
    });
  }
  
  return warnings;
}

/**
 * Validate Tailwind CSS usage
 */
function validateTailwind(code: string): { 
  errors: ValidationError[]; 
  warnings: ValidationWarning[] 
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // List of non-existent Tailwind classes
  const invalidClasses = [
    'bg-background', 'bg-foreground', 'text-foreground', 'bg-primary', 
    'bg-secondary', 'bg-muted', 'text-muted', 'border-border',
    'shadow-3xl', 'shadow-4xl', 'shadow-5xl'
  ];
  
  for (const invalidClass of invalidClasses) {
    if (code.includes(invalidClass)) {
      errors.push({
        type: 'jsx',
        message: `Invalid Tailwind class: ${invalidClass}`,
        severity: 'error'
      });
    }
  }
  
  // Check for potentially invalid arbitrary values
  const arbitraryPattern = /\[[\w-]+:[^\]]+\]/g;
  const arbitraryMatches = code.match(arbitraryPattern);
  if (arbitraryMatches && arbitraryMatches.length > 5) {
    warnings.push({
      type: 'style',
      message: 'Many arbitrary values detected - consider using Tailwind config',
      suggestion: 'Extend tailwind.config.js instead of using many arbitrary values'
    });
  }
  
  return { errors, warnings };
}

/**
 * Validate component structure
 */
function validateComponentStructure(code: string, filePath: string, isExpo: boolean = false): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for default export
  if (filePath.includes('components/') || filePath.includes('/app/')) {
    if (!code.includes('export default') && !code.includes('export { default }')) {
      errors.push({
        type: 'component',
        message: 'Component file missing default export',
        severity: 'error'
      });
    }
  }
  
  // Check for component naming (should match filename)
  // Skip for Expo app/ directory files which use lowercase names
  const fileName = filePath.split('/').pop()?.replace(/\.(jsx?|tsx?)$/, '');
  if (fileName && /^[A-Z]/.test(fileName)) {
    const componentPattern = new RegExp(`(?:function|const)\\s+${fileName}\\b`);
    if (!componentPattern.test(code)) {
      // Component name doesn't match filename
      errors.push({
        type: 'component',
        message: `Component name should match filename: ${fileName}`,
        severity: 'error'
      });
    }
  }
  
  return errors;
}

/**
 * Validate React Native JSX patterns
 */
function validateReactNativeJSX(code: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Check for HTML elements that should be React Native components
  const htmlElements = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'input', 'img', 'a', 'ul', 'li', 'form'];
  for (const element of htmlElements) {
    const pattern = new RegExp(`<${element}[\\s>]`, 'gi');
    if (pattern.test(code)) {
      errors.push({
        type: 'jsx',
        message: `HTML element <${element}> is not valid in React Native. Use React Native components instead.`,
        severity: 'error'
      });
    }
  }
  
  // Check for onClick instead of onPress
  if (/onClick\s*=/i.test(code)) {
    errors.push({
      type: 'jsx',
      message: 'Use onPress instead of onClick in React Native',
      severity: 'error'
    });
  }
  
  // Check for onChange instead of onChangeText on TextInput
  if (code.includes('TextInput') && /onChange\s*=/.test(code) && !/onChangeText/.test(code)) {
    errors.push({
      type: 'jsx',
      message: 'Use onChangeText instead of onChange for TextInput in React Native',
      severity: 'error'
    });
  }
  
  return errors;
}

/**
 * Validate React Native accessibility
 */
function validateReactNativeAccessibility(code: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  // Check for Image without accessible prop or accessibilityLabel
  if (code.includes('<Image') && !code.includes('accessible') && !code.includes('accessibilityLabel')) {
    warnings.push({
      type: 'accessibility',
      message: 'Image may be missing accessibilityLabel',
      suggestion: 'Add accessibilityLabel for screen readers'
    });
  }
  
  // Check for Pressable/TouchableOpacity without accessibility props
  const touchablePattern = /<(?:Pressable|TouchableOpacity)[^>]*>/g;
  let match;
  while ((match = touchablePattern.exec(code)) !== null) {
    const touchable = match[0];
    if (!touchable.includes('accessibilityLabel') && !touchable.includes('accessibilityRole')) {
      warnings.push({
        type: 'accessibility',
        message: 'Interactive element may be missing accessibility props',
        suggestion: 'Add accessibilityLabel and accessibilityRole for screen readers'
      });
      break; // Only warn once
    }
  }
  
  // Check for TextInput without accessibilityLabel
  if (code.includes('<TextInput') && !code.includes('accessibilityLabel')) {
    warnings.push({
      type: 'accessibility',
      message: 'TextInput may be missing accessibilityLabel',
      suggestion: 'Add accessibilityLabel to describe the input field'
    });
  }
  
  return warnings;
}

/**
 * Validate NativeWind (Tailwind for React Native)
 */
function validateNativeWind(code: string): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check for style prop instead of className
  const inlineStylePattern = /style\s*=\s*\{\s*\{/;
  if (inlineStylePattern.test(code)) {
    warnings.push({
      type: 'style',
      message: 'Inline style object detected - prefer NativeWind className',
      suggestion: 'Use className with Tailwind classes instead of style prop'
    });
  }
  
  // Check for StyleSheet usage
  if (code.includes('StyleSheet.create')) {
    warnings.push({
      type: 'style',
      message: 'StyleSheet detected - prefer NativeWind className',
      suggestion: 'Use className with Tailwind classes instead of StyleSheet'
    });
  }
  
  // Check for invalid web-only classes
  const webOnlyClasses = ['hover:', 'focus:', 'group-hover:', 'cursor-', 'select-'];
  for (const webClass of webOnlyClasses) {
    if (code.includes(webClass)) {
      warnings.push({
        type: 'style',
        message: `${webClass}* classes may not work in React Native`,
        suggestion: 'Use active: for press states in React Native'
      });
      break;
    }
  }
  
  // Check for unsupported layout classes
  const unsupportedClasses = ['grid', 'grid-cols', 'grid-rows', 'col-span', 'row-span'];
  for (const cls of unsupportedClasses) {
    const pattern = new RegExp(`\\b${cls}(-\\w+)?\\b`);
    if (pattern.test(code)) {
      warnings.push({
        type: 'style',
        message: `CSS Grid (${cls}) has limited support in React Native`,
        suggestion: 'Use flexbox layout instead'
      });
      break;
    }
  }
  
  // Standard Tailwind invalid classes check
  const invalidClasses = [
    'bg-background', 'bg-foreground', 'text-foreground', 'bg-primary',
    'bg-secondary', 'bg-muted', 'text-muted', 'border-border'
  ];
  
  for (const invalidClass of invalidClasses) {
    if (code.includes(invalidClass)) {
      errors.push({
        type: 'jsx',
        message: `Invalid Tailwind/NativeWind class: ${invalidClass}`,
        severity: 'error'
      });
    }
  }
  
  return { errors, warnings };
}

/**
 * Validate React Native patterns
 */
function validateReactNativePatterns(code: string): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check for proper React Native imports
  const reactNativeImports = ['View', 'Text', 'Pressable', 'ScrollView', 'FlatList', 'Image', 'TextInput'];
  const usedComponents: string[] = [];
  
  for (const comp of reactNativeImports) {
    const pattern = new RegExp(`<${comp}[\\s/>]`);
    if (pattern.test(code)) {
      usedComponents.push(comp);
    }
  }
  
  if (usedComponents.length > 0) {
    const importPattern = /from\s+['"]react-native['"]/;
    if (!importPattern.test(code)) {
      errors.push({
        type: 'import',
        message: `Missing import from 'react-native' for: ${usedComponents.join(', ')}`,
        severity: 'error'
      });
    }
  }
  
  // Check for expo-router navigation
  if (code.includes('<Link') && !code.includes("from 'expo-router'")) {
    errors.push({
      type: 'import',
      message: "Link component should be imported from 'expo-router'",
      severity: 'error'
    });
  }
  
  // Check for proper lucide-react-native usage
  if (code.includes('lucide-react') && !code.includes('lucide-react-native')) {
    errors.push({
      type: 'import',
      message: "Use 'lucide-react-native' instead of 'lucide-react' for React Native",
      severity: 'error'
    });
  }
  
  // Check for ScrollView with .map (should use FlatList for performance)
  if (code.includes('<ScrollView') && code.includes('.map(')) {
    warnings.push({
      type: 'performance',
      message: 'ScrollView with .map() may have performance issues',
      suggestion: 'Use FlatList for long lists to improve performance'
    });
  }
  
  // Check for proper safe area usage
  if (code.includes('SafeAreaView') && !code.includes("react-native-safe-area-context")) {
    warnings.push({
      type: 'best-practice',
      message: 'Use SafeAreaView from react-native-safe-area-context for proper safe area handling',
      suggestion: "Import from 'react-native-safe-area-context' instead of 'react-native'"
    });
  }
  
  return { errors, warnings };
}

/**
 * Validate all files in generated code
 */
export function validateGeneratedCode(generatedCode: string): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];
  const allSuggestions: ValidationSuggestion[] = [];
  
  // Parse all files from generated code
  const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
  let match;
  
  while ((match = fileRegex.exec(generatedCode)) !== null) {
    const filePath = match[1];
    const content = match[2];
    
    const result = validateCode(content, filePath);
    
    // Add file path to each error/warning
    for (const error of result.errors) {
      error.filePath = filePath;
      allErrors.push(error);
    }
    
    for (const warning of result.warnings) {
      allWarnings.push(warning);
    }
    
    allSuggestions.push(...result.suggestions);
  }
  
  return {
    valid: allErrors.filter(e => e.severity === 'critical').length === 0,
    errors: allErrors,
    warnings: allWarnings,
    suggestions: allSuggestions
  };
}

export default validateCode;