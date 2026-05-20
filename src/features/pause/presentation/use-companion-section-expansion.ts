import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { nextExpandedWithLazyFetch } from '@/features/pause/application/use-cases/ritual/frame/next-expanded-with-lazy-fetch';
import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';

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
};

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
}: UseCompanionSectionExpansionParams) {
  const [expandedHaiku, setExpandedHaiku] = useState(false);
  const [expandedLearning, setExpandedLearning] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState(false);
  const [expandedZoomOut, setExpandedZoomOut] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(false);

  const makeLazyToggle = useCallback(
    (
      setExpanded: Dispatch<SetStateAction<boolean>>,
      slot: RegenerateCompanionSlot,
      data: unknown,
      loading: boolean,
      error: unknown,
    ) =>
      () => {
        setExpanded((current) =>
          nextExpandedWithLazyFetch(current, {
            data,
            loading,
            error,
            canAccess: canAccessCompanion,
            fetch: fetchCompanion,
            slot,
          }),
        );
      },
    [canAccessCompanion, fetchCompanion],
  );

  const toggleHaiku = useCallback(() => setExpandedHaiku((v) => !v), []);
  const toggleSignal = makeLazyToggle(setExpandedSignal, 'signal', signal, signalLoading, signalError);
  const toggleGrounding = makeLazyToggle(setExpandedLearning, 'grounding', nudge, nudgeLoading, nudgeError);
  const toggleZoomOut = makeLazyToggle(setExpandedZoomOut, 'zoomOut', zoomOut, zoomOutLoading, zoomOutError);
  const toggleHistory = makeLazyToggle(setExpandedHistory, 'history', historyInsight, historyLoading, historyError);

  return {
    expandedHaiku,
    expandedLearning,
    expandedSignal,
    expandedZoomOut,
    expandedHistory,
    toggleHaiku,
    toggleSignal,
    toggleGrounding,
    toggleZoomOut,
    toggleHistory,
  };
}
