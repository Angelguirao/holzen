/**
 * Targeted single-companion regeneration for companion-orchestrate.
 */

import { checkCostCeilings, checkCompanionRegenerateLimit } from "./ratelimit.ts";
import { loadAppConfig, PANIC_MODE_FEATURES } from "./app-config.ts";
import { getProviderHealth } from "./circuit-breaker.ts";
import { writeCompanionData } from "./companion-data.ts";
import { generateSignal } from "./generators/signal.ts";
import { generateGrounding } from "./generators/grounding.ts";
import { generateHistory } from "./generators/history.ts";
import { generateZoomOut } from "./generators/zoom-out.ts";
import { determineSessionIntent } from "./session-intent.ts";
import { bucketSeverity } from "./intervention-selector.ts";
import { fetchGroundingSourcesForOrchestrate, fetchSignalSourcesForOrchestrate } from "./pause-cron-parity.ts";
import { fetchRecentSignalCitationUrls, mergeRecentSignalUrls } from "./recent-signal-urls.ts";
import { ORCHESTRATOR_KEY_MAP } from "./companion-types.ts";
import { logCompanionSlotResolved } from "./companion-orchestrate-slot-telemetry.ts";
import type { createLogger } from "./observe.ts";
import {
  consumeAllowanceOrCredits,
  resolveTierFromProfile,
  tierLimits,
} from "./subscription-entitlements.ts";
import { PROMPT_VERSION as SIGNAL_VERSION } from "./generators/signal.ts";
import { PROMPT_VERSION as GROUNDING_VERSION } from "./generators/grounding.ts";
import { PROMPT_VERSION as HISTORY_VERSION } from "./generators/history.ts";
import { PROMPT_VERSION as ZOOM_OUT_VERSION } from "./generators/zoom-out.ts";
import { AI_TEMPORARILY_UNAVAILABLE_MESSAGE } from "./ai-user-messages.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export type RegenerateSlot = "signal" | "grounding" | "history" | "zoomOut";

