import { describe, expect, it } from 'vitest';

import { resolveShiftFrameHubDonePresentation } from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';

import { resolveShiftFrameHubDonePresentation as resolvePresentationFromFlow } from './pause-shift-frame-hub-presentation-flow';

describe('pause-shift-frame-hub-presentation-flow', () => {
  it('re-exports shift-frame done presentation from domain shift-frame-hub-done-presentation', () => {
    expect(typeof resolvePresentationFromFlow).toBe('function');
    expect(resolvePresentationFromFlow).toBe(resolveShiftFrameHubDonePresentation);
  });
});
