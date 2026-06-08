import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { resolvePauseReflectDisplayContent } from '@/features/pause/domain/reflect/generation/resolve-pause-reflect-display-content';
import {
  usePauseReflectionStepLog,
  type CurrentFeelForReflect,
  type ReflectionContentV2,
} from '@/features/pause/public-ritual-reflect';
import { pauseStepLayout } from '@/features/pause/public-session';
import { PauseReflectCard } from '@/screens/pause/components/pause-reflect-card';
import { PauseReflectStepNav } from '@/screens/pause/components/pause-reflect-step-nav';

interface Props {
  pauseInstanceId: string | null;
  context: string | null;
  reflectionMessage: string;
  reflectionContent?: ReflectionContentV2 | null;
  currentFeel?: CurrentFeelForReflect;
  severityAbsPct?: number;
  reflectionLoading?: boolean;
  reflectionError?: string | null;
  onReflectionRetry?: () => void;
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
  reflectionContent = null,
  currentFeel,
  severityAbsPct = 0,
  reflectionLoading = false,
  reflectionError = null,
  onReflectionRetry,
  isFavorite,
  onToggleFavorite,
  subscribed,
  onContinue,
  onBack,
}: Props) {
  "use memo";
  const { t } = useTranslation();

  const effectiveReflectionContent = useMemo(
    () =>
      resolvePauseReflectDisplayContent({
        reflectionContent,
        reflectionMessage,
        reflectionError,
        context,
        severityAbsPct,
        currentFeel,
        t,
      }),
    [
      reflectionContent,
      reflectionMessage,
      reflectionError,
      context,
      severityAbsPct,
      currentFeel,
      t,
    ],
  );

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
          {t('pause.reflect.subtitle', {
            defaultValue: 'Take your time',
          })}
        </p>
      </div>

      <PauseReflectCard
        pauseInstanceId={pauseInstanceId}
        context={context}
        reflectionMessage={reflectionMessage}
        reflectionContent={reflectionContent}
        currentFeel={currentFeel}
        severityAbsPct={severityAbsPct}
        reflectionLoading={reflectionLoading}
        reflectionError={reflectionError}
        onReflectionRetry={onReflectionRetry}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        subscribed={subscribed}
      />

      <PauseReflectStepNav
        reflectionLoading={reflectionLoading}
        reflectionError={reflectionError}
        reflectionMessage={reflectionMessage}
        reflectionContent={effectiveReflectionContent}
        onContinue={onContinue}
        onBack={onBack}
      />
    </motion.div>
  );
}
