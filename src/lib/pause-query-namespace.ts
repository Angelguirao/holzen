/**
 * Shared first segment for TanStack keys in the pause domain (`pause_instances`,
 * pause session UI, bulk-hold, etc.). Prefer spreading this instead of repeating
 * `['pause']` literals across query modules.
 */
export const PAUSE_QUERY_PREFIX = ['pause'] as const;
