import { describe, expect, it } from 'vitest';

import { logRetrospectiveOutcome as logRpcDirect } from './log-retrospective-outcome';
import { trackPauseOutcomeRetrospective as trackTelemetryDirect } from './pause-outcome-retrospective-telemetry';
import {
  logRetrospectiveOutcome,
  trackPauseOutcomeRetrospective,
} from './pause-archive-decide-flow';

describe('pause-archive-decide-flow', () => {
  it('re-exports archive decide RPC and telemetry leaves from ritual/decide subcluster anchors', () => {
    expect(typeof logRetrospectiveOutcome).toBe('function');
    expect(typeof trackPauseOutcomeRetrospective).toBe('function');
    expect(logRetrospectiveOutcome).toBe(logRpcDirect);
    expect(trackPauseOutcomeRetrospective).toBe(trackTelemetryDirect);
  });
});
