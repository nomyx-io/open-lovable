import { NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

declare global {
  var viteErrors: any[];
}

// Initialize global viteErrors if not exists
if (!global.viteErrors) {
  global.viteErrors = [];
}

export async function GET() {
  try {
    const errors: any[] = [];
    
    // First, check the global viteErrors array (set by report-vite-error)
    if (global.viteErrors && global.viteErrors.length > 0) {
      // Get recent errors (last 30 seconds)
      const recentTime = Date.now() - 30000;
      const recentErrors = global.viteErrors.filter((e: any) => {
        const errorTime = new Date(e.timestamp).getTime();
        return errorTime > recentTime;
      });
      errors.push(...recentErrors);
    }
    
    // Get active sandbox provider
    const provider = sandboxManager.getActiveProvider();
    
    if (!provider) {
      // Still return any reported errors even without sandbox
      return NextResponse.json({
        success: true,
        hasErrors: errors.length > 0,
        errors: deduplicateErrors(errors)
      });
    }
    
    console.log('[monitor-vite-logs] Checking Vite process logs...');
    
    // Check if there's an error file from previous runs
    try {
      const errorFileContent = await provider.readFile('/tmp/vite-errors.json');
      if (errorFileContent) {
        const data = JSON.parse(errorFileContent);
        errors.push(...(data.errors || []));
      }
    } catch {
      // No error file exists, that's OK
    }
    
    // Check npm output for errors (specifically looking for Vite build/transform errors)
    try {
      // Look at recent stderr output - check dev server logs
      const result = await provider.runCommand('tail -100 /tmp/vite-output.log 2>/dev/null || tail -100 /tmp/npm-output.log 2>/dev/null || echo ""');
      
      if (result.success && result.stdout) {
        // Parse various Vite error types
        const viteErrors = parseViteOutput(result.stdout);
        errors.push(...viteErrors);
      }
    } catch {
      // Log files might not exist
    }
    
    // Look for any Vite-related log files that might contain errors
    try {
      const result = await provider.runCommand('find /tmp -name "*vite*" -type f -mmin -5 2>/dev/null || echo ""');
      
      if (result.success && result.stdout) {
        const logFiles = result.stdout.split('\n').filter((f: string) => f.trim());
        
        for (const logFile of logFiles.slice(0, 3)) {
          try {
            const content = await provider.readFile(logFile);
            if (content) {
              const viteErrors = parseViteOutput(content);
              errors.push(...viteErrors);
            }
          } catch {
            // Skip if file read fails
          }
        }
      }
    } catch {
      // No log files found, that's OK
    }
    
    // Deduplicate and return
    const uniqueErrors = deduplicateErrors(errors);
    
    return NextResponse.json({
      success: true,
      hasErrors: uniqueErrors.length > 0,
      errors: uniqueErrors
    });
    
  } catch (error) {
    console.error('[monitor-vite-logs] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

// Parse Vite output for various error types
function parseViteOutput(output: string): any[] {
  const errors: any[] = [];
  
  if (!output) return errors;
  
  // Pattern 1: Transform failed / Build failed
  // [plugin:vite:esbuild] Transform failed with 1 error:
  // /path/to/file.jsx:23:51: ERROR: Unterminated regular expression
  const transformMatch = output.match(/\[plugin:vite:[^\]]+\]\s*([^\n]+)\n([^\n]+\.(?:js|jsx|ts|tsx|vue|svelte)):(\d+):(\d+):\s*ERROR:\s*([^\n]+)/i);
  if (transformMatch) {
    errors.push({
      type: 'syntax-error',
      message: transformMatch[5].trim(),
      file: transformMatch[2].split('/').pop() || transformMatch[2],
      line: parseInt(transformMatch[3], 10),
      column: parseInt(transformMatch[4], 10),
      rawError: `${transformMatch[1]} - ${transformMatch[5]}`
    });
  }
  
  // Pattern 2: Failed to resolve import
  const importMatches = output.matchAll(/Failed to resolve import ['"]([^'"]+)['"] from ['"]([^'"]+)['"]/gi);
  for (const match of importMatches) {
    const importPath = match[1];
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      let packageName;
      if (importPath.startsWith('@')) {
        const parts = importPath.split('/');
        packageName = parts.length >= 2 ? parts.slice(0, 2).join('/') : importPath;
      } else {
        packageName = importPath.split('/')[0];
      }
      
      errors.push({
        type: 'npm-missing',
        package: packageName,
        message: `Failed to resolve import "${importPath}"`,
        file: match[2].split('/').pop() || match[2]
      });
    }
  }
  
  // Pattern 3: Syntax errors with file location
  // SyntaxError: Unexpected token (line:col)
  const syntaxMatch = output.match(/SyntaxError:\s*([^\n]+)\s*(?:at|in)\s+([^\s:]+):(\d+)(?::(\d+))?/i);
  if (syntaxMatch && !errors.some(e => e.type === 'syntax-error')) {
    errors.push({
      type: 'syntax-error',
      message: syntaxMatch[1].trim(),
      file: syntaxMatch[2].split('/').pop() || syntaxMatch[2],
      line: parseInt(syntaxMatch[3], 10),
      column: syntaxMatch[4] ? parseInt(syntaxMatch[4], 10) : undefined
    });
  }
  
  // Pattern 4: Internal server error (Vite 500 errors)
  const serverErrorMatch = output.match(/Internal server error:\s*([^\n]+)/i);
  if (serverErrorMatch) {
    // Extract file info if present
    const fileMatch = serverErrorMatch[1].match(/([^\s:]+\.(?:js|jsx|ts|tsx|vue|svelte)):?(\d+)?:?(\d+)?/i);
    errors.push({
      type: 'build-error',
      message: serverErrorMatch[1].trim(),
      file: fileMatch?.[1]?.split('/').pop(),
      line: fileMatch?.[2] ? parseInt(fileMatch[2], 10) : undefined,
      column: fileMatch?.[3] ? parseInt(fileMatch[3], 10) : undefined
    });
  }
  
  // Pattern 5: Pre-transform error
  const preTransformMatch = output.match(/Pre-transform error:\s*([^\n]+)/i);
  if (preTransformMatch) {
    errors.push({
      type: 'build-error',
      message: preTransformMatch[1].trim()
    });
  }
  
  // Pattern 6: Unterminated string/regex/template (with or without [plugin:...])
  const unterminatedMatch = output.match(/(Unterminated (?:string|regular expression|template literal)[^\n]*)/i);
  if (unterminatedMatch && !errors.some(e => e.message.includes('Unterminated'))) {
    // Try to find file location
    const locationMatch = output.match(/([^\s:]+\.(?:js|jsx|ts|tsx)):(\d+):(\d+)/);
    errors.push({
      type: 'syntax-error',
      message: unterminatedMatch[1].trim(),
      file: locationMatch?.[1]?.split('/').pop(),
      line: locationMatch?.[2] ? parseInt(locationMatch[2], 10) : undefined,
      column: locationMatch?.[3] ? parseInt(locationMatch[3], 10) : undefined
    });
  }
  
  return errors;
}

// Deduplicate errors
function deduplicateErrors(errors: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];
  
  for (const error of errors) {
    const key = `${error.type}:${error.message}:${error.file || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(error);
    }
  }
  
  return unique;
}