import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { getHolzenNumberQueryOptions } from '@/features/user/public-queries';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';

/**
 * The Holzen Number — a public real-time metric:
 * "X% of Holzen users held steady today"
 */
export function HolzenNumber({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const prefersReduced = useReducedMotion();
  const { data, isPending } = useQuery(getHolzenNumberQueryOptions());

  // Don't render if no data or no users in today's aggregate sample
  if (isPending || !data || data.total === 0) return null;

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
        className="flex items-center text-muted-foreground py-1"
        {...motionProps}
      >
        <p className={homeInWidget.meta}>
          <span className="font-semibold tabular-nums text-foreground">{data.percent}%</span>
          {' '}
          held steady today
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`${homeInWidget.inset} space-y-1.5`}
      {...motionProps}
    >
      <div className="flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
        <p className={homeInWidget.kicker}>The Holzen Number</p>
      </div>
      <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">{data.percent}%</p>
      <p className={homeInWidget.meta}>
        of users held steady today · {data.total} pause{data.total !== 1 ? 's' : ''} recorded
      </p>
    </motion.div>
  );
}
