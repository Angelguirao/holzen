import { useCallback, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useProGate } from '@/features/subscription/public-hooks';
import { usePauseSessionExitNavigation } from '@/features/pause/public-hooks';
import { usePauseSessionBreathSecondLabelVariant } from '@/features/pause/public-hooks';
import { JOURNEY_PREFIX } from '@/lib/app-routes';
import { clearSession } from '@/features/pause/public';
import type { PauseSessionShellHolzen } from '@/features/pause/public';

/**
 * Cross-route providers for `/pause`: i18n, Holzen home state, subscription gates, exit nav.
 */
export function usePauseSessionProviders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleReturn, handleClose } = usePauseSessionExitNavigation(navigate);

  const handleBriefSaveToJourney = useCallback(() => {
    clearSession();
    navigate(JOURNEY_PREFIX, { replace: true });
  }, [navigate]);

  const prefersReducedMotion = useReducedMotion();
  const breathSecondLabelVariant = usePauseSessionBreathSecondLabelVariant();

  const holzen = useHolzen();
  const {
    mantra,
    dismissMessage,
    message,
    context,
    companions,
    lastPauseInstanceId,
    companionPrefs,
    severity,
    profileLoaded,
    resyncOpenPauseFromDb,
    btcData,
    trackedAssetId,
  } = holzen;

  const holzenForShell = useMemo<PauseSessionShellHolzen>(
    () => ({
      message,
      context,
      lastPauseInstanceId,
      companions,
      companionPrefs,
      severity,
    }),
    [message, context, lastPauseInstanceId, companions, companionPrefs, severity],
  );

  const {
    subscribed,
    loading: subLoading,
    entitlement,
    canEngagePause,
    checkoutLoading,
    trialLoading,
    ensureTrial,
    startReactivationCheckout,
    refresh: refreshSubscription,
  } = useSubscription();
  const { requirePro } = useProGate();

  return {
    t,
    navigate,
    handleReturn,
    handleClose,
    handleBriefSaveToJourney,
    prefersReducedMotion,
    breathSecondLabelVariant,
    holzenForShell,
    mantra,
    dismissMessage,
    message,
    context,
    companions,
    companionPrefs,
    severity,
    profileLoaded,
    resyncOpenPauseFromDb,
    btcData,
    trackedAssetId,
    subscribed,
    subLoading,
    entitlement,
    canEngagePause,
    checkoutLoading,
    trialLoading,
    ensureTrial,
    startReactivationCheckout,
    refreshSubscription,
    requirePro,
  };
}
