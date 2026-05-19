import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { getProfileRowQueryOptions } from '@/features/user/public-queries';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useLatestChangelogVersion } from '@/hooks/use-latest-changelog-version';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdge } from '@/lib/invoke-edge';
import { trackEvent } from '@/lib/posthog';
import { toast } from 'sonner';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getCheckoutSuppressionWindowMinutes,
  setCheckoutSuppressionWindowMinutes,
} from '@/features/subscription/public';
import { readThrownMessage } from '@/screens/settings/read-thrown-message';
import { isHapticEnabled, setHapticEnabled as persistHapticEnabled } from '@/lib/haptics';

export function useSettingsModel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
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
      trackEvent('paywall.viewed', { source: 'settings' });
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
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [zenMode, setZenMode] = useState(() => localStorage.getItem('holzen_zen_mode') === 'true');
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

  const changePassword = useCallback(async () => {
    if (newPassword.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t('auth.passwordUpdated'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: unknown) {
      toast.error(readThrownMessage(e, 'Something went wrong'));
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, confirmPassword, t]);

  const exportData = async (format: 'json' | 'csv' = 'json') => {
    if (!user) return;
    setExporting(true);
    try {
      const userId = user.id;
      const [
        profile,
        { data: pauses },
        { data: stepEvents },
        { data: companionEvents },
        { data: artifacts },
      ] = await Promise.all([
        queryClient.fetchQuery(getProfileRowQueryOptions(userId)),
        supabase
          .from('v_pause_full' as never)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('pause_step_events' as never)
          .select('pause_instance_id, step_type, payload, created_at')
          .eq('user_id', user.id),
        supabase
          .from('pause_companion_events' as never)
          .select(
            'pause_instance_id, companion_type, action, counts_for_pause, non_counting_reason, entry_point, created_at',
          )
          .eq('user_id', user.id),
        supabase
          .from('pause_ai_artifacts' as never)
          .select('pause_instance_id, kind, content, created_at')
          .eq('user_id', user.id),
      ]);

      const pauseRows = (pauses ?? []) as Record<string, unknown>[];
      const dateStr = new Date().toISOString().slice(0, 10);

      if (format === 'csv') {
        const refHeaders = [
          'created_at',
          'state',
          'initial_mood',
          'shift_mood',
          'outcome',
          'note_text',
          'tags',
          'is_favorite',
          'counted_companion_types',
          'reflection_text',
        ];
        const refRows = pauseRows.map((r) =>
          refHeaders
            .map((h) => {
              const val = Array.isArray(r[h]) ? (r[h] as unknown[]).join('; ') : r[h] ?? '';
              return `"${String(val).replace(/"/g, '""')}"`;
            })
            .join(','),
        );
        const refCsv = [refHeaders.join(','), ...refRows].join('\n');

        const refBlob = new Blob([refCsv], { type: 'text/csv' });
        const refUrl = URL.createObjectURL(refBlob);
        const a1 = document.createElement('a');
        a1.href = refUrl;
        a1.download = `holzen-pauses-${dateStr}.csv`;
        a1.click();
        URL.revokeObjectURL(refUrl);

        toast.success('CSV exported', { description: `${pauseRows.length} pauses.` });
      } else {
        const exportPayload = {
          exported_at: new Date().toISOString(),
          profile: profile
            ? {
                threshold: profile.threshold,
                threshold_down: profile.threshold_down,
                cooldown_hours: profile.cooldown_hours,
                reflection_tone: profile.reflection_tone,
                reflection_style: profile.reflection_style,
                language: profile.language,
                email_notifications: profile.email_notifications,
                created_at: profile.created_at,
              }
            : null,
          pauses: pauseRows,
          step_events: stepEvents ?? [],
          companion_events: companionEvents ?? [],
          ai_artifacts: artifacts ?? [],
        };

        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `holzen-export-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Data exported', { description: `${pauseRows.length} pauses.` });
      }
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await invokeEdge('delete-account');
      if (error) throw error;
      toast.success('Account deleted');
      await signOut();
    } catch {
      toast.error('Failed to delete account');
      setDeleting(false);
    }
  };

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
    deleting,
    exporting,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    changingPassword,
    zenMode,
    setZenMode,
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
    changePassword,
    exportData,
    deleteAccount,
  };
}

export type SettingsModel = ReturnType<typeof useSettingsModel>;
