import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { nextExpandedWithLazyFetch } from './pause-companion-orchestration-io';
import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';

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
  exclusiveExpand = false,
}: UseCompanionSectionExpansionParams) {
  const [expandedHaiku, setExpandedHaiku] = useState(false);
  const [expandedLearning, setExpandedLearning] = useState(false);
  const [expandedSignal, setExpandedSignal] = useState(false);
  const [expandedZoomOut, setExpandedZoomOut] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(false);

  const collapseExcept = useCallback(
    (keep: CompanionSectionExpandSlot | null) => {
      if (keep !== 'haiku') setExpandedHaiku(false);
      if (keep !== 'grounding') setExpandedLearning(false);
      if (keep !== 'signal') setExpandedSignal(false);
      if (keep !== 'zoomOut') setExpandedZoomOut(false);
      if (keep !== 'history') setExpandedHistory(false);
    },
    [],
  );

  const makeLazyToggle = useCallback(
    (
      setExpanded: Dispatch<SetStateAction<boolean>>,
      slot: RegenerateCompanionSlot,
      expandKey: CompanionSectionExpandSlot,
      data: unknown,
      loading: boolean,
      error: unknown,
    ) =>
      () => {
        setExpanded((current) => {
          if (current) return false;
          if (exclusiveExpand) collapseExcept(expandKey);
          return nextExpandedWithLazyFetch(false, {
            data,
            loading,
            error,
            canAccess: canAccessCompanion,
            fetch: fetchCompanion,
            slot,
          });
        });
      },
    [canAccessCompanion, collapseExcept, exclusiveExpand, fetchCompanion],
  );

  const toggleHaiku = useCallback(() => {
    setExpandedHaiku((current) => {
      if (current) return false;
      if (exclusiveExpand) collapseExcept('haiku');
      return true;
    });
  }, [collapseExcept, exclusiveExpand]);

  const toggleSignal = makeLazyToggle(
    setExpandedSignal,
    'signal',
    'signal',
    signal,
    signalLoading,
    signalError,
  );
  const toggleGrounding = makeLazyToggle(
    setExpandedLearning,
    'grounding',
    'grounding',
    nudge,
    nudgeLoading,
    nudgeError,
  );
  const toggleZoomOut = makeLazyToggle(
    setExpandedZoomOut,
    'zoomOut',
    'zoomOut',
    zoomOut,
    zoomOutLoading,
    zoomOutError,
  );
  const toggleHistory = makeLazyToggle(
    setExpandedHistory,
    'history',
    'history',
    historyInsight,
    historyLoading,
    historyError,
  );

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
