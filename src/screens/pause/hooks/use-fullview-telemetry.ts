import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/public';
import {
  logCompanionFullviewOpened,
  type CompanionFullviewKind,
} from '@/features/pause/public-queries';

export type { CompanionFullviewKind as FullviewCompanion };

/**
 * Fires a single `companion_fullview_opened` analytics event per
 * (user, pauseInstanceId, companion) mount.
 */
export function useFullviewTelemetry(
  companion: CompanionFullviewKind,
  pauseInstanceId: string | null | undefined,
) {
  const { user } = useAuth();
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = user?.id;
    if (!pauseInstanceId || !userId) return;
    const key = `${companion}:${pauseInstanceId}`;
    if (firedRef.current === key) return;
    firedRef.current = key;

    void logCompanionFullviewOpened({
      userId,
      companion,
      pauseInstanceId,
    }).catch(() => {
      // observation only
    });
  }, [companion, pauseInstanceId, user?.id]);
}
