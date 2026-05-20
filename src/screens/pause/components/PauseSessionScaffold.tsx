import { useState, type ReactNode } from 'react';
import type { PauseStep } from '@/screens/pause/components/PauseProgress';
import { PauseSessionScaffoldBodyChrome } from '@/screens/pause/components/pause-session-scaffold-body-chrome';
import { PauseSessionScaffoldCurtain } from '@/screens/pause/components/pause-session-scaffold-curtain';
import { PauseSessionScaffoldHeader } from '@/screens/pause/components/pause-session-scaffold-header';
import { PauseSessionScaffoldShell } from '@/screens/pause/components/pause-session-scaffold-shell';

interface Props {
  curtainLifted: boolean;
  prefersReducedMotion: boolean;
  onClose: () => void;
  phase: 'session' | 'done';
  step: PauseStep;
  /** Body row (below header): back, macro count + duration, mute — not the step labels. */
  onHeaderBack?: () => void;
  showHeaderBack?: boolean;
  /** 1-based index in the macro ritual (Feel → … → Decide; six user-facing beats — Choose is folded into the last beat). */
  macroStepIndex?: number;
  macroStepTotal?: number;
  /** When set, replaces the default `pause.sessionTitle` header string. */
  sessionTitle?: string;
  /** When set, replaces `pause.macroProgress` for the meta line under the title. */
  macroProgressLine?: string;
  /** Optional second line under `macroProgressLine` (deep pause wireframe: step duration hint). */
  macroProgressSubline?: string;
  /** Sticky header: segment stepper (Feel · Breathe · …). */
  stepperSlot?: ReactNode;
  /** PostHog flag `pause.step5_breath_label_shift`: label second breathing macro step as “Shift”. */
  breathSecondLabelVariant?: 'breathe' | 'shift';
  /** With `onSoundMutedChange`, body mute controls ritual audio (breathing cues). */
  soundMuted?: boolean;
  onSoundMutedChange?: (muted: boolean) => void;
  /** Shown under the session title (e.g. engaged-only `open_max_age` countdown). */
  countdownSlot?: ReactNode;
  children: ReactNode;
}

/**
 * Full-screen pause shell: sticky header (title · close · stepper) + body chrome (back · progress · mute) + step content.
 */
export function PauseSessionScaffold({
  curtainLifted,
  prefersReducedMotion,
  onClose,
  phase,
  step,
  onHeaderBack,
  showHeaderBack = false,
  macroStepIndex,
  macroStepTotal,
  sessionTitle,
  macroProgressLine,
  macroProgressSubline,
  stepperSlot,
  breathSecondLabelVariant = 'breathe',
  soundMuted: soundMutedControlled,
  onSoundMutedChange,
  countdownSlot,
  children,
}: Props) {
  /** Ritual audio off by default (wireframe: volume “off” until the user enables it). */
  const [uncontrolledMuted, setUncontrolledMuted] = useState(true);
  const muted = soundMutedControlled ?? uncontrolledMuted;
  const setMuted = onSoundMutedChange ?? setUncontrolledMuted;

  return (
    <>
      <PauseSessionScaffoldCurtain curtainLifted={curtainLifted} />

      <PauseSessionScaffoldShell prefersReducedMotion={prefersReducedMotion}>
        <PauseSessionScaffoldHeader
          phase={phase}
          step={step}
          onClose={onClose}
          sessionTitle={sessionTitle}
          stepperSlot={stepperSlot}
          breathSecondLabelVariant={breathSecondLabelVariant}
          countdownSlot={countdownSlot}
        />

        <div className="relative z-10 mx-auto max-w-lg overflow-hidden px-5 pb-16 pt-4 sm:px-8 sm:pb-20 sm:pt-6">
          {phase === 'session' ? (
            <PauseSessionScaffoldBodyChrome
              onHeaderBack={onHeaderBack}
              showHeaderBack={showHeaderBack}
              macroStepIndex={macroStepIndex}
              macroStepTotal={macroStepTotal}
              macroProgressLine={macroProgressLine}
              macroProgressSubline={macroProgressSubline}
              muted={muted}
              setMuted={setMuted}
            />
          ) : null}

          {children}
        </div>
      </PauseSessionScaffoldShell>
    </>
  );
}
