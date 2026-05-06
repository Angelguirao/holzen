import { useCallback, useMemo, useReducer } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const LAST_SEEN_VERSION_KEY = 'holzen_last_seen_version';

export const CHANGELOG_LATEST_VERSION_QUERY_KEY = ['changelog-entries', 'latest-version'] as const;

function readLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_VERSION_KEY);
  } catch {
    return null;
  }
}

async function fetchLatestChangelogVersion(): Promise<string | null> {
  const { data, error } = await supabase
    .from('changelog_entries')
    .select('version')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.version) return null;
  return data.version as string;
}

/**
 * Changelog "latest" version for Settings About + What's New. Uses `changelog_entries` latest row.
 * Shared TanStack cache across all callers (e.g. Settings hub + About).
 */
export function useLatestChangelogVersion() {
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const { data: latestVersion = null } = useQuery({
    queryKey: CHANGELOG_LATEST_VERSION_QUERY_KEY,
    queryFn: fetchLatestChangelogVersion,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

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
