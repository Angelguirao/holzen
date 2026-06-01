import { differenceInDays } from 'date-fns';
import type { HoldGoalHeadlineGoal } from '@/features/user/domain/hold-goal-headline-goal';

export type { HoldGoalHeadlineGoal } from '@/features/user/domain/hold-goal-headline-goal';

type HeadlineT = (key: string, options?: Record<string, unknown>) => string;

function kindLabel(goalType: HoldGoalHeadlineGoal['type'], t: HeadlineT): string {
  if (goalType === 'forever') return t('holdGoal.forever');
  if (goalType === 'time') return t('holdGoal.time');
  return t('holdGoal.legacyPriceTitle', { defaultValue: 'Previous price target' });
}

/**
 * Single-line summary for legacy HoldGoalWidget wireframe title row (full-shell / journey).
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

  if (goal.type === 'price') {
    return `${label} · ${t('holdGoal.legacyPriceTitle', { defaultValue: 'Previous price target' })}`;
  }

  return null;
}
