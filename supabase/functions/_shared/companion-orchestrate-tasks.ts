import { generateSignal, PROMPT_VERSION as SIGNAL_VERSION } from "./generators/signal.ts";
import { generateGrounding, PROMPT_VERSION as GROUNDING_VERSION } from "./generators/grounding.ts";
import { generateHistory, PROMPT_VERSION as HISTORY_VERSION } from "./generators/history.ts";
import { generateZoomOut, PROMPT_VERSION as ZOOM_OUT_VERSION } from "./generators/zoom-out.ts";
import { fetchRecentSignalCitationUrls, mergeRecentSignalUrls } from "./recent-signal-urls.ts";
import { logCompanionSlotResolved } from "./companion-orchestrate-slot-telemetry.ts";
import type { CompanionResult, OrchestrateSourceInput } from "./companion-orchestrate-types.ts";
import type { SessionIntent } from "./session-intent.ts";
import { ORCHESTRATOR_KEY_MAP } from "./companion-types.ts";

export type OrchestrateTasksLog = {
  (msg: string, extra?: Record<string, unknown>): void;
  error: (msg: string, extra?: Record<string, unknown>) => void;
};

export interface BuildOrchestrateCompanionTasksParams {
  svcClient: any;
  log: OrchestrateTasksLog;
  userId: string;
  body: Record<string, unknown>;
  reflectionId: unknown;
  contextValue?: string;
  languageValue: string;
  reflectionMessageValue?: string;
  moodValue?: string;
  intent: SessionIntent;
  shouldRunGrounding: boolean;
  shouldRunHistory: boolean;
  shouldRunZoomOut: boolean;
  enableSignal: boolean;
  effectiveGroundingSources: OrchestrateSourceInput[] | undefined;
  signalSourcesValue: OrchestrateSourceInput[] | undefined;
  recentSignalSourcesValue: string[] | undefined;
  recentSignalTitlesValue: string[] | undefined;
  recentNudgeTopicsValue: string[] | undefined;
  recentGroundingSourcesValue: string[] | undefined;
  recentHistoryTitlesValue: string[] | undefined;
  recentZoomOutTitlesValue: string[] | undefined;
}

/** Build parallel generator promises (grounding / history / zoomOut / signal) from orchestrate inputs. */
export function buildOrchestrateCompanionTasks(
  p: BuildOrchestrateCompanionTasksParams,
): Record<string, Promise<CompanionResult>> {
  const tasks: Record<string, Promise<CompanionResult>> = {};
  const rid = typeof p.reflectionId === "string" ? p.reflectionId : null;

  if (p.shouldRunGrounding) {
    tasks.grounding = (async (): Promise<CompanionResult> => {
      const t = Date.now();
      const result = await generateGrounding({
        svcClient: p.svcClient,
        context: p.contextValue,
        language: p.languageValue,
        recentTopics: p.recentNudgeTopicsValue,
        sources: p.effectiveGroundingSources,
        recentGroundingSources: p.recentGroundingSourcesValue,
        recentGroundingTitles: p.recentNudgeTopicsValue,
        userId: p.userId,
        reflectionId: rid,
        log: p.log,
        preferredBias: p.intent.groundingBias,
      });
      const latencyMs = Date.now() - t;
      logCompanionSlotResolved({
        companion_type: ORCHESTRATOR_KEY_MAP.grounding,
        orchestrator_slot: "grounding",
        reflection_prefix: rid ? rid.slice(0, 8) : null,
        source: result.source,
        cache_relaxation: result.cacheRelaxation ?? null,
        latency_ms: latencyMs,
        filled: Boolean(result.data),
        error: result.error ?? null,
      });
      return {
        data: result.data,
        source: result.source,
        cacheId: result.cacheId,
        cacheRelaxation: result.cacheRelaxation ?? null,
        latencyMs,
        promptVersion: GROUNDING_VERSION,
        error: result.error,
      };
    })();
  }

  if (p.shouldRunHistory) {
    tasks.history = (async (): Promise<CompanionResult> => {
      const t = Date.now();
      const result = await generateHistory({
        svcClient: p.svcClient,
        context: p.contextValue,
        language: p.languageValue,
        mood: p.moodValue,
        recentTitles: p.recentHistoryTitlesValue,
        userId: p.userId,
        log: p.log,
        preferredMood: p.intent.historyMood,
      });
      const latencyMs = Date.now() - t;
      logCompanionSlotResolved({
        companion_type: ORCHESTRATOR_KEY_MAP.history,
        orchestrator_slot: "history",
        reflection_prefix: rid ? rid.slice(0, 8) : null,
        source: result.source,
        cache_relaxation: result.cacheRelaxation ?? null,
        latency_ms: latencyMs,
        filled: Boolean(result.data),
        error: result.error ?? null,
      });
      return {
        data: result.data,
        source: result.source,
        cacheId: result.cacheId,
        cacheRelaxation: result.cacheRelaxation ?? null,
        latencyMs,
        promptVersion: HISTORY_VERSION,
        error: result.error,
      };
    })();
  }

  if (p.shouldRunZoomOut) {
    tasks.zoomOut = (async (): Promise<CompanionResult> => {
      const t = Date.now();
      const result = await generateZoomOut({
        svcClient: p.svcClient,
        context: p.contextValue,
        language: p.languageValue,
        reflectionMessage: p.reflectionMessageValue,
        mood: p.moodValue,
        userId: p.userId,
        recentTitles: p.recentZoomOutTitlesValue,
        log: p.log,
        zoomOutAngle: p.intent.zoomOutAngle,
      });
      const latencyMs = Date.now() - t;
      logCompanionSlotResolved({
        companion_type: ORCHESTRATOR_KEY_MAP.zoomOut,
        orchestrator_slot: "zoomOut",
        reflection_prefix: rid ? rid.slice(0, 8) : null,
        source: result.source,
        cache_relaxation: result.cacheRelaxation ?? null,
        latency_ms: latencyMs,
        filled: Boolean(result.data),
        error: result.error ?? null,
      });
      return {
        data: result.data,
        source: result.source,
        cacheId: result.cacheId,
        cacheRelaxation: result.cacheRelaxation ?? null,
        latencyMs,
        promptVersion: ZOOM_OUT_VERSION,
        error: result.error,
      };
    })();
  }

  if (p.enableSignal) {
    tasks.signal = (async (): Promise<CompanionResult> => {
      const t = Date.now();
      const recentSignalUrls = p.body.recentSignalUrls;
      const clientSignalUrls = Array.isArray(recentSignalUrls)
        ? (recentSignalUrls as string[]).filter((u) => typeof u === "string" && u.length > 0)
        : [];
      let mergedRecentSignalUrls: string[] | undefined;
      if (p.userId) {
        try {
          const fromDb = await fetchRecentSignalCitationUrls(p.svcClient, p.userId, {
            excludeReflectionId: typeof p.reflectionId === "string" ? p.reflectionId : undefined,
            limit: 24,
          });
          mergedRecentSignalUrls = mergeRecentSignalUrls(fromDb, clientSignalUrls, 24);
          p.log(
            `signal recent URLs: db=${fromDb.length} client=${clientSignalUrls.length} merged=${mergedRecentSignalUrls?.length ?? 0}`,
          );
        } catch (e) {
          p.log(`fetchRecentSignalCitationUrls failed: ${e}`);
          mergedRecentSignalUrls = clientSignalUrls.length > 0 ? clientSignalUrls.slice(0, 24) : undefined;
        }
      } else {
        mergedRecentSignalUrls = clientSignalUrls.length > 0 ? clientSignalUrls.slice(0, 24) : undefined;
      }
      const result = await generateSignal({
        svcClient: p.svcClient,
        context: p.contextValue,
        language: p.languageValue,
        sources: p.signalSourcesValue,
        recentSignalSources: p.recentSignalSourcesValue,
        recentSignalTitles: p.recentSignalTitlesValue,
        recentSignalUrls: mergedRecentSignalUrls,
        userId: p.userId,
        reflectionId: rid,
        log: p.log,
        searchAngle: p.intent.signalAngle,
      });
      const latencyMs = Date.now() - t;
      logCompanionSlotResolved({
        companion_type: ORCHESTRATOR_KEY_MAP.signal,
        orchestrator_slot: "signal",
        reflection_prefix: rid ? rid.slice(0, 8) : null,
        source: result.source,
        cache_relaxation: result.cacheRelaxation ?? null,
        latency_ms: latencyMs,
        filled: Boolean(result.data),
        error: result.error ?? null,
      });
      return {
        data: result.data,
        source: result.source,
        cacheId: result.cacheId,
        cacheRelaxation: result.cacheRelaxation ?? null,
        latencyMs,
        promptVersion: SIGNAL_VERSION,
        error: result.error,
      };
    })();
  }

  return tasks;
}
