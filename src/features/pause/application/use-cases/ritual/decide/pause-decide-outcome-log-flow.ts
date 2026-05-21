/**
 * CI cluster anchor for ritual decide outcome_logged RPC (§3 / check:architecture-alignment).
 * Use case lives in `run-pause-outcome-log`; re-export for presentation I/O imports.
 */
export { runPauseOutcomeLog } from './run-pause-outcome-log';
export type { RunPauseOutcomeLogResult } from '@/features/pause/domain/decide/pause-outcome-log-result';
