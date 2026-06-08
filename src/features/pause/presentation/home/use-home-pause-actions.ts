import { useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { MarketMoveSeverity } from '@/features/market/public';
import type { ManualPauseTriggerResult } from '@/features/pause/domain/manual-pause-trigger-result';
import type { ManualPauseTriggerOptions } from '@/features/pause/domain/manual-pause-trigger-options';
import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import {
  buildHomePauseSessionLocationState,
  canNavigateToPauseSession,
  shouldNavigateAfterManualTrigger,
} from '@/features/pause/public-navigation';
import {
  trackPauseOpenDismissed,
  type PauseDismissAnalyticsSurface,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io';
import { markHomePauseWidgetFirstVisitHandled } from '@/features/pause/infrastructure/home-pause-widget-first-visit-storage';
import { clearPostManualCooldownIdlePrompt } from '@/features/pause/infrastructure/home-post-manual-cooldown-idle-storage';
import { clearPausePersistedTabSession } from '@/features/pause/presentation/session/pause-persisted-tab-session-io';
import { holzenLog } from '@/lib/holzen-console';

export type { PauseDismissAnalyticsSurface };

export function useHomePauseActions(args: {
  message: string | null;
  context: string | null;
  lastPauseInstanceId: string | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: MarketMoveSeverity;
  navigate: NavigateFunction;
  dismissMessage: () => void;
  dismissOpenPauseFromWidget?: () => void;
  manualTrigger: (
    mood?: string,
    options?: ManualPauseTriggerOptions,
  ) => Promise<ManualPauseTriggerResult>;
  manualCooldownRemaining: () => number;
  startCheckout: (target?: 'pro' | 'flex_pack_s' | 'flex_pack_m') => Promise<void>;
  /** PostHog `pause_open_dismissed.surface` — Zen reflection Done vs dashboard Your pause widget. */
  dismissAnalyticsSurface: PauseDismissAnalyticsSurface;
  userId?: string;
}) {
  const {
    message,
    context,
    lastPauseInstanceId,
    companions,
    companionPrefs,
    severity,
    navigate,
    dismissMessage,
    dismissOpenPauseFromWidget,
    manualTrigger,
    manualCooldownRemaining,
    startCheckout,
    dismissAnalyticsSurface,
    userId,
  } = args;

  const handleNeedAPause = useCallback(async () => {
    const remaining = manualCooldownRemaining();
    if (remaining > 0) {
      holzenLog.home('Need a moment: ignored (cooldown)', { remainingMs: remaining });
      return;
    }

    if (userId) {
      markHomePauseWidgetFirstVisitHandled(userId);
      clearPostManualCooldownIdlePrompt(userId);
    }

    holzenLog.home('Navigate to /pause immediately (Let\'s pause from idle)');
    navigate('/pause', {
      state: buildHomePauseSessionLocationState({
        message: null,
        context,
        pauseInstanceId: undefined,
        companions,
        companionPrefs,
        severity,
        startAtDepthPicker: true,
        openingManualPause: true,
      }),
    });

    holzenLog.home('Need a moment: invoking manualTrigger (skip home preview)');
    const result = await manualTrigger(undefined, { skipHomePreview: true });
    if (!shouldNavigateAfterManualTrigger(result)) {
      holzenLog.home('Manual trigger did not open session — return home', { result });
      navigate('/', { replace: true });
      return;
    }

    navigate('/pause', {
      replace: true,
      state: buildHomePauseSessionLocationState({
        message: null,
        context: result.context ?? context,
        pauseInstanceId: result.instanceId,
        companions,
        companionPrefs,
        severity,
        startAtDepthPicker: true,
      }),
    });
  }, [
    manualCooldownRemaining,
    userId,
    manualTrigger,
    context,
    companions,
    companionPrefs,
    severity,
    navigate,
  ]);

  const handleDismiss = useCallback(() => {
    if (dismissAnalyticsSurface === 'home_your_pause_widget' && dismissOpenPauseFromWidget) {
      dismissOpenPauseFromWidget();
      return;
    }
    trackPauseOpenDismissed(dismissAnalyticsSurface, lastPauseInstanceId);
    void dismissMessage();
  }, [
    dismissOpenPauseFromWidget,
    dismissMessage,
    dismissAnalyticsSurface,
    lastPauseInstanceId,
  ]);

  const handleNavigatePauseWithThis = useCallback(() => {
    if (!canNavigateToPauseSession(message, lastPauseInstanceId)) return;
    const navState = buildHomePauseSessionLocationState({
      message,
      context,
      pauseInstanceId: lastPauseInstanceId ?? undefined,
      companions,
      companionPrefs,
      severity,
    });
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

  const handleStartOverEngagedPause = useCallback(() => {
    if (!canNavigateToPauseSession(message, lastPauseInstanceId)) return;
    clearPausePersistedTabSession();
    holzenLog.home('Navigate to /pause (engaged start over)', {
      pauseInstanceId: lastPauseInstanceId,
    });
    navigate('/pause', {
      state: buildHomePauseSessionLocationState({
        message,
        context,
        pauseInstanceId: lastPauseInstanceId ?? undefined,
        companions,
        companionPrefs,
        severity,
        restartEngagedRitual: true,
      }),
    });
  }, [message, context, lastPauseInstanceId, companions, companionPrefs, severity, navigate]);

  const startProCheckout = useCallback(() => {
    startCheckout('pro');
  }, [startCheckout]);

  return {
    handleNeedAPause,
    handleDismiss,
    handleNavigatePauseWithThis,
    handleStartOverEngagedPause,
    startProCheckout,
  };
}
