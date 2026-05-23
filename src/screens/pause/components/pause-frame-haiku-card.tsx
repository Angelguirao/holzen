import { useTranslation } from 'react-i18next';
import { ChevronDown, Heart, ImageIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { hapticFeedback } from '@/lib/haptics';
import { cn } from '@/lib/utils';

export type PauseFrameHaikuCardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscribed: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  haikuFetch: 'idle' | 'loading' | 'done' | 'error';
  displayBody: string;
};

/** Collapsible haiku card on the deep pause Frame step. */
export function PauseFrameHaikuCard({
  open,
  onOpenChange,
  subscribed,
  isFavorite,
  onToggleFavorite,
  haikuFetch,
  displayBody,
}: PauseFrameHaikuCardProps) {
  const { t } = useTranslation();

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="overflow-hidden rounded-lg border-2 border-primary bg-background transition-colors">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-expanded={open}
            aria-label={t('pause.frame.toggleHaikuAria', { defaultValue: 'Expand or collapse haiku' })}
            onClick={() => hapticFeedback('light')}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/5">
                <ImageIcon className="h-5 w-5 text-primary" aria-hidden />
              </span>
              <span className="truncate">{t('pause.frame.haikuLabel', { defaultValue: 'Haiku' })}</span>
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                open && 'rotate-180',
              )}
              aria-hidden
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {subscribed ? (
            <div className="flex items-center justify-end gap-2 border-t border-border/40 px-4 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('pause.frame.haikuSeen', { defaultValue: 'Seen' })}
              </span>
              <button
                type="button"
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                aria-label={t('pause.frame.favoriteHaikuAria', { defaultValue: 'Favorite' })}
                onClick={(e) => {
                  e.preventDefault();
                  hapticFeedback('light');
                  onToggleFavorite();
                }}
              >
                <Heart className={cn('h-4 w-4', isFavorite && 'fill-current text-destructive')} aria-hidden />
              </button>
            </div>
          ) : null}
          {haikuFetch === 'loading' ? (
            <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
              {t('pause.frame.haikuLoading', { defaultValue: 'Loading…' })}
            </p>
          ) : (
            <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{displayBody}</p>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
