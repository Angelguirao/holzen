import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { HomeExpandChevronButton } from '@/screens/home/components/HomeExpandChevronButton';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { settingsSectionPath } from '@/lib/app-routes';
import { trackHomeGoalWhyExpandToggled } from '@/features/pause/public-home';

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
      trackHomeGoalWhyExpandToggled(next);
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
      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          to={settingsSectionPath('you')}
          className={homeInWidget.iconBtn}
          aria-label={t('home.goalWhy.editMantra', { defaultValue: 'Edit personal mantra' })}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </Link>
        <HomeExpandChevronButton
          expanded={goalWhyExpanded}
          onToggle={toggleGoalWhyExpanded}
          ariaExpandedWhenEnabled={goalWhyExpanded}
          ariaLabel={
            goalWhyExpanded
              ? t('home.goalWhy.collapseHoldDetails')
              : t('home.goalWhy.expandHoldDetails')
          }
        />
      </div>
    ),
    [goalWhyExpanded, toggleGoalWhyExpanded, t],
  );

  return { goalWhyExpanded, goalWhyHeaderRight, marketHeaderRight };
}
