import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function CompanionError({ message, onRetry }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <p className="text-xs text-muted-foreground/50 italic">
        {message ?? t('companions.loadError', 'Couldn\'t load right now.')}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-[10px] font-mono text-primary/50 hover:text-primary/80 transition-colors shrink-0"
        >
          <RefreshCw className="h-3 w-3" />
          {t('common.retry', 'Retry')}
        </button>
      )}
    </div>
  );
}
