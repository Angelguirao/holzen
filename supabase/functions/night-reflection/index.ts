import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import webpush from "https://esm.sh/web-push@3.6.7";
import { createCidSupabaseClient, sendWebPushWithCid } from "../_shared/cid-clients.ts";
import { holzenEdgeError, holzenEdgeLog, holzenEdgeRun } from "../_shared/holzen-edge-log.ts";
import { createAttemptLogger } from "../_shared/observe.ts";
import { coingeckoHeaders } from "../_shared/coingecko.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

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
    return -1;
  }
}

async function fetchWithRetry(url: string, retries = 3, delayMs = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: coingeckoHeaders() });
    if (res.ok) return res;
    await res.text();
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
  }
  throw new Error("Failed to fetch BTC data after retries");
}

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

// Language-specific fallback messages (used when AI is unavailable)
const FALLBACKS: Record<string, { reflected: (pct: string) => string; quiet: (pct: string) => string }> = {
  en: {
    reflected: (pct) => `BTC moved ${pct}% today. You showed up, paused, and chose intentionally. That compounds.`,
    quiet: (pct) => `BTC moved ${pct}% today. You didn't react. That's a skill most never develop.`,
  },
  es: {
    reflected: (pct) => `BTC se movió ${pct}% hoy. Te presentaste, pausaste y elegiste con intención. Eso se acumula.`,
    quiet: (pct) => `BTC se movió ${pct}% hoy. No reaccionaste. Esa es una habilidad que pocos desarrollan.`,
  },
  pt: {
    reflected: (pct) => `BTC moveu ${pct}% hoje. Você apareceu, pausou e escolheu intencionalmente. Isso se acumula.`,
    quiet: (pct) => `BTC moveu ${pct}% hoje. Você não reagiu. Essa é uma habilidade que poucos desenvolvem.`,
  },
  de: {
    reflected: (pct) => `BTC bewegte sich heute um ${pct}%. Du warst da, hast pausiert und bewusst gewählt. Das summiert sich.`,
    quiet: (pct) => `BTC bewegte sich heute um ${pct}%. Du hast nicht reagiert. Das ist eine Fähigkeit, die wenige entwickeln.`,
  },
  fr: {
    reflected: (pct) => `BTC a bougé de ${pct}% aujourd'hui. Tu t'es arrêté, tu as pausé et choisi avec intention. Ça s'accumule.`,
    quiet: (pct) => `BTC a bougé de ${pct}% aujourd'hui. Tu n'as pas réagi. C'est une compétence rare.`,
  },
  nl: {
    reflected: (pct) => `BTC bewoog vandaag ${pct}%. Je was erbij, pauzeerde en koos bewust. Dat cumuleert.`,
    quiet: (pct) => `BTC bewoog vandaag ${pct}%. Je reageerde niet. Dat is een vaardigheid die weinigen ontwikkelen.`,
  },
  tr: {
    reflected: (pct) => `BTC bugün %${pct} hareket etti. Durdun, nefes aldın ve bilinçli seçim yaptın. Bu birikir.`,
    quiet: (pct) => `BTC bugün %${pct} hareket etti. Tepki vermedin. Bu çoğunun geliştirmediği bir beceri.`,
  },
};

const LANG_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", pt: "Portuguese",
  de: "German", fr: "French", nl: "Dutch", tr: "Turkish",
};

