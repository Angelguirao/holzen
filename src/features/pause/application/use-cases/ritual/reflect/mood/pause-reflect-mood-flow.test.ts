import { describe, expect, it } from 'vitest';

import {
  buildFeelTilesMoodLogOptions,
  isPauseSessionDepthPickerActive,
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from './pause-reflect-mood-flow';

describe('pause-reflect-mood-flow', () => {
  it('re-exports mood helpers from domain + run-initial-emotion-log leaf module', () => {
    expect(typeof runInitialEmotionSelect).toBe('function');
    expect(typeof runInitialEmotionSkip).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof isPauseSessionDepthPickerActive).toBe('function');
  });
});
