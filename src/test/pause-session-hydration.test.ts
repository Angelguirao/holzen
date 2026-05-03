import { describe, it, expect } from 'vitest';
import { computePauseSessionHydration } from '@/lib/pause-session-hydration';
import type { PersistedSession } from '@/lib/pause-session-storage';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/lib/pause-session-storage';

const holzenBase = {
  holzenMessage: null as string | null,
  holzenContext: null as string | null,
  holzenLastPauseInstanceId: null as string | null,
  holzenCompanions: DEFAULT_COMPANIONS,
  holzenCompanionPrefs: DEFAULT_PREFS,
  holzenSeverity: 'mild' as const,
  holzenAligned: true,
};

const navEmpty = {
  navPauseInstanceId: null as string | null,
  navReflectionMessage: '',
  navContext: null as string | null,
  navCompanions: undefined,
  navCompanionPrefs: undefined,
  navSeverity: undefined,
};

function session(overrides: Partial<PersistedSession> = {}): PersistedSession {
  return {
    message: 'saved',
    context: 'c1',
    pauseInstanceId: 's1',
    companions: DEFAULT_COMPANIONS,
    companionPrefs: DEFAULT_PREFS,
    severity: 'high',
    moodDone: false,
    moodAfterDone: false,
    phase: 'session',
    decision: null,
    step: 'feel',
    ...overrides,
  };
}

describe('computePauseSessionHydration', () => {
  it('prefers restored session when present', () => {
    const out = computePauseSessionHydration({
      restored: session({ message: 'from disk' }),
      ...navEmpty,
      ...holzenBase,
      holzenMessage: 'from holzen',
    });
    expect(out).toEqual({
      status: 'ready',
      message: 'from disk',
      context: 'c1',
      pauseInstanceId: 's1',
      companions: DEFAULT_COMPANIONS,
      companionPrefs: DEFAULT_PREFS,
      severity: 'high',
    });
  });

  it('uses holzen when aligned and no restore', () => {
    const out = computePauseSessionHydration({
      restored: null,
      ...navEmpty,
      ...holzenBase,
      holzenMessage: 'm',
      holzenContext: 'ctx',
      holzenLastPauseInstanceId: 'h1',
      holzenAligned: true,
    });
    expect(out.status).toBe('ready');
    if (out.status === 'ready') {
      expect(out.message).toBe('m');
      expect(out.pauseInstanceId).toBe('h1');
    }
  });

  it('uses nav reflection after restore and aligned-holzen branches miss', () => {
    const out = computePauseSessionHydration({
      restored: null,
      navPauseInstanceId: 'n1',
      navReflectionMessage: 'nav msg',
      navContext: 'nc',
      navCompanions: undefined,
      navCompanionPrefs: undefined,
      navSeverity: 'moderate',
      ...holzenBase,
      holzenMessage: 'ignored until later',
      holzenAligned: false,
    });
    expect(out.status).toBe('ready');
    if (out.status === 'ready') {
      expect(out.message).toBe('nav msg');
      expect(out.context).toBe('nc');
      expect(out.pauseInstanceId).toBe('n1');
      expect(out.severity).toBe('moderate');
    }
  });

  it('fetch when only nav id and no reflection text', () => {
    const out = computePauseSessionHydration({
      restored: null,
      navPauseInstanceId: 'n2',
      navReflectionMessage: '',
      navContext: null,
      navCompanions: undefined,
      navCompanionPrefs: undefined,
      navSeverity: undefined,
      ...holzenBase,
    });
    expect(out).toEqual({ status: 'fetch', pauseInstanceId: 'n2' });
  });

  it('falls back to holzen message without alignment when nav id absent', () => {
    const out = computePauseSessionHydration({
      restored: null,
      ...navEmpty,
      ...holzenBase,
      holzenMessage: 'orphan',
      holzenContext: null,
      holzenLastPauseInstanceId: 'z9',
      holzenAligned: false,
    });
    expect(out.status).toBe('ready');
    if (out.status === 'ready') {
      expect(out.message).toBe('orphan');
      expect(out.pauseInstanceId).toBe('z9');
    }
  });

  it('returns empty when nothing matches', () => {
    expect(
      computePauseSessionHydration({
        restored: null,
        ...navEmpty,
        ...holzenBase,
      }),
    ).toEqual({ status: 'empty' });
  });
});
