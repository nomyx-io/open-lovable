/**
 * NextAuth.js Configuration
 * 
 * Central auth configuration for GitHub OAuth integration.
 */

import type { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      authorization: {
        params: {
          // Request repo scope for full repository access
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],

  callbacks: {
    /**
     * JWT callback - runs when JWT is created or updated
     * Store the access token in the JWT for later use
     */
    async jwt({ token, account, profile }) {
      // On initial sign in, add access token and user info
      if (account && profile) {
        token.accessToken = account.access_token;
        token.userId = profile.id?.toString();
        token.login = profile.login;
      }
      return token;
    },

    /**
     * Session callback - runs when session is checked
     * Make access token available in the session
     */
    async session({ session, token }) {
      // Add access token to session for client use
      session.accessToken = token.accessToken;
      
      // Add GitHub-specific user info
      if (session.user) {
        session.user.id = token.userId || token.sub || '';
        session.user.login = token.login;
      }
      
      return session;
    },

    /**
     * Sign in callback - runs when user signs in
     */
    async signIn({ account, profile }) {
      // Only allow sign in if we got a GitHub account
      if (account?.provider === 'github' && profile) {
        return true;
      }
      return false;
    },
  },

  pages: {
    signIn: '/auth/signin', // Custom sign-in page (optional)
    error: '/auth/error',   // Custom error page (optional)
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;