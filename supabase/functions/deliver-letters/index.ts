import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import webpush from "https://esm.sh/web-push@3.6.7";
import { createCidSupabaseClient, sendWebPushWithCid } from "../_shared/cid-clients.ts";
import { unknownErrorForLog, webPushStatusCode } from "../_shared/log-unknown-error.ts";
import { coingeckoHeaders } from "../_shared/coingecko.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

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

serve(
  withRequestLogging("deliver-letters", async ({ req, log, cid }) => {
  try {
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      log.warn("deliver_letters_phase", {
        holzen_event: "deliver_letters_cron",
        phase: "service_auth_rejected",
      });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    log("deliver_letters_phase", {
      holzen_event: "deliver_letters_cron",
      phase: "service_auth_ok",
    });
    const supabase = createCidSupabaseClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      cid,
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

    // Determine current market direction (any magnitude — threshold checked per-letter)
    const isCrash = changePercent < 0;
    const isSurge = changePercent > 0;

    if (changePercent === 0) {
      log("deliver_letters_complete", {
        holzen_event: "deliver_letters_cron",
        phase: "run_complete",
        delivered: 0,
        condition: "neutral",
      });
      return new Response(JSON.stringify({ delivered: 0, condition: "neutral" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentCondition = isCrash ? "crash" : "surge";
    const absChange = Math.abs(changePercent);
    log("deliver_letters_phase", {
      holzen_event: "deliver_letters_cron",
      phase: "market_context",
      condition: currentCondition,
      absChange: Number(absChange.toFixed(1)),
    });

    // 2. Find letters waiting for this condition
    const { data: letters, error: lettersError } = await supabase
      .from("future_letters")
      .select("id, user_id, body, btc_price_at_write, written_during, written_at, delivery_threshold")
      .eq("delivered", false)
      .eq("deliver_during", currentCondition);

    if (lettersError) throw lettersError;
    if (!letters || letters.length === 0) {
      log("deliver_letters_complete", {
        holzen_event: "deliver_letters_cron",
        phase: "run_complete",
        delivered: 0,
        reason: "no_letters",
      });
      return new Response(JSON.stringify({ delivered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let delivered = 0;
    const priceCache = new Map<string, number>();

    for (const letter of letters) {
      // Use per-letter threshold (locked at write time), fallback to 5% for legacy letters
      const letterThreshold = letter.delivery_threshold ?? 5;

      // Only deliver if the current change magnitude meets the letter's threshold
      if (absChange < letterThreshold) {
        log("deliver_letters_skip", {
          holzen_event: "deliver_letters_cron",
          phase: "skip_below_threshold",
          letter_id_prefix: String(letter.id).slice(0, 8),
          letter_threshold: letterThreshold,
          current_abs: Number(absChange.toFixed(1)),
        });
        continue;
      }

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
                  try {
                    log.error("deliver_letters_vapid_key_extract_failed", {
                      holzen_event: "deliver_letters_vapid_key_extract_failed",
                      detail: e instanceof Error ? e.message : String(e),
                    });
                  } catch {
                    /* non-fatal */
                  }
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
                await sendWebPushWithCid(
                  log,
                  webpush,
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  payload,
                  { notificationTag: "letter", expectedStatusCodes: [404, 410] }
                );
              } catch (pushErr: unknown) {
                const sc = webPushStatusCode(pushErr);
                if (sc === 410 || sc === 404) {
                  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
                }
              }
            }
          } catch (vapidErr) {
            log.error("deliver_letters_vapid", {
              holzen_event: "deliver_letters_cron",
              phase: "push_vapid_setup_error",
              ...unknownErrorForLog(vapidErr),
            });
          }
        }
      }

      delivered++;
    }

    log("deliver_letters_complete", {
      holzen_event: "deliver_letters_cron",
      phase: "run_complete",
      delivered,
      condition: currentCondition,
    });
    return new Response(JSON.stringify({ delivered, condition: currentCondition }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("deliver_letters_uncaught", {
      holzen_event: "deliver_letters_cron",
      phase: "uncaught",
      ...unknownErrorForLog(e),
    });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);