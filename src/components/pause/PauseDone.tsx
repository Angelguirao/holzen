import { motion } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/use-subscription';
import { PRICING } from '@/lib/pricing';

interface Props {
  decision: string | null;
  onReturn: () => void;
}

export function PauseDone({ decision, onReturn }: Props) {
  const { t } = useTranslation();
  const { subscribed, monthlyUsed, startCheckout, checkoutLoading } = useSubscription();

  const justHitLimit = !subscribed && monthlyUsed >= PRICING.freeReflectionsPerMonth;

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

      {/* Gentle upsell when free user hits limit */}
      {justHitLimit && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="flex flex-col items-center gap-3 px-6 py-5 rounded-xl bg-muted/30 border border-border/30 max-w-[300px]"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary/60" />
            <p className="text-xs font-mono text-foreground/60">
              {t('pause.upsellTitle', 'You\'ve used all {{count}} free pauses this month', { count: PRICING.freeReflectionsPerMonth })}
            </p>
          </div>
          <p className="text-[11px] font-mono text-muted-foreground/50 text-center leading-relaxed">
            {t('pause.upsellBody', 'Unlock unlimited pauses, AI companions, and your full reflection library.')}
          </p>
          <button
            onClick={() => startCheckout()}
            disabled={checkoutLoading}
            className="text-[11px] font-mono text-primary hover:text-primary/80 transition-colors tracking-wider uppercase"
          >
            {t('pause.upsellCta', 'Start {{days}}-day free trial', { days: PRICING.trialDays })}
          </button>
        </motion.div>
      )}

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: justHitLimit ? 2.5 : 1.5, duration: 1 }}
        onClick={onReturn}
        className="text-[10px] font-mono text-muted-foreground/20 hover:text-muted-foreground/40 transition-colors duration-500 tracking-[0.15em] uppercase mt-4"
      >
        {t('pause.return')}
      </motion.button>
    </motion.div>
  );
}
