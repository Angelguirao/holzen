import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Info, Volume2, VolumeX, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PauseProgress, type PauseStep } from '@/components/pause/PauseProgress';
import { PauseAboutPausesBody } from '@/components/pause/PauseAboutPausesBody';
import { PauseScienceScrollBody } from '@/components/pause/PauseScienceSheet';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resumePauseAudioContext } from '@/lib/pause-ritual-audio';

interface Props {
  curtainLifted: boolean;
  prefersReducedMotion: boolean;
  onClose: () => void;
  phase: 'session' | 'done';
  step: PauseStep;
  goToStep: (next: PauseStep) => void;
  /** Shown under the stepper; invokes macro back or breathing intro reset from parent. */
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
  /** Which deep-pause step’s citations to emphasize in the “Step science” tab (defaults to `step`). */
  scienceCurrentStep?: PauseStep;
  /** PostHog flag `pause.step5_breath_label_shift`: label second breathing macro step as “Shift”. */
  breathSecondLabelVariant?: 'breathe' | 'shift';
  /** Breath steps use close-only chrome in wireframes — hide the science affordance. */
  hideScienceButton?: boolean;
  /** When set with `onSoundMutedChange`, header mute controls ritual audio (breathing cues). */
  soundMuted?: boolean;
  onSoundMutedChange?: (muted: boolean) => void;
  /** Shown under the session title (e.g. engaged-only `open_max_age` countdown). */
  countdownSlot?: ReactNode;
  children: ReactNode;
}

/**
 * Full-screen pause shell: curtain, gradient, sticky header (title · info · close),
 * segment stepper, optional back, science bottom sheet from info.
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
  scienceCurrentStep,
  breathSecondLabelVariant = 'breathe',
  hideScienceButton = false,
  soundMuted: soundMutedControlled,
  onSoundMutedChange,
  countdownSlot,
  children,
}: Props) {
  const { t } = useTranslation();
  const [scienceOpen, setScienceOpen] = useState(false);
  const [uncontrolledMuted, setUncontrolledMuted] = useState(false);
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

        <header className="sticky top-0 z-[60] border-b border-border/30 bg-background/90 backdrop-blur-md">
          <motion.div
            className="mx-auto max-w-lg px-4 pb-3 pt-3 sm:px-6"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            <div className="relative flex min-h-[2.25rem] items-center justify-center">
              <h1 className="text-sm font-medium text-foreground">{sessionTitle ?? t('pause.sessionTitle')}</h1>
              <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                {phase === 'session' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
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
                )}
                {phase === 'session' && !hideScienceButton && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setScienceOpen(true)}
                    aria-label={t('pause.scienceInfoAria')}
                  >
                    <Info className="h-4 w-4" aria-hidden />
                  </Button>
                )}
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

            {phase === 'session' && countdownSlot ? (
              <div className="mt-1.5 px-1">{countdownSlot}</div>
            ) : null}

            {phase === 'session' && (
              <>
                {showMeta &&
                  ((macroProgressSubline != null ||
                    (macroProgressLine != null &&
                      macroStepIndex != null &&
                      macroStepTotal != null &&
                      macroStepTotal > 0)) ? (
                    <div className="mt-1 flex flex-col items-center gap-0 text-center text-muted-foreground">
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
                    <p className="mt-1 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {macroProgressLine ??
                        t('pause.macroProgress', {
                          defaultValue: 'Step {{n}} of {{total}} · under ~15 min',
                          n: macroStepIndex,
                          total: macroStepTotal,
                        })}
                    </p>
                  ))}
                <div className="mt-4 w-full">
                  {stepperSlot ?? (
                    <PauseProgress
                      currentStep={step}
                      onStepClick={goToStep}
                      variant="segment"
                      breathSecondLabelVariant={breathSecondLabelVariant}
                    />
                  )}
                </div>
                {onHeaderBack && showHeaderBack && (
                  <div className="mt-2 flex w-full justify-start">
                    <button
                      type="button"
                      onClick={onHeaderBack}
                      className="inline-flex items-center gap-1 rounded-md px-1 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                      {t('pause.steps.back', { defaultValue: 'Back' })}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </header>

        <Sheet open={scienceOpen} onOpenChange={setScienceOpen}>
          <SheetContent side="bottom" className="z-[110] max-h-[88vh] overflow-y-auto rounded-t-2xl border-t p-6 sm:p-8">
            <SheetTitle className="sr-only">{t('pause.scienceSheet.sheetTitle')}</SheetTitle>
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 rounded-lg p-1 sm:mb-6">
                <TabsTrigger value="about" className="text-xs sm:text-sm">
                  {t('pause.scienceSheet.tabAbout')}
                </TabsTrigger>
                <TabsTrigger value="steps" className="text-xs sm:text-sm">
                  {t('pause.scienceSheet.tabSteps')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="about" className="mt-0 focus-visible:outline-none">
                <PauseAboutPausesBody />
              </TabsContent>
              <TabsContent value="steps" className="mt-0 focus-visible:outline-none">
                <PauseScienceScrollBody currentStep={scienceCurrentStep ?? step} />
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>

        <div className="relative z-10 mx-auto max-w-lg overflow-hidden px-5 pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-8">
          {children}
        </div>
      </motion.div>
    </>
  );
}
