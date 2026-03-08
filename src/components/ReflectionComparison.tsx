import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, useReducedMotion } from 'framer-motion';
import { GitCompareArrows, ArrowDown, ArrowUp, TrendingDown, TrendingUp } from 'lucide-react';

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
  /** The current/recent reflection to compare from */
  reflectionId: string;
  /** Minimum age in days for the comparison reflection (default 30) */
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

const moodLabels: Record<string, string> = {
  fomo: '🤯 FOMO',
  excited: '🚀 Excited',
  greedy: '🤑 Greedy',
  anxious: '😰 Anxious',
  calm: '😌 Calm',
  detached: '🧊 Detached',
  uncertain: '🤔 Uncertain',
  fearful: '😨 Fearful',
};

const outcomeLabels: Record<string, string> = {
  held: 'Held',
  hold: 'Held',
  sold: 'Sold',
  bought: 'Bought',
  nothing: 'Did nothing',
};

export function ReflectionComparison({ reflectionId, minAgeDays = 30 }: ReflectionComparisonProps) {
  const { user } = useAuth();
  const [current, setCurrent] = useState<ComparisonReflection | null>(null);
  const [past, setPast] = useState<ComparisonReflection | null>(null);
  const [loading, setLoading] = useState(true);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!user || !reflectionId) return;

    async function load() {
      setLoading(true);
      try {
        // Fetch current reflection
        const { data: currentData } = await supabase
          .from('reflections')
          .select('id, message, context, mood, outcome, tags, created_at, note')
          .eq('id', reflectionId)
          .eq('user_id', user!.id)
          .single();

        if (!currentData) return;
        setCurrent(currentData as ComparisonReflection);

        // Find similar past reflection via RPC
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
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30">
        <GitCompareArrows className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-muted-foreground/50">
          Similar moment · {timeDiff} ago
        </span>
      </div>

      {/* Side-by-side */}
      <div className="grid grid-cols-2 divide-x divide-border/30">
        {/* Past reflection */}
        <ComparisonCard
          label="Then"
          reflection={past}
          direction={pastDir}
          percent={pastPct}
          muted
        />

        {/* Current reflection */}
        <ComparisonCard
          label="Now"
          reflection={current}
          direction={currentDir}
          percent={currentPct}
        />
      </div>

      {/* Growth insight */}
      <GrowthInsight current={current} past={past} />
    </motion.div>
  );
}

function ComparisonCard({
  label,
  reflection,
  direction,
  percent,
  muted = false,
}: {
  label: string;
  reflection: ComparisonReflection;
  direction: 'up' | 'down' | null;
  percent: string | null;
  muted?: boolean;
}) {
  const DirIcon = direction === 'down' ? TrendingDown : TrendingUp;
  const textClass = muted ? 'text-muted-foreground/70' : 'text-foreground';

  return (
    <div className="p-3 space-y-2.5">
      {/* Label + date */}
      <div className="space-y-0.5">
        <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted-foreground/40">
          {label}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground/50">
          {format(new Date(reflection.created_at), 'MMM d, yyyy')}
        </p>
      </div>

      {/* BTC context */}
      {direction && percent && (
        <div className="flex items-center gap-1">
          <DirIcon className={`h-2.5 w-2.5 ${direction === 'down' ? 'text-destructive/60' : 'text-primary/60'}`} />
          <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
            {direction === 'down' ? '−' : '+'}{percent}%
          </span>
        </div>
      )}

      {/* Message excerpt */}
      <p className={`text-xs leading-relaxed line-clamp-4 ${textClass}`}>
        {reflection.message}
      </p>

      {/* Mood + Outcome badges */}
      <div className="flex flex-wrap gap-1">
        {reflection.mood && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
            {moodLabels[reflection.mood] || reflection.mood}
          </span>
        )}
        {reflection.outcome && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
            {outcomeLabels[reflection.outcome] || reflection.outcome}
          </span>
        )}
      </div>
    </div>
  );
}

function GrowthInsight({ current, past }: { current: ComparisonReflection; past: ComparisonReflection }) {
  const moodOrder = ['anxious', 'neutral', 'calm'];
  const currentMoodIdx = current.mood ? moodOrder.indexOf(current.mood) : -1;
  const pastMoodIdx = past.mood ? moodOrder.indexOf(past.mood) : -1;

  const holdOutcomes = ['held', 'hold', 'nothing'];
  const currentHeld = current.outcome ? holdOutcomes.includes(current.outcome) : false;
  const pastHeld = past.outcome ? holdOutcomes.includes(past.outcome) : false;

  let insight: string | null = null;

  if (currentMoodIdx > pastMoodIdx && pastMoodIdx >= 0) {
    insight = 'You were calmer this time facing similar conditions.';
  } else if (currentHeld && !pastHeld) {
    insight = 'You held steady this time — last time you acted on impulse.';
  } else if (currentHeld && pastHeld) {
    insight = 'Consistent composure — you held steady both times.';
  } else if (currentMoodIdx >= 0 && pastMoodIdx >= 0 && currentMoodIdx === pastMoodIdx) {
    insight = 'Similar emotional response — your patterns are consistent.';
  }

  if (!insight) return null;

  return (
    <div className="px-3 py-2 border-t border-border/30 bg-muted/20">
      <p className="text-[10px] text-muted-foreground leading-relaxed italic">
        {insight}
      </p>
    </div>
  );
}
