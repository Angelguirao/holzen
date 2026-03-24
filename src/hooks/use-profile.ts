import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { CompanionPrefs } from '@/components/CompanionSection';

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
  const [companionPrefs, setCompanionPrefsState] = useState<CompanionPrefs>({ breathing: true, haiku: true, learning: true, signal: true, zoomOut: true, history: true });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(true);

  const [_profileLoadReflectionData, setProfileLoadReflectionData] = useState<ProfileLoadReflectionData | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('threshold, threshold_down, cumulative_threshold, last_message, last_context, email_notifications, has_onboarded, companion_breathing, companion_haiku, companion_learning, companion_signal, companion_zoom_out, companion_history, reflection_tone, cooldown_hours, last_trigger_at, silent_mode, streak_freeze_dates, digest_frequency, custom_prompt, reflection_style, quiet_hours_start, quiet_hours_end, first_name, night_reflection_hour, ai_insights_enabled, ritual_template, notify_badges, motivations, mantra, hold_goal_currency, language, grounding_activities')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setThresholdState(data.threshold);
        setThresholdDownState((data as any).threshold_down ?? data.threshold);
        setCumulativeThresholdState(data.cumulative_threshold ?? 15);
        setStreakFreezeDatesState((data as any).streak_freeze_dates ?? []);
        setEmailNotificationsState(data.email_notifications ?? true);
        setReflectionToneState((data as any).reflection_tone ?? 'stoic');
        setCooldownHoursState((data as any).cooldown_hours ?? 6);
        setSilentModeState((data as any).silent_mode ?? false);
        setDigestFrequencyState((data as any).digest_frequency ?? 'weekly');
        setCustomPromptState((data as any).custom_prompt ?? null);
        setReflectionStyleState((data as any).reflection_style ?? 'standard');
        setQuietHoursStartState((data as any).quiet_hours_start ?? null);
        setQuietHoursEndState((data as any).quiet_hours_end ?? null);
        setFirstNameState((data as any).first_name ?? null);
        setNightReflectionHourState((data as any).night_reflection_hour ?? 21);
        setAiInsightsEnabledState((data as any).ai_insights_enabled ?? true);
        setNotifyBadgesState((data as any).notify_badges ?? true);
        setMotivationsState((data as any).motivations ?? []);
        setMantraState((data as any).mantra ?? null);
        setCurrencyState((data as any).hold_goal_currency ?? 'USD');
        setLanguageState((data as any).language ?? 'en');
        setGroundingActivitiesState((data as any).grounding_activities ?? []);
        setHasOnboarded(data.has_onboarded ?? false);
        setCompanionPrefsState({
          breathing: data.companion_breathing ?? true,
          haiku: data.companion_haiku ?? true,
          learning: data.companion_learning ?? true,
          signal: (data as any).companion_signal ?? true,
          zoomOut: (data as any).companion_zoom_out ?? true,
          history: (data as any).companion_history ?? true,
        });

        setProfileLoadReflectionData({
          lastMessage: data.last_message ?? null,
          lastContext: data.last_context ?? null,
          lastTriggerAt: (data as any).last_trigger_at ?? null,
        });
      }
      setProfileLoaded(true);
    };
    load();
  }, [user]);

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
      .update({ threshold_down: val } as any)
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
      .update({ streak_freeze_dates: updated } as any)
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
      .update({ reflection_tone: val } as any)
      .eq('user_id', user.id);
  }, [user]);

  const setSilentMode = useCallback(async (val: boolean) => {
    setSilentModeState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ silent_mode: val } as any)
      .eq('user_id', user.id);
  }, [user]);

  const setDigestFrequency = useCallback(async (val: string) => {
    setDigestFrequencyState(val);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ digest_frequency: val } as any)
      .eq('user_id', user.id);
  }, [user]);

  const setCompanionPref = useCallback(async (key: keyof CompanionPrefs, val: boolean) => {
    setCompanionPrefsState((prev) => ({ ...prev, [key]: val }));
    if (!user) return;
    const snakeKey = key === 'zoomOut' ? 'zoom_out' : key;
    const dbKey = `companion_${snakeKey}` as string;
    await supabase
      .from('profiles')
      .update({ [dbKey]: val } as Record<string, boolean>)
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
      } as any)
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
      .update({ cooldown_hours: val } as any)
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
      await supabase.from('profiles').update({ custom_prompt: val } as any).eq('user_id', user.id);
    },
    reflectionStyle,
    setReflectionStyle: async (val: string) => {
      setReflectionStyleState(val);
      if (!user) return;
      await supabase.from('profiles').update({ reflection_style: val } as any).eq('user_id', user.id);
    },
    quietHoursStart,
    quietHoursEnd,
    setQuietHours: async (start: number | null, end: number | null) => {
      setQuietHoursStartState(start);
      setQuietHoursEndState(end);
      if (!user) return;
      await supabase.from('profiles').update({ quiet_hours_start: start, quiet_hours_end: end } as any).eq('user_id', user.id);
    },
    nightReflectionHour,
    setNightReflectionHour: async (val: number | null) => {
      setNightReflectionHourState(val);
      if (!user) return;
      await supabase.from('profiles').update({ night_reflection_hour: val } as any).eq('user_id', user.id);
    },
    firstName,
    setFirstName: async (val: string | null) => {
      setFirstNameState(val);
      if (!user) return;
      await supabase.from('profiles').update({ first_name: val } as any).eq('user_id', user.id);
    },
    aiInsightsEnabled,
    setAiInsightsEnabled: async (val: boolean) => {
      setAiInsightsEnabledState(val);
      if (!user) return;
      await supabase.from('profiles').update({ ai_insights_enabled: val } as any).eq('user_id', user.id);
    },
    notifyBadges,
    setNotifyBadges: async (val: boolean) => {
      setNotifyBadgesState(val);
      if (!user) return;
      await supabase.from('profiles').update({ notify_badges: val } as any).eq('user_id', user.id);
    },
    motivations,
    setMotivations: async (val: string[]) => {
      setMotivationsState(val);
      if (!user) return;
      await supabase.from('profiles').update({ motivations: val } as any).eq('user_id', user.id);
    },
    groundingActivities,
    setGroundingActivities: async (val: string[]) => {
      setGroundingActivitiesState(val);
      if (!user) return;
      await supabase.from('profiles').update({ grounding_activities: val } as any).eq('user_id', user.id);
    },
    mantra,
    setMantra: async (val: string | null) => {
      setMantraState(val);
      if (!user) return;
      await supabase.from('profiles').update({ mantra: val } as any).eq('user_id', user.id);
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
      await supabase.from('profiles').update({ language: val } as any).eq('user_id', user.id);
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
