import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { jsonResponse, errorResponse } from "../_shared/cors.ts";

import { createAuthenticatedClient, createServiceClient } from "../_shared/auth.ts";

import { createAttemptLogger, createObsTracker } from "../_shared/observe.ts";

import { withRequestLogging } from "../_shared/with-request-logging.ts";

import { checkCostCeilings } from "../_shared/ratelimit.ts";

import { loadAppConfig } from "../_shared/app-config.ts";

import { degradedProviders } from "../_shared/circuit-breaker.ts";

import {

  companionFallbacksDisabled,

  COMPANION_FALLBACKS_DISABLED_MESSAGE,

  loadFallbackPool,

  pickRandom,

  REFLECTION_FALLBACKS,

} from "../_shared/fallbacks.ts";

import { sanitizePromptInput, sanitizePromptArray } from "../_shared/sanitize.ts";

import {

  generateUnifiedReflection,

  REFLECTION_PROMPT_VERSION,

  type CurrentFeelInput,

  type MoodHistoryEntry,

} from "../_shared/reflection-generate.ts";

import { mapReflectionFallbackToV2 } from "../_shared/reflection-fallback-v2.ts";

import {
  resolveLlmCredentialChain,
  resolveLlmBudgetTier,
  shouldUseCuratedFallbackForGoogleDegradation,
} from "../_shared/llm-gateway.ts";



function parseCurrentFeel(raw: unknown): CurrentFeelInput | undefined {

  if (!raw || typeof raw !== "object") return undefined;

  const o = raw as Record<string, unknown>;

  const mood = typeof o.mood === "string" ? o.mood.trim() : "";

  if (!mood) return undefined;

  const feel: CurrentFeelInput = { mood };

  if (typeof o.intensity === "number" && o.intensity >= 1 && o.intensity <= 5) {

    feel.intensity = o.intensity;

  }

  if (typeof o.tileId === "string" && o.tileId.trim()) feel.tileId = o.tileId.trim();

  if (typeof o.tileLabel === "string" && o.tileLabel.trim()) feel.tileLabel = o.tileLabel.trim();

  return feel;

}



async function loadCurrentFeelFromInstance(

  svcClient: Awaited<ReturnType<typeof createServiceClient>>,

  pauseInstanceId: string,

  userId: string,

): Promise<CurrentFeelInput | undefined> {

  const { data, error } = await svcClient

    .from("pause_step_events")

    .select("payload")

    .eq("pause_instance_id", pauseInstanceId)

    .eq("user_id", userId)

    .eq("step_type", "initial_emotion_logged")

    .order("created_at", { ascending: false })

    .limit(1)

    .maybeSingle();

  if (error || !data?.payload || typeof data.payload !== "object") return undefined;

  const p = data.payload as Record<string, unknown>;

  if (p.skipped === true) return undefined;

  const mood = typeof p.mood === "string" ? p.mood : "";

  if (!mood) return undefined;

  const feel: CurrentFeelInput = { mood };

  if (typeof p.intensity === "number") feel.intensity = p.intensity;

  if (typeof p.brief_face === "string") feel.tileId = p.brief_face;

  return feel;

}



function reflectionJsonResponse(

  result: {

    schemaVersion: 2;

    land: string;

    hypothesis: string;

    inquiry: string;

    contextStrip: string;

    message: string;

    haiku: string | null;

  },

) {

  return jsonResponse({

    schemaVersion: 2,

    land: result.land,

    hypothesis: result.hypothesis,

    inquiry: result.inquiry,

    contextStrip: result.contextStrip,

    message: result.message,

    haiku: result.haiku,

    grounding_title: null,

    grounding_body: null,

    grounding_citation: null,

    grounding_url: null,

  });

}



