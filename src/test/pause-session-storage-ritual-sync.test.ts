import { describe, expect, it } from 'vitest';
import { computePauseStorageRitualSyncPatch } from '@/features/pause/application/session/storage-ritual-sync';
import type { PersistedSession } from '@/lib/pause-session-storage';

const baseSaved = (over: Partial<PersistedSession> = {}): PersistedSession => ({
  message: 'm',
  context: null,
  pauseInstanceId: 'pi-1',
  companions: { haiku: null, groundingTitle: null, groundingBody: null },
  companionPrefs: { breathing: true, haiku: true, grounding: true, signal: true, zoomOut: true, history: true },
  severity: 'mild',
  moodDone: false,
  moodAfterDone: false,
  phase: 'session',
  decision: null,
  step: 'feel',
  ...over,
});

describe('computePauseStorageRitualSyncPatch', () => {
  it('returns null when pauseInstanceId is missing', () => {
    expect(computePauseStorageRitualSyncPatch(null, baseSaved())).toBeNull();
  });

  it('returns null when saved row belongs to another instance', () => {
    expect(
      computePauseStorageRitualSyncPatch('pi-want', baseSaved({ pauseInstanceId: 'pi-other' })),
    ).toBeNull();
  });

  it('applies when saved has no pauseInstanceId (compatible)', () => {
    const saved = baseSaved({ pauseInstanceId: null });
    const patch = computePauseStorageRitualSyncPatch('pi-want', saved);
    expect(patch).not.toBeNull();
    expect(patch!.briefStep).toBe('feel');
  });

  it('sets briefStep from storage when brief ritual with step', () => {
    const patch = computePauseStorageRitualSyncPatch(
      'pi-1',
      baseSaved({ ritualDepth: 'brief', briefStep: 'integrate' }),
    );
    expect(patch!.briefStep).toBe('integrate');
    expect(patch!.ritualEntry).toBe('brief');
  });

  it('does not set briefStep when brief but briefStep missing', () => {
    const patch = computePauseStorageRitualSyncPatch(
      'pi-1',
      baseSaved({ ritualDepth: 'brief', briefStep: undefined }),
    );
    expect(patch!.briefStep).toBeUndefined();
  });

  it('sets briefStep to feel when not brief depth', () => {
    const patch = computePauseStorageRitualSyncPatch(
      'pi-1',
      baseSaved({ ritualDepth: 'deep', briefStep: 'breath' }),
    );
    expect(patch!.briefStep).toBe('feel');
  });

  it('carries brief integrate + face from storage', () => {
    const patch = computePauseStorageRitualSyncPatch(
      'pi-1',
      baseSaved({
        ritualDepth: 'brief',
        briefStep: 'feel',
        briefIntegrateDone: true,
        briefFace: 'calm',
      }),
    );
    expect(patch!.briefIntegrateDone).toBe(true);
    expect(patch!.selectedBriefFace).toBe('calm');
  });
});
