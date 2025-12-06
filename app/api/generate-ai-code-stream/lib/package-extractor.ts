/**
 * Extract packages from import statements in code
 */
export function extractPackagesFromCode(content: string): string[] {
  const packages: string[] = [];
  // Match ES6 imports
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
  let importMatch;
  
  while ((importMatch = importRegex.exec(content)) !== null) {
    const importPath = importMatch[1];
    // Skip relative imports and built-in React
    if (!importPath.startsWith('.') && !importPath.startsWith('/') && 
        importPath !== 'react' && importPath !== 'react-dom' &&
        !importPath.startsWith('@/')) {
      // Extract package name (handle scoped packages like @heroicons/react)
      const packageName = importPath.startsWith('@') 
        ? importPath.split('/').slice(0, 2).join('/')
        : importPath.split('/')[0];
      
      if (!packages.includes(packageName)) {
        packages.push(packageName);
      }
    }
  }
  
  return packages;
}

/**
 * Extract packages from <package> tags in generated code
 */
export function extractPackagesFromTags(generatedCode: string): string[] {
  const packages: string[] = [];
  
  // Single package tags
  const packageRegex = /<package>([^<]+)<\/package>/g;
  let packageMatch;
  while ((packageMatch = packageRegex.exec(generatedCode)) !== null) {
    const packageName = packageMatch[1].trim();
    if (packageName && !packages.includes(packageName)) {
      packages.push(packageName);
    }
  }
  
  // Multiple packages in <packages> tag
  const packagesRegex = /<packages>([\s\S]*?)<\/packages>/g;
  let packagesMatch;
  while ((packagesMatch = packagesRegex.exec(generatedCode)) !== null) {
    const packagesContent = packagesMatch[1].trim();
    const packagesList = packagesContent.split(/[\n,]+/)
      .map(pkg => pkg.trim())
      .filter(pkg => pkg.length > 0);
    
    for (const packageName of packagesList) {
      if (!packages.includes(packageName)) {
        packages.push(packageName);
      }
    }
  }
  
  return packages;
}