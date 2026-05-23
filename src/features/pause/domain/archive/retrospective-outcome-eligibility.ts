import type { PauseArchiveRetrospectiveRow } from '@/features/pause/domain/archive-row';

/**
 * `pause_log_step` allows retrospective `outcome_logged` when the row is terminal
 * `expired` or `dismissed` and no `outcome_logged` step exists yet.
 */
export function pauseArchiveRowAllowsRetrospectiveOutcome(row: PauseArchiveRetrospectiveRow): boolean {
  if (!row.id) return false;
  if (row.has_outcome_logged === true) return false;
  return row.state === 'expired' || row.state === 'dismissed';
}
