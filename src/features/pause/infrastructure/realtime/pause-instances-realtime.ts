import { supabase } from '@/integrations/supabase/client';

type PauseInstanceRealtimeRow = {
  state?: string | null;
};

function isOpenPauseRow(row: PauseInstanceRealtimeRow | undefined): boolean {
  return row?.state === 'active' || row?.state === 'engaged';
}

/** Realtime insert/update when a `pause_instances` row becomes open (auto-trigger banner). */
export function subscribePauseInstanceOpenUpdates(
  userId: string,
  channelName: string,
  onOpen: () => void,
): () => void {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'pause_instances',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as PauseInstanceRealtimeRow;
        if (isOpenPauseRow(row)) onOpen();
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'pause_instances',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as PauseInstanceRealtimeRow;
        const oldRow = payload.old as PauseInstanceRealtimeRow;
        if (isOpenPauseRow(row) && !isOpenPauseRow(oldRow)) onOpen();
      },
    )
    .subscribe();

  return () => {
    if (typeof supabase.removeChannel === 'function') {
      supabase.removeChannel(channel);
    }
  };
}

/** Subscribe to `pause_instances` row changes for a user; returns unsubscribe. */
export function subscribePauseInstancesForUser(
  userId: string,
  channelName: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pause_instances',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        onChange();
      },
    )
    .subscribe();

  return () => {
    if (typeof supabase.removeChannel === 'function') {
      supabase.removeChannel(channel);
    }
  };
}
