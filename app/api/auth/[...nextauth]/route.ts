/**
 * NextAuth.js API Route Handler
 * 
 * Handles all auth-related requests:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/callback/github
 * - /api/auth/session
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };