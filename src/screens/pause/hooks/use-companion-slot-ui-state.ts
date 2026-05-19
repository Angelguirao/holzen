import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ZoomOutData } from '@/screens/pause/components/ZoomOutDisplay';
import type { CachedHistoricalInsightShape } from '@/screens/pause/components/HistoricalInsightDisplay';
import {
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  type CompanionSlotAutosaveParams,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from '@/features/pause/public';

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
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [nudgeError, setNudgeError] = useState(false);

  const [signal, setSignal] = useState<SignalData | null>(null);
  const [signalLoading, setSignalLoading] = useState(false);
  const [signalError, setSignalError] = useState(false);

  const [zoomOut, setZoomOut] = useState<ZoomOutData | null>(null);
  const [zoomOutLoading, setZoomOutLoading] = useState(false);
  const [zoomOutError, setZoomOutError] = useState(false);

  const [historyInsight, setHistoryInsight] = useState<CachedHistoricalInsightShape | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  const fetchedSlotsRef = useRef<Set<string>>(new Set());

  const autoSaveToLibrary = useMemo(
    () => async (_params: CompanionSlotAutosaveParams) => {},
    [],
  );

  const companionSlotLoadingSetters = useMemo(
    () => ({
      setSignalLoading,
      setNudgeLoading,
      setHistoryLoading,
      setZoomOutLoading,
    }),
    [],
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
    setSignalLoading(false);
    setSignalError(false);
    setNudge(null);
    setNudgeLoading(false);
    setNudgeError(false);
    setZoomOut(null);
    setZoomOutLoading(false);
    setZoomOutError(false);
    setHistoryInsight(null);
    setHistoryLoading(false);
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
    nudgeLoading,
    nudgeError,
    signal,
    signalLoading,
    signalError,
    zoomOut,
    zoomOutLoading,
    zoomOutError,
    historyInsight,
    historyLoading,
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
    companionSlotLoadingSetters,
    companionSlotErrorSetters,
    slotCommitters,
  };
}
