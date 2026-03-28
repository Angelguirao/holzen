import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import webpush from "npm:web-push@3.6.7";
import {
  generateUnifiedReflection,
  type MoodHistoryEntry,
} from "../_shared/reflection-generate.ts";
import { sanitizePromptInput, sanitizePromptArray } from "../_shared/sanitize.ts";

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

  // Auth: require service role key or cron secret
  const { verifyServiceAuth } = await import("../_shared/auth.ts");
  if (!verifyServiceAuth(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
      .select(
        "user_id, threshold, threshold_down, cumulative_threshold, email_notifications, last_trigger_at, cooldown_hours, reflection_tone, companion_haiku, companion_grounding, companion_signal, companion_zoom_out, companion_history, quiet_hours_start, quiet_hours_end, timezone, language, snoozed_until, custom_prompt, reflection_style, motivations, mantra, grounding_activities",
      );

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      console.log("[CHECK-VOLATILITY] No users exceeded threshold");
      return new Response(JSON.stringify({ triggered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper: get user's local hour
    function getUserLocalHour(timezone: string): number {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: timezone });
        return parseInt(formatter.format(new Date()), 10);
      } catch { return new Date().getUTCHours(); }
    }

    // Helper: check if user is in quiet hours (timezone-aware)
    // Checks both the legacy single-window profile fields AND the new quiet_windows table
    const { data: allQuietWindows } = await supabase
      .from("quiet_windows")
      .select("user_id, start_hour, end_hour, days, active");

    const quietWindowsByUser = new Map<string, Array<{ start_hour: number; end_hour: number; days: number[] }>>();
    for (const w of (allQuietWindows || [])) {
      if (!w.active) continue;
      if (!quietWindowsByUser.has(w.user_id)) quietWindowsByUser.set(w.user_id, []);
      quietWindowsByUser.get(w.user_id)!.push(w);
    }

    function isInQuietHours(p: any): boolean {
      const tz = p.timezone || "UTC";
      const localHour = getUserLocalHour(tz);

      // Check legacy single-window
      const start = p.quiet_hours_start;
      const end = p.quiet_hours_end;
      if (start != null && end != null) {
        if (start <= end ? (localHour >= start && localHour < end) : (localHour >= start || localHour < end)) {
          return true;
        }
      }

      // Check extended quiet windows
      const windows = quietWindowsByUser.get(p.user_id);
      if (windows) {
        // Get local day of week (0=Sunday)
        let localDay: number;
        try {
          const formatter = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: tz });
          const dayStr = formatter.format(new Date());
          const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
          localDay = dayMap[dayStr] ?? new Date().getDay();
        } catch { localDay = new Date().getDay(); }

        for (const w of windows) {
          if (!w.days.includes(localDay)) continue;
          const s = w.start_hour;
          const e = w.end_hour;
          if (s <= e ? (localHour >= s && localHour < e) : (localHour >= s || localHour < e)) {
            return true;
          }
        }
      }

      return false;
    }

    // Filter: must exceed at least one threshold AND not in cooldown AND not in quiet hours
    // Helper: check if user has an active snooze
    function isSnoozed(p: any): boolean {
      const snoozedUntil = p.snoozed_until;
      if (!snoozedUntil) return false;
      return new Date(snoozedUntil).getTime() > Date.now();
    }

    const eligible = profiles.filter((p) => {
      // Use direction-aware thresholds: threshold for up moves, threshold_down for down moves
      const effectiveThreshold = btc.direction === "down"
        ? ((p as any).threshold_down ?? p.threshold ?? 5)
        : (p.threshold ?? 5);
      const dailyTriggered = absChange >= effectiveThreshold;
      const cumulativeTriggered = absCumChange >= ((p as any).cumulative_threshold ?? 15);
      if (!dailyTriggered && !cumulativeTriggered) return false;
      if (isInQuietHours(p)) return false;
      if (isSnoozed(p)) return false;
      if (!p.last_trigger_at) return true;
      const cooldownMs = ((p as any).cooldown_hours ?? 6) * 60 * 60 * 1000;
      return new Date(p.last_trigger_at).getTime() < Date.now() - cooldownMs;
    });

    console.log(`[CHECK-VOLATILITY] ${eligible.length} users eligible (${profiles.length} total)`);

    // Parse and configure VAPID once — all users share the same keys
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKeyJwk = Deno.env.get("VAPID_PRIVATE_KEY");
    let vapidReady = false;
    if (vapidPublicKey && vapidPrivateKeyJwk) {
      try {
        let privateKey = vapidPrivateKeyJwk;
        try {
          const parsed = JSON.parse(vapidPrivateKeyJwk);
          privateKey = parsed.d || vapidPrivateKeyJwk;
        } catch {
          if (vapidPrivateKeyJwk.length > 44) {
            let stdBase64 = vapidPrivateKeyJwk.replace(/-/g, "+").replace(/_/g, "/");
            while (stdBase64.length % 4) stdBase64 += "=";
            try {
              const binaryStr = atob(stdBase64);
              const pkcs8Bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) pkcs8Bytes[i] = binaryStr.charCodeAt(i);
              const cryptoKey = await crypto.subtle.importKey(
                "pkcs8", pkcs8Bytes.buffer, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]
              );
              const jwk = await crypto.subtle.exportKey("jwk", cryptoKey);
              if (jwk.d) privateKey = jwk.d;
            } catch (decodeErr) {
              console.error("[PUSH] Failed to extract key from PKCS8:", decodeErr);
            }
          }
        }
        webpush.setVapidDetails("mailto:noreply@holzen.app", vapidPublicKey, privateKey);
        vapidReady = true;
      } catch (vapidErr) {
        console.error("[PUSH] VAPID setup error:", vapidErr);
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Process all eligible users in parallel
    const results = await Promise.all(eligible.map(async (profile) => {
      // Optimistic lock: claim the cooldown slot BEFORE generating the reflection
      const nowIso = new Date().toISOString();
      const { data: claimResult } = await supabase
        .from("profiles")
        .update({ last_trigger_at: nowIso })
        .eq("user_id", profile.user_id)
        .lt("last_trigger_at", new Date(Date.now() - ((profile as any).cooldown_hours ?? 6) * 60 * 60 * 1000).toISOString())
        .select("user_id")
        .single();

      if (!claimResult) {
        const { data: nullClaim } = await supabase
          .from("profiles")
          .update({ last_trigger_at: nowIso })
          .eq("user_id", profile.user_id)
          .is("last_trigger_at", null)
          .select("user_id")
          .single();
        if (!nullClaim) {
          console.log(`[CHECK-VOLATILITY] Skipping ${profile.user_id} — cooldown claimed by another trigger`);
          return false;
        }
      }

      const dir = btc.direction === "down" ? "down" : "up";
      const pct = absChange.toFixed(1);
      let ctx = `BTC is ${dir} ${pct}% in the last 24 hours.`;
      if (absCumChange >= ((profile as any).cumulative_threshold ?? 15)) {
        const cumDir = btc.cumulativeDirection === "down" ? "down" : "up";
        ctx += ` Over 7 days, it's ${cumDir} ${absCumChange.toFixed(1)}%.`;
      }

      const p = profile as Record<string, unknown>;
      const tone = (p.reflection_tone as string) || "stoic";
      const userLang = (p.language as string) || "en";
      const style =
        typeof p.reflection_style === "string" && p.reflection_style.length > 0
          ? p.reflection_style
          : "standard";
      const customPrompt = sanitizePromptInput(p.custom_prompt as string | null | undefined, 500);
      const motivations = sanitizePromptArray(p.motivations as string[] | null | undefined, 10, 100);
      const mantra = sanitizePromptInput(p.mantra as string | null | undefined, 200);
      const groundingActivities = sanitizePromptArray(
        p.grounding_activities as string[] | null | undefined,
        10,
        100,
      );

      let moodHistory: MoodHistoryEntry[] | undefined;
      let recentMessages: string[] | undefined;
      let recentHaikus: string[] | undefined;
      try {
        const { data: recentRows } = await supabase
          .from("reflections")
          .select("mood, outcome, created_at, message, haiku")
          .eq("user_id", profile.user_id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (recentRows?.length) {
          const rows = recentRows as Array<{
            mood?: string | null;
            outcome?: string | null;
            created_at?: string;
            message?: string | null;
            haiku?: string | null;
          }>;
          const withMood = rows.filter((r) => r.mood);
          if (withMood.length > 0) {
            moodHistory = withMood.map((r) => ({
              mood: r.mood as string,
              outcome: r.outcome ?? null,
              created_at: r.created_at,
            }));
          }
          const msgs = rows.filter((r) => r.message).map((r) => r.message as string);
          if (msgs.length > 0) recentMessages = msgs.slice(0, 5);
          const haikus = rows.filter((r) => r.haiku).map((r) => r.haiku as string);
          if (haikus.length > 0) recentHaikus = haikus.slice(0, 5);
        }
      } catch { /* non-fatal */ }

      const { result } = await generateUnifiedReflection({
        context: ctx,
        apiKey: LOVABLE_API_KEY,
        includeLearning: false,
        tone,
        style,
        language: userLang,
        severity: absChange,
        moodHistory,
        recentHaikus,
        recentMessages,
        customPrompt: customPrompt || undefined,
        motivations: motivations.length > 0 ? motivations : undefined,
        mantra: mantra || undefined,
        groundingActivities: groundingActivities.length > 0 ? groundingActivities : undefined,
      });
      if (!result) {
        console.log(`[CHECK-VOLATILITY] Failed to generate reflection for ${profile.user_id}`);
        return false;
      }

      const haiku = (profile as any).companion_haiku ? result.haiku : null;
      // learning_* on the row are filled by companion-orchestrate (Grounding, etc.), not reflection AI

      const { data: insertedReflection } = await supabase
        .from("reflections")
        .insert({
          user_id: profile.user_id,
          message: result.message,
          context: ctx,
          haiku,
          learning_title: null,
          learning_body: null,
          learning_citation: null,
          learning_url: null,
        })
        .select("id")
        .single();

      // Profile update and orchestrator dispatch can run in parallel
      const profileUpdate = supabase
        .from("profiles")
        .update({ last_message: result.message, last_context: ctx })
        .eq("user_id", profile.user_id);

      if (insertedReflection?.id) {
        const reflectionId = insertedReflection.id;
        const enableSignal = (p.companion_signal as boolean | undefined) ?? true;
        const enableGrounding = (p.companion_grounding as boolean | undefined) ?? true;
        const enableHistory = (p.companion_history as boolean | undefined) ?? true;
        const enableZoomOut = (p.companion_zoom_out as boolean | undefined) ?? true;
        const lastReportedMood = moodHistory?.[0]?.mood;

        // Fire-and-forget orchestrator (respects profile companion toggles; mood from latest past session)
        fetch(`${supabaseUrl}/functions/v1/companion-orchestrate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${svcKey}`,
            "apikey": anonKey,
          },
          body: JSON.stringify({
            userId: profile.user_id,
            reflectionId,
            context: ctx,
            language: userLang,
            reflectionMessage: result.message,
            severity: absChange,
            mood: lastReportedMood ?? null,
            moodHistory: moodHistory ?? [],
            enableSignal,
            enableGrounding,
            enableHistory,
            enableZoomOut,
          }),
        }).then((res) => {
          if (!res.ok) res.text().then((t) => console.error(`[CHECK-VOLATILITY] Orchestrator failed (${res.status}): ${t}`));
          else console.log(`[CHECK-VOLATILITY] Orchestrator dispatched for reflection ${reflectionId}`);
        }).catch((e) => console.error(`[CHECK-VOLATILITY] Orchestrator dispatch error:`, e));
      }

      await profileUpdate;

      // Email + push + in-app bell notification in parallel
      await Promise.all([
        // Email
        (async () => {
          if (!profile.email_notifications) return;
          const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
          const email = userData?.user?.email;
          if (email) await sendNotificationEmail(email, result.message, ctx);
        })(),
        // Push
        (async () => {
          if (!vapidReady) return;
          const { data: pushSubs } = await supabase
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", profile.user_id);
          if (!pushSubs || pushSubs.length === 0) return;

          const payload = JSON.stringify({
            title: "Holzen",
            body: result.message.slice(0, 120),
            reflectionId: insertedReflection?.id ?? null,
            action: "pause_ready",
          });
          await Promise.all(pushSubs.map(async (sub) => {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
              );
            } catch (pushErr: any) {
              console.error(`[PUSH] Failed for ${sub.endpoint}:`, pushErr.message, "statusCode:", pushErr.statusCode);
              if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
              }
            }
          }));
        })(),
        // In-app bell record
        supabase.from("pause_notifications").insert({
          user_id: profile.user_id,
          reflection_id: insertedReflection?.id ?? null,
          message: result.message,
          context: ctx,
          severity: absChange >= 10 ? "high" : absChange >= 5 ? "moderate" : "mild",
        }),
      ]);

      return true;
    }));

    const triggered = results.filter(Boolean).length;
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