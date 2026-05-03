import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { format, isToday, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import type { PauseArchiveRow } from '@/hooks/use-pause-archive-list';
import { ArchivePauseCard } from './ArchivePauseCard';

type DateGroup = { key: string; label: string; items: PauseArchiveRow[] };

function sortKey(row: PauseArchiveRow): string {
  return row.terminal_at ?? row.created_at ?? '';
}

function groupByCalendarDay(items: PauseArchiveRow[], t: (k: string, o?: { defaultValue?: string }) => string): DateGroup[] {
  const buckets = new Map<number, PauseArchiveRow[]>();
  items.forEach((row) => {
    const raw = sortKey(row);
    if (!raw) return;
    const day = startOfDay(new Date(raw)).getTime();
    const arr = buckets.get(day) ?? [];
    arr.push(row);
    buckets.set(day, arr);
  });
  const keys = [...buckets.keys()].sort((a, b) => b - a);
  return keys.map((ts) => {
    const d = new Date(ts);
    const label = isToday(d) ? t('library.dateToday') : format(d, 'dd/MM/yy');
    return { key: String(ts), label, items: buckets.get(ts)! };
  });
}

type Props = {
  rows: PauseArchiveRow[];
  filtered: PauseArchiveRow[];
  loading: boolean;
  listLoadFailed: boolean;
  refetch: () => Promise<void>;
  echoesPresentation?: boolean;
  emptyStateMessage?: string;
  emptyStateHint?: string;
  emptyCtaLabel?: string;
  emptyCtaTo?: string;
};

export function ArchivePauseItems({
  rows,
  filtered,
  loading,
  listLoadFailed,
  refetch,
  echoesPresentation = false,
  emptyStateMessage,
  emptyStateHint,
  emptyCtaLabel,
  emptyCtaTo,
}: Props) {
  const { t } = useTranslation();

  const groups = useMemo(() => groupByCalendarDay(filtered, t), [filtered, t]);

  return (
    <div className="flex flex-col">
      <div>
        {loading && filtered.length === 0 && !listLoadFailed ? (
          <div className="flex justify-center py-16" role="status" aria-busy="true" aria-label={t('common.loading')}>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
          </div>
        ) : listLoadFailed && filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-12 px-4 text-center">
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{t('archive.loadFailed')}</p>
            <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()}>
              {t('common.retry', { defaultValue: 'Retry' })}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="space-y-3 py-12 px-2 text-center">
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {emptyStateMessage ?? t('archive.emptyDefault')}
            </p>
            {emptyStateHint ? <p className="text-xs text-muted-foreground/60">{emptyStateHint}</p> : null}
            {emptyCtaLabel && emptyCtaTo ? (
              <Link to={emptyCtaTo} className="inline-block text-sm font-semibold text-foreground underline-offset-4 hover:underline">
                {emptyCtaLabel}
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.key} className="space-y-0.5">
                <p className="px-3 pb-1 text-sm font-sans font-normal uppercase tracking-wider text-[#dbb266]">
                  {group.label}
                </p>
                <div className="space-y-3">
                  {group.items.map((row, i) => (
                    <motion.div
                      key={row.id ?? String(i)}
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ArchivePauseCard row={row} echoesPresentation={echoesPresentation} />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
