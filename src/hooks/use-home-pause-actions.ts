import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { CompanionData, CompanionPrefs } from '@/components/CompanionSection';
import type { BtcMoveSeverity } from '@/lib/btc-move-severity';
import { holzenLog } from '@/lib/holzen-console';
import { trackEvent } from '@/lib/posthog';
import { type PauseSessionLocationState } from '@/lib/router-location-state';

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
  manualTrigger: () => void;
  manualCooldownRemaining: () => number;
  startCheckout: (target?: 'pro' | 'pro_plus' | 'flex_pack_s' | 'flex_pack_m') => Promise<void>;
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
  } = args;

  const handleNeedAPause = useCallback(() => {
    const remaining = manualCooldownRemaining();
    if (remaining > 0) {
      holzenLog.home('Need a moment: ignored (cooldown)', { remainingMs: remaining });
      return;
    }
    holzenLog.home('Need a moment: invoking manualTrigger');
    manualTrigger();
  }, [manualCooldownRemaining, manualTrigger]);

  const handleDismiss = useCallback(() => {
    dismissMessage();
  }, [dismissMessage]);

  const handleNavigatePauseWithThis = useCallback(() => {
    if (!message && !lastPauseInstanceId) return;
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
      messageLen: message.length,
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
    if (!message && !lastPauseInstanceId) return;
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
