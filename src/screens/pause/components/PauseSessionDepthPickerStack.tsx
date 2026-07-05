import { useState } from 'react';
import type { MarketQuote } from '@/features/market/public';
import { PauseAboutPausesSheet } from '@/screens/pause/components/PauseAboutPausesSheet';
import { PauseDepthPicker } from '@/screens/pause/components/PauseDepthPicker';

/** Depth choice on `/pause` before a ritual starts; About pauses sheet from info icon + footer link. */
export function PauseSessionDepthPickerStack(props: {
  marketData: MarketQuote | null;
  trackedAssetId: string;
  contextText?: string | null;
  onBrief: () => void;
  onDeep: () => void;
  /** Free users: deep card shows a Pro / trial hint; `onDeep` should still run (e.g. paywall). */
  deepPauseLocked?: boolean;
  /** Manual open from Home idle — instance still creating. */
  choicesDisabled?: boolean;
  onClose: () => void;
}) {
  "use memo";
  const {
    marketData,
    trackedAssetId,
    contextText = null,
    onBrief,
    onDeep,
    deepPauseLocked = false,
    choicesDisabled = false,
    onClose,
  } = props;

  const [aboutOpen, setAboutOpen] = useState(false);

  const openAbout = () => setAboutOpen(true);

  return (
    <>
      <PauseDepthPicker
        marketData={marketData}
        trackedAssetId={trackedAssetId}
        contextText={contextText}
        onBrief={onBrief}
        onDeep={onDeep}
        deepPauseLocked={deepPauseLocked}
        choicesDisabled={choicesDisabled}
        onAboutPauses={openAbout}
        onClose={onClose}
      />
      <PauseAboutPausesSheet open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
}
