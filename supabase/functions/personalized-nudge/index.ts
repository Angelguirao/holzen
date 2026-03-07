import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // 1. Check current BTC volatility
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true"
    );
    const data = await res.json();
    const change24h = Math.abs(data?.bitcoin?.usd_24h_change ?? 0);

    // Only nudge during high volatility (≥3% daily move)
    if (change24h < 3) {
      console.log(`[NUDGE] BTC change ${change24h.toFixed(1)}% — below 3% threshold, skipping`);
      return new Response(JSON.stringify({ nudged: 0, reason: "low_volatility" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Get users with email notifications enabled
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, email_notifications");

    if (profilesError) throw profilesError;

    const eligible = (profiles ?? []).filter((p) => p.email_notifications);
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    let nudged = 0;

    for (const profile of eligible) {
      // Check if user has reflected in the last 48 hours
      const { data: recentReflections } = await supabase
        .from("reflections")
        .select("id")
        .eq("user_id", profile.user_id)
        .gte("created_at", cutoff)
        .limit(1);

      // If they have recent reflections, skip
      if (recentReflections && recentReflections.length > 0) continue;

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      const direction = (data?.bitcoin?.usd_24h_change ?? 0) >= 0 ? "up" : "down";
      const pct = change24h.toFixed(1);

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'IBM Plex Mono', monospace, sans-serif; max-width: 440px; margin: 0 auto; padding: 40px 20px; color: #2a2a2a; background: #f7f5f0;">
  <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #737373; margin-bottom: 32px;">HOLZEN</p>

  <p style="font-size: 14px; line-height: 1.8; margin-bottom: 24px;">
    BTC is ${direction} ${pct}% today.
  </p>

  <p style="font-size: 13px; color: #737373; line-height: 1.6; margin-bottom: 24px;">
    You haven't reflected in a while. No pressure — just a gentle reminder that Holzen is here when you need a moment to pause.
  </p>

  <a href="https://holzen.lovable.app" style="display: inline-block; font-size: 12px; font-family: 'IBM Plex Mono', monospace; color: #2a2a2a; border: 1px solid #d4d0c8; padding: 8px 16px; text-decoration: none; border-radius: 4px;">
    Open Holzen
  </a>

  <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 32px 0 16px;">
  <p style="font-size: 11px; color: #a3a3a3;">A gentle nudge from Holzen. Disable in settings.</p>
</body>
</html>`;

      try {
        const sendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Holzen <notify@holzen.app>",
            to: [email],
            subject: `BTC is ${direction} ${pct}% — take a moment`,
            html,
          }),
        });

        if (!sendRes.ok) {
          const errText = await sendRes.text();
          console.error(`[NUDGE] Resend error [${sendRes.status}]: ${errText}`);
          continue;
        }
        await sendRes.json();
        nudged++;
      } catch (e) {
        console.error(`[NUDGE] Send error for ${email}:`, e);
      }
    }

    console.log(`[NUDGE] Nudged ${nudged} users (BTC ${change24h.toFixed(1)}% volatility)`);
    return new Response(JSON.stringify({ nudged }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[NUDGE] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
