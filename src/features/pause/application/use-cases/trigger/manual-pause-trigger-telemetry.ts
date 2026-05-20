import { trackEvent } from '@/lib/posthog';

const PAUSE_MANUAL_START_HOME = 'holzen_sess_pause_manual_started_home';

export type PauseManualStartedSurface = 'home';

/** PostHog: user starts a manual home pause (taxonomy: pause.manual_started). */
export function trackPauseManualStarted(surface: PauseManualStartedSurface): void {
  try {
    trackEvent('pause.manual_started', { surface });
  } catch {
    /* no-op */
  }
}

/** Once per tab session before opening a manual pause from Home. */
export function markPauseManualStartedHomeOnce(): void {
  try {
    if (sessionStorage.getItem(PAUSE_MANUAL_START_HOME)) return;
    sessionStorage.setItem(PAUSE_MANUAL_START_HOME, '1');
    trackPauseManualStarted('home');
  } catch {
    /* sessionStorage unavailable */
  }
}

export type TrackManualPauseInstanceCreatedPayload = {
  pauseInstanceId: string;
  severity: string;
  pendingOffer: boolean;
};

/** New pause_instances row from manual home open (taxonomy: pause_instance_created). */
export function trackManualPauseInstanceCreated(payload: TrackManualPauseInstanceCreatedPayload): void {
  try {
    trackEvent('pause_instance_created', {
      pause_instance_id: payload.pauseInstanceId,
      template_slug: 'volatility_v1',
      source: 'manual',
      severity: payload.severity,
      pending_offer: payload.pendingOffer,
    });
  } catch {
    /* no-op */
  }
}

export type TrackPauseManualCompletedPayload = {
  durationS: number;
  hadBitcoinContext: boolean;
  trackedAssetId: string;
};

/** Manual home path finished opening the pause (taxonomy: pause.manual_completed). */
export function trackPauseManualCompleted(payload: TrackPauseManualCompletedPayload): void {
  try {
    trackEvent('pause.manual_completed', {
      duration_s: payload.durationS,
      had_bitcoin_context: payload.hadBitcoinContext,
      tracked_asset_id: payload.trackedAssetId,
      companion_types: [],
    });
  } catch {
    /* no-op */
  }
}
