import { describe, expect, it } from 'vitest';

import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
  isPauseSessionDepthPickerActive,
  resolvePauseDepthContextLineParams,
} from './pause-depth-picker-mood-flow';

describe('pause-depth-picker-mood-flow', () => {
  it('re-exports depth picker helpers from domain', () => {
    expect(typeof applyBriefDepthPickerRitualEntry).toBe('function');
    expect(typeof applyDeepDepthPickerRitualEntry).toBe('function');
    expect(typeof isPauseSessionDepthPickerActive).toBe('function');
    expect(typeof resolvePauseDepthContextLineParams).toBe('function');
  });
});
