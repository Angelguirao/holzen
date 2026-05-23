import { describe, expect, it } from 'vitest';
import { mapManualTriggerStartError } from './map-manual-trigger-start-error';

describe('mapManualTriggerStartError', () => {
  it('maps fetch failures to connectivity copy', () => {
    expect(mapManualTriggerStartError(new Error('Failed to fetch'))).toBe(
      'Could not connect. Check your internet and try again.',
    );
  });

  it('maps other errors to generic copy', () => {
    expect(mapManualTriggerStartError(new Error('boom'))).toBe(
      'Could not start a pause right now. Try again in a moment.',
    );
  });
});
