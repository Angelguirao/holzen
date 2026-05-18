export type HoldGoalHeadlineGoal = {
  type: 'time' | 'price' | 'forever';
  start: string;
  targetMonths?: number | null;
  targetPrice?: number | null;
  currency: string;
};
