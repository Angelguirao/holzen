import type { HolzenNumberData } from '@/features/user/infrastructure/edge/holzen-number-edge';

/** Archived — live “% pausing now” metric (active Home shows paused-today only). */
export function hasPausingNowStat(data: HolzenNumberData): boolean {
  return data.users_pausing_now > 0 || data.percent_pausing_now > 0;
}
