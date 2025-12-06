/**
 * System Prompts Index
 *
 * Exports all system prompt modules and the prompt builder.
 */

export { baseSystemPrompt, editModePrompt } from './base-prompt';
export { viteReactPrompt } from './vite-react-prompt';
export { nextjsAppPrompt } from './nextjs-app-prompt';
export { astroPrompt } from './astro-prompt';
export { browserToolPrompt } from './browser-tool-prompt';
export { buildSystemPrompt, getProjectTypePrompt, buildSystemPromptWithOptions } from './prompt-builder';