import { useEffect } from 'react';
import { holzenLog } from '@/lib/holzen-console';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';

/**
 * One-shot dev diagnostic when `/pause` mounts. Arguments are read from the **first** render only
 * (empty dependency array); matches prior inline `PauseSession` behavior.
 *
 * `ritualEntryInitial` / `briefStepInitial` / `phaseInitial` mirror the page’s `useState` initializers
 * (no PII) so `[holzen:pause]` traces can distinguish picker vs resumed brief/deep and Done restores.
 */
export function usePauseSessionMountLog(params: {
  pauseInstanceIdPrefix: string | null;
  hasNavMessage: boolean;
  restoredFromStorage: boolean;
  hydrationStatus: 'ready' | 'fetch' | 'empty';
  ritualEntryInitial: RitualDepth | 'picker';
  briefStepInitial: BriefPauseStep;
  phaseInitial: 'session' | 'done';
}): void {
  useEffect(() => {
    holzenLog.pause('mount', {
      pauseInstanceIdPrefix: params.pauseInstanceIdPrefix,
      hasNavMessage: params.hasNavMessage,
      restoredFromStorage: params.restoredFromStorage,
      hydrationStatus: params.hydrationStatus,
      ritualEntryInitial: params.ritualEntryInitial,
      briefStepInitial: params.briefStepInitial,
      phaseInitial: params.phaseInitial,
    });
    // Intentional mount-only snapshot; listing deps would re-log on every navigation/hydration change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once diagnostic
  }, []);
}
