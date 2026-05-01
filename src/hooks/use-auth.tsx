import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdge } from '@/lib/invoke-edge';
import type { PostgrestError, User } from '@supabase/supabase-js';
import { holzenLog } from '@/lib/holzen-console';
import { setSentryUser } from '@/lib/sentry';
import { identifyPostHog, resetPostHog, trackEvent } from '@/lib/posthog';

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

      // Observability identification — id only, no email/name. See docs/ops/pii-masking-review.md.
      if (session?.user) {
        setSentryUser(session.user.id);
        identifyPostHog(session.user.id);
      } else if (_event === 'SIGNED_OUT') {
        setSentryUser(null);
        resetPostHog();
      }

      // Auth funnel events (see docs/ops/event-taxonomy.md § auth).
      if (_event === 'SIGNED_IN' && session?.user) {
        const provider = (session.user.app_metadata?.provider as string | undefined) ?? 'email';
        const createdAt = session.user.created_at
          ? new Date(session.user.created_at).getTime()
          : 0;
        // `signed_up` fires once, on the *first* sign-in within 10 min of account creation.
        // A localStorage flag guards against re-emission on token refresh.
        const signedUpKey = `holzen_signed_up_fired_${session.user.id}`;
        if (
          createdAt &&
          Date.now() - createdAt < 10 * 60 * 1000 &&
          !localStorage.getItem(signedUpKey)
        ) {
          trackEvent('auth.signed_up', { provider });
          try {
            localStorage.setItem(signedUpKey, '1');
          } catch {
            /* quota exceeded — next session will just re-skip by createdAt */
          }
        }
        trackEvent('auth.signed_in', { provider });
      }
      if (_event === 'SIGNED_OUT') {
        trackEvent('auth.signed_out');
      }

      // Record referral on first sign-in: durable queue row + invoke (worker retries if invoke fails).
      if (_event === 'SIGNED_IN' && session?.user) {
        const refCode = localStorage.getItem('holzen_ref');
        const userId = session.user.id;

        // Send welcome email once per user (idempotency key on the function side
        // also guards against duplicates if localStorage is cleared).
        void (async () => {
          const sentKey = `holzen_welcome_sent_${userId}`;
          if (localStorage.getItem(sentKey)) return;
          // Only send if the account was created in the last ~10 minutes
          // (avoids welcoming long-time users on every login).
          const createdAt = session.user.created_at ? new Date(session.user.created_at).getTime() : 0;
          if (!createdAt || Date.now() - createdAt > 10 * 60 * 1000) {
            localStorage.setItem(sentKey, '1');
            return;
          }
          const email = session.user.email;
          if (!email) return;
          const firstName =
            (session.user.user_metadata?.first_name as string | undefined) ??
            (session.user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ??
            null;
          const { error: weErr } = await invokeEdge('send-transactional-email', {
            body: {
              templateName: 'welcome',
              recipientEmail: email,
              idempotencyKey: `welcome-${userId}`,
              templateData: firstName ? { firstName } : {},
            },
          });
          if (!weErr) localStorage.setItem(sentKey, '1');
          else holzenLog.auth('welcome email invoke failed', { message: weErr.message });
        })();

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

            const { data, error: fnErr } = await invokeEdge('record-referral', {
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
      if (session?.user) {
        setSentryUser(session.user.id);
        identifyPostHog(session.user.id);
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