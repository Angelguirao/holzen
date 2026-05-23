import { describe, expect, it, vi } from 'vitest';
import { buildHomePauseCardBodyProps } from './home-pause-card-body-props';

describe('buildHomePauseCardBodyProps', () => {
  it('maps conductor callbacks to HomePauseCardBody prop names', () => {
    const onNavigate = vi.fn();
    const onBanner = vi.fn();
    const onDismiss = vi.fn();
    const onNeed = vi.fn();
    const manualTrigger = vi.fn();

    const props = buildHomePauseCardBodyProps({
      subLoading: false,
      hasAccess: true,
      entitlement: 'active',
      checkoutLoading: false,
      trialLoading: false,
      hasOpenPause: true,
      openPauseState: 'active',
      pauseContextHomePreview: { btc24h: 'BTC up', marketSentiment: null },
      loading: false,
      error: null,
      btcData: null,
      showPauseScheduling: true,
      autoCooldownRemaining: () => 0,
      cooldownHours: 4,
      nextCronCheckIn: () => 1000,
      manualCooldownRemaining: () => 0,
      manualTrigger,
      onNavigatePauseWithThis: onNavigate,
      onNavigatePauseFromPendingBanner: onBanner,
      onDismissOpenPause: onDismiss,
      onNeedPause: onNeed,
      onStartCheckoutPro: vi.fn(),
      onStartTrial: vi.fn(),
      onReactivate: vi.fn(),
    });

    expect(props.onPauseWithThis).toBe(onNavigate);
    expect(props.onPauseWithThisFromPendingBanner).toBe(onBanner);
    expect(props.onDismissOpenPause).toBe(onDismiss);
    expect(props.onNeedPause).toBe(onNeed);
    expect(props.onReflectionRetry).toBe(manualTrigger);
    expect(props.contextPreview).toEqual({ btc24h: 'BTC up', marketSentiment: null });
  });
});
