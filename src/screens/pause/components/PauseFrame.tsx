import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  resolveEffectiveReflectionCopy,
  resolveFrameHaikuDisplayBody,
  usePauseArtifactHaiku,
  usePauseArtifactReflectionText,
} from '@/features/pause/public-ritual-reflect';
import {
  getCompanionSectionVisibility,
  type CompanionData,
  type CompanionPrefs,
} from '@/features/pause/public-ritual-frame';
import { pauseStepLayout } from '@/features/pause/public-session';
import { hapticFeedback } from '@/lib/haptics';
import { COMPANION_SECTION_ICONS } from '@/screens/pause/components/companion/companion-section-icons';
import { PauseFrameHaikuCard } from '@/screens/pause/components/pause-frame-haiku-card';
import { PauseFrameToolRow } from '@/screens/pause/components/pause-frame-tool-row';

export interface PauseFrameProps {
  pauseInstanceId: string | null;
  reflectionMessage: string;
  companionPrefs: CompanionPrefs;
  /** Used for visibility parity with inline `CompanionSection` orchestrated slots. */
  companions: CompanionData;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
  onImDone: () => void;
}

function companionFullViewHref(
  pauseInstanceId: string | null,
  segment: 'signal' | 'grounding' | 'zoom-out' | 'history',
): string {
  if (!pauseInstanceId) return '/pause';
  return `/companion/${segment}/${pauseInstanceId}`;
}

/**
 * Figma "Frame" hub: companion context + links to angles (ground, zoom out, history, signal).
 * Completing the hub logs shift server-side from the parent (skipped mirror mood).
 */
export function PauseFrame({
  pauseInstanceId,
  reflectionMessage,
  companionPrefs,
  companions,
  isFavorite,
  onToggleFavorite,
  subscribed,
  onImDone,
}: PauseFrameProps) {
  "use memo";
  const { t } = useTranslation();
  const companionHaikuEnabled = companionPrefs.haiku;
  const sessionSeedEmpty = !reflectionMessage.trim();
  const { artifactReflectionText } = usePauseArtifactReflectionText({
    pauseInstanceId,
    trigger: 'whenEnabled',
    fetchEnabled: sessionSeedEmpty,
  });
  const effectiveReflectionMessage = resolveEffectiveReflectionCopy(
    reflectionMessage,
    artifactReflectionText,
  );

  /** Match Reflect companion pattern: collapsed until the user opens the card. */
  const [haikuOpen, setHaikuOpen] = useState(false);
  const { artifactHaiku, haikuFetch } = usePauseArtifactHaiku({
    pauseInstanceId,
    companionHaikuEnabled,
    trigger: 'whenEnabled',
    fetchEnabled: haikuOpen,
  });

  const { hasSignal, hasGrounding, hasZoomOut, hasHistory } = useMemo(
    () => getCompanionSectionVisibility(companionPrefs, companions, pauseInstanceId),
    [companionPrefs, companions, pauseInstanceId],
  );

  const SignalIcon = COMPANION_SECTION_ICONS.signal;
  const GroundingIcon = COMPANION_SECTION_ICONS.grounding;
  const ZoomOutIcon = COMPANION_SECTION_ICONS.zoomOut;
  const HistoryIcon = COMPANION_SECTION_ICONS.history;

  /** Haiku is optional and lazy-loaded — do not require nav reflection seed (matches Reflect artifact pattern). */
  const showHaikuCard = companionHaikuEnabled && Boolean(pauseInstanceId);
  const displayHaikuBody = resolveFrameHaikuDisplayBody({
    artifactHaiku,
    haikuFetch,
    reflectionMessage: effectiveReflectionMessage,
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

        {hasSignal ? (
          <PauseFrameToolRow
            icon={<SignalIcon className="h-5 w-5 text-primary" aria-hidden />}
            label={t('pause.frame.signal', { defaultValue: 'Signal' })}
            href={companionFullViewHref(pauseInstanceId, 'signal')}
            iconHelp={t('pause.frame.companions.signalHelp')}
          />
        ) : null}

        {hasGrounding ? (
          <PauseFrameToolRow
            icon={<GroundingIcon className="h-5 w-5 text-primary" aria-hidden />}
            label={t('pause.frame.ground', { defaultValue: 'Ground yourself' })}
            href={companionFullViewHref(pauseInstanceId, 'grounding')}
            iconHelp={t('pause.frame.companions.groundingHelp')}
          />
        ) : null}

        {hasZoomOut ? (
          <PauseFrameToolRow
            icon={<ZoomOutIcon className="h-5 w-5 text-primary" aria-hidden />}
            label={t('pause.frame.zoomOut', { defaultValue: 'Zoom out' })}
            href={companionFullViewHref(pauseInstanceId, 'zoom-out')}
            iconHelp={t('pause.frame.companions.zoomOutHelp')}
          />
        ) : null}

        {hasHistory ? (
          <PauseFrameToolRow
            icon={<HistoryIcon className="h-5 w-5 text-primary" aria-hidden />}
            label={t('pause.frame.lookBack', { defaultValue: 'Look back' })}
            href={companionFullViewHref(pauseInstanceId, 'history')}
            iconHelp={t('pause.frame.companions.lookBackHelp')}
          />
        ) : null}
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
