import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import webpush from "https://esm.sh/web-push@3.6.7";
import { createCidSupabaseClient, sendWebPushWithCid } from "../_shared/cid-clients.ts";
import {
  generateUnifiedReflection,
  REFLECTION_PROMPT_VERSION,
  type MoodHistoryEntry,
} from "../_shared/reflection-generate.ts";
import {
  enrichAutomaticPauseContext,
  fetchFearGreedSnapshot,
  fetchOnChainSnapshot,
  pauseRecencyInputs,
} from "../_shared/pause-cron-parity.ts";
import { sanitizePromptInput, sanitizePromptArray } from "../_shared/sanitize.ts";
import { isCumulativeMoveTriggered } from "../_shared/volatility-thresholds.ts";
import { unknownErrorForLog, webPushStatusCode } from "../_shared/log-unknown-error.ts";
import {
  withRequestLogging,
  type RequestLoggingContext,
} from "../_shared/with-request-logging.ts";

type VolatilityFnLog = RequestLoggingContext["log"];
import { coingeckoHeaders } from "../_shared/coingecko.ts";
import {
  holzenLovableEmailLogger,
  sendLovableEmailMessage,
} from "../_shared/lovable-email.ts";
import {
  bucketChangePercent,
  computeContextFingerprint,
  upsertPauseAiArtifact,
} from "../_shared/pause.ts";
import { normalizeTrackedAssetId, trackedAssetSymbol } from "../_shared/tracked-assets.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours fallback

async function fetchWithRetry(
  url: string,
  log: VolatilityFnLog,
  retries = 3,
  delayMs = 2000,
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: coingeckoHeaders() });
    if (res.ok) return res;
    log.warn("check_volatility_coingecko", {
      holzen_event: "check_volatility_cron",
      phase: "coingecko_http_retry",
      attempt: i + 1,
      status: res.status,
      will_retry: i < retries - 1,
    });
    await res.text(); // consume body
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
  }
  throw new Error("Failed to fetch market data after retries");
}

/** CoinGecko quote currency — matches `use-holzen` / `fetchBtcData(currency)` (`profiles.hold_goal_currency`). */
function normalizeHoldGoalCurrency(raw: unknown): string {
  if (typeof raw === "string" && raw.trim().length >= 3) return raw.trim().toLowerCase();
  return "usd";
}

type AssetVolatilityMetrics = {
  changePercent: number;
  direction: string;
  cumulativeChangePercent: number;
  cumulativeDirection: string;
};

/** Row shape from the `profiles` select in this handler. */
interface VolatilityProfile {
  user_id: string;
  threshold?: number | null;
  threshold_down?: number | null;
  cumulative_threshold?: number | null;
  hold_goal_currency?: string | null;
  email_notifications?: boolean | null;
  last_trigger_at?: string | null;
  cooldown_hours?: number | null;
  reflection_tone?: string | null;
  companion_haiku?: boolean | null;
  companion_grounding?: boolean | null;
  companion_signal?: boolean | null;
  companion_zoom_out?: boolean | null;
  companion_history?: boolean | null;
  quiet_hours_start?: number | null;
  quiet_hours_end?: number | null;
  timezone?: string | null;
  language?: string | null;
  snoozed_until?: string | null;
  custom_prompt?: string | null;
  reflection_style?: string | null;
  motivations?: unknown;
  mantra?: string | null;
  grounding_activities?: unknown;
  tracked_asset_id?: string | null;
}