serve(

  withRequestLogging("holzen-reflect", async ({ req, log }) => {

  const t0 = Date.now();



  try {

    const authHeader = req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {

      return errorResponse("Unauthorized", 401);

    }



    const sbClient = await createAuthenticatedClient(authHeader);

    const { data: { user }, error: authError } = await sbClient.auth.getUser();

    if (authError || !user) {

      return errorResponse("Unauthorized", 401);

    }



    const userId = user.id;

    const svcClient = await createServiceClient();



    const appConfig = await loadAppConfig(svcClient);

    const budget = await checkCostCeilings(svcClient, {

      dailyGlobalUsd: appConfig.budget_daily_usd_global,

      dailyPerUserUsd: appConfig.budget_daily_usd_per_user,

      monthlyGlobalUsd: appConfig.budget_monthly_usd_global,

      userId,

    });



    const rawText = await req.text();

    let body: Record<string, unknown>;

    try {

      body = JSON.parse(rawText || "{}") as Record<string, unknown>;

    } catch {

      return errorResponse("Invalid JSON body", 400);

    }



    const {

      context,

      tone,

      style,

      moodHistory,

      severity,

      language,

      recentHaikus,

      recentMessages,

      pauseInstanceId,

    } = body;

    const customPrompt = sanitizePromptInput(body.customPrompt, 500);

    const motivations = sanitizePromptArray(body.motivations, 10, 100);

    const mantra = sanitizePromptInput(body.mantra, 200);

    const groundingActivities = sanitizePromptArray(body.groundingActivities, 10, 100);

    if (!context || typeof context !== "string") {

      return errorResponse("Missing context", 400);

    }



    const severityNum = typeof severity === "number" ? severity : 0;

    let currentFeel = parseCurrentFeel(body.currentFeel);

    if (!currentFeel && typeof pauseInstanceId === "string" && pauseInstanceId.trim()) {

      currentFeel = await loadCurrentFeelFromInstance(svcClient, pauseInstanceId.trim(), userId);

    }



    const serveFallback = async (reason: string) => {

      log(reason);

      if (companionFallbacksDisabled()) {

        return errorResponse(COMPANION_FALLBACKS_DISABLED_MESSAGE, 503);

      }

      const pool = await loadFallbackPool<{ message: string; haiku: string }>(svcClient, "reflection");

      const fallback = pickRandom(pool.length > 0 ? pool : REFLECTION_FALLBACKS);

      return reflectionJsonResponse(

        mapReflectionFallbackToV2(fallback, {

          context,

          severity: severityNum,

          mood: currentFeel?.mood,

        }),

      );

    };



    if (!budget.allowed) {

      return serveFallback(`reflection budget tripped (${budget.tripped}): ${budget.reason}`);

    }



    const degraded = await degradedProviders(svcClient, ["google"]);

    const llmChain = resolveLlmCredentialChain();

    if (shouldUseCuratedFallbackForGoogleDegradation(degraded.includes("google"), llmChain)) {

      return serveFallback("reflection: gemini degraded, no openrouter — serving curated pool");

    }

    if (degraded.includes("google") && llmChain.some((c) => c.provider === "openrouter")) {

      log("reflection: google degraded, attempting live generation via openrouter");

    }



    const trackObs = createObsTracker(svcClient, userId, "reflection", t0);

    const logAttempt = createAttemptLogger(svcClient, { userId });



    const budgetTier = await resolveLlmBudgetTier(svcClient);



    if (llmChain.length === 0) {

      if (companionFallbacksDisabled()) {

        return errorResponse(COMPANION_FALLBACKS_DISABLED_MESSAGE, 503);

      }

      const pool = await loadFallbackPool<{ message: string; haiku: string }>(svcClient, "reflection");

      const fallback = pickRandom(pool);

      trackObs("companion_fallback_curated");

      return reflectionJsonResponse(

        mapReflectionFallbackToV2(fallback, {

          context,

          severity: severityNum,

          mood: currentFeel?.mood,

        }),

      );

    }



    try {

      await svcClient.from("analytics_events").insert({ user_id: userId, event: "pause_ai_call" });

    } catch (_) { /* tracking failure is non-fatal */ }



    const { result, lastStatus } = await generateUnifiedReflection({

      context,

      llm: llmChain[0]!,

      budgetTier,

      tone: typeof tone === "string" ? tone : undefined,

      style: typeof style === "string" ? style : undefined,

      language: typeof language === "string" ? language : undefined,

      currentFeel,

      moodHistory: moodHistory as MoodHistoryEntry[] | undefined,

      severity: severityNum,

      recentHaikus: Array.isArray(recentHaikus) ? recentHaikus as string[] : undefined,

      recentMessages: Array.isArray(recentMessages) ? recentMessages as string[] : undefined,

      customPrompt: customPrompt || undefined,

      motivations: motivations.length > 0 ? motivations : undefined,

      mantra: mantra || undefined,

      groundingActivities: groundingActivities.length > 0 ? groundingActivities : undefined,

      log: (m) => log(m),

      logAttempt: (e) => logAttempt(e as unknown as Parameters<typeof logAttempt>[0]),

      incomingRequest: req,

    });



    if (!result?.message) {

      if (companionFallbacksDisabled()) {

        if (lastStatus === 429) {

          return errorResponse("Rate limited. Try again later.", 429);

        }

        if (lastStatus === 402) {

          return errorResponse("AI usage limit reached.", 402);

        }

        return errorResponse(COMPANION_FALLBACKS_DISABLED_MESSAGE, 503);

      }

      log(`reflection: live generation unavailable (HTTP ${lastStatus}), serving curated pool`);

      const pool = await loadFallbackPool<{ message: string; haiku: string }>(svcClient, "reflection");

      const fallback = pickRandom(pool.length > 0 ? pool : REFLECTION_FALLBACKS);

      trackObs("companion_fallback_curated");

      return reflectionJsonResponse(

        mapReflectionFallbackToV2(fallback, {

          context,

          severity: severityNum,

          mood: currentFeel?.mood,

        }),

      );

    }



    trackObs("companion_live_generated");



    svcClient.from("analytics_events").insert({

      user_id: userId,

      event: "reflection_generated",

      metadata: {

        tone,

        style,

        message_length: result.message.length,

        has_haiku: !!result.haiku,

        prompt_version: REFLECTION_PROMPT_VERSION,

        schema_version: 2,

      },

    }).then(() => {});



    return reflectionJsonResponse(result);

  } catch (e) {

    log.error("unhandled error", { error: e instanceof Error ? e.message : String(e) });

    if (companionFallbacksDisabled()) {

      return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);

    }

    try {

      const svc = await createServiceClient();

      const pool = await loadFallbackPool<{ message: string; haiku: string }>(svc, "reflection");

      const fallback = pickRandom(pool);

      return reflectionJsonResponse(

        mapReflectionFallbackToV2(fallback, { context: "", severity: 0 }),

      );

    } catch {

      return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);

    }

  }

  }),

);


