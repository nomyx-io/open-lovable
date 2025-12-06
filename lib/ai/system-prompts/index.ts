/**
 * System Prompts Index
 *
 * Exports all system prompt modules and the prompt builder.
 */

export { baseSystemPrompt, editModePrompt } from './base-prompt';
export { viteReactPrompt } from './vite-react-prompt';
export { nextjsAppPrompt } from './nextjs-app-prompt';
export { astroPrompt } from './astro-prompt';
export { buildSystemPrompt, getProjectTypePrompt } from './prompt-builder';