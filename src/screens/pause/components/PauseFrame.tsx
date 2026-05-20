import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Activity, ChevronRight, ZoomOut } from 'lucide-react';
import { pauseStepLayout } from '@/features/pause/public';
import { Button } from '@/components/ui/button';
import { usePauseArtifactHaiku } from '@/features/pause/public-hooks';
import { hapticFeedback } from '@/lib/haptics';
import { PauseFrameHaikuCard } from '@/screens/pause/components/pause-frame-haiku-card';
import { PauseFrameToolRow } from '@/screens/pause/components/pause-frame-tool-row';
import { resolveFrameHaikuDisplayBody } from '@/screens/pause/lib/resolve-frame-haiku-display-body';

export interface PauseFrameProps {
  pauseInstanceId: string | null;
  reflectionMessage: string;
  /** When false, hide the haiku row (profile companion toggle). */
  companionHaikuEnabled: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
  onImDone: () => void;
}

/**
 * Figma "Frame" hub: companion context + links to angles (ground, zoom out, history, signal).
 * Completing the hub logs shift server-side from the parent (skipped mirror mood).
 */
export function PauseFrame({
  pauseInstanceId,
  reflectionMessage,
  companionHaikuEnabled,
  isFavorite,
  onToggleFavorite,
  subscribed,
  onImDone,
}: PauseFrameProps) {
  const { t } = useTranslation();
  /** Match Reflect companion pattern: collapsed until the user opens the card. */
  const [haikuOpen, setHaikuOpen] = useState(false);
  const { artifactHaiku, haikuFetch } = usePauseArtifactHaiku({
    pauseInstanceId,
    companionHaikuEnabled,
    trigger: 'whenEnabled',
    fetchEnabled: haikuOpen,
  });

  const zoomHref = pauseInstanceId ? `/companion/zoom-out/${pauseInstanceId}` : '/pause';
  const signalHref = pauseInstanceId ? `/companion/signal/${pauseInstanceId}` : '/pause';

  const showHaikuCard = companionHaikuEnabled && Boolean(pauseInstanceId) && Boolean(reflectionMessage.trim());
  const displayHaikuBody = resolveFrameHaikuDisplayBody({
    artifactHaiku,
    haikuFetch,
    reflectionMessage,
  });

  return (
    <motion.div
      className={pauseStepLayout.columnFlow}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex w-full flex-col gap-2 text-center">
        <h2 className={pauseStepLayout.screenTitle}>{t('pause.frame.title', { defaultValue: 'Frame' })}</h2>
        <p className={pauseStepLayout.screenSubtitle}>
          {t('pause.frame.subtitle', { defaultValue: 'Want another angle? Your companions' })}
        </p>
      </div>

      <div className="mt-6 w-full space-y-3">
        {showHaikuCard ? (
          <PauseFrameHaikuCard
            open={haikuOpen}
            onOpenChange={setHaikuOpen}
            subscribed={subscribed}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            haikuFetch={haikuFetch}
            displayBody={displayHaikuBody}
          />
        ) : null}

        <PauseFrameToolRow
          icon={<ZoomOut className="h-5 w-5 text-primary" aria-hidden />}
          label={t('pause.frame.zoomOut', { defaultValue: 'Zoom out' })}
          href={zoomHref}
        />
        <PauseFrameToolRow
          icon={<Activity className="h-5 w-5 text-primary" aria-hidden />}
          label={t('pause.frame.signal', { defaultValue: 'Signal' })}
          href={signalHref}
        />
      </div>

      <div className="mt-10 flex w-full justify-center">
        <Button
          type="button"
          variant="outline"
          className={pauseStepLayout.ritualPrimaryOutlineCta}
          onClick={() => {
            hapticFeedback('light');
            onImDone();
          }}
        >
          {t('pause.frame.imDone', { defaultValue: "I'm done" })}
          <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
        </Button>
      </div>
    </motion.div>
  );
}
