import { generateSignal, PROMPT_VERSION as SIGNAL_VERSION } from "./generators/signal.ts";
import { generateGrounding, PROMPT_VERSION as GROUNDING_VERSION } from "./generators/grounding.ts";
import { generateHistory, PROMPT_VERSION as HISTORY_VERSION } from "./generators/history.ts";
import { generateZoomOut, PROMPT_VERSION as ZOOM_OUT_VERSION } from "./generators/zoom-out.ts";
import { fetchRecentSignalCitationUrls, mergeRecentSignalUrls } from "./recent-signal-urls.ts";
import type { CompanionResult, OrchestrateSourceInput } from "./companion-orchestrate-types.ts";
import type { SessionIntent } from "./session-intent.ts";

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
      return {
        data: result.data,
        source: result.source,
        cacheId: result.cacheId,
        latencyMs: Date.now() - t,
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
      return {
        data: result.data,
        source: result.source,
        cacheId: result.cacheId,
        latencyMs: Date.now() - t,
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
      return {
        data: result.data,
        source: result.source,
        cacheId: result.cacheId,
        latencyMs: Date.now() - t,
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
      return {
        data: result.data,
        source: result.source,
        cacheId: result.cacheId,
        latencyMs: Date.now() - t,
        promptVersion: SIGNAL_VERSION,
        error: result.error,
      };
    })();
  }

  return tasks;
}
