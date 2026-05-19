import { describe, expect, it } from 'vitest';
import { buildCompanionFeedbackVoteMetadata } from './log-companion-feedback-vote';

describe('buildCompanionFeedbackVoteMetadata', () => {
  it('maps UI companion keys to canonical cache types', () => {
    expect(
      buildCompanionFeedbackVoteMetadata({
        companionType: 'grounding',
        vote: 'up',
        pauseInstanceId: 'pause-1',
        cacheId: 'cache-9',
      }),
    ).toEqual({
      companion_type: 'grounding',
      cache_type: 'ground_nudge',
      vote: 'up',
      cache_id: 'cache-9',
      pause_instance_id: 'pause-1',
    });
  });

  it('falls back cache_type to companionType when unmapped', () => {
    const meta = buildCompanionFeedbackVoteMetadata({
      companionType: 'custom_slot',
      vote: 'down',
    });
    expect(meta.cache_type).toBe('custom_slot');
    expect(meta.pause_instance_id).toBeNull();
  });
});
