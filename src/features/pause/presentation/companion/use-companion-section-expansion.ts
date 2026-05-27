import { useCallback, useState } from 'react';
import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';

type LazyToggleArgs = {
  slot: RegenerateCompanionSlot;
  data: unknown;
  loading: boolean;
  error: unknown;
  /** Reflect-step or other inline copy already on screen — expand only, no quota fetch. */
  hasStoredContent?: boolean;
};

export type CompanionSectionExpandSlot = 'haiku' | 'signal' | 'grounding' | 'zoomOut' | 'history';

export type UseCompanionSectionExpansionParams = {
  signal: unknown;
  signalLoading: boolean;
  signalError: unknown;
  nudge: unknown;
  nudgeLoading: boolean;
  nudgeError: unknown;
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
  /** Grounding copy from reflect artifacts (not lazy `nudge` state). */
  groundingTitle?: string | null;
  groundingBody?: string | null;
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
  if (args.hasStoredContent || args.data || args.loading || args.error) return true;
  return canAccess();
}

function needsLazyFetch(args: LazyToggleArgs): boolean {
  if (args.hasStoredContent) return false;
  return !args.data && !args.loading && !args.error;
}

function hasReflectGroundingContent(title?: string | null, body?: string | null): boolean {
  return Boolean(title?.trim() || body?.trim());
}

/** Expand/collapse state for inline `CompanionSection` cards (lazy fetch on first open). */
export function useCompanionSectionExpansion({
  signal,
  signalLoading,
  signalError,
  nudge,
  nudgeLoading,
  nudgeError,
  zoomOut,
  zoomOutLoading,
  zoomOutError,
  historyInsight,
  historyLoading,
  historyError,
  fetchCompanion,
  canAccessCompanion,
  exclusiveExpand = false,
  groundingTitle = null,
  groundingBody = null,
}: UseCompanionSectionExpansionParams) {
  const groundingStoredContent = hasReflectGroundingContent(groundingTitle, groundingBody);
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
        data: nudge,
        loading: nudgeLoading,
        error: nudgeError,
        hasStoredContent: groundingStoredContent,
      }),
    [toggleSlot, nudge, nudgeLoading, nudgeError, groundingStoredContent],
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
