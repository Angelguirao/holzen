import type { InterventionState } from '@/features/pause/domain/companion-orchestrate';
import { trackCompanionServed } from '@/features/pause/application/use-cases/companion/companion-generation-telemetry';
import type { ParsedPauseArtifactCache } from '@/features/pause/application/use-cases/ritual/frame/artifact-cache-parse';
import type { CompanionSlotCommitters } from '@/features/pause/application/use-cases/companion/orchestrate-slot-apply';
import {
  toZoomOutDisplayData,
  zoomOutLibraryAutosaveFromDisplayData,
} from '@/features/pause/application/use-cases/ritual/frame/zoom-out-payload';

export interface HydrateCompanionSlotsFromArtifactCacheInput {
  cached: ParsedPauseArtifactCache;
  fetchedSlots: Set<string>;
  committers: CompanionSlotCommitters;
  setIntervention?: (value: InterventionState) => void;
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
  const { setSignal, setNudge, setHistoryInsight, setZoomOut, autoSaveToLibrary } = committers;

  if (cached.signal) {
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
  if (cached.grounding) {
    setNudge(cached.grounding);
    fetchedSlots.add('grounding');
    trackCompanionServed('grounding', 'cache');
    void autoSaveToLibrary({
      title: cached.grounding.title,
      body: cached.grounding.body,
      sourceType: 'grounding',
      sourceUrl: cached.grounding.url,
    });
  }
  if (cached.history) {
    setHistoryInsight(cached.history);
    fetchedSlots.add('history');
    trackCompanionServed('history', 'cache');
    void autoSaveToLibrary({
      title: cached.history.title,
      body: cached.history.btcInsight,
      sourceType: 'history_insight',
    });
  }
  if (cached.zoomOut) {
    const display = toZoomOutDisplayData(cached.zoomOut);
    setZoomOut(display);
    fetchedSlots.add('zoomOut');
    trackCompanionServed('zoomOut', 'cache');
    const { title, body } = zoomOutLibraryAutosaveFromDisplayData(display);
    void autoSaveToLibrary({ title, body, sourceType: 'zoom_out' });
  }
  if (cached.intervention && setIntervention) {
    setIntervention(cached.intervention);
    return { hasCachedIntervention: true };
  }
  return { hasCachedIntervention: false };
}
