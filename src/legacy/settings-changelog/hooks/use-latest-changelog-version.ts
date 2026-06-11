import { useCallback, useMemo, useReducer } from 'react';

const LAST_SEEN_VERSION_KEY = 'holzen_last_seen_version';

/** Legacy hook — changelog_entries table removed; uses app package version for display only. */
export const CHANGELOG_LATEST_VERSION_QUERY_KEY = ['changelog-latest-version'] as const;

function readLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_VERSION_KEY);
  } catch {
    return null;
  }
}

function readAppVersion(): string | null {
  const fromEnv = import.meta.env.VITE_APP_VERSION?.trim();
  return fromEnv || null;
}

/**
 * Changelog "latest" version for legacy Settings About + What's New.
 * No longer backed by `changelog_entries`.
 */
export function useLatestChangelogVersion() {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const latestVersion = readAppVersion();

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
