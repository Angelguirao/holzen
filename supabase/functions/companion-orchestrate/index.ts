import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, checkCostCeilings } from "../_shared/ratelimit.ts";
import { loadAppConfig, PANIC_MODE_FEATURES } from "../_shared/app-config.ts";
import { getProviderHealth } from "../_shared/circuit-breaker.ts";
import { handleRegenerateOnly } from "../_shared/regenerate-only.ts";
import { trackEvent } from "../_shared/observe.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";
import {
  consumeAllowanceOrCredits,
  resolveTierFromProfile,
  tierLimits,
} from "../_shared/subscription-entitlements.ts";
import { AI_TEMPORARILY_UNAVAILABLE_MESSAGE } from "../_shared/ai-user-messages.ts";
import { generateQuestion } from "../_shared/generators/question.ts";
import { determineSessionIntent } from "../_shared/session-intent.ts";
import { selectIntervention, parseDirection, bucketSeverity, type InterventionSelection } from "../_shared/intervention-selector.ts";
import { fetchGroundingSourcesForOrchestrate } from "../_shared/pause-cron-parity.ts";
import type { InterventionPayload } from "../_shared/companion-orchestrate-types.ts";
import {
  asOptionalString,
  asSourceArray,
  asStringArray,
} from "../_shared/companion-orchestrate-parse.ts";
import { logOrchestrateInvoke } from "../_shared/companion-orchestrate-logging.ts";
import { tryOrchestrateSkipFromPauseArtifacts } from "../_shared/companion-orchestrate-skip-cached.ts";
import { buildOrchestrateCompanionTasks } from "../_shared/companion-orchestrate-tasks.ts";
import {
  foldOrchestrateSettledTasks,
  scheduleOrchestrateBackgroundWrites,
} from "../_shared/companion-orchestrate-assemble.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Companion Orchestrator
 *
 * Single entry point for intervention selection and companion generation.
 *
 * Client invocation modes:
 * - Intervention-only: all enable* false, useIntervention true (mount)
 * - Single-slot lazy: one enable* true (card tap, holzenInvokeSource: browser_lazy_fetch)
 * - Regenerate: regenerateOnly param (explicit user action)
 *
 * Cron/pregenerate may enable multiple slots in one request; enabled tasks
 * run in parallel via Promise.allSettled.
 *
 * Generator phase ordering (library → cache → live → curated) is controlled
 * by COMPANION_PHASE_* env vars in _shared/phase-config.ts.
 *
 * Generators are invoked directly (in-process) instead of via HTTP.
 */

