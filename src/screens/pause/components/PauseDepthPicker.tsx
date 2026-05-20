import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PauseDepthPickerDepthCards } from '@/screens/pause/components/pause-depth-picker-depth-cards';
import { PauseDepthPickerFooterLinks } from '@/screens/pause/components/pause-depth-picker-footer-links';
import { PauseDepthPickerHeader } from '@/screens/pause/components/pause-depth-picker-header';

interface Props {
  contextLine: string | null;
  onBrief: () => void;
  onDeep: () => void;
  onAboutPauses: () => void;
  /** Opens the help sheet on the “Step science” tab (brief vs deep choice screen only). */
  onOpenStepScience: () => void;
  onClose: () => void;
  /** When true, deep pause is visually gated; `onDeep` still runs so callers can show paywall / checkout. */
  deepPauseLocked?: boolean;
}

export function PauseDepthPicker({
  contextLine,
  onBrief,
  onDeep,
  onAboutPauses,
  onOpenStepScience,
  onClose,
  deepPauseLocked = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <PauseDepthPickerHeader onAboutPauses={onAboutPauses} onClose={onClose} />

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-12 pt-[35px] sm:px-8">
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h1 className="text-[22px] font-normal leading-[28px] tracking-[0.01em] text-foreground">
              <span className="block">{t('pause.depthPicker.headline1', { defaultValue: 'You paused' })}</span>
              <span className="block">{t('pause.depthPicker.headline2', { defaultValue: "That's the hardest part." })}</span>
            </h1>
          </div>

          <PauseDepthPickerDepthCards
            onBrief={onBrief}
            onDeep={onDeep}
            deepPauseLocked={deepPauseLocked}
          />

          {contextLine ? (
            <p className="text-center text-base font-normal leading-6 text-muted-foreground">{contextLine}</p>
          ) : null}

          <PauseDepthPickerFooterLinks
            onAboutPauses={onAboutPauses}
            onOpenStepScience={onOpenStepScience}
          />
        </div>
      </div>
    </motion.div>
  );
}
