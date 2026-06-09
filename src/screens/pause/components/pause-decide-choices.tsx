import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { pauseStepLayout } from '@/features/pause/public-session';
import { cn } from '@/lib/utils';

export type PauseDecideChoicesProps = {
  introLine: string | null;
  onHold: () => void;
  onBought: () => void;
  onSold: () => void;
};

const decideChoiceClassName =
  'flex w-full max-w-[225px] items-center justify-center rounded-lg bg-primary/5 px-4 py-5 text-sm font-medium tracking-wide text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

/** Primary decide step: hold vs buy/sell (before decision mirror). */
export function PauseDecideChoices({ introLine, onHold, onBought, onSold }: PauseDecideChoicesProps) {
  "use memo";
  const { t } = useTranslation();

  const choices: { key: 'hold' | 'buy' | 'sell'; onClick: () => void }[] = [
    { key: 'hold', onClick: onHold },
    { key: 'buy', onClick: onBought },
    { key: 'sell', onClick: onSold },
  ];

  return (
    <motion.div
      key="choices"
      className="flex w-full max-w-sm flex-col items-center gap-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        {introLine ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {introLine}
          </p>
        ) : null}
        <p className={pauseStepLayout.screenTitle}>{t('pause.whatWillYouDo')}</p>
        <p className="max-w-sm text-base font-medium leading-6 text-foreground">
          {t('pause.decideSubcopy')}
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-4">
        {choices.map(({ key, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className={cn(decideChoiceClassName)}
          >
            {t(`pause.decide.${key}`)}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-col gap-1 text-center">
        <p className="text-base font-medium leading-6 text-muted-foreground">
          {t('pause.decideDisclaimerTitle')}
        </p>
        <p className="text-xs leading-4 tracking-wide text-muted-foreground">
          {t('pause.decideDisclaimerLine1')}
          <br />
          {t('pause.decideDisclaimerLine2')}
        </p>
      </div>
    </motion.div>
  );
}
