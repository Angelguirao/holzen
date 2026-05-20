import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { pauseStepLayout } from '@/features/pause/public';
import { usePauseReflectionStepLog } from '@/features/pause/public-hooks';
import { PauseReflectCard } from '@/screens/pause/components/pause-reflect-card';
import { PauseReflectStepNav } from '@/screens/pause/components/pause-reflect-step-nav';

interface Props {
  pauseInstanceId: string | null;
  context: string | null;
  reflectionMessage: string;
  reflectionLoading?: boolean;
  reflectionError?: string | null;
  onReflectionRetry?: () => void;
  /** When false, skip loading / showing the haiku line (profile companion toggle). */
  companionHaikuEnabled: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
  onContinue: () => void;
  onBack?: () => void;
}

export function PauseReflect({
  pauseInstanceId,
  context,
  reflectionMessage,
  reflectionLoading = false,
  reflectionError = null,
  onReflectionRetry,
  companionHaikuEnabled,
  isFavorite,
  onToggleFavorite,
  subscribed,
  onContinue,
  onBack,
}: Props) {
  const { t } = useTranslation();

  usePauseReflectionStepLog({
    pauseInstanceId,
    reflectionLoading,
    reflectionMessage,
    reflectionError,
  });

  return (
    <motion.div
      className={`${pauseStepLayout.columnFlow} scroll-mt-36 gap-8 pt-6 sm:scroll-mt-40 sm:pt-10`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <div className="space-y-2 text-center">
        <p className={pauseStepLayout.screenTitle}>
          {t('pause.reflect.title', { defaultValue: 'Reflect' })}
        </p>
        <p className={pauseStepLayout.screenSubtitle}>
          {t('pause.reflect.subtitle', { defaultValue: 'Take your time' })}
        </p>
      </div>

      <PauseReflectCard
        pauseInstanceId={pauseInstanceId}
        context={context}
        reflectionMessage={reflectionMessage}
        reflectionLoading={reflectionLoading}
        reflectionError={reflectionError}
        onReflectionRetry={onReflectionRetry}
        companionHaikuEnabled={companionHaikuEnabled}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        subscribed={subscribed}
      />

      <PauseReflectStepNav
        reflectionLoading={reflectionLoading}
        reflectionError={reflectionError}
        reflectionMessage={reflectionMessage}
        onContinue={onContinue}
        onBack={onBack}
      />
    </motion.div>
  );
}
