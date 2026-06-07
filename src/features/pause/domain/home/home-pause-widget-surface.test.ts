import { describe, expect, it } from 'vitest';
import { buildSilentReflectionStubMessage } from '@/features/pause/domain/reflect/generation/build-silent-reflection-stub-message';
import { isSilentReflectionStubMessage } from '@/features/pause/domain/home/is-silent-reflection-stub-message';
import { hasReachedReflectForHome } from '@/features/pause/domain/home/has-reached-reflect-for-home';
import { buildHomePauseOpeningPreviewKey } from '@/features/pause/domain/home/build-home-pause-opening-preview-key';
import {
  homePauseWidgetSurfaceIsCollapsed,
  homePauseWidgetSectionTitleKey,
  resolveHomePauseWidgetSurface,
} from '@/features/pause/domain/home/home-pause-widget-surface';

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
  hasOpenPause: false,
  openPauseState: null as 'active' | 'engaged' | null,
  hasReflectionStep: false,
  reflectionMessage: null as string | null,
  trackedAssetSymbol: 'BTC',
  hasPendingOffer: false,
  manualCooldownRemainingMs: 0,
  completedPauseCount: 0,
  hasOpenPauseStepEvents: false,
  userExpanded: false,
};

describe('resolveHomePauseWidgetSurface', () => {
  it('idle collapsed when no open pause (including after context_lost)', () => {
    const r = resolveHomePauseWidgetSurface(baseInput);
    expect(r.surface).toBe('idle_collapsed');
    expect(homePauseWidgetSurfaceIsCollapsed(r.surface)).toBe(true);
  });

  it('idle expanded when user expanded', () => {
    const r = resolveHomePauseWidgetSurface({ ...baseInput, userExpanded: true });
    expect(r.surface).toBe('idle_expanded');
  });

  it('open_pre_reflect for active open pause (pre-Reflect mid-ritual)', () => {
    const r = resolveHomePauseWidgetSurface({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'active',
    });
    expect(r.surface).toBe('open_pre_reflect');
    expect(r.hasReachedReflect).toBe(false);
  });

  it('open_engaged when Postgres engaged (deep + reflection_step)', () => {
    const r = resolveHomePauseWidgetSurface({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'engaged',
      hasReflectionStep: true,
      reflectionMessage: 'You can pause here.',
    });
    expect(r.surface).toBe('open_engaged');
    expect(r.hasReachedReflect).toBe(true);
  });

  it('stays open_pre_reflect when active and pending but ritual not started', () => {
    const r = resolveHomePauseWidgetSurface({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'active',
      hasPendingOffer: true,
      hasOpenPauseStepEvents: false,
    });
    expect(r.surface).toBe('open_pre_reflect');
  });

  it('stays open_pre_reflect when active mid-ritual and pending queued', () => {
    const r = resolveHomePauseWidgetSurface({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'active',
      hasPendingOffer: true,
      hasOpenPauseStepEvents: true,
    });
    expect(r.surface).toBe('open_pre_reflect');
  });

  it('open_engaged_pending_offer when engaged and pending queued', () => {
    const r = resolveHomePauseWidgetSurface({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'engaged',
      hasReflectionStep: true,
      reflectionMessage: 'Copy',
      hasPendingOffer: true,
    });
    expect(r.surface).toBe('open_engaged_pending_offer');
  });

  it('open_pre_reflect when returning user has untouched active offer', () => {
    const r = resolveHomePauseWidgetSurface({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'active',
      completedPauseCount: 2,
      hasOpenPauseStepEvents: false,
    });
    expect(r.surface).toBe('open_pre_reflect');
  });

  it('open_pre_reflect when first active pause (no completed archive)', () => {
    const r = resolveHomePauseWidgetSurface({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'active',
      completedPauseCount: 0,
    });
    expect(r.surface).toBe('open_pre_reflect');
  });

  it('stays open_pre_reflect when active mid-ritual (Continue only after Reflect)', () => {
    const r = resolveHomePauseWidgetSurface({
      ...baseInput,
      hasOpenPause: true,
      openPauseState: 'active',
      completedPauseCount: 3,
      hasOpenPauseStepEvents: true,
    });
    expect(r.surface).toBe('open_pre_reflect');
    expect(homePauseWidgetSectionTitleKey(r.surface)).toBe('home.widget.yourPause');
  });

  it('manual_cooldown_collapsed when manual cooldown with archive', () => {
    const r = resolveHomePauseWidgetSurface({
      ...baseInput,
      manualCooldownRemainingMs: 60_000,
      completedPauseCount: 3,
    });
    expect(r.surface).toBe('manual_cooldown_collapsed');
  });

  it('section title is Continue your pause for engaged surfaces', () => {
    expect(homePauseWidgetSectionTitleKey('open_engaged')).toBe('home.widget.continueYourPause');
    expect(homePauseWidgetSectionTitleKey('open_engaged_pending_offer')).toBe(
      'home.widget.continueYourPause',
    );
    expect(homePauseWidgetSectionTitleKey('open_pre_reflect')).toBe('home.widget.yourPause');
  });

  it('section title is Your pause for manual cooldown surfaces', () => {
    expect(homePauseWidgetSectionTitleKey('manual_cooldown_collapsed')).toBe('home.widget.yourPause');
    expect(homePauseWidgetSectionTitleKey('manual_cooldown_expanded')).toBe('home.widget.yourPause');
    expect(homePauseWidgetSectionTitleKey('manual_cooldown_first_pause_collapsed')).toBe(
      'home.widget.yourPause',
    );
    expect(homePauseWidgetSectionTitleKey('manual_cooldown_first_pause_expanded')).toBe(
      'home.widget.yourPause',
    );
  });

  it('manual_cooldown_first_pause when manual cooldown without archive', () => {
    const r = resolveHomePauseWidgetSurface({
      ...baseInput,
      manualCooldownRemainingMs: 60_000,
      completedPauseCount: 0,
    });
    expect(r.surface).toBe('manual_cooldown_first_pause_collapsed');
  });

  it('loading when opening pause', () => {
    const r = resolveHomePauseWidgetSurface({
      ...baseInput,
      loading: true,
    });
    expect(r.surface).toBe('loading');
  });
});
