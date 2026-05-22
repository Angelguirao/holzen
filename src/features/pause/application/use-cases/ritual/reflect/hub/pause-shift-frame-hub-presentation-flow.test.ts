import { describe, expect, it } from 'vitest';

import { resolveShiftFrameHubDonePresentation } from './pause-shift-frame-hub-presentation-flow';

describe('pause-shift-frame-hub-presentation-flow', () => {
  it('re-exports shift-frame done presentation from domain shift-frame-hub-done-presentation', () => {
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
  });
});
