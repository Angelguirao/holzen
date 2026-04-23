import { writeCompanionData } from "./companion-data.ts";
import { isCompanionContent } from "./companion-orchestrate-parse.ts";
import type {
  CompanionResult,
  InterventionPayload,
  OrchestrateResponse,
} from "./companion-orchestrate-types.ts";
import type { InterventionSelection } from "./intervention-selector.ts";
import { ORCHESTRATOR_KEY_MAP } from "./companion-types.ts";

const companionTypeMap = ORCHESTRATOR_KEY_MAP;

export type OrchestrateAssembleLog = {
  (msg: string, extra?: Record<string, unknown>): void;
  error: (msg: string, extra?: Record<string, unknown>) => void;
};

/** Fold `Promise.allSettled` generator results into JSON response + serve rows + companion writes. */
export function foldOrchestrateSettledTasks(params: {
  svcClient: any;
  keys: string[];
  settled: PromiseSettledResult<CompanionResult>[];
  selection: InterventionSelection | null;
  interventionPayload: InterventionPayload;
  userId: string;
  reflectionId: unknown;
  pauseInstanceId?: string | null;
  t0: number;
}): {
  response: OrchestrateResponse;
  serveInserts: any[];
  companionWritePromises: Promise<void>[];
} {
  const response: OrchestrateResponse = {
    signal: null,
    grounding: null,
    history: null,
    zoomOut: null,
    intervention: null,
  };
  const serveInserts: any[] = [];
  const companionWritePromises: Promise<void>[] = [];

  for (let i = 0; i < params.keys.length; i++) {
    const key = params.keys[i] as keyof Omit<OrchestrateResponse, "intervention">;
    const result = params.settled[i];

    if (result.status === "fulfilled") {
      response[key] = result.value;

      if (params.selection?.mode === "insight") {
        if (key === "grounding" && params.selection.primary === "trap") {
          params.interventionPayload.primary = { type: "trap", data: result.value.data };
        } else if (key === "history" && params.selection.primary === "pattern") {
          params.interventionPayload.primary = { type: "pattern", data: result.value.data };
        } else if (key === "zoomOut" && params.selection.secondary === "zoom_out") {
          params.interventionPayload.secondary = { type: "zoom_out", data: result.value.data };
        }
      }

      serveInserts.push({
        user_id: params.userId,
        reflection_id: (params.reflectionId as string) || null,
        companion_type: companionTypeMap[key],
        serve_source: result.value.source,
        cache_entry_id: result.value.cacheId || null,
        cache_relaxation: result.value.cacheRelaxation ?? null,
        content_title: result.value.data?.title || result.value.data?.deepTime?.title || null,
        content_fingerprint: result.value.promptVersion ?? null,
        latency_ms: result.value.latencyMs,
      });

      if (
        isCompanionContent(result.value.data) &&
        typeof params.reflectionId === "string" &&
        params.reflectionId.length > 0
      ) {
        const cType = companionTypeMap[key];
        if (cType) {
          companionWritePromises.push(
            writeCompanionData(
              params.svcClient,
              params.reflectionId,
              cType,
              result.value.data,
              {
                pauseInstanceId: params.pauseInstanceId ?? null,
                userId: params.userId,
              },
            ),
          );
        }
      }
    } else {
      response[key] = {
        data: null,
        source: "empty",
        cacheId: null,
        cacheRelaxation: null,
        latencyMs: Date.now() - params.t0,
        error: result.reason?.message || "Unknown error",
      };
      serveInserts.push({
        user_id: params.userId,
        reflection_id: (params.reflectionId as string) || null,
        companion_type: companionTypeMap[key],
        serve_source: "empty",
        cache_entry_id: null,
        cache_relaxation: null,
        content_title: null,
        content_fingerprint: null,
        latency_ms: Date.now() - params.t0,
      });
    }
  }

  return { response, serveInserts, companionWritePromises };
}

/** Queue intervention row, `companion_serves` batch, and fire `writeCompanionData` in the background. */
export function scheduleOrchestrateBackgroundWrites(params: {
  svcClient: any;
  selection: InterventionSelection | null;
  interventionPayload: InterventionPayload;
  response: OrchestrateResponse;
  serveInserts: any[];
  companionWritePromises: Promise<void>[];
  reflectionId: unknown;
  pauseInstanceId?: string | null;
  userId?: string | null;
  log: OrchestrateAssembleLog;
}): void {
  const writePromises = [...params.companionWritePromises];

  if (params.selection) {
    params.response.intervention = params.interventionPayload;
    if (typeof params.reflectionId === "string" && params.reflectionId.length > 0) {
      writePromises.push(
        writeCompanionData(
          params.svcClient,
          params.reflectionId,
          "intervention",
          params.interventionPayload as unknown as Record<string, unknown>,
          {
            pauseInstanceId: params.pauseInstanceId ?? null,
            userId: params.userId ?? null,
          },
        ),
      );
    }
  }

  if (params.serveInserts.length > 0) {
    writePromises.push(
      (async () => {
        const { error } = await params.svcClient.from("companion_serves").insert(params.serveInserts);
        if (error) params.log.error("serve insert error", { error: error.message });
      })(),
    );
  }

  if (writePromises.length > 0) {
    Promise.allSettled(writePromises).then((outcomes) => {
      for (const outcome of outcomes) {
        if (outcome.status === "rejected") {
          params.log.error("background write failed", { error: String(outcome.reason) });
        }
      }
    });
  }
}
