import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { FetchedPauseInstance } from '@/lib/pause-session-storage';
import {
  buildFetchedPauseInstanceFromFetch,
  type PauseInstanceContextSnapshotRow,
} from '@/lib/pause-session-fetched-instance';

/**
 * Loads `pause_instances` + `pause_ai_artifacts` when `/pause` opens with id-only navigation
 * (hydration `status === 'fetch'` from `computePauseSessionHydration`). Row shaping:
 * `src/lib/pause-session-fetched-instance.ts`. Cancellation matches prior inline effect.
 *
 * **Caller:** `src/hooks/use-pause-session-shell.ts`. **Contract:** `docs/systems/pause-system.md`
 * section 7.2; **code map:** same doc, section 10.
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
          .select('id, context_snapshot, state, engaged_at')
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
