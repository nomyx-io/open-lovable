import { selectFilesForEdit } from '@/lib/context-selector';
import { executeSearchPlan, formatSearchResultsForAI, selectTargetFile } from '@/lib/file-search-executor';
import type { FileManifest } from '@/types/file-manifest';
import type { EditContext, SearchPlan, StreamProgressData } from './types';

/**
 * Build surgical edit context with search-based workflow
 */
export async function buildSurgicalEditContext(
  prompt: string,
  manifest: FileManifest,
  fileContents: Record<string, { content: string }>,
  model: string,
  sendProgress: (data: StreamProgressData) => Promise<void>
): Promise<EditContext | null> {
  console.log('[edit-context-builder] Starting agentic search workflow');
  console.log('[edit-context-builder] Files available for search:', Object.keys(fileContents).length);
  
  try {
    await sendProgress({ type: 'status', message: '🔍 Creating search plan...' });
    
    const intentResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze-edit-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, manifest, model })
    });
    
    if (!intentResponse.ok) {
      console.error('[edit-context-builder] Failed to get search plan');
      return null;
    }
    
    const { searchPlan } = await intentResponse.json() as { searchPlan: SearchPlan };
    console.log('[edit-context-builder] Search plan received:', searchPlan);
    
    await sendProgress({ 
      type: 'status', 
      message: `🔎 Searching for: "${searchPlan.searchTerms.join('", "')}"`
    });
    
    // Execute the search plan
    const searchExecution = executeSearchPlan(searchPlan, 
      Object.fromEntries(
        Object.entries(fileContents).map(([path, data]) => [
          path.startsWith('/') ? path : `/home/user/app/${path}`,
          data.content
        ])
      )
    );
    
    console.log('[edit-context-builder] Search execution:', {
      success: searchExecution.success,
      resultsCount: searchExecution.results.length,
      filesSearched: searchExecution.filesSearched,
      time: searchExecution.executionTime + 'ms'
    });
    
    if (searchExecution.success && searchExecution.results.length > 0) {
      // Select the best target file
      const target = selectTargetFile(searchExecution.results, searchPlan.editType);
      
      if (target) {
        await sendProgress({ 
          type: 'status', 
          message: `✅ Found code in ${target.filePath.split('/').pop()} at line ${target.lineNumber}`
        });
        
        console.log('[edit-context-builder] Target selected:', target);
        
        // Build enhanced context with search results
        const enhancedSystemPrompt = `
${formatSearchResultsForAI(searchExecution.results)}

SURGICAL EDIT INSTRUCTIONS:
You have been given the EXACT location of the code to edit.
- File: ${target.filePath}
- Line: ${target.lineNumber}
- Reason: ${target.reason}

Make ONLY the change requested by the user. Do not modify any other code.
User request: "${prompt}"`;
        
        return {
          primaryFiles: [target.filePath],
          contextFiles: [],
          systemPrompt: enhancedSystemPrompt,
          editIntent: {
            type: searchPlan.editType,
            description: searchPlan.reasoning,
            targetFiles: [target.filePath],
            confidence: 0.95, // High confidence since we found exact location
            searchTerms: searchPlan.searchTerms
          }
        };
      }
    }
    
    // Search failed - fall back to keyword method
    console.warn('[edit-context-builder] Search found no results, falling back to broader context');
    await sendProgress({ 
      type: 'status', 
      message: '⚠️ Could not find exact match, using broader search...'
    });
    
    return null;
    
  } catch (error) {
    console.error('[edit-context-builder] Error in agentic search workflow:', error);
    await sendProgress({ 
      type: 'status', 
      message: '⚠️ Search workflow error, falling back to keyword method...'
    });
    
    // Fall back to old method on any error
    return selectFilesForEdit(prompt, manifest);
  }
}

/**
 * Build keyword-based edit context from fetched manifest
 */
