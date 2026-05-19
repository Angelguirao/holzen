import type { TFunction } from 'i18next';
import { useCallback, useMemo, useState } from 'react';
import { HomeExpandChevronButton } from '@/screens/home/components/HomeExpandChevronButton';
import { trackEvent } from '@/lib/posthog';

export function useHomeMarketGoalHeaders(args: {
  t: TFunction;
  marketChartExpanded: boolean;
  marketChartExpandBlocked: boolean;
  toggleMarketChartExpanded: () => void;
}) {
  const { t, marketChartExpanded, marketChartExpandBlocked, toggleMarketChartExpanded } = args;

  const [goalWhyExpanded, setGoalWhyExpanded] = useState(false);

  const toggleGoalWhyExpanded = useCallback(() => {
    setGoalWhyExpanded((prev) => {
      const next = !prev;
      trackEvent('home.goal_why_expand_toggled', { expanded: next });
      return next;
    });
  }, []);

  const marketExpandLabel = marketChartExpandBlocked
    ? t('home.market.chartExpandDisabled')
    : marketChartExpanded
      ? t('home.market.collapseDetails')
      : t('home.market.expandDetails');

  const marketHeaderRight = useMemo(
    () => (
      <HomeExpandChevronButton
        expanded={marketChartExpanded}
        onToggle={toggleMarketChartExpanded}
        disabled={marketChartExpandBlocked}
        ariaExpandedWhenEnabled={marketChartExpanded}
        ariaLabel={marketExpandLabel}
        title={marketExpandLabel}
      />
    ),
    [marketChartExpanded, marketChartExpandBlocked, toggleMarketChartExpanded, marketExpandLabel],
  );

  const goalWhyHeaderRight = useMemo(
    () => (
      <HomeExpandChevronButton
        expanded={goalWhyExpanded}
        onToggle={toggleGoalWhyExpanded}
        ariaExpandedWhenEnabled={goalWhyExpanded}
        ariaLabel={
          goalWhyExpanded ? t('home.goalWhy.collapseHoldDetails') : t('home.goalWhy.expandHoldDetails')
        }
      />
    ),
    [goalWhyExpanded, toggleGoalWhyExpanded, t],
  );

  return { goalWhyExpanded, goalWhyHeaderRight, marketHeaderRight };
}
