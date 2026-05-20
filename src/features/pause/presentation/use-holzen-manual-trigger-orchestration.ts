import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import type { BtcPriceData } from '@/features/market/public';
import { getHolzenMarketDisplayQueryOptions } from '@/features/market/public';
import { isHolzenDevMode } from '@/features/market/public';
import {
  computeAutoCooldownRemainingMs,
  computeManualCooldownRemainingMs,
} from '@/features/pause/application/use-cases/trigger/compute-pause-trigger-cooldowns';
import { mapManualTriggerStartError } from '@/features/pause/application/use-cases/trigger/map-manual-trigger-start-error';
import {
  MANUAL_PAUSE_TRIGGER_IDLE,
  type ManualPauseTriggerResult,
} from '@/features/pause/public';
import { holzenLog } from '@/lib/holzen-console';

export type UseHolzenManualTriggerOrchestrationParams = {
  user: User | null;
  profileTrackedAssetId: string;
  currency: string;
  cooldownHours: number;
  lastTriggerAt: string | null;
  btcData: BtcPriceData | undefined;
  queryClient: QueryClient;
  generateMessage: (data: BtcPriceData, mood?: string) => Promise<ManualPauseTriggerResult>;
  setError: Dispatch<SetStateAction<string | null>>;
};

/**
 * Home manual-trigger gate: localStorage cooldown, market fetch fallback, then `generateMessage`.
 * Used by `useHolzen` in screens (HolzenProvider stays on Home route tree).
 */
export function useHolzenManualTriggerOrchestration({
  user,
  profileTrackedAssetId,
  currency,
  cooldownHours,
  lastTriggerAt,
  btcData,
  queryClient,
  generateMessage,
  setError,
}: UseHolzenManualTriggerOrchestrationParams) {
  const manualCooldownKey = user ? `holzen_last_manual_at_${user.id}` : 'holzen_last_manual_at';
  const [lastManualAt, setLastManualAt] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(manualCooldownKey);
    setLastManualAt(stored ? Number(stored) : null);
  }, [manualCooldownKey]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== manualCooldownKey || e.storageArea !== 'localStorage') return;
      setLastManualAt(e.newValue ? Number(e.newValue) : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [manualCooldownKey]);

  const manualCooldownRemaining = useCallback(
    () => computeManualCooldownRemainingMs(lastManualAt),
    [lastManualAt],
  );

  const autoCooldownRemaining = useCallback(
    () => computeAutoCooldownRemainingMs(lastTriggerAt, cooldownHours),
    [lastTriggerAt, cooldownHours],
  );

  const manualTrigger = useCallback(
    async (mood?: string): Promise<ManualPauseTriggerResult> => {
      const remaining = manualCooldownRemaining();
      if (remaining > 0) {
        holzenLog.manual('manualTrigger: blocked by cooldown', {
          remainingMs: remaining,
          devMode: isHolzenDevMode(),
        });
        return MANUAL_PAUSE_TRIGGER_IDLE;
      }

      try {
        const marketOpts = getHolzenMarketDisplayQueryOptions({
          coinIdRaw: profileTrackedAssetId,
          currency,
          enabled: true,
        });
        const data =
          btcData ??
          (await queryClient.fetchQuery({
            queryKey: marketOpts.queryKey,
            queryFn: marketOpts.queryFn,
          }));
        const result = await generateMessage(data, mood);
        if (result.opened) {
          const now = Date.now();
          setLastManualAt(now);
          localStorage.setItem(manualCooldownKey, String(now));
        }
        return result;
      } catch (e: unknown) {
        setError(mapManualTriggerStartError(e));
        return MANUAL_PAUSE_TRIGGER_IDLE;
      }
    },
    [
      btcData,
      generateMessage,
      manualCooldownRemaining,
      currency,
      manualCooldownKey,
      profileTrackedAssetId,
      queryClient,
      setError,
    ],
  );

  return { manualTrigger, manualCooldownRemaining, autoCooldownRemaining };
}
