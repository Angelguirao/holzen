import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/public';
import { holzenLog } from '@/lib/holzen-console';
import type { CompanionPrefs } from '@/features/pause/public';
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
  const [emailNotifications, setEmailNotificationsState] = useState(true);
  const [reflectionTone, setReflectionToneState] = useState('stoic');
  const [silentMode, setSilentModeState] = useState(false);
  const [cooldownHours, setCooldownHoursState] = useState(6);
  const [customPrompt, setCustomPromptState] = useState<string | null>(null);
  const [reflectionStyle, setReflectionStyleState] = useState('standard');
  const [quietHoursStart, setQuietHoursStartState] = useState<number | null>(null);
  const [quietHoursEnd, setQuietHoursEndState] = useState<number | null>(null);
  const [firstName, setFirstNameState] = useState<string | null>(null);
  const [motivations, setMotivationsState] = useState<string[]>([]);
  const [mantra, setMantraState] = useState<string | null>(null);
  const [groundingActivities, setGroundingActivitiesState] = useState<string[]>([]);
  const [currency, setCurrencyState] = useState<string>('USD');
  const [trackedAssetId, setTrackedAssetIdState] = useState<string>('bitcoin');
  const [language, setLanguageState] = useState<string>('en');
  const [companionPrefs, setCompanionPrefsState] = useState<CompanionPrefs>({ breathing: true, haiku: true, grounding: true, signal: true, zoomOut: true, history: true });
  const [hasOnboarded, setHasOnboarded] = useState(true);

  const retryProfileLoad = useCallback(() => {
    void refetchProfile();
  }, [refetchProfile]);

  const profileLoaded = Boolean(
    userId && (profileQueryStatus === 'success' || profileQueryStatus === 'error'),
  );
  const profileLoadError = userId
    ? profileQueryError instanceof Error
      ? profileQueryError.message
      : profileQueryError
        ? String(profileQueryError)
        : null
    : null;

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
      setEmailNotificationsState(row.email_notifications ?? true);
      setReflectionToneState(row.reflection_tone ?? 'stoic');
      setCooldownHoursState(row.cooldown_hours ?? 6);
      setSilentModeState(row.silent_mode ?? false);
      setCustomPromptState(row.custom_prompt ?? null);
      setReflectionStyleState(row.reflection_style ?? 'standard');
      setQuietHoursStartState(row.quiet_hours_start ?? null);
      setQuietHoursEndState(row.quiet_hours_end ?? null);
      setFirstNameState(row.first_name ?? null);
      setMotivationsState(row.motivations ?? []);
      setMantraState(row.mantra ?? null);
      setCurrencyState(row.hold_goal_currency ?? 'USD');
      setTrackedAssetIdState(normalizeTrackedAssetId(row.tracked_asset_id));
      setLanguageState(row.language ?? 'en');
      setGroundingActivitiesState(row.grounding_activities ?? []);
      setHasOnboarded(row.has_onboarded ?? false);
      setCompanionPrefsState({
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
    setEmailNotificationsState(val);
    if (!user) return;
    const { error } = await updateProfileFields(user.id, { email_notifications: val });
    if (!error) invalidateProfileQuery();
  }, [user, invalidateProfileQuery]);

  const setReflectionTone = useCallback(async (val: string) => {
    setReflectionToneState(val);
    if (!user) return;
    const { error } = await updateProfileFields(user.id, { reflection_tone: val });
    if (!error) invalidateProfileQuery();
  }, [user, invalidateProfileQuery]);

  const setSilentMode = useCallback(async (val: boolean) => {
    setSilentModeState(val);
    if (!user) return;
    const { error } = await updateProfileFields(user.id, { silent_mode: val });
    if (!error) invalidateProfileQuery();
  }, [user, invalidateProfileQuery]);

  const setCompanionPref = useCallback(async (key: keyof CompanionPrefs, val: boolean) => {
    setCompanionPrefsState((prev) => ({ ...prev, [key]: val }));
    if (!user || key === 'breathing') return;
    const snakeKey = key === 'zoomOut' ? 'zoom_out' : key;
    const dbKey = `companion_${snakeKey}` as string;
    const { error } = await updateProfileFields(user.id, { [dbKey]: val } as ProfileUpdate);
    if (!error) invalidateProfileQuery();
  }, [user, invalidateProfileQuery]);

  const completeOnboarding = useCallback(async (
    result: {
      threshold: number;
      firstName: string | null;
      timezone: string;
      motivations: string[];
      groundingActivities: string[];
    },
    options?: { setLocalOnboarded?: boolean },
  ) => {
    const setLocalOnboarded = options?.setLocalOnboarded ?? true;

    if (setLocalOnboarded) {
      setHasOnboarded(true);
    }

    setThresholdState(result.threshold);
    if (result.firstName) setFirstNameState(result.firstName);
    setMotivationsState(result.motivations);
    setGroundingActivitiesState(result.groundingActivities);

    if (!user) return;

    const { error } = await updateProfileFields(user.id, {
      has_onboarded: true,
      threshold: result.threshold,
      first_name: result.firstName,
      timezone: result.timezone,
      motivations: result.motivations.length > 0 ? result.motivations : null,
      grounding_activities: result.groundingActivities.length > 0 ? result.groundingActivities : [],
    });
    if (!error) invalidateProfileQuery();
  }, [user, invalidateProfileQuery]);

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
      setReflectionStyleState(val);
      if (!user) return;
      const { error } = await updateProfileFields(user.id, { reflection_style: val });
      if (!error) invalidateProfileQuery();
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
      if (!error) invalidateProfileQuery();
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
      if (!error) invalidateProfileQuery();
    },
    currency,
    setCurrency: async (val: string) => {
      setCurrencyState(val);
      if (!user) return;
      const { error } = await updateProfileFields(user.id, { hold_goal_currency: val });
      if (!error) invalidateProfileQuery();
    },
    trackedAssetId,
    setTrackedAssetId: async (val: string) => {
      const next = normalizeTrackedAssetId(val);
      setTrackedAssetIdState(next);
      if (!user) return;
      const { error } = await updateProfileFields(user.id, { tracked_asset_id: next });
      if (!error) invalidateProfileQuery();
    },
    language,
    setLanguage: async (val: string) => {
      if (!user) {
        setLanguageState(val);
        return;
      }
      const prev = language;
      setLanguageState(val);
      const { error } = await updateProfileFields(user.id, { language: val });
      if (error) {
        holzenLog.profile('language update failed', { error: error.message });
        setLanguageState(prev);
        toast.error(t('common.profileWriteFailed'));
      } else {
        invalidateProfileQuery();
      }
    },
    companionPrefs,
    setCompanionPref,
    profileLoaded,
    profileLoadError,
    retryProfileLoad,
    hasOnboarded,
    completeOnboarding,
    isInCooldown,
    isInQuietHours,
  };
}
