import { useCallback, useState } from 'react';
import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import { companionSlotHasDisplayableContent } from '@/features/pause/domain/companion-slot-display-content';

type LazyToggleArgs = {
  slot: RegenerateCompanionSlot;
  data: unknown;
  loading: boolean;
  error: unknown;
};

export type CompanionSectionExpandSlot = 'haiku' | 'signal' | 'grounding' | 'zoomOut' | 'history';

export type UseCompanionSectionExpansionParams = {
  signal: unknown;
  signalLoading: boolean;
  signalError: unknown;
  grounding: unknown;
  groundingLoading: boolean;
  groundingError: unknown;
  zoomOut: unknown;
  zoomOutLoading: boolean;
  zoomOutError: unknown;
  historyInsight: unknown;
  historyLoading: boolean;
  historyError: unknown;
  fetchCompanion: (slot: RegenerateCompanionSlot) => void | Promise<void>;
  canAccessCompanion: () => boolean;
  /** When true, opening one card collapses all others (Frame / Figma wireframe). */
  exclusiveExpand?: boolean;
};

type ExpansionMap = Record<CompanionSectionExpandSlot, boolean>;

const CLOSED: ExpansionMap = {
  haiku: false,
  grounding: false,
  signal: false,
  zoomOut: false,
  history: false,
};

function openExclusive(slot: CompanionSectionExpandSlot): ExpansionMap {
  return { ...CLOSED, [slot]: true };
}

/** True when the user may expand (has payload, in-flight, error, or Pro access to fetch). */
function canOpenLazySlot(args: LazyToggleArgs, canAccess: () => boolean): boolean {
  if (args.loading || args.error) return true;
  if (companionSlotHasDisplayableContent(args.slot, args.data)) return true;
  return canAccess();
}

function needsLazyFetch(args: LazyToggleArgs): boolean {
  if (args.error) return true;
  if (companionSlotHasDisplayableContent(args.slot, args.data)) return false;
  // Do not skip while `loading` — exclusive Frame expand can reopen a slot whose
  // transition is still pending; fetchCompanion coalesces in-flight work.
  return true;
}

/** Expand/collapse state for inline `CompanionSection` cards (lazy fetch on first open). */
export function useCompanionSectionExpansion({
  signal,
  signalLoading,
  signalError,
  grounding,
  groundingLoading,
  groundingError,
  zoomOut,
  zoomOutLoading,
  zoomOutError,
  historyInsight,
  historyLoading,
  historyError,
  fetchCompanion,
  canAccessCompanion,
  exclusiveExpand = false,
}: UseCompanionSectionExpansionParams) {
  const [expansion, setExpansion] = useState<ExpansionMap>(CLOSED);

  const toggleSlot = useCallback(
    (slot: CompanionSectionExpandSlot, lazy?: LazyToggleArgs) => {
      let fetchSlot: RegenerateCompanionSlot | null = null;

      setExpansion((prev) => {
        if (prev[slot]) {
          return { ...prev, [slot]: false };
        }

        if (lazy) {
          if (!canOpenLazySlot(lazy, canAccessCompanion)) {
            return prev;
          }
          if (needsLazyFetch(lazy)) {
            fetchSlot = lazy.slot;
          }
        }

        if (exclusiveExpand) {
          return openExclusive(slot);
        }
        return { ...prev, [slot]: true };
      });

      if (fetchSlot) {
        void fetchCompanion(fetchSlot);
      }
    },
    [canAccessCompanion, exclusiveExpand, fetchCompanion],
  );

  const toggleHaiku = useCallback(() => toggleSlot('haiku'), [toggleSlot]);

  const toggleSignal = useCallback(
    () =>
      toggleSlot('signal', {
        slot: 'signal',
        data: signal,
        loading: signalLoading,
        error: signalError,
      }),
    [toggleSlot, signal, signalLoading, signalError],
  );

  const toggleGrounding = useCallback(
    () =>
      toggleSlot('grounding', {
        slot: 'grounding',
        data: grounding,
        loading: groundingLoading,
        error: groundingError,
      }),
    [toggleSlot, grounding, groundingLoading, groundingError],
  );

  const toggleZoomOut = useCallback(
    () =>
      toggleSlot('zoomOut', {
        slot: 'zoomOut',
        data: zoomOut,
        loading: zoomOutLoading,
        error: zoomOutError,
      }),
    [toggleSlot, zoomOut, zoomOutLoading, zoomOutError],
  );

  const toggleHistory = useCallback(
    () =>
      toggleSlot('history', {
        slot: 'history',
        data: historyInsight,
        loading: historyLoading,
        error: historyError,
      }),
    [toggleSlot, historyInsight, historyLoading, historyError],
  );

  return {
    expandedHaiku: expansion.haiku,
    expandedLearning: expansion.grounding,
    expandedSignal: expansion.signal,
    expandedZoomOut: expansion.zoomOut,
    expandedHistory: expansion.history,
    toggleHaiku,
    toggleSignal,
    toggleGrounding,
    toggleZoomOut,
    toggleHistory,
  };
}
