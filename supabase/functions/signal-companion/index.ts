import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { createAuthenticatedClient, createServiceClient } from "../_shared/auth.ts";
import { createObsTracker, createLogger } from "../_shared/observe.ts";
import { pickRandom, SIGNAL_FALLBACKS } from "../_shared/fallbacks.ts";
import { generateSignal } from "../_shared/generators/signal.ts";

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const t0 = Date.now();
  const log = createLogger("signal");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Unauthorized", 401);
    }

    let body: any = {};
    try { body = await req.json(); } catch {
      return errorResponse("Invalid or empty request body", 400);
    }
    const { context, sources, recentSignalSources, recentSignalTitles } = body;
    log("parsed body");

    const sbClient = await createAuthenticatedClient(authHeader);
    const { data: { user }, error: authError } = await sbClient.auth.getUser();
    if (authError || !user) {
      return errorResponse("Unauthorized", 401);
    }
    log("auth verified");

    const svcClient = await createServiceClient();
    svcClient.from("analytics_events").insert({ user_id: user.id, event: "signal_companion_ai_call" }).then(() => {});

    const trackObs = createObsTracker(svcClient, user.id, "signal", t0);

    const result = await generateSignal({
      svcClient,
      context,
      sources,
      recentSignalSources,
      recentSignalTitles,
      userId: user.id,
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
      return jsonResponse(pickRandom(SIGNAL_FALLBACKS));
    } catch {
      return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);
    }
  }
});
