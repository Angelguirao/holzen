import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/lib/btc';
import type { RitualDepth } from '@/lib/pause-session-storage';
import { trackedAssetSymbol } from '@/lib/tracked-assets';

/** Depth-picker context line for the depth picker (`PauseSessionDepthPickerStack`). */
export function usePauseSessionDepthAndBriefCopy(input: {
  t: TFunction;
  btcData: BtcPriceData | null;
  trackedAssetId: string | null;
  ritualEntry: RitualDepth | 'picker';
}): { depthContextLine: string | null } {
  const { t, btcData, trackedAssetId, ritualEntry } = input;

  const depthContextLine = useMemo(() => {
    if (!btcData) return null;
    const sym = trackedAssetSymbol(trackedAssetId);
    return t('pause.depthPicker.contextMoved', {
      defaultValue: '{{sym}} moved {{pct}}% in the last 24 hours.',
      sym,
      pct: Math.abs(btcData.changePercent).toFixed(1),
    });
  }, [btcData, trackedAssetId, t]);

  return { depthContextLine };
}
