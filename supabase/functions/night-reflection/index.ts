import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getUserLocalHour(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    return -1; // invalid timezone
  }
}

async function fetchWithRetry(url: string, retries = 3, delayMs = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.ok) return res;
    await res.text();
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
  }
  throw new Error("Failed to fetch BTC data after retries");
}

// Cache BTC data per currency to avoid redundant API calls
const btcCache = new Map<string, { changePercent: number; direction: string; absChange: string }>();

async function fetchBtc1dData(currency: string) {
  const cached = btcCache.get(currency);
  if (cached) return cached;

  const cur = currency.toLowerCase();
  const res = await fetchWithRetry(
    `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${cur}&days=1`
  );
  const data = await res.json();
  const prices: [number, number][] = data.prices;
  if (!prices || prices.length < 2) throw new Error("Insufficient price data");

  const price24hAgo = prices[0][1];
  const currentPrice = prices[prices.length - 1][1];
  const changePercent = ((currentPrice - price24hAgo) / price24hAgo) * 100;
  const direction = changePercent >= 0 ? "up" : "down";
  const absChange = Math.abs(changePercent).toFixed(1);

  const result = { changePercent, direction, absChange };
  btcCache.set(currency, result);
  return result;
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

    // Fetch USD data first for logging
    const usdData = await fetchBtc1dData("USD");
    console.log(`[NIGHT-REFLECTION] BTC 24h: ${usdData.changePercent.toFixed(2)}%`);

    // Get all users with timezone
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, reflection_tone, timezone, night_reflection_hour, hold_goal_currency, language");

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;

    for (const profile of profiles) {
      const tz = (profile as any).timezone || "UTC";
      const localHour = getUserLocalHour(tz);
      const targetHour = (profile as any).night_reflection_hour;
      if (targetHour === null || targetHour === undefined) continue;
      if (localHour !== targetHour) continue;

      // Use the user's currency for percentage (same across currencies, but we use their preference for consistency)
      const currency = (profile as any).hold_goal_currency || "USD";
      const btc = await fetchBtc1dData(currency);

      // Check if user had any reflections today (in their timezone)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("reflections")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.user_id)
        .gte("created_at", today.toISOString());

      const hadReflection = (count ?? 0) > 0;

      // Build the night message
      let message: string;
      if (hadReflection) {
        message = `Today BTC moved ${btc.absChange}%. You paused, reflected, and continued. That's the practice.`;
      } else {
        message = `Today BTC moved ${btc.absChange}%. You didn't react. That's worth noticing.`;
      }

      // Store the night reflection
      await supabase.from("night_reflections").insert({
        user_id: profile.user_id,
        message,
        btc_change_percent: btc.changePercent,
        btc_direction: btc.direction,
        had_reflection: hadReflection,
      });

      // Send push notification
      const { data: pushSubs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", profile.user_id);

      if (pushSubs && pushSubs.length > 0) {
        const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
        const vapidPrivateKeyJwk = Deno.env.get("VAPID_PRIVATE_KEY");

        if (vapidPublicKey && vapidPrivateKeyJwk) {
          try {
            let privateKey = vapidPrivateKeyJwk;
            try {
              const parsed = JSON.parse(vapidPrivateKeyJwk);
              privateKey = parsed.d || vapidPrivateKeyJwk;
            } catch {
              if (vapidPrivateKeyJwk.length > 44) {
                const stdBase64 = vapidPrivateKeyJwk.replace(/-/g, "+").replace(/_/g, "/").padEnd(
                  vapidPrivateKeyJwk.length + (4 - (vapidPrivateKeyJwk.length % 4)) % 4, "="
                );
                try {
                  const binaryStr = atob(stdBase64);
                  const pkcs8Bytes = new Uint8Array(binaryStr.length);
                  for (let i = 0; i < binaryStr.length; i++) pkcs8Bytes[i] = binaryStr.charCodeAt(i);
                  const cryptoKey = await crypto.subtle.importKey(
                    "pkcs8", pkcs8Bytes.buffer,
                    { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]
                  );
                  const jwk = await crypto.subtle.exportKey("jwk", cryptoKey);
                  if (jwk.d) privateKey = jwk.d;
                } catch (e) {
                  console.error("[PUSH] Failed to extract key:", e);
                }
              }
            }

            webpush.setVapidDetails("mailto:noreply@holzen.app", vapidPublicKey, privateKey);

            const payload = JSON.stringify({
              title: "Holzen — Night Reflection",
              body: message,
            });

            for (const sub of pushSubs) {
              try {
                await webpush.sendNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  payload
                );
              } catch (pushErr: any) {
                console.error(`[PUSH] Failed:`, pushErr.message);
                if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
                }
              }
            }
          } catch (vapidErr) {
            console.error("[PUSH] VAPID setup error:", vapidErr);
          }
        }
      }

      sent++;
    }

    console.log(`[NIGHT-REFLECTION] Sent ${sent} night reflections`);
    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[NIGHT-REFLECTION] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
