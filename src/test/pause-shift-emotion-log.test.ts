import { describe, expect, it } from 'vitest';
import { buildShiftEmotionFrameHubLogBundle } from '@/features/pause/public';

describe('buildShiftEmotionFrameHubLogBundle', () => {
  it('keeps payload and logKey in sync', () => {
    const { payload, logKey } = buildShiftEmotionFrameHubLogBundle();
    expect(payload).toEqual({ from_frame_hub: true });
    expect(logKey).toBe(JSON.stringify(payload));
  });
});
