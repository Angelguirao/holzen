import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestError, User } from '@supabase/supabase-js';
import { holzenLog } from '@/lib/holzen-console';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

interface UntypedInsertClient {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => Promise<{ error: PostgrestError | null }>;
  };
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

      // Record referral on first sign-in: durable queue row + invoke (worker retries if invoke fails).
      if (_event === 'SIGNED_IN' && session?.user) {
        const refCode = localStorage.getItem('holzen_ref');
        const userId = session.user.id;
        if (refCode) {
          void (async () => {
            const { error: qErr } = await (supabase as unknown as UntypedInsertClient)
              .from('referral_pending_jobs')
              .insert({
              referred_user_id: userId,
              referral_code: refCode,
              });
            if (qErr && qErr.code !== '23505') {
              holzenLog.auth('referral_pending_jobs insert', { code: qErr.code, message: qErr.message });
            }

            const { data, error: fnErr } = await supabase.functions.invoke('record-referral', {
              body: { referral_code: refCode },
            });

            if (fnErr) {
              console.error('[record-referral]', fnErr);
              return;
            }

            const payload = data as { ok?: boolean; reason?: string } | null;
            if (payload?.ok === true) {
              localStorage.removeItem('holzen_ref');
              return;
            }
            if (payload?.ok === false && payload.reason === 'Invalid referral') {
              localStorage.removeItem('holzen_ref');
            }
          })();
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