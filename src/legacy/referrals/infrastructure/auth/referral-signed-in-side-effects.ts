import type { PostgrestError, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { invokeRecordReferral } from '../edge/referral-edge';

interface UntypedInsertClient {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => Promise<{ error: PostgrestError | null }>;
  };
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
    console.error('[referral_pending_jobs]', qErr.code, qErr.message);
  }

  const { data, error: fnErr } = await invokeRecordReferral(refCode);

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
