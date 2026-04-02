/**
 * Targeted single-companion regeneration for companion-orchestrate.
 */

import { checkDailyBudget, checkCompanionRegenerateLimit } from "./ratelimit.ts";
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
import { PROMPT_VERSION as SIGNAL_VERSION } from "./generators/signal.ts";
import { PROMPT_VERSION as GROUNDING_VERSION } from "./generators/grounding.ts";
import { PROMPT_VERSION as HISTORY_VERSION } from "./generators/history.ts";
import { PROMPT_VERSION as ZOOM_OUT_VERSION } from "./generators/zoom-out.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export type RegenerateSlot = "signal" | "grounding" | "history" | "zoomOut";

export async function handleRegenerateOnly(params: {
  slot: RegenerateSlot;
  userId: string;
  svcClient: any;
  body: Record<string, unknown>;
  log: (msg: string, extra?: Record<string, unknown>) => void;
}): Promise<Response> {
  const { slot, userId, svcClient, body, log } = params;

  const reflectionId = body.reflectionId as string | undefined;
  if (!reflectionId) {
    return new Response(JSON.stringify({ error: "reflectionId required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const budget = await checkDailyBudget(svcClient, 10.0);
  if (!budget.allowed) {
    return new Response(JSON.stringify({ error: budget.reason ?? "Budget exceeded" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const regenLimit = await checkCompanionRegenerateLimit(svcClient, userId, 24, 12);
  if (!regenLimit.allowed) {
    return new Response(JSON.stringify({ error: regenLimit.reason ?? "Regenerate limit reached" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: reflection, error: refErr } = await svcClient
    .from("reflections")
    .select("user_id, message, context, mood")
    .eq("id", reflectionId)
    .maybeSingle();

  if (refErr || !reflection || reflection.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Reflection not found" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const context = (body.context as string | undefined) ?? (reflection.context as string) ?? "";
  const reflectionMessage = (body.reflectionMessage as string | undefined) ?? (reflection.message as string) ?? "";
  const mood = (body.mood as string | undefined) ?? (reflection.mood as string | undefined) ?? undefined;
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
  type CompanionResult = {
    data: any;
    source: "live" | "cache" | "curated" | "empty";
    cacheId: string | null;
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
        reflectionId,
        log,
        preferredBias: intent.groundingBias,
      });
      result = {
        data: g.data,
        source: g.source,
        cacheId: g.cacheId,
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
          excludeReflectionId: reflectionId,
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
        reflectionId,
        log,
        searchAngle: intent.signalAngle,
      });
      result = {
        data: s.data,
        source: s.source,
        cacheId: s.cacheId,
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
      });
      result = {
        data: h.data,
        source: h.source,
        cacheId: h.cacheId,
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
      });
      result = {
        data: z.data,
        source: z.source,
        cacheId: z.cacheId,
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
      latencyMs: Date.now() - t0,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const orchestratorKey = slot;
  const companionType = ORCHESTRATOR_KEY_MAP[orchestratorKey];

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
    reflection_id: reflectionId,
    companion_type: companionType,
    serve_source: result.source,
    cache_entry_id: result.cacheId || null,
    content_title: result.data?.title || result.data?.deepTime?.title || null,
    content_fingerprint: result.promptVersion ?? null,
    latency_ms: result.latencyMs,
  };

  try {
    if (result.data) {
      await writeCompanionData(svcClient, reflectionId, companionType, result.data);
    }
    await svcClient.from("companion_serves").insert(serveRow);
    await svcClient.from("analytics_events").insert({
      user_id: userId,
      event: "companion_regenerate",
      metadata: { reflection_id: reflectionId, slot, source: result.source },
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
