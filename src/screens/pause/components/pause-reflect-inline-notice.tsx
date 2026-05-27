import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';

export type PauseReflectInlineNoticeProps = {
  message: string;
  onTryAgain?: () => void;
};

/** Subtle Reflect-step notice (live generation failed; fallback copy is still shown). */
export function PauseReflectInlineNotice({ message, onTryAgain }: PauseReflectInlineNoticeProps) {
  "use memo";
  const { t } = useTranslation();

  return (
    <div
      className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5"
    >
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm leading-snug text-foreground">{message}</p>
          {onTryAgain ? (
            <button
              type="button"
              onClick={onTryAgain}
              className="text-sm font-medium text-nox-text-link underline-offset-4 hover:underline"
            >
              {t('common.tryAgain')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
