import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import type { RegenerateCompanionSlot } from '@/lib/companion-orchestrate-types';

/**
 * Maps an internal orchestrator slot name to the `companion_type` value
 * persisted in `reflection_companions.companion_type` (DB-facing).
 */
const DB_TYPE: Record<RegenerateCompanionSlot, string> = {
  signal: 'signal',
  grounding: 'ground_nudge',
  history: 'historical_insight',
  zoomOut: 'zoom_out_deep_time',
};

/**
 * Maps an internal orchestrator slot name to the Full View route prefix.
 * Kept here so the thread can deep-link directly to each card's own Full View.
 */
const ROUTE_PREFIX: Record<RegenerateCompanionSlot, string> = {
  signal: '/companion/signal',
  grounding: '/companion/grounding',
  history: '/companion/history',
  zoomOut: '/companion/zoom-out',
};

interface ThreadRow {
  id: string;
  reflection_id: string;
  created_at: string | null;
  content: { title?: string; body?: string; btcInsight?: string } | null;
}

interface Props {
  companion: RegenerateCompanionSlot;
  /** Reflection id we're currently viewing — excluded from the list. */
  currentReflectionId?: string | null;
  /** How many prior cards to show. Defaults to 5. */
  limit?: number;
  className?: string;
}

/**
 * Renders the user's last few cards of the same companion type, excluding the
 * current one. Lets the Full View double as a small personal archive so people
 * can see how their Signal / Ground / History / Zoom Out have evolved.
 *
 * Relies on `reflection_companions` RLS (the existing policy scopes rows to the
 * reflection's owner), so no explicit `user_id` filter is needed here.
 */
export function HistoryThread({ companion, currentReflectionId, limit = 5, className = '' }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState<ThreadRow[] | null>(null);

  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('reflection_companions')
        .select('id, reflection_id, created_at, content')
        .eq('companion_type', DB_TYPE[companion])
        .order('created_at', { ascending: false })
        .limit(limit + 1);

      if (cancelled) return;
      if (error || !data) {
        setRows([]);
        return;
      }
      const filtered = data
        .filter((r) => r.reflection_id !== currentReflectionId)
        .slice(0, limit);
      setRows(filtered as ThreadRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, companion, currentReflectionId, limit]);

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
                to={`${ROUTE_PREFIX[companion]}/${r.reflection_id}`}
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

/** Very small relative-date helper — avoids pulling `date-fns` into this chunk. */
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
