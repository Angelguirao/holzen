import { useState, useEffect, useCallback, useOptimistic, useRef, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { signOutAuth, useAuth } from '@/features/auth/public';
import { isProfileSessionInvalidError } from '@/features/user/domain/profile-session-invalid-error';
import { holzenLog } from '@/lib/holzen-console';
import type { CompanionPrefs } from '@/features/pause/public-hooks';
import { normalizeTrackedAssetId } from '@/features/market/public';
import {
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
  const [firstName, setFirstNameState] = useState<string | null>(null);
  const [motivations, setMotivationsState] = useState<string[]>([]);
  const [mantra, setMantraState] = useState<string | null>(null);
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
  const [, startProfileTransition] = useTransition();

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
  const hasOnboarded =
    (profileRow?.has_onboarded ?? false) || hasOnboardedState;
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
      setFirstNameState(row.first_name ?? null);
      setMotivationsState(row.motivations ?? []);
      setMantraState(row.mantra ?? null);
      setCurrencyCommitted(row.display_currency ?? 'USD');
      setTrackedAssetIdCommitted(normalizeTrackedAssetId(row.tracked_asset_id));
      setLanguageCommitted(row.language ?? 'en');
      setHasOnboarded((prev) => prev || (row.has_onboarded ?? false));
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

  const setCompanionPref = useCallback(
    (key: keyof CompanionPrefs, val: boolean) => {
      startProfileTransition(async () => {
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
      });
    },
    [
      user,
      invalidateProfileQuery,
      companionPrefsCommitted,
      addOptimisticCompanionPrefs,
      startProfileTransition,
    ],
  );

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
    if (!user) {
      throw new Error('completeOnboarding: not signed in');
    }

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
  }, [user, queryClient, t]);

  return {
    threshold,
    setThreshold,
    thresholdDown,
    setThresholdDown,
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
    setCurrency: (val: string) => {
      startProfileTransition(async () => {
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
      });
    },
    trackedAssetId,
    setTrackedAssetId: (val: string) => {
      startProfileTransition(async () => {
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
      });
    },
    language,
    setLanguage: (val: string) => {
      startProfileTransition(async () => {
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
      });
    },
    companionPrefs,
    setCompanionPref,
    profileLoaded,
    profileLoadError,
    retryProfileLoad,
    hasOnboarded,
    saveOnboardingDraft,
    completeOnboarding,
  };
}
