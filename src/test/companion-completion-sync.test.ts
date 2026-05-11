import { beforeEach, describe, it, expect, vi } from 'vitest';
import { deriveBreathingUiCompleteFromPayloads } from '@/lib/companion-breath-completion-detect';
import {
  loadCompanionUiCompletionState,
  persistCompanionUiStepCompletion,
} from '@/lib/companion-completion-sync';

const { fromMock, pauseLogStepMock, pauseLogCompanionMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  pauseLogStepMock: vi.fn(),
  pauseLogCompanionMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
  },
}));

vi.mock('@/lib/pause-api', () => ({
  pauseLogStep: pauseLogStepMock,
  pauseLogCompanion: pauseLogCompanionMock,
}));

function makeSupabaseBuilder<T>(data: T[]) {
  const builder = {
    data,
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
  };
  return builder;
}

describe('deriveBreathingUiCompleteFromPayloads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false when there are no breath_completed rows', () => {
    expect(deriveBreathingUiCompleteFromPayloads([])).toBe(false);
  });

  it('treats legacy empty payload as complete (single ritual breath)', () => {
    expect(deriveBreathingUiCompleteFromPayloads([{ payload: {} }])).toBe(true);
  });

  it('treats legacy skip-only payload as complete', () => {
    expect(deriveBreathingUiCompleteFromPayloads([{ payload: { skipped: true } }])).toBe(true);
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

  it('treats brief ritual segment 1 as complete without requiring segment 2', () => {
    expect(
      deriveBreathingUiCompleteFromPayloads([
        { payload: { brief_ritual: true, breath_segment: 1 } },
      ]),
    ).toBe(true);
  });

  it('does not complete brief ritual breathing from segment 2 alone', () => {
    expect(
      deriveBreathingUiCompleteFromPayloads([
        { payload: { brief_ritual: true, breath_segment: 2 } },
      ]),
    ).toBe(false);
  });
});

describe('loadCompanionUiCompletionState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates breath and companion completion from V2 event rows', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'pause_step_events') {
        return makeSupabaseBuilder([
          { payload: { brief_ritual: true, breath_segment: 1 } },
        ]);
      }
      if (table === 'pause_companion_events') {
        return makeSupabaseBuilder([
          { companion_type: 'haiku', counts_for_pause: true },
          { companion_type: 'ground_nudge', counts_for_pause: true },
          { companion_type: 'zoom_out_deep_time', counts_for_pause: true },
          { companion_type: 'historical_insight', counts_for_pause: true },
        ]);
      }
      throw new Error(`Unexpected table ${table}`);
    });

    await expect(loadCompanionUiCompletionState('pause-1')).resolves.toEqual({
      breathing: true,
      haiku: true,
      grounding: true,
      signal: false,
      zoomOut: true,
      history: true,
    });
  });
});

describe('persistCompanionUiStepCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pauseLogStepMock.mockResolvedValue(undefined);
    pauseLogCompanionMock.mockResolvedValue(undefined);
  });

  it('persists breathing as a pause step event', async () => {
    await persistCompanionUiStepCompletion('pause-1', 'breathing');

    expect(pauseLogStepMock).toHaveBeenCalledWith({
      instanceId: 'pause-1',
      stepType: 'breath_completed',
    });
    expect(pauseLogCompanionMock).not.toHaveBeenCalled();
  });

  it('persists companion UI completion with the expected companion type and entry point', async () => {
    await persistCompanionUiStepCompletion('pause-1', 'zoomOut', {
      entryPoint: 'archive_card',
    });

    expect(pauseLogCompanionMock).toHaveBeenCalledWith({
      instanceId: 'pause-1',
      companionType: 'zoom_out',
      action: 'complete',
      entryPoint: 'archive_card',
    });
    expect(pauseLogStepMock).not.toHaveBeenCalled();
  });
});
