import { describe, it, expect } from 'vitest';
import type { PauseArchiveRetrospectiveRow } from '@/features/pause/domain/archive-row';
import { pauseArchiveRowAllowsRetrospectiveOutcome } from './retrospective-outcome-eligibility';

function row(partial: Partial<PauseArchiveRetrospectiveRow>): PauseArchiveRetrospectiveRow {
  return partial as PauseArchiveRetrospectiveRow;
}

describe('pauseArchiveRowAllowsRetrospectiveOutcome', () => {
  it('allows expired without outcome and id', () => {
    expect(
      pauseArchiveRowAllowsRetrospectiveOutcome(
        row({ id: 'x', state: 'expired', has_outcome_logged: false }),
      ),
    ).toBe(true);
  });

  it('disallows when outcome already logged', () => {
    expect(
      pauseArchiveRowAllowsRetrospectiveOutcome(
        row({ id: 'x', state: 'expired', has_outcome_logged: true }),
      ),
    ).toBe(false);
  });

  it('allows dismissed without outcome', () => {
    expect(
      pauseArchiveRowAllowsRetrospectiveOutcome(
        row({ id: 'x', state: 'dismissed', has_outcome_logged: false }),
      ),
    ).toBe(true);
  });

  it('disallows completed without outcome (RPC still no-ops for completed)', () => {
    expect(
      pauseArchiveRowAllowsRetrospectiveOutcome(
        row({ id: 'x', state: 'completed', has_outcome_logged: false }),
      ),
    ).toBe(false);
  });

  it('disallows missing id', () => {
    expect(
      pauseArchiveRowAllowsRetrospectiveOutcome(row({ id: null, state: 'expired', has_outcome_logged: false })),
    ).toBe(false);
  });
});
