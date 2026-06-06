import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { MarketQuote } from '@/features/market/public';
import { PauseDepthPickerDepthCards } from '@/screens/pause/components/pause-depth-picker-depth-cards';
import { PauseDepthPickerFooterLinks } from '@/screens/pause/components/pause-depth-picker-footer-links';
import { PauseDepthPickerHeader } from '@/screens/pause/components/pause-depth-picker-header';
import { PauseDepthPickerMarketContext } from '@/screens/pause/components/pause-depth-picker-market-context';

interface Props {
  marketData: MarketQuote | null;
  trackedAssetId: string;
  contextText?: string | null;
  onBrief: () => void;
  onDeep: () => void;
  onAboutPauses: () => void;
  onClose: () => void;
  /** When true, deep pause is visually gated; `onDeep` still runs so callers can show paywall / checkout. */
  deepPauseLocked?: boolean;
  /** Brief/deep cards disabled while manual open from Home is still creating the instance. */
  choicesDisabled?: boolean;
}

/** Full-screen depth choice — Figma Wireframes 589:19155. */
export function PauseDepthPicker({
  marketData,
  trackedAssetId,
  contextText = null,
  onBrief,
  onDeep,
  onAboutPauses,
  onClose,
  deepPauseLocked = false,
  choicesDisabled = false,
}: Props) {
  "use memo";
  const { t } = useTranslation();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <PauseDepthPickerHeader onAboutPauses={onAboutPauses} onClose={onClose} />

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-12 pt-10 sm:px-8">
        <div className="flex flex-col gap-8">
          <h1 className="text-center text-[22px] font-normal leading-7 tracking-[0.004em] text-foreground">
            {t('pause.depthPicker.headline', { defaultValue: 'How long do you have?' })}
          </h1>

          <PauseDepthPickerDepthCards
            onBrief={onBrief}
            onDeep={onDeep}
            deepPauseLocked={deepPauseLocked}
            choicesDisabled={choicesDisabled}
          />

          <PauseDepthPickerMarketContext
            marketData={marketData}
            trackedAssetId={trackedAssetId}
            contextText={contextText}
          />

          <PauseDepthPickerFooterLinks onAboutPauses={onAboutPauses} />
        </div>
      </div>
    </motion.div>
  );
}