export async function handleRegenerateOnly(params: {
  slot: RegenerateSlot;
  userId: string;
  svcClient: SupabaseClient;
  body: Record<string, unknown>;
  log: ReturnType<typeof createLogger>;
}): Promise<Response> {
  const { slot, userId, svcClient, body, log } = params;

  const pauseInstanceId = body.pauseInstanceId as string | undefined;
  if (!pauseInstanceId) {
    return new Response(JSON.stringify({ error: "pauseInstanceId required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const appConfig = await loadAppConfig(svcClient);
  const { data: profile } = await svcClient
    .from("profiles")
    .select("lifetime_access, subscription_status, subscription_tier, tracked_asset_id")
    .eq("user_id", userId)
    .maybeSingle();
  const tier = resolveTierFromProfile(profile);
  const trackedAssetId =
    typeof profile?.tracked_asset_id === "string" && profile.tracked_asset_id.trim().length > 0
      ? profile.tracked_asset_id
      : "bitcoin";
  const limits = tierLimits(tier);

  if (appConfig.panic_mode && PANIC_MODE_FEATURES.has("companion_signal")) {
    log("regenerate blocked by panic mode");
    return new Response(
      JSON.stringify({ error: AI_TEMPORARILY_UNAVAILABLE_MESSAGE, panic_mode: true }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Premium companion slots are metered by package allowance.
  // ZoomOut remains outside the premium companion meter.
  const consumesPremiumCompanion = slot === "signal" || slot === "grounding" || slot === "history";
  if (consumesPremiumCompanion) {
    if (tier === "free") {
      return new Response(
        JSON.stringify({
          error: "Premium companions require an active plan.",
          code: "companions_upgrade_required",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const quota = await consumeAllowanceOrCredits(svcClient, {
      userId,
      feature: "premium_companion",
      limit: limits.premium_companion,
      amount: 1,
      reason: "companions_overage",
      source: "companion-regenerate",
      sourceRef: pauseInstanceId,
      metadata: { slot },
    });
    if (!quota.allowed) {
      return new Response(
        JSON.stringify({
          error: "You've used this month's premium companion allowance.",
          code: "companions_quota_exceeded",
          tier,
          companion_limit: quota.limit,
          companion_used: quota.used,
          companion_remaining: quota.remainingAllowance,
          credits_balance: quota.creditsBalance,
          credits_needed: Math.max(0, quota.creditCost - quota.creditsBalance),
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  const budget = await checkCostCeilings(svcClient, {
    dailyGlobalUsd: appConfig.budget_daily_usd_global,
    dailyPerUserUsd: appConfig.budget_daily_usd_per_user,
    monthlyGlobalUsd: appConfig.budget_monthly_usd_global,
    userId,
  });
  if (!budget.allowed) {
    log(`regenerate blocked by cost ceiling: ${budget.reason ?? "unknown"}`);
    return new Response(
      JSON.stringify({ error: AI_TEMPORARILY_UNAVAILABLE_MESSAGE, tripped: budget.tripped }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const regenLimit = await checkCompanionRegenerateLimit(svcClient, userId, 24, 12);
  if (!regenLimit.allowed) {
    return new Response(JSON.stringify({ error: regenLimit.reason ?? "Regenerate limit reached" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Circuit breaker: regenerate is an explicit user action, so we surface a
  // clear 503 rather than silently serving cache. The UI can show a
  // "provider having issues, try again shortly" message.
  const providerHealth = await getProviderHealth(svcClient);
  const slotNeedsPerplexity = slot === "signal" || slot === "grounding" || slot === "history";
  const breakerBlocked =
    (slotNeedsPerplexity && providerHealth.perplexity.state === "degraded") ||
    providerHealth.lovable.state === "degraded";
  if (breakerBlocked) {
    const tripped = providerHealth.lovable.state === "degraded" ? "lovable" : "perplexity";
    log(`regenerate blocked by breaker_${tripped}`);
    return new Response(
      JSON.stringify({
        error: AI_TEMPORARILY_UNAVAILABLE_MESSAGE,
        tripped: `breaker_${tripped}`,
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Ownership: verify the pause_instance belongs to the caller. We also
  // pull the context snapshot + reflection_text artifact for AI inputs so
  // the client doesn't need to resend them on regenerate.
  const { data: instance, error: instErr } = await svcClient
    .from("pause_instances")
    .select("user_id, context_snapshot")
    .eq("id", pauseInstanceId)
    .maybeSingle();

  if (instErr || !instance || instance.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Pause instance not found" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: refArtifact } = await svcClient
    .from("pause_ai_artifacts")
    .select("content")
    .eq("pause_instance_id", pauseInstanceId)
    .eq("kind", "reflection_text")
    .maybeSingle();

  const ctxSnapshot = (instance.context_snapshot ?? {}) as Record<string, unknown>;
  const context =
    (body.context as string | undefined) ??
    (typeof ctxSnapshot.context_text === "string" ? (ctxSnapshot.context_text as string) : "");
  const refArtContent = (refArtifact?.content ?? {}) as Record<string, unknown>;
  const reflectionMessage =
    (body.reflectionMessage as string | undefined) ??
    (typeof refArtContent.message === "string" ? (refArtContent.message as string) : "");
  const mood =
    (body.mood as string | undefined) ??
    (typeof ctxSnapshot.last_reported_mood === "string"
      ? (ctxSnapshot.last_reported_mood as string)
      : undefined);
  const language = (body.language as string) || "en";
  const moodHistory = body.moodHistory as Array<{ mood: string; outcome?: string | null }> | undefined;
  const rawSeverity = typeof body.severity === "number" ? body.severity : 0;
  const severity = bucketSeverity(rawSeverity);

  const intent = determineSessionIntent({
    context: context || undefined,
    mood,
    severity: rawSeverity,
    moodHistory,
  });

  const t0 = Date.now();

  function contentTitleFromPayload(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;
    const o = data as Record<string, unknown>;
    if (typeof o.title === "string" && o.title.length > 0) return o.title;
    const dt = o.deepTime;
    if (dt && typeof dt === "object") {
      const dtt = (dt as Record<string, unknown>).title;
      if (typeof dtt === "string" && dtt.length > 0) return dtt;
    }
    return null;
  }

  type CompanionResult = {
    data: unknown;
    source: "live" | "library" | "cache" | "curated" | "empty";
    cacheId: string | null;
    cacheRelaxation?: string | null;
    latencyMs: number;
    promptVersion?: string;
    error?: string;
  };

  let result: CompanionResult;

  try {
    if (slot === "grounding") {
      let sources = body.groundingSources as Array<{ name: string; type: string; url?: string }> | undefined;
      if (!sources?.length) {
        sources = await fetchGroundingSourcesForOrchestrate(svcClient, userId) ?? undefined;
      }
      const recentNudgeTopics = body.recentNudgeTopics as string[] | undefined;
      const recentGroundingSources = body.recentGroundingSources as string[] | undefined;
      const g = await generateGrounding({
        svcClient,
        context,
        language,
        recentTopics: recentNudgeTopics,
        sources,
        recentGroundingSources,
        recentGroundingTitles: recentNudgeTopics,
        userId,
        pauseInstanceId,
        log,
        preferredBias: intent.groundingBias,
        forceLive: true,
      });
      result = {
        data: g.data,
        source: g.source,
        cacheId: g.cacheId,
        cacheRelaxation: g.cacheRelaxation ?? null,
        latencyMs: Date.now() - t0,
        promptVersion: GROUNDING_VERSION,
        error: g.error,
      };
    } else if (slot === "signal") {
      let signalSources = body.signalSources as Array<{ name: string; type: string; url?: string }> | undefined;
      if (!signalSources?.length) {
        signalSources = await fetchSignalSourcesForOrchestrate(svcClient, userId) ?? undefined;
      }
      const clientSignalUrls = Array.isArray(body.recentSignalUrls)
        ? (body.recentSignalUrls as string[]).filter((u) => typeof u === "string" && u.length > 0)
        : [];
      let mergedRecentSignalUrls: string[] | undefined;
      try {
        const fromDb = await fetchRecentSignalCitationUrls(svcClient, userId, {
          excludePauseInstanceId: pauseInstanceId,
          limit: 24,
        });
        mergedRecentSignalUrls = mergeRecentSignalUrls(fromDb, clientSignalUrls, 24);
      } catch (e) {
        log(`fetchRecentSignalCitationUrls failed: ${e}`);
        mergedRecentSignalUrls = clientSignalUrls.length > 0 ? clientSignalUrls.slice(0, 24) : undefined;
      }
      const s = await generateSignal({
        svcClient,
        context,
        language,
        sources: signalSources,
        recentSignalSources: body.recentSignalSources as string[] | undefined,
        recentSignalTitles: body.recentSignalTitles as string[] | undefined,
        recentSignalUrls: mergedRecentSignalUrls,
        userId,
        pauseInstanceId,
        log,
        searchAngle: intent.signalAngle,
        forceLive: true,
      });
      result = {
        data: s.data,
        source: s.source,
        cacheId: s.cacheId,
        cacheRelaxation: s.cacheRelaxation ?? null,
        latencyMs: Date.now() - t0,
        promptVersion: SIGNAL_VERSION,
        error: s.error,
      };
    } else if (slot === "history") {
      const h = await generateHistory({
        svcClient,
        context,
        language,
        mood,
        recentTitles: body.recentHistoryTitles as string[] | undefined,
        userId,
        log,
        preferredMood: intent.historyMood as "recovery" | "caution" | "neutral",
        forceLive: true,
      });
      result = {
        data: h.data,
        source: h.source,
        cacheId: h.cacheId,
        cacheRelaxation: h.cacheRelaxation ?? null,
        latencyMs: Date.now() - t0,
        promptVersion: HISTORY_VERSION,
        error: h.error,
      };
    } else {
      const z = await generateZoomOut({
        svcClient,
        context,
        language,
        reflectionMessage,
        mood,
        userId,
        recentTitles: body.recentZoomOutTitles as string[] | undefined,
        log,
        zoomOutAngle: intent.zoomOutAngle,
        forceLive: true,
        trackedAssetId,
      });
      result = {
        data: z.data,
        source: z.source,
        cacheId: z.cacheId,
        cacheRelaxation: z.cacheRelaxation ?? null,
        latencyMs: Date.now() - t0,
        promptVersion: ZOOM_OUT_VERSION,
        error: z.error,
      };
    }
  } catch (e) {
    log(`regenerate ${slot} failed: ${e instanceof Error ? e.message : String(e)}`);
    result = {
      data: null,
      source: "empty",
      cacheId: null,
      cacheRelaxation: null,
      latencyMs: Date.now() - t0,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const orchestratorKey = slot;
  const companionType = ORCHESTRATOR_KEY_MAP[orchestratorKey];

  logCompanionSlotResolved(log, {
    companion_type: companionType,
    orchestrator_slot: slot,
    pause_prefix: pauseInstanceId.slice(0, 8),
    source: result.source,
    cache_relaxation: result.cacheRelaxation ?? null,
    latency_ms: result.latencyMs,
    filled: Boolean(result.data),
    error: result.error ?? null,
  });

  const response: Record<string, unknown> = {
    signal: null,
    grounding: null,
    history: null,
    zoomOut: null,
    intervention: null,
    regenerated: slot,
  };
  response[slot === "zoomOut" ? "zoomOut" : slot] = result;

  const serveRow = {
    user_id: userId,
    pause_instance_id: pauseInstanceId,
    companion_type: companionType,
    serve_source: result.source,
    cache_entry_id: result.cacheId || null,
    cache_relaxation: result.cacheRelaxation ?? null,
    content_title: contentTitleFromPayload(result.data),
    content_fingerprint: result.promptVersion ?? null,
    latency_ms: result.latencyMs,
  };

  try {
    if (result.data !== null && result.data !== undefined && typeof result.data === "object") {
      await writeCompanionData(
        svcClient,
        pauseInstanceId,
        userId,
        companionType,
        result.data as Record<string, unknown>,
      );
    }
    await svcClient.from("companion_serves").insert(serveRow);
    await svcClient.from("analytics_events").insert({
      user_id: userId,
      event: "companion_regenerate",
      metadata: { pause_instance_id: pauseInstanceId, slot, source: result.source },
    });
  } catch (e) {
    log(`regenerate persist error: ${e instanceof Error ? e.message : String(e)}`);
    return new Response(JSON.stringify({ error: "Failed to save regenerated companion" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
