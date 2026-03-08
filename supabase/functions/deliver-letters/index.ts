import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import webpush from "npm:web-push@3.6.7";

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

    // 1. Fetch current BTC price and 24h change (USD for threshold check)
    const res = await fetchWithRetry(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1"
    );
    const data = await res.json();
    const prices: [number, number][] = data.prices;
    if (!prices || prices.length < 2) throw new Error("Insufficient price data");

    const price24hAgo = prices[0][1];
    const currentPriceUsd = prices[prices.length - 1][1];
    const changePercent = ((currentPriceUsd - price24hAgo) / price24hAgo) * 100;

    // Determine current market condition
    const isCrash = changePercent <= -5;
    const isSurge = changePercent >= 5;

    if (!isCrash && !isSurge) {
      console.log(`[DELIVER-LETTERS] No extreme condition (${changePercent.toFixed(1)}%), skipping`);
      return new Response(JSON.stringify({ delivered: 0, condition: "neutral" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentCondition = isCrash ? "crash" : "surge";
    console.log(`[DELIVER-LETTERS] Market condition: ${currentCondition} (${changePercent.toFixed(1)}%)`);

    // 2. Find letters waiting for this condition
    const { data: letters, error: lettersError } = await supabase
      .from("future_letters")
      .select("id, user_id, body, btc_price_at_write, written_during, written_at")
      .eq("delivered", false)
      .eq("deliver_during", currentCondition);

    if (lettersError) throw lettersError;
    if (!letters || letters.length === 0) {
      console.log("[DELIVER-LETTERS] No letters to deliver");
      return new Response(JSON.stringify({ delivered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let delivered = 0;

    // Cache for per-currency price lookups
    const priceCache = new Map<string, number>();

    for (const letter of letters) {
      // Get user's currency preference for delivery price
      const { data: profile } = await supabase
        .from("profiles")
        .select("hold_goal_currency")
        .eq("user_id", letter.user_id)
        .single();

      const currency = (profile?.hold_goal_currency || "USD").toLowerCase();
      let deliveryPrice: number;

      if (currency === "usd") {
        deliveryPrice = currentPriceUsd;
      } else {
        const cached = priceCache.get(currency);
        if (cached) {
          deliveryPrice = cached;
        } else {
          try {
            const curRes = await fetchWithRetry(
              `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency}`
            );
            const curData = await curRes.json();
            deliveryPrice = curData?.bitcoin?.[currency] ?? currentPriceUsd;
            priceCache.set(currency, deliveryPrice);
          } catch {
            deliveryPrice = currentPriceUsd;
          }
        }
      }

      // Mark as delivered
      await supabase
        .from("future_letters")
        .update({
          delivered: true,
          delivered_at: new Date().toISOString(),
          btc_price_at_delivery: deliveryPrice,
        })
        .eq("id", letter.id);

      // Send push notification
      const { data: pushSubs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", letter.user_id);

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

            const snippet = letter.body.length > 80 ? letter.body.slice(0, 80) + "…" : letter.body;
            const payload = JSON.stringify({
              title: "Holzen — A letter from your past self",
              body: snippet,
            });

            for (const sub of pushSubs) {
              try {
                await webpush.sendNotification(
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  payload
                );
              } catch (pushErr: any) {
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

      delivered++;
    }

    console.log(`[DELIVER-LETTERS] Delivered ${delivered} letters`);
    return new Response(JSON.stringify({ delivered, condition: currentCondition }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[DELIVER-LETTERS] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
