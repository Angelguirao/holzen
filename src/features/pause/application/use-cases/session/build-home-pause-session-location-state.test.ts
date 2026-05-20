import { describe, expect, it } from 'vitest';
import { buildHomePauseSessionLocationState } from './build-home-pause-session-location-state';

describe('buildHomePauseSessionLocationState', () => {
  it('maps Home snapshot into pause session location state', () => {
    expect(
      buildHomePauseSessionLocationState({
        message: ' Breathe ',
        context: 'btc_move',
        pauseInstanceId: 'inst-1',
        companions: { haiku: 'line' },
        companionPrefs: {
          breathing: true,
          haiku: true,
          grounding: false,
          signal: false,
          zoomOut: false,
          history: false,
        },
        severity: 'moderate',
      }),
    ).toEqual({
      reflectionMessage: ' Breathe ',
      context: 'btc_move',
      pauseInstanceId: 'inst-1',
      companions: { haiku: 'line' },
      companionPrefs: {
        breathing: true,
        haiku: true,
        grounding: false,
        signal: false,
        zoomOut: false,
        history: false,
      },
      severity: 'moderate',
    });
  });

  it('coerces null message to empty reflectionMessage', () => {
    expect(
      buildHomePauseSessionLocationState({
        message: null,
        context: null,
        pauseInstanceId: undefined,
        companions: {},
        companionPrefs: {
          breathing: false,
          haiku: false,
          grounding: false,
          signal: false,
          zoomOut: false,
          history: false,
        },
        severity: 'mild',
      }).reflectionMessage,
    ).toBe('');
  });
});
