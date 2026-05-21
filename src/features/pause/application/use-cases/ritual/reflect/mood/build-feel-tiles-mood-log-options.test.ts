import { describe, expect, it } from 'vitest';
import { buildFeelTilesMoodLogOptions } from './build-feel-tiles-mood-log-options';

describe('buildFeelTilesMoodLogOptions', () => {
  it('adds briefRitual when brief ritual is active', () => {
    expect(buildFeelTilesMoodLogOptions(true, 'calm')).toEqual({
      briefRitual: true,
      briefFace: 'calm',
    });
    expect(buildFeelTilesMoodLogOptions(false, 'anxious')).toEqual({ briefFace: 'anxious' });
  });
});
