import { describe, expect, it } from 'vitest';

import { buildFeelTilesMoodLogOptions } from './pause-feel-tiles-mood-flow';

describe('pause-feel-tiles-mood-flow', () => {
  it('re-exports feel tile log options builder from domain', () => {
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
  });
});
