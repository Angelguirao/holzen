import { describe, expect, it } from 'vitest';
import {
  buildShiftEmotionFrameHubLogBundle,
  buildShiftEmotionMoodLoggedPayload,
} from './shift-emotion-log';

describe('buildShiftEmotionFrameHubLogBundle', () => {
  it('uses from_frame_hub when no shift mood', () => {
    const { payload, logKey } = buildShiftEmotionFrameHubLogBundle();
    expect(payload).toEqual({ from_frame_hub: true });
    expect(logKey).toBe(JSON.stringify(payload));
  });

  it('uses mood payload when shift mood is set', () => {
    const { payload, logKey } = buildShiftEmotionFrameHubLogBundle({
      shiftMood: 'calm',
      shiftIntensity: 3,
    });
    expect(payload).toEqual(buildShiftEmotionMoodLoggedPayload('calm', 3));
    expect(logKey).toBe(JSON.stringify(payload));
  });
});
