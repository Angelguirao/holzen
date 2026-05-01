import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { CompanionSection, type CompanionData, type CompanionPrefs } from '@/components/CompanionSection';
import { CollapsibleReflectionHeader } from '@/components/pause/CollapsibleReflectionHeader';
import { PauseNote } from '@/components/pause/PauseNote';
import { PauseTags } from '@/components/pause/PauseTags';
import { pauseStepLayout } from '@/components/pause/pause-step-layout';

interface Props {
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
  pauseInstanceId: string | null;
  context: string | null;
  reflectionMessage: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
  onContinue: () => void;
  onBack?: () => void;
  /** Current mood selected by the user in the Feel step */
  mood?: string | null;
}

export function PauseReflect({
  companions,
  companionPrefs,
  severity,
  pauseInstanceId,
  context,
  reflectionMessage,
  isFavorite,
  onToggleFavorite,
  subscribed,
  onContinue,
  onBack,
  mood,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className={`${pauseStepLayout.columnFlow} scroll-mt-36 pt-6 sm:scroll-mt-40 sm:pt-10`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <div className="space-y-2 text-center">
        <p className={pauseStepLayout.screenTitle}>
          {t('pause.reflect.heading', { defaultValue: 'Sit with this reflection' })}
        </p>
        <p className={pauseStepLayout.screenSubtitle}>
          {t('pause.reflect.subcopy', {
            defaultValue:
              'Read at your own pace. Notes and tags are optional; open a companion card only when you want another angle.',
          })}
        </p>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/40 px-4 py-5 shadow-sm backdrop-blur-sm sm:px-5">
        <CollapsibleReflectionHeader
          message={reflectionMessage}
          context={context}
          haiku={companions?.haiku ?? null}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          subscribed={subscribed}
          defaultExpanded
        />

        {pauseInstanceId && subscribed && (
          <motion.div
            className="mt-6 space-y-4 border-t border-border/30 pt-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <p className="text-sm font-medium text-muted-foreground">
              {t('pause.reflect.proTools', { defaultValue: 'Your note & tags' })}
            </p>
            <PauseNote pauseInstanceId={pauseInstanceId} />
            <PauseTags pauseInstanceId={pauseInstanceId} />
          </motion.div>
        )}

        {pauseInstanceId && !subscribed && (
          <p className="mt-5 border-t border-border/30 pt-4 text-center text-xs leading-relaxed text-muted-foreground">
            {t('pause.reflect.freeHint', {
              defaultValue:
                'Holzen Pro adds an optional private note and tags on each pause — useful when you look back in your Library.',
            })}
          </p>
        )}
      </div>

      <CompanionSection
        companions={companions}
        prefs={companionPrefs}
        severity={severity}
        pauseInstanceId={pauseInstanceId}
        context={context}
        reflectionMessage={reflectionMessage}
        mood={mood}
        sectionLead={t('pause.reflect.companionsLead', {
          defaultValue: 'When you are ready, open a card — one at a time is enough.',
        })}
      />

      <motion.div
        className="flex flex-col items-center gap-3 pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <button type="button" onClick={onContinue} className={pauseStepLayout.textContinue}>
          {t('pause.steps.continue', { defaultValue: 'Continue' })}
        </button>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          {t('pause.reflect.continueHint', {
            defaultValue: 'There is no "right" amount of time — continue when you feel done.',
          })}
        </p>
      </motion.div>

      {onBack && (
        <motion.div
          className={pauseStepLayout.backRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <button type="button" onClick={onBack} className={pauseStepLayout.backButton}>
            <ChevronLeft className="h-3 w-3" />
            {t('pause.steps.back', { defaultValue: 'Back' })}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
