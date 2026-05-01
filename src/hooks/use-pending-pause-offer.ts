import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export interface PendingPauseOfferRow {
  id: string;
  created_at: string;
  context_snapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  preview_message: string | null;
}

/**
 * The single `state = 'pending'` pause row for the user (if any), plus a
 * short reflection preview when artifacts exist. Subscribes to
 * `pause_instances` so cron-created offers surface without refresh.
 */
export function usePendingPauseOffer() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingPauseOfferRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setPending(null);
      setLoaded(true);
      return;
    }

    const { data, error } = await supabase
      .from('pause_instances' as never)
      .select('id, created_at, context_snapshot, metadata')
      .eq('user_id', user.id)
      .eq('state', 'pending' as never)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      setPending(null);
      setLoaded(true);
      return;
    }

    const row = data as {
      id: string;
      created_at: string;
      context_snapshot: Record<string, unknown> | null;
      metadata: Record<string, unknown> | null;
    };

    const { data: art } = await supabase
      .from('pause_ai_artifacts' as never)
      .select('content')
      .eq('pause_instance_id', row.id)
      .eq('kind', 'reflection_text')
      .maybeSingle();

    const content = art as { content: Record<string, unknown> } | null;
    const preview =
      content?.content && typeof content.content.message === 'string'
        ? (content.content.message as string)
        : null;

    setPending({
      id: row.id,
      created_at: row.created_at,
      context_snapshot: row.context_snapshot,
      metadata: row.metadata,
      preview_message: preview,
    });
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`pause-pending-offer-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pause_instances',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  return { pending, loaded, refresh: load };
}