serve(
  withRequestLogging("companion-orchestrate", async ({ req, log }) => {
  const t0 = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawText = await req.text();
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawText || "{}") as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.57.2");
    const sbUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const sbAnon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const token = authHeader.replace("Bearer ", "");

    let userId: string;

    if (token === serviceKey) {
      const uid = body.userId;
      if (typeof uid !== "string" || uid.length === 0) {
        return new Response(
          JSON.stringify({ error: "Service calls must include userId in the JSON body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      userId = uid;
      log("auth verified (service role)");
    } else {
      const sbClient = createClient(sbUrl, sbAnon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await sbClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
      log("auth verified (user JWT)");
    }

    const svcClient = createClient(sbUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false },
    });

    logOrchestrateInvoke(body, token === serviceKey ? "service_role" : "user_jwt");

    const { data: profile } = await svcClient
      .from("profiles")
      .select("lifetime_access, subscription_status, subscription_tier")
      .eq("user_id", userId)
      .maybeSingle();
    const tier = resolveTierFromProfile(profile);
    const tierQuotaLimits = tierLimits(tier);

    const regenerateOnly = body.regenerateOnly as string | undefined;
    if (
      regenerateOnly === "signal" ||
      regenerateOnly === "grounding" ||
      regenerateOnly === "history" ||
      regenerateOnly === "zoomOut"
    ) {
      return await handleRegenerateOnly({
        slot: regenerateOnly,
        userId,
        svcClient,
        body,
        log,
      });
    }

    const {
      pauseInstanceId,
      context,
      language = "en",
      reflectionMessage,
      mood,
      signalSources,
      groundingSources,
      recentSignalSources,
      recentSignalTitles,
      recentSignalUrls,
      recentNudgeTopics,
      recentGroundingSources,
      recentHistoryTitles,
      recentZoomOutTitles,
      enableSignal = false,
      enableGrounding = false,
      enableHistory = false,
      enableZoomOut = false,
      useIntervention = true,
    } = body as Record<string, unknown>;

    const moodHistory = body.moodHistory as
      | Array<{ mood: string; outcome?: string | null }>
      | undefined;
    const contextValue = asOptionalString(context);
    const languageValue = asOptionalString(language) ?? "en";
    const reflectionMessageValue = asOptionalString(reflectionMessage);
    const moodValue = asOptionalString(mood);
    const signalSourcesValue = asSourceArray(signalSources);
    const groundingSourcesValue = asSourceArray(groundingSources);
    const recentSignalSourcesValue = asStringArray(recentSignalSources);
    const recentSignalTitlesValue = asStringArray(recentSignalTitles);
    const recentNudgeTopicsValue = asStringArray(recentNudgeTopics);
    const recentGroundingSourcesValue = asStringArray(recentGroundingSources);
    const recentHistoryTitlesValue = asStringArray(recentHistoryTitles);
    const recentZoomOutTitlesValue = asStringArray(recentZoomOutTitles);

    // ── Authorization: verify pause_instance ownership ──
    // service_role writes; explicitly confirm the caller owns the instance.
    if (typeof pauseInstanceId === "string" && pauseInstanceId.length > 0) {
      const { data: instance, error: instErr } = await svcClient
        .from("pause_instances")
        .select("user_id")
        .eq("id", pauseInstanceId)
        .maybeSingle();

      if (instErr || !instance || instance.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Pause instance not found" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Determine session intent for coherent companion theming ──
    const intent = determineSessionIntent({
      context: contextValue,
      mood: moodValue,
      severity: typeof body.severity === "number" ? body.severity : undefined,
      moodHistory,
    });
    log(`session intent: ${intent.theme}`, { theme: intent.theme, tone: intent.emotionalTone });

    // ── Intervention selection (new pause flow) ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

    let selection: InterventionSelection | null = null;
    if (useIntervention && pauseInstanceId) {
      const rawSeverity = typeof body.severity === "number" ? body.severity : 0;
      const direction = parseDirection(contextValue);
      const severity = bucketSeverity(rawSeverity);
      log(`selecting intervention: mood=${moodValue} severity=${severity} direction=${direction}`);

      selection = await selectIntervention({
        userId,
        pauseInstanceId: pauseInstanceId as string,
        mood: moodValue,
        severity,
        direction,
        moodHistory,
        svcClient,
        log: (msg, extra) => log(`[intervention] ${msg}`, extra),
      });
      log(`intervention selected: mode=${selection.mode} primary=${selection.primary ?? "none"}`);
    }

    // ── Build the intervention response ──
    const interventionPayload: InterventionPayload = {
      mode: selection?.mode ?? "insight",
      primary: null,
      secondary: null,
      question: null,
    };

    if (selection?.primary === "mirror" && selection.mirrorData) {
      interventionPayload.primary = { type: "mirror", data: selection.mirrorData };
    }

    const insightSelection = selection?.mode === "insight" ? selection : null;
    const interventionNeedsGrounding = insightSelection?.primary === "trap";
    const interventionNeedsHistory = insightSelection?.primary === "pattern";
    const interventionNeedsZoomOut = insightSelection?.secondary === "zoom_out";

    const shouldRunGrounding = Boolean(enableGrounding || interventionNeedsGrounding);
    const shouldRunHistory = Boolean(enableHistory || interventionNeedsHistory);
    const shouldRunZoomOut = Boolean(enableZoomOut || interventionNeedsZoomOut);
    const premiumCompanionUnits =
      Number(Boolean(enableSignal)) +
      Number(shouldRunGrounding) +
      Number(shouldRunHistory);

    if (interventionNeedsGrounding && !enableGrounding) {
      log("grounding task forced for trap intervention (companion pref off)");
    }
    if (interventionNeedsHistory && !enableHistory) {
      log("history task forced for pattern intervention (companion pref off)");
    }
    if (interventionNeedsZoomOut && !enableZoomOut) {
      log("zoomOut task forced for intervention secondary (companion pref off)");
    }

    if (premiumCompanionUnits > 0) {
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
        limit: tierQuotaLimits.premium_companion,
        amount: premiumCompanionUnits,
        reason: "companions_overage",
        source: "companion-orchestrate",
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
            credits_needed: Math.max(
              0,
              (premiumCompanionUnits - quota.remainingAllowance) * quota.creditCost - quota.creditsBalance,
            ),
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      log("premium companion quota consumed", {
        tier,
        amount: premiumCompanionUnits,
        used: quota.used,
        remaining: quota.remainingAllowance,
        limit: quota.limit,
        credits_used: quota.creditsUsed,
        credits_balance: quota.creditsBalance,
      });
    }

    const pid = typeof pauseInstanceId === "string" ? pauseInstanceId : "";
    if (pid.length > 0) {
      const skipped = await tryOrchestrateSkipFromPauseArtifacts({
        svcClient,
        pauseInstanceId: pid,
        useIntervention: Boolean(useIntervention),
        needSignal: Boolean(enableSignal),
        needGrounding: shouldRunGrounding,
        needHistory: shouldRunHistory,
        needZoomOut: shouldRunZoomOut,
        log,
      });
      if (skipped) {
        return new Response(JSON.stringify(skipped), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Per-user rate limit + cost ceilings + panic mode ──
    // (all skipped when we successfully served from pause_ai_artifacts above).
    const rateLimit = await checkRateLimit(svcClient, userId, 60, 30);
    if (!rateLimit.allowed) {
      log(`rate limited: ${rateLimit.reason}`);
      return new Response(JSON.stringify({ error: "Rate limited. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appConfig = await loadAppConfig(svcClient);

    // Panic mode: companion features are off. Return empty companions and let
    // the client fall back to its local cache / pause_ai_artifacts path.
    // Reflection is not affected (see PANIC_MODE_FEATURES in _shared/app-config.ts).
    if (appConfig.panic_mode && PANIC_MODE_FEATURES.has("companion_signal")) {
      log("panic mode active — bypassing companion generation");
      return new Response(
        JSON.stringify({
          signal: null,
          grounding: null,
          history: null,
          zoomOut: null,
          intervention: null,
          panic_mode: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const budget = await checkCostCeilings(svcClient, {
      dailyGlobalUsd: appConfig.budget_daily_usd_global,
      dailyPerUserUsd: appConfig.budget_daily_usd_per_user,
      monthlyGlobalUsd: appConfig.budget_monthly_usd_global,
      userId,
    });
    if (!budget.allowed) {
      log(`budget exceeded (${budget.tripped}): ${budget.reason}`);
      return new Response(
        JSON.stringify({
          error: AI_TEMPORARILY_UNAVAILABLE_MESSAGE,
          tripped: budget.tripped,
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (selection && useIntervention && pauseInstanceId) {
      void svcClient.from("analytics_events").insert({
        user_id: userId,
        event: "intervention_selected",
        metadata: {
          mode: selection.mode,
          primary: selection.primary ?? null,
          secondary: selection.secondary ?? null,
          pause_instance_id: pauseInstanceId ?? null,
        },
      }).then(({ error: insErr }: { error: { message: string } | null }) => {
        if (insErr) log.error("analytics intervention_selected insert failed", { error: insErr.message });
      });
    }

    let effectiveGroundingSources = groundingSourcesValue;
    if (shouldRunGrounding && (!effectiveGroundingSources || effectiveGroundingSources.length === 0)) {
      effectiveGroundingSources = await fetchGroundingSourcesForOrchestrate(svcClient, userId) ?? undefined;
    }

    const directionForQuestion = parseDirection(contextValue);
    const rawSeverityForQuestion = typeof body.severity === "number" ? body.severity : 0;
    const severityBucketForQuestion = bucketSeverity(rawSeverityForQuestion);
    const questionPromise =
      selection?.mode === "question" && LOVABLE_API_KEY
        ? generateQuestion({
            context: contextValue ?? "",
            mood: moodValue,
            direction: directionForQuestion,
            severity: severityBucketForQuestion,
            moodHistory,
            apiKey: LOVABLE_API_KEY,
            language: languageValue,
            svcClient,
            userId,
            log: (msg, extra) => log(`[question] ${msg}`, extra),
          })
        : Promise.resolve<string | null>(null);

    // Circuit breakers: if either provider's recent error rate is elevated,
    // signal/grounding/history skip the Perplexity-dependent live phase;
    // Lovable degraded affects all four (structuring + zoom-out).
    // Cache + library + curated fallback still serve in both cases.
    const providerHealth = await getProviderHealth(svcClient);
    const skipLivePerplexity = providerHealth.perplexity.state === "degraded";
    const skipLiveLovable = providerHealth.lovable.state === "degraded";
    if (skipLivePerplexity || skipLiveLovable) {
      log(
        `circuit breaker: perplexity=${providerHealth.perplexity.state} ` +
          `(${(providerHealth.perplexity.errorRate * 100).toFixed(0)}% err over ` +
          `${providerHealth.perplexity.sample} calls), ` +
          `lovable=${providerHealth.lovable.state} ` +
          `(${(providerHealth.lovable.errorRate * 100).toFixed(0)}% err over ` +
          `${providerHealth.lovable.sample} calls)`,
      );
    }

    const tasks = buildOrchestrateCompanionTasks({
      svcClient,
      log,
      userId,
      body,
      pauseInstanceId: typeof pauseInstanceId === "string" ? pauseInstanceId : null,
      contextValue,
      languageValue,
      reflectionMessageValue,
      moodValue,
      intent,
      shouldRunGrounding,
      shouldRunHistory,
      shouldRunZoomOut,
      enableSignal: Boolean(enableSignal),
      effectiveGroundingSources,
      signalSourcesValue,
      recentSignalSourcesValue,
      recentSignalTitlesValue,
      recentNudgeTopicsValue,
      recentGroundingSourcesValue,
      recentHistoryTitlesValue,
      recentZoomOutTitlesValue,
      skipLivePerplexity,
      skipLiveLovable,
    });

    const keys = Object.keys(tasks);
    const [settled, resolvedQuestion] = await Promise.all([
      Promise.allSettled(Object.values(tasks)),
      questionPromise,
    ]);

    if (resolvedQuestion !== null) {
      interventionPayload.question = resolvedQuestion;
      if (typeof resolvedQuestion === "string" && resolvedQuestion.length > 0) {
        trackEvent(svcClient, userId, "intervention_question_ai_call");
      }
    }

    const pauseInstanceIdValue =
      typeof pauseInstanceId === "string" && pauseInstanceId.length > 0
        ? pauseInstanceId
        : null;

    const { response, serveInserts, companionWritePromises } = foldOrchestrateSettledTasks({
      svcClient,
      keys,
      settled,
      selection,
      interventionPayload,
      userId,
      pauseInstanceId: pauseInstanceIdValue,
      t0,
    });

    scheduleOrchestrateBackgroundWrites({
      svcClient,
      selection,
      interventionPayload,
      response,
      serveInserts,
      companionWritePromises,
      pauseInstanceId: pauseInstanceIdValue,
      userId,
      log,
    });

    log(`done, returning ${keys.length} companions`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error("unhandled error", { error: e instanceof Error ? e.message : String(e) });
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  })
);
