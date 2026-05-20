import type { BriefPauseStep, RitualDepth } from '@/features/pause/domain/ritual-types';
import type { FeelStepTile } from '@/features/pause/domain/feel-step-tile';
import type { MoodValue } from '@/features/pause/domain/mood-value';
import type { CompanionData, CompanionPrefs } from '@/features/pause/domain/companion-card-types';
import type { FetchedPauseInstance } from '@/features/pause/domain/session-model';
import type { PauseStep } from '@/features/pause/domain/pause-ritual-steps';
import type { PauseImpactData } from '@/features/pause/application/use-cases/ritual/decide/impact-data';
import type { PauseSessionHydrationState } from '@/features/pause/application/use-cases/session/hydration';

/** React-free setter shape for ritual bundle inputs. */
type SetState<T> = (value: T | ((prev: T) => T)) => void;

/** Pending offer row shape (matches `PendingPauseOfferRow`; passed through to scaffold). */
export type PauseSessionStepShellPendingOffer = {
  id: string;
  created_at: string;
  context_snapshot: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  preview_message: string | null;
};

/** Shell bootstrap fields required to build the step-handler shell bundle. */
export type PauseSessionStepShellBundleInput = {
  leaveWithPendingOpen: boolean;
  setLeaveWithPendingOpen: SetState<boolean>;
  pending: PauseSessionStepShellPendingOffer | null | undefined;
  leaveSheetBusy: boolean;
  confirmLeavePauseSession: () => void;
  requestExitPauseBeforeDone: () => void;
  handleDeclinePendingFromLeaveSheet: () => void | Promise<void>;
  handlePendingAdoptFromLeaveSheet: () => void | Promise<void>;
  hasCoalescedShellSession: boolean;
  hydration: PauseSessionHydrationState;
  fetchFailed: boolean;
  waitingForFetch: boolean;
  pauseInstanceIdForTerminal: string | null;
  fetchedInstance: FetchedPauseInstance | null;
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
  context: string | null;
  pauseInstanceId: string | null;
};

export type PauseSessionStepShellChromeInput = {
  handleReturn: () => void;
};

/** Ritual state fields required to build the step-handler ritual bundle. */
export type PauseSessionStepRitualBundleInput = {
  step: PauseStep;
  setStep: SetState<PauseStep>;
  setRitualEntry: SetState<RitualDepth | 'picker'>;
  setBriefStep: SetState<BriefPauseStep>;
  phase: 'session' | 'done';
  curtainLifted: boolean;
  soundMuted: boolean;
  setSoundMuted: SetState<boolean>;
  ritualEntry: RitualDepth | 'picker';
  decision: string | null;
  pauseImpactData: PauseImpactData | null;
  isFavorite: boolean;
  moodDone: boolean;
  selectedMood: MoodValue | null;
  selectedBriefFace: FeelStepTile | null;
  feelIntensity: number | null;
  briefStep: BriefPauseStep;
  briefIntegrateDone: boolean;
  breathingFirstCompleted: boolean;
  setBreathingFirstCompleted: SetState<boolean>;
  breathingSecondCompleted: boolean;
  setBreathingSecondCompleted: SetState<boolean>;
  swipeDirection: 'forward' | 'back';
};
