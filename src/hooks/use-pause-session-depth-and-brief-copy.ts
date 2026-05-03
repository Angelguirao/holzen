import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import type { BtcPriceData } from '@/lib/btc';
import { computeBriefMacroProgressPosition } from '@/lib/brief-pause-order';
import type { BriefPauseStep, RitualDepth } from '@/lib/pause-session-storage';
import { trackedAssetSymbol } from '@/lib/tracked-assets';

/** Depth-picker context line + brief ritual macro progress line for `PauseSessionScaffold`. */
export function usePauseSessionDepthAndBriefCopy(input: {
  t: TFunction;
  btcData: BtcPriceData | null;
  trackedAssetId: string | null;
  ritualEntry: RitualDepth | 'picker';
  briefStep: BriefPauseStep;
}): { depthContextLine: string | null; briefMacroLine: string | undefined } {
  const { t, btcData, trackedAssetId, ritualEntry, briefStep } = input;

  const depthContextLine = useMemo(() => {
    if (!btcData) return null;
    const sym = trackedAssetSymbol(trackedAssetId);
    return t('pause.depthPicker.contextMoved', {
      defaultValue: '{{sym}} moved {{pct}}% in the last 24 hours.',
      sym,
      pct: Math.abs(btcData.changePercent).toFixed(1),
    });
  }, [btcData, trackedAssetId, t]);

  const briefMacroLine = useMemo(() => {
    if (ritualEntry !== 'brief') return undefined;
    const { n, total } = computeBriefMacroProgressPosition(briefStep);
    return t('pause.brief.macroProgress', { n, total });
  }, [ritualEntry, briefStep, t]);

  return { depthContextLine, briefMacroLine };
}
