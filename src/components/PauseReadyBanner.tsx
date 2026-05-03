import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, X } from 'lucide-react';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

/**
 * A slide-in banner shown on non-Home pages when an auto-trigger fires.
 * Tapping navigates to Home where the pause widget is highlighted.
 */
export function PauseReadyBanner({ visible, onDismiss }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-2 bg-nox-background-accent/40 backdrop-blur-md border-b border-nox-border-default/60 px-4 py-2.5"
        >
          <button
            onClick={() => {
              onDismiss();
              navigate('/');
            }}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <div className="relative flex-shrink-0">
              <Pause className="h-3.5 w-3.5 text-nox-text-link/80" />
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-nox-text-highlight animate-pulse" />
            </div>
            <span className="text-xs font-sans font-medium text-foreground tracking-wide truncate">
              {t('home.pauseReady', { defaultValue: 'A pause is ready for you' })}
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="flex-shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t('common.dismiss', { defaultValue: 'Dismiss' })}
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
