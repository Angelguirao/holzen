import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { CompanionData, CompanionPrefs } from '@/screens/pause/components/CompanionSection';
import type { BtcMoveSeverity } from '@/features/market/public';
import { holzenLog } from '@/lib/holzen-console';
import { canNavigateToPauseSession } from '@/screens/home/lib/home-pause-navigate';
import { trackEvent } from '@/lib/posthog';
import type { ManualPauseTriggerResult } from '@/features/pause/public';
import { type PauseSessionLocationState } from '@/features/pause/public';

export type PauseDismissAnalyticsSurface = 'home_zen_reflection' | 'home_your_pause_widget';

export function useHomePauseActions(args: {
  message: string | null;
  context: string | null;
  lastPauseInstanceId: string | null;
  /** Current open pause row state from `v_pause_current` (for analytics on pending-banner CTA). */
  openPauseState: 'active' | 'engaged' | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: BtcMoveSeverity;
  navigate: NavigateFunction;
  dismissMessage: () => void;
  manualTrigger: (mood?: string) => Promise<ManualPauseTriggerResult>;
  manualCooldownRemaining: () => number;
  startCheckout: (target?: 'pro' | 'pro_plus' | 'flex_pack_s' | 'flex_pack_m') => Promise<void>;
  /** PostHog `pause_open_dismissed.surface` — Zen reflection Done vs dashboard Your pause widget. */
  dismissAnalyticsSurface: PauseDismissAnalyticsSurface;
}) {
  const {
    message,
    context,
    lastPauseInstanceId,
    openPauseState,
    companions,
    companionPrefs,
    severity,
    navigate,
    dismissMessage,
    manualTrigger,
    manualCooldownRemaining,
    startCheckout,
    dismissAnalyticsSurface,
  } = args;

  const handleNeedAPause = useCallback(async () => {
    const remaining = manualCooldownRemaining();
    if (remaining > 0) {
      holzenLog.home('Need a moment: ignored (cooldown)', { remainingMs: remaining });
      return;
    }
    holzenLog.home('Need a moment: invoking manualTrigger');
    const result = await manualTrigger();
    if (!result.opened || result.pendingOffer || !result.instanceId) return;
    const navState: PauseSessionLocationState = {
      reflectionMessage: message ?? '',
      context: result.context ?? context,
      pauseInstanceId: result.instanceId,
      companions,
      companionPrefs,
      severity,
    };
    holzenLog.home('Navigate to /pause after Need a moment', {
      pauseInstanceId: result.instanceId,
    });
    navigate('/pause', { state: navState });
  }, [
    manualCooldownRemaining,
    manualTrigger,
    message,
    context,
    companions,
    companionPrefs,
    severity,
    navigate,
  ]);

  const handleDismiss = useCallback(() => {
    try {
      trackEvent('pause_open_dismissed', {
        surface: dismissAnalyticsSurface,
        pause_instance_id: lastPauseInstanceId ?? undefined,
      });
    } catch {
      /* no-op */
    }
    void dismissMessage();
  }, [dismissMessage, dismissAnalyticsSurface, lastPauseInstanceId]);

  const handleNavigatePauseWithThis = useCallback(() => {
    if (!canNavigateToPauseSession(message, lastPauseInstanceId)) return;
    const navState: PauseSessionLocationState = {
      reflectionMessage: message ?? '',
      context,
      pauseInstanceId: lastPauseInstanceId ?? undefined,
      companions,
      companionPrefs,
      severity,
    };
    holzenLog.home('Navigate to /pause (pause with this message)', {
      pauseInstanceId: lastPauseInstanceId,
      severity,
      messageLen: message?.length ?? 0,
      hasContext: !!context,
      companionKeys: companions
        ? Object.entries(companions)
            .filter(([, v]) => v != null)
            .map(([k]) => k)
        : [],
    });
    navigate('/pause', { state: navState });
  }, [message, context, lastPauseInstanceId, companions, companionPrefs, severity, navigate]);

  const handleNavigatePauseWithThisFromPendingBanner = useCallback(() => {
    if (!canNavigateToPauseSession(message, lastPauseInstanceId)) return;
    try {
      trackEvent('home.pending_pause_banner_pause_opened', {
        pause_instance_id: lastPauseInstanceId ?? undefined,
        open_pause_state: openPauseState ?? undefined,
      });
    } catch {
      /* no-op */
    }
    handleNavigatePauseWithThis();
  }, [message, lastPauseInstanceId, openPauseState, handleNavigatePauseWithThis]);

  const startProCheckout = useCallback(() => {
    startCheckout('pro');
  }, [startCheckout]);

  return {
    handleNeedAPause,
    handleDismiss,
    handleNavigatePauseWithThis,
    handleNavigatePauseWithThisFromPendingBanner,
    startProCheckout,
  };
}
