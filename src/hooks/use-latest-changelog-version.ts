import { useCallback, useMemo, useReducer } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLatestChangelogVersionQueryOptions } from '@/lib/changelog-query';

const LAST_SEEN_VERSION_KEY = 'holzen_last_seen_version';

export { CHANGELOG_LATEST_VERSION_QUERY_KEY } from '@/lib/changelog-query';

function readLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_VERSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Changelog "latest" version for Settings About + What's New. Uses `changelog_entries` latest row.
 * Shared TanStack cache across all callers (e.g. Settings hub + About).
 */
export function useLatestChangelogVersion() {
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const { data: latestVersion = null } = useQuery(getLatestChangelogVersionQueryOptions());

  const hasNewVersion = useMemo(
    () => Boolean(latestVersion && readLastSeenVersion() !== latestVersion),
    [latestVersion, bump],
  );

  const markChangelogSeen = useCallback(() => {
    if (!latestVersion) return;
    try {
      localStorage.setItem(LAST_SEEN_VERSION_KEY, latestVersion);
    } catch {
      /* ignore quota / private mode */
    }
    bump();
  }, [latestVersion]);

  return { latestVersion, hasNewVersion, markChangelogSeen };
}
