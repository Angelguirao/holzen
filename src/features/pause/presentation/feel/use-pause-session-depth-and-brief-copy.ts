import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import type { MarketQuote } from '@/features/market/public';
import { resolvePauseDepthContextLineParams } from './pause-feel-io';
import type { RitualDepth } from '@/features/pause/domain/ritual-types';

/** Depth-picker context line for the depth picker (`PauseSessionDepthPickerStack`). */
export function usePauseSessionDepthAndBriefCopy(input: {
  t: TFunction;
  marketData: MarketQuote | null;
  trackedAssetId: string | null;
  ritualEntry: RitualDepth | 'picker';
}): { depthContextLine: string | null } {
  const { t, marketData, trackedAssetId, ritualEntry } = input;

  const depthContextLine = useMemo(() => {
    const params = resolvePauseDepthContextLineParams(marketData, trackedAssetId);
    if (!params) return null;
    return t('pause.depthPicker.contextMoved', {
      defaultValue: '{{sym}} moved {{pct}}% in the last 24 hours.',
      sym: params.sym,
      pct: params.pct,
    });
  }, [marketData, trackedAssetId, t]);

  return { depthContextLine };
}
