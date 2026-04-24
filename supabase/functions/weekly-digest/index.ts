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

const DIGEST_MODEL = "google/gemini-2.5-flash-lite";

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

function shouldSendDigest(frequency: string, now: Date): boolean {
  const dayOfWeek = now.getUTCDay();
  const dayOfMonth = now.getUTCDate();

  switch (frequency) {
    case "daily":
      return true;
    case "weekly":
      return dayOfWeek === 0;
    case "biweekly":
      return dayOfWeek === 0 && (Math.ceil(dayOfMonth / 7) % 2 === 1);
    case "monthly":
      return dayOfMonth === 1;
    case "off":
      return false;
    default:
      return dayOfWeek === 0;
  }
}

function fmtPrice(p: number, currency: string): string {
  const fractionDigits = currency === "JPY" || currency === "KRW" ? 0 : 0;
  return p.toLocaleString("en-US", { style: "currency", currency, maximumFractionDigits: fractionDigits });
}

interface BtcWeekData {
  weekChange: number;
  weekHigh: number;
  weekLow: number;
  currentPrice: number;
}

const btcCache = new Map<string, BtcWeekData>();

async function fetchBtcWeekData(currency: string): Promise<BtcWeekData> {
  const cached = btcCache.get(currency);
  if (cached) return cached;

  const cur = currency.toLowerCase();
  const res7d = await fetchWithRetry(
    `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${cur}&days=7`
  );
  const data7d = await res7d.json();
  const prices: [number, number][] = data7d.prices;

  let weekChange = 0;
  let weekHigh = 0;
  let weekLow = Infinity;
  let currentPrice = 0;

  if (prices && prices.length >= 2) {
    const startPrice = prices[0][1];
    currentPrice = prices[prices.length - 1][1];
    weekChange = ((currentPrice - startPrice) / startPrice) * 100;

    for (const [, p] of prices) {
      if (p > weekHigh) weekHigh = p;
      if (p < weekLow) weekLow = p;
    }
  }

  const result = { weekChange, weekHigh, weekLow, currentPrice };
  btcCache.set(currency, result);
  return result;
}

