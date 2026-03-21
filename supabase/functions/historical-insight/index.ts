import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createServiceClient, verifyFlexAuth } from "../_shared/auth.ts";
import { createObsTracker, createLogger } from "../_shared/observe.ts";
import { pickRandom, HISTORY_FALLBACKS } from "../_shared/fallbacks.ts";
import { generateHistory } from "../_shared/generators/history.ts";

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const t0 = Date.now();
  const log = createLogger("historical-insight");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Unauthorized", 401);
    }

    const { context, userId: bodyUserId, mood, recentTitles } = await req.json();

    const auth = await verifyFlexAuth(req, bodyUserId);
    if (!auth.isService && auth.userId === null) {
      return errorResponse("Unauthorized", 401);
    }

    const effectiveUserId = auth.userId || bodyUserId;
    log("auth verified");

    const svcClient = await createServiceClient();

    if (effectiveUserId) {
      try { await svcClient.from("analytics_events").insert({ user_id: effectiveUserId, event: "historical_insight_ai_call" }); } catch (_) { /* non-fatal */ }
    }

    const trackObs = effectiveUserId
      ? createObsTracker(svcClient, effectiveUserId, "historical_insight", t0)
      : (_event: string, _meta?: Record<string, any>) => {};

    const result = await generateHistory({
      svcClient,
      context,
      mood,
      recentTitles,
      userId: effectiveUserId || undefined,
      log,
    });

    if (result.source === "cache") trackObs("companion_cache_hit");
    else if (result.source === "curated") trackObs("companion_fallback_curated");
    else trackObs("companion_live_generated");

    log(`done, source: ${result.source}`);
    return jsonResponse({ ...result.data, _cache_id: result.cacheId, _serve_source: result.source });
  } catch (e) {
    log.error("unhandled error", { error: e instanceof Error ? e.message : String(e) });
    try {
      return jsonResponse(pickRandom(HISTORY_FALLBACKS));
    } catch {
      return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }
});