export async function buildKeywordEditContext(
  prompt: string,
  manifest: FileManifest,
  model: string,
  sendProgress: (data: StreamProgressData) => Promise<void>
): Promise<EditContext | null> {
  try {
    const intentResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze-edit-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, manifest, model })
    });
    
    if (!intentResponse.ok) {
      return null;
    }
    
    const { searchPlan } = await intentResponse.json() as { searchPlan: SearchPlan };
    console.log('[edit-context-builder] Search plan received (after fetch):', searchPlan);
    
    // Keyword-based file search
    let targetFiles: string[] = [];
    if (!searchPlan || searchPlan.searchTerms.length === 0) {
      console.warn('[edit-context-builder] No target files after fetch, searching for relevant files');
      
      const promptLower = prompt.toLowerCase();
      const allFilePaths = Object.keys(manifest.files);
      
      // Look for component names mentioned in the prompt
      if (promptLower.includes('hero')) {
        targetFiles = allFilePaths.filter(p => p.toLowerCase().includes('hero'));
      } else if (promptLower.includes('header')) {
        targetFiles = allFilePaths.filter(p => p.toLowerCase().includes('header'));
      } else if (promptLower.includes('footer')) {
        targetFiles = allFilePaths.filter(p => p.toLowerCase().includes('footer'));
      } else if (promptLower.includes('nav')) {
        targetFiles = allFilePaths.filter(p => p.toLowerCase().includes('nav'));
      } else if (promptLower.includes('button')) {
        targetFiles = allFilePaths.filter(p => p.toLowerCase().includes('button'));
      }
      
      if (targetFiles.length > 0) {
        console.log('[edit-context-builder] Found target files by keyword search:', targetFiles);
      }
    }
    
    const allFiles = Object.keys(manifest.files)
      .filter(path => !targetFiles.includes(path));
    
    const systemPrompt = buildSurgicalEditSystemPrompt(prompt, searchPlan, targetFiles);
    
    const editContext: EditContext = {
      primaryFiles: targetFiles,
      contextFiles: allFiles,
      systemPrompt,
      editIntent: {
        type: searchPlan?.editType || 'UPDATE_COMPONENT',
        targetFiles: targetFiles,
        confidence: searchPlan ? 0.85 : 0.6,
        description: searchPlan?.reasoning || 'Keyword-based file selection',
        suggestedContext: []
      }
    };
    
    await sendProgress({ 
      type: 'status', 
      message: `Identified edit type: ${editContext.editIntent.description}`
    });
    
    return editContext;
    
  } catch (error) {
    console.error('[edit-context-builder] Error analyzing intent after fetch:', error);
    return null;
  }
}

/**
 * Build system prompt for surgical edits
 */
function buildSurgicalEditSystemPrompt(
  prompt: string,
  searchPlan: SearchPlan | null,
  targetFiles: string[]
): string {
  return `
You are an expert senior software engineer performing a surgical, context-aware code modification. Your primary directive is **precision and preservation**.

Think of yourself as a surgeon making a precise incision, not a construction worker demolishing a wall.

## Search-Based Edit
Search Terms: ${searchPlan?.searchTerms?.join(', ') || 'keyword-based'}
Edit Type: ${searchPlan?.editType || 'UPDATE_COMPONENT'}
Reasoning: ${searchPlan?.reasoning || 'Modifying based on user request'}

Files to Edit: ${targetFiles.join(', ') || 'To be determined'}
User Request: "${prompt}"

## Your Mandatory Thought Process (Execute Internally):
Before writing ANY code, you MUST follow these steps:

1. **Understand Intent:**
   - What is the user's core goal? (adding feature, fixing bug, changing style?)
   - Does the conversation history provide extra clues?

2. **Locate the Code:**
   - First examine the Primary Files provided
   - Check the "ALL PROJECT FILES" list to find the EXACT file name
   - "nav" might be Navigation.tsx, NavBar.tsx, Nav.tsx, or Header.tsx
   - DO NOT create a new file if a similar one exists!

3. **Plan the Changes (Mental Diff):**
   - What is the *minimal* set of changes required?
   - Which exact lines need to be added, modified, or deleted?
   - Will this require new packages?

4. **Verify Preservation:**
   - What existing code, props, state, and logic must NOT be touched?
   - How can I make my change without disrupting surrounding code?

5. **Construct the Final Code:**
   - Only after completing steps above, generate the final code
   - Provide the ENTIRE file content with modifications integrated

## Critical Rules & Constraints:

**PRESERVATION IS KEY:** You MUST NOT rewrite entire components or files. Integrate your changes into the existing code. Preserve all existing logic, props, state, and comments not directly related to the user's request.

**MINIMALISM:** Only output files you have actually changed. If a file doesn't need modification, don't include it.

**COMPLETENESS:** Each file must be COMPLETE from first line to last:
- NEVER TRUNCATE - Include EVERY line
- NO ellipsis (...) to skip content
- ALL imports, functions, JSX, and closing tags must be present
- The file MUST be runnable

**SURGICAL PRECISION:**
- Change ONLY what's explicitly requested
- If user says "change background to green", change ONLY the background class
- 99% of the original code should remain untouched
- NO refactoring, reformatting, or "improvements" unless requested

**NO CONVERSATION:** Your output must contain ONLY the code. No explanations or apologies.

Remember: You are a SURGEON making a precise incision, not an artist repainting the canvas!`;
}