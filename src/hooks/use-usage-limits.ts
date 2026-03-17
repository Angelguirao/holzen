import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const LIMITS = {
  /** Max pauses per day for Pro users */
  dailyPauseCap: 10,
  /** Max wallpaper generations per calendar month for Pro users */
  monthlyWallpaperCap: 5,
} as const;

export function useUsageLimits() {
  const [checking, setChecking] = useState(false);

  const getPausesToday = useCallback(async (userId: string): Promise<number> => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event', 'pause_ai_call')
      .gte('created_at', todayStart.toISOString());
    return count ?? 0;
  }, []);

  const getWallpapersThisMonth = useCallback(async (userId: string): Promise<number> => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('event', 'wallpaper_generation')
      .gte('created_at', monthStart.toISOString());
    return count ?? 0;
  }, []);

  const checkPauseLimit = useCallback(async (userId: string): Promise<{ allowed: boolean; used: number; limit: number }> => {
    setChecking(true);
    try {
      const used = await getPausesToday(userId);
      return { allowed: used < LIMITS.dailyPauseCap, used, limit: LIMITS.dailyPauseCap };
    } finally {
      setChecking(false);
    }
  }, [getPausesToday]);

  const checkWallpaperLimit = useCallback(async (userId: string): Promise<{ allowed: boolean; used: number; limit: number }> => {
    setChecking(true);
    try {
      const used = await getWallpapersThisMonth(userId);
      return { allowed: used < LIMITS.monthlyWallpaperCap, used, limit: LIMITS.monthlyWallpaperCap };
    } finally {
      setChecking(false);
    }
  }, [getWallpapersThisMonth]);

  const trackUsage = useCallback(async (userId: string, event: 'pause_ai_call' | 'wallpaper_generation') => {
    await supabase.from('analytics_events').insert({ user_id: userId, event });
  }, []);

  return { checkPauseLimit, checkWallpaperLimit, trackUsage, checking };
}
