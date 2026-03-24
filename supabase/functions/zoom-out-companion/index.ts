import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { verifyFlexAuth, createServiceClient } from "../_shared/auth.ts";
import { createLogger, createObsTracker } from "../_shared/observe.ts";
import { generateZoomOut } from "../_shared/generators/zoom-out.ts";

serve(async (req) => {
  const corsRes = handleCors(req);
  if (corsRes) return corsRes;

  const t0 = Date.now();
  const log = createLogger("zoom-out");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing authorization", 401);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid or empty request body", 400);
    }
    const { context, reflectionMessage, userId: bodyUserId, mood, recentTitles } = body;

    const { userId: resolvedUserId, isService } = await verifyFlexAuth(req, bodyUserId);
    if (!isService && !resolvedUserId) {
      return errorResponse("Not authenticated", 401);
    }
    const effectiveUserId = resolvedUserId || bodyUserId;

    const serviceClient = await createServiceClient();

    if (effectiveUserId) {
      try {
        await serviceClient.from("analytics_events").insert({ user_id: effectiveUserId, event: "zoom_out_ai_call" });
      } catch (_) { /* non-fatal */ }
    }

    const trackObs = effectiveUserId
      ? createObsTracker(serviceClient, effectiveUserId, "zoom_out", t0)
      : (_event: string, _meta?: Record<string, any>) => {};

    const result = await generateZoomOut({
      svcClient: serviceClient,
      context,
      language: body.language,
      reflectionMessage,
      mood,
      userId: effectiveUserId,
      recentTitles,
      log,
    });

    // Track deep-time observability
    if (result.source === "live") trackObs("companion_live_generated");
    else if (result.source === "cache") trackObs("companion_cache_hit");
    else if (result.source === "curated") trackObs("companion_fallback_curated");

    log("done");
    return jsonResponse(result.data);
  } catch (e) {
    console.error("zoom-out error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);
  }
});
