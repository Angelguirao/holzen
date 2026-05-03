import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HoldGoalWidget } from '@/components/HoldGoalWidget';
import { useHolzen } from '@/hooks/use-holzen';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { computeHoldGoalCompactHeadline, type HoldGoalHeadlineGoal } from '@/lib/hold-goal-headline';
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
  const prefersReduced = useReducedMotion();
  const [holdGoal, setHoldGoal] = useState<HoldGoalRow | null>(null);
  const [holdLoading, setHoldLoading] = useState(true);

  const loadHoldGoal = useCallback(async () => {
    if (!user) {
      setHoldGoal(null);
      setHoldLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('hold_goal_type, hold_goal_start, hold_goal_target_months, hold_goal_target_price, hold_goal_currency')
      .eq('user_id', user.id)
      .single();

    if (data?.hold_goal_type) {
      setHoldGoal({
        type: data.hold_goal_type as HoldGoalRow['type'],
        start: data.hold_goal_start,
        targetMonths: data.hold_goal_target_months,
        targetPrice: data.hold_goal_target_price,
        currency: data.hold_goal_currency || 'USD',
      });
    } else {
      setHoldGoal(null);
    }
    setHoldLoading(false);
  }, [user]);

  useEffect(() => {
    void loadHoldGoal();
  }, [loadHoldGoal]);

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
