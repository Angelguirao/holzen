import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export type PauseDoneDefaultReinforcementCardProps = {
  quote: string;
};

/** Deep Done: optional reinforcement quote card. */
export function PauseDoneDefaultReinforcementCard({ quote }: PauseDoneDefaultReinforcementCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.7 }}
      className="w-full max-w-md rounded-2xl border border-border/60 bg-card/50 px-5 py-6 text-center shadow-sm"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {t('pause.done.reinforcementKicker', { defaultValue: 'Carry this with you' })}
      </p>
      <p className="mt-3 font-editorial text-lg leading-snug text-foreground sm:text-xl">{quote}</p>
    </motion.div>
  );
}
