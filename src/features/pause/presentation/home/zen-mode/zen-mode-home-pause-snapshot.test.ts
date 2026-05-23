import { describe, expect, it } from 'vitest';
import { DEFAULT_COMPANIONS } from '@/features/pause/domain/session-model';
import {
  ZEN_MODE_HOME_COMPANION_PREFS,
  zenModeHomePauseSnapshot,
} from './zen-mode-home-pause-snapshot';

describe('zenModeHomePauseSnapshot', () => {
  it('matches Zen Home static pause fields (no open instance)', () => {
    expect(zenModeHomePauseSnapshot()).toEqual({
      companions: DEFAULT_COMPANIONS,
      companionPrefs: ZEN_MODE_HOME_COMPANION_PREFS,
      severity: 'mild',
      lastPauseInstanceId: null,
    });
  });
});
