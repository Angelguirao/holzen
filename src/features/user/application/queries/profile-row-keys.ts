/** TanStack key helpers for signed-in `profiles` row (no Supabase). */

export const PROFILE_QUERY_PREFIX = ['profile'] as const;

/** User-id placeholder when the profile query is disabled (signed out). */
export const PROFILE_QUERY_SIGNED_OUT_KEY = '__signed_out__' as const;

export const PROFILE_QUERY_KEY = (userId: string) =>
  [...PROFILE_QUERY_PREFIX, userId] as const;
