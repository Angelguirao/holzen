import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { holzenLog } from '@/lib/holzen-console';
import type { AuthSessionState } from '@/features/auth/public';
import {
  getAuthSession,
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
      setUser(session?.user ?? null);
      setLoading(false);

      syncAuthObservability(event, session?.user?.id);
      handleAuthFunnelEvents(event, session?.user);

      if (event === 'SIGNED_IN' && session?.user) {
        runSignedInSideEffects(session.user);
      }
    });

    void getAuthSession().then((session) => {
      holzenLog.auth('getSession (initial)', {
        hasSession: !!session,
        userIdPrefix: session?.user?.id?.slice(0, 8) ?? null,
      });
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        identifyAuthenticatedUser(session.user.id);
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
