import { describe, it, expect } from 'vitest';
import { deriveBreathingUiCompleteFromPayloads } from '@/lib/companion-breath-completion-detect';

describe('deriveBreathingUiCompleteFromPayloads', () => {
  it('returns false when there are no breath_completed rows', () => {
    expect(deriveBreathingUiCompleteFromPayloads([])).toBe(false);
  });

  it('treats legacy empty payload as complete (single ritual breath)', () => {
    expect(deriveBreathingUiCompleteFromPayloads([{ payload: {} }])).toBe(true);
  });

  it('treats legacy skip-only payload as complete', () => {
    expect(deriveBreathingUiCompleteFromPayloads([{ payload: { skipped: true } }])).toBe(true);
  });

  it('treats brief ritual segment 1 as complete without requiring segment 2', () => {
    expect(
      deriveBreathingUiCompleteFromPayloads([
        { payload: { brief_ritual: true, breath_segment: 1 } },
      ]),
    ).toBe(true);
  });

  it('ignores brief ritual payloads that do not identify the first breath segment', () => {
    expect(
      deriveBreathingUiCompleteFromPayloads([
        { payload: { brief_ritual: true } },
        { payload: { brief_ritual: true, breath_segment: 2 } },
      ]),
    ).toBe(false);
  });

  it('is false when only segment 1 is logged', () => {
    expect(deriveBreathingUiCompleteFromPayloads([{ payload: { breath_segment: 1 } }])).toBe(false);
  });

  it('is true when segments 1 and 2 are both present (any order)', () => {
    expect(
      deriveBreathingUiCompleteFromPayloads([
        { payload: { breath_segment: 2 } },
        { payload: { breath_segment: 1, skipped: true } },
      ]),
    ).toBe(true);
  });

  it('is true for two legacy rows without breath_segment', () => {
    expect(deriveBreathingUiCompleteFromPayloads([{ payload: {} }, { payload: { skipped: true } }])).toBe(true);
  });
});
