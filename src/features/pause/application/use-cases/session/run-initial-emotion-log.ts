import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';
import type { MoodValue } from '@/features/pause/domain/mood-value';
import {
  buildInitialEmotionLoggedPayload,
  initialEmotionLogDedupeKey,
  initialEmotionSkippedLogDedupeKey,
  initialEmotionSkippedLoggedPayload,
  type InitialEmotionLogOpts,
} from './initial-emotion-log';

export type InitialEmotionUiState = {
  moodDone: boolean;
  selectedMood: MoodValue | null;
  feelIntensity: number | null;
  selectedBriefFace: FeelStepTile | null;
};

const ROLLBACK_UI: InitialEmotionUiState = {
  moodDone: false,
  selectedMood: null,
  feelIntensity: null,
  selectedBriefFace: null,
};

function selectUiState(
  mood: MoodValue,
  intensity: number | undefined,
  opts?: InitialEmotionLogOpts,
): InitialEmotionUiState {
  return {
    moodDone: true,
    selectedMood: mood,
    feelIntensity: typeof intensity === 'number' ? intensity : null,
    selectedBriefFace: opts?.briefFace ?? null,
  };
}

export type RunInitialEmotionSelectResult =
  | { status: 'deduped'; ui: InitialEmotionUiState }
  | { status: 'synced'; ui: InitialEmotionUiState; logKey: string }
  | { status: 'local_only'; ui: InitialEmotionUiState }
  | { status: 'sync_failed'; ui: InitialEmotionUiState };

export type RunInitialEmotionSkipResult =
  | { status: 'synced'; logKey: string; ui: Pick<InitialEmotionUiState, 'moodDone' | 'feelIntensity'> }
  | { status: 'local_only'; ui: Pick<InitialEmotionUiState, 'moodDone' | 'feelIntensity'> }
  | { status: 'sync_failed' };

type LogInitialEmotionStepPort = (params: {
  instanceId: string;
  payload: Record<string, unknown>;
}) => Promise<void>;

/** Feel-step mood select: dedupe gate, optimistic UI, `initial_emotion_logged` RPC. */
export async function runInitialEmotionSelect(
  input: {
    pauseInstanceId: string | null;
    mood: MoodValue;
    intensity?: number;
    opts?: InitialEmotionLogOpts;
    lastFeelLogKey: string | null;
  },
  ports: { logStep: LogInitialEmotionStepPort },
): Promise<RunInitialEmotionSelectResult> {
  const { pauseInstanceId, mood, intensity, opts, lastFeelLogKey } = input;
  const payload = buildInitialEmotionLoggedPayload(mood, intensity, opts);
  const logKey = initialEmotionLogDedupeKey(payload, opts?.briefFace);
  const ui = selectUiState(mood, intensity, opts);

  if (pauseInstanceId && lastFeelLogKey === logKey) {
    return { status: 'deduped', ui };
  }

  if (!pauseInstanceId) {
    return { status: 'local_only', ui };
  }

  try {
    await ports.logStep({ instanceId: pauseInstanceId, payload });
    return { status: 'synced', ui, logKey };
  } catch {
    return { status: 'sync_failed', ui: ROLLBACK_UI };
  }
}

/** Feel-step skip: `initial_emotion_logged` with `{ skipped: true }`. */
export async function runInitialEmotionSkip(
  input: { pauseInstanceId: string | null },
  ports: { logStep: LogInitialEmotionStepPort },
): Promise<RunInitialEmotionSkipResult> {
  const ui = { moodDone: true, feelIntensity: null } as const;

  if (!input.pauseInstanceId) {
    return { status: 'local_only', ui };
  }

  try {
    await ports.logStep({
      instanceId: input.pauseInstanceId,
      payload: initialEmotionSkippedLoggedPayload(),
    });
    return { status: 'synced', logKey: initialEmotionSkippedLogDedupeKey(), ui };
  } catch {
    return { status: 'sync_failed' };
  }
}

/** Clears Feel-step UI + dedupe ref (hook applies `logKey` null separately). */
export function initialEmotionResetUi(): InitialEmotionUiState {
  return { ...ROLLBACK_UI };
}
