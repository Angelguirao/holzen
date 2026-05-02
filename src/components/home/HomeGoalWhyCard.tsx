import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { HoldGoalWidget } from '@/components/HoldGoalWidget';
import { useHolzen } from '@/hooks/use-holzen';
import { homeInWidget } from '@/components/home/home-widget-styles';
import { cn } from '@/lib/utils';

/**
 * Home-only composed “Goal & why” block: wireframe-style goal row + optional mantra
 * and motivations as a middle-dot line (not chips). Chevron collapses the why block only.
 */
export function HomeGoalWhyCard({ currentPrice }: { currentPrice?: number }) {
  const { t } = useTranslation();
  const { motivations, mantra } = useHolzen();
  const prefersReduced = useReducedMotion();
  const [whyExpanded, setWhyExpanded] = useState(true);

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
        wireframeAccessoryRight={
          hasWhy ? (
            <button
              type="button"
              className={cn(homeInWidget.iconBtn, 'text-muted-foreground/50')}
              aria-expanded={whyExpanded}
              aria-label={whyExpanded ? t('home.goalWhy.collapseWhyAria') : t('home.goalWhy.expandWhyAria')}
              onClick={() => setWhyExpanded((v) => !v)}
            >
              <ChevronDown
                className={cn('h-4 w-4 text-secondary-foreground transition-transform', !whyExpanded && '-rotate-90')}
                aria-hidden
              />
            </button>
          ) : null
        }
      />

      <AnimatePresence initial={false}>
        {hasWhy && whyExpanded ? (
          <motion.div
            key="goal-why-body"
            initial={prefersReduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Wireframe kit: mantra + motivations stack with gap only (no rule). */}
            <div className="space-y-2 pt-3">
              {mantraTrim ? (
                <p className="text-base font-medium leading-6 tracking-wide text-foreground">
                  &ldquo;{mantraTrim}&rdquo;
                </p>
              ) : null}
              {motivationLine ? (
                <p className="text-xs font-medium italic leading-4 tracking-wide text-muted-foreground">
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
