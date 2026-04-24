import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import {
  dedupeBiases,
  type RelatedBias,
  type RelatedBiasesRow,
} from './related-biases-util';

interface Props {
  /** Pause instance currently viewed — excluded from the list. */
  currentPauseInstanceId?: string | null;
  /** Current card's title — excluded from the list (case-insensitive). */
  currentTitle?: string | null;
  className?: string;
}

/**
 * Grounding Full View only.
 *
 * Distinct-by-bias-title view of the last 30 days of Ground cards for this
 * user. Reads `pause_ai_artifacts` where `kind='ground_nudge'`. Scoped to
 * the caller via RLS on `pause_ai_artifacts`.
 */
export function RelatedBiasesThisMonth({
  currentPauseInstanceId,
  currentTitle,
  className = '',
}: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [biases, setBiases] = useState<RelatedBias[] | null>(null);

  useEffect(() => {
    if (!user) {
      setBiases([]);
      return;
    }
    let cancelled = false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    void (async () => {
      const { data, error } = await supabase
        .from('pause_ai_artifacts' as never)
        .select('pause_instance_id, created_at, content')
        .eq('user_id', user.id)
        .eq('kind', 'ground_nudge')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(40);

      if (cancelled) return;
      if (error || !data) {
        setBiases([]);
        return;
      }

      setBiases(
        dedupeBiases(data as unknown as RelatedBiasesRow[], {
          currentPauseInstanceId: currentPauseInstanceId ?? null,
          currentTitle: currentTitle ?? null,
          limit: 8,
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [user, currentPauseInstanceId, currentTitle]);

  if (!biases || biases.length === 0) return null;

  return (
    <section className={`space-y-2 ${className}`} aria-label={t('companions.fullview.grounding.relatedBiases.label')}>
      <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50">
        {t('companions.fullview.grounding.relatedBiases.heading')}
      </h3>
      <ul className="flex flex-wrap gap-1.5">
        {biases.map((b) => (
          <li key={`${b.pause_instance_id}-${b.title}`}>
            <Link
              to={`/companion/grounding/${b.pause_instance_id}`}
              state={{ from: 'related-biases' }}
              className="inline-block rounded-full border border-border/40 bg-background/30 px-2.5 py-1 text-[11px] text-muted-foreground/85 hover:text-foreground hover:border-border/70 transition-colors"
              title={b.title}
            >
              {b.title.length > 48 ? `${b.title.slice(0, 45)}…` : b.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
