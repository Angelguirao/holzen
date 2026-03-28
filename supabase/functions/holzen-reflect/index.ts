import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createAuthenticatedClient, createServiceClient } from "../_shared/auth.ts";
import { createAttemptLogger, createObsTracker, createLogger } from "../_shared/observe.ts";
import { REFLECTION_FALLBACKS, pickRandom } from "../_shared/fallbacks.ts";
import { sanitizePromptInput, sanitizePromptArray } from "../_shared/sanitize.ts";
import {
  generateUnifiedReflection,
  REFLECTION_PROMPT_VERSION,
  type MoodHistoryEntry,
} from "../_shared/reflection-generate.ts";

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const t0 = Date.now();
  const log = createLogger("holzen-reflect");

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
      const fallback = pickRandom(REFLECTION_FALLBACKS);
      trackObs("companion_fallback_curated");
      return jsonResponse(fallback);
    }

    const { result, lastStatus } = await generateUnifiedReflection({
      context,
      apiKey: LOVABLE_API_KEY,
      includeLearning: false,
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
      logAttempt: (e) => logAttempt(e as Parameters<typeof logAttempt>[0]),
    });

    if (!result?.message) {
      if (lastStatus === 429) {
        return errorResponse("Rate limited. Try again later.", 429);
      }
      if (lastStatus === 402) {
        return errorResponse("AI usage limit reached.", 402);
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
    console.error("holzen-reflect error:", e);
    try {
      const fallback = pickRandom(REFLECTION_FALLBACKS);
      return jsonResponse(fallback);
    } catch {
      return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }
});
