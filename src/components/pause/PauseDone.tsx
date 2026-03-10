import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  decision: string | null;
  onReturn: () => void;
}

export function PauseDone({ decision, onReturn }: Props) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center gap-10 justify-center min-h-[70vh] text-center"
    >
      {/* Streak flame celebration */}
      <div className="relative">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.4, 1], opacity: 1 }}
          transition={{ duration: 0.6, times: [0, 0.6, 1], ease: 'easeOut' }}
          className="w-[72px] h-[72px] rounded-full bg-primary/8 flex items-center justify-center"
        >
          <Flame className="h-7 w-7 text-primary/60" />
        </motion.div>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-primary/30"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / 6) * 44,
              y: Math.sin((i * Math.PI * 2) / 6) * 44,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="flex items-center gap-2"
      >
        <Flame className="h-3 w-3 text-primary/40" />
        <p className="text-[10px] font-mono text-muted-foreground/40 tracking-[0.15em] uppercase">
          {t('outcome.streakUpdated')}
        </p>
      </motion.div>

      <div className="space-y-3">
        <p className="text-sm font-mono text-foreground/50">{t('pause.youChose')}</p>
        <p className="text-xs font-mono text-muted-foreground/30 capitalize">{decision}</p>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        onClick={onReturn}
        className="text-[10px] font-mono text-muted-foreground/20 hover:text-muted-foreground/40 transition-colors duration-500 tracking-[0.15em] uppercase mt-4"
      >
        {t('pause.return')}
      </motion.button>
    </motion.div>
  );
}
