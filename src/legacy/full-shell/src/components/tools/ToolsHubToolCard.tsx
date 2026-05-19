import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useProGate } from '@/features/subscription/public-hooks';
import { cn } from '@/lib/utils';
import type { ToolCatalogEntry } from '@/lib/tools-catalog';

type Props = {
  entry: ToolCatalogEntry;
  variant: 'spotlight' | 'compact';
};

export function ToolsHubToolCard({ entry, variant }: Props) {
  const { t } = useTranslation();
  const { isPro, isPending, requirePro } = useProGate();
  const Icon = entry.icon;
  const titleKey = entry.hubTitleKey ?? entry.labelKey;
  const showProBadge = !entry.free && !isPending && !isPro;

  return (
    <Link
      to={entry.to}
      onClick={(e) => {
        if (entry.free || isPro) return;
        e.preventDefault();
        requirePro(entry.proFeature ?? 'letters');
      }}
      className={cn(
        'group flex flex-col rounded-xl border border-border/50 bg-muted/15 p-3 transition-colors hover:bg-muted/35',
        variant === 'spotlight' && 'min-h-[132px]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/80',
            variant === 'spotlight' ? 'h-10 w-10' : 'h-8 w-8',
          )}
        >
          <Icon className={cn('text-secondary-foreground', variant === 'spotlight' ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
        </div>
        {showProBadge ? (
          <Badge
            variant="outline"
            className={cn(
              'h-5 shrink-0 border-amber-500/35 bg-amber-500/10 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200',
            )}
          >
            {t('tools.proShortBadge')}
          </Badge>
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground/70" />
        )}
      </div>
      <span className="mt-2 text-left text-sm font-medium text-foreground leading-snug">{t(titleKey)}</span>
      <p
        className={cn(
          'mt-1 text-left text-xs leading-snug text-muted-foreground line-clamp-3',
          variant === 'compact' && 'line-clamp-2',
        )}
      >
        {t(entry.blurbKey)}
      </p>
    </Link>
  );
}
