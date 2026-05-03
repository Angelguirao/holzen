import { useEffect } from 'react';
import { holzenLog } from '@/lib/holzen-console';
import type { PauseSessionMountLogParams } from '@/lib/pause-session-mount-log-params';

/**
 * One-shot dev diagnostic when `/pause` mounts. Arguments are read from the **first** render only
 * (empty dependency array); matches prior inline `PauseSession` behavior.
 *
 * **Call site:** pass `buildPauseSessionMountLogParams(...)` from `@/lib/pause-session-mount-log-params`
 * so restore + nav + hydration wiring stays in one place.
 *
 * **Observability:** `docs/ops/logging-strategy.md` (browser Holzen console / `[holzen:pause]`). Payload
 * fields are non-PII — see that lib module’s header and `docs/systems/pause-system.md` section 10.
 */
export function usePauseSessionMountLog(params: PauseSessionMountLogParams): void {
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
