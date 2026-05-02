import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HoldGoalWidget } from '@/components/HoldGoalWidget';
import { useHolzen } from '@/hooks/use-holzen';
import { cn } from '@/lib/utils';

/**
 * Home “Why you stay” block: single surface with section chrome on `HomeSectionCard`.
 * Expanded: motivations → mantra → rule → hold goal (wireframe). Collapsed: hold summary only.
 */
export function HomeGoalWhyCard({
  currentPrice,
  detailsExpanded,
  onHoldGoalCompactHeadlineChange,
}: {
  currentPrice?: number;
  detailsExpanded: boolean;
  onHoldGoalCompactHeadlineChange?: (headline: string | null) => void;
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
    <div>
      <AnimatePresence initial={false}>
        {detailsExpanded && hasWhy ? (
          <motion.div
            key="goal-why-qualitative"
            initial={prefersReduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pb-4">
              {motivationLine ? (
                <p className="text-xs font-medium italic tracking-wide text-muted-foreground">{motivationLine}</p>
              ) : null}
              {mantraTrim ? (
                <p className="text-base font-medium leading-relaxed text-foreground">
                  &ldquo;{mantraTrim}&rdquo;
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className={cn(detailsExpanded && hasWhy && 'border-t border-border/30 pt-4')}>
        <HoldGoalWidget
          currentPrice={currentPrice}
          variant="wireframe"
          wireframeDetailsExpanded={detailsExpanded}
          onCompactHeadlineChange={onHoldGoalCompactHeadlineChange}
        />
      </div>
    </div>
  );
}
