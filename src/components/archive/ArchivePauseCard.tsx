import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PauseArchiveRow } from '@/hooks/use-pause-archive-list';

function previewText(row: PauseArchiveRow): string {
  const parts = [
    row.reflection_text,
    row.haiku_text,
    row.note_text,
    row.outcome,
    row.initial_mood,
  ].filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  const t = parts[0]?.trim() ?? '';
  return t.length > 140 ? `${t.slice(0, 140)}…` : t;
}

type Props = {
  row: PauseArchiveRow;
  echoesPresentation?: boolean;
};

export function ArchivePauseCard({ row, echoesPresentation = false }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const id = row.id;
  const when = row.terminal_at ?? row.created_at;
  const timeAgo = useMemo(() => {
    if (!when) return '';
    try {
      return formatDistanceToNow(new Date(when), { addSuffix: true });
    } catch {
      return '';
    }
  }, [when]);

  const preview = useMemo(() => previewText(row), [row]);

  if (!id) return null;

  return (
    <button
      type="button"
      onClick={() =>
        navigate('/pause', {
          state: {
            pauseInstanceId: id,
            severity:
              typeof row.context_snapshot === 'object' &&
              row.context_snapshot &&
              typeof (row.context_snapshot as { severity?: string }).severity === 'string'
                ? (row.context_snapshot as { severity: string }).severity
                : 'mild',
          },
        })
      }
      className={cn(
        'w-full rounded-xl border border-border/40 bg-card/40 px-3 py-3 text-left transition-colors hover:bg-card/70',
        echoesPresentation && 'border-dashed border-nox-text-highlight/35',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 rounded-full bg-muted/50 p-2 text-muted-foreground">
          <Pause className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
              {echoesPresentation
                ? t('archive.echoCardKind', { defaultValue: 'Echo' })
                : t('archive.pauseCardKind', { defaultValue: 'Pause' })}
            </p>
            {timeAgo ? (
              <span className="shrink-0 text-[10px] text-muted-foreground/70">{timeAgo}</span>
            ) : null}
          </div>
          <p className="text-xs font-medium text-foreground/90">
            {row.state
              ? t(`pause.state.${row.state}`, { defaultValue: String(row.state) })
              : t('archive.pauseUntitled', { defaultValue: 'Pause session' })}
          </p>
          {preview ? (
            <p className="line-clamp-3 text-xs leading-snug text-muted-foreground">{preview}</p>
          ) : (
            <p className="text-xs italic text-muted-foreground/60">
              {t('archive.noPreviewYet', { defaultValue: 'No summary yet' })}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
