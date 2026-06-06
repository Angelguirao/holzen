import type { MarketQuote } from '@/features/market/public';
import type { CompanionData } from '@/features/pause/domain/companion-card-types';
import type { ManualPauseTriggerResult } from '@/features/pause/domain/manual-pause-trigger-result';
/** Pause + market orchestration shared across Home shell and `/pause` (not full user profile). */
export type PauseHomeContextValue = {
  marketData: MarketQuote | null;
  /** @deprecated Use marketData — kept for legacy `@/legacy` callers via `useHolzen()`. */
  btcData: MarketQuote | null;
  message: string | null;
  context: string | null;
  companions: CompanionData;
  severity: 'mild' | 'moderate' | 'high';
  lastPauseInstanceId: string | null;
  openPauseState: 'active' | 'engaged' | null;
  contextSnapshot: Record<string, unknown> | null;
  hasReflectionStep: boolean;
  hasOpenPauseStepEvents: boolean;
  hasReachedReflect: boolean;
  isBriefRitual: boolean;
  openPauseCreatedAt: string | null;
  loading: boolean;
  error: string | null;
  newPauseArrival: boolean;
  clearNewPauseArrival: () => void;
  dismissMessage: () => void | Promise<void>;
  manualTrigger: (mood?: string) => Promise<ManualPauseTriggerResult>;
  manualCooldownRemaining: number;
  autoCooldownRemaining: number;
  nextCronCheckIn: () => number;
  resyncOpenPauseFromDb: () => void | Promise<void>;
};