async function generateAIInsight(
  pauseCount: number,
  topMood: string | undefined,
  steadyCount: number,
  weekDir: string,
  absWeekChange: string,
  LOVABLE_API_KEY: string,
  language: string | undefined,
  logAttempt: (params: Parameters<ReturnType<typeof createAttemptLogger>>[0]) => void
): Promise<string | null> {
  if (pauseCount === 0) return null;

  const t0 = Date.now();
  try {
    const LANG_NAMES: Record<string, string> = { en: "English", es: "Spanish", pt: "Portuguese", de: "German", nl: "Dutch", fr: "French", tr: "Turkish" };
    const langCode = language || "en";
    const langName = LANG_NAMES[langCode] || "English";
    const langInstruction = langCode !== "en" ? `\nWrite in ${langName}.` : "";

    const prompt = `You are Holzen, a mindful Bitcoin pause app. Generate ONE short behavioral observation (1-2 sentences max) based on this user's week:
- BTC moved ${weekDir} ${absWeekChange}% this week
- They completed ${pauseCount} pause session(s)
- Most common mood: ${topMood || "unknown"}
- Stayed steady (held/did nothing): ${steadyCount} time(s)

Be observational, not prescriptive. No advice, no exclamation marks. Calm and grounded. Examples:
- "You noticed the dip but didn't flinch. That pattern is strengthening."
- "Three pauses during a quiet week — you're building awareness beyond volatility."
- "Anxiety appeared twice this week, both during drops. The pattern is worth noticing."${langInstruction}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DIGEST_MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      holzenEdgeError("weekly-digest", `AI insight HTTP ${response.status}`);
      logAttempt({
        companion_type: "digest",
        provider: "lovable",
        model: DIGEST_MODEL,
        status: "error",
        latency_ms: Date.now() - t0,
        error_message: `HTTP ${response.status}`,
      });
      return null;
    }

    const data = await response.json();
    logAttempt({
      companion_type: "digest",
      provider: "lovable",
      model: DIGEST_MODEL,
      status: "success",
      latency_ms: Date.now() - t0,
      input_tokens: data?.usage?.prompt_tokens,
      output_tokens: data?.usage?.completion_tokens,
    });
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    holzenEdgeError("weekly-digest", "AI insight failed", e);
    logAttempt({
      companion_type: "digest",
      provider: "lovable",
      model: DIGEST_MODEL,
      status: "error",
      latency_ms: Date.now() - t0,
      error_message: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

serve(
  withRequestLogging("weekly-digest", async ({ req }) => {
  try {
    holzenEdgeRun("weekly-digest", "request", { method: req.method });
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      holzenEdgeRun("weekly-digest", "auth rejected");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    holzenEdgeRun("weekly-digest", "auth ok");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const LOVABLE_EMAIL_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_EMAIL_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Feature flag + global budget guard. If the `digest` feature is off or
    // budget is exhausted, we still send the email but skip the AI insight.
    const { guardAiFeature } = await import("../_shared/ratelimit.ts");
    const digestAiGuard = await guardAiFeature(supabase, "digest", {
      providers: ["lovable"],
    });
    if (!digestAiGuard.allowed) {
      holzenEdgeLog("weekly-digest", "ai insight skipped", { reason: digestAiGuard.reason });
      LOVABLE_API_KEY = undefined;
    }

    // Get all users with email notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, email_notifications, digest_frequency, threshold, threshold_down, hold_goal_currency, language");

    if (profilesError) throw profilesError;

    const now = new Date();
    const eligible = (profiles ?? []).filter(
      (p) => p.email_notifications && shouldSendDigest(p.digest_frequency ?? "weekly", now)
    );
    holzenEdgeLog("weekly-digest", "eligible users", { count: eligible.length });

    // We collect all rendered emails and send them in a single batch request
    // at the end (≤100 per chunk). That's one Lovable Email round trip instead of N
    // — faster, less rate-limit pressure, and the helper retries the batch on
    // 429/5xx.
    const queued: LovableEmail[] = [];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    for (const profile of eligible) {
      const currency = (profile as any).hold_goal_currency || "USD";
      const btc = await fetchBtcWeekData(currency);

      const weekDir = btc.weekChange >= 0 ? "up" : "down";
      const absWeekChange = Math.abs(btc.weekChange).toFixed(1);

      const { data: pauseRows } = await supabase
        .from("v_pause_full")
        .select("reflection_text, initial_mood, outcome, created_at")
        .eq("user_id", profile.user_id)
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: true });

      const pauseCount = pauseRows?.length ?? 0;

      const moods: Record<string, number> = {};
      const outcomes: Record<string, number> = {};
      for (const r of (pauseRows ?? []) as Array<{
        initial_mood: string | null;
        outcome: string | null;
      }>) {
        if (r.initial_mood) moods[r.initial_mood] = (moods[r.initial_mood] || 0) + 1;
        if (r.outcome) outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1;
      }

      const topMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0]?.[0];
      const heldCount = outcomes["held"] ?? 0;
      const nothingCount = outcomes["nothing"] ?? 0;
      const steadyCount = heldCount + nothingCount;

      const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      const thresholdUp = profile.threshold ?? 5;
      const thresholdDn = profile.threshold_down ?? 5;

      // Generate AI insight
      let aiInsight: string | null = null;
      if (LOVABLE_API_KEY && pauseCount > 0) {
        const logAttempt = createAttemptLogger(supabase, { userId: profile.user_id });
        aiInsight = await generateAIInsight(
          pauseCount, topMood, steadyCount, weekDir, absWeekChange, LOVABLE_API_KEY, (profile as any).language,
          logAttempt,
        );
      }

      const pauseSummaryHtml =
        pauseCount === 0
          ? `<p style="font-size: 13px; color: #737373; line-height: 1.6;">No pause sessions this week. Sometimes the best move is no move at all.</p>`
          : `<p style="font-size: 13px; color: #737373; line-height: 1.6;">
              You took <strong style="color: #2a2a2a;">${pauseCount} pause${pauseCount !== 1 ? "s" : ""}</strong> this week.${
                topMood ? ` Your most common mood was <strong style="color: #2a2a2a;">${topMood}</strong>.` : ""
              }${
                steadyCount > 0
                  ? ` You stayed steady ${steadyCount} time${steadyCount !== 1 ? "s" : ""}.`
                  : ""
              }
            </p>`;

      const aiInsightHtml = aiInsight
        ? `<p style="font-size: 13px; color: #2a2a2a; line-height: 1.6; font-style: italic; border-left: 2px solid #d4d0c8; padding-left: 12px; margin: 16px 0;">${aiInsight}</p>`
        : "";

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'IBM Plex Mono', monospace, sans-serif; max-width: 440px; margin: 0 auto; padding: 40px 20px; color: #2a2a2a; background: #f7f5f0;">
  <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #737373; margin-bottom: 32px;">HOLZEN · DIGEST</p>

  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
    This week, BTC moved <strong>${weekDir} ${absWeekChange}%</strong>.
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td style="padding: 8px 0; font-size: 12px; color: #737373; border-bottom: 1px solid #e5e2dc;">Current</td>
      <td style="padding: 8px 0; font-size: 12px; color: #2a2a2a; text-align: right; border-bottom: 1px solid #e5e2dc;">${fmtPrice(btc.currentPrice, currency)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-size: 12px; color: #737373; border-bottom: 1px solid #e5e2dc;">Week high</td>
      <td style="padding: 8px 0; font-size: 12px; color: #2a2a2a; text-align: right; border-bottom: 1px solid #e5e2dc;">${fmtPrice(btc.weekHigh, currency)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-size: 12px; color: #737373;">Week low</td>
      <td style="padding: 8px 0; font-size: 12px; color: #2a2a2a; text-align: right;">${fmtPrice(btc.weekLow, currency)}</td>
    </tr>
  </table>

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td style="padding: 8px 0; font-size: 12px; color: #737373; border-bottom: 1px solid #e5e2dc;">Your triggers</td>
      <td style="padding: 8px 0; font-size: 12px; color: #2a2a2a; text-align: right; border-bottom: 1px solid #e5e2dc;">↑ ${thresholdUp}% / ↓ ${thresholdDn}%</td>
    </tr>
  </table>

  ${pauseSummaryHtml}

  ${aiInsightHtml}

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">

  <p style="font-size: 13px; color: #737373; line-height: 1.6;">
    Another week observed. The practice continues.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">
  <p style="font-size: 11px; color: #a3a3a3;">Digest from Holzen. Change frequency in settings.</p>
</body>
</html>`;

      queued.push({
        from: "Holzen <notify@holzen.app>",
        to: [email],
        subject: `Holzen — BTC ${weekDir} ${absWeekChange}% this week`,
        html,
      });
    }

    // Idempotency key per day → cron re-runs within 24h don't double-send.
    const idempotencyDate = now.toISOString().slice(0, 10);
    const batch = await sendLovableEmailBatch(queued, {
      apiKey: LOVABLE_EMAIL_API_KEY,
      source: "weekly-digest",
      idempotencyKey: `weekly-digest:${idempotencyDate}`,
      logger: holzenLovableEmailLogger(
        (m, d) => holzenEdgeLog("weekly-digest", m, d),
        (m, err) => holzenEdgeError("weekly-digest", m, err),
      ),
    });

    holzenEdgeLog("weekly-digest", "run complete", {
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
    holzenEdgeError("weekly-digest", "uncaught error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
