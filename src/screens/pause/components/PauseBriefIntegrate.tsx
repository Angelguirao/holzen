import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { pauseStepLayout } from '@/features/pause/public';
import { usePauseBriefIntegrateCountdown } from '@/features/pause/public-hooks';
import { PauseBriefIntegrateActions } from '@/screens/pause/components/pause-brief-integrate-actions';
import { PauseBriefIntegrateTimerRing } from '@/screens/pause/components/pause-brief-integrate-timer-ring';

interface Props {
  done: boolean;
  onComplete: () => void;
  onRepeatBreaths: () => void;
  onSwitchToDeepPause: () => void;
  /** When true, deep switch is gated (same product rule as depth picker). */
  deepPauseLocked: boolean;
}

export function PauseBriefIntegrate({
  done,
  onComplete,
  onRepeatBreaths,
  onSwitchToDeepPause,
  deepPauseLocked,
}: Props) {
  const { t } = useTranslation();
  const { remaining, suppressAutoComplete } = usePauseBriefIntegrateCountdown(done, onComplete);

  return (
    <motion.div
      className={pauseStepLayout.columnCenter}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="space-y-2">
          <h2 className={pauseStepLayout.screenTitle}>{t('pause.brief.integrate.title')}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('pause.brief.integrate.line1')}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('pause.brief.integrate.line2')}</p>
        </div>

        <PauseBriefIntegrateTimerRing remaining={remaining} done={done} />

        <PauseBriefIntegrateActions
          deepPauseLocked={deepPauseLocked}
          onRepeatBreaths={onRepeatBreaths}
          onSwitchToDeepPause={onSwitchToDeepPause}
          onUserNavigate={suppressAutoComplete}
        />
      </div>
    </motion.div>
  );
}
