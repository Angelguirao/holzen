import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Shield, TrendingDown, TrendingUp, Leaf } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

const DECISIONS = [
  { value: 'held', key: 'hold', icon: Shield },
  { value: 'sold', key: 'sell', icon: TrendingDown },
  { value: 'bought', key: 'buy', icon: TrendingUp },
  { value: 'nothing', key: 'nothing', icon: Leaf },
] as const;

/** Decisions that trigger the mirror */
const MIRROR_DECISIONS = ['sold', 'bought'];

interface Props {
  onDecide: (decision: string) => void;
  onBack?: () => void;
}

export function PauseDecide({ onDecide, onBack }: Props) {
  const { t } = useTranslation();
  const [mirrorDecision, setMirrorDecision] = useState<string | null>(null);

  const handleDecision = (value: string) => {
    hapticFeedback('medium');
    if (MIRROR_DECISIONS.includes(value)) {
      setMirrorDecision(value);
    } else {
      onDecide(value);
    }
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
            className="flex flex-col items-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-[0.15em] text-center">
              {t('pause.whatWillYouDo')}
            </p>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {DECISIONS.map((d) => {
                const Icon = d.icon;
                return (
                  <motion.button
                    key={d.value}
                    onClick={() => handleDecision(d.value)}
                    whileTap={{ scale: 0.96 }}
                    className="flex flex-col items-center gap-3 py-6 rounded-xl border border-border/15 bg-card/20 backdrop-blur-sm hover:bg-card/40 hover:border-border/30 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary/50" />
                    </div>
                    <span className="text-[10px] font-mono text-foreground/50 tracking-[0.12em] uppercase">
                      {t(`ritual.decide.${d.key}`)}
                    </span>
                  </motion.button>
                );
              })}
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
            <p className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-[0.15em]">
              {t('mirror.title', 'Decision Mirror')}
            </p>

            <div className="space-y-4 w-full">
              {[1, 2, 3].map((i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.6, duration: 0.8 }}
                  className="text-[11px] font-mono text-muted-foreground/40 leading-relaxed italic"
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
                onClick={confirmMirror}
                className="text-[10px] font-mono text-primary/50 hover:text-primary/70 transition-colors duration-500 tracking-[0.15em] uppercase"
              >
                {t(`mirror.confirm.${mirrorKey}`, mirrorKey === 'sell' ? 'I still want to sell' : 'I still want to buy')}
              </button>
              <button
                onClick={cancelMirror}
                className="text-[9px] font-mono text-muted-foreground/20 hover:text-muted-foreground/40 transition-colors duration-500 tracking-[0.12em] uppercase"
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
            onClick={onBack}
            className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground/20 hover:text-muted-foreground/40 transition-colors duration-500 tracking-[0.12em] uppercase"
          >
            <ChevronLeft className="h-3 w-3" />
            {t('pause.steps.back', 'Back')}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
