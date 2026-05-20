import { describe, it, expect } from 'vitest';
import {
  DEFAULT_COMPANIONS,
  DEFAULT_PREFS,
  type FetchedPauseInstance,
  type PersistedSession,
} from '@/features/pause/domain/session-model';
import {
  computePauseSessionHydration,
  computePauseSessionResolved,
} from '@/features/pause/public';

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
  it('restores session with instance id before reflection text exists', () => {
    const out = computePauseSessionHydration({
      restored: session({ message: '', pauseInstanceId: 'pre-reflect', step: 'reflect' }),
      ...navEmpty,
      ...holzenBase,
    });
    expect(out).toMatchObject({
      status: 'ready',
      message: '',
      pauseInstanceId: 'pre-reflect',
    });
  });

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

  it('fetch when holzen is aligned with open pause id but no reflection text yet', () => {
    const out = computePauseSessionHydration({
      restored: null,
      ...navEmpty,
      ...holzenBase,
      holzenMessage: null,
      holzenLastPauseInstanceId: 'open-1',
      holzenAligned: true,
    });
    expect(out).toEqual({ status: 'fetch', pauseInstanceId: 'open-1' });
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

const prefsB = {
  ...DEFAULT_PREFS,
  signal: false,
};

describe('computePauseSessionResolved', () => {
  const ready = computePauseSessionHydration({
    restored: null,
    navPauseInstanceId: null,
    navReflectionMessage: 'x',
    navContext: null,
    navCompanions: undefined,
    navCompanionPrefs: undefined,
    navSeverity: 'high',
    ...holzenBase,
    holzenMessage: 'x',
    holzenAligned: true,
  });
  if (ready.status !== 'ready') throw new Error('fixture');

  it('passes through ready hydration', () => {
    expect(
      computePauseSessionResolved({
        hydration: ready,
        fetchedInstance: null,
        navCompanionPrefs: undefined,
        holzenCompanionPrefs: DEFAULT_PREFS,
        navSeverity: undefined,
        holzenSeverity: 'mild',
      }),
    ).toBe(ready);
  });

  it('returns null for fetch without reflection text', () => {
    expect(
      computePauseSessionResolved({
        hydration: { status: 'fetch', pauseInstanceId: 'p' },
        fetchedInstance: null,
        navCompanionPrefs: undefined,
        holzenCompanionPrefs: DEFAULT_PREFS,
        navSeverity: undefined,
        holzenSeverity: 'mild',
      }),
    ).toBeNull();
  });

  it('returns ready when fetch instance has empty reflection_message (reflect step not run yet)', () => {
    const inst: FetchedPauseInstance = {
      id: 'p',
      reflection_message: '',
      context: 'BTC moved',
      haiku: null,
      grounding_title: null,
      grounding_body: null,
    };
    expect(
      computePauseSessionResolved({
        hydration: { status: 'fetch', pauseInstanceId: 'p' },
        fetchedInstance: inst,
        navCompanionPrefs: prefsB,
        holzenCompanionPrefs: DEFAULT_PREFS,
        navSeverity: 'moderate',
        holzenSeverity: 'mild',
      }),
    ).toEqual({
      status: 'ready',
      message: '',
      context: 'BTC moved',
      pauseInstanceId: 'p',
      companions: { haiku: null, groundingTitle: null, groundingBody: null },
      companionPrefs: prefsB,
      severity: 'moderate',
    });
  });

  it('returns null for empty hydration', () => {
    expect(
      computePauseSessionResolved({
        hydration: { status: 'empty' },
        fetchedInstance: null,
        navCompanionPrefs: undefined,
        holzenCompanionPrefs: DEFAULT_PREFS,
        navSeverity: undefined,
        holzenSeverity: 'mild',
      }),
    ).toBeNull();
  });

  it('builds ready from fetch + fetched instance', () => {
    const inst: FetchedPauseInstance = {
      id: 'p2',
      reflection_message: 'hello',
      context: 'ctx',
      haiku: 'h',
      grounding_title: 't',
      grounding_body: 'b',
    };
    const out = computePauseSessionResolved({
      hydration: { status: 'fetch', pauseInstanceId: 'p2' },
      fetchedInstance: inst,
      navCompanionPrefs: prefsB,
      holzenCompanionPrefs: DEFAULT_PREFS,
      navSeverity: 'moderate',
      holzenSeverity: 'mild',
    });
    expect(out).toEqual({
      status: 'ready',
      message: 'hello',
      context: 'ctx',
      pauseInstanceId: 'p2',
      companions: {
        haiku: 'h',
        groundingTitle: 't',
        groundingBody: 'b',
      },
      companionPrefs: prefsB,
      severity: 'moderate',
    });
  });
});
