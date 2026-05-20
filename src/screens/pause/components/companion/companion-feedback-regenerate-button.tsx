import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type CompanionFeedbackRegenerateButtonProps = {
  compact?: boolean;
  regenBusy: boolean;
  onClick: () => void;
};

/** Regenerate companion slot (icon-only compact or labeled default). */
export function CompanionFeedbackRegenerateButton({
  compact = false,
  regenBusy,
  onClick,
}: CompanionFeedbackRegenerateButtonProps) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={regenBusy}
        className="p-0.5 rounded transition-colors text-muted-foreground/25 hover:text-nox-text-link/70 disabled:opacity-30"
        aria-label={t('companions.regenerate')}
        title={t('companions.regenerate')}
      >
        <RefreshCw className={`h-2.5 w-2.5 ${regenBusy ? 'animate-spin' : ''}`} />
      </button>
    );
  }

  return (
    <>
      <span className="text-[9px] text-muted-foreground/20 font-mono hidden sm:inline">·</span>
      <button
        type="button"
        onClick={onClick}
        disabled={regenBusy}
        className="inline-flex items-center gap-1 text-[9px] font-sans font-medium text-muted-foreground/40 hover:text-nox-text-link/80 disabled:opacity-40 transition-colors"
      >
        <RefreshCw className={`h-3 w-3 ${regenBusy ? 'animate-spin' : ''}`} />
        {regenBusy ? t('companions.regenerating') : t('companions.regenerate')}
      </button>
    </>
  );
}
