import { pauseLogStep } from '../../infrastructure/pause-rpc-client';
import { buildOutcomeLoggedPayload } from './outcome-log-payload';
import type { BulkHoldOutcomeChoice, BulkHoldPendingPause } from '../../domain/bulk-hold';

export type BulkHoldApplyResult =
  | { status: 'success'; count: number }
  | { status: 'partial'; failedRows: BulkHoldPendingPause[] }
  | { status: 'failed' };

function rowFailed(result: PromiseSettledResult<unknown>): boolean {
  if (result.status === 'rejected') return true;
  const v = result.status === 'fulfilled' ? result.value : null;
  return v === null || v === undefined;
}

/**
 * Calls `pause_log_step` with `outcome_logged` for each row. Intended for expired instances
 * after DB allows retrospective outcomes (see pause migration expired rescue).
 */
export async function applyBulkHoldOutcomes(
  rows: BulkHoldPendingPause[],
  resolver: (p: BulkHoldPendingPause) => BulkHoldOutcomeChoice,
): Promise<BulkHoldApplyResult> {
  if (rows.length === 0) return { status: 'failed' };

  const settled = await Promise.allSettled(
    rows.map((p) =>
      pauseLogStep({
        instanceId: p.id,
        stepType: 'outcome_logged',
        payload: buildOutcomeLoggedPayload(resolver(p)),
      }),
    ),
  );

  const failedRows: BulkHoldPendingPause[] = [];
  settled.forEach((r, i) => {
    if (rowFailed(r)) failedRows.push(rows[i]);
  });

  if (failedRows.length === rows.length) return { status: 'failed' };
  if (failedRows.length > 0) return { status: 'partial', failedRows };
  return { status: 'success', count: rows.length };
}
