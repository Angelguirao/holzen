import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import type { RegenerateCompanionSlot } from '@/features/pause/public';
import { getHistoryThreadQueryOptions, type HistoryThreadRow } from '@/features/pause/public';

/**
 * Maps an internal orchestrator slot name to the Full View route prefix.
 */
const ROUTE_PREFIX: Record<RegenerateCompanionSlot, string> = {
  signal: '/companion/signal',
  grounding: '/companion/grounding',
  history: '/companion/history',
  zoomOut: '/companion/zoom-out',
};

interface Props {
  companion: RegenerateCompanionSlot;
  /** Pause instance currently viewed — excluded from the list. */
  currentPauseInstanceId?: string | null;
  /** How many prior cards to show. Defaults to 5. */
  limit?: number;
  className?: string;
}

/**
 * Renders the user's last few cards of the same companion type, excluding
 * the current one. Reads from `pause_ai_artifacts`.
 */
export function HistoryThread({
  companion,
  currentPauseInstanceId,
  limit = 5,
  className = '',
}: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: rawRows } = useQuery(
    getHistoryThreadQueryOptions({ userId, companion, limit }),
  );

  const rows = useMemo((): HistoryThreadRow[] | null => {
    if (!userId) return null;
    if (rawRows === undefined) return null;
    return rawRows
      .filter((r) => r.pause_instance_id !== currentPauseInstanceId)
      .slice(0, limit);
  }, [userId, rawRows, currentPauseInstanceId, limit]);

  if (!rows || rows.length === 0) return null;

  return (
    <section className={`space-y-2 ${className}`}>
      <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50">
        {t(`companions.fullview.thread.heading.${companion}`)}
      </h2>
      <ul className="space-y-1.5">
        {rows.map((r) => {
          const title = r.content?.title ?? t('companions.fullview.thread.untitled');
          const when = r.created_at ? formatRelativeDay(r.created_at) : '';
          return (
            <li key={r.id}>
              <Link
                to={`${ROUTE_PREFIX[companion]}/${r.pause_instance_id}`}
                state={{ from: 'thread' }}
                className="group flex items-baseline justify-between gap-3 py-1 text-xs text-foreground/75 hover:text-foreground transition-colors"
              >
                <span className="truncate">{title}</span>
                <span className="shrink-0 text-[10px] font-mono text-muted-foreground/40 group-hover:text-muted-foreground/60">
                  {when}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function formatRelativeDay(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const day = 86_400_000;
  if (diffMs < day) return 'today';
  if (diffMs < 2 * day) return 'yesterday';
  const days = Math.floor(diffMs / day);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
