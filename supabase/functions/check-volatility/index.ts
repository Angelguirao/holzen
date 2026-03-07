import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours fallback

async function fetchWithRetry(url: string, retries = 3, delayMs = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url);
    if (res.ok) return res;
    console.warn(`[CHECK-VOLATILITY] Fetch attempt ${i + 1} failed (${res.status}), ${i < retries - 1 ? "retrying..." : "giving up"}`);
    await res.text(); // consume body
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
  }
  throw new Error("Failed to fetch BTC data after retries");
}

async function fetchBtcVolatility(): Promise<{ changePercent: number; direction: string; cumulativeChangePercent: number; cumulativeDirection: string }> {
  const [res1d, res7d] = await Promise.all([
    fetchWithRetry("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1"),
    fetchWithRetry("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7"),
  ]);

  const data1d = await res1d.json();
  const prices1d: [number, number][] = data1d.prices;
  if (!prices1d || prices1d.length < 2) throw new Error("Insufficient price data");

  const price24hAgo = prices1d[0][1];
  const currentPrice = prices1d[prices1d.length - 1][1];
  const changePercent = ((currentPrice - price24hAgo) / price24hAgo) * 100;

  const data7d = await res7d.json();
  const prices7d: [number, number][] = data7d.prices;
  let cumulativeChangePercent = 0;
  if (prices7d && prices7d.length >= 2) {
    const price7dAgo = prices7d[0][1];
    cumulativeChangePercent = ((currentPrice - price7dAgo) / price7dAgo) * 100;
  }

  return {
    changePercent,
    direction: changePercent >= 0 ? "up" : "down",
    cumulativeChangePercent,
    cumulativeDirection: cumulativeChangePercent >= 0 ? "up" : "down",
  };
}

interface ReflectionResult {
  message: string;
  haiku: string | null;
  learning_title: string | null;
  learning_body: string | null;
}

async function generateReflection(context: string, apiKey: string, tone = "stoic"): Promise<ReflectionResult | null> {
  const TONE_INSTRUCTIONS: Record<string, string> = {
    stoic: "Write in a calm, stoic tone. Brief and grounded. Like Marcus Aurelius observing the market.",
    zen: "Write in a gentle zen tone. Spacious, almost meditative. Use natural metaphors.",
    poetic: "Write in a poetic, literary tone. Evocative and beautiful. Use imagery and rhythm.",
    blunt: "Write in a direct, blunt tone. No fluff. Say it plainly in as few words as possible.",
  };

  const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.stoic;

  const systemPrompt = `You generate a reflection with optional companions in response to Bitcoin volatility.

You MUST respond by calling the "generate_reflection" function. Do not respond with plain text.

Tone: ${toneInstruction}

The context may include a Fear & Greed Index score (0-100). Use this to subtly adjust your reflection:
- Extreme Fear (0-24): The crowd is panicking. Reflect on what happens when fear spreads.
- Fear (25-44): Unease is building. A good moment to notice what's driving decisions.
- Neutral (45-55): The market is quiet. Sometimes stillness is its own signal.
- Greed (56-75): Optimism is growing. Worth noticing if excitement is clouding judgment.
- Extreme Greed (76-100): Euphoria is everywhere. The hardest time to stay grounded.
Do NOT name the index or its score directly. Weave the sentiment naturally into the reflection.

Reflection rules:
- Exactly 1-3 sentences. ${tone === 'blunt' ? '1 sentence preferred.' : ''}
- Encourage pause and reflection. Preserve agency: never say "you should".
- No reassurance, excitement, urgency, trading advice, lists, disclaimers.
- No exclamation marks, emojis, motivational language, reward language.
- Just one quiet prompt for reflection.

Haiku rules:
- Exactly 3 lines separated by newlines.
- Traditional 5-7-5 syllable structure.
- Captures the essence of the moment. Match the chosen tone.
- No trading advice or price predictions.

Learning input rules:
- Title: a short, factual headline (5-10 words).
- Body: 1-2 sentences about a historical Bitcoin event, market pattern, or behavioral finance insight relevant to the current context. Factual, educational, no advice.`;

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
      tools: [
        {
          type: "function",
          function: {
            name: "generate_reflection",
            description: "Generate a reflection message with optional haiku and learning companions.",
            parameters: {
              type: "object",
              properties: {
                message: { type: "string", description: "The core reflection message (1-3 sentences)." },
                haiku: { type: "string", description: "A haiku (3 lines, 5-7-5 syllables). Lines separated by newlines." },
                learning_title: { type: "string", description: "Short factual headline for a historical/educational insight." },
                learning_body: { type: "string", description: "1-2 sentences of factual, educational context." },
              },
              required: ["message", "haiku", "learning_title", "learning_body"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "generate_reflection" } },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("AI gateway error:", response.status, text);
    return null;
  }

  const data = await response.json();

  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    const args = JSON.parse(toolCall.function.arguments);
    return {
      message: args.message,
      haiku: args.haiku || null,
      learning_title: args.learning_title || null,
      learning_body: args.learning_body || null,
    };
  }

  // Fallback to plain content
  const message = data.choices?.[0]?.message?.content?.trim();
  if (!message) return null;
  return { message, haiku: null, learning_title: null, learning_body: null };
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
        from: "Holzen <notify@holzen.app>",
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
    const absCumChange = Math.abs(btc.cumulativeChangePercent);
    console.log(`[CHECK-VOLATILITY] BTC 24h: ${btc.changePercent.toFixed(2)}%, 7d: ${btc.cumulativeChangePercent.toFixed(2)}%`);

    // 2. Get all profiles - we need to check both thresholds
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, threshold, cumulative_threshold, email_notifications, last_trigger_at, cooldown_hours, reflection_tone, companion_haiku, companion_learning");

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      console.log("[CHECK-VOLATILITY] No users exceeded threshold");
      return new Response(JSON.stringify({ triggered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter: must exceed at least one threshold AND not in cooldown
    const eligible = profiles.filter((p) => {
      const dailyTriggered = absChange >= (p.threshold ?? 5);
      const cumulativeTriggered = absCumChange >= ((p as any).cumulative_threshold ?? 15);
      if (!dailyTriggered && !cumulativeTriggered) return false;
      if (!p.last_trigger_at) return true;
      const cooldownMs = ((p as any).cooldown_hours ?? 6) * 60 * 60 * 1000;
      return new Date(p.last_trigger_at).getTime() < Date.now() - cooldownMs;
    });

    console.log(`[CHECK-VOLATILITY] ${eligible.length} users eligible (${profiles.length} total)`);

    let triggered = 0;

    for (const profile of eligible) {
      const dir = btc.direction === "down" ? "down" : "up";
      const pct = absChange.toFixed(1);
      let ctx = `BTC is ${dir} ${pct}% in the last 24 hours.`;
      if (absCumChange >= ((profile as any).cumulative_threshold ?? 15)) {
        const cumDir = btc.cumulativeDirection === "down" ? "down" : "up";
        ctx += ` Over 7 days, it's ${cumDir} ${absCumChange.toFixed(1)}%.`;
      }

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