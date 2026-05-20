import { Fragment } from 'react';
import { PauseEngagementBlocked } from '@/screens/pause/components/PauseEngagementBlocked';
import { PauseSessionGate } from '@/screens/pause/components/PauseSessionGate';
import { PauseSessionScaffoldShell } from '@/screens/pause/components/PauseSessionScaffoldShell';
import { PauseSessionGateContent } from '@/screens/pause/components/PauseSessionGateContent';
import { PauseSessionDepthPickerStack } from '@/screens/pause/components/PauseSessionDepthPickerStack';
import { PauseLeaveWithPendingSheet } from '@/screens/pause/components/PauseLeaveWithPendingSheet';
import { usePauseSessionScreen } from '@/features/pause/public-hooks';
import { pauseSessionScaffoldChromeRegistry } from '@/screens/pause/lib/pause-scaffold-chrome-registry';

/** `/pause` route — presentation only; orchestration in `usePauseSessionScreen`. */
export default function PauseSessionScreen() {
  const vm = usePauseSessionScreen(pauseSessionScaffoldChromeRegistry);

  if (!vm.subLoading && !vm.canEngagePause) {
    return (
      <PauseEngagementBlocked
        entitlement={vm.entitlement}
        checkoutLoading={vm.checkoutLoading}
        trialLoading={vm.trialLoading}
        onReactivate={() => void vm.startReactivationCheckout()}
        onStartTrial={() => void vm.ensureTrial().then(() => vm.refreshSubscription())}
        onReturn={vm.handleReturn}
      />
    );
  }

  return (
    <Fragment>
      <PauseSessionGate
        shellReady={vm.hasCoalescedShellSession}
        phase={vm.phase}
        waitingForFetch={vm.waitingForFetch}
        fetchFailed={vm.fetchFailed}
        hydrationStatus={vm.hydration.status}
        profileLoaded={vm.profileLoaded}
        onReturn={vm.handleReturn}
      >
        <PauseSessionGateContent
          sessionOnPicker={vm.sessionOnPicker}
          depthPickerSlot={
            <PauseSessionDepthPickerStack
              contextLine={vm.depthContextLine}
              onBrief={vm.depthPickerOnBrief}
              onDeep={vm.handleDepthPickerDeep}
              deepPauseLocked={!vm.subscribed}
              onClose={vm.requestExitPauseBeforeDone}
            />
          }
          scaffoldSlot={
            <PauseSessionScaffoldShell
              {...vm.scaffoldRitualDerived}
              countdownSlot={vm.engagedOpenMaxCountdownSlot}
              curtainLifted={vm.curtainLifted}
              prefersReducedMotion={!!vm.prefersReducedMotion}
              onClose={vm.handlePauseSessionChromeClose}
              phase={vm.phase}
              step={vm.step}
              onHeaderBack={vm.handlePauseHeaderBack}
              showHeaderBack={vm.showPauseHeaderBack}
              stepperSlot={vm.briefStepperSlot}
              breathSecondLabelVariant={vm.breathSecondLabelVariant}
              soundMuted={vm.soundMuted}
              onSoundMutedChange={vm.setSoundMuted}
              ritualEntry={vm.ritualEntry}
              briefRitual={vm.briefRitual}
              deepRitual={vm.deepRitual}
              decision={vm.decision}
              onDoneReturn={vm.handleReturn}
              onSaveToJourney={vm.ritualEntry === 'brief' ? vm.handleBriefSaveToJourney : undefined}
              pauseImpactData={vm.pauseImpactData}
              pauseInstanceIdForDone={vm.pauseInstanceIdForTerminal}
            />
          }
        />
      </PauseSessionGate>
      <PauseLeaveWithPendingSheet
        open={vm.leaveWithPendingOpen}
        onOpenChange={vm.setLeaveWithPendingOpen}
        pending={vm.pending}
        busy={vm.leaveSheetBusy}
        onStay={() => vm.setLeaveWithPendingOpen(false)}
        onLeave={() => {
          vm.confirmLeavePauseSession();
        }}
        onSwitchToBrief={() => {
          vm.setLeaveWithPendingOpen(false);
          vm.setRitualEntry('brief');
          vm.setBriefStep('feel');
          vm.setStep('feel');
        }}
        onAdoptNew={() => void vm.handlePendingAdoptFromLeaveSheet()}
        onDismissPendingOffer={() => void vm.handleDeclinePendingFromLeaveSheet()}
      />
    </Fragment>
  );
}
