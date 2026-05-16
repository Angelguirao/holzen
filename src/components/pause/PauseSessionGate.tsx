import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

type HydrationStatus = 'ready' | 'fetch' | 'empty';

interface Props {
  /** True when `/pause` has an instance id and/or reflection copy to enter the ritual (reflection may generate at Reflect). */
  shellReady: boolean;
  phase: 'session' | 'done';
  waitingForFetch: boolean;
  fetchFailed: boolean;
  hydrationStatus: HydrationStatus;
  profileLoaded: boolean;
  onReturn: () => void;
  children: ReactNode;
}

/**
 * Full-screen loading / error / empty states before the pause ritual shell renders.
 */
export function PauseSessionGate({
  shellReady,
  phase,
  waitingForFetch,
  fetchFailed,
  hydrationStatus,
  profileLoaded,
  onReturn,
  children,
}: Props) {
  const { t } = useTranslation();

  if (!shellReady && phase !== 'done') {
    if (waitingForFetch) {
      return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <motion.div className="text-center space-y-4">
            <p className="text-sm font-mono text-muted-foreground">
              {t('common.loading', { defaultValue: 'Loading...' })}
            </p>
          </motion.div>
        </motion.div>
      );
    }

    if (hydrationStatus === 'fetch' && fetchFailed) {
      return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <motion.div className="text-center space-y-4 max-w-sm px-4">
            <p className="text-sm font-mono text-muted-foreground">
              {t('pause.couldNotLoadPause', {
                defaultValue:
                  'We could not load this pause. It may have been removed or you may need to sign in again.',
              })}
            </p>
            <button
              type="button"
              onClick={onReturn}
              className="text-xs font-sans font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 underline"
            >
              {t('pause.return')}
            </button>
          </motion.div>
        </motion.div>
      );
    }

    if (!profileLoaded && hydrationStatus === 'empty') {
      return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <motion.div className="text-center space-y-4">
            <p className="text-sm font-mono text-muted-foreground">
              {t('common.loading', { defaultValue: 'Loading...' })}
            </p>
          </motion.div>
        </motion.div>
      );
    }

    return (
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <motion.div className="text-center space-y-4 max-w-sm px-4">
          <p className="text-sm font-medium text-foreground">
            {t('pause.sessionEmptyTitle', {
              defaultValue: 'No pause to open',
            })}
          </p>
          <p className="text-sm font-mono text-muted-foreground leading-relaxed">
            {t('pause.sessionEmptyBody', {
              defaultValue:
                'Start from Home with “I need a pause,” or open one from a pause-ready notification.',
            })}
          </p>
          <button
            type="button"
            onClick={onReturn}
            className="text-xs font-sans font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 underline"
          >
            {t('pause.return')}
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
