import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export async function updateProfileFields(
  userId: string,
  updates: ProfileUpdate,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('profiles').update(updates).eq('user_id', userId);
  return { error: error ? new Error(error.message) : null };
}

export async function fetchProfileLastTriggerAt(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('profiles')
    .select('last_trigger_at')
    .eq('user_id', userId)
    .single();
  return data?.last_trigger_at ?? null;
}

export type ProfilesDisplayCurrencyUpdate = Pick<
  Database['public']['Tables']['profiles']['Update'],
  'display_currency'
>;

/** @deprecated Use `ProfilesDisplayCurrencyUpdate` */
export type ProfilesHoldGoalUpdate = ProfilesDisplayCurrencyUpdate;

export async function updateProfileSnoozedUntil(
  userId: string,
  snoozedUntil: string | null,
): Promise<{ error: Error | null }> {
  return updateProfileFields(userId, { snoozed_until: snoozedUntil });
}

export async function updateProfileHoldGoal(
  userId: string,
  updates: ProfilesHoldGoalUpdate,
): Promise<{ error: Error | null }> {
  return updateProfileFields(userId, updates);
}

export async function clearProfileHoldGoal(_userId: string): Promise<{ error: Error | null }> {
  // Hold-goal columns dropped in 20260604120000_pause_first_zombie_schema_cleanup.sql.
  return { error: null };
}
