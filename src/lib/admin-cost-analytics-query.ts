import { supabase } from '@/integrations/supabase/client';
import type { TimePeriod } from '@/lib/admin-stats-bundle-query';
import { PRICING } from '@/lib/pricing';

/** Raw rows for admin cost aggregation (`generation_attempts`). */
export interface AttemptRow {
  companion_type: string | null;
  user_id: string | null;
  estimated_cost_usd: number | null;
  created_at: string;
}

function periodStart(period: TimePeriod): Date {
  const now = new Date();
  switch (period) {
    case 'today': {
      const d = new Date(now);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
    case '7d':
      return new Date(now.getTime() - 7 * 86_400_000);
    case '30d':
      return new Date(now.getTime() - 30 * 86_400_000);
    case 'all':
    default:
      return new Date(0);
  }
}

export async function fetchGenerationAttemptsForPeriod(
  period: TimePeriod,
): Promise<AttemptRow[]> {
  const sinceIso = periodStart(period).toISOString();
  const { data, error } = await supabase
    .from('generation_attempts')
    .select('companion_type, user_id, estimated_cost_usd, created_at')
    .gte('created_at', sinceIso)
    .not('estimated_cost_usd', 'is', null)
    .limit(50_000);
  if (error || !data) return [];
  return data as AttemptRow[];
}

export function adminCostGenerationAttemptsQueryKey(period: TimePeriod) {
  return ['admin', 'cost', 'generation-attempts', period] as const;
}

export function getAdminCostGenerationAttemptsQueryOptions(period: TimePeriod) {
  return {
    queryKey: adminCostGenerationAttemptsQueryKey(period),
    queryFn: () => fetchGenerationAttemptsForPeriod(period),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  } as const;
}

/** Parallel cache when UI period ≠ 7d but projected monthly still needs a 7d slice. */
export function getAdminCostGenerationAttempts7dShadowQueryOptions(
  selectedPeriod: TimePeriod,
) {
  return {
    queryKey: adminCostGenerationAttemptsQueryKey('7d'),
    queryFn: () => fetchGenerationAttemptsForPeriod('7d'),
    enabled: selectedPeriod !== '7d',
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  } as const;
}

export interface MrrSnapshot {
  activeSubscribers: number;
  mrrUsd: number;
  mtdCostUsd: number;
  ratio: number | null;
}

export const ADMIN_COST_MRR_SNAPSHOT_QUERY_KEY = ['admin', 'cost', 'mrr-snapshot'] as const;

export async function fetchCostAnalyticsMrrSnapshot(): Promise<MrrSnapshot> {
  const { count: activeCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('subscription_status', ['active', 'trialing']);

  const active = activeCount ?? 0;
  const mrrUsd = active * PRICING.monthlyPrice;

  const { data: mtdRow } = await supabase
    .from('v_ai_spend_month_global' as never)
    .select('total_usd')
    .maybeSingle();
  const mtdCostUsd =
    mtdRow == null ? 0 : Number((mtdRow as { total_usd: number }).total_usd) || 0;

  const ratio = mrrUsd > 0 ? mtdCostUsd / mrrUsd : null;
  return { activeSubscribers: active, mrrUsd, mtdCostUsd, ratio };
}

export function getAdminCostMrrSnapshotQueryOptions() {
  return {
    queryKey: ADMIN_COST_MRR_SNAPSHOT_QUERY_KEY,
    queryFn: fetchCostAnalyticsMrrSnapshot,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  } as const;
}
