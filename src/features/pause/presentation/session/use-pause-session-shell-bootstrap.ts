import { useLocation, type NavigateFunction } from 'react-router-dom';
import type { TFunction } from 'i18next';
import { buildPauseSessionMountLogParams } from '@/features/pause/application/use-cases/session/mount-log-params';
import {
  isPauseSessionWaitingForInstanceFetch,
} from '@/features/pause/application/use-cases/session/gate-flags';
import { parsePauseSessionLocationState } from '@/features/pause/application/use-cases/session/location-state';
import { coalescePauseSessionShellViewModel } from '@/features/pause/application/use-cases/session/shell-view-model';
import type { PauseSessionShellHolzen } from '@/features/pause/domain/pause-session-shell-holzen';
import { usePauseSessionMountLog } from './use-pause-session-mount-log';
import { usePauseSessionPendingLeaveSheet } from '../use-pause-session-pending-leave-sheet';
import { usePauseSessionPendingPauseOfferNavigation } from './use-pause-session-pending-pause-offer-navigation';
import { usePauseSessionShell } from './use-pause-session-shell';
import { usePendingPauseOffer } from '../use-pending-pause-offer';

export type UsePauseSessionShellBootstrapParams = {
  holzen: PauseSessionShellHolzen;
  navigate: NavigateFunction;
  resyncOpenPauseFromDb: () => void | Promise<void>;
  handleClose: () => void;
  t: TFunction;
};

/**
 * `/pause` shell: nav parse, restore/hydrate/fetch, coalesced view model, pending-offer leave sheet.
 */
export function usePauseSessionShellBootstrap({
  holzen,
  navigate,
  resyncOpenPauseFromDb,
  handleClose,
  t,
}: UsePauseSessionShellBootstrapParams) {
  const location = useLocation();
  const nav = parsePauseSessionLocationState(location.state);

  const { onAfterMutation: pendingOfferAfterMutation, navigateAfterAdopt: pendingOfferNavigateAfterAdopt } =
    usePauseSessionPendingPauseOfferNavigation({
      navigate,
      resyncOpenPauseFromDb,
    });
  const { pending, refresh: refreshPendingOffer } = usePendingPauseOffer();

  const { restored, hydration, fetchPauseInstanceId, fetchedInstance, fetchFailed, resolved } =
    usePauseSessionShell({
      locationKey: location.key,
      nav,
      holzen,
    });

  usePauseSessionMountLog(
    buildPauseSessionMountLogParams({
      restored,
      fetchPauseInstanceId,
      navPauseInstanceId: nav.pauseInstanceId,
      navReflectionMessage: nav.reflectionMessage,
      hydrationStatus: hydration.status,
    }),
  );

  const { message, context, pauseInstanceId, companions, companionPrefs, severity } =
    coalescePauseSessionShellViewModel(resolved, holzen.severity);

  const pauseInstanceIdForTerminal =
    pauseInstanceId ?? nav.pauseInstanceId ?? fetchPauseInstanceId;

  const {
    leaveWithPendingOpen,
    setLeaveWithPendingOpen,
    leaveSheetBusy,
    confirmLeavePauseSession,
    requestExitPauseBeforeDone,
    handleDeclinePendingFromLeaveSheet,
    handlePendingAdoptFromLeaveSheet,
  } = usePauseSessionPendingLeaveSheet({
    pending,
    pauseInstanceIdForTerminal,
    handleClose,
    pendingOfferAfterMutation,
    pendingOfferNavigateAfterAdopt,
    refreshPendingOffer,
    t,
  });

  const hasCoalescedShellSession =
    Boolean(pauseInstanceIdForTerminal) || message.length > 0;

  const waitingForFetch = isPauseSessionWaitingForInstanceFetch({
    hydrationStatus: hydration.status,
    fetchFailed,
    fetchedInstance,
  });

  return {
    nav,
    restored,
    hydration,
    fetchPauseInstanceId,
    fetchedInstance,
    fetchFailed,
    resolved,
    message,
    context,
    pauseInstanceId,
    companions,
    companionPrefs,
    severity,
    pauseInstanceIdForTerminal,
    pending,
    leaveWithPendingOpen,
    setLeaveWithPendingOpen,
    leaveSheetBusy,
    confirmLeavePauseSession,
    requestExitPauseBeforeDone,
    handleDeclinePendingFromLeaveSheet,
    handlePendingAdoptFromLeaveSheet,
    hasCoalescedShellSession,
    waitingForFetch,
  };
}
