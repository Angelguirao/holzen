import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { holzenLog } from '@/lib/holzen-console';
import { pauseHomeErrorKind, pauseHomeErrorStrings } from '@/features/pause/public';
import { cn } from '@/lib/utils';

const tryAgainClassName =
  'text-sm font-medium text-nox-text-link underline-offset-4 transition-colors hover:text-nox-text-link/80 hover:underline';

interface HomePauseBlockingErrorPanelProps {
  error: string;
  onTryAgain: () => void;
  className?: string;
}

/** Shared blocking error UI for the Home pause widget and Zen Home layout. */
export function HomePauseBlockingErrorPanel({
  error,
  onTryAgain,
  className,
}: HomePauseBlockingErrorPanelProps) {
  const { t } = useTranslation();
  const { title, description } = pauseHomeErrorStrings(t, error);

  const handleTryAgain = () => {
    if (pauseHomeErrorKind(error) === 'persist') {
      holzenLog.home('Try again after pause persist error: manualTrigger');
    } else {
      holzenLog.home('Try again: manualTrigger');
    }
    onTryAgain();
  };

  return (
    <div className={cn(homeInWidget.errorPanel, className)}>
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-sm font-medium leading-snug">{title}</p>
      </div>
      {description ? <p className={homeInWidget.meta}>{description}</p> : null}
      <button type="button" onClick={handleTryAgain} className={tryAgainClassName}>
        {t('common.tryAgain')}
      </button>
    </div>
  );
}
