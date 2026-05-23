import { describe, expect, it } from 'vitest';

import { buildFeelTilesMoodLogOptions } from '@/features/pause/domain/feel/build-feel-tiles-mood-log-options';

import { buildFeelTilesMoodLogOptions as buildFeelTilesFromFlow } from './pause-feel-tiles-flow';

describe('pause-feel-tiles-flow', () => {
  it('re-exports feel tile log options builder from domain', () => {
    expect(typeof buildFeelTilesFromFlow).toBe('function');
    expect(buildFeelTilesFromFlow).toBe(buildFeelTilesMoodLogOptions);
  });
});
