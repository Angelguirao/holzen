import { useEffect } from 'react';
import { subscribePauseInstancesForUser } from '../infrastructure/realtime/pause-instances-realtime';

/**
 * Invalidate or resync when `pause_instances` changes (cron offers, complete, dismiss).
 * `channelName` must be unique per subscriber to avoid Supabase channel collisions.
 */
export function usePauseInstancesRealtime(
  userId: string | undefined,
  channelName: string,
  onInstancesChange: () => void,
) {
  useEffect(() => {
    if (!userId) return;
    return subscribePauseInstancesForUser(userId, channelName, onInstancesChange);
  }, [userId, channelName, onInstancesChange]);
}
