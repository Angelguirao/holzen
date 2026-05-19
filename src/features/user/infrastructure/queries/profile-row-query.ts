import { supabase } from '@/integrations/supabase/client';
import { holzenLog } from '@/lib/holzen-console';
import {
  PROFILE_QUERY_KEY,
  PROFILE_QUERY_SIGNED_OUT_KEY,
} from '@/features/user/application/queries/profile-row-keys';
import type { ProfileRow } from '@/features/user/domain/user-profile-row';

export {
  PROFILE_QUERY_PREFIX,
  PROFILE_QUERY_KEY,
  PROFILE_QUERY_SIGNED_OUT_KEY,
} from '@/features/user/application/queries/profile-row-keys';
export type { ProfileRow } from '@/features/user/domain/user-profile-row';

const PROFILE_SELECT_COLUMNS =
  'threshold, threshold_down, cumulative_threshold, last_context, email_notifications, has_onboarded, companion_haiku, companion_grounding, companion_signal, companion_zoom_out, companion_history, reflection_tone, cooldown_hours, last_trigger_at, silent_mode, custom_prompt, reflection_style, quiet_hours_start, quiet_hours_end, first_name, motivations, mantra, hold_goal_currency, hold_goal_type, hold_goal_start, hold_goal_target_months, hold_goal_target_price, tracked_asset_id, language, grounding_activities, referral_code, created_at, snoozed_until, is_admin';

/**
 * Loads (or creates) the caller's `profiles` row. Used as a single `queryFn` so all
 * subscribers share one in-flight request per `userId`.
 */
export async function fetchProfileRowForUser(userId: string): Promise<ProfileRow | null> {
  holzenLog.profile('fetch profiles', { userIdPrefix: userId.slice(0, 8) });
  const initial = await supabase
    .from('profiles')
    .select(PROFILE_SELECT_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();

  if (initial.error) {
    console.error('[useProfile] profiles select failed:', initial.error.message);
    holzenLog.profile('select failed', { message: initial.error.message });
    throw new Error(
      initial.error.message ||
        'Could not load your profile. Check your connection and try again.',
    );
  }

  let data = initial.data as ProfileRow | null;

  if (!data) {
    holzenLog.profile('no row — inserting profiles');
    const { error: insErr } = await supabase.from('profiles').insert({ user_id: userId });
    if (insErr && !String(insErr.message).includes('duplicate') && insErr.code !== '23505') {
      console.error('[useProfile] profiles insert failed:', insErr.message);
    }
    const again = await supabase
      .from('profiles')
      .select(PROFILE_SELECT_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle();
    data = again.data as ProfileRow | null;
    if (again.error) console.error('[useProfile] profiles re-select failed:', again.error.message);
  }

  return data;
}

/** Shared `useQuery` options for the signed-in `profiles` row (cache + `queryFn` aligned across subscribers). */
export function getProfileRowQueryOptions(userId: string | undefined) {
  return {
    queryKey: PROFILE_QUERY_KEY(userId ?? PROFILE_QUERY_SIGNED_OUT_KEY),
    queryFn: () => fetchProfileRowForUser(userId!),
    enabled: Boolean(userId),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
