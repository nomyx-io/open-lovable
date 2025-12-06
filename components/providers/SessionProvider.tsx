'use client';

/**
 * Session Provider Component
 * 
 * Wraps the app with NextAuth SessionProvider for auth context.
 */

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function SessionProvider({ children }: Props) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}

export default SessionProvider;