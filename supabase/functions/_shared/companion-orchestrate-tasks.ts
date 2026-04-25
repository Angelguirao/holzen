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
  pauseInstanceId: string | null;
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
  /**
   * Circuit-breaker hints from companion-orchestrate. When true, the matching
   * tasks skip their live phase only — library/cache still serve. Perplexity-
   * degraded affects signal/grounding/history (Sonar Pro search). Lovable-
   * degraded affects all four (structuring + deep-time).
   */
  skipLivePerplexity?: boolean;
  skipLiveLovable?: boolean;
}

/** Build parallel generator promises (grounding / history / zoomOut / signal) from orchestrate inputs. */
export function buildOrchestrateCompanionTasks(
  p: BuildOrchestrateCompanionTasksParams,
): Record<string, Promise<CompanionResult>> {
  const tasks: Record<string, Promise<CompanionResult>> = {};
  const pid = p.pauseInstanceId;

  // Perplexity-backed generators: signal, grounding, history. Lovable-backed:
  // all four (structuring step on signal/grounding/history + zoom-out deep-time).
  // If either breaker trips, skip the live phase for affected tasks; cache +
  // library + curated fallback still run.
  const skipLiveSignal = Boolean(p.skipLivePerplexity || p.skipLiveLovable);
  const skipLiveGrounding = Boolean(p.skipLivePerplexity || p.skipLiveLovable);
  const skipLiveHistory = Boolean(p.skipLivePerplexity || p.skipLiveLovable);
  const skipLiveZoomOut = Boolean(p.skipLiveLovable);

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
        pauseInstanceId: pid,
        log: p.log,
        preferredBias: p.intent.groundingBias,
        skipLive: skipLiveGrounding,
      });
      const latencyMs = Date.now() - t;
      logCompanionSlotResolved(p.log, {
        companion_type: ORCHESTRATOR_KEY_MAP.grounding,
        orchestrator_slot: "grounding",
        pause_prefix: pid ? pid.slice(0, 8) : null,
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
        skipLive: skipLiveHistory,
      });
      const latencyMs = Date.now() - t;
      logCompanionSlotResolved(p.log, {
        companion_type: ORCHESTRATOR_KEY_MAP.history,
        orchestrator_slot: "history",
        pause_prefix: pid ? pid.slice(0, 8) : null,
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
        skipLive: skipLiveZoomOut,
      });
      const latencyMs = Date.now() - t;
      logCompanionSlotResolved(p.log, {
        companion_type: ORCHESTRATOR_KEY_MAP.zoomOut,
        orchestrator_slot: "zoomOut",
        pause_prefix: pid ? pid.slice(0, 8) : null,
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
            excludePauseInstanceId: typeof p.pauseInstanceId === "string" ? p.pauseInstanceId : undefined,
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
        pauseInstanceId: pid,
        log: p.log,
        searchAngle: p.intent.signalAngle,
        skipLive: skipLiveSignal,
      });
      const latencyMs = Date.now() - t;
      logCompanionSlotResolved(p.log, {
        companion_type: ORCHESTRATOR_KEY_MAP.signal,
        orchestrator_slot: "signal",
        pause_prefix: pid ? pid.slice(0, 8) : null,
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
