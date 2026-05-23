import { useTranslation } from 'react-i18next';
import { RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PauseBriefIntegrateActionsProps = {
  deepPauseLocked: boolean;
  onRepeatBreaths: () => void;
  onSwitchToDeepPause: () => void;
  onUserNavigate: () => void;
};

/** Brief integrate: repeat breaths or switch to deep pause. */
export function PauseBriefIntegrateActions({
  deepPauseLocked,
  onRepeatBreaths,
  onSwitchToDeepPause,
  onUserNavigate,
}: PauseBriefIntegrateActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <button
        type="button"
        onClick={() => {
          onUserNavigate();
          onRepeatBreaths();
        }}
        className="flex items-center justify-center gap-2 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
      >
        <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
        {t('pause.brief.integrate.repeatBreaths')}
      </button>
      <button
        type="button"
        disabled={deepPauseLocked}
        title={
          deepPauseLocked
            ? t('pause.depthPicker.deep.proRequiredHint', { defaultValue: 'Pro or free trial' })
            : undefined
        }
        onClick={() => {
          if (deepPauseLocked) return;
          onUserNavigate();
          onSwitchToDeepPause();
        }}
        className={cn(
          'flex items-center justify-center gap-2 text-sm font-semibold transition-opacity',
          deepPauseLocked ? 'cursor-not-allowed text-muted-foreground opacity-60' : 'text-primary hover:opacity-90',
        )}
      >
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
        {t('pause.brief.integrate.switchDeep')}
      </button>
      {deepPauseLocked ? (
        <p className="text-center text-xs text-muted-foreground">{t('pause.brief.integrate.switchDeepLockedHint')}</p>
      ) : null}
    </div>
  );
}
