import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/features/market/public';
import { resolvePauseDepthContextLineParams } from '@/features/pause/domain/reflect/mood/resolve-pause-depth-context-line-params';
import type { RitualDepth } from '@/features/pause/public-hooks';

/** Depth-picker context line for the depth picker (`PauseSessionDepthPickerStack`). */
export function usePauseSessionDepthAndBriefCopy(input: {
  t: TFunction;
  btcData: BtcPriceData | null;
  trackedAssetId: string | null;
  ritualEntry: RitualDepth | 'picker';
}): { depthContextLine: string | null } {
  const { t, btcData, trackedAssetId, ritualEntry } = input;

  const depthContextLine = useMemo(() => {
    const params = resolvePauseDepthContextLineParams(btcData, trackedAssetId);
    if (!params) return null;
    return t('pause.depthPicker.contextMoved', {
      defaultValue: '{{sym}} moved {{pct}}% in the last 24 hours.',
      sym: params.sym,
      pct: params.pct,
    });
  }, [btcData, trackedAssetId, t]);

  return { depthContextLine };
}
