import { useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { CachedHistoricalInsightShape } from '@/features/pause/domain/historical-insight';
import type { ZoomOutData } from '@/features/pause/domain/zoom-out-display';
import type { CompanionSlotTransitionStarters } from './pause-companion-orchestrate-io';
import {
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  type CompanionSlotAutosaveParams,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from './pause-companion-orchestrate-io';

interface GroundingData {
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
  const [groundingPending, startGroundingTransition] = useTransition();
  const [zoomOutPending, startZoomOutTransition] = useTransition();
  const [historyPending, startHistoryTransition] = useTransition();

  const [cacheIds, setCacheIds] = useState<CompanionSlotCacheIds>({
    grounding: null,
    signal: null,
    zoomOut: null,
    history: null,
  });
  const [cacheRelaxations, setCacheRelaxations] = useState<CompanionSlotRelaxations>(
    EMPTY_COMPANION_SLOT_RELAXATIONS,
  );

  const [grounding, setGrounding] = useState<GroundingData | null>(null);
  const [groundingError, setGroundingError] = useState(false);

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
      grounding: startGroundingTransition,
      history: startHistoryTransition,
      zoomOut: startZoomOutTransition,
    }),
    [startSignalTransition, startGroundingTransition, startHistoryTransition, startZoomOutTransition],
  );

  const companionSlotErrorSetters = useMemo(
    () => ({
      setSignalError,
      setGroundingError,
      setHistoryError,
      setZoomOutError,
    }),
    [],
  );

  const slotCommitters = useMemo<CompanionSlotCommitters>(
    () => ({
      setSignal,
      setGrounding,
      setHistoryInsight,
      setZoomOut,
      autoSaveToLibrary,
    }),
    [autoSaveToLibrary],
  );

  useLayoutEffect(() => {
    setSignal(null);
    setSignalError(false);
    setGrounding(null);
    setGroundingError(false);
    setZoomOut(null);
    setZoomOutError(false);
    setHistoryInsight(null);
    setHistoryError(false);
    setCacheIds({ grounding: null, signal: null, zoomOut: null, history: null });
    setCacheRelaxations(EMPTY_COMPANION_SLOT_RELAXATIONS);
    fetchedSlotsRef.current = new Set();
  }, [pauseInstanceId]);

  return {
    cacheIds,
    setCacheIds,
    cacheRelaxations,
    setCacheRelaxations,
    grounding,
    groundingLoading: groundingPending,
    groundingError,
    signal,
    signalLoading: signalPending,
    signalError,
    zoomOut,
    zoomOutLoading: zoomOutPending,
    zoomOutError,
    historyInsight,
    historyLoading: historyPending,
    historyError,
    setGrounding,
    setGroundingError,
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
