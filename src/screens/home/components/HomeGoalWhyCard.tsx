import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HoldGoalWidget } from '@/app/components/HoldGoalWidget';
import { useHolzen } from '@/screens/home/hooks/use-holzen';
import { useAuth } from '@/hooks/use-auth';
import { getProfileRowQueryOptions } from '@/features/user/public-queries';
import {
  computeHoldGoalCompactHeadline,
  type HoldGoalHeadlineGoal,
} from '@/features/user/public';
import { cn } from '@/lib/utils';

type HoldGoalRow = HoldGoalHeadlineGoal;

/**
 * Home “why + hold” card: header row gets a **compact hold summary** (Figma); body shows
 * motivations always; chevron reveals full hold goal wireframe.
 */
export function HomeGoalWhyCard({
  currentPrice,
  detailsExpanded,
  onHoldGoalSummaryChange,
}: {
  currentPrice?: number;
  detailsExpanded: boolean;
  onHoldGoalSummaryChange?: (summary: string | null) => void;
}) {
  const { t } = useTranslation();
  const { motivations } = useHolzen();
  const { user } = useAuth();
  const userId = user?.id;
  const prefersReduced = useReducedMotion();

  const { data: profileRow, status: profileQueryStatus } = useQuery(getProfileRowQueryOptions(userId));

  const holdLoading = Boolean(userId && profileQueryStatus !== 'success' && profileQueryStatus !== 'error');

  const holdGoal = useMemo((): HoldGoalRow | null => {
    if (!userId || profileQueryStatus !== 'success' || !profileRow?.hold_goal_type) return null;
    return {
      type: profileRow.hold_goal_type as HoldGoalRow['type'],
      start: profileRow.hold_goal_start,
      targetMonths: profileRow.hold_goal_target_months,
      targetPrice: profileRow.hold_goal_target_price,
      currency: profileRow.hold_goal_currency || 'USD',
    };
  }, [userId, profileQueryStatus, profileRow]);

  const motivationLine = useMemo(
    () => motivations.map((m) => t(`settings.motivations.${m}`, m)).join(' \u00B7 '),
    [motivations, t],
  );

  useEffect(() => {
    if (holdLoading) {
      onHoldGoalSummaryChange?.(null);
      return;
    }
    const summary = computeHoldGoalCompactHeadline(holdGoal, { currentPrice, t });
    onHoldGoalSummaryChange?.(summary);
  }, [holdGoal, holdLoading, currentPrice, t, onHoldGoalSummaryChange]);

  return (
    <div className="space-y-4">
      {motivationLine ? (
        <p className="text-xs font-medium italic tracking-wide text-muted-foreground">{motivationLine}</p>
      ) : null}

      <AnimatePresence initial={false}>
        {detailsExpanded ? (
          <motion.div
            key="goal-why-hold"
            initial={prefersReduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={cn(motivationLine && 'border-t border-border/30 pt-4')}>
              <HoldGoalWidget
                currentPrice={currentPrice}
                variant="wireframe"
                wireframeDetailsExpanded
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
