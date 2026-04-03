import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { holzenLog } from '@/lib/holzen-console';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      holzenLog.auth('onAuthStateChange', {
        event: _event,
        hasSession: !!session,
        userIdPrefix: session?.user?.id?.slice(0, 8) ?? null,
      });
      setUser(session?.user ?? null);
      setLoading(false);

      // Record referral on first sign-in
      if (_event === 'SIGNED_IN' && session?.user) {
        const refCode = localStorage.getItem('holzen_ref');
        if (refCode) {
          // Fire-and-forget, but keep `holzen_ref` until the call succeeds.
          void supabase.functions
            .invoke('record-referral', { body: { referral_code: refCode } })
            .then(() => localStorage.removeItem('holzen_ref'))
            .catch((err) => {
              console.error('[record-referral]', err);
            });
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      holzenLog.auth('getSession (initial)', {
        hasSession: !!session,
        userIdPrefix: session?.user?.id?.slice(0, 8) ?? null,
      });
      setUser(session?.user ?? null);
      setLoading(false);
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