import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchWithRetry(url: string, retries = 3, delayMs = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.ok) return res;
    await res.text();
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
  }
  throw new Error("Failed to fetch after retries");
}

function shouldSendDigest(frequency: string, now: Date): boolean {
  const dayOfWeek = now.getUTCDay(); // 0=Sun
  const dayOfMonth = now.getUTCDate();

  switch (frequency) {
    case "daily":
      return true;
    case "weekly":
      return dayOfWeek === 0; // Sunday
    case "biweekly":
      return dayOfWeek === 0 && (Math.ceil(dayOfMonth / 7) % 2 === 1); // 1st & 3rd Sundays
    case "monthly":
      return dayOfMonth === 1;
    case "off":
      return false;
    default:
      return dayOfWeek === 0; // fallback to weekly
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // 1. Fetch 7-day BTC data
    const res7d = await fetchWithRetry(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7"
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

    const weekDir = weekChange >= 0 ? "up" : "down";
    const absWeekChange = Math.abs(weekChange).toFixed(1);
    const fmtPrice = (p: number) =>
      p.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

    // 2. Get all users with email notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, email_notifications, digest_frequency, threshold, threshold_down");

    if (profilesError) throw profilesError;

    const now = new Date();
    const eligible = (profiles ?? []).filter(
      (p) => p.email_notifications && shouldSendDigest(p.digest_frequency ?? "weekly", now)
    );
    console.log(`[WEEKLY-DIGEST] ${eligible.length} users eligible`);

    let sent = 0;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    for (const profile of eligible) {
      // Get user's reflections this week
      const { data: reflections } = await supabase
        .from("reflections")
        .select("message, mood, outcome, created_at")
        .eq("user_id", profile.user_id)
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: true });

      const reflectionCount = reflections?.length ?? 0;

      // Mood summary
      const moods: Record<string, number> = {};
      const outcomes: Record<string, number> = {};
      for (const r of reflections ?? []) {
        if (r.mood) moods[r.mood] = (moods[r.mood] || 0) + 1;
        if (r.outcome) outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1;
      }

      const topMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0]?.[0];
      const heldCount = outcomes["held"] ?? 0;
      const nothingCount = outcomes["nothing"] ?? 0;
      const steadyCount = heldCount + nothingCount;

      // Build the email
      const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      const thresholdUp = profile.threshold ?? 5;
      const thresholdDn = profile.threshold_down ?? 5;

      const reflectionsList =
        reflectionCount === 0
          ? `<p style="font-size: 13px; color: #737373; line-height: 1.6;">No reflections this week. Sometimes the best move is no move at all.</p>`
          : `<p style="font-size: 13px; color: #737373; line-height: 1.6;">
              You reflected <strong style="color: #2a2a2a;">${reflectionCount} time${reflectionCount !== 1 ? "s" : ""}</strong> this week.${
                topMood ? ` Your most common mood was <strong style="color: #2a2a2a;">${topMood}</strong>.` : ""
              }${
                steadyCount > 0
                  ? ` You stayed steady ${steadyCount} time${steadyCount !== 1 ? "s" : ""}.`
                  : ""
              }
            </p>`;

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
      <td style="padding: 8px 0; font-size: 12px; color: #2a2a2a; text-align: right; border-bottom: 1px solid #e5e2dc;">${fmtPrice(currentPrice)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-size: 12px; color: #737373; border-bottom: 1px solid #e5e2dc;">Week high</td>
      <td style="padding: 8px 0; font-size: 12px; color: #2a2a2a; text-align: right; border-bottom: 1px solid #e5e2dc;">${fmtPrice(weekHigh)}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; font-size: 12px; color: #737373;">Week low</td>
      <td style="padding: 8px 0; font-size: 12px; color: #2a2a2a; text-align: right;">${fmtPrice(weekLow)}</td>
    </tr>
  </table>

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td style="padding: 8px 0; font-size: 12px; color: #737373; border-bottom: 1px solid #e5e2dc;">Your triggers</td>
      <td style="padding: 8px 0; font-size: 12px; color: #2a2a2a; text-align: right; border-bottom: 1px solid #e5e2dc;">↑ ${thresholdUp}% / ↓ ${thresholdDn}%</td>
    </tr>
  </table>

  ${reflectionsList}

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">

  <p style="font-size: 13px; color: #737373; line-height: 1.6;">
    Another week observed. The practice continues.
  </p>

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">
  <p style="font-size: 11px; color: #a3a3a3;">Digest from Holzen. Change frequency in settings.</p>
</body>
</html>`;

      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Holzen <notify@holzen.app>",
            to: [email],
            subject: `Holzen — BTC ${weekDir} ${absWeekChange}% this week`,
            html,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[WEEKLY-DIGEST] Resend error [${res.status}]: ${errText}`);
          continue;
        }
        await res.json();
        sent++;
      } catch (e) {
        console.error(`[WEEKLY-DIGEST] Send error for ${email}:`, e);
      }
    }

    console.log(`[WEEKLY-DIGEST] Sent ${sent} digest emails`);
    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[WEEKLY-DIGEST] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
