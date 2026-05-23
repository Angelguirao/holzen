import { describe, expect, it } from 'vitest';
import { mapManualPauseOpenError } from './map-manual-pause-open-error';

describe('mapManualPauseOpenError', () => {
  it('flags network fetch failures', () => {
    expect(mapManualPauseOpenError(new Error('Failed to fetch'))).toEqual({
      outcome: 'error',
      userMessage: 'Could not reach Holzen. Check your connection.',
      isNetwork: true,
    });
  });

  it('maps other errors to generic copy', () => {
    expect(mapManualPauseOpenError(new Error('rpc boom'))).toEqual({
      outcome: 'error',
      userMessage: 'Could not open a pause right now. Try again shortly.',
      isNetwork: false,
    });
  });
});
