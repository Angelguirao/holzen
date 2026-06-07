import { AnimatePresence, motion } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type HomePauseHelpFeedbackThankYouProps = {
  visible: boolean;
  onDismiss: () => void;
};

/** Figma 584 — inline thank-you banner after submitting pause help feedback. */
export function HomePauseHelpFeedbackThankYou({ visible, onDismiss }: HomePauseHelpFeedbackThankYouProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 pointer-events-none"
        >
          <div
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-sm text-emerald-50 shadow-lg"
          >
            <Heart className="h-4 w-4 shrink-0 fill-emerald-400 text-emerald-400" aria-hidden />
            <p className="flex-1 leading-snug">{t('home.pauseHelpFeedback.thankYou')}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 rounded-sm opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label={t('home.pauseHelpFeedback.dismissThankYou')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
