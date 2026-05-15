import type { PauseArchiveRow } from '@/lib/pause-archive-list-query';

/**
 * `pause_log_step` allows retrospective `outcome_logged` when the row is terminal
 * `expired` or `dismissed` and no `outcome_logged` step exists yet (see migrations
 * `20260505120000_pause_log_step_expired_outcome_rescue.sql` and
 * `20260512120000_pause_log_step_dismissed_retrospective_outcome.sql`). For `completed`
 * instances, `post_pause_emotion_logged` is the supported append path for a post-outcome
 * mood check-in; other step types still no-op. This helper is only for archive retrospective
 * outcome rescue on expired/dismissed rows.
 */
export function pauseArchiveRowAllowsRetrospectiveOutcome(row: PauseArchiveRow): boolean {
  if (!row.id) return false;
  if (row.has_outcome_logged === true) return false;
  return row.state === 'expired' || row.state === 'dismissed';
}
