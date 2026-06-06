import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { getHolzenNumberQueryOptions } from '@/features/user/public-queries';
import type { HolzenNumberData } from '@/features/user/infrastructure/edge/holzen-number-edge';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { hasPausingNowStat } from '@/legacy/holzen-pausing-now/has-pausing-now-stat';

function hasVisibleLegacyHolzenNumber(data: HolzenNumberData): boolean {
  return (
    hasPausingNowStat(data) ||
    data.users_paused_today > 0 ||
    data.percent_paused_today > 0
  );
}

/** Legacy full-width / compact community stat (includes live “pausing now”). Not shipped on pause-first Home. */
export function HolzenNumber({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  "use memo";
  const { t } = useTranslation();
  const prefersReduced = useReducedMotion();
  const { data, isPending } = useQuery(getHolzenNumberQueryOptions());

  if (isPending || !data || !hasVisibleLegacyHolzenNumber(data)) return null;

  const showNow = hasPausingNowStat(data);
  const showToday = data.users_paused_today > 0 || data.percent_paused_today > 0;

  const motionProps = prefersReduced
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
      };

  if (variant === 'compact') {
    return (
      <motion.div className="flex flex-col items-end gap-0.5 text-muted-foreground py-1" {...motionProps}>
        {showNow ? (
          <p className={homeInWidget.meta}>
            <span className="font-semibold tabular-nums text-foreground">{data.percent_pausing_now}%</span>{' '}
            {t('holzenNumber.pausingNow', { defaultValue: 'pausing now' })}
          </p>
        ) : null}
        {showToday ? (
          <p className={homeInWidget.meta}>
            <span className="font-semibold tabular-nums text-foreground">{data.percent_paused_today}%</span>{' '}
            {t('holzenNumber.pausedToday', { defaultValue: 'paused today' })}
          </p>
        ) : null}
      </motion.div>
    );
  }

  return (
    <motion.div className={`${homeInWidget.inset} space-y-1.5`} {...motionProps}>
      <div className="flex items-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/50" aria-hidden />
        <p className={homeInWidget.kicker}>{t('holzenNumber.title')}</p>
      </div>
      {showNow ? (
        <>
          <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
            {data.percent_pausing_now}%
          </p>
          <p className={homeInWidget.meta}>
            {t('holzenNumber.pausingNowDetail', {
              count: data.users_pausing_now,
              defaultValue: '{{count}} people pausing now',
            })}
          </p>
        </>
      ) : null}
      {showToday ? (
        <>
          <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
            {data.percent_paused_today}%
          </p>
          <p className={homeInWidget.meta}>
            {t('holzenNumber.pausedTodayDetail', {
              count: data.users_paused_today,
              defaultValue: '{{count}} people paused today',
            })}
          </p>
        </>
      ) : null}
    </motion.div>
  );
}
