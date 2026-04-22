import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import webpush from "https://esm.sh/web-push@3.6.7";
import {
  generateUnifiedReflection,
  REFLECTION_PROMPT_VERSION,
  type MoodHistoryEntry,
} from "../_shared/reflection-generate.ts";
import {
  enrichAutomaticPauseContext,
  fetchFearGreedSnapshot,
  fetchOnChainSnapshot,
  fetchGroundingSourcesForOrchestrate,
  fetchSignalSourcesForOrchestrate,
  recencyHintsFromReflectionRows,
} from "../_shared/pause-cron-parity.ts";
import { sanitizePromptInput, sanitizePromptArray } from "../_shared/sanitize.ts";
import { isCumulativeMoveTriggered } from "../_shared/volatility-thresholds.ts";
import {
  holzenEdgeError,
  holzenEdgeLog,
  holzenEdgeRun,
  holzenEdgeWarn,
} from "../_shared/holzen-edge-log.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import { coingeckoHeaders } from "../_shared/coingecko.ts";
import { holzenResendLogger, sendResendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours fallback

async function fetchWithRetry(url: string, retries = 3, delayMs = 2000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: coingeckoHeaders() });
    if (res.ok) return res;
    holzenEdgeWarn("volatility", "CoinGecko HTTP retry", {
      attempt: i + 1,
      status: res.status,
      willRetry: i < retries - 1,
    });
    await res.text(); // consume body
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
  }
  throw new Error("Failed to fetch BTC data after retries");
}

/** CoinGecko quote currency — matches `use-holzen` / `fetchBtcData(currency)` (`profiles.hold_goal_currency`). */
function normalizeHoldGoalCurrency(raw: unknown): string {
  if (typeof raw === "string" && raw.trim().length >= 3) return raw.trim().toLowerCase();
  return "usd";
}

type BtcVolatilityMetrics = {
  changePercent: number;
  direction: string;
  cumulativeChangePercent: number;
  cumulativeDirection: string;
};

