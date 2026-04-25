import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export const HOLD_GOAL_QUERY_KEY = (userId: string) => ['profile-hold-goal', userId] as const;

export interface HoldGoalProfile {
  type: string | null;
  targetMonths: number | null;
  targetPrice: number | null;
  start: string | null;
}

/**
 * Hold-goal row fields used for stats alignment. Shared by Journey (Profile) and
 * Home’s compact score so the Holzen number matches the full Stats tab.
 */
export function useHoldGoalProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: user ? HOLD_GOAL_QUERY_KEY(user.id) : ['profile-hold-goal', 'none'],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<HoldGoalProfile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('hold_goal_type, hold_goal_target_months, hold_goal_target_price, hold_goal_start')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        throw error;
      }
      if (!data) return null;
      return {
        type: data.hold_goal_type,
        targetMonths: data.hold_goal_target_months,
        targetPrice: data.hold_goal_target_price,
        start: data.hold_goal_start,
      };
    },
  });
}
