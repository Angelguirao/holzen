import type { PauseArchiveRow } from '@/hooks/use-pause-archive-list';

/**
 * `pause_log_step` allows retrospective `outcome_logged` when the row is terminal
 * **`expired` or `dismissed`** and no `outcome_logged` step exists yet (see migrations
 * `20260505120000_pause_log_step_expired_outcome_rescue.sql` and
 * `20260512120000_pause_log_step_dismissed_retrospective_outcome.sql`). **`completed`**
 * still no-ops for new steps — use archive only for expired/dismissed without outcome.
 */
export function pauseArchiveRowAllowsRetrospectiveOutcome(row: PauseArchiveRow): boolean {
  if (!row.id) return false;
  if (row.has_outcome_logged === true) return false;
  return row.state === 'expired' || row.state === 'dismissed';
}
