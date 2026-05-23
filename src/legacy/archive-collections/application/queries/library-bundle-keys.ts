/** TanStack key helpers for library collections bundle (no Supabase). */

export const LIBRARY_BUNDLE_QUERY_PREFIX = ['library', 'bundle'] as const;

/** Prefix for TanStack invalidation (e.g. pause completion → refresh member rows). */
export function libraryBundleQueryPrefix(userId: string) {
  return [...LIBRARY_BUNDLE_QUERY_PREFIX, userId] as const;
}

/** User-id segment for disabled query options when signed out. */
export const LIBRARY_BUNDLE_DISABLED_USER_ID = '__none__' as const;
