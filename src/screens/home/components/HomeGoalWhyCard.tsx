import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HoldGoalWidget } from '@/screens/home/components/HoldGoalWidget';
import { useProfile } from '@/features/user/public-hooks';
import { useAuth } from '@/features/auth/public';
import { getProfileRowQueryOptions } from '@/features/user/public-queries';
import { cn } from '@/lib/utils';

/**
 * Home anchor card body (Wireframes 546:8945): mantra quote, motivations, optional hold-goal expand.
 */
export function HomeGoalWhyCard({
  currentPrice,
  detailsExpanded,
}: {
  currentPrice?: number;
  detailsExpanded: boolean;
}) {
  "use memo";
  const { t } = useTranslation();
  const { motivations, mantra } = useProfile();
  const { user } = useAuth();
  const userId = user?.id;
  const prefersReduced = useReducedMotion();

  useQuery(getProfileRowQueryOptions(userId));

  const motivationLine = useMemo(
    () => motivations.map((m) => t(`settings.motivations.${m}`, m)).join(' \u00B7 '),
    [motivations, t],
  );

  const mantraLine = mantra?.trim() ?? '';

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-snug text-foreground">
        {mantraLine
          ? `"${mantraLine}"`
          : t('home.goalWhy.mantraPlaceholder', {
              defaultValue: 'Add a personal mantra in Settings to anchor your pauses.',
            })}
      </p>

      {motivationLine ? (
        <p className="text-xs font-medium italic tracking-wide text-muted-foreground">{motivationLine}</p>
      ) : null}

      <AnimatePresence initial={false}>
        {detailsExpanded ? (
          <motion.div
            key="goal-why-hold"
            initial={prefersReduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={cn((motivationLine || mantraLine) && 'border-t border-border/30 pt-4')}>
              <HoldGoalWidget
                currentPrice={currentPrice}
                variant="wireframe"
                wireframeDetailsExpanded
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