async function fetchBtcVolatilityForCurrency(vsCurrency: string): Promise<BtcVolatilityMetrics> {
  const cur = vsCurrency.toLowerCase();
  const [res1d, res7d] = await Promise.all([
    fetchWithRetry(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${cur}&days=1`),
    fetchWithRetry(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${cur}&days=7`),
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
  context: string,
  reflectionId: string | null,
): Promise<boolean> {
  if (!Deno.env.get("RESEND_API_KEY")) {
    holzenEdgeError("volatility-email", "RESEND_API_KEY not configured");
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

  // Each reflection has a unique UUID — perfect idempotency key. A retry of
  // the same volatility cron (or a double-fire from pg_cron) never produces
  // a duplicate email within Resend's 24h dedupe window.
  const result = await sendResendEmail(
    {
      from: "Holzen <notify@holzen.app>",
      to: [email],
      subject: "Holzen — A moment to pause",
      html,
    },
    {
      source: "volatility-email",
      idempotencyKey: reflectionId ? `volatility:${reflectionId}` : undefined,
      logger: holzenResendLogger(
        (m, d) => holzenEdgeLog("volatility-email", m, d),
        (m, err) => holzenEdgeError("volatility-email", m, err),
      ),
    },
  );

  if (result.ok) {
    holzenEdgeLog("volatility-email", "sent", {
      toDomain: email.includes("@") ? email.split("@")[1] : "?",
      attempts: result.attempts,
    });
    return true;
  }
  return false;
}

serve(
  withRequestLogging("check-volatility", async ({ req }) => {
  holzenEdgeRun("volatility", "request", { method: req.method });

  // Auth: require service role key or cron secret
  const { verifyServiceAuth } = await import("../_shared/auth.ts");
  if (!verifyServiceAuth(req)) {
    holzenEdgeRun("volatility", "auth rejected — use Bearer service_role or CRON_SECRET");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  holzenEdgeRun("volatility", "auth ok");

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(
        "user_id, threshold, threshold_down, cumulative_threshold, hold_goal_currency, email_notifications, last_trigger_at, cooldown_hours, reflection_tone, companion_haiku, companion_grounding, companion_signal, companion_zoom_out, companion_history, quiet_hours_start, quiet_hours_end, timezone, language, snoozed_until, custom_prompt, reflection_style, motivations, mantra, grounding_activities",
      );

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      holzenEdgeLog("volatility", "no profiles");
      return new Response(JSON.stringify({ triggered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currencyCodes = new Set<string>();
    for (const p of profiles) {
      currencyCodes.add(normalizeHoldGoalCurrency((p as { hold_goal_currency?: string }).hold_goal_currency));
    }
    if (!currencyCodes.has("usd")) currencyCodes.add("usd");

    const [btcEntries, fearGreedSnapshot, onChainSnapshot] = await Promise.all([
      Promise.all(
        [...currencyCodes].map(async (c) => {
          try {
            const m = await fetchBtcVolatilityForCurrency(c);
            return [c, m] as const;
          } catch (e) {
            holzenEdgeError("volatility", `CoinGecko failed vs_currency=${c}`, e);
            return [c, null] as const;
          }
        }),
      ),
      fetchFearGreedSnapshot(),
      fetchOnChainSnapshot(),
    ]);

    const btcByCur = new Map<string, BtcVolatilityMetrics>();
    for (const [c, m] of btcEntries) {
      if (m) btcByCur.set(c, m);
    }
    if (!btcByCur.has("usd")) {
      holzenEdgeError("volatility", "could not load USD BTC metrics");
      return new Response(JSON.stringify({ error: "btc_fetch_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    function metricsForProfile(p: { hold_goal_currency?: string | null }): BtcVolatilityMetrics {
      const c = normalizeHoldGoalCurrency(p.hold_goal_currency);
      return btcByCur.get(c) ?? btcByCur.get("usd")!;
    }

    const usdPeek = btcByCur.get("usd")!;
    holzenEdgeLog("volatility", "BTC sample + market context loaded", {
      change24hPct: Number(usdPeek.changePercent.toFixed(2)),
      change7dPct: Number(usdPeek.cumulativeChangePercent.toFixed(2)),
      quoteCurrencies: btcByCur.size,
    });

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
      const b = metricsForProfile(p as { hold_goal_currency?: string | null });
      const absChange = Math.abs(b.changePercent);
      const effectiveThreshold = b.direction === "down"
        ? ((p as any).threshold_down ?? p.threshold ?? 5)
        : (p.threshold ?? 5);
      const dailyTriggered = absChange >= effectiveThreshold;
      const cumulativeTriggered = isCumulativeMoveTriggered(
        b.cumulativeChangePercent,
        (p as any).cumulative_threshold,
      );
      if (!dailyTriggered && !cumulativeTriggered) return false;
      if (isInQuietHours(p)) return false;
      if (isSnoozed(p)) return false;
      if (!p.last_trigger_at) return true;
      const cooldownMs = ((p as any).cooldown_hours ?? 6) * 60 * 60 * 1000;
      return new Date(p.last_trigger_at).getTime() < Date.now() - cooldownMs;
    });

    holzenEdgeLog("volatility", "eligible users", {
      eligible: eligible.length,
      totalProfiles: profiles.length,
    });

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
              holzenEdgeError("volatility-push", "VAPID PKCS8 decode failed", decodeErr);
            }
          }
        }
        webpush.setVapidDetails("mailto:noreply@holzen.app", vapidPublicKey, privateKey);
        vapidReady = true;
      } catch (vapidErr) {
        holzenEdgeError("volatility-push", "VAPID setup error", vapidErr);
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
          holzenEdgeLog("volatility", "skip — cooldown slot claimed elsewhere", {
            userIdPrefix: String(profile.user_id).slice(0, 8),
          });
          return false;
        }
      }

      const userBtc = metricsForProfile(profile as { hold_goal_currency?: string | null });
      const absChange = Math.abs(userBtc.changePercent);
      const dir = userBtc.direction === "down" ? "down" : "up";
      const pct = absChange.toFixed(1);
      let ctx = `BTC is ${dir} ${pct}% in the last 24 hours.`;
      if (isCumulativeMoveTriggered(userBtc.cumulativeChangePercent, (profile as any).cumulative_threshold)) {
        const cumDir = userBtc.cumulativeDirection === "down" ? "down" : "up";
        const absCum = Math.abs(userBtc.cumulativeChangePercent);
        ctx += ` Over 7 days, it's ${cumDir} ${absCum.toFixed(1)}%.`;
      }
      ctx = enrichAutomaticPauseContext(ctx, fearGreedSnapshot, onChainSnapshot);

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
      let rowsForRecency: Parameters<typeof recencyHintsFromReflectionRows>[0] = [];
      try {
        const { data: recentRows } = await supabase
          .from("v_reflection_with_companions")
          .select(
            "mood, outcome, created_at, message, haiku, signal_title, signal_source, grounding_title, companion_grounding_url, zoom_out_data, history_insight_data",
          )
          .eq("user_id", profile.user_id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (recentRows?.length) {
          rowsForRecency = recentRows as Parameters<typeof recencyHintsFromReflectionRows>[0];
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

      const recency = recencyHintsFromReflectionRows(rowsForRecency);
      const lastReportedMood = moodHistory?.[0]?.mood;

      // Parity with holzen-reflect: same allowlisted event before reflection AI so per-user
      // throttle (companion-orchestrate checkRateLimit) sees a consistent signal for manual vs cron.
      try {
        await supabase.from("analytics_events").insert({
          user_id: profile.user_id,
          event: "pause_ai_call",
        });
      } catch {
        /* tracking failure is non-fatal */
      }

      const { result } = await generateUnifiedReflection({
        context: ctx,
        apiKey: LOVABLE_API_KEY,
        tone,
        style,
        language: userLang,
        currency: typeof p.hold_goal_currency === "string" && p.hold_goal_currency.trim()
          ? p.hold_goal_currency.trim().toUpperCase()
          : "USD",
        severity: absChange,
        moodHistory,
        recentHaikus,
        recentMessages,
        customPrompt: customPrompt || undefined,
        motivations: motivations.length > 0 ? motivations : undefined,
        mantra: mantra || undefined,
        groundingActivities: groundingActivities.length > 0 ? groundingActivities : undefined,
      });
      if (!result?.message) {
        holzenEdgeLog("volatility", "reflection generation returned empty", {
          userIdPrefix: String(profile.user_id).slice(0, 8),
        });
        return false;
      }

      supabase.from("analytics_events").insert({
        user_id: profile.user_id,
        event: "reflection_generated",
        metadata: {
          tone,
          style,
          message_length: result.message.length,
          has_haiku: !!result.haiku,
          prompt_version: REFLECTION_PROMPT_VERSION,
          source: "check-volatility",
        },
      }).then(() => {});

      const haiku = (profile as any).companion_haiku ? result.haiku : null;

      const { data: insertedReflection } = await supabase
        .from("reflections")
        .insert({
          user_id: profile.user_id,
          message: result.message,
          context: ctx,
          haiku,
          // Tag provenance so admin analytics can distinguish cron-generated
          // rows and the purge job can safely sweep ignored-notification
          // orphans (see 20260420220000 migration + docs/ops/cron-setup.md).
          source: "cron_volatility",
          ...(lastReportedMood ? { mood: lastReportedMood } : {}),
        })
        .select("id")
        .single();

      // Keep Library parity with manual pauses: every generated reflection
      // gets a `source_type='reflection'` bookmark row.
      const libraryUpsert = insertedReflection?.id
        ? supabase.from("library_items").upsert(
            {
              user_id: profile.user_id,
              type: "bookmark",
              title: "Reflection",
              body: result.message,
              source_type: "reflection",
              reflection_id: insertedReflection.id,
              tags: ["reflection"],
            },
            { onConflict: "user_id,reflection_id,source_type", ignoreDuplicates: true },
          )
        : Promise.resolve({ error: null });

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

        const signalSources = enableSignal
          ? await fetchSignalSourcesForOrchestrate(supabase, profile.user_id)
          : undefined;
        const groundingSources = enableGrounding
          ? await fetchGroundingSourcesForOrchestrate(supabase, profile.user_id)
          : undefined;

        // Fire-and-forget orchestrator — same payload shape as manual pause (use-companion-data + holzen-reflect parity).
        fetch(`${supabaseUrl}/functions/v1/companion-orchestrate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${svcKey}`,
            "apikey": anonKey,
          },
          body: JSON.stringify({
            holzenInvokeSource: "cron_check_volatility",
            userId: profile.user_id,
            reflectionId,
            context: ctx,
            language: userLang,
            reflectionMessage: result.message,
            severity: absChange,
            mood: lastReportedMood ?? null,
            moodHistory: moodHistory ?? [],
            signalSources,
            groundingSources,
            recentSignalSources: recency.recentSignalSources,
            recentSignalTitles: recency.recentSignalTitles,
            recentNudgeTopics: recency.recentNudgeTopics,
            recentGroundingSources: recency.recentGroundingSources,
            recentHistoryTitles: recency.recentHistoryTitles,
            recentZoomOutTitles: recency.recentZoomOutTitles,
            enableSignal,
            enableGrounding,
            enableHistory,
            enableZoomOut,
            useIntervention: true,
          }),
        }).then((res) => {
          if (!res.ok) {
            res.text().then((t) =>
              holzenEdgeError("volatility", `orchestrator HTTP ${res.status}`, t.slice(0, 300))
            );
          } else {
            holzenEdgeLog("volatility", "orchestrator dispatched", { reflectionIdPrefix: reflectionId.slice(0, 8) });
          }
        }).catch((e) => holzenEdgeError("volatility", "orchestrator fetch error", e));
      }

      const [{ error: profileUpdateErr }, { error: libraryUpsertErr }] = await Promise.all([
        profileUpdate,
        libraryUpsert,
      ]);
      if (profileUpdateErr) {
        holzenEdgeError("volatility", "profile update failed", profileUpdateErr.message);
        return false;
      }
      if (libraryUpsertErr) {
        holzenEdgeError("volatility", "library reflection upsert failed", libraryUpsertErr.message);
      }

      // Email + push + in-app bell notification in parallel
      await Promise.all([
        // Email
        (async () => {
          if (!profile.email_notifications) return;
          const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
          const email = userData?.user?.email;
          if (email) {
            await sendNotificationEmail(
              email,
              result.message,
              ctx,
              insertedReflection?.id ?? null,
            );
          }
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
              holzenEdgeError("volatility-push", "send failed", {
                message: pushErr?.message,
                statusCode: pushErr?.statusCode,
              });
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
    holzenEdgeLog("volatility", "run complete", { triggered });

    return new Response(
      JSON.stringify({ triggered, btcChangeUsd: usdPeek.changePercent, quoteCurrenciesLoaded: btcByCur.size }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    holzenEdgeError("volatility", "uncaught error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);