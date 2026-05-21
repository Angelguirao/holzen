import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { RegenerateCompanionSlot } from '@/features/pause/domain/companion-orchestrate';
import type { PauseSeverity } from '@/features/pause/application/use-cases/session/location-state';
import { DEFAULT_COMPANIONS, DEFAULT_PREFS } from '@/features/pause/domain/session-model';
import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  isCompanionFullViewSlotSettled,
  pauseSeverityToOrchestrateNumber,
} from '@/features/pause/application/use-cases/ritual/frame/full-view-page-helpers';
import { useCompanionData } from './use-companion-data';
import { useFullviewTelemetry, type FullviewCompanion } from '../use-fullview-telemetry';
import { usePauseSessionCompanionSnapshot } from './use-pause-session-companion-snapshot';
import { useStaggeredReveal } from '../use-staggered-reveal';

export type UseCompanionFullViewPageParams = {
  routeInstanceId: string | undefined;
  slot: RegenerateCompanionSlot;
  companionPrefs: CompanionPrefs | undefined;
  severity: PauseSeverity;
};

const SLOT_TO_TELEMETRY: Record<RegenerateCompanionSlot, FullviewCompanion> = {
  signal: 'signal',
  grounding: 'grounding',
  history: 'history',
  zoomOut: 'zoomOut',
};

/**
 * Shared conductor for companion full-view routes (`/companion/.../:pauseInstanceId`):
 * snapshot query, orchestration auto-fetch, telemetry, archive-aware back navigation.
 */
export function useCompanionFullViewPage({
  routeInstanceId,
  slot,
  companionPrefs,
  severity,
}: UseCompanionFullViewPageParams) {
  const navigate = useNavigate();
  const location = useLocation();

  const { snapshot, isPending: snapshotPending, loadError } =
    usePauseSessionCompanionSnapshot(routeInstanceId);

  const pauseInstanceId = snapshot?.id ?? null;
  const reflectionMessage = snapshot?.reflectionMessage ?? '';
  const context = snapshot?.context ?? null;
  const mood = snapshot?.mood ?? null;
  const companions = snapshot?.companions ?? DEFAULT_COMPANIONS;
  const prefs = companionPrefs ?? DEFAULT_PREFS;
  const severityNumber = pauseSeverityToOrchestrateNumber(severity);

  const companion = useCompanionData({
    companions,
    prefs: companionPrefsForFullViewSlot(prefs, slot),
    pauseInstanceId,
    context,
    reflectionMessage,
    mood,
    severityNumber,
  });

  const {
    interventionLoading,
    fetchCompanion,
    signal,
    signalLoading,
    signalError,
    nudge,
    nudgeLoading,
    nudgeError,
    historyInsight,
    historyLoading,
    historyError,
    zoomOut,
    zoomOutLoading,
    zoomOutError,
  } = companion;

  useEffect(() => {
    if (!pauseInstanceId || !reflectionMessage) return;
    if (interventionLoading) return;
    if (
      isCompanionFullViewSlotSettled(slot, {
        signal,
        signalLoading,
        signalError,
        nudge,
        nudgeLoading,
        nudgeError,
        historyInsight,
        historyLoading,
        historyError,
        zoomOut,
        zoomOutLoading,
        zoomOutError,
      })
    ) {
      return;
    }
    void fetchCompanion(slot);
  }, [
    pauseInstanceId,
    reflectionMessage,
    interventionLoading,
    slot,
    signal,
    signalLoading,
    signalError,
    nudge,
    nudgeLoading,
    nudgeError,
    historyInsight,
    historyLoading,
    historyError,
    zoomOut,
    zoomOutLoading,
    zoomOutError,
    fetchCompanion,
  ]);

  const revealed = useStaggeredReveal(COMPANION_FULL_VIEW_BREATHING_ROOM_MS);
  useFullviewTelemetry(SLOT_TO_TELEMETRY[slot], pauseInstanceId);

  const handleBack = useCallback(() => {
    const st = location.state as { from?: string } | undefined;
    if (st?.from === 'archive') navigate('/archive');
    else navigate(-1);
  }, [location.state, navigate]);

  return {
    missingRouteId: !routeInstanceId,
    loadError,
    snapshotPending,
    snapshot,
    pauseInstanceId,
    reflectionMessage,
    context,
    mood,
    revealed,
    handleBack,
    companion,
  };
}
