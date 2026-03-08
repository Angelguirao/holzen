import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface HolzenNumberData {
  total: number;
  held_steady: number;
  percent: number;
  calculated_at: string;
}

/**
 * The Holzen Number — a public real-time metric:
 * "X% of Holzen users held steady today"
 */
export function HolzenNumber({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const [data, setData] = useState<HolzenNumberData | null>(null);
  const [loading, setLoading] = useState(true);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    async function fetch() {
      try {
        const { data: result, error } = await supabase.functions.invoke('holzen-number');
        if (!error && result) {
          setData(result as HolzenNumberData);
        }
      } catch {
        // silent — metric is non-critical
      } finally {
        setLoading(false);
      }
    }
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Don't render if no data or no reflections today
  if (loading || !data || data.total === 0) return null;

  const motionProps = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
      };

  if (variant === 'compact') {
    return (
      <motion.div
        className="flex items-center gap-2 text-muted-foreground"
        {...motionProps}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
        <p className="text-[10px] font-mono tracking-wide">
          <span className="text-foreground tabular-nums">{data.percent}%</span>
          {' '}held steady today
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="rounded-md border border-border/60 bg-muted/20 px-4 py-3 space-y-1.5"
      {...motionProps}
    >
      <div className="flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
        <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
          The Holzen Number
        </p>
      </div>
      <p className="text-lg font-mono tabular-nums text-foreground">
        {data.percent}%
      </p>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        of users held steady today · {data.total} reflection{data.total !== 1 ? 's' : ''} recorded
      </p>
    </motion.div>
  );
}
