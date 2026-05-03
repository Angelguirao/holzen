import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  bulkHoldMaxRows,
  bulkHoldQueryWindowIso,
  type BulkHoldPendingPause,
} from '@/lib/bulk-hold';

export interface UseBulkHoldPendingOptions {
  userId: string | undefined;
  /** When false, skips network fetch (e.g. success step should not repopulate the teaser). */
  fetchEnabled: boolean;
  /** Increment to force a reload after a failed apply. */
  refetchNonce: number;
}

/**
 * Loads expired pause instances in the bulk-hold window that lack `outcome_logged`.
 */
export function useBulkHoldPending({ userId, fetchEnabled, refetchNonce }: UseBulkHoldPendingOptions) {
  const [pending, setPending] = useState<BulkHoldPendingPause[]>([]);

  const load = useCallback(async () => {
    if (!userId || !fetchEnabled) return;

    const windowStart = bulkHoldQueryWindowIso();
    const { data } = await supabase
      .from('pause_instances' as never)
      .select('id, created_at, context_snapshot')
      .eq('user_id', userId)
      .eq('state', 'expired')
      .gte('created_at', windowStart)
      .order('created_at', { ascending: false })
      .limit(bulkHoldMaxRows);

    const rows = (data ?? []) as BulkHoldPendingPause[];
    if (rows.length < 2) {
      setPending([]);
      return;
    }

    const { data: outcomes } = await supabase
      .from('pause_step_events' as never)
      .select('pause_instance_id')
      .eq('user_id', userId)
      .eq('step_type', 'outcome_logged')
      .in(
        'pause_instance_id',
        rows.map((r) => r.id),
      );

    const withOutcome = new Set(
      ((outcomes ?? []) as Array<{ pause_instance_id: string }>).map((o) => o.pause_instance_id),
    );

    setPending(
      rows
        .filter((r) => !withOutcome.has(r.id))
        .map((r) => ({
          ...r,
          context_snapshot: (r as { context_snapshot?: Record<string, unknown> | null }).context_snapshot ?? null,
        })),
    );
  }, [userId, fetchEnabled]);

  useEffect(() => {
    void load();
  }, [load, refetchNonce]);

  return { pending, setPending };
}
