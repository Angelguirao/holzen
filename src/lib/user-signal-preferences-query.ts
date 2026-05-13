import { supabase } from '@/integrations/supabase/client';

export interface UserPref {
  id: string;
  source_id: string | null;
  custom_name: string | null;
  custom_url: string | null;
  custom_type: string | null;
  active: boolean;
  category: string;
}

export const USER_SIGNAL_PREFS_QUERY_PREFIX = ['user-signal-preferences'] as const;

export const USER_SIGNAL_PREFS_DISABLED_USER_ID = 'none' as const;

export const USER_SIGNAL_PREFS_NONE_QUERY_KEY = [
  ...USER_SIGNAL_PREFS_QUERY_PREFIX,
  USER_SIGNAL_PREFS_DISABLED_USER_ID,
] as const;

export const USER_SIGNAL_PREFS_QUERY_KEY = (userId: string) =>
  [...USER_SIGNAL_PREFS_QUERY_PREFIX, userId] as const;

export async function fetchUserSignalPreferences(userId: string): Promise<UserPref[]> {
  const { data, error } = await supabase.from('user_signal_preferences').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data as unknown as UserPref[]) ?? [];
}

export function getUserSignalPreferencesQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? USER_SIGNAL_PREFS_QUERY_KEY(userId) : USER_SIGNAL_PREFS_NONE_QUERY_KEY,
    queryFn: () => fetchUserSignalPreferences(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
