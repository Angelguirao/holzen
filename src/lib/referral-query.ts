import { supabase } from '@/integrations/supabase/client';

export interface ReferralGrantedRewardRow {
  milestone: number;
  reward_type: string;
  granted_at: string;
}

export const REFERRALS_COUNT_NONE_QUERY_KEY = ['referrals-count', 'none'] as const;

export function referralsCountQueryKey(userId: string) {
  return ['referrals-count', userId] as const;
}

export const REFERRAL_REWARDS_NONE_QUERY_KEY = ['referral-rewards', 'none'] as const;

export function referralRewardsQueryKey(userId: string) {
  return ['referral-rewards', userId] as const;
}

export async function fetchReferralsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', userId);
  if (error) throw error;
  return count ?? 0;
}

export async function fetchReferralRewards(userId: string): Promise<ReferralGrantedRewardRow[]> {
  const { data: rewards, error } = await supabase
    .from('referral_rewards')
    .select('milestone, reward_type, granted_at')
    .eq('user_id', userId);
  if (error) throw error;
  return (rewards ?? []) as ReferralGrantedRewardRow[];
}

export function getReferralsCountQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? referralsCountQueryKey(userId) : REFERRALS_COUNT_NONE_QUERY_KEY,
    queryFn: () => fetchReferralsCount(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}

export function getReferralRewardsQueryOptions(userId: string | undefined) {
  return {
    queryKey: userId ? referralRewardsQueryKey(userId) : REFERRAL_REWARDS_NONE_QUERY_KEY,
    queryFn: () => fetchReferralRewards(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