async function generateAIMessage(
  apiKey: string,
  lang: string,
  btcPct: string,
  btcDirection: string,
  hadReflection: boolean,
  recentReflections: any[],
  recentMoods: string[],
  streakDays: number,
  tone: string,
  logAttempt: (p: Parameters<ReturnType<typeof createAttemptLogger>>[0]) => void,
): Promise<string | null> {
  const moodSummary = recentMoods.length > 0
    ? `Recent moods (last 7 days): ${recentMoods.join(", ")}`
    : "No mood data this week.";

  const reflectionSummary = recentReflections.length > 0
    ? recentReflections.map((r, i) => {
        const ctx = (r.context_snapshot?.context_text as string | undefined) || r.context || 'none';
        return `${i + 1}. Context: "${ctx}" | Mood: ${r.initial_mood || 'unknown'} → ${r.shift_mood || '?'} | Decision: ${r.outcome || 'pending'}`;
      }).join("\n")
    : "No pauses today.";

  const systemPrompt = `You are Holzen's night reflection companion — a calm, wise presence that helps Bitcoin holders build emotional composure.

Your task: Write a single personalized end-of-day message (1-3 sentences max). This is NOT a generic motivational quote. It must feel like it was written specifically for THIS person based on their actual day.

Rules:
- Write in ${LANG_NAMES[lang] || "English"}
- Tone: ${tone} (stoic, gentle, direct, philosophical — match their preference)
- Reference specific details from their day when available (their moods, decisions, patterns)
- Never give financial advice or mention specific prices
- Never be generic — if you can't personalize, observe something specific about BTC's movement and what it might have stirred
- Be concise — this appears as a small card notification
- No emojis, no greeting, no sign-off — just the reflection itself`;

  const userPrompt = `BTC moved ${btcPct}% ${btcDirection} today.
${hadReflection ? "The user paused today." : "The user did NOT open the app or pause today."}
${moodSummary}
Active pause streak: ${streakDays} days

Today's pauses:
${reflectionSummary}

Write one personalized night reflection message.`;

  const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];

  for (const model of models) {
    const t0 = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.6,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        holzenEdgeError("night-reflection", `AI ${model} HTTP ${response.status}`);
        logAttempt({
          companion_type: "night_reflection",
          provider: "lovable",
          model,
          status: "error",
          latency_ms: Date.now() - t0,
          error_message: `HTTP ${response.status}`,
        });
        if (model !== models[models.length - 1]) continue;
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content || content.length < 10) {
        logAttempt({
          companion_type: "night_reflection",
          provider: "lovable",
          model,
          status: "quality_gate_failed",
          latency_ms: Date.now() - t0,
          input_tokens: data?.usage?.prompt_tokens,
          output_tokens: data?.usage?.completion_tokens,
          quality_gate_reason: "empty_or_too_short",
        });
        if (model !== models[models.length - 1]) continue;
        return null;
      }

      logAttempt({
        companion_type: "night_reflection",
        provider: "lovable",
        model,
        status: "success",
        latency_ms: Date.now() - t0,
        input_tokens: data?.usage?.prompt_tokens,
        output_tokens: data?.usage?.completion_tokens,
      });
      // Strip any surrounding quotes the model might add
      return content.replace(/^["']|["']$/g, "").trim();
    } catch (e) {
      holzenEdgeError("night-reflection", `AI ${model} error`, e);
      const isAbort = e instanceof DOMException && e.name === "AbortError";
      logAttempt({
        companion_type: "night_reflection",
        provider: "lovable",
        model,
        status: isAbort ? "timeout" : "error",
        latency_ms: Date.now() - t0,
        error_message: e instanceof Error ? e.message : String(e),
      });
      if (model !== models[models.length - 1]) continue;
      return null;
    }
  }
  return null;
}

