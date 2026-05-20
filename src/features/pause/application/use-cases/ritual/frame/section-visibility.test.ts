import { describe, expect, it } from 'vitest';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/features/pause/domain/session-model';
import {
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
} from './section-visibility';

describe('getCompanionSectionVisibility', () => {
  it('requires pauseInstanceId for orchestrated slots', () => {
    const v = getCompanionSectionVisibility(
      { ...DEFAULT_PREFS, signal: true, zoomOut: true, history: true },
      DEFAULT_COMPANIONS,
      null,
    );
    expect(v.hasSignal).toBe(false);
    expect(v.hasZoomOut).toBe(false);
    expect(v.hasHistory).toBe(false);
    expect(v.hasGrounding).toBe(true);
  });

  it('shows haiku only when prefs and payload exist', () => {
    const withHaiku = getCompanionSectionVisibility(
      { ...DEFAULT_PREFS, haiku: true },
      { ...DEFAULT_COMPANIONS, haiku: 'line' },
      'pid',
    );
    expect(withHaiku.hasHaiku).toBe(true);

    const withoutPayload = getCompanionSectionVisibility(
      { ...DEFAULT_PREFS, haiku: true },
      { ...DEFAULT_COMPANIONS, haiku: null },
      'pid',
    );
    expect(withoutPayload.hasHaiku).toBe(false);
  });
});

describe('isCompanionSectionVisible', () => {
  it('is false when no cards qualify', () => {
    expect(
      isCompanionSectionVisible({
        hasHaiku: false,
        hasGrounding: false,
        hasSignal: false,
        hasZoomOut: false,
        hasHistory: false,
      }),
    ).toBe(false);
  });
});
