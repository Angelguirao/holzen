/**
 * ai-cost-alert — daily email alert for AI spend anomalies.
 *
 * Intended schedule: **cron daily at 08:00 UTC**. Safe to run any time; it
 * always looks at "yesterday UTC" + month-to-date, so the result is stable
 * regardless of dispatch time within the day.
 *
 * Triggers (any one fires → email sent):
 *   1. Yesterday's global spend >= `ai_cost_alert_daily_threshold_pct` of
 *      `budget_daily_usd_global`. Default threshold 80%.
 *   2. Yesterday's spend >= `ai_cost_alert_wow_multiplier` × 7-day average
 *      (excluding yesterday). Default multiplier 2.0×.
 *   3. Month-to-date spend is projected to exceed
 *      `budget_monthly_usd_global` by end of month.
 *
 * When no triggers fire, logs a "no-alert" line so we can confirm the cron
 * ran. When `ai_cost_alert_enabled` is false or the recipients array is
 * empty, the function no-ops with a structured log (not an error).
 *
 * Auth: service role or CRON_SECRET in `Authorization: Bearer …`, per the
 * shared `verifyServiceAuth` pattern.
 *
 * Email: direct Resend API (matches `personalized-nudge`, `weekly-digest`,
 * etc.); plain HTML, no template registry.
 *
 * Runbook: see `docs/systems/costs/ai-cost-model.md` §7.5.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { holzenEdgeError, holzenEdgeLog, holzenEdgeRun } from "../_shared/holzen-edge-log.ts";
import {
  holzenResendLogger,
  sendResendBatch,
  type ResendEmail,
} from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AlertConfig {
  enabled: boolean;
  recipients: string[];
  dailyThresholdPct: number;
  wowMultiplier: number;
  dailyCapUsd: number;
  monthlyCapUsd: number;
}

async function loadAlertConfig(sb: any): Promise<AlertConfig> {
  const { data } = await sb.from("app_config").select("key, value");
  const cfg: AlertConfig = {
    enabled: true,
    recipients: [],
    dailyThresholdPct: 80,
    wowMultiplier: 2,
    dailyCapUsd: 10,
    monthlyCapUsd: 300,
  };
  for (const row of (data ?? []) as Array<{ key: string; value: unknown }>) {
    switch (row.key) {
      case "ai_cost_alert_enabled":
        cfg.enabled = row.value !== false && row.value !== "false";
        break;
      case "ai_cost_alert_recipients":
        if (Array.isArray(row.value)) {
          cfg.recipients = (row.value as unknown[])
            .map((v) => (typeof v === "string" ? v.trim() : ""))
            .filter((s) => s.length > 0 && s.includes("@"));
        }
        break;
      case "ai_cost_alert_daily_threshold_pct":
        cfg.dailyThresholdPct = Number(row.value) || 80;
        break;
      case "ai_cost_alert_wow_multiplier":
        cfg.wowMultiplier = Number(row.value) || 2;
        break;
      case "budget_daily_usd_global":
        cfg.dailyCapUsd = Number(row.value) || 10;
        break;
      case "budget_monthly_usd_global":
        cfg.monthlyCapUsd = Number(row.value) || 300;
        break;
    }
  }
  return cfg;
}

function startOfDayUtc(offsetDays = 0): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

interface AttemptRow {
  companion_type: string | null;
  user_id: string | null;
  estimated_cost_usd: number | null;
  created_at: string;
}

async function fetchRange(sb: any, fromIso: string, toIso: string): Promise<AttemptRow[]> {
  const { data, error } = await sb
    .from("generation_attempts")
    .select("companion_type, user_id, estimated_cost_usd, created_at")
    .gte("created_at", fromIso)
    .lt("created_at", toIso)
    .not("estimated_cost_usd", "is", null)
    .limit(100_000);
  if (error || !data) return [];
  return data as AttemptRow[];
}

function sumCost(rows: AttemptRow[]): number {
  return rows.reduce((s, r) => s + Number(r.estimated_cost_usd ?? 0), 0);
}

function topBy<K extends string>(
  rows: AttemptRow[],
  key: (r: AttemptRow) => K | null,
  n: number,
): Array<{ key: K; cost: number; attempts: number }> {
  const acc = new Map<K, { cost: number; attempts: number }>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    const prev = acc.get(k) ?? { cost: 0, attempts: 0 };
    prev.cost += Number(r.estimated_cost_usd ?? 0);
    prev.attempts += 1;
    acc.set(k, prev);
  }
  return Array.from(acc.entries())
    .map(([k, v]) => ({ key: k, ...v }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, n);
}

interface AlertSnapshot {
  yesterdaySpend: number;
  sevenDayAvg: number;
  monthToDateSpend: number;
  projectedMonthly: number;
  dayOfMonth: number;
  daysInMonth: number;
  topUsers: Array<{ key: string; cost: number; attempts: number }>;
  topFeatures: Array<{ key: string; cost: number; attempts: number }>;
}

async function buildSnapshot(sb: any): Promise<AlertSnapshot> {
  const yesterdayStart = startOfDayUtc(-1);
  const todayStart = startOfDayUtc(0);
  const sevenDayBack = startOfDayUtc(-8); // 8 days back so [-8, -1) is 7 days excluding yesterday
  const monthStart = new Date(Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth() + 1, 1));

  const [yesterday, priorSeven, monthToDate] = await Promise.all([
    fetchRange(sb, yesterdayStart.toISOString(), todayStart.toISOString()),
    fetchRange(sb, sevenDayBack.toISOString(), yesterdayStart.toISOString()),
    fetchRange(sb, monthStart.toISOString(), todayStart.toISOString()),
  ]);

  const yesterdaySpend = sumCost(yesterday);
  const sevenDayAvg = sumCost(priorSeven) / 7;
  const monthToDateSpend = sumCost(monthToDate);

  const dayOfMonth = todayStart.getUTCDate(); // 1..31
  const daysInMonth = Math.round((nextMonthStart.getTime() - monthStart.getTime()) / 86_400_000);
  // Projection: linear extrapolation from MTD burn rate. Uses
  // max(dayOfMonth-1, 1) because MTD excludes today.
  const daysElapsed = Math.max(dayOfMonth - 1, 1);
  const projectedMonthly = (monthToDateSpend / daysElapsed) * daysInMonth;

  const topUsers = topBy(yesterday, (r) => r.user_id ?? null, 3);
  const topFeatures = topBy(yesterday, (r) => r.companion_type ?? null, 3);

  return {
    yesterdaySpend,
    sevenDayAvg,
    monthToDateSpend,
    projectedMonthly,
    dayOfMonth,
    daysInMonth,
    topUsers,
    topFeatures,
  };
}

interface Trigger {
  kind: "daily_threshold" | "wow_anomaly" | "monthly_projection";
  reason: string;
}

function evaluateTriggers(snap: AlertSnapshot, cfg: AlertConfig): Trigger[] {
  const triggers: Trigger[] = [];

  if (snap.yesterdaySpend >= cfg.dailyCapUsd * (cfg.dailyThresholdPct / 100)) {
    triggers.push({
      kind: "daily_threshold",
      reason: `Yesterday spend $${snap.yesterdaySpend.toFixed(2)} ≥ ${cfg.dailyThresholdPct}% of daily cap $${cfg.dailyCapUsd.toFixed(2)}`,
    });
  }

  // Only fire the anomaly trigger if we actually have a prior average to
  // compare against — no point alerting in the first week of logging.
  if (snap.sevenDayAvg > 0.01 && snap.yesterdaySpend >= snap.sevenDayAvg * cfg.wowMultiplier) {
    triggers.push({
      kind: "wow_anomaly",
      reason: `Yesterday $${snap.yesterdaySpend.toFixed(2)} is ${(snap.yesterdaySpend / snap.sevenDayAvg).toFixed(1)}× the 7-day avg ($${snap.sevenDayAvg.toFixed(2)})`,
    });
  }

  if (snap.projectedMonthly > cfg.monthlyCapUsd) {
    triggers.push({
      kind: "monthly_projection",
      reason: `Projected monthly $${snap.projectedMonthly.toFixed(2)} > monthly cap $${cfg.monthlyCapUsd.toFixed(2)}`,
    });
  }

  return triggers;
}

function renderHtml(snap: AlertSnapshot, cfg: AlertConfig, triggers: Trigger[]): string {
  const triggerList = triggers
    .map((t) => `<li style="margin-bottom: 6px;"><strong>${t.kind}:</strong> ${t.reason}</li>`)
    .join("");

  const userList = snap.topUsers.length === 0
    ? "<li style=\"color:#737373;\">no user-attributed spend</li>"
    : snap.topUsers
        .map((u) => `<li><code>${u.key.slice(0, 8)}…</code> — $${u.cost.toFixed(4)} · ${u.attempts} calls</li>`)
        .join("");

  const featureList = snap.topFeatures.length === 0
    ? "<li style=\"color:#737373;\">no feature-attributed spend</li>"
    : snap.topFeatures
        .map((f) => `<li><strong>${f.key}</strong> — $${f.cost.toFixed(4)} · ${f.attempts} calls</li>`)
        .join("");

  const dailyPct = cfg.dailyCapUsd > 0 ? (snap.yesterdaySpend / cfg.dailyCapUsd) * 100 : 0;
  const monthPct = cfg.monthlyCapUsd > 0 ? (snap.monthToDateSpend / cfg.monthlyCapUsd) * 100 : 0;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: 'IBM Plex Mono', monospace, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; color: #2a2a2a; background: #f7f5f0;">
  <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #737373; margin-bottom: 32px;">HOLZEN · AI COST ALERT</p>

  <p style="font-size: 13px; line-height: 1.6; margin-bottom: 16px;">
    Triggers fired this morning for yesterday's AI spend:
  </p>
  <ul style="font-size: 13px; line-height: 1.6; margin: 0 0 24px 0; padding-left: 20px;">
    ${triggerList}
  </ul>

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px;">
    <tr>
      <td style="padding: 6px 0; color: #737373; border-bottom: 1px solid #e5e2dc;">Yesterday spend</td>
      <td style="padding: 6px 0; text-align: right; border-bottom: 1px solid #e5e2dc;">$${snap.yesterdaySpend.toFixed(2)} (${dailyPct.toFixed(0)}% of cap)</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #737373; border-bottom: 1px solid #e5e2dc;">7-day avg (excl. yesterday)</td>
      <td style="padding: 6px 0; text-align: right; border-bottom: 1px solid #e5e2dc;">$${snap.sevenDayAvg.toFixed(2)}/day</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #737373; border-bottom: 1px solid #e5e2dc;">Month-to-date (day ${snap.dayOfMonth - 1}/${snap.daysInMonth})</td>
      <td style="padding: 6px 0; text-align: right; border-bottom: 1px solid #e5e2dc;">$${snap.monthToDateSpend.toFixed(2)} (${monthPct.toFixed(0)}% of cap)</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #737373;">Projected monthly</td>
      <td style="padding: 6px 0; text-align: right;">$${snap.projectedMonthly.toFixed(2)} / cap $${cfg.monthlyCapUsd.toFixed(2)}</td>
    </tr>
  </table>

  <p style="font-size: 12px; color: #737373; margin-bottom: 6px;">Top 3 users yesterday</p>
  <ul style="font-size: 12px; line-height: 1.6; margin: 0 0 16px 0; padding-left: 20px;">${userList}</ul>

  <p style="font-size: 12px; color: #737373; margin-bottom: 6px;">Top 3 features yesterday</p>
  <ul style="font-size: 12px; line-height: 1.6; margin: 0 0 24px 0; padding-left: 20px;">${featureList}</ul>

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">

  <p style="font-size: 12px; color: #737373; line-height: 1.6;">
    Next steps: open <a href="https://holzen.app/admin" style="color: #2a2a2a;">/admin → Cost</a>
    to investigate. If this is expected growth, raise the relevant cap in
    <a href="https://holzen.app/admin" style="color: #2a2a2a;">/admin → Tools</a>. If it is anomalous,
    consider panic mode or disabling a feature flag.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0 16px;">
  <p style="font-size: 11px; color: #a3a3a3;">
    Automated alert from Holzen ai-cost-alert. Change thresholds / recipients in
    <code>app_config</code> via the Admin Tools tab.
  </p>
</body></html>`;
}

async function sendAlert(
  recipients: string[],
  html: string,
  subject: string,
  resendKey: string,
  idempotencyKey: string,
): Promise<{ sent: number; errors: number }> {
  const emails: ResendEmail[] = recipients.map((to) => ({
    from: "Holzen <notify@holzen.app>",
    to: [to],
    subject,
    html,
  }));
  const batch = await sendResendBatch(emails, {
    apiKey: resendKey,
    source: "ai-cost-alert",
    idempotencyKey,
    logger: holzenResendLogger(
      (m, d) => holzenEdgeLog("ai-cost-alert", m, d),
      (m, err) => holzenEdgeError("ai-cost-alert", m, err),
    ),
  });
  return { sent: batch.sent, errors: batch.failed };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    holzenEdgeRun("ai-cost-alert", "request", { method: req.method });
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      holzenEdgeRun("ai-cost-alert", "auth rejected");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const cfg = await loadAlertConfig(sb);
    if (!cfg.enabled) {
      holzenEdgeLog("ai-cost-alert", "skipped", { reason: "disabled" });
      return new Response(JSON.stringify({ skipped: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (cfg.recipients.length === 0) {
      holzenEdgeLog("ai-cost-alert", "skipped", { reason: "no_recipients" });
      return new Response(JSON.stringify({ skipped: "no_recipients" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const snap = await buildSnapshot(sb);
    const triggers = evaluateTriggers(snap, cfg);

    if (triggers.length === 0) {
      holzenEdgeLog("ai-cost-alert", "no triggers", {
        yesterday_usd: Number(snap.yesterdaySpend.toFixed(4)),
        avg7d_usd: Number(snap.sevenDayAvg.toFixed(4)),
        mtd_usd: Number(snap.monthToDateSpend.toFixed(4)),
        projected_monthly_usd: Number(snap.projectedMonthly.toFixed(2)),
      });
      return new Response(
        JSON.stringify({
          triggered: false,
          yesterday_usd: snap.yesterdaySpend,
          avg7d_usd: snap.sevenDayAvg,
          mtd_usd: snap.monthToDateSpend,
          projected_monthly_usd: snap.projectedMonthly,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      holzenEdgeError("ai-cost-alert", "RESEND_API_KEY missing");
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subject = `Holzen AI cost alert — ${triggers.map((t) => t.kind).join(", ")}`;
    const html = renderHtml(snap, cfg, triggers);
    // One idempotency key per (day, trigger-set). If the cron retries within
    // 24h with the same triggers, Resend dedupes the batch.
    const dateKey = new Date().toISOString().slice(0, 10);
    const triggerKinds = triggers.map((t) => t.kind).sort().join("-");
    const { sent, errors } = await sendAlert(
      cfg.recipients,
      html,
      subject,
      RESEND_API_KEY,
      `ai-cost-alert:${dateKey}:${triggerKinds}`,
    );

    holzenEdgeLog("ai-cost-alert", "alert sent", {
      triggers: triggers.map((t) => t.kind),
      recipients: cfg.recipients.length,
      sent,
      errors,
      yesterday_usd: Number(snap.yesterdaySpend.toFixed(4)),
      projected_monthly_usd: Number(snap.projectedMonthly.toFixed(2)),
    });

    return new Response(
      JSON.stringify({
        triggered: true,
        triggers: triggers.map((t) => ({ kind: t.kind, reason: t.reason })),
        sent,
        errors,
        yesterday_usd: snap.yesterdaySpend,
        mtd_usd: snap.monthToDateSpend,
        projected_monthly_usd: snap.projectedMonthly,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    holzenEdgeError("ai-cost-alert", "uncaught error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
