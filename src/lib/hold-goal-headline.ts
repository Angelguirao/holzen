import { differenceInDays } from 'date-fns';
import { formatBtcPrice } from '@/lib/btc';

export type HoldGoalHeadlineGoal = {
  type: 'time' | 'price' | 'forever';
  start: string;
  targetMonths?: number | null;
  targetPrice?: number | null;
  currency: string;
};

type HeadlineT = (key: string, options?: Record<string, unknown>) => string;

function kindLabel(goalType: HoldGoalHeadlineGoal['type'], t: HeadlineT): string {
  if (goalType === 'forever') return t('holdGoal.forever');
  if (goalType === 'time') return t('holdGoal.time');
  return t('holdGoal.price');
}

/**
 * Single-line summary for Home section header and HoldGoalWidget wireframe title row
 * (e.g. `Forever · 1y 2d and counting`).
 */
export function computeHoldGoalCompactHeadline(
  goal: HoldGoalHeadlineGoal | null,
  opts: { currentPrice?: number; t: HeadlineT },
): string | null {
  if (!goal) return null;
  const { currentPrice, t } = opts;
  const label = kindLabel(goal.type, t);

  if (goal.type === 'forever') {
    const start = new Date(goal.start);
    const elapsed = differenceInDays(new Date(), start);
    const years = Math.floor(elapsed / 365);
    const days = elapsed % 365;
    const duration =
      years > 0 ? `${years}y ${days}d` : `${elapsed} day${elapsed !== 1 ? 's' : ''}`;
    return `${label} · ${duration} ${t('holdGoal.andCounting')}`;
  }

  if (goal.type === 'time' && goal.targetMonths) {
    const start = new Date(goal.start);
    const totalDays = goal.targetMonths * 30;
    const elapsed = differenceInDays(new Date(), start);
    const remaining = Math.max(totalDays - elapsed, 0);
    const completed = remaining === 0;
    const metric = completed ? t('holdGoal.goalReached') : t('holdGoal.daysToGo', { count: remaining });
    return `${label} · ${metric}`;
  }

  if (goal.type === 'price' && goal.targetPrice) {
    const target = goal.targetPrice;
    const price = currentPrice ?? 0;
    const reached = price >= target;
    const diff = target - price;
    const metric = reached
      ? t('holdGoal.targetReached')
      : `${formatBtcPrice(diff, goal.currency)} ${t('holdGoal.toGo')}`;
    return `${label} · ${metric}`;
  }

  return null;
}
