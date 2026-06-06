import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import type { MarketQuote } from '@/features/market/public';
import { fetchMarketData, getHolzenMarketDisplayQueryOptions } from '@/features/market/public';
import { isHolzenDevMode } from '@/features/market/public';
import {
  buildManualTriggerCooldownStorageKey,
  computeManualCooldownRemainingMs,
  isManualTriggerBlockedByCooldown,
  mapManualTriggerStartError,
  parseManualTriggerCooldownFromStorageEvent,
  readManualTriggerCooldownAtMs,
  writeManualTriggerCooldownAtMs,
} from '@/features/pause/public-trigger';
import type { ManualPauseTriggerOptions } from '@/features/pause/domain/manual-pause-trigger-options';
import {
  MANUAL_PAUSE_TRIGGER_IDLE,
  type ManualPauseTriggerResult,
} from '@/features/pause/domain/manual-pause-trigger-result';

export type UseHolzenManualTriggerOrchestrationParams = {
  user: User | null;
  profileTrackedAssetId: string;
  currency: string;
  cooldownHours: number;
  lastTriggerAt: string | null;
  queryClient: QueryClient;
  generateMessage: (
    data: MarketQuote,
    mood?: string,
    options?: ManualPauseTriggerOptions,
  ) => Promise<ManualPauseTriggerResult>;
  setError: Dispatch<SetStateAction<string | null>>;
};

/**
 * Home manual-trigger gate: localStorage cooldown, full market fetch, then `generateMessage`.
 * Used by `useHolzen` in screens (HolzenProvider stays on Home route tree).
 */
export function useHolzenManualTriggerOrchestration({
  user,
  profileTrackedAssetId,
  currency,
  cooldownHours,
  lastTriggerAt,
  queryClient,
  generateMessage,
  setError,
}: UseHolzenManualTriggerOrchestrationParams) {
  const manualCooldownKey = buildManualTriggerCooldownStorageKey(user?.id);
  const [lastManualAt, setLastManualAt] = useState<number | null>(null);

  useEffect(() => {
    setLastManualAt(readManualTriggerCooldownAtMs(manualCooldownKey));
  }, [manualCooldownKey]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      const parsed = parseManualTriggerCooldownFromStorageEvent(
        {
          key: e.key,
          storageArea: e.storageArea === window.localStorage ? 'localStorage' : null,
          newValue: e.newValue,
        },
        manualCooldownKey,
      );
      if (parsed === 'ignore') return;
      setLastManualAt(parsed);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [manualCooldownKey]);

  const manualCooldownRemaining = useCallback(
    () => computeManualCooldownRemainingMs(lastManualAt),
    [lastManualAt],
  );

  const autoCooldownRemaining = useCallback(() => 0, []);

  const manualTrigger = useCallback(
    async (
      mood?: string,
      options?: ManualPauseTriggerOptions,
    ): Promise<ManualPauseTriggerResult> => {
      const remaining = manualCooldownRemaining();
      if (isManualTriggerBlockedByCooldown(remaining)) {
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
        // Manual pause needs full market context (on-chain enrichment when BTC).
        const data = await fetchMarketData(profileTrackedAssetId, currency);
        queryClient.setQueryData(marketOpts.queryKey, data);
        const result = await generateMessage(data, mood, options);
        if (result.opened) {
          const now = Date.now();
          setLastManualAt(now);
          writeManualTriggerCooldownAtMs(manualCooldownKey, now);
        }
        return result;
      } catch (e: unknown) {
        setError(mapManualTriggerStartError(e));
        return MANUAL_PAUSE_TRIGGER_IDLE;
      }
    },
    [
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