serve(
  withRequestLogging("night-reflection", async ({ req, log, cid }) => {
  try {
    holzenEdgeRun("night-reflection", "request", { method: req.method });
    const { verifyServiceAuth } = await import("../_shared/auth.ts");
    if (!verifyServiceAuth(req)) {
      holzenEdgeRun("night-reflection", "auth rejected");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    holzenEdgeRun("night-reflection", "auth ok");
    const supabase = createCidSupabaseClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      cid,
      { auth: { persistSession: false } }
    );

    let LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Feature flag + global budget guard. If disabled / over budget, we still
    // deliver a fallback message (FALLBACKS above) without the AI call.
    const { guardAiFeature } = await import("../_shared/ratelimit.ts");
    const nightGuard = await guardAiFeature(supabase, "night_reflection", {
      providers: ["lovable"],
    });
    if (!nightGuard.allowed) {
      holzenEdgeLog("night-reflection", "ai skipped", { reason: nightGuard.reason });
      LOVABLE_API_KEY = undefined;
    }

    const usdData = await fetchBtc1dData("USD");
    holzenEdgeLog("night-reflection", "BTC 24h context", { changePct: Number(usdData.changePercent.toFixed(2)) });

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, reflection_tone, timezone, night_reflection_hour, hold_goal_currency, language");

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      holzenEdgeLog("night-reflection", "run complete", { sent: 0, reason: "no_profiles" });
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

      const currency = (profile as any).hold_goal_currency || "USD";
      const btc = await fetchBtc1dData(currency);
      const userLang = (profile as any).language || "en";
      const tone = (profile as any).reflection_tone || "stoic";

      // Fetch today's pause sessions for this user (read model)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        { data: todayPauses },
        { data: recentMoodEvents },
        { data: streakPauses },
      ] = await Promise.all([
        supabase
          .from("v_pause_full")
          .select("context_snapshot, initial_mood, shift_mood, outcome, reflection_text")
          .eq("user_id", profile.user_id)
          .gte("created_at", todayStart.toISOString())
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("pause_step_events")
          .select("payload")
          .eq("user_id", profile.user_id)
          .eq("step_type", "initial_emotion_logged")
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("pause_instances")
          .select("created_at")
          .eq("user_id", profile.user_id)
          .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString())
          .order("created_at", { ascending: false }),
      ]);

      const hadReflection = (todayPauses?.length ?? 0) > 0;
      const recentMoods = (recentMoodEvents ?? [])
        .map((r: any) => r.payload?.mood)
        .filter((m: unknown): m is string => typeof m === "string");

      // Calculate streak (consecutive days with at least one pause)
      let streakDays = 0;
      if (streakPauses && streakPauses.length > 0) {
        const daySet = new Set(
          streakPauses.map((r: any) => new Date(r.created_at).toISOString().slice(0, 10))
        );
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          if (daySet.has(d.toISOString().slice(0, 10))) {
            streakDays++;
          } else if (i > 0) break; // allow today to be missing
        }
      }

      // Try AI generation, fall back to static
      let message: string;
      if (LOVABLE_API_KEY) {
        // Track AI usage
        try { await supabase.from("analytics_events").insert({ user_id: profile.user_id, event: "night_reflection_ai_call" }); } catch (_) { /* non-fatal */ }
        const logAttempt = createAttemptLogger(supabase, { userId: profile.user_id });
        const aiMessage = await generateAIMessage(
          LOVABLE_API_KEY,
          userLang,
          btc.absChange,
          btc.direction,
          hadReflection,
          todayPauses ?? [],
          recentMoods,
          streakDays,
          tone,
          logAttempt,
        );
        if (aiMessage) {
          message = aiMessage;
        } else {
          const msgs = FALLBACKS[userLang] || FALLBACKS.en;
          message = hadReflection ? msgs.reflected(btc.absChange) : msgs.quiet(btc.absChange);
        }
      } else {
        const msgs = FALLBACKS[userLang] || FALLBACKS.en;
        message = hadReflection ? msgs.reflected(btc.absChange) : msgs.quiet(btc.absChange);
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
                  holzenEdgeError("night-reflection", "push: extract subscription key failed", e);
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
                await sendWebPushWithCid(
                  log,
                  webpush,
                  { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                  payload,
                  { notificationTag: "night_reflection" }
                );
              } catch (pushErr: any) {
                holzenEdgeError("night-reflection", "push send failed", { message: pushErr?.message, cid });
                if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
                }
              }
            }
          } catch (vapidErr) {
            holzenEdgeError("night-reflection", "push VAPID setup error", vapidErr);
          }
        }
      }

      sent++;
    }

    holzenEdgeLog("night-reflection", "run complete", { sent });
    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    holzenEdgeError("night-reflection", "uncaught error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
