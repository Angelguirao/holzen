import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_COMPANIONS } from '@/features/pause/domain/session-model';
import { ZEN_MODE_HOME_COMPANION_PREFS } from './zen-mode-home-pause-snapshot';
import { buildZenModeHomeRouteProps } from './build-zen-mode-home-route-props';

describe('buildZenModeHomeRouteProps', () => {
  it('spreads zen inputs with static pause snapshot defaults', () => {
    const onDismiss = vi.fn();
    const props = buildZenModeHomeRouteProps({
      hasOpenPause: true,
      context: 'btc_move',
      contextPreview: { btc24h: null, marketSentiment: null },
      openPauseState: 'active',
      loading: false,
      error: null,
      btcData: null,
      onDismiss,
      onNeedPause: vi.fn(),
      onManualTrigger: vi.fn(),
      onPauseWithThis: vi.fn(),
      subscriptionReady: true,
      hasAccess: true,
      showLimitUpsell: false,
      entitlement: 'active',
      showPauseScheduling: true,
      autoCooldownRemaining: () => 0,
      cooldownHours: 4,
      nextCronCheckIn: () => 1000,
      manualCooldownRemaining: () => 0,
      checkoutLoading: false,
      trialLoading: false,
      onStartTrial: vi.fn(),
      onReactivate: vi.fn(),
    });

    expect(props.onDismiss).toBe(onDismiss);
    expect(props.companions).toEqual(DEFAULT_COMPANIONS);
    expect(props.companionPrefs).toEqual(ZEN_MODE_HOME_COMPANION_PREFS);
    expect(props.severity).toBe('mild');
    expect(props.lastPauseInstanceId).toBeNull();
  });
});
