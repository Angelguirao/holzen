import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { FetchedPauseInstance } from '@/lib/pause-session-storage';
import {
  buildFetchedPauseInstanceFromFetch,
  type PauseInstanceContextSnapshotRow,
} from '@/lib/pause-session-fetched-instance';

/**
 * Loads `pause_instances` + `pause_ai_artifacts` when `/pause` opens with an id-only
 * navigation (hydration `status === 'fetch'`). Cancellation matches prior inline effect.
 */
export function usePauseSessionFetch(fetchPauseInstanceId: string | null): {
  fetchedInstance: FetchedPauseInstance | null;
  fetchFailed: boolean;
} {
  const [fetchedInstance, setFetchedInstance] = useState<FetchedPauseInstance | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    if (!fetchPauseInstanceId) {
      setFetchedInstance(null);
      setFetchFailed(false);
      return;
    }
    let cancelled = false;
    setFetchedInstance(null);
    setFetchFailed(false);
    void (async () => {
      try {
        const { data: inst, error: instError } = await supabase
          .from('pause_instances' as never)
          .select('id, context_snapshot')
          .eq('id', fetchPauseInstanceId)
          .maybeSingle();
        if (cancelled) return;
        if (instError || !inst) {
          setFetchFailed(true);
          return;
        }
        const { data: artifacts, error: artifactsError } = await supabase
          .from('pause_ai_artifacts' as never)
          .select('kind, content')
          .eq('pause_instance_id', fetchPauseInstanceId);
        if (cancelled) return;
        if (artifactsError) {
          setFetchFailed(true);
          return;
        }
        const artifactRows = (artifacts ?? []) as Array<{ kind: string; content: Record<string, unknown> }>;
        setFetchedInstance(
          buildFetchedPauseInstanceFromFetch(
            fetchPauseInstanceId,
            inst as PauseInstanceContextSnapshotRow,
            artifactRows,
          ),
        );
      } catch {
        if (!cancelled) setFetchFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPauseInstanceId]);

  return { fetchedInstance, fetchFailed };
}
