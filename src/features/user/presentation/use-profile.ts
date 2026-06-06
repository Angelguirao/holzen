import { useState, useEffect, useCallback, useOptimistic, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { signOutAuth, useAuth } from '@/features/auth/public';
import { isProfileSessionInvalidError } from '@/features/user/domain/profile-session-invalid-error';
import { holzenLog } from '@/lib/holzen-console';
import type { CompanionPrefs } from '@/features/pause/public-hooks';
import { normalizeTrackedAssetId } from '@/features/market/public';
import {
  fetchProfileLastTriggerAt,
  fetchProfileRowForUser,
  getProfileRowQueryOptions,
  PROFILE_QUERY_KEY,
  updateProfileFields,
  type ProfileRow,
  type ProfileUpdate,
} from '../public-queries';

export type { ProfileRow };
export { PROFILE_QUERY_KEY, fetchProfileRowForUser, getProfileRowQueryOptions };

export function useProfile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const invalidateProfileQuery = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
  }, [queryClient, userId]);

  const {
    data: profileRow,
    status: profileQueryStatus,
    error: profileQueryError,
    refetch: refetchProfile,
  } = useQuery(getProfileRowQueryOptions(userId));

  const [threshold, setThresholdState] = useState(5);
  const [thresholdDown, setThresholdDownState] = useState(5);
  const [cumulativeThreshold, setCumulativeThresholdState] = useState(15);
  const [emailNotificationsCommitted, setEmailNotificationsCommitted] = useState(true);
  const [emailNotifications, addOptimisticEmailNotifications] = useOptimistic(
    emailNotificationsCommitted,
    (_current, next: boolean) => next,
  );
  const [reflectionToneCommitted, setReflectionToneCommitted] = useState('stoic');
  const [reflectionTone, addOptimisticReflectionTone] = useOptimistic(
    reflectionToneCommitted,
    (_current, next: string) => next,
  );
  const [silentModeCommitted, setSilentModeCommitted] = useState(false);
  const [silentMode, addOptimisticSilentMode] = useOptimistic(
    silentModeCommitted,
    (_current, next: boolean) => next,
  );
  const [cooldownHours, setCooldownHoursState] = useState(6);
  const [customPrompt, setCustomPromptState] = useState<string | null>(null);
  const [reflectionStyleCommitted, setReflectionStyleCommitted] = useState('standard');
  const [reflectionStyle, addOptimisticReflectionStyle] = useOptimistic(
    reflectionStyleCommitted,
    (_current, next: string) => next,
  );
  const [quietHoursStart, setQuietHoursStartState] = useState<number | null>(null);
  const [quietHoursEnd, setQuietHoursEndState] = useState<number | null>(null);
  const [firstName, setFirstNameState] = useState<string | null>(null);
  const [motivations, setMotivationsState] = useState<string[]>([]);
  const [mantra, setMantraState] = useState<string | null>(null);
  const [groundingActivities, setGroundingActivitiesState] = useState<string[]>([]);
  const [currencyCommitted, setCurrencyCommitted] = useState<string>('USD');
  const [currency, addOptimisticCurrency] = useOptimistic(
    currencyCommitted,
    (_current, next: string) => next,
  );
  const [trackedAssetIdCommitted, setTrackedAssetIdCommitted] = useState<string>('bitcoin');
  const [trackedAssetId, addOptimisticTrackedAssetId] = useOptimistic(
    trackedAssetIdCommitted,
    (_current, next: string) => next,
  );
  const [languageCommitted, setLanguageCommitted] = useState<string>('en');
  const [language, addOptimisticLanguage] = useOptimistic(
    languageCommitted,
    (_current, next: string) => next,
  );
  const [companionPrefsCommitted, setCompanionPrefsCommitted] = useState<CompanionPrefs>({
    breathing: true,
    haiku: true,
    grounding: true,
    signal: true,
    zoomOut: true,
    history: true,
  });
  const [companionPrefs, addOptimisticCompanionPrefs] = useOptimistic(
    companionPrefsCommitted,
    (_current, next: CompanionPrefs) => next,
  );
  const [hasOnboardedState, setHasOnboarded] = useState(false);
  const sessionInvalidHandledRef = useRef(false);

  useEffect(() => {
    sessionInvalidHandledRef.current = false;
  }, [userId]);

  const retryProfileLoad = useCallback(() => {
    void refetchProfile();
  }, [refetchProfile]);

  const profileSessionInvalid =
    profileQueryStatus === 'error' && isProfileSessionInvalidError(profileQueryError);
  const profileLoaded = Boolean(
    userId &&
      !profileSessionInvalid &&
      (profileQueryStatus === 'success' || profileQueryStatus === 'error'),
  );
  const hasOnboarded = profileRow?.has_onboarded ?? hasOnboardedState;
  const profileLoadError = userId
    ? profileQueryError instanceof Error
      ? profileQueryError.message
      : profileQueryError
        ? String(profileQueryError)
        : null
    : null;

  useEffect(() => {
    if (!userId || !profileSessionInvalid || sessionInvalidHandledRef.current) return;
    sessionInvalidHandledRef.current = true;
    holzenLog.profile('invalid server session — signing out');
    toast.error(t('auth.sessionInvalid'));
    void (async () => {
      await signOutAuth();
      queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY(userId) });
    })();
  }, [userId, profileSessionInvalid, t, queryClient]);

  useEffect(() => {
    if (!userId) {
      holzenLog.profile('skip load (signed out)');
      return;
    }
    if (profileQueryStatus !== 'success') return;

    const data = profileRow;
    if (data) {
      const row = data;
      setThresholdState(row.threshold);
      setThresholdDownState(row.threshold_down ?? row.threshold);
      setCumulativeThresholdState(row.cumulative_threshold ?? 15);
      setEmailNotificationsCommitted(row.email_notifications ?? true);
      setReflectionToneCommitted(row.reflection_tone ?? 'stoic');
      setCooldownHoursState(row.cooldown_hours ?? 6);
      setSilentModeCommitted(row.silent_mode ?? false);
      setCustomPromptState(row.custom_prompt ?? null);
      setReflectionStyleCommitted(row.reflection_style ?? 'standard');
      setQuietHoursStartState(row.quiet_hours_start ?? null);
      setQuietHoursEndState(row.quiet_hours_end ?? null);
      setFirstNameState(row.first_name ?? null);
      setMotivationsState(row.motivations ?? []);
      setMantraState(row.mantra ?? null);
      setCurrencyCommitted(row.display_currency ?? 'USD');
      setTrackedAssetIdCommitted(normalizeTrackedAssetId(row.tracked_asset_id));
      setLanguageCommitted(row.language ?? 'en');
      setGroundingActivitiesState(row.grounding_activities ?? []);
      setHasOnboarded(row.has_onboarded ?? false);
      setCompanionPrefsCommitted({
        breathing: true,
        haiku: row.companion_haiku ?? true,
        grounding: row.companion_grounding ?? true,
        signal: row.companion_signal ?? true,
        zoomOut: row.companion_zoom_out ?? true,
        history: row.companion_history ?? true,
      });

    }
    holzenLog.profile('ready', {
      hasRow: !!data,
      hasOnboarded: data?.has_onboarded ?? null,
      silentMode: data ? !!data.silent_mode : null,
      hasLastContext: !!(data?.last_context),
    });
  }, [userId, profileQueryStatus, profileRow]);

  const setThreshold = useCallback(async (val: number) => {
    setThresholdState(val);
    if (!user) return;
    const { error } = await updateProfileFields(user.id, { threshold: val });
    if (!error) invalidateProfileQuery();
  }, [user, invalidateProfileQuery]);

  const setThresholdDown = useCallback(async (val: number) => {
    setThresholdDownState(val);
    if (!user) return;
    const { error } = await updateProfileFields(user.id, { threshold_down: val });
    if (!error) invalidateProfileQuery();
  }, [user, invalidateProfileQuery]);

  const setCumulativeThreshold = useCallback(async (val: number) => {
    setCumulativeThresholdState(val);
    if (!user) return;
    const { error } = await updateProfileFields(user.id, { cumulative_threshold: val });
    if (!error) invalidateProfileQuery();
  }, [user, invalidateProfileQuery]);

  const setEmailNotifications = useCallback(async (val: boolean) => {
    const previous = emailNotificationsCommitted;
    addOptimisticEmailNotifications(val);
    if (!user) return;
    const { error } = await updateProfileFields(user.id, { email_notifications: val });
    if (!error) {
      setEmailNotificationsCommitted(val);
      invalidateProfileQuery();
    } else {
      setEmailNotificationsCommitted(previous);
      addOptimisticEmailNotifications(previous);
    }
  }, [user, invalidateProfileQuery, emailNotificationsCommitted, addOptimisticEmailNotifications]);

  const setReflectionTone = useCallback(async (val: string) => {
    const previous = reflectionToneCommitted;
    addOptimisticReflectionTone(val);
    if (!user) return;
    const { error } = await updateProfileFields(user.id, { reflection_tone: val });
    if (!error) {
      setReflectionToneCommitted(val);
      invalidateProfileQuery();
    } else {
      setReflectionToneCommitted(previous);
      addOptimisticReflectionTone(previous);
    }
  }, [user, invalidateProfileQuery, reflectionToneCommitted, addOptimisticReflectionTone]);

  const setSilentMode = useCallback(async (val: boolean) => {
    const previous = silentModeCommitted;
    addOptimisticSilentMode(val);
    if (!user) return;
    const { error } = await updateProfileFields(user.id, { silent_mode: val });
    if (!error) {
      setSilentModeCommitted(val);
      invalidateProfileQuery();
    } else {
      setSilentModeCommitted(previous);
      addOptimisticSilentMode(previous);
    }
  }, [user, invalidateProfileQuery, silentModeCommitted, addOptimisticSilentMode]);

  const setCompanionPref = useCallback(async (key: keyof CompanionPrefs, val: boolean) => {
    const previous = companionPrefsCommitted;
    const next = { ...previous, [key]: val };
    addOptimisticCompanionPrefs(next);
    if (!user || key === 'breathing') {
      setCompanionPrefsCommitted(next);
      return;
    }
    const snakeKey = key === 'zoomOut' ? 'zoom_out' : key;
    const dbKey = `companion_${snakeKey}` as string;
    const { error } = await updateProfileFields(user.id, { [dbKey]: val } as ProfileUpdate);
    if (!error) {
      setCompanionPrefsCommitted(next);
      invalidateProfileQuery();
    } else {
      setCompanionPrefsCommitted(previous);
      addOptimisticCompanionPrefs(previous);
    }
  }, [user, invalidateProfileQuery, companionPrefsCommitted, addOptimisticCompanionPrefs]);

  const saveOnboardingDraft = useCallback(async (draft: {
    trackedAssetId: string;
    threshold: number;
    thresholdDown: number;
    timezone: string;
  }) => {
    const normalizedTrackedAssetId = normalizeTrackedAssetId(draft.trackedAssetId);
    setThresholdState(draft.threshold);
    setThresholdDownState(draft.thresholdDown);
    setTrackedAssetIdCommitted(normalizedTrackedAssetId);

    if (!user) return;

    const { error } = await updateProfileFields(user.id, {
      tracked_asset_id: normalizedTrackedAssetId,
      threshold: draft.threshold,
      threshold_down: draft.thresholdDown,
      timezone: draft.timezone,
    });

    if (error) {
      holzenLog.profile('onboarding draft save failed', { error: error.message });
      toast.error(t('common.profileWriteFailed'));
      throw error;
    }

    invalidateProfileQuery();
  }, [user, invalidateProfileQuery, t]);

  const completeOnboarding = useCallback(async () => {
    if (!user) return;

    const { error } = await updateProfileFields(user.id, {
      has_onboarded: true,
    });

    if (error) {
      holzenLog.profile('complete onboarding failed', { error: error.message });
      toast.error(t('common.profileWriteFailed'));
      throw error;
    }

    setHasOnboarded(true);
    queryClient.setQueryData<ProfileRow | null>(PROFILE_QUERY_KEY(user.id), (current) =>
      current ? { ...current, has_onboarded: true } : current,
    );
    invalidateProfileQuery();
  }, [user, queryClient, invalidateProfileQuery, t]);

  const isInCooldown = useCallback(async () => {
    if (!user) return true;
    const lastTriggerAt = await fetchProfileLastTriggerAt(user.id);
    if (!lastTriggerAt) return false;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    return Date.now() - new Date(lastTriggerAt).getTime() < cooldownMs;
  }, [user, cooldownHours]);

  const isInQuietHours = useCallback(() => {
    if (quietHoursStart === null || quietHoursEnd === null) return false;
    const nowHour = new Date().getHours();
    if (quietHoursStart <= quietHoursEnd) {
      return nowHour >= quietHoursStart && nowHour < quietHoursEnd;
    }
    return nowHour >= quietHoursStart || nowHour < quietHoursEnd;
  }, [quietHoursStart, quietHoursEnd]);

  const setCooldownHours = useCallback(async (val: number) => {
    setCooldownHoursState(val);
    if (!user) return;
    const { error } = await updateProfileFields(user.id, { cooldown_hours: val });
    if (!error) invalidateProfileQuery();
  }, [user, invalidateProfileQuery]);

  return {
    /** From cached `profiles.last_trigger_at` — automatic pause cooldown anchor. */
    lastTriggerAt: profileRow?.last_trigger_at ?? null,
    threshold,
    setThreshold,
    thresholdDown,
    setThresholdDown,
    cumulativeThreshold,
    setCumulativeThreshold,
    emailNotifications,
    setEmailNotifications,
    reflectionTone,
    setReflectionTone,
    silentMode,
    setSilentMode,
    cooldownHours,
    setCooldownHours,
    customPrompt,
    setCustomPrompt: async (val: string | null) => {
      setCustomPromptState(val);
      if (!user) return;
      const { error } = await updateProfileFields(user.id, { custom_prompt: val });
      if (!error) invalidateProfileQuery();
    },
    reflectionStyle,
    setReflectionStyle: async (val: string) => {
      const previous = reflectionStyleCommitted;
      addOptimisticReflectionStyle(val);
      if (!user) return;
      const { error } = await updateProfileFields(user.id, { reflection_style: val });
      if (!error) {
        setReflectionStyleCommitted(val);
        invalidateProfileQuery();
      } else {
        setReflectionStyleCommitted(previous);
        addOptimisticReflectionStyle(previous);
      }
    },
    quietHoursStart,
    quietHoursEnd,
    setQuietHours: async (start: number | null, end: number | null) => {
      setQuietHoursStartState(start);
      setQuietHoursEndState(end);
      if (!user) return;
      const { error } = await updateProfileFields(user.id, {
        quiet_hours_start: start,
        quiet_hours_end: end,
      });
      if (!error) invalidateProfileQuery();
    },
    firstName,
    setFirstName: async (val: string | null) => {
      setFirstNameState(val);
      if (!user) return;
      const { error } = await updateProfileFields(user.id, { first_name: val });
      if (!error) invalidateProfileQuery();
    },
    motivations,
    setMotivations: async (val: string[]) => {
      setMotivationsState(val);
      if (!user) return;
      const { error } = await updateProfileFields(user.id, { motivations: val });
      if (error) {
        holzenLog.profile('motivations update failed', { error: error.message });
        toast.error(t('common.profileWriteFailed'));
        throw error;
      }
      invalidateProfileQuery();
    },
    groundingActivities,
    setGroundingActivities: async (val: string[]) => {
      setGroundingActivitiesState(val);
      if (!user) return;
      const { error } = await updateProfileFields(user.id, { grounding_activities: val });
      if (!error) invalidateProfileQuery();
    },
    mantra,
    setMantra: async (val: string | null) => {
      setMantraState(val);
      if (!user) return;
      const { error } = await updateProfileFields(user.id, { mantra: val });
      if (error) {
        holzenLog.profile('mantra update failed', { error: error.message });
        toast.error(t('common.profileWriteFailed'));
        throw error;
      }
      invalidateProfileQuery();
    },
    currency,
    setCurrency: async (val: string) => {
      const previous = currencyCommitted;
      addOptimisticCurrency(val);
      if (!user) return;
      const { error } = await updateProfileFields(user.id, { display_currency: val });
      if (!error) {
        setCurrencyCommitted(val);
        invalidateProfileQuery();
      } else {
        setCurrencyCommitted(previous);
        addOptimisticCurrency(previous);
      }
    },
    trackedAssetId,
    setTrackedAssetId: async (val: string) => {
      const next = normalizeTrackedAssetId(val);
      const previous = trackedAssetIdCommitted;
      addOptimisticTrackedAssetId(next);
      if (!user) return;
      const { error } = await updateProfileFields(user.id, { tracked_asset_id: next });
      if (!error) {
        setTrackedAssetIdCommitted(next);
        invalidateProfileQuery();
      } else {
        setTrackedAssetIdCommitted(previous);
        addOptimisticTrackedAssetId(previous);
      }
    },
    language,
    setLanguage: async (val: string) => {
      if (!user) {
        setLanguageCommitted(val);
        addOptimisticLanguage(val);
        return;
      }
      const previous = languageCommitted;
      addOptimisticLanguage(val);
      const { error } = await updateProfileFields(user.id, { language: val });
      if (error) {
        holzenLog.profile('language update failed', { error: error.message });
        setLanguageCommitted(previous);
        addOptimisticLanguage(previous);
        toast.error(t('common.profileWriteFailed'));
      } else {
        setLanguageCommitted(val);
        invalidateProfileQuery();
      }
    },
    companionPrefs,
    setCompanionPref,
    profileLoaded,
    profileLoadError,
    retryProfileLoad,
    hasOnboarded,
    saveOnboardingDraft,
    completeOnboarding,
    isInCooldown,
    isInQuietHours,
  };
}
