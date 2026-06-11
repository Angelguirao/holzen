import type { MarketQuote } from '@/features/market/public';
import type { CompanionData } from '@/features/pause/domain/companion-card-types';
import type { ManualPauseTriggerOptions } from '@/features/pause/domain/manual-pause-trigger-options';
import type { ManualPauseTriggerResult } from '@/features/pause/domain/manual-pause-trigger-result';
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
  openPauseSource: string | null;
  contextSnapshot: Record<string, unknown> | null;
  hasReflectionStep: boolean;
  hasOpenPauseStepEvents: boolean;
  hasReachedReflect: boolean;
  isBriefRitual: boolean;
  openPauseCreatedAt: string | null;
  openPauseEngagedAt: string | null;
  openPauseMetadata: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
  newPauseArrival: boolean;
  clearNewPauseArrival: () => void;
  dismissMessage: () => void | Promise<void>;
  /** Home “Your pause” widget discard — optimistic clear + undo snackbar before RPC. */
  dismissOpenPauseFromWidget: () => void;
  manualTrigger: (
    mood?: string,
    options?: ManualPauseTriggerOptions,
  ) => Promise<ManualPauseTriggerResult>;
  manualCooldownRemaining: number;
  nextCronCheckIn: () => number;
  resyncOpenPauseFromDb: () => void | Promise<void>;
};
