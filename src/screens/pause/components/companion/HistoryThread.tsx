import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RegenerateCompanionSlot } from '@/features/pause/public';
import { formatCompanionHistoryRelativeDay } from '@/features/pause/public';
import { useCompanionHistoryThread } from '@/features/pause/public-hooks';

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
  const { rows } = useCompanionHistoryThread({ companion, currentPauseInstanceId, limit });

  if (!rows || rows.length === 0) return null;

  return (
    <section className={`space-y-2 ${className}`}>
      <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50">
        {t(`companions.fullview.thread.heading.${companion}`)}
      </h2>
      <ul className="space-y-1.5">
        {rows.map((r) => {
          const title = r.content?.title ?? t('companions.fullview.thread.untitled');
          const when = r.created_at ? formatCompanionHistoryRelativeDay(r.created_at) : '';
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
