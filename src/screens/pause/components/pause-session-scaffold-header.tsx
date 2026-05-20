import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { PauseProgress, type PauseStep } from '@/screens/pause/components/PauseProgress';
import { Button } from '@/components/ui/button';

export type PauseSessionScaffoldHeaderProps = {
  phase: 'session' | 'done';
  step: PauseStep;
  onClose: () => void;
  sessionTitle?: string;
  stepperSlot?: ReactNode;
  breathSecondLabelVariant?: 'breathe' | 'shift';
  countdownSlot?: ReactNode;
};

/** Sticky pause session header: title, close, optional countdown, segment stepper. */
export function PauseSessionScaffoldHeader({
  phase,
  step,
  onClose,
  sessionTitle,
  stepperSlot,
  breathSecondLabelVariant = 'breathe',
  countdownSlot,
}: PauseSessionScaffoldHeaderProps) {
  const { t } = useTranslation();

  return (
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

        {phase === 'session' ? (
          <div className="mt-3 border-t border-border/20 pt-3">
            {stepperSlot ?? (
              <PauseProgress
                currentStep={step}
                variant="segment"
                breathSecondLabelVariant={breathSecondLabelVariant}
              />
            )}
          </div>
        ) : null}
      </header>
    </motion.div>
  );
}
