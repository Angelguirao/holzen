import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { holzenLog } from '@/lib/holzen-console';
import type { CompanionPrefs } from '@/components/CompanionSection';
import type { Database } from '@/integrations/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface ProfileLoadReflectionData {
  lastMessage: string | null;
  lastContext: string | null;
  lastTriggerAt: string | null;
}

export function useProfile() {
  const { user } = useAuth();

  const [threshold, setThresholdState] = useState(5);
  const [thresholdDown, setThresholdDownState] = useState(5);
  const [cumulativeThreshold, setCumulativeThresholdState] = useState(15);
  const [streakFreezeDates, setStreakFreezeDatesState] = useState<string[]>([]);
  const [emailNotifications, setEmailNotificationsState] = useState(true);
  const [reflectionTone, setReflectionToneState] = useState('stoic');
  const [silentMode, setSilentModeState] = useState(false);
  const [cooldownHours, setCooldownHoursState] = useState(6);
  const [digestFrequency, setDigestFrequencyState] = useState('weekly');
  const [customPrompt, setCustomPromptState] = useState<string | null>(null);
  const [reflectionStyle, setReflectionStyleState] = useState('standard');
  const [quietHoursStart, setQuietHoursStartState] = useState<number | null>(null);
  const [quietHoursEnd, setQuietHoursEndState] = useState<number | null>(null);
  const [firstName, setFirstNameState] = useState<string | null>(null);
  const [aiInsightsEnabled, setAiInsightsEnabledState] = useState(true);
  const [nightReflectionHour, setNightReflectionHourState] = useState<number | null>(21);
  const [notifyBadges, setNotifyBadgesState] = useState(true);
  const [motivations, setMotivationsState] = useState<string[]>([]);
  const [mantra, setMantraState] = useState<string | null>(null);
  const [groundingActivities, setGroundingActivitiesState] = useState<string[]>([]);
  const [currency, setCurrencyState] = useState<string>('USD');
  const [language, setLanguageState] = useState<string>('en');
  const [companionPrefs, setCompanionPrefsState] = useState<CompanionPrefs>({ breathing: true, haiku: true, grounding: true, signal: true, zoomOut: true, history: true });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(true);

  const [_profileLoadReflectionData, setProfileLoadReflectionData] = useState<ProfileLoadReflectionData | null>(null);

  useEffect(() => {
    if (!user) {
      holzenLog.profile('skip load (signed out)');
      return;
    }
    const selectCols =
      'threshold, threshold_down, cumulative_threshold, last_message, last_context, email_notifications, has_onboarded, companion_breathing, companion_haiku, companion_grounding, companion_signal, companion_zoom_out, companion_history, reflection_tone, cooldown_hours, last_trigger_at, silent_mode, streak_freeze_dates, digest_frequency, custom_prompt, reflection_style, quiet_hours_start, quiet_hours_end, first_name, night_reflection_hour, ai_insights_enabled, ritual_template, notify_badges, motivations, mantra, hold_goal_currency, language, grounding_activities';

    const load = async () => {
      holzenLog.profile('fetch profiles', { userIdPrefix: user.id.slice(0, 8) });
      const initial = await supabase
        .from('profiles')
        .select(selectCols)
        .eq('user_id', user.id)
        .maybeSingle();

      if (initial.error) {
        console.error('[useProfile] profiles select failed:', initial.error.message);
        holzenLog.profile('select failed', { message: initial.error.message });
        setProfileLoaded(true);
        return;
      }

      let data = initial.data;

      // No row: local reset / missing trigger — create profile (RLS allows insert for own user_id)
      if (!data) {
        holzenLog.profile('no row — inserting profiles');
        const { error: insErr } = await supabase.from('profiles').insert({ user_id: user.id });
        if (insErr && !String(insErr.message).includes('duplicate') && insErr.code !== '23505') {
          console.error('[useProfile] profiles insert failed:', insErr.message);
        }
        const again = await supabase.from('profiles').select(selectCols).eq('user_id', user.id).maybeSingle();
        data = again.data;
        if (again.error) console.error('[useProfile] profiles re-select failed:', again.error.message);
      }

      if (data) {
        const row = data as ProfileRow;
        setThresholdState(row.threshold);
        setThresholdDownState(row.threshold_down ?? row.threshold);
        setCumulativeThresholdState(row.cumulative_threshold ?? 15);
        setStreakFreezeDatesState(row.streak_freeze_dates ?? []);
        setEmailNotificationsState(row.email_notifications ?? true);
        setReflectionToneState(row.reflection_tone ?? 'stoic');
        setCooldownHoursState(row.cooldown_hours ?? 6);
        setSilentModeState(row.silent_mode ?? false);
        setDigestFrequencyState(row.digest_frequency ?? 'weekly');
        setCustomPromptState(row.custom_prompt ?? null);
        setReflectionStyleState(row.reflection_style ?? 'standard');
        setQuietHoursStartState(row.quiet_hours_start ?? null);
        setQuietHoursEndState(row.quiet_hours_end ?? null);
        setFirstNameState(row.first_name ?? null);
        setNightReflectionHourState(row.night_reflection_hour ?? 21);
        setAiInsightsEnabledState(row.ai_insights_enabled ?? true);
        setNotifyBadgesState(row.notify_badges ?? true);
        setMotivationsState(row.motivations ?? []);
        setMantraState(row.mantra ?? null);
        setCurrencyState(row.hold_goal_currency ?? 'USD');
        setLanguageState(row.language ?? 'en');
        setGroundingActivitiesState(row.grounding_activities ?? []);
        setHasOnboarded(row.has_onboarded ?? false);
        setCompanionPrefsState({
          breathing: row.companion_breathing ?? true,
          haiku: row.companion_haiku ?? true,
          grounding: row.companion_grounding ?? true,
          signal: row.companion_signal ?? true,
          zoomOut: row.companion_zoom_out ?? true,
          history: row.companion_history ?? true,
        });

        setProfileLoadReflectionData({
          lastMessage: row.last_message ?? null,
          lastContext: row.last_context ?? null,
          lastTriggerAt: row.last_trigger_at ?? null,
        });
      }
      holzenLog.profile('ready', {
        hasRow: !!data,
        hasOnboarded: data?.has_onboarded ?? null,
        silentMode: data ? !!(data as ProfileRow).silent_mode : null,
        hasLastMessage: !!(data?.last_message),
      });
      setProfileLoaded(true);
    };
    load();
    // Depend on stable id only — `user` object identity changes on TOKEN_REFRESHED etc., which would refetch unnecessarily.
  }, [user?.id]);

  const setThreshold = useCallback(async (val: number) => {
    setThresholdState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ threshold: val })
      .eq('user_id', user.id);
  }, [user]);

  const setThresholdDown = useCallback(async (val: number) => {
    setThresholdDownState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ threshold_down: val })
      .eq('user_id', user.id);
  }, [user]);

  const setCumulativeThreshold = useCallback(async (val: number) => {
    setCumulativeThresholdState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ cumulative_threshold: val })
      .eq('user_id', user.id);
  }, [user]);

  const useStreakFreeze = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    if (streakFreezeDates.includes(today)) return;
    const recent = streakFreezeDates.filter((d) => {
      const diff = Math.abs(Date.now() - new Date(d).getTime());
      return diff < 7 * 24 * 60 * 60 * 1000;
    });
    if (recent.length >= 1) return;
    const updated = [...streakFreezeDates, today];
    setStreakFreezeDatesState(updated);
    await supabase
      .from('profiles')
      .update({ streak_freeze_dates: updated })
      .eq('user_id', user.id);
  }, [user, streakFreezeDates]);

  const setEmailNotifications = useCallback(async (val: boolean) => {
    setEmailNotificationsState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ email_notifications: val })
      .eq('user_id', user.id);
  }, [user]);

  const setReflectionTone = useCallback(async (val: string) => {
    setReflectionToneState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ reflection_tone: val })
      .eq('user_id', user.id);
  }, [user]);

  const setSilentMode = useCallback(async (val: boolean) => {
    setSilentModeState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ silent_mode: val })
      .eq('user_id', user.id);
  }, [user]);

  const setDigestFrequency = useCallback(async (val: string) => {
    setDigestFrequencyState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ digest_frequency: val })
      .eq('user_id', user.id);
  }, [user]);

  const setCompanionPref = useCallback(async (key: keyof CompanionPrefs, val: boolean) => {
    setCompanionPrefsState((prev) => ({ ...prev, [key]: val }));
    if (!user) return;
    const snakeKey = key === 'zoomOut' ? 'zoom_out' : key;
    const dbKey = `companion_${snakeKey}` as string;
    await supabase
      .from('profiles')
      .update({ [dbKey]: val } as ProfileUpdate)
      .eq('user_id', user.id);
  }, [user]);

  const completeOnboarding = useCallback(async (
    result: { threshold: number; firstName: string | null; timezone: string; motivations: string[]; groundingActivities: string[] },
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

    await supabase
      .from('profiles')
      .update({
        has_onboarded: true,
        threshold: result.threshold,
        first_name: result.firstName,
        timezone: result.timezone,
        motivations: result.motivations.length > 0 ? result.motivations : null,
        grounding_activities: result.groundingActivities.length > 0 ? result.groundingActivities : [],
      })
      .eq('user_id', user.id);
  }, [user]);

  const isInCooldown = useCallback(async () => {
    if (!user) return true;
    const { data } = await supabase
      .from('profiles')
      .select('last_trigger_at')
      .eq('user_id', user.id)
      .single();

    if (!data?.last_trigger_at) return false;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    return Date.now() - new Date(data.last_trigger_at).getTime() < cooldownMs;
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
    await supabase
      .from('profiles')
      .update({ cooldown_hours: val })
      .eq('user_id', user.id);
  }, [user]);

  return {
    threshold,
    setThreshold,
    thresholdDown,
    setThresholdDown,
    cumulativeThreshold,
    setCumulativeThreshold,
    streakFreezeDates,
    useStreakFreeze,
    emailNotifications,
    setEmailNotifications,
    reflectionTone,
    setReflectionTone,
    silentMode,
    setSilentMode,
    cooldownHours,
    setCooldownHours,
    digestFrequency,
    setDigestFrequency,
    customPrompt,
    setCustomPrompt: async (val: string | null) => {
      setCustomPromptState(val);
      if (!user) return;
      await supabase.from('profiles').update({ custom_prompt: val }).eq('user_id', user.id);
    },
    reflectionStyle,
    setReflectionStyle: async (val: string) => {
      setReflectionStyleState(val);
      if (!user) return;
      await supabase.from('profiles').update({ reflection_style: val }).eq('user_id', user.id);
    },
    quietHoursStart,
    quietHoursEnd,
    setQuietHours: async (start: number | null, end: number | null) => {
      setQuietHoursStartState(start);
      setQuietHoursEndState(end);
      if (!user) return;
      await supabase.from('profiles').update({ quiet_hours_start: start, quiet_hours_end: end }).eq('user_id', user.id);
    },
    nightReflectionHour,
    setNightReflectionHour: async (val: number | null) => {
      setNightReflectionHourState(val);
      if (!user) return;
      await supabase.from('profiles').update({ night_reflection_hour: val }).eq('user_id', user.id);
    },
    firstName,
    setFirstName: async (val: string | null) => {
      setFirstNameState(val);
      if (!user) return;
      await supabase.from('profiles').update({ first_name: val }).eq('user_id', user.id);
    },
    aiInsightsEnabled,
    setAiInsightsEnabled: async (val: boolean) => {
      setAiInsightsEnabledState(val);
      if (!user) return;
      await supabase.from('profiles').update({ ai_insights_enabled: val }).eq('user_id', user.id);
    },
    notifyBadges,
    setNotifyBadges: async (val: boolean) => {
      setNotifyBadgesState(val);
      if (!user) return;
      await supabase.from('profiles').update({ notify_badges: val }).eq('user_id', user.id);
    },
    motivations,
    setMotivations: async (val: string[]) => {
      setMotivationsState(val);
      if (!user) return;
      await supabase.from('profiles').update({ motivations: val }).eq('user_id', user.id);
    },
    groundingActivities,
    setGroundingActivities: async (val: string[]) => {
      setGroundingActivitiesState(val);
      if (!user) return;
      await supabase.from('profiles').update({ grounding_activities: val }).eq('user_id', user.id);
    },
    mantra,
    setMantra: async (val: string | null) => {
      setMantraState(val);
      if (!user) return;
      await supabase.from('profiles').update({ mantra: val }).eq('user_id', user.id);
    },
    currency,
    setCurrency: async (val: string) => {
      setCurrencyState(val);
      if (!user) return;
      await supabase.from('profiles').update({ hold_goal_currency: val }).eq('user_id', user.id);
    },
    language,
    setLanguage: async (val: string) => {
      setLanguageState(val);
      if (!user) return;
      await supabase.from('profiles').update({ language: val }).eq('user_id', user.id);
    },
    companionPrefs,
    setCompanionPref,
    profileLoaded,
    hasOnboarded,
    completeOnboarding,
    isInCooldown,
    isInQuietHours,
    _profileLoadReflectionData,
  };
}
