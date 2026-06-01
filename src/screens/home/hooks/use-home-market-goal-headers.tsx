import type { TFunction } from 'i18next';
import { useMemo } from 'react';
import { HomeExpandChevronButton } from '@/screens/home/components/HomeExpandChevronButton';

export function useHomeMarketGoalHeaders(args: {
  t: TFunction;
  marketChartExpanded: boolean;
  marketChartExpandBlocked: boolean;
  toggleMarketChartExpanded: () => void;
}) {
  const { t, marketChartExpanded, marketChartExpandBlocked, toggleMarketChartExpanded } = args;

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

  return { marketHeaderRight };
}
