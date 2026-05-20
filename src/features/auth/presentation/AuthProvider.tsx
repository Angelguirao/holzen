import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { holzenLog } from '@/lib/holzen-console';
import type { AuthSessionState } from '@/features/auth/public';
import { handleAuthFunnelEvents } from '@/features/auth/application/auth-funnel-events';
import {
  identifyAuthenticatedUser,
  syncAuthObservability,
} from '@/features/auth/application/auth-observability';
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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

    supabase.auth.getSession().then(({ data: { session } }) => {
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

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
