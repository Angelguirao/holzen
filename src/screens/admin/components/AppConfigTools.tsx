/**
 * Admin panel: runtime guardrails for AI spend, feature flags, signup gate.
 *
 * Source of truth is the `app_config` table (see
 * `supabase/migrations/20260419120000_app_config.sql`). All changes are
 * picked up by edge functions within ~30 seconds (per-instance TTL cache
 * in `supabase/functions/_shared/app-config.ts`).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, DollarSign, Loader2, Mail, Power, RefreshCw, Save, Users, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DevModeToggle } from '@/screens/admin/components/DevModeToggle';
import { StripePriceCheck } from '@/screens/admin/components/StripePriceCheck';
import {
  mergePregenerateCacheTopup,
  type PregenerateCacheTopupKey,
} from '../../../../supabase/functions/_shared/pregenerate-cache-topup-config.ts';
import {
  ADMIN_APP_CONFIG_TOOLS_QUERY_KEY,
  DEFAULTS,
  FEATURE_KEYS,
  getAdminAppConfigToolsQueryOptions,
  type ConfigState,
  type FeatureKey,
  type SpendSnapshot,
} from '@/lib/admin-app-config-tools-query';

const PREGENERATE_TOPUP_KEYS: PregenerateCacheTopupKey[] = [
  'ground_nudge',
  'signal',
  'historical_insight',
  'zoom_out_deep_time',
];

const PREGENERATE_TOPUP_LABELS: Record<PregenerateCacheTopupKey, string> = {
  ground_nudge: 'Grounding',
  signal: 'Signal',
  historical_insight: 'History',
  zoom_out_deep_time: 'Zoom out (deep time)',
};

async function saveRow(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from('app_config' as never)
    .upsert({ key, value } as never, { onConflict: 'key' } as never);
  if (error) throw error;
}

export function AppConfigTools() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [state, setState] = useState<ConfigState>(DEFAULTS);
  const [initial, setInitial] = useState<ConfigState>(DEFAULTS);
  const [spend, setSpend] = useState<SpendSnapshot>({ dailyGlobal: null, monthlyGlobal: null });
  const [saving, setSaving] = useState<Set<string>>(() => new Set());

  const { data, isPending, isFetching, isError, refetch } = useQuery(
    getAdminAppConfigToolsQueryOptions(),
  );

  const loading = isPending || isFetching;

  useEffect(() => {
    if (!data) return;
    setState(data.config);
    setInitial(data.config);
    setSpend(data.spend);
  }, [data]);

  useEffect(() => {
    if (!isError) return;
    toast({ title: 'Failed to load config', variant: 'destructive' });
  }, [isError, toast]);

  const refresh = useCallback(() => refetch(), [refetch]);

  const syncBundleQueryCache = useCallback(
    (nextConfig: ConfigState) => {
      queryClient.setQueryData<{ config: ConfigState; spend: SpendSnapshot }>(
        ADMIN_APP_CONFIG_TOOLS_QUERY_KEY,
        (prev) => ({
          config: nextConfig,
          spend: prev?.spend ?? { dailyGlobal: null, monthlyGlobal: null },
        }),
      );
    },
    [queryClient],
  );

  const mark = (k: string, busy: boolean) =>
    setSaving((prev) => {
      const next = new Set(prev);
      if (busy) next.add(k); else next.delete(k);
      return next;
    });

  const persist = useCallback(async (key: string, value: unknown, optimistic: ConfigState) => {
    mark(key, true);
    try {
      await saveRow(key, value);
      setInitial(optimistic);
      syncBundleQueryCache(optimistic);
      toast({ title: 'Saved', description: key });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'save failed';
      toast({ title: 'Save failed', description: msg, variant: 'destructive' });
      setState(initial);
    } finally {
      mark(key, false);
    }
  }, [initial, toast, syncBundleQueryCache]);

  const signupsDirty = state.signups_enabled !== initial.signups_enabled
    || state.signups_max_per_day !== initial.signups_max_per_day;
  const budgetDirty =
    state.budget_daily_usd_global !== initial.budget_daily_usd_global
    || state.budget_daily_usd_per_user !== initial.budget_daily_usd_per_user
    || state.budget_monthly_usd_global !== initial.budget_monthly_usd_global;
  const alertsDirty =
    state.ai_cost_alert_enabled !== initial.ai_cost_alert_enabled
    || state.ai_cost_alert_recipients.join(',') !== initial.ai_cost_alert_recipients.join(',')
    || state.ai_cost_alert_daily_threshold_pct !== initial.ai_cost_alert_daily_threshold_pct
    || state.ai_cost_alert_wow_multiplier !== initial.ai_cost_alert_wow_multiplier;
  const pregenerateTopupDirty =
    JSON.stringify(state.pregenerate_cache_topup) !== JSON.stringify(initial.pregenerate_cache_topup);

  const dailyPct = useMemo(() => {
    if (spend.dailyGlobal === null) return null;
    return Math.min(100, Math.round((spend.dailyGlobal / state.budget_daily_usd_global) * 100));
  }, [spend.dailyGlobal, state.budget_daily_usd_global]);
  const monthlyPct = useMemo(() => {
    if (spend.monthlyGlobal === null) return null;
    return Math.min(100, Math.round((spend.monthlyGlobal / state.budget_monthly_usd_global) * 100));
  }, [spend.monthlyGlobal, state.budget_monthly_usd_global]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Spend snapshot ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Spend today
          </p>
          <button
            onClick={() => void refresh()}
            className="flex items-center gap-1 text-[10px] font-sans font-medium text-muted-foreground/50 hover:text-nox-text-link"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <BudgetStat
            label="Daily global"
            spend={spend.dailyGlobal}
            cap={state.budget_daily_usd_global}
            pct={dailyPct}
          />
          <BudgetStat
            label="Monthly global"
            spend={spend.monthlyGlobal}
            cap={state.budget_monthly_usd_global}
            pct={monthlyPct}
          />
        </div>
        <p className="text-[9px] font-mono text-muted-foreground/40 leading-relaxed">
          Totals from <code className="text-muted-foreground/55">generation_attempts.estimated_cost_usd</code>.
          Excludes AI functions that don&apos;t yet log attempts (wallpaper, weekly-digest,
          monthly-report, admin-library-preview) — guards still fire but the totals here
          under-report until logging is backfilled in the follow-up PR.
        </p>
      </section>

      {/* ── Panic mode ── */}
      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Panic mode
        </p>
        <button
          onClick={() => {
            const next = !state.panic_mode;
            const optimistic = { ...state, panic_mode: next };
            if (next && !window.confirm('Enable panic mode? All companion AI will be bypassed until you turn this off. Reflection and all non-companion features continue to run.')) return;
            setState(optimistic);
            void persist('panic_mode', next, optimistic);
          }}
          disabled={saving.has('panic_mode')}
          className={`w-full rounded-xl border px-4 py-3 flex items-center gap-3 transition-all ${
            state.panic_mode
              ? 'border-destructive/60 bg-destructive/15'
              : 'border-border/20 bg-card/10 hover:bg-card/20'
          }`}
        >
          <Power
            className={`h-3.5 w-3.5 ${state.panic_mode ? 'text-destructive' : 'text-muted-foreground/30'}`}
          />
          <div className="flex-1 text-left">
            <p
              className={`text-[10px] font-mono ${state.panic_mode ? 'text-destructive' : 'text-foreground/60'}`}
            >
              {state.panic_mode ? 'PANIC MODE ACTIVE' : 'Panic mode'}
            </p>
            <p className="text-[9px] text-muted-foreground/40">
              Bypasses all companion AI. Reflection still runs (~$0.001/call). Use when unit economics
              go sideways or a provider is misbehaving.
            </p>
          </div>
          {saving.has('panic_mode') ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40" />
          ) : (
            <span
              className={`text-[9px] font-mono ${state.panic_mode ? 'text-destructive' : 'text-muted-foreground/30'}`}
            >
              {state.panic_mode ? 'ON' : 'OFF'}
            </span>
          )}
        </button>
      </section>

      {/* ── Signup gate ── */}
      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Signup gate
        </p>
        <div className="rounded-xl border border-border/20 bg-card/10 p-4 space-y-3">
          <ToggleRow
            icon={Users}
            label="Accept new signups"
            description="Master on/off. When off, signup form shows a pause message."
            checked={state.signups_enabled}
            onChange={(v) => setState((s) => ({ ...s, signups_enabled: v }))}
          />
          <NumberRow
            label="Max signups per UTC day"
            description="Blank = unlimited. Useful during viral spikes."
            value={state.signups_max_per_day}
            onChange={(v) => setState((s) => ({ ...s, signups_max_per_day: v }))}
          />
          <SaveRow
            dirty={signupsDirty}
            busy={saving.has('signups_enabled') || saving.has('signups_max_per_day')}
            onSave={async () => {
              const snapshot = { ...state };
              await Promise.all([
                persist('signups_enabled', state.signups_enabled, snapshot),
                persist(
                  'signups_max_per_day',
                  state.signups_max_per_day === null ? null : state.signups_max_per_day,
                  snapshot,
                ),
              ]);
            }}
          />
        </div>
      </section>

      {/* ── Cost ceilings ── */}
      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Cost ceilings
        </p>
        <div className="rounded-xl border border-border/20 bg-card/10 p-4 space-y-3">
          <NumberRow
            label="Daily global cap (USD)"
            icon={DollarSign}
            description="Sum of estimated_cost_usd per UTC day. Edge functions return 503 when exceeded."
            value={state.budget_daily_usd_global}
            onChange={(v) => setState((s) => ({ ...s, budget_daily_usd_global: v ?? DEFAULTS.budget_daily_usd_global }))}
            min={0}
            step={0.5}
          />
          <NumberRow
            label="Daily per-user cap (USD)"
            description="Abuse backstop. Typical users never approach this."
            value={state.budget_daily_usd_per_user}
            onChange={(v) => setState((s) => ({ ...s, budget_daily_usd_per_user: v ?? DEFAULTS.budget_daily_usd_per_user }))}
            min={0}
            step={0.1}
          />
          <NumberRow
            label="Monthly global cap (USD)"
            description="Long horizon guardrail. Raise before you hit it, not after."
            value={state.budget_monthly_usd_global}
            onChange={(v) => setState((s) => ({ ...s, budget_monthly_usd_global: v ?? DEFAULTS.budget_monthly_usd_global }))}
            min={0}
            step={10}
          />
          <SaveRow
            dirty={budgetDirty}
            busy={saving.has('budget_daily_usd_global') || saving.has('budget_daily_usd_per_user') || saving.has('budget_monthly_usd_global')}
            onSave={async () => {
              const snapshot = { ...state };
              await Promise.all([
                persist('budget_daily_usd_global', state.budget_daily_usd_global, snapshot),
                persist('budget_daily_usd_per_user', state.budget_daily_usd_per_user, snapshot),
                persist('budget_monthly_usd_global', state.budget_monthly_usd_global, snapshot),
              ]);
            }}
          />
        </div>
      </section>

      {/* ── Pregenerate cache top-up (pregenerate-companions cron) ── */}
      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Pregenerate cache top-up
        </p>
        <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
          Targets for the scheduled <code className="text-muted-foreground/55">pregenerate-companions</code> job.
          Each type: minimum &quot;healthy&quot; rows (quality ≥ 2, not expired) before the cron skips generation;
          max rows to add per run caps API spend. Picked up by edge within ~30s. Set max to 0 to disable top-up for that type.
        </p>
        <div className="rounded-xl border border-border/20 bg-card/10 p-4 space-y-4">
          {PREGENERATE_TOPUP_KEYS.map((key) => (
            <div key={key} className="space-y-2 pb-3 border-b border-border/10 last:border-0 last:pb-0">
              <p className="text-[10px] font-mono text-foreground/70">{PREGENERATE_TOPUP_LABELS[key]}</p>
              <p className="text-[9px] font-mono text-muted-foreground/35 -mt-0.5">{key}</p>
              <NumberRow
                label="Min healthy rows"
                description="Count en rows with quality ≥ 2 and not expired. Below this, cron may add up to max per run."
                value={state.pregenerate_cache_topup[key].minHealthyRows}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    pregenerate_cache_topup: {
                      ...s.pregenerate_cache_topup,
                      [key]: {
                        ...s.pregenerate_cache_topup[key],
                        minHealthyRows: v === null || v === undefined ? 0 : Math.max(0, v),
                      },
                    },
                  }))
                }
                min={0}
                step={1}
              />
              <NumberRow
                label="Max per cron run"
                description="Cap new rows per invocation for this type (0 = never generate)."
                value={state.pregenerate_cache_topup[key].maxGeneratePerRun}
                onChange={(v) =>
                  setState((s) => ({
                    ...s,
                    pregenerate_cache_topup: {
                      ...s.pregenerate_cache_topup,
                      [key]: {
                        ...s.pregenerate_cache_topup[key],
                        maxGeneratePerRun: v === null || v === undefined ? 0 : Math.max(0, v),
                      },
                    },
                  }))
                }
                min={0}
                step={1}
              />
            </div>
          ))}
          <SaveRow
            dirty={pregenerateTopupDirty}
            busy={saving.has('pregenerate_cache_topup')}
            onSave={async () => {
              const merged = mergePregenerateCacheTopup(state.pregenerate_cache_topup);
              const snapshot = { ...state, pregenerate_cache_topup: merged };
              setState(snapshot);
              await persist('pregenerate_cache_topup', merged, snapshot);
            }}
          />
        </div>
      </section>

      {/* ── Cost alert email ── */}
      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Daily cost alert email
        </p>
        <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
          <code className="text-muted-foreground/55">ai-cost-alert</code> runs daily (cron scheduled
          separately — see deployment notes). Emails recipients when yesterday&apos;s spend crosses
          the threshold, anomalies vs 7-day average, or month-to-date projection exceeds the
          monthly cap. Empty recipient list = no email sent.
        </p>
        <div className="rounded-xl border border-border/20 bg-card/10 p-4 space-y-3">
          <ToggleRow
            icon={Mail}
            label="Alert email enabled"
            description="Master switch. When off, the cron runs but sends nothing."
            checked={state.ai_cost_alert_enabled}
            onChange={(v) => setState((s) => ({ ...s, ai_cost_alert_enabled: v }))}
          />
          <div className="flex items-start gap-3">
            <span className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-foreground/80">Recipient emails</p>
              <p className="text-[9px] text-muted-foreground/40 leading-relaxed">
                Comma-separated. Only these addresses receive alerts.
              </p>
              <input
                type="text"
                value={state.ai_cost_alert_recipients.join(', ')}
                placeholder="ops@example.com, ceo@example.com"
                onChange={(e) => {
                  const list = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                  setState((s) => ({ ...s, ai_cost_alert_recipients: list }));
                }}
                className="w-full mt-1.5 text-[10px] font-mono bg-muted/30 border border-border/20 rounded px-2 py-1.5 focus:outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <NumberRow
            label="Daily threshold (% of daily cap)"
            description="Alert when yesterday's spend exceeds this % of the daily global cap."
            value={state.ai_cost_alert_daily_threshold_pct}
            onChange={(v) =>
              setState((s) => ({
                ...s,
                ai_cost_alert_daily_threshold_pct: v ?? DEFAULTS.ai_cost_alert_daily_threshold_pct,
              }))
            }
            min={0}
            step={5}
          />
          <NumberRow
            label="WoW anomaly multiplier"
            description="Alert when yesterday ≥ this × the 7-day average. 1.8 = material overnight jump."
            value={state.ai_cost_alert_wow_multiplier}
            onChange={(v) =>
              setState((s) => ({
                ...s,
                ai_cost_alert_wow_multiplier: v ?? DEFAULTS.ai_cost_alert_wow_multiplier,
              }))
            }
            min={1}
            step={0.1}
          />
          <SaveRow
            dirty={alertsDirty}
            busy={
              saving.has('ai_cost_alert_enabled')
              || saving.has('ai_cost_alert_recipients')
              || saving.has('ai_cost_alert_daily_threshold_pct')
              || saving.has('ai_cost_alert_wow_multiplier')
            }
            onSave={async () => {
              const snapshot = { ...state };
              await Promise.all([
                persist('ai_cost_alert_enabled', state.ai_cost_alert_enabled, snapshot),
                persist('ai_cost_alert_recipients', state.ai_cost_alert_recipients, snapshot),
                persist(
                  'ai_cost_alert_daily_threshold_pct',
                  state.ai_cost_alert_daily_threshold_pct,
                  snapshot,
                ),
                persist('ai_cost_alert_wow_multiplier', state.ai_cost_alert_wow_multiplier, snapshot),
              ]);
            }}
          />
        </div>
      </section>

      {/* ── Feature flags ── */}
      <section className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
          Feature flags
        </p>
        <p className="text-[9px] font-mono text-muted-foreground/45 leading-relaxed">
          Per-feature AI on/off. Panic mode overrides the companion-related flags regardless.
          Disabling a feature returns the feature&apos;s natural fallback (canned template, cached
          text, silent no-op for cron emails) — not a user-visible error.
        </p>
        <div className="rounded-xl border border-border/20 bg-card/10 p-4 space-y-2">
          {FEATURE_KEYS.map((k) => (
            <FeatureFlagRow
              key={k}
              featureKey={k}
              checked={state.feature_flags[k] !== false}
              busy={saving.has(`feature:${k}`)}
              onChange={async (v) => {
                const nextFlags = { ...state.feature_flags, [k]: v };
                const optimistic = { ...state, feature_flags: nextFlags };
                setState(optimistic);
                mark(`feature:${k}`, true);
                try {
                  await saveRow('feature_flags', nextFlags);
                  setInitial(optimistic);
                  syncBundleQueryCache(optimistic);
                  toast({ title: 'Saved', description: `feature:${k}` });
                } catch (e) {
                  const msg = e instanceof Error ? e.message : 'save failed';
                  toast({ title: 'Save failed', description: msg, variant: 'destructive' });
                  setState(initial);
                } finally {
                  mark(`feature:${k}`, false);
                }
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Dev tools (existing) ── */}
      <section>
        <DevModeToggle />
      </section>

      {/* ── Stripe price ID validation ── */}
      <section>
        <StripePriceCheck />
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function BudgetStat({
  label,
  spend,
  cap,
  pct,
}: {
  label: string;
  spend: number | null;
  cap: number;
  pct: number | null;
}) {
  const alert = pct !== null && pct >= 80;
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${alert ? 'border-destructive/30 bg-destructive/5' : 'border-border/20 bg-card/10'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">{label}</span>
        {alert && <AlertTriangle className="h-3 w-3 text-destructive" />}
      </div>
      <p className="text-[11px] font-mono text-foreground/80">
        ${spend === null ? '—' : spend.toFixed(2)} <span className="text-muted-foreground/40">/ ${cap.toFixed(2)}</span>
      </p>
      {pct !== null && (
        <div className="h-1 bg-muted/40 rounded-full overflow-hidden mt-1.5">
          <div
            className={`h-full rounded-full ${alert ? 'bg-destructive/70' : 'bg-primary/50'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: typeof Users;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 text-left"
    >
      <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground/40 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono text-foreground/80">{label}</p>
        <p className="text-[9px] text-muted-foreground/40 leading-relaxed">{description}</p>
      </div>
      <span
        className={`text-[9px] font-mono flex-shrink-0 ${
          checked ? 'text-nox-text-link' : 'text-muted-foreground/40'
        }`}
      >
        {checked ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

function NumberRow({
  label,
  description,
  value,
  onChange,
  icon: Icon,
  min,
  step,
}: {
  label: string;
  description: string;
  value: number | null;
  onChange: (v: number | null) => void;
  icon?: typeof DollarSign;
  min?: number;
  step?: number;
}) {
  const [raw, setRaw] = useState<string>(value === null ? '' : String(value));
  useEffect(() => { setRaw(value === null ? '' : String(value)); }, [value]);
  return (
    <div className="flex items-start gap-3">
      {Icon ? (
        <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground/40 flex-shrink-0" />
      ) : (
        <span className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono text-foreground/80">{label}</p>
        <p className="text-[9px] text-muted-foreground/40 leading-relaxed">{description}</p>
      </div>
      <input
        type="number"
        inputMode="decimal"
        value={raw}
        min={min}
        step={step}
        placeholder="—"
        onChange={(e) => {
          const v = e.target.value;
          setRaw(v);
          if (v === '') onChange(null);
          else {
            const n = Number(v);
            if (Number.isFinite(n)) onChange(n);
          }
        }}
        className="w-20 text-[10px] font-mono text-right bg-muted/30 border border-border/20 rounded px-2 py-1 focus:outline-none focus:border-primary/40"
      />
    </div>
  );
}

function SaveRow({ dirty, busy, onSave }: { dirty: boolean; busy: boolean; onSave: () => Promise<void> }) {
  if (!dirty) return null;
  return (
    <div className="flex justify-end pt-2 border-t border-border/10">
      <button
        type="button"
        disabled={busy}
        onClick={() => void onSave()}
        className="flex items-center gap-1.5 text-[10px] font-sans font-medium text-nox-text-link hover:text-nox-text-link/80 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        Save changes
      </button>
    </div>
  );
}

function FeatureFlagRow({
  featureKey,
  checked,
  busy,
  onChange,
}: {
  featureKey: FeatureKey;
  checked: boolean;
  busy: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 text-left disabled:opacity-50"
    >
      <Zap
        className={`h-3 w-3 flex-shrink-0 ${checked ? 'text-nox-text-link/60' : 'text-muted-foreground/30'}`}
      />
      <span className="flex-1 text-[10px] font-mono text-foreground/70 truncate">{featureKey}</span>
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40" />
      ) : checked ? (
        <span className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground">
          <Check className="h-2.5 w-2.5" /> ON
        </span>
      ) : (
        <span className="text-[9px] font-mono text-muted-foreground/40">OFF</span>
      )}
    </button>
  );
}
