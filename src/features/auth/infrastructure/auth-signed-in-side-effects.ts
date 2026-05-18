import type { PostgrestError, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdge } from '@/lib/invoke-edge';
import { holzenLog } from '@/lib/holzen-console';

interface UntypedInsertClient {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => Promise<{ error: PostgrestError | null }>;
  };
}

/** Welcome email on first sign-in within ~10 minutes of account creation. */
export async function runWelcomeEmailOnSignedIn(user: User): Promise<void> {
  const sentKey = `holzen_welcome_sent_${user.id}`;
  if (localStorage.getItem(sentKey)) return;
  const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
  if (!createdAt || Date.now() - createdAt > 10 * 60 * 1000) {
    localStorage.setItem(sentKey, '1');
    return;
  }
  const email = user.email;
  if (!email) return;
  const firstName =
    (user.user_metadata?.first_name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ??
    null;
  const { error: weErr } = await invokeEdge('send-transactional-email', {
    body: {
      templateName: 'welcome',
      recipientEmail: email,
      idempotencyKey: `welcome-${user.id}`,
      templateData: firstName ? { firstName } : {},
    },
  });
  if (!weErr) localStorage.setItem(sentKey, '1');
  else holzenLog.auth('welcome email invoke failed', { message: weErr.message });
}

/** Referral queue row + `record-referral` invoke when `holzen_ref` is present. */
export async function runReferralOnSignedIn(user: User): Promise<void> {
  const refCode = localStorage.getItem('holzen_ref');
  if (!refCode) return;

  const userId = user.id;
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
}

/** Runs welcome + referral side effects after `SIGNED_IN` (fire-and-forget from provider). */
export function runSignedInSideEffects(user: User): void {
  void runWelcomeEmailOnSignedIn(user);
  void runReferralOnSignedIn(user);
}
