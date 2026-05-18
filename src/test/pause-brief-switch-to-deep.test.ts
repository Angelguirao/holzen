import { describe, expect, it } from 'vitest';
import {
  BRIEF_SWITCH_TO_DEEP_STEP,
  briefSwitchToDeepPauseState,
} from '@/features/pause/application/session/brief-switch-to-deep';
import { ritualDepthUpgradedPayload } from '@/features/pause/application/use-cases/ritual-depth-upgrade-payload';
import { pauseInstanceHasBriefRitualTag, type PauseStepEventRow } from '@/features/pause/domain/pause-state';

describe('briefSwitchToDeepPauseState', () => {
  it('lands on Reflect with first breath treated complete (brief breath already RPC-logged)', () => {
    const s = briefSwitchToDeepPauseState();
    expect(s.ritualEntry).toBe('deep');
    expect(s.step).toBe(BRIEF_SWITCH_TO_DEEP_STEP);
    expect(s.step).toBe('reflect');
    expect(s.breathingFirstCompleted).toBe(true);
    expect(s.breathingSecondCompleted).toBe(false);
    expect(s.frameDone).toBe(false);
    expect(s.briefIntegrateDone).toBe(false);
  });
});

describe('ritualDepthUpgradedPayload', () => {
  it('tags brief → deep for pause_log_step', () => {
    expect(ritualDepthUpgradedPayload()).toEqual({ from: 'brief', to: 'deep' });
  });
});

describe('pauseInstanceHasBriefRitualTag with upgrade', () => {
  const instanceId = '00000000-0000-4000-8000-000000000001';

  it('is false after ritual_depth_upgraded even when Feel has brief_ritual', () => {
    const events: PauseStepEventRow[] = [
      {
        pause_instance_id: instanceId,
        step_type: 'initial_emotion_logged',
        created_at: '2026-05-16T00:00:00.000Z',
        payload: { brief_ritual: true },
      },
      {
        pause_instance_id: instanceId,
        step_type: 'ritual_depth_upgraded',
        created_at: '2026-05-16T00:00:01.000Z',
        payload: { from: 'brief', to: 'deep' },
      },
    ];
    expect(pauseInstanceHasBriefRitualTag(events, instanceId)).toBe(false);
  });
});