async function fetchAssetVolatilityForCurrency(
  coinId: string,
  vsCurrency: string,
  log: VolatilityFnLog,
): Promise<AssetVolatilityMetrics> {
  const cur = vsCurrency.toLowerCase();
  const id = encodeURIComponent(coinId);
  const [res1d, res7d] = await Promise.all([
    fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${cur}&days=1`,
      log,
    ),
    fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${cur}&days=7`,
      log,
    ),
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
  pauseInstanceId: string | null,
  log: VolatilityFnLog,
): Promise<boolean> {
  if (!Deno.env.get("LOVABLE_API_KEY")) {
    log.error("check_volatility_email", {
      holzen_event: "check_volatility_cron",
      phase: "lovable_api_key_not_configured",
    });
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

  // Each pause instance has a unique UUID — perfect idempotency key. A retry of
  // the same volatility cron (or a double-fire from pg_cron) never produces
  // a duplicate email within Lovable Email's idempotency window.
  const result = await sendLovableEmailMessage(
    {
      from: "Holzen <notify@holzen.app>",
      to: [email],
      subject: "Holzen — A moment to pause",
      html,
    },
    {
      source: "volatility-email",
      idempotencyKey: pauseInstanceId ? `volatility:${pauseInstanceId}` : undefined,
      logger: holzenLovableEmailLogger(
        (m, d) =>
          log("check_volatility_email_dep", {
            holzen_event: "check_volatility_cron",
            phase: "volatility_email_dep",
            message: m,
            ...(d ?? {}),
          }),
        (m, data) =>
          log.error("check_volatility_email_dep", {
            holzen_event: "check_volatility_cron",
            phase: "volatility_email_dep_error",
            message: m,
            ...(data ?? {}),
          }),
      ),
    },
  );

  if (result.ok) {
    log("check_volatility_email_sent", {
      holzen_event: "check_volatility_cron",
      phase: "volatility_email_sent",
      recipient_host: email.includes("@") ? email.split("@")[1]!.toLowerCase() : "?",
      attempts: result.attempts,
    });
    return true;
  }
  return false;
}

serve(
  withRequestLogging("check-volatility", async ({ req, log, cid }) => {
  log("check_volatility_phase", {
    holzen_event: "check_volatility_cron",
    phase: "handler_enter",
    method: req.method,
  });

  // Auth: require service role key or cron secret
  const { verifyServiceAuth } = await import("../_shared/auth.ts");
  if (!verifyServiceAuth(req)) {
    log.warn("check_volatility_phase", {
      holzen_event: "check_volatility_cron",
      phase: "service_auth_rejected",
    });
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  log("check_volatility_phase", {
    holzen_event: "check_volatility_cron",
    phase: "service_auth_ok",
  });

  try {
    const supabase = createCidSupabaseClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      cid,
      { auth: { persistSession: false } }
    );

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(
        "user_id, threshold, threshold_down, cumulative_threshold, hold_goal_currency, tracked_asset_id, email_notifications, last_trigger_at, cooldown_hours, reflection_tone, companion_haiku, companion_grounding, companion_signal, companion_zoom_out, companion_history, quiet_hours_start, quiet_hours_end, timezone, language, snoozed_until, custom_prompt, reflection_style, motivations, mantra, grounding_activities",
      );

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      log("check_volatility_phase", {
        holzen_event: "check_volatility_cron",
        phase: "no_profiles",
      });
      return new Response(JSON.stringify({ triggered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileRows = profiles as VolatilityProfile[];

    const assetToCurrencies = new Map<string, Set<string>>();
    for (const p of profileRows) {
      const aid = normalizeTrackedAssetId(p.tracked_asset_id);
      const c = normalizeHoldGoalCurrency(p.hold_goal_currency);
      if (!assetToCurrencies.has(aid)) assetToCurrencies.set(aid, new Set());
      assetToCurrencies.get(aid)!.add(c);
    }
    for (const [, curs] of assetToCurrencies) {
      if (!curs.has("usd")) curs.add("usd");
    }

    const [pairRows, fearGreedSnapshot, onChainSnapshot] = await Promise.all([
      Promise.all(
        [...assetToCurrencies.entries()].flatMap(([asset, curs]) =>
          [...curs].map(async (c) => {
            try {
              const m = await fetchAssetVolatilityForCurrency(asset, c, log);
              return { asset, c, m };
            } catch (e) {
              log.warn("check_volatility_asset_fetch", {
                holzen_event: "check_volatility_cron",
                phase: "coingecko_failed",
                coin_id: asset,
                vs_currency: c,
                ...unknownErrorForLog(e),
              });
              return { asset, c, m: null as AssetVolatilityMetrics | null };
            }
          }),
        ),
      ),
      fetchFearGreedSnapshot(),
      fetchOnChainSnapshot(),
    ]);

    const metricsByAssetCur = new Map<string, Map<string, AssetVolatilityMetrics>>();
    for (const row of pairRows) {
      if (!row.m) continue;
      if (!metricsByAssetCur.has(row.asset)) metricsByAssetCur.set(row.asset, new Map());
      metricsByAssetCur.get(row.asset)!.set(row.c, row.m);
    }

    const usdPeek =
      metricsByAssetCur.get("bitcoin")?.get("usd") ??
      [...metricsByAssetCur.values()].find((m) => m.has("usd"))?.get("usd");
    if (!usdPeek) {
      log.warn("check_volatility_asset_fetch", {
        holzen_event: "check_volatility_cron",
        phase: "usd_metrics_missing",
      });
      return new Response(JSON.stringify({ triggered: 0, skipped: "market_fetch_failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    function metricsForProfile(p: VolatilityProfile): AssetVolatilityMetrics {
      const aid = normalizeTrackedAssetId(p.tracked_asset_id);
      const c = normalizeHoldGoalCurrency(p.hold_goal_currency);
      return metricsByAssetCur.get(aid)?.get(c) ??
        metricsByAssetCur.get(aid)?.get("usd") ??
        metricsByAssetCur.get("bitcoin")?.get(c) ??
        usdPeek;
    }

    log("check_volatility_phase", {
      holzen_event: "check_volatility_cron",
      phase: "market_sample_loaded",
      change24h_pct: Number(usdPeek.changePercent.toFixed(2)),
      change7d_pct: Number(usdPeek.cumulativeChangePercent.toFixed(2)),
      asset_currency_pairs: pairRows.filter((r) => r.m).length,
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

    function isInQuietHours(p: VolatilityProfile): boolean {
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
    function isSnoozed(p: VolatilityProfile): boolean {
      const snoozedUntil = p.snoozed_until;
      if (!snoozedUntil) return false;
      return new Date(snoozedUntil).getTime() > Date.now();
    }

    const eligible = profileRows.filter((p) => {
      const b = metricsForProfile(p);
      const absChange = Math.abs(b.changePercent);
      const effectiveThreshold = b.direction === "down"
        ? (p.threshold_down ?? p.threshold ?? 5)
        : (p.threshold ?? 5);
      const dailyTriggered = absChange >= effectiveThreshold;
      const cumulativeTriggered = isCumulativeMoveTriggered(
        b.cumulativeChangePercent,
        p.cumulative_threshold,
      );
      if (!dailyTriggered && !cumulativeTriggered) return false;
      if (isInQuietHours(p)) return false;
      if (isSnoozed(p)) return false;
      if (!p.last_trigger_at) return true;
      const cooldownMs = (p.cooldown_hours ?? 6) * 60 * 60 * 1000;
      return new Date(p.last_trigger_at).getTime() < Date.now() - cooldownMs;
    });

    log("check_volatility_phase", {
      holzen_event: "check_volatility_cron",
      phase: "eligible_users",
      eligible: eligible.length,
      total_profiles: profileRows.length,
    });

    if (eligible.length === 0) {
      return new Response(JSON.stringify({ triggered: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
              log.error("check_volatility_push", {
                holzen_event: "check_volatility_cron",
                phase: "vapid_pkcs8_decode_failed",
                ...unknownErrorForLog(decodeErr),
              });
            }
          }
        }
        webpush.setVapidDetails("mailto:noreply@holzen.app", vapidPublicKey, privateKey);
        vapidReady = true;
      } catch (vapidErr) {
        log.error("check_volatility_push", {
          holzen_event: "check_volatility_cron",
          phase: "vapid_setup_error",
          ...unknownErrorForLog(vapidErr),
        });
      }
    }

    // Process all eligible users in parallel
    const results = await Promise.all(eligible.map(async (profile) => {
      // Server-side idempotency: a single atomic UPDATE acts as the per-user
      // cooldown lock. `claim_trigger_slot` returns true only for the first
      // cron tick whose write actually flips `last_trigger_at` for this user
      // within the cooldown window — every concurrent or duplicated tick
      // (pg_cron retry, manual invoke, overlapping schedule) is rejected
      // before any LLM call is made.
      const cooldownHours = profile.cooldown_hours ?? 6;
      const { data: claimed, error: claimError } = await supabase.rpc(
        "claim_trigger_slot",
        { _user_id: profile.user_id, _cooldown_hours: cooldownHours },
      );
      if (claimError) {
        log.error("check_volatility_claim", {
          holzen_event: "check_volatility_cron",
          phase: "claim_trigger_slot_failed",
          ...unknownErrorForLog(claimError),
        });
        return false;
      }
      if (claimed !== true) {
        log("check_volatility_skip", {
          holzen_event: "check_volatility_cron",
          phase: "cooldown_slot_already_claimed",
          user_id_prefix: String(profile.user_id).slice(0, 8),
          cooldown_hours: cooldownHours,
        });
        return false;
      }

      const userM = metricsForProfile(profile);
      const absChange = Math.abs(userM.changePercent);
      const dir = userM.direction === "down" ? "down" : "up";
      const pct = absChange.toFixed(1);
      const assetId = normalizeTrackedAssetId(profile.tracked_asset_id);
      const sym = trackedAssetSymbol(assetId);
      let ctx = `${sym} is ${dir} ${pct}% in the last 24 hours.`;
      if (isCumulativeMoveTriggered(userM.cumulativeChangePercent, profile.cumulative_threshold)) {
        const cumDir = userM.cumulativeDirection === "down" ? "down" : "up";
        const absCum = Math.abs(userM.cumulativeChangePercent);
        ctx += ` Over 7 days, it's ${cumDir} ${absCum.toFixed(1)}%.`;
      }
      const onChainForUser = assetId === "bitcoin" ? onChainSnapshot : null;
      ctx = enrichAutomaticPauseContext(ctx, fearGreedSnapshot, onChainForUser);

      const tone = profile.reflection_tone || "stoic";
      const userLang = profile.language || "en";
      const style =
        typeof profile.reflection_style === "string" && profile.reflection_style.length > 0
          ? profile.reflection_style
          : "standard";
      const customPrompt = sanitizePromptInput(profile.custom_prompt ?? undefined, 500);
      const motivations = sanitizePromptArray(
        Array.isArray(profile.motivations) ? (profile.motivations as string[]) : undefined,
        10,
        100,
      );
      const mantra = sanitizePromptInput(profile.mantra ?? undefined, 200);
      const groundingActivities = sanitizePromptArray(
        Array.isArray(profile.grounding_activities) ? (profile.grounding_activities as string[]) : undefined,
        10,
        100,
      );

      // Pause V2: pull mood history + reflection/haiku pools from the new tables.
      const { moodHistory, recentMessages, recentHaikus } = await pauseRecencyInputs(
        supabase,
        profile.user_id,
      );
      const lastReportedMood = moodHistory?.[0]?.mood;
      // Keep MoodHistoryEntry shape for the AI call below.
      const moodHistoryForAi: MoodHistoryEntry[] | undefined = moodHistory
        ? moodHistory.map((m) => ({ mood: m.mood, outcome: m.outcome, created_at: m.created_at }))
        : undefined;

      // Parity with holzen-reflect: same allowlisted event before reflection AI so per-user
      // throttles and dashboards see a consistent signal for manual vs cron.
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
        currency: typeof profile.hold_goal_currency === "string" && profile.hold_goal_currency.trim()
          ? profile.hold_goal_currency.trim().toUpperCase()
          : "USD",
        severity: absChange,
        moodHistory: moodHistoryForAi,
        recentHaikus,
        recentMessages,
        customPrompt: customPrompt || undefined,
        motivations: motivations.length > 0 ? motivations : undefined,
        mantra: mantra || undefined,
        groundingActivities: groundingActivities.length > 0 ? groundingActivities : undefined,
      });
      if (!result?.message) {
        log("check_volatility_skip", {
          holzen_event: "check_volatility_cron",
          phase: "reflection_generation_empty",
          user_id_prefix: String(profile.user_id).slice(0, 8),
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


      // Pause V2: create (or reuse) the pause instance via the
      // service-role RPC, which serializes per-user with an advisory
      // lock and implements the fingerprint idempotency rule
      // (matching fingerprint -> reuse; differing fingerprint while open
      // -> `pending` offer; recent-dismissal match -> skip).
      const directionBucket = userM.direction === "down" ? "down" : "up";
      const severityBand = absChange >= 10 ? "high" : absChange >= 5 ? "moderate" : "mild";
      const fingerprint = await computeContextFingerprint({
        templateSlug: "volatility_v1",
        directionBucket,
        severityBand,
        dailyBucketPct: bucketChangePercent(userM.changePercent),
        cumulativeBucketPct: bucketChangePercent(userM.cumulativeChangePercent),
        trackedAssetId: assetId,
        fearGreedBand: fearGreedSnapshot?.label ?? null,
        onChainBand: onChainForUser
          ? ([onChainForUser.mempoolSize, onChainForUser.fastestFee, onChainForUser.medianFee].filter(
              (x) => typeof x === "number" && Number.isFinite(x),
            ) as number[]).join(":") || null
          : null,
      });

      const { data: createRes, error: createErr } = await supabase.rpc(
        "pause_create_or_reuse_as",
        {
          p_user_id: profile.user_id,
          p_template_slug: "volatility_v1",
          p_source: "cron_volatility",
          p_context_snapshot: {
            change_24h_pct: userM.changePercent,
            change_7d_pct: userM.cumulativeChangePercent,
            direction: userM.direction,
            severity: severityBand,
            context_text: ctx,
            fear_greed: fearGreedSnapshot ?? null,
            on_chain: onChainForUser ?? null,
            last_reported_mood: lastReportedMood ?? null,
            tracked_asset_id: assetId,
          },
          p_context_rule_result: {
            triggered: [
              Math.abs(userM.changePercent) >= (profile.threshold ?? 5)
                ? "daily"
                : null,
              isCumulativeMoveTriggered(
                userM.cumulativeChangePercent,
                profile.cumulative_threshold,
              )
                ? "cumulative"
                : null,
            ].filter(Boolean),
          },
          p_context_fingerprint: fingerprint,
        },
      );
      if (createErr) {
        log.error("check_volatility_pause_create", {
          holzen_event: "check_volatility_cron",
          phase: "pause_create_or_reuse_as_failed",
          ...unknownErrorForLog(createErr),
        });
        return false;
      }

      const pauseInstanceId: string | null = createRes?.instance_id ?? null;
      const wasCreated: boolean = createRes?.created === true;
      const reusedReason: string | null = createRes?.reused_reason ?? null;
      const pendingOffer: boolean = createRes?.pending_offer === true;

      if (!pauseInstanceId) {
        // Recent-dismissal match: user already walked away from this
        // context; don't re-push.
        log("check_volatility_skip", {
          holzen_event: "check_volatility_cron",
          phase: "recent_dismissal_same_fingerprint",
          user_id_prefix: String(profile.user_id).slice(0, 8),
          reused_reason: reusedReason,
        });
        return false;
      }

      if (!wasCreated) {
        // Fingerprint match with an already-open pause: reuse, don't
        // re-dispatch a push.
        log("check_volatility_skip", {
          holzen_event: "check_volatility_cron",
          phase: "open_pause_covers_context",
          user_id_prefix: String(profile.user_id).slice(0, 8),
          instance_id_prefix: String(pauseInstanceId).slice(0, 8),
          reused_reason: reusedReason,
        });
        return false;
      }

      // Reflection text only; haiku and other companions are created when
      // the user opens them in the reflect step (same as manual pauses).
      await upsertPauseAiArtifact(supabase, {
        instanceId: pauseInstanceId,
        userId: profile.user_id,
        kind: "reflection_text",
        content: { message: result.message, context: ctx },
        model: "lovable",
        promptVersion: REFLECTION_PROMPT_VERSION,
      }).catch((e) =>
        log.error("check_volatility_artifact", {
          holzen_event: "check_volatility_cron",
          phase: "reflection_text_upsert_failed",
          ...unknownErrorForLog(e),
        })
      );

      // Profile update only — companion-orchestrate runs from the client on
      // first Reflect open (intervention-only) and on card taps (lazy slots),
      // same as manual volatility pauses. Skip while a pending context offer
      // is queued so Home still reflects the current open pause.
      const profileUpdate = pendingOffer
        ? Promise.resolve({ error: null })
        : supabase
          .from("profiles")
          .update({ last_message: result.message, last_context: ctx })
          .eq("user_id", profile.user_id);

      const { error: profileUpdateErr } = await profileUpdate;
      if (profileUpdateErr) {
        log.error("check_volatility_profile", {
          holzen_event: "check_volatility_cron",
          phase: "profile_update_failed",
          ...unknownErrorForLog(profileUpdateErr),
        });
        return false;
      }

      if (pendingOffer) {
        log("check_volatility_pause_pending", {
          holzen_event: "check_volatility_cron",
          phase: "pause_pending_context_offer",
          user_id_prefix: String(profile.user_id).slice(0, 8),
          instance_id_prefix: String(pauseInstanceId).slice(0, 8),
        });
      }

      // Email + push. In-app bell is emitted by the
      // notifications_from_pause_instances trigger when the instance was
      // created above — no explicit insert needed here.
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
              pauseInstanceId,
              log,
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
            pauseInstanceId,
            action: "pause_ready",
          });
          await Promise.all(pushSubs.map(async (sub) => {
            try {
              await sendWebPushWithCid(
                log,
                webpush,
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload,
                { notificationTag: "volatility", expectedStatusCodes: [404, 410] }
              );
            } catch (pushErr: unknown) {
              const sc = webPushStatusCode(pushErr);
              const logPushFailure = sc === 410 || sc === 404 ? log.warn : log.error;
              logPushFailure("check_volatility_push", {
                holzen_event: "check_volatility_cron",
                phase: "push_send_failed",
                status_code: sc,
                cid,
                ...unknownErrorForLog(pushErr),
              });
              if (sc === 410 || sc === 404) {
                await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
              }
            }
          }));
        })(),
      ]);

      return true;
    }));

    const triggered = results.filter(Boolean).length;
    log("check_volatility_complete", {
      holzen_event: "check_volatility_cron",
      phase: "run_complete",
      triggered,
    });

    return new Response(
      JSON.stringify({
        triggered,
        btcChangeUsd: usdPeek.changePercent,
        marketPairsLoaded: pairRows.filter((r) => r.m).length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error("check_volatility_uncaught", {
      holzen_event: "check_volatility_cron",
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