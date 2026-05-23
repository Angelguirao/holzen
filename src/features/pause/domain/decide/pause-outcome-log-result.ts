import type { PauseState } from '@/features/pause/domain/pause-state';

/** Result of `runPauseOutcomeLog` — maps to presentation flow branches. */
export type RunPauseOutcomeLogResult =
  | { status: 'no_instance' }
  | { status: 'completed' }
  | { status: 'not_completed'; outcomeState: PauseState }
  | { status: 'sync_failed' };
