import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import type { InterventionPayload, OrchestrateResponse } from "./companion-orchestrate-types.ts";
import { contentSatisfiesCompanion } from "./companion-orchestrate-parse.ts";
import type { createLogger } from "./observe.ts";

/** Request logger from `withRequestLogging` / `createLogger`. */
export type OrchestrateSkipCacheLog = ReturnType<typeof createLogger>;

/**
 * If pause_ai_artifacts already has every slot this invoke would generate, return a
 * response assembled from the existing rows (source "cache") and skip AI, rate limit,
 * and budget. Grep: orchestrate_skip_cached.
 */
export async function tryOrchestrateSkipFromPauseArtifacts(params: {
  svcClient: SupabaseClient;
  pauseInstanceId: string;
  useIntervention: boolean;
  needSignal: boolean;
  needGrounding: boolean;
  needHistory: boolean;
  needZoomOut: boolean;
  log: OrchestrateSkipCacheLog;
}): Promise<OrchestrateResponse | null> {
  const { data: rows, error } = await params.svcClient
    .from("pause_ai_artifacts")
    .select("kind, content")
    .eq("pause_instance_id", params.pauseInstanceId);
  if (error || !rows?.length) return null;

  const byType = new Map<string, unknown>();
  for (const r of rows) {
    byType.set(r.kind as string, r.content);
  }

  const hasSignal = () => contentSatisfiesCompanion("signal", byType.get("signal"));
  const hasGrounding = () => contentSatisfiesCompanion("ground_nudge", byType.get("ground_nudge"));
  const hasHistory = () => contentSatisfiesCompanion("historical_insight", byType.get("historical_insight"));
  const hasZoom = () =>
    contentSatisfiesCompanion("zoom_out_deep_time", byType.get("zoom_out_deep_time")) ||
    contentSatisfiesCompanion("zoom_out", byType.get("zoom_out"));
  const hasIntervention = () => contentSatisfiesCompanion("intervention", byType.get("intervention"));

  if (params.needSignal && !hasSignal()) return null;
  if (params.needGrounding && !hasGrounding()) return null;
  if (params.needHistory && !hasHistory()) return null;
  if (params.needZoomOut && !hasZoom()) return null;
  if (params.useIntervention && !hasIntervention()) return null;

  const zoomRaw = byType.get("zoom_out_deep_time") ?? byType.get("zoom_out");

  const response: OrchestrateResponse = {
    signal: params.needSignal
      ? { data: byType.get("signal"), source: "cache", cacheId: null, cacheRelaxation: null, latencyMs: 0 }
      : null,
    grounding: params.needGrounding
      ? { data: byType.get("ground_nudge"), source: "cache", cacheId: null, cacheRelaxation: null, latencyMs: 0 }
      : null,
    history: params.needHistory
      ? { data: byType.get("historical_insight"), source: "cache", cacheId: null, cacheRelaxation: null, latencyMs: 0 }
      : null,
    zoomOut: params.needZoomOut
      ? { data: zoomRaw, source: "cache", cacheId: null, cacheRelaxation: null, latencyMs: 0 }
      : null,
    intervention: params.useIntervention
      ? (byType.get("intervention") as InterventionPayload)
      : null,
  };

  params.log("skip: all requested companion rows already on pause_ai_artifacts");
  try {
    params.log("orchestrate_skip_cached", {
      holzen_event: "orchestrate_skip_cached",
      pause_prefix: params.pauseInstanceId.slice(0, 8),
      need_signal: params.needSignal,
      need_grounding: params.needGrounding,
      need_history: params.needHistory,
      need_zoom: params.needZoomOut,
      need_intervention: params.useIntervention,
    });
  } catch {
    /* non-fatal */
  }

  return response;
}
