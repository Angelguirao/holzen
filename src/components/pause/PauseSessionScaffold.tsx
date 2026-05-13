import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Volume2, VolumeX, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PauseProgress, type PauseStep } from '@/components/pause/PauseProgress';
import { Button } from '@/components/ui/button';
import { resumePauseAudioContext } from '@/lib/pause-ritual-audio';

interface Props {
  curtainLifted: boolean;
  prefersReducedMotion: boolean;
  onClose: () => void;
  phase: 'session' | 'done';
  step: PauseStep;
  goToStep: (next: PauseStep) => void;
  /** Shown in the stepper row (left); invokes macro back or breathing intro reset from parent. */
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
  /** When set, replaces the default six-beat `PauseProgress` (e.g. brief four-step bar). */
  stepperSlot?: ReactNode;
  /** PostHog flag `pause.step5_breath_label_shift`: label second breathing macro step as “Shift”. */
  breathSecondLabelVariant?: 'breathe' | 'shift';
  /** When set with `onSoundMutedChange`, header mute controls ritual audio (breathing cues). */
  soundMuted?: boolean;
  onSoundMutedChange?: (muted: boolean) => void;
  /** Shown under the session title (e.g. engaged-only `open_max_age` countdown). */
  countdownSlot?: ReactNode;
  children: ReactNode;
}

/**
 * Full-screen pause shell: curtain, gradient, **sticky** top strip (`<header>`: title · close ·
 * optional countdown only), then a **non-sticky** band: **back** (when shown) · **segment
 * stepper** · **mute** on one row (wireframe parity). **Macro progress** (“n of total”) and
 * optional duration sit in the main column above step content. Step science / About tabs live on
 * the **depth picker** only (`PauseSessionDepthPickerStack`).
 */
export function PauseSessionScaffold({
  curtainLifted,
  prefersReducedMotion,
  onClose,
  phase,
  step,
  goToStep,
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
  const { t } = useTranslation();
  /** Ritual audio off by default (wireframe: volume “off” until the user enables it). */
  const [uncontrolledMuted, setUncontrolledMuted] = useState(true);
  const muted = soundMutedControlled ?? uncontrolledMuted;
  const setMuted = onSoundMutedChange ?? setUncontrolledMuted;

  const showMeta =
    phase === 'session' &&
    (macroProgressSubline != null ||
      macroProgressLine != null ||
      (macroStepIndex != null && macroStepTotal != null && macroStepTotal > 0));

  return (
    <>
      <AnimatePresence>
        {!curtainLifted && (
          <motion.div
            className="fixed inset-0 z-[100] bg-background"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        style={{
          background:
            'linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)) 50%, hsl(var(--background)) 100%)',
        }}
      >
        <motion.div
          className="pointer-events-none fixed left-1/3 top-1/4 h-[300px] w-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.04) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={prefersReducedMotion ? {} : { x: [0, 30, -20, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none fixed bottom-1/3 right-1/4 h-[250px] w-[250px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.03) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={prefersReducedMotion ? {} : { x: [0, -25, 15, 0], y: [0, 20, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="sticky top-0 z-[60] border-b border-border/30 bg-background/90 backdrop-blur-md"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          <header className="mx-auto max-w-lg px-4 pb-3 pt-3 sm:px-6">
            <div className="relative flex min-h-[2.25rem] items-center justify-center">
              <h1 className="text-sm font-medium text-foreground">{sessionTitle ?? t('pause.sessionTitle')}</h1>
              <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={onClose}
                  aria-label={t('common.close')}
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>

            {phase === 'session' && countdownSlot ? <div className="mt-1.5 px-1">{countdownSlot}</div> : null}
          </header>
        </motion.div>

        {phase === 'session' && (
          <div className="relative z-[55] border-b border-border/25 bg-background/60">
            <div className="mx-auto max-w-lg px-4 pb-3 pt-3 sm:px-6">
              <div className="grid w-full grid-cols-[minmax(2.25rem,auto)_1fr_minmax(2.25rem,auto)] items-center gap-1">
                <div className="flex min-h-9 items-center justify-start">
                  {onHeaderBack && showHeaderBack ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={onHeaderBack}
                      aria-label={t('pause.steps.back', { defaultValue: 'Back' })}
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : null}
                </div>
                <div className="min-w-0">
                  {stepperSlot ?? (
                    <PauseProgress
                      currentStep={step}
                      onStepClick={goToStep}
                      variant="segment"
                      breathSecondLabelVariant={breathSecondLabelVariant}
                    />
                  )}
                </div>
                <div className="flex min-h-9 items-center justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={
                      muted
                        ? 'h-9 w-9 shrink-0 text-muted-foreground/70 hover:text-foreground'
                        : 'h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground'
                    }
                    onClick={() => {
                      setMuted(!muted);
                      if (muted) void resumePauseAudioContext();
                    }}
                    aria-label={
                      muted
                        ? t('pause.muteAriaOff', { defaultValue: 'Sound off (tap to unmute)' })
                        : t('pause.muteAriaOn', { defaultValue: 'Sound on (tap to mute)' })
                    }
                  >
                    {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-lg overflow-hidden px-5 pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-8">
          {phase === 'session' && (
            <div className="relative mb-6 w-full min-h-[2.25rem] sm:mb-8">
              {showMeta &&
                ((macroProgressSubline != null ||
                  (macroProgressLine != null &&
                    macroStepIndex != null &&
                    macroStepTotal != null &&
                    macroStepTotal > 0)) ? (
                  <div className="flex flex-col items-center gap-0 px-2 text-center text-muted-foreground sm:px-6">
                    <p className="text-base font-medium italic leading-6">
                      {macroProgressLine ??
                        t('pause.deep.macroStepCount', {
                          defaultValue: '{{n}} of {{total}}',
                          n: macroStepIndex,
                          total: macroStepTotal,
                        })}
                    </p>
                    {macroProgressSubline ? (
                      <p className="text-base font-normal leading-6">{macroProgressSubline}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-col items-center px-2 text-center sm:px-6">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {macroProgressLine ??
                        t('pause.macroProgress', {
                          defaultValue: '{{n}} of {{total}} · under ~15 min',
                          n: macroStepIndex,
                          total: macroStepTotal,
                        })}
                    </p>
                  </div>
                ))}
            </div>
          )}
          {children}
        </div>
      </motion.div>
    </>
  );
}
