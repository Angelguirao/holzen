import { describe, expect, it } from 'vitest';

import { trackPauseOutcomeRetrospective as trackPauseOutcomeRetrospectiveDirect } from './pause-outcome-retrospective-telemetry';

import { trackPauseOutcomeRetrospective } from './pause-archive-decide-telemetry-flow';

describe('pause-archive-decide-telemetry-flow', () => {
  it('re-exports archive retrospective PostHog tracker from pause-outcome-retrospective-telemetry', () => {
    expect(typeof trackPauseOutcomeRetrospective).toBe('function');
    expect(trackPauseOutcomeRetrospective).toBe(trackPauseOutcomeRetrospectiveDirect);
  });
});
