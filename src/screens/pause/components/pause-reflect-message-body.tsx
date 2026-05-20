import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { HomePauseBlockingErrorPanel } from '@/screens/home/components/HomePauseBlockingErrorPanel';
import { resolvePauseReflectMessageView } from '@/screens/pause/lib/resolve-pause-reflect-message-view';

export type PauseReflectMessageBodyProps = {
  context: string | null;
  reflectionMessage: string;
  reflectionLoading: boolean;
  reflectionError: string | null;
  onReflectionRetry?: () => void;
  artifactHaiku: string | null | undefined;
};

/** Reflection card main copy: context, error/loading/body, optional haiku line. */
export function PauseReflectMessageBody({
  context,
  reflectionMessage,
  reflectionLoading,
  reflectionError,
  onReflectionRetry,
  artifactHaiku,
}: PauseReflectMessageBodyProps) {
  const { t } = useTranslation();
  const view = resolvePauseReflectMessageView({ reflectionError, reflectionLoading, reflectionMessage });

  return (
    <div className="min-w-0 flex-1 space-y-2">
      {context?.trim() ? (
        <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">{context.trim()}</p>
      ) : null}
      {view === 'error' ? (
        <HomePauseBlockingErrorPanel error={reflectionError!} onTryAgain={() => onReflectionRetry?.()} />
      ) : null}
      {view === 'loading' ? (
        <div className="space-y-2" aria-busy="true">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            <p className="font-mono text-xs">
              {t('pause.reflect.generating', { defaultValue: 'Generating reflection…' })}
            </p>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ) : null}
      {view === 'body' ? (
        <p className="font-editorial text-base leading-relaxed text-foreground sm:text-lg">{reflectionMessage}</p>
      ) : null}
      {artifactHaiku?.trim() ? (
        <p className="pt-1 text-sm italic leading-relaxed text-muted-foreground">{artifactHaiku.trim()}</p>
      ) : null}
    </div>
  );
}
