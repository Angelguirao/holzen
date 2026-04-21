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
  type MoodHistoryEntry,
} from "../_shared/reflection-generate.ts";

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
    try {
      await svcClient.from("analytics_events").insert({ user_id: userId, event: "pause_ai_call" });
    } catch (_) { /* tracking failure is non-fatal */ }

    // Reflection is NOT subject to panic_mode (we want users to see a reflection
    // even when companions are bypassed — it's ~$0.001 per call). It IS subject
    // to the cost ceilings so a runaway loop still gets stopped.
    const appConfig = await loadAppConfig(svcClient);
    const budget = await checkCostCeilings(svcClient, {
      dailyGlobalUsd: appConfig.budget_daily_usd_global,
      dailyPerUserUsd: appConfig.budget_daily_usd_per_user,
      monthlyGlobalUsd: appConfig.budget_monthly_usd_global,
      userId,
    });
    if (!budget.allowed) {
      log(`reflection budget tripped (${budget.tripped}): ${budget.reason}`);
      if (companionFallbacksDisabled()) {
        return errorResponse(budget.reason ?? "Budget exceeded", 503);
      }
      const pool = await loadFallbackPool<{ message: string; haiku: string }>(svcClient, "reflection");
      return jsonResponse(pickRandom(pool));
    }

    // Circuit breaker: if Lovable is degraded, skip the live call and serve the
    // curated pool. Reflection only uses Lovable, so this is a simple one-gate
    // check. Saves the API call that would probably fail anyway.
    const degraded = await degradedProviders(svcClient, ["lovable"]);
    if (degraded.length > 0) {
      log("reflection: lovable degraded, serving curated pool");
      if (companionFallbacksDisabled()) {
        return errorResponse("Provider degraded", 503);
      }
      const pool = await loadFallbackPool<{ message: string; haiku: string }>(svcClient, "reflection");
      return jsonResponse(pickRandom(pool));
    }

    const trackObs = createObsTracker(svcClient, userId, "reflection", t0);
    const logAttempt = createAttemptLogger(svcClient, { userId });

    const body = await req.json();
    const { context, tone, style, moodHistory, severity, language, recentHaikus, recentMessages } = body;
    const customPrompt = sanitizePromptInput(body.customPrompt, 500);
    const motivations = sanitizePromptArray(body.motivations, 10, 100);
    const mantra = sanitizePromptInput(body.mantra, 200);
    const groundingActivities = sanitizePromptArray(body.groundingActivities, 10, 100);
    if (!context) {
      return errorResponse("Missing context", 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      if (companionFallbacksDisabled()) {
        return errorResponse(COMPANION_FALLBACKS_DISABLED_MESSAGE, 503);
      }
      const pool = await loadFallbackPool<{ message: string; haiku: string }>(svcClient, "reflection");
      const fallback = pickRandom(pool);
      trackObs("companion_fallback_curated");
      return jsonResponse(fallback);
    }

    const { result, lastStatus } = await generateUnifiedReflection({
      context,
      apiKey: LOVABLE_API_KEY,
      tone,
      style,
      language,
      moodHistory: moodHistory as MoodHistoryEntry[] | undefined,
      severity,
      recentHaikus,
      recentMessages,
      customPrompt: customPrompt || undefined,
      motivations: motivations.length > 0 ? motivations : undefined,
      mantra: mantra || undefined,
      groundingActivities: groundingActivities.length > 0 ? groundingActivities : undefined,
      log: (m) => log(m),
      logAttempt: (e) => logAttempt(e as unknown as Parameters<typeof logAttempt>[0]),
    });

    if (!result?.message) {
      if (lastStatus === 429) {
        return errorResponse("Rate limited. Try again later.", 429);
      }
      if (lastStatus === 402) {
        return errorResponse("AI usage limit reached.", 402);
      }
      if (companionFallbacksDisabled()) {
        return errorResponse(COMPANION_FALLBACKS_DISABLED_MESSAGE, 503);
      }
      log("All AI models failed, serving curated fallback");
      const fallback = pickRandom(REFLECTION_FALLBACKS);
      trackObs("companion_fallback_curated");
      return jsonResponse(fallback);
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
      },
    }).then(() => {});

    return jsonResponse({
      message: result.message,
      haiku: result.haiku || null,
      grounding_title: result.grounding_title,
      grounding_body: result.grounding_body,
      grounding_citation: result.grounding_citation,
      grounding_url: result.grounding_url,
    });
  } catch (e) {
    log.error("unhandled error", { error: e instanceof Error ? e.message : String(e) });
    if (companionFallbacksDisabled()) {
      return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);
    }
    try {
      const svc = await createServiceClient();
      const pool = await loadFallbackPool<{ message: string; haiku: string }>(svc, "reflection");
      return jsonResponse(pickRandom(pool));
    } catch {
      return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }
  })
);
