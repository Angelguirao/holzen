import { describe, expect, it } from 'vitest';
import { buildSilentReflectionStubMessage } from '@/features/pause/domain/reflect/generation/build-silent-reflection-stub-message';
import { isSilentReflectionStubMessage } from '@/features/pause/domain/home/is-silent-reflection-stub-message';
import { hasReachedReflectForHome } from '@/features/pause/domain/home/has-reached-reflect-for-home';
import { buildHomePauseOpeningPreviewKey } from '@/features/pause/domain/home/build-home-pause-opening-preview-key';
import {
  homePauseWidgetModeIsCollapsed,
  resolveHomePauseWidgetMode,
} from '@/features/pause/domain/home/home-pause-widget-mode';

describe('isSilentReflectionStubMessage', () => {
  it('matches silent stub copy', () => {
    expect(isSilentReflectionStubMessage('BTC moved.', 'BTC')).toBe(true);
    expect(isSilentReflectionStubMessage(buildSilentReflectionStubMessage('ETH'), 'ETH')).toBe(true);
  });

  it('rejects holzen-reflect copy', () => {
    expect(
      isSilentReflectionStubMessage('It is natural to feel unease when the collective mood shifts.', 'BTC'),
    ).toBe(false);
  });
});

describe('hasReachedReflectForHome', () => {
  it('returns true when reflection_step exists', () => {
    expect(
      hasReachedReflectForHome({
        hasReflectionStep: true,
        reflectionMessage: null,
        trackedAssetSymbol: 'BTC',
      }),
    ).toBe(true);
  });

  it('returns true for non-stub reflection_text', () => {
    expect(
      hasReachedReflectForHome({
        hasReflectionStep: false,
        reflectionMessage: 'Land with this moment.',
        trackedAssetSymbol: 'BTC',
      }),
    ).toBe(true);
  });

  it('returns false for silent stub only', () => {
    expect(
      hasReachedReflectForHome({
        hasReflectionStep: false,
        reflectionMessage: 'BTC moved.',
        trackedAssetSymbol: 'BTC',
      }),
    ).toBe(false);
  });

  it('returns false for engaged pre-Reflect with no artifact', () => {
    expect(
      hasReachedReflectForHome({
        hasReflectionStep: false,
        reflectionMessage: null,
        trackedAssetSymbol: 'BTC',
      }),
    ).toBe(false);
  });
});

describe('buildHomePauseOpeningPreviewKey', () => {
  it('picks fear-down template when market is down and fearful', () => {
    expect(
      buildHomePauseOpeningPreviewKey({
        direction: 'down',
        fear_greed: { label: 'Fear', value: 33 },
      }),
    ).toBe('home.pauseOpening.fearDown');
  });

  it('picks greed-up template when market is up and greedy', () => {
    expect(
      buildHomePauseOpeningPreviewKey({
        direction: 'up',
        fear_greed: { label: 'Greed', value: 72 },
      }),
    ).toBe('home.pauseOpening.greedUp');
  });
});

const baseInput = {
  loading: false,
  blockingError: false,
  showCalmWaters: false,
  hasOpenPause: false,
  openPauseState: null as 'active' | 'engaged' | null,
  hasReflectionStep: false,
  reflectionMessage: null as string | null,
  trackedAssetSymbol: 'BTC',
  hasPendingOffer: false,
  postPauseAutoCooldownRemainingMs: 0,
  completedPauseCount: 0,
  userExpanded: false,
};

describe('resolveHomePauseWidgetMode', () => {
  it('A collapsed when idle', () => {
    const r = resolveHomePauseWidgetMode(baseInput);
    expect(r.mode).toBe('A_collapsed');
    expect(homePauseWidgetModeIsCollapsed(r.mode)).toBe(true);
  });

  it('A expanded when user expanded', () => {
    const r = resolveHomePauseWidgetMode({ ...baseInput, userExpanded: true });
    expect(r.mode).toBe('A_expanded');
  });

  it('B for active open pause (pre-Reflect mid-ritual)', () => {
    const r = resolveHomePauseWidgetMode({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'active',
    });
    expect(r.mode).toBe('B');
    expect(r.hasReachedReflect).toBe(false);
  });

  it('C when Postgres engaged (deep + reflection_step)', () => {
    const r = resolveHomePauseWidgetMode({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'engaged',
      hasReflectionStep: true,
      reflectionMessage: 'You can pause here.',
    });
    expect(r.mode).toBe('C');
    expect(r.hasReachedReflect).toBe(true);
  });

  it('stays B when active and pending queued (not C_prime)', () => {
    const r = resolveHomePauseWidgetMode({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'active',
      hasPendingOffer: true,
    });
    expect(r.mode).toBe('B');
  });

  it('C_prime when engaged and pending queued', () => {
    const r = resolveHomePauseWidgetMode({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'engaged',
      hasReflectionStep: true,
      reflectionMessage: 'Copy',
      hasPendingOffer: true,
    });
    expect(r.mode).toBe('C_prime');
  });

  it('E when post-pause cooldown and new active offer', () => {
    const r = resolveHomePauseWidgetMode({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'active',
      postPauseAutoCooldownRemainingMs: 60_000,
      completedPauseCount: 2,
    });
    expect(r.mode).toBe('E');
  });

  it('D collapsed when post-pause rest with archive', () => {
    const r = resolveHomePauseWidgetMode({
      ...baseInput,
      postPauseAutoCooldownRemainingMs: 60_000,
      completedPauseCount: 3,
    });
    expect(r.mode).toBe('D_collapsed');
  });

  it('D_prime when post-pause rest without archive', () => {
    const r = resolveHomePauseWidgetMode({
      ...baseInput,
      postPauseAutoCooldownRemainingMs: 60_000,
      completedPauseCount: 0,
    });
    expect(r.mode).toBe('D_prime_collapsed');
  });

  it('calm_waters when flagged and no open pause', () => {
    const r = resolveHomePauseWidgetMode({
      ...baseInput,
      showCalmWaters: true,
    });
    expect(r.mode).toBe('calm_waters');
  });

  it('loading when opening pause', () => {
    const r = resolveHomePauseWidgetMode({
      ...baseInput,
      loading: true,
    });
    expect(r.mode).toBe('loading');
  });
});
