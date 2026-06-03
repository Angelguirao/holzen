import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { getHolzenNumberQueryOptions } from '@/features/user/public-queries';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';

/**
 * Legacy full-width community stat (default variant). Home Market uses
 * {@link HomeMarketWidgetFooter} compact line instead.
 */
export function HolzenNumber({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  "use memo";
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const { data, isPending } = useQuery(getHolzenNumberQueryOptions());

  if (isPending || !data) return null;
  if (data.users_pausing_now === 0 && data.percent === 0) return null;

  const motionProps = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
      };

  if (variant === 'compact') {
    return (
      <motion.div className="flex items-center text-muted-foreground py-1" {...motionProps}>
        <p className={homeInWidget.meta}>
          <span className="font-semibold tabular-nums text-foreground">{data.percent}%</span>{' '}
          {t('holzenNumber.pausingNow', { defaultValue: 'pausing now' })}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div className={`${homeInWidget.inset} space-y-1.5`} {...motionProps}>
      <div className="flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/50" aria-hidden />
        <p className={homeInWidget.kicker}>{t('holzenNumber.title')}</p>
      </div>
      <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">{data.percent}%</p>
      <p className={homeInWidget.meta}>
        {t('holzenNumber.pausingNowDetail', {
          count: data.users_pausing_now,
          defaultValue: '{{count}} people pausing now',
        })}
      </p>
    </motion.div>
  );
}
