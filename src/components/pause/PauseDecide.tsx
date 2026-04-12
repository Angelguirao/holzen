import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { OutcomeIcon } from '@/components/icons/OutcomeIcon';
import { hapticFeedback } from '@/lib/haptics';

/** Decisions that trigger the mirror */
const MIRROR_DECISIONS = ['sold', 'bought'];

interface Props {
  onDecide: (decision: string) => void;
  onBack?: () => void;
}

export function PauseDecide({ onDecide, onBack }: Props) {
  const { t } = useTranslation();
  const [mirrorDecision, setMirrorDecision] = useState<string | null>(null);

  const handleHold = () => {
    hapticFeedback('medium');
    onDecide('held');
  };

  const handleAction = (value: 'sold' | 'bought') => {
    hapticFeedback('medium');
    setMirrorDecision(value);
  };

  const confirmMirror = () => {
    if (mirrorDecision) {
      hapticFeedback('medium');
      onDecide(mirrorDecision);
    }
  };

  const cancelMirror = () => {
    hapticFeedback('light');
    setMirrorDecision(null);
  };

  const mirrorKey = mirrorDecision === 'sold' ? 'sell' : 'buy';

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[50vh] gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        {!mirrorDecision ? (
          <motion.div
            key="choices"
            className="flex flex-col items-center gap-8 w-full max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <p className="max-w-xs text-center font-editorial text-xl leading-snug text-foreground sm:text-2xl">
              {t('pause.whatWillYouDo')}
            </p>

            {/* Primary: Hold */}
            <motion.button
              onClick={handleHold}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center">
                <OutcomeIcon outcome="held" size={18} className="text-primary/60" />
              </div>
              <span className="text-sm font-semibold tracking-wide text-foreground">
                {t('ritual.decide.hold', 'I\'m holding')}
              </span>
            </motion.button>

            {/* Secondary: Sell / Buy */}
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => handleAction('sold')}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <OutcomeIcon outcome="sold" size={14} className="text-muted-foreground" />
                {t('ritual.decide.sell', 'I sold')}
              </button>
              <span className="text-muted-foreground/40" aria-hidden>
                ·
              </span>
              <button
                type="button"
                onClick={() => handleAction('bought')}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <OutcomeIcon outcome="bought" size={14} className="text-muted-foreground" />
                {t('ritual.decide.buy', 'I bought')}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="mirror"
            className="flex flex-col items-center gap-6 max-w-xs text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-editorial text-lg text-foreground">
              {t('mirror.title', 'Decision Mirror')}
            </p>

            <div className="w-full space-y-4">
              {[1, 2, 3].map((i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.6, duration: 0.8 }}
                  className="text-center text-sm italic leading-relaxed text-muted-foreground"
                >
                  {t(`mirror.${mirrorKey}.q${i}`)}
                </motion.p>
              ))}
            </div>

            <motion.div
              className="flex flex-col items-center gap-3 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.4, duration: 0.8 }}
            >
              <button
                type="button"
                onClick={confirmMirror}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {t(`mirror.confirm.${mirrorKey}`, mirrorKey === 'sell' ? 'I still want to sell' : 'I still want to buy')}
              </button>
              <button
                type="button"
                onClick={cancelMirror}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {t('mirror.reconsider', 'Let me reconsider')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back link */}
      {onBack && !mirrorDecision && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3 w-3" />
            {t('pause.steps.back', 'Back')}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
