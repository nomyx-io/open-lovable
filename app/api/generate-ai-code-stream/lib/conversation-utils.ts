import type { ConversationMessage } from '@/types/conversation';
import type { UserPreferences } from './types';

/**
 * Analyze user preferences from conversation history
 */
export function analyzeUserPreferences(messages: ConversationMessage[]): UserPreferences {
  const userMessages = messages.filter(m => m.role === 'user');
  const patterns: string[] = [];
  
  // Count edit-related keywords
  let targetedEditCount = 0;
  let comprehensiveEditCount = 0;
  
  userMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    
    // Check for targeted edit patterns
    if (content.match(/\b(update|change|fix|modify|edit|remove|delete)\s+(\w+\s+)?(\w+)\b/)) {
      targetedEditCount++;
    }
    
    // Check for comprehensive edit patterns
    if (content.match(/\b(rebuild|recreate|redesign|overhaul|refactor)\b/)) {
      comprehensiveEditCount++;
    }
    
    // Extract common request patterns
    if (content.includes('hero')) patterns.push('hero section edits');
    if (content.includes('header')) patterns.push('header modifications');
    if (content.includes('color') || content.includes('style')) patterns.push('styling changes');
    if (content.includes('button')) patterns.push('button updates');
    if (content.includes('animation')) patterns.push('animation requests');
  });
  
  return {
    commonPatterns: [...new Set(patterns)].slice(0, 3), // Top 3 unique patterns
    preferredEditStyle: targetedEditCount > comprehensiveEditCount ? 'targeted' : 'comprehensive'
  };
}

/**
 * Build conversation context string for system prompt
 */
export function buildConversationContext(
  messages: ConversationMessage[],
  edits: Array<{ userRequest: string; editType: string; targetFiles: string[] }>,
  projectEvolution: { majorChanges: Array<{ description: string }> }
): string {
  if (messages.length <= 1) {
    return '';
  }
  
  console.log('[generate-ai-code-stream] Building conversation context');
  console.log('[generate-ai-code-stream] Total messages:', messages.length);
  console.log('[generate-ai-code-stream] Total edits:', edits.length);
  
  let conversationContext = `\n\n## Conversation History (Recent)\n`;
  
  // Include only the last 3 edits to save context
  const recentEdits = edits.slice(-3);
  if (recentEdits.length > 0) {
    console.log('[generate-ai-code-stream] Including', recentEdits.length, 'recent edits in context');
    conversationContext += `\n### Recent Edits:\n`;
    recentEdits.forEach(edit => {
      conversationContext += `- "${edit.userRequest}" → ${edit.editType} (${edit.targetFiles.map(f => f.split('/').pop()).join(', ')})\n`;
    });
  }
  
  // Include recently created files - CRITICAL for preventing duplicates
  const recentMsgs = messages.slice(-5);
  const recentlyCreatedFiles: string[] = [];
  recentMsgs.forEach(msg => {
    if (msg.metadata?.editedFiles) {
      recentlyCreatedFiles.push(...msg.metadata.editedFiles);
    }
  });
  
  if (recentlyCreatedFiles.length > 0) {
    const uniqueFiles = [...new Set(recentlyCreatedFiles)];
    conversationContext += `\n### 🚨 RECENTLY CREATED/EDITED FILES (DO NOT RECREATE THESE):\n`;
    uniqueFiles.forEach(file => {
      conversationContext += `- ${file}\n`;
    });
    conversationContext += `\nIf the user mentions any of these components, UPDATE the existing file!\n`;
  }
  
  // Include only last 5 messages for context (reduced from 10)
  const recentMessages = recentMsgs;
  if (recentMessages.length > 2) { // More than just current message
    conversationContext += `\n### Recent Messages:\n`;
    recentMessages.slice(0, -1).forEach(msg => { // Exclude current message
      if (msg.role === 'user') {
        const truncatedContent = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
        conversationContext += `- "${truncatedContent}"\n`;
      }
    });
  }
  
  // Include only last 2 major changes
  const majorChanges = projectEvolution.majorChanges.slice(-2);
  if (majorChanges.length > 0) {
    conversationContext += `\n### Recent Changes:\n`;
    majorChanges.forEach(change => {
      conversationContext += `- ${change.description}\n`;
    });
  }
  
  // Keep user preferences - they're concise
  const userPrefs = analyzeUserPreferences(messages);
  if (userPrefs.commonPatterns.length > 0) {
    conversationContext += `\n### User Preferences:\n`;
    conversationContext += `- Edit style: ${userPrefs.preferredEditStyle}\n`;
  }
  
  // Limit total conversation context length
  if (conversationContext.length > 2000) {
    conversationContext = conversationContext.substring(0, 2000) + '\n[Context truncated to prevent length errors]';
  }
  
  return conversationContext;
}