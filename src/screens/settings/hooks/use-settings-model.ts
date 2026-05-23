import { useAuth } from '@/features/auth/public';
import { useHolzen } from '@/app/components/HolzenProvider';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useInstallPrompt } from '@/app/hooks/use-install-prompt';
import { usePushNotifications } from '@/features/notifications/public-hooks';
import { useLatestChangelogVersion } from '@/screens/settings/hooks/use-latest-changelog-version';
import { trackPaywallViewed } from '@/features/subscription/public';
import { toast } from 'sonner';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getCheckoutSuppressionWindowMinutes,
  setCheckoutSuppressionWindowMinutes,
} from '@/features/subscription/public';
import { isHapticEnabled, setHapticEnabled as persistHapticEnabled } from '@/lib/haptics';

export function useSettingsModel() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const {
    threshold,
    setThreshold,
    thresholdDown,
    setThresholdDown,
    cumulativeThreshold,
    setCumulativeThreshold,
    emailNotifications,
    setEmailNotifications,
    companionPrefs,
    setCompanionPref,
    reflectionTone,
    setReflectionTone,
    reflectionStyle,
    setReflectionStyle,
    silentMode,
    setSilentMode,
    cooldownHours,
    setCooldownHours,
    customPrompt,
    setCustomPrompt,
    quietHoursStart,
    quietHoursEnd,
    setQuietHours,
    firstName,
    setFirstName,
    motivations,
    setMotivations,
    mantra,
    setMantra,
    currency,
    setCurrency,
    trackedAssetId,
    setTrackedAssetId,
    language: _language,
    groundingActivities,
    setGroundingActivities,
    profileLoaded,
  } = useHolzen();
  void _language; // i18n language reserved for future
  const {
    subscribed,
    loading: subLoading,
    checkoutLoading,
    checkoutLoadingTarget,
    trialLoading,
    startCheckout,
    ensureTrial,
    startReactivationCheckout,
    openPortal,
    entitlement,
    tier,
  } = useSubscription();
  const startCheckoutFromSettings = useCallback(
    (target: 'pro' | 'pro_plus' | 'flex_pack_s' | 'flex_pack_m' = 'pro') => {
      trackPaywallViewed('settings');
      return startCheckout(target);
    },
    [startCheckout],
  );
  const { canInstall, install } = useInstallPrompt();
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    loading: pushLoading,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    permissionGrantedNotSubscribed: pushPermissionGrantedIncomplete,
  } = usePushNotifications();
  const [hapticEnabled, setHapticEnabledState] = useState(isHapticEnabled);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('holzen_sound_enabled') !== 'false');
  const [checkoutWindowMinutes, setCheckoutWindowMinutesState] = useState<number>(() =>
    getCheckoutSuppressionWindowMinutes(),
  );
  const [checkoutWindowDraft, setCheckoutWindowDraft] = useState<string>(() =>
    String(getCheckoutSuppressionWindowMinutes()),
  );
  const commitCheckoutWindow = useCallback(
    (raw: string) => {
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        setCheckoutWindowDraft(String(checkoutWindowMinutes));
        return;
      }
      const stored = setCheckoutSuppressionWindowMinutes(parsed);
      setCheckoutWindowMinutesState(stored);
      setCheckoutWindowDraft(String(stored));
    },
    [checkoutWindowMinutes],
  );
  const [btcMode, setBtcMode] = useState(() => localStorage.getItem('holzen_btc_mode') === 'true');
  const { hasNewVersion: hasUnseenChangelog } = useLatestChangelogVersion();
  const initialLoadRef = useRef(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!profileLoaded) return;
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      toast(t('settings.saved', { defaultValue: 'Saved' }), { duration: 1200, id: 'auto-save' });
    }, 400);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [
    threshold,
    thresholdDown,
    cumulativeThreshold,
    emailNotifications,
    reflectionTone,
    reflectionStyle,
    silentMode,
    cooldownHours,
    customPrompt,
    quietHoursStart,
    quietHoursEnd,
    firstName,
    motivations,
    mantra,
    currency,
    trackedAssetId,
    groundingActivities,
    companionPrefs,
    profileLoaded,
    t,
  ]);

  const setHapticEnabled = useCallback((v: boolean) => {
    setHapticEnabledState(v);
    persistHapticEnabled(v);
  }, []);

  return {
    t,
    user,
    signOut,
    threshold,
    setThreshold,
    thresholdDown,
    setThresholdDown,
    cumulativeThreshold,
    setCumulativeThreshold,
    emailNotifications,
    setEmailNotifications,
    companionPrefs,
    setCompanionPref,
    reflectionTone,
    setReflectionTone,
    reflectionStyle,
    setReflectionStyle,
    silentMode,
    setSilentMode,
    cooldownHours,
    setCooldownHours,
    customPrompt,
    setCustomPrompt,
    quietHoursStart,
    quietHoursEnd,
    setQuietHours,
    firstName,
    setFirstName,
    motivations,
    setMotivations,
    mantra,
    setMantra,
    currency,
    setCurrency,
    trackedAssetId,
    setTrackedAssetId,
    groundingActivities,
    setGroundingActivities,
    profileLoaded,
    subscribed,
    subLoading,
    checkoutLoading,
    checkoutLoadingTarget,
    startCheckoutFromSettings,
    openPortal,
    entitlement,
    trialLoading,
    ensureTrial,
    startReactivationCheckout,
    tier,
    canInstall,
    install,
    pushSupported,
    pushSubscribed,
    pushLoading,
    pushPermissionGrantedIncomplete,
    pushSubscribe,
    pushUnsubscribe,
    hapticEnabled,
    setHapticEnabled,
    soundEnabled,
    setSoundEnabled,
    checkoutWindowMinutes,
    checkoutWindowDraft,
    setCheckoutWindowDraft,
    commitCheckoutWindow,
    btcMode,
    setBtcMode,
    hasUnseenChangelog,
  };
}

export type SettingsModel = ReturnType<typeof useSettingsModel>;
