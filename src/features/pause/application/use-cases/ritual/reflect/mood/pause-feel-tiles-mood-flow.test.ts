import { describe, expect, it } from 'vitest';

import { buildFeelTilesMoodLogOptions } from '@/features/pause/domain/reflect/mood/build-feel-tiles-mood-log-options';

import { buildFeelTilesMoodLogOptions as buildFeelTilesFromFlow } from './pause-feel-tiles-mood-flow';

describe('pause-feel-tiles-mood-flow', () => {
  it('re-exports feel tile log options builder from domain', () => {
    expect(typeof buildFeelTilesFromFlow).toBe('function');
    expect(buildFeelTilesFromFlow).toBe(buildFeelTilesMoodLogOptions);
  });
});
