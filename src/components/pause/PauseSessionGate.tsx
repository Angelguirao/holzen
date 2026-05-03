import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

type HydrationStatus = 'ready' | 'fetch' | 'empty';

interface Props {
  hasMessage: boolean;
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
  hasMessage,
  phase,
  waitingForFetch,
  fetchFailed,
  hydrationStatus,
  profileLoaded,
  onReturn,
  children,
}: Props) {
  const { t } = useTranslation();

  if (!hasMessage && phase !== 'done') {
    if (waitingForFetch) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <p className="text-sm font-mono text-muted-foreground">
              {t('common.loading', { defaultValue: 'Loading...' })}
            </p>
          </div>
        </div>
      );
    }

    if (hydrationStatus === 'fetch' && fetchFailed) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-center space-y-4 max-w-sm px-4">
            <p className="text-sm font-mono text-muted-foreground">
              {t('pause.couldNotLoadPause', {
                defaultValue:
                  'We could not load this pause. It may have been removed or you may need to sign in again.',
              })}
            </p>
            <button type="button" onClick={onReturn} className="text-xs font-sans font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 underline">
              {t('pause.return')}
            </button>
          </div>
        </div>
      );
    }

    if (!profileLoaded && hydrationStatus === 'empty') {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <p className="text-sm font-mono text-muted-foreground">
              {t('common.loading', { defaultValue: 'Loading...' })}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-sm font-mono text-muted-foreground">{t('pause.noReflection')}</p>
          <button type="button" onClick={onReturn} className="text-xs font-sans font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 underline">
            {t('pause.return')}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
