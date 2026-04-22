import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { holzenEdgeError, holzenEdgeLog, holzenEdgeRun } from "../_shared/holzen-edge-log.ts";
import { createAttemptLogger } from "../_shared/observe.ts";
import { coingeckoHeaders } from "../_shared/coingecko.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import {
  holzenLovableEmailLogger,
  sendLovableEmailBatch,
  type LovableEmail,
} from "../_shared/lovable-email.ts";

const REPORT_MODEL = "google/gemini-2.5-flash-lite";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchWithRetry(url: string, retries = 3, delayMs = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: coingeckoHeaders() });
    if (res.ok) return res;
    await res.text();
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
  }
  throw new Error("Failed to fetch after retries");
}

function fmtPrice(p: number, currency: string): string {
  const fractionDigits = currency === "JPY" || currency === "KRW" ? 0 : 0;
  return p.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: fractionDigits });
}

interface BtcMonthData {
  monthChange: number;
  monthHigh: number;
  monthLow: number;
  currentPrice: number;
}

const btcCache = new Map<string, BtcMonthData>();

async function fetchBtcMonthData(currency: string): Promise<BtcMonthData> {
  const cached = btcCache.get(currency);
  if (cached) return cached;

  const cur = currency.toLowerCase();
  const res30d = await fetchWithRetry(
    `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${cur}&days=30`
  );
  const data30d = await res30d.json();
  const prices: [number, number][] = data30d.prices;

  let monthChange = 0;
  let monthHigh = 0;
  let monthLow = Infinity;
  let currentPrice = 0;

  if (prices && prices.length >= 2) {
    const startPrice = prices[0][1];
    currentPrice = prices[prices.length - 1][1];
    monthChange = ((currentPrice - startPrice) / startPrice) * 100;

    for (const [, p] of prices) {
      if (p > monthHigh) monthHigh = p;
      if (p < monthLow) monthLow = p;
    }
  }

  const result = { monthChange, monthHigh, monthLow, currentPrice };
  btcCache.set(currency, result);
  return result;
}

