import { trackCompanionServed } from '@/features/pause/application/use-cases/ritual/frame/companion-generation-telemetry';
import type { ParsedPauseArtifactCache } from '@/features/pause/application/use-cases/ritual/frame/artifact-cache-parse';
import type { CompanionSlotCommitters } from '@/features/pause/application/use-cases/ritual/frame/orchestrate-slot-apply';
import {
  hasDisplayableGroundingContent,
  hasDisplayableHistoryContent,
  hasDisplayableSignalContent,
  hasDisplayableZoomOutContent,
} from '@/features/pause/domain/companion-slot-display-content';
import { resolveHistoricalMarketInsight } from '@/features/pause/domain/historical-insight';
import {
  toZoomOutDisplayData,
  zoomOutLibraryAutosaveFromDisplayData,
} from '@/features/pause/application/use-cases/ritual/frame/zoom-out-payload';

export interface HydrateCompanionSlotsFromArtifactCacheInput {
  cached: ParsedPauseArtifactCache;
  fetchedSlots: Set<string>;
  committers: CompanionSlotCommitters;
  /** Legacy featured intervention only — not used in pause-first Frame UI. */
  setIntervention?: (value: Record<string, unknown>) => void;
}

export interface HydrateCompanionSlotsFromArtifactCacheResult {
  /** When true, caller should skip a live intervention orchestrate invoke. */
  hasCachedIntervention: boolean;
}

/** Applies persisted `pause_ai_artifacts` rows into companion slot UI state. */
export function hydrateCompanionSlotsFromArtifactCache(
  input: HydrateCompanionSlotsFromArtifactCacheInput,
): HydrateCompanionSlotsFromArtifactCacheResult {
  const { cached, fetchedSlots, committers, setIntervention } = input;
  const { setSignal, setGrounding, setHistoryInsight, setZoomOut, autoSaveToLibrary } = committers;

  if (cached.signal && hasDisplayableSignalContent(cached.signal)) {
    setSignal(cached.signal);
    fetchedSlots.add('signal');
    trackCompanionServed('signal', 'cache');
    void autoSaveToLibrary({
      title: cached.signal.title,
      body: cached.signal.body,
      sourceType: 'signal',
      sourceUrl: cached.signal.url,
    });
  }
  if (cached.grounding && hasDisplayableGroundingContent(cached.grounding)) {
    setGrounding(cached.grounding);
    fetchedSlots.add('grounding');
    trackCompanionServed('grounding', 'cache');
    void autoSaveToLibrary({
      title: cached.grounding.title,
      body: cached.grounding.body,
      sourceType: 'grounding',
      sourceUrl: cached.grounding.url,
    });
  }
  if (cached.history && hasDisplayableHistoryContent(cached.history)) {
    setHistoryInsight(cached.history);
    fetchedSlots.add('history');
    trackCompanionServed('history', 'cache');
    void autoSaveToLibrary({
      title: cached.history.title,
      body: resolveHistoricalMarketInsight(cached.history),
      sourceType: 'history_insight',
    });
  }
  if (cached.zoomOut) {
    const display = toZoomOutDisplayData(cached.zoomOut);
    if (hasDisplayableZoomOutContent(display)) {
      setZoomOut(display);
      fetchedSlots.add('zoomOut');
      trackCompanionServed('zoomOut', 'cache');
      const { title, body } = zoomOutLibraryAutosaveFromDisplayData(display);
      void autoSaveToLibrary({ title, body, sourceType: 'zoom_out' });
    }
  }
  if (cached.intervention && setIntervention) {
    setIntervention(cached.intervention);
    return { hasCachedIntervention: true };
  }
  return { hasCachedIntervention: false };
}
