import { useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { CachedHistoricalInsightShape } from '@/features/pause/domain/historical-insight';
import type { ZoomOutData } from '@/features/pause/domain/zoom-out-display';
import type { CompanionSlotTransitionStarters } from '@/features/pause/application/use-cases/ritual/frame/companion-slot-ui-state';
import {
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  type CompanionSlotAutosaveParams,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from './pause-companion-orchestrate-io';

interface NudgeData {
  title: string;
  body: string;
  citation: string;
  url: string;
}

interface SignalData {
  title: string;
  body: string;
  source: string;
  url: string;
}

/** Per-slot companion card UI state (loading / error / payload) for a single pause instance. */
export function useCompanionSlotUiState(pauseInstanceId?: string | null) {
  const [signalPending, startSignalTransition] = useTransition();
  const [nudgePending, startNudgeTransition] = useTransition();
  const [zoomOutPending, startZoomOutTransition] = useTransition();
  const [historyPending, startHistoryTransition] = useTransition();

  const [cacheIds, setCacheIds] = useState<CompanionSlotCacheIds>({
    nudge: null,
    signal: null,
    zoomOut: null,
    history: null,
  });
  const [cacheRelaxations, setCacheRelaxations] = useState<CompanionSlotRelaxations>(
    EMPTY_COMPANION_SLOT_RELAXATIONS,
  );

  const [nudge, setNudge] = useState<NudgeData | null>(null);
  const [nudgeError, setNudgeError] = useState(false);

  const [signal, setSignal] = useState<SignalData | null>(null);
  const [signalError, setSignalError] = useState(false);

  const [zoomOut, setZoomOut] = useState<ZoomOutData | null>(null);
  const [zoomOutError, setZoomOutError] = useState(false);

  const [historyInsight, setHistoryInsight] = useState<CachedHistoricalInsightShape | null>(null);
  const [historyError, setHistoryError] = useState(false);

  const fetchedSlotsRef = useRef<Set<string>>(new Set());

  const autoSaveToLibrary = useMemo(
    () => async (_params: CompanionSlotAutosaveParams) => {},
    [],
  );

  const companionSlotTransitionStarters = useMemo<CompanionSlotTransitionStarters>(
    () => ({
      signal: startSignalTransition,
      grounding: startNudgeTransition,
      history: startHistoryTransition,
      zoomOut: startZoomOutTransition,
    }),
    [startSignalTransition, startNudgeTransition, startHistoryTransition, startZoomOutTransition],
  );

  const companionSlotErrorSetters = useMemo(
    () => ({
      setSignalError,
      setNudgeError,
      setHistoryError,
      setZoomOutError,
    }),
    [],
  );

  const slotCommitters = useMemo<CompanionSlotCommitters>(
    () => ({
      setSignal,
      setNudge,
      setHistoryInsight,
      setZoomOut,
      autoSaveToLibrary,
    }),
    [autoSaveToLibrary],
  );

  useLayoutEffect(() => {
    setSignal(null);
    setSignalError(false);
    setNudge(null);
    setNudgeError(false);
    setZoomOut(null);
    setZoomOutError(false);
    setHistoryInsight(null);
    setHistoryError(false);
    setCacheIds({ nudge: null, signal: null, zoomOut: null, history: null });
    setCacheRelaxations(EMPTY_COMPANION_SLOT_RELAXATIONS);
    fetchedSlotsRef.current = new Set();
  }, [pauseInstanceId]);

  return {
    cacheIds,
    setCacheIds,
    cacheRelaxations,
    setCacheRelaxations,
    nudge,
    nudgeLoading: nudgePending,
    nudgeError,
    signal,
    signalLoading: signalPending,
    signalError,
    zoomOut,
    zoomOutLoading: zoomOutPending,
    zoomOutError,
    historyInsight,
    historyLoading: historyPending,
    historyError,
    setNudge,
    setNudgeError,
    setSignal,
    setSignalError,
    setZoomOut,
    setZoomOutError,
    setHistoryInsight,
    setHistoryError,
    fetchedSlotsRef,
    autoSaveToLibrary,
    companionSlotTransitionStarters,
    companionSlotErrorSetters,
    slotCommitters,
  };
}