serve(
  withRequestLogging("monthly-report", async ({ req }) => {
  try {
    holzenEdgeRun("monthly-report", "request", { method: req.method });
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      holzenEdgeRun("monthly-report", "auth rejected");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    holzenEdgeRun("monthly-report", "auth ok");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const LOVABLE_EMAIL_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_EMAIL_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Feature flag + global budget guard. On block, we still send the email
    // summary but drop the AI paragraph.
    const { guardAiFeature } = await import("../_shared/ratelimit.ts");
    const reportsAiGuard = await guardAiFeature(supabase, "reports", {
      providers: ["lovable"],
    });
    if (!reportsAiGuard.allowed) {
      holzenEdgeLog("monthly-report", "ai summary skipped", { reason: reportsAiGuard.reason });
      LOVABLE_API_KEY = undefined;
    }

    // Only run on the 1st of the month
    const now = new Date();
    if (now.getUTCDate() !== 1) {
      holzenEdgeLog("monthly-report", "run complete", { skipped: true, reason: "not_first_of_month" });
      return new Response(JSON.stringify({ skipped: true, reason: "not_first_of_month" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const lastMonth = monthNames[(now.getUTCMonth() + 11) % 12];

    // Get all users with email notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, email_notifications, hold_goal_currency, language");

    if (profilesError) throw profilesError;

    const eligible = (profiles ?? []).filter((p) => p.email_notifications);
    holzenEdgeLog("monthly-report", "eligible users", { count: eligible.length });

    // Collect all rendered emails and ship them in one batched Lovable Email call at
    // the end (one HTTP round trip per 100 recipients, with retry/backoff).
    const queued: LovableEmail[] = [];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    for (const profile of eligible) {
      const currency = (profile as any).hold_goal_currency || "USD";
      const btc = await fetchBtcMonthData(currency);

      const monthDir = btc.monthChange >= 0 ? "up" : "down";
      const absMonthChange = Math.abs(btc.monthChange).toFixed(1);

      const { data: reflections } = await supabase
        .from("reflections")
        .select("message, mood, outcome, tags, created_at")
        .eq("user_id", profile.user_id)
        .gte("created_at", monthAgo)
        .order("created_at", { ascending: true });

      const reflectionCount = reflections?.length ?? 0;

      const moods: Record<string, number> = {};
      const outcomes: Record<string, number> = {};
      const tags: Record<string, number> = {};
      for (const r of reflections ?? []) {
        if (r.mood) moods[r.mood] = (moods[r.mood] || 0) + 1;
        if (r.outcome) outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1;
        if (r.tags) for (const t of r.tags) tags[t] = (tags[t] || 0) + 1;
      }

      const topMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0];
      const topTags = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const heldCount = outcomes["held"] ?? 0;
      const nothingCount = outcomes["nothing"] ?? 0;
      const steadyCount = heldCount + nothingCount;
      const boughtCount = outcomes["bought"] ?? 0;
      const soldCount = outcomes["sold"] ?? 0;

      const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      // AI monthly insight
      let aiInsight = "";
      if (LOVABLE_API_KEY && reflectionCount > 0) {
        const logAttempt = createAttemptLogger(supabase, { userId: profile.user_id });
        const t0 = Date.now();
        try {
          const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
          const langCode = (profile as any).language || "en";
          const langName = LANG_NAMES[langCode] || "English";
          const langInstruction = langCode !== "en" ? `\nWrite in ${langName}.` : "";

          const prompt = `You are Holzen. Write ONE short behavioral observation (1-2 sentences) for a monthly report:
- BTC moved ${monthDir} ${absMonthChange}% last month
- User reflected ${reflectionCount} times
- Top mood: ${topMood?.[0] || "unknown"} (${topMood?.[1] || 0} times)
- Held steady: ${steadyCount}, bought: ${boughtCount}, sold: ${soldCount}
- Top tags: ${topTags.map(([t, c]) => `${t}(${c})`).join(", ") || "none"}
Be observational, calm. No advice, no exclamation marks.${langInstruction}`;

          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: REPORT_MODEL,
              messages: [{ role: "user", content: prompt }],
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            logAttempt({
              companion_type: "reports",
              provider: "lovable",
              model: REPORT_MODEL,
              status: "success",
              latency_ms: Date.now() - t0,
              input_tokens: aiData?.usage?.prompt_tokens,
              output_tokens: aiData?.usage?.completion_tokens,
            });
            const content = aiData.choices?.[0]?.message?.content?.trim();
            if (content) {
              aiInsight = `<p style="font-size: 13px; color: #2a2a2a; line-height: 1.6; font-style: italic; border-left: 2px solid #d4d0c8; padding-left: 12px; margin: 16px 0;">${content}</p>`;
            }
          } else {
            logAttempt({
              companion_type: "reports",
              provider: "lovable",
              model: REPORT_MODEL,
              status: "error",
              latency_ms: Date.now() - t0,
              error_message: `HTTP ${aiRes.status}`,
            });
          }
        } catch (e) {
          holzenEdgeError("monthly-report", "AI insight failed", e);
          logAttempt({
            companion_type: "reports",
            provider: "lovable",
            model: REPORT_MODEL,
            status: "error",
            latency_ms: Date.now() - t0,
            error_message: e instanceof Error ? e.message : String(e),
          });
        }
      }

      const outcomeRows = [
        { label: "Held steady", count: steadyCount },
        { label: "Bought", count: boughtCount },
        { label: "Sold", count: soldCount },
      ].filter((o) => o.count > 0);

      const tagsHtml = topTags.length > 0
        ? `<p style="font-size: 12px; color: #737373; margin-top: 8px;">Top tags: ${topTags.map(([t, c]) => `<strong style="color: #2a2a2a;">${t}</strong> (${c})`).join(", ")}</p>`
        : "";

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'IBM Plex Mono', monospace, sans-serif; max-width: 440px; margin: 0 auto; padding: 40px 20px; color: #2a2a2a; background: #f7f5f0;">
  <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #737373; margin-bottom: 32px;">HOLZEN · ${lastMonth.toUpperCase()} REPORT</p>

  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
    Last month, BTC moved <strong>${monthDir} ${absMonthChange}%</strong>.
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td style="padding: 8px 0; font-size: 12px; color: #737373; border-bottom: 1px solid #e5e2dc;">Current</td>
      <td style="padding: 8px 0; font-size: 12px; color: #2a2a2a; text-align: right; border-bottom: 1px solid #e5e2dc;">${fmtPrice(btc.currentPrice, currency)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-size: 12px; color: #737373; border-bottom: 1px solid #e5e2dc;">Month high</td>
      <td style="padding: 8px 0; font-size: 12px; color: #2a2a2a; text-align: right; border-bottom: 1px solid #e5e2dc;">${fmtPrice(btc.monthHigh, currency)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-size: 12px; color: #737373;">Month low</td>
      <td style="padding: 8px 0; font-size: 12px; color: #2a2a2a; text-align: right;">${fmtPrice(btc.monthLow, currency)}</td>
    </tr>
  </table>

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">

  <p style="font-size: 13px; color: #737373; line-height: 1.6;">
    You reflected <strong style="color: #2a2a2a;">${reflectionCount} time${reflectionCount !== 1 ? "s" : ""}</strong> in ${lastMonth}.${
      topMood ? ` Your most common mood was <strong style="color: #2a2a2a;">${topMood[0]}</strong>.` : ""
    }
  </p>

  ${outcomeRows.length > 0 ? `
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    ${outcomeRows.map((o) => `
    <tr>
      <td style="padding: 6px 0; font-size: 12px; color: #737373; border-bottom: 1px solid #e5e2dc;">${o.label}</td>
      <td style="padding: 6px 0; font-size: 12px; color: #2a2a2a; text-align: right; border-bottom: 1px solid #e5e2dc;">${o.count}×</td>
    </tr>`).join("")}
  </table>` : ""}

  ${tagsHtml}

  ${aiInsight}

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">

  <p style="font-size: 13px; color: #737373; line-height: 1.6;">
    Another month observed. The practice deepens.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">
  <p style="font-size: 11px; color: #a3a3a3;">Monthly report from Holzen. Disable in settings.</p>
</body>
</html>`;

      queued.push({
        from: "Holzen <notify@holzen.app>",
        to: [email],
        subject: `Holzen — ${lastMonth} Report: BTC ${monthDir} ${absMonthChange}%`,
        html,
      });
    }

    // Monthly idempotency — this cron only runs on the 1st (guarded above),
    // but if Supabase retries the invocation within 24h, the same key blocks
    // duplicates in Lovable Email.
    const idempotencyMonth = now.toISOString().slice(0, 7);
    const batch = await sendLovableEmailBatch(queued, {
      apiKey: LOVABLE_EMAIL_API_KEY,
      source: "monthly-report",
      idempotencyKey: `monthly-report:${idempotencyMonth}`,
      logger: holzenLovableEmailLogger(
        (m, d) => holzenEdgeLog("monthly-report", m, d),
        (m, err) => holzenEdgeError("monthly-report", m, err),
      ),
    });

    holzenEdgeLog("monthly-report", "run complete", {
      sent: batch.sent,
      failed: batch.failed,
      chunks: batch.chunks,
      eligible: eligible.length,
      queued: queued.length,
    });
    return new Response(
      JSON.stringify({ sent: batch.sent, failed: batch.failed, chunks: batch.chunks }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    holzenEdgeError("monthly-report", "uncaught error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
