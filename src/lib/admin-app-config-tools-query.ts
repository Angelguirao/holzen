import { supabase } from '@/integrations/supabase/client';
import {
  mergePregenerateCacheTopup,
  type PregenerateCacheTopupConfig,
} from '../../supabase/functions/_shared/pregenerate-cache-topup-config.ts';

export const FEATURE_KEYS = [
  'wallpaper',
  'letters',
  'nudges',
  'digest',
  'reports',
  'night_reflection',
  'reflection_insights',
  'suggest_ritual',
  'suggest_grounding',
  'journal_prompt',
  'pregenerate',
  'fetch_source_feeds',
  'grounding_enrich',
  'admin_library_preview',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export type ConfigState = {
  signups_enabled: boolean;
  signups_max_per_day: number | null;
  budget_daily_usd_global: number;
  budget_daily_usd_per_user: number;
  budget_monthly_usd_global: number;
  panic_mode: boolean;
  feature_flags: Record<string, boolean>;
  pregenerate_cache_topup: PregenerateCacheTopupConfig;
  ai_cost_alert_enabled: boolean;
  ai_cost_alert_recipients: string[];
  ai_cost_alert_daily_threshold_pct: number;
  ai_cost_alert_wow_multiplier: number;
};

export const DEFAULTS: ConfigState = {
  signups_enabled: true,
  signups_max_per_day: null,
  budget_daily_usd_global: 60,
  budget_daily_usd_per_user: 2.5,
  budget_monthly_usd_global: 1800,
  panic_mode: false,
  feature_flags: Object.fromEntries(FEATURE_KEYS.map((k) => [k, true])),
  pregenerate_cache_topup: mergePregenerateCacheTopup(null),
  ai_cost_alert_enabled: true,
  ai_cost_alert_recipients: [],
  ai_cost_alert_daily_threshold_pct: 70,
  ai_cost_alert_wow_multiplier: 1.8,
};

export type SpendSnapshot = {
  dailyGlobal: number | null;
  monthlyGlobal: number | null;
};

async function loadConfig(): Promise<ConfigState> {
  const { data, error } = await supabase
    .from('app_config' as never)
    .select('key, value');

  if (error || !data) return { ...DEFAULTS };

  const next: ConfigState = {
    ...DEFAULTS,
    feature_flags: { ...DEFAULTS.feature_flags },
  };

  for (const row of data as Array<{ key: string; value: unknown }>) {
    switch (row.key) {
      case 'signups_enabled':
        next.signups_enabled = row.value !== false && row.value !== 'false';
        break;
      case 'signups_max_per_day':
        next.signups_max_per_day =
          row.value === null || row.value === undefined ? null : Number(row.value) || null;
        break;
      case 'budget_daily_usd_global':
        next.budget_daily_usd_global = Number(row.value) || DEFAULTS.budget_daily_usd_global;
        break;
      case 'budget_daily_usd_per_user':
        next.budget_daily_usd_per_user = Number(row.value) || DEFAULTS.budget_daily_usd_per_user;
        break;
      case 'budget_monthly_usd_global':
        next.budget_monthly_usd_global = Number(row.value) || DEFAULTS.budget_monthly_usd_global;
        break;
      case 'panic_mode':
        next.panic_mode = row.value === true || row.value === 'true';
        break;
      case 'feature_flags':
        if (row.value && typeof row.value === 'object' && !Array.isArray(row.value)) {
          next.feature_flags = { ...next.feature_flags, ...(row.value as Record<string, boolean>) };
        }
        break;
      case 'ai_cost_alert_enabled':
        next.ai_cost_alert_enabled = row.value !== false && row.value !== 'false';
        break;
      case 'ai_cost_alert_recipients':
        if (Array.isArray(row.value)) {
          next.ai_cost_alert_recipients = (row.value as unknown[])
            .map((v) => (typeof v === 'string' ? v.trim() : ''))
            .filter((s) => s.length > 0);
        }
        break;
      case 'ai_cost_alert_daily_threshold_pct':
        next.ai_cost_alert_daily_threshold_pct =
          Number(row.value) || DEFAULTS.ai_cost_alert_daily_threshold_pct;
        break;
      case 'ai_cost_alert_wow_multiplier':
        next.ai_cost_alert_wow_multiplier =
          Number(row.value) || DEFAULTS.ai_cost_alert_wow_multiplier;
        break;
      case 'pregenerate_cache_topup':
        next.pregenerate_cache_topup = mergePregenerateCacheTopup(row.value);
        break;
    }
  }
  return next;
}

async function loadSpendSnapshot(): Promise<SpendSnapshot> {
  const [dailyRes, monthlyRes] = (await Promise.all([
    supabase.from('v_ai_spend_today_global' as never).select('total_usd').maybeSingle(),
    supabase.from('v_ai_spend_month_global' as never).select('total_usd').maybeSingle(),
  ])) as unknown as Array<{ data: { total_usd: number } | null; error: unknown }>;
  const dailyGlobal =
    dailyRes.error || !dailyRes.data ? null : Number(dailyRes.data.total_usd);
  const monthlyGlobal =
    monthlyRes.error || !monthlyRes.data ? null : Number(monthlyRes.data.total_usd);
  return {
    dailyGlobal: Number.isFinite(dailyGlobal) ? dailyGlobal : null,
    monthlyGlobal: Number.isFinite(monthlyGlobal) ? monthlyGlobal : null,
  };
}

export const ADMIN_APP_CONFIG_TOOLS_QUERY_PREFIX = ['admin', 'app-config-tools'] as const;

export const ADMIN_APP_CONFIG_TOOLS_QUERY_LEAF = 'bundle' as const;

export const ADMIN_APP_CONFIG_TOOLS_QUERY_KEY = [
  ...ADMIN_APP_CONFIG_TOOLS_QUERY_PREFIX,
  ADMIN_APP_CONFIG_TOOLS_QUERY_LEAF,
] as const;

export async function fetchAppConfigToolsBundle(): Promise<{
  config: ConfigState;
  spend: SpendSnapshot;
}> {
  const [config, spend] = await Promise.all([loadConfig(), loadSpendSnapshot()]);
  return { config, spend };
}

export function getAdminAppConfigToolsQueryOptions() {
  return {
    queryKey: ADMIN_APP_CONFIG_TOOLS_QUERY_KEY,
    queryFn: fetchAppConfigToolsBundle,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  } as const;
}
