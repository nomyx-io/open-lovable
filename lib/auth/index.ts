/**
 * Auth Module
 * 
 * Exports for the authentication system using NextAuth.js with GitHub OAuth.
 */

export { authOptions } from './auth-options';

// Re-export types from next-auth
export type { Session } from 'next-auth';