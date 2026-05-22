import { describe, expect, it } from 'vitest';

import {
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from '@/features/pause/domain/reflect/mood/apply-depth-picker-ritual-entry';
import { isPauseSessionDepthPickerActive } from '@/features/pause/domain/reflect/mood/pause-depth-picker-active';
import { resolvePauseDepthContextLineParams } from '@/features/pause/domain/reflect/mood/resolve-pause-depth-context-line-params';

import {
  applyBriefDepthPickerRitualEntry as applyBriefFromFlow,
  applyDeepDepthPickerRitualEntry as applyDeepFromFlow,
  isPauseSessionDepthPickerActive as isDepthPickerActiveFromFlow,
  resolvePauseDepthContextLineParams as resolveDepthContextFromFlow,
} from './pause-depth-picker-mood-flow';

describe('pause-depth-picker-mood-flow', () => {
  it('re-exports depth picker helpers from domain', () => {
    expect(typeof applyBriefFromFlow).toBe('function');
    expect(typeof applyDeepFromFlow).toBe('function');
    expect(typeof isDepthPickerActiveFromFlow).toBe('function');
    expect(typeof resolveDepthContextFromFlow).toBe('function');

    expect(applyBriefFromFlow).toBe(applyBriefDepthPickerRitualEntry);
    expect(applyDeepFromFlow).toBe(applyDeepDepthPickerRitualEntry);
    expect(isDepthPickerActiveFromFlow).toBe(isPauseSessionDepthPickerActive);
    expect(resolveDepthContextFromFlow).toBe(resolvePauseDepthContextLineParams);
  });
});
