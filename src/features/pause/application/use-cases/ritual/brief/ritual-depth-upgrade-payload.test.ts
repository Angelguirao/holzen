import { describe, expect, it } from 'vitest';
import { ritualDepthUpgradedPayload } from './ritual-depth-upgrade-payload';

describe('ritualDepthUpgradedPayload', () => {
  it('tags brief → deep for pause_log_step', () => {
    expect(ritualDepthUpgradedPayload()).toEqual({ from: 'brief', to: 'deep' });
  });
});
