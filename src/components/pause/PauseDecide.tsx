import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { hapticFeedback } from '@/lib/haptics';

const DECISIONS = [
  { value: 'held', key: 'hold', emoji: '🪨' },
  { value: 'sold', key: 'sell', emoji: '📤' },
  { value: 'bought', key: 'buy', emoji: '📥' },
  { value: 'nothing', key: 'nothing', emoji: '🌿' },
] as const;

interface Props {
  onDecide: (decision: string) => void;
  onBack?: () => void;
}

export function PauseDecide({ onDecide, onBack }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[50vh] gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <p className="text-[10px] font-mono text-muted-foreground/30 uppercase tracking-[0.15em] text-center">
        {t('pause.whatWillYouDo')}
      </p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {DECISIONS.map((d) => (
          <motion.button
            key={d.value}
            onClick={() => {
              hapticFeedback('medium');
              onDecide(d.value);
            }}
            whileTap={{ scale: 0.96 }}
            className="flex flex-col items-center gap-2.5 py-6 rounded-xl border border-border/15 bg-card/20 backdrop-blur-sm hover:bg-card/40 hover:border-border/30 transition-all duration-300"
          >
            <span className="text-xl">{d.emoji}</span>
            <span className="text-[10px] font-mono text-foreground/50 tracking-[0.12em] uppercase">
              {t(`ritual.decide.${d.key}`)}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Back link */}
      {onBack && (
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
