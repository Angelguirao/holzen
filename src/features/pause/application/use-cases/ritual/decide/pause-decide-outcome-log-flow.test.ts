import { describe, expect, it } from 'vitest';

import { runPauseOutcomeLog as runOutcomeLogDirect } from './run-pause-outcome-log';
import { runPauseOutcomeLog } from './pause-decide-outcome-log-flow';

describe('pause-decide-outcome-log-flow', () => {
  it('re-exports outcome_logged RPC use case from run-pause-outcome-log leaf', () => {
    expect(typeof runPauseOutcomeLog).toBe('function');
    expect(runPauseOutcomeLog).toBe(runOutcomeLogDirect);
  });
});
