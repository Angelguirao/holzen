import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HoldGoalWidget } from '@/components/HoldGoalWidget';
import { useHolzen } from '@/hooks/use-holzen';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';

/**
 * Home “Why you stay” block: wireframe hold row + mantra / motivations when the section is expanded.
 * Section chevron lives on `HomeSectionCard` (same pattern as Market).
 */
export function HomeGoalWhyCard({
  currentPrice,
  detailsExpanded,
}: {
  currentPrice?: number;
  detailsExpanded: boolean;
}) {
  const { t } = useTranslation();
  const { motivations, mantra } = useHolzen();
  const prefersReduced = useReducedMotion();

  const motivationLine = useMemo(
    () => motivations.map((m) => t(`settings.motivations.${m}`, m)).join(' \u00B7 '),
    [motivations, t],
  );

  const hasWhy = Boolean(mantra?.trim()) || motivations.length > 0;
  const mantraTrim = mantra?.trim() ?? '';

  return (
    <div className="rounded-lg border-2 border-border/60 bg-muted/25 p-4">
      <HoldGoalWidget
        currentPrice={currentPrice}
        variant="wireframe"
        wireframeDetailsExpanded={detailsExpanded}
      />

      <AnimatePresence initial={false}>
        {detailsExpanded && hasWhy ? (
          <motion.div
            key="goal-why-body"
            initial={prefersReduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-3">
              {mantraTrim ? (
                <p className="text-base font-medium leading-6 tracking-wide text-foreground">
                  &ldquo;{mantraTrim}&rdquo;
                </p>
              ) : null}
              {motivationLine ? (
                <p className={cn(homeInWidget.metaFaint, 'font-medium italic tracking-wide')}>
                  {motivationLine}
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
