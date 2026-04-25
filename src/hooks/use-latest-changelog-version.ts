import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const LAST_SEEN_VERSION_KEY = 'holzen_last_seen_version';

/**
 * Changelog "latest" version for Settings About + What's New. Uses `changelog_entries` latest row.
 */
export function useLatestChangelogVersion() {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);

  useEffect(() => {
    void supabase
      .from('changelog_entries')
      .select('version')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.version) {
          const v = data.version;
          setLatestVersion(v);
          const lastSeen = localStorage.getItem(LAST_SEEN_VERSION_KEY);
          setHasNewVersion(lastSeen !== v);
        }
      });
  }, []);

  const markChangelogSeen = useCallback(() => {
    if (latestVersion) {
      localStorage.setItem(LAST_SEEN_VERSION_KEY, latestVersion);
      setHasNewVersion(false);
    }
  }, [latestVersion]);

  return { latestVersion, hasNewVersion, markChangelogSeen };
}
