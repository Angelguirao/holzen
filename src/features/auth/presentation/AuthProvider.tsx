import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthChangeEvent, User } from '@supabase/supabase-js';
import { holzenLog } from '@/lib/holzen-console';
import type { AuthSessionState } from '@/features/auth/public';
import {
  getAuthUser,
  handleAuthFunnelEvents,
  identifyAuthenticatedUser,
  signOutAuth,
  subscribeAuthStateChange,
  syncAuthObservability,
} from './auth-session-io';
import { runSignedInSideEffects } from '../public-hooks';

const AuthContext = createContext<AuthSessionState>({
  user: null,
  loading: true,
  signOut: async () => {},
});

async function resolveSessionUser(
  event: AuthChangeEvent,
  sessionUser: User | null,
): Promise<User | null> {
  if (!sessionUser) return null;
  if (event !== 'INITIAL_SESSION' && event !== 'TOKEN_REFRESHED') {
    return sessionUser;
  }
  const validated = await getAuthUser();
  if (!validated) {
    holzenLog.auth('stale session — signing out', {
      event,
      userIdPrefix: sessionUser.id.slice(0, 8),
    });
    await signOutAuth();
    return null;
  }
  return validated;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuthStateChange(async (event, session) => {
      holzenLog.auth('onAuthStateChange', {
        event,
        hasSession: !!session,
        userIdPrefix: session?.user?.id?.slice(0, 8) ?? null,
      });

      const nextUser = await resolveSessionUser(event, session?.user ?? null);
      setUser(nextUser);
      setLoading(false);

      syncAuthObservability(event, nextUser?.id);
      handleAuthFunnelEvents(event, nextUser ?? undefined);

      if (nextUser && event === 'INITIAL_SESSION') {
        identifyAuthenticatedUser(nextUser.id);
      }
      if (event === 'SIGNED_IN' && nextUser) {
        runSignedInSideEffects(nextUser);
      }
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    await signOutAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
