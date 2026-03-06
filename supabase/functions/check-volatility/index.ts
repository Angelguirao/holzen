import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

async function fetchBtcVolatility(): Promise<{ changePercent: number; direction: string }> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1"
  );
  if (!res.ok) throw new Error("Failed to fetch BTC data");
  const data = await res.json();
  const prices: [number, number][] = data.prices;
  if (!prices || prices.length < 2) throw new Error("Insufficient price data");

  const price24hAgo = prices[0][1];
  const currentPrice = prices[prices.length - 1][1];
  const changePercent = ((currentPrice - price24hAgo) / price24hAgo) * 100;

  return {
    changePercent,
    direction: changePercent >= 0 ? "up" : "down",
  };
}

async function generateReflection(context: string, apiKey: string): Promise<string | null> {
  const systemPrompt = `You generate exactly one short message (1-3 sentences) in response to Bitcoin volatility information.

Rules:
- Encourage pause and reflection.
- Preserve agency: the user decides. Never say "you should" hold, sell, or buy.
- Calm, minimal tone.
- No reassurance ("it'll be okay"), no excitement, no urgency.
- No lists, no disclaimers, no trading advice.
- Do not ask the user to open the app again or take any specific action.
- No exclamation marks, no emojis, no motivational language.
- No reward language ("great job", "well done").
- Just one quiet prompt for reflection.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("AI gateway error:", response.status, text);
    return null;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

async function sendNotificationEmail(
  email: string,
  reflection: string,
  context: string
): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.error("[EMAIL] RESEND_API_KEY not configured");
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'IBM Plex Mono', monospace, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; color: #2a2a2a; background: #f7f5f0;">
      <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #737373; margin-bottom: 24px;">HOLZEN</p>
      <p style="font-size: 13px; color: #737373; margin-bottom: 16px;">${context}</p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">${reflection}</p>
      <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">
      <p style="font-size: 11px; color: #a3a3a3;">This is an automated notification from Holzen. You can disable email notifications in your settings.</p>
    </body>
    </html>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Holzen <onboarding@resend.dev>",
        to: [email],
        subject: "Holzen — A moment to pause",
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[EMAIL] Resend error [${res.status}]: ${errText}`);
      return false;
    }

    await res.json();
    console.log(`[EMAIL] Sent to ${email}`);
    return true;
  } catch (e) {
    console.error("[EMAIL] Send error:", e);
    return false;
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // 1. Fetch current BTC volatility
    const btc = await fetchBtcVolatility();
    const absChange = Math.abs(btc.changePercent);
    console.log(`[CHECK-VOLATILITY] BTC change: ${btc.changePercent.toFixed(2)}%`);

    // 2. Get all profiles where volatility exceeds their threshold and not in cooldown
    const cutoff = new Date(Date.now() - COOLDOWN_MS).toISOString();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, threshold, email_notifications, last_trigger_at")
      .lte("threshold", absChange);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      console.log("[CHECK-VOLATILITY] No users exceeded threshold");
      return new Response(JSON.stringify({ triggered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter out users in cooldown
    const eligible = profiles.filter((p) => {
      if (!p.last_trigger_at) return true;
      return new Date(p.last_trigger_at).getTime() < Date.now() - COOLDOWN_MS;
    });

    console.log(`[CHECK-VOLATILITY] ${eligible.length} users eligible (${profiles.length} exceeded threshold)`);

    let triggered = 0;

    for (const profile of eligible) {
      const dir = btc.direction === "down" ? "down" : "up";
      const pct = absChange.toFixed(1);
      const ctx = `BTC is ${dir} ${pct}% in the last 24 hours.`;

      // Generate reflection
      const reflection = await generateReflection(ctx, LOVABLE_API_KEY);
      if (!reflection) {
        console.log(`[CHECK-VOLATILITY] Failed to generate reflection for ${profile.user_id}`);
        continue;
      }

      // Save to reflection history
      await supabase
        .from("reflections")
        .insert({ user_id: profile.user_id, message: reflection, context: ctx });

      // Update profile with new reflection
      await supabase
        .from("profiles")
        .update({
          last_message: reflection,
          last_context: ctx,
          last_trigger_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);

      // Send email notification if enabled
      if (profile.email_notifications) {
        // Get user email from auth
        const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
        const email = userData?.user?.email;
        if (email) {
          await sendNotificationEmail(email, reflection, ctx);
        }
      }

      // Send push notifications
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
            console.log(`[PUSH] VAPID private key length: ${vapidPrivateKeyJwk.length}, starts: "${vapidPrivateKeyJwk.substring(0, 8)}"`);
            
            try {
              const parsed = JSON.parse(vapidPrivateKeyJwk);
              privateKey = parsed.d || vapidPrivateKeyJwk;
            } catch {
              if (vapidPrivateKeyJwk.length > 44) {
                // PKCS8 EC P-256 key - extract raw 32-byte private key using Web Crypto
                let stdBase64 = vapidPrivateKeyJwk.replace(/-/g, "+").replace(/_/g, "/");
                while (stdBase64.length % 4) stdBase64 += "=";
                try {
                  const binaryStr = atob(stdBase64);
                  const pkcs8Bytes = new Uint8Array(binaryStr.length);
                  for (let i = 0; i < binaryStr.length; i++) pkcs8Bytes[i] = binaryStr.charCodeAt(i);
                  
                  // Import as CryptoKey then export as JWK to get the raw 'd' value
                  const cryptoKey = await crypto.subtle.importKey(
                    "pkcs8",
                    pkcs8Bytes.buffer,
                    { name: "ECDSA", namedCurve: "P-256" },
                    true,
                    ["sign"]
                  );
                  const jwk = await crypto.subtle.exportKey("jwk", cryptoKey);
                  if (jwk.d) {
                    privateKey = jwk.d;
                    console.log(`[PUSH] Extracted raw key from PKCS8 via Web Crypto, length: ${privateKey.length}`);
                  }
                } catch (decodeErr) {
                  console.error("[PUSH] Failed to extract key from PKCS8:", decodeErr);
                }
              }
            }

            webpush.setVapidDetails(
              "mailto:noreply@holzen.app",
              vapidPublicKey,
              privateKey
            );

            const payload = JSON.stringify({
              title: "Holzen",
              body: reflection.slice(0, 120),
            });

            for (const sub of pushSubs) {
              try {
                await webpush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                  },
                  payload
                );
              } catch (pushErr: any) {
                console.error(`[PUSH] Failed for ${sub.endpoint}:`, pushErr.message, "statusCode:", pushErr.statusCode, "body:", pushErr.body);
                // Remove invalid subscriptions (410 Gone or 404)
                if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                  await supabase
                    .from("push_subscriptions")
                    .delete()
                    .eq("endpoint", sub.endpoint);
                }
              }
            }
          } catch (vapidErr) {
            console.error("[PUSH] VAPID setup error:", vapidErr);
          }
        }
      }

      triggered++;
    }

    console.log(`[CHECK-VOLATILITY] Triggered ${triggered} notifications`);

    return new Response(JSON.stringify({ triggered, btcChange: btc.changePercent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[CHECK-VOLATILITY] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});