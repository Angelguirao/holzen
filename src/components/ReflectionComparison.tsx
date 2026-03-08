import { useEffect, useState, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import { GitCompareArrows, TrendingDown, TrendingUp } from 'lucide-react';

interface ComparisonReflection {
  id: string;
  message: string;
  context: string | null;
  mood: string | null;
  outcome: string | null;
  tags: string[];
  created_at: string;
  note: string | null;
}

interface ReflectionComparisonProps {
  reflectionId: string;
  minAgeDays?: number;
}

function parseDirection(context: string | null): 'up' | 'down' | null {
  if (!context) return null;
  if (context.toLowerCase().includes('is down')) return 'down';
  if (context.toLowerCase().includes('is up')) return 'up';
  return null;
}

function parsePercent(context: string | null): string | null {
  if (!context) return null;
  const match = context.match(/(?:up|down)\s+(\d+\.?\d*)%/i);
  return match ? match[1] : null;
}

export const ReflectionComparison = forwardRef<HTMLDivElement, ReflectionComparisonProps>(function ReflectionComparison({ reflectionId, minAgeDays = 30 }, ref) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [current, setCurrent] = useState<ComparisonReflection | null>(null);
  const [past, setPast] = useState<ComparisonReflection | null>(null);
  const [loading, setLoading] = useState(true);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!user || !reflectionId) return;

    async function load() {
      setLoading(true);
      try {
        const { data: currentData } = await supabase
          .from('reflections')
          .select('id, message, context, mood, outcome, tags, created_at, note')
          .eq('id', reflectionId)
          .eq('user_id', user!.id)
          .single();

        if (!currentData) return;
        setCurrent(currentData as ComparisonReflection);

        const { data: pastData } = await supabase.rpc('find_similar_reflection', {
          _user_id: user!.id,
          _reflection_id: reflectionId,
          _min_age_days: minAgeDays,
        });

        if (pastData && Array.isArray(pastData) && pastData.length > 0) {
          setPast(pastData[0] as ComparisonReflection);
        }
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, reflectionId, minAgeDays]);

  if (loading || !current || !past) return null;

  const currentDir = parseDirection(current.context);
  const pastDir = parseDirection(past.context);
  const currentPct = parsePercent(current.context);
  const pastPct = parsePercent(past.context);
  const timeDiff = formatDistanceToNow(new Date(past.created_at), { addSuffix: false });

  const motionProps = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
      };

  return (
    <motion.div
      className="rounded-lg border border-border/50 bg-card/50 overflow-hidden"
      {...motionProps}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30">
        <GitCompareArrows className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground/50">
          {t('reflectionComparison.similarMoment', { time: timeDiff })}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border/30">
        <ComparisonCard
          label={t('reflectionComparison.then')}
          reflection={past}
          direction={pastDir}
          percent={pastPct}
          muted
          t={t}
        />
        <ComparisonCard
          label={t('reflectionComparison.now')}
          reflection={current}
          direction={currentDir}
          percent={currentPct}
          t={t}
        />
      </div>

      <GrowthInsight current={current} past={past} t={t} />
    </motion.div>
  );
});
ReflectionComparison.displayName = 'ReflectionComparison';

function ComparisonCard({
  label,
  reflection,
  direction,
  percent,
  muted = false,
  t,
}: {
  label: string;
  reflection: ComparisonReflection;
  direction: 'up' | 'down' | null;
  percent: string | null;
  muted?: boolean;
  t: (k: string, opts?: any) => string;
}) {
  const DirIcon = direction === 'down' ? TrendingDown : TrendingUp;
  const textClass = muted ? 'text-muted-foreground/70' : 'text-foreground';

  return (
    <div className="p-3 space-y-2.5">
      <div className="space-y-0.5">
        <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted-foreground/40">
          {label}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground/50">
          {format(new Date(reflection.created_at), 'MMM d, yyyy')}
        </p>
      </div>

      {direction && percent && (
        <div className="flex items-center gap-1">
          <DirIcon className={`h-2.5 w-2.5 ${direction === 'down' ? 'text-destructive/60' : 'text-primary/60'}`} />
          <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
            {direction === 'down' ? '−' : '+'}{percent}%
          </span>
        </div>
      )}

      <p className={`text-xs leading-relaxed line-clamp-4 ${textClass}`}>
        {reflection.message}
      </p>

      <div className="flex flex-wrap gap-1">
        {reflection.mood && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
            {t(`moodCheck.moods.${reflection.mood}`, reflection.mood)}
          </span>
        )}
        {reflection.outcome && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
            {t(`outcome.${reflection.outcome}`, reflection.outcome)}
          </span>
        )}
      </div>
    </div>
  );
}

function GrowthInsight({ current, past, t }: { current: ComparisonReflection; past: ComparisonReflection; t: (k: string) => string }) {
  const composureScale: Record<string, number> = {
    fomo: 1, greedy: 1, anxious: 2, fearful: 2,
    excited: 3, uncertain: 3, detached: 4, calm: 5,
  };
  const currentComposure = current.mood ? composureScale[current.mood] ?? -1 : -1;
  const pastComposure = past.mood ? composureScale[past.mood] ?? -1 : -1;

  const holdOutcomes = ['held', 'hold', 'nothing'];
  const currentHeld = current.outcome ? holdOutcomes.includes(current.outcome) : false;
  const pastHeld = past.outcome ? holdOutcomes.includes(past.outcome) : false;

  let insightKey: string | null = null;

  if (currentComposure > pastComposure && pastComposure >= 0) {
    insightKey = 'reflectionComparison.insightCalmer';
  } else if (currentHeld && !pastHeld) {
    insightKey = 'reflectionComparison.insightHeldSteady';
  } else if (currentHeld && pastHeld) {
    insightKey = 'reflectionComparison.insightConsistent';
  } else if (currentComposure >= 0 && pastComposure >= 0 && currentComposure === pastComposure) {
    insightKey = 'reflectionComparison.insightSimilar';
  }

  if (!insightKey) return null;

  return (
    <div className="px-3 py-2 border-t border-border/30 bg-muted/20">
      <p className="text-[10px] text-muted-foreground leading-relaxed italic">
        {t(insightKey)}
      </p>
    </div>
  );
}
