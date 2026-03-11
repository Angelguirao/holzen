import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { CompanionSection, type CompanionData, type CompanionPrefs } from '@/components/CompanionSection';
import { CollapsibleReflectionHeader } from '@/components/pause/CollapsibleReflectionHeader';
import { ReflectionNote } from '@/components/ReflectionNote';
import { ReflectionTags } from '@/components/ReflectionTags';

interface Props {
  companions: CompanionData;
  companionPrefs: CompanionPrefs;
  severity: 'mild' | 'moderate' | 'high';
  reflectionId: string | null;
  context: string | null;
  reflectionMessage: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  subscribed: boolean;
  onContinue: () => void;
  onBack?: () => void;
}

export function PauseReflect({
  companions, companionPrefs, severity, reflectionId, context, reflectionMessage,
  isFavorite, onToggleFavorite, subscribed, onContinue, onBack,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      {/* Collapsible header with reflection message */}
      <CollapsibleReflectionHeader
        message={reflectionMessage}
        context={context}
        haiku={companions?.haiku ?? null}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        subscribed={subscribed}
      />

      {/* Note & tags — cognitive reappraisal tools */}
      {reflectionId && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <ReflectionNote reflectionId={reflectionId} initialNote={null} />
          <ReflectionTags reflectionId={reflectionId} initialTags={[]} />
        </motion.div>
      )}

      {/* Companions */}
      <CompanionSection
        companions={companions}
        prefs={companionPrefs}
        severity={severity}
        reflectionId={reflectionId}
        context={context}
        reflectionMessage={reflectionMessage}
      />

      {/* Continue */}
      <motion.div
        className="flex justify-center pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <button
          onClick={onContinue}
          className="text-[10px] font-mono text-primary/50 hover:text-primary/70 transition-colors duration-500 tracking-[0.15em] uppercase"
        >
          {t('pause.steps.continue', 'Continue')}
        </button>
      </motion.div>

      {/* Back link */}
      {onBack && (
        <motion.div
          className="flex justify-center pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/20 hover:text-muted-foreground/40 transition-colors duration-500 tracking-[0.12em] uppercase"
          >
            <ChevronLeft className="h-3 w-3" />
            {t('pause.steps.back', 'Back')}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
