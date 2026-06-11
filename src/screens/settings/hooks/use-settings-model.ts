import { useAuth } from '@/features/auth/public';
import { useProfile } from '@/features/user/public-hooks';
import { useSubscription } from '@/features/subscription/public-hooks';
import { useInstallPrompt } from '@/app/hooks/use-install-prompt';
import { usePushNotifications } from '@/features/notifications/public-hooks';
import { useLatestChangelogVersion } from '@/screens/settings/hooks/use-latest-changelog-version';
import { useSettingsCheckoutWindow } from '@/screens/settings/hooks/use-settings-checkout-window';
import { useSettingsLocalPrefs } from '@/screens/settings/hooks/use-settings-local-prefs';
import { useSettingsProfileAutoSaveToast } from '@/screens/settings/hooks/use-settings-profile-auto-save-toast';
import { trackPaywallViewed } from '@/features/subscription/public';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useSettingsModel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    threshold,
    setThreshold,
    thresholdDown,
    setThresholdDown,
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
    profileLoaded,
  } = useProfile();
  void _language;

  const {
    subscribed,
    loading: subLoading,
    checkoutLoading,
    checkoutLoadingTarget,
    trialLoading,
    portalLoading,
    startCheckout,
    ensureTrial,
    startReactivationCheckout,
    openPortal,
    entitlement,
    tier,
  } = useSubscription();

  const startCheckoutFromSettings = useCallback(
    (target: 'pro' | 'flex_pack_s' | 'flex_pack_m' = 'pro') => {
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

  const localPrefs = useSettingsLocalPrefs();
  const checkoutWindow = useSettingsCheckoutWindow();
  const { hasNewVersion: hasUnseenChangelog } = useLatestChangelogVersion();

  const profileSaveKey = useMemo(
    () =>
      JSON.stringify({
        threshold,
        thresholdDown,
        emailNotifications,
        reflectionTone,
        reflectionStyle,
        silentMode,
        customPrompt,
        quietHoursStart,
        quietHoursEnd,
        firstName,
        motivations,
        mantra,
        currency,
        trackedAssetId,
        companionPrefs,
      }),
    [
      threshold,
      thresholdDown,
      emailNotifications,
      reflectionTone,
      reflectionStyle,
      silentMode,
      customPrompt,
      quietHoursStart,
      quietHoursEnd,
      firstName,
      motivations,
      mantra,
      currency,
      trackedAssetId,
      companionPrefs,
    ],
  );

  useSettingsProfileAutoSaveToast(profileLoaded, profileSaveKey, t);

  return {
    t,
    user,
    threshold,
    setThreshold,
    thresholdDown,
    setThresholdDown,
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
    profileLoaded,
    subscribed,
    subLoading,
    checkoutLoading,
    checkoutLoadingTarget,
    startCheckoutFromSettings,
    openPortal,
    portalLoading,
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
    hasUnseenChangelog,
    ...localPrefs,
    ...checkoutWindow,
  };
}

export type SettingsModel = ReturnType<typeof useSettingsModel>;
