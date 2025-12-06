/**
 * NextAuth.js Type Declarations
 * 
 * Extends the default session types to include GitHub access token
 */

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      login?: string; // GitHub username
    };
  }

  interface Profile {
    login?: string;
    id?: number;
    avatar_url?: string;
    name?: string;
    email?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    userId?: string;
    login?: string;
  }
}