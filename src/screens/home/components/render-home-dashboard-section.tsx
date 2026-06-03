import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { Moon } from 'lucide-react';
import { BtcStatus } from '@/screens/home/components/BtcStatus';
import { HomeGoalWhyCard } from '@/screens/home/components/HomeGoalWhyCard';
import { HomeSectionCard } from '@/screens/home/components/HomeSectionCard';
import { HomePracticeStatTiles } from '@/screens/home/components/HomePracticeStatTiles';
import type { HomePauseWidgetProjection } from '@/features/pause/presentation/home/use-home-pause-widget-projection';
import type { BtcPriceData, TrackedAssetId } from '@/features/market/public';

/** Everything needed to render one Home dashboard section by id. */
export interface HomeDashboardSectionDeps {
  t: TFunction;
  error: string | null;
  marketHeaderRight: ReactNode;
  marketFooter: ReactNode;
  btcData: BtcPriceData | null;
  priceHidden: boolean;
  togglePriceHidden: () => void;
  currency: string;
  trackedAssetId: TrackedAssetId;
  unitBasisModeSupported: boolean;
  btcMode: boolean;
  toggleBtcMode: () => void;
  marketChartExpanded: boolean;
  toggleMarketChartExpanded: () => void;
  pauseCardBody: ReactNode;
  pauseSectionHeaderRight: ReactNode | undefined;
  pauseWidgetProjection: HomePauseWidgetProjection;
  subscribed: boolean;
  collapsed: Record<string, boolean>;
  toggleCollapsed: (id: string) => void;
  presenceXp: number | null;
  completedPauseCount: number | null;
  practiceStatsLoading: boolean;
}

export function renderHomeDashboardSection(sectionId: string, d: HomeDashboardSectionDeps): ReactNode {
  switch (sectionId) {
    case 'goal-why':
      return <HomeGoalWhyCard />;

    case 'market':
      return (
        <HomeSectionCard
          title={d.t('home.widget.market')}
          headerRight={d.error ? undefined : d.marketHeaderRight}
          footer={d.marketFooter}
        >
          <BtcStatus
            data={d.btcData}
            error={d.error}
            hidden={d.priceHidden}
            onToggleHidden={d.togglePriceHidden}
            currency={d.currency}
            coinId={d.trackedAssetId}
            btcMode={d.unitBasisModeSupported && d.btcMode}
            onToggleBtcMode={d.unitBasisModeSupported ? d.toggleBtcMode : undefined}
            chartExpanded={d.marketChartExpanded}
            onToggleChartExpanded={d.toggleMarketChartExpanded}
            chartChevronInPriceRow={false}
          />
        </HomeSectionCard>
      );

    case 'your-pause':
      return (
        <HomeSectionCard
          title={d.t(d.pauseWidgetProjection.sectionTitleKey, {
            defaultValue:
              d.pauseWidgetProjection.sectionTitleKey === 'home.widget.continueYourPause'
                ? 'Continue pause'
                : d.pauseWidgetProjection.sectionTitleKey === 'home.widget.youPaused'
                  ? 'You paused'
                  : d.pauseWidgetProjection.sectionTitleKey === 'home.widget.newPauseAvailable'
                    ? 'New pause available'
                    : 'Pause',
          })}
          headerRight={
            d.pauseSectionHeaderRight ??
            (d.pauseWidgetProjection.showMoonIcon ? (
              <Moon className="h-5 w-5 shrink-0 text-muted-foreground/70" aria-hidden />
            ) : undefined)
          }
          collapsible={d.pauseWidgetProjection.collapsible}
          collapsed={d.pauseWidgetProjection.collapsed}
          onToggleCollapse={d.pauseWidgetProjection.onToggleCollapse}
        >
          {d.pauseCardBody}
        </HomeSectionCard>
      );

    case 'journey-pulse':
      return (
        <HomePracticeStatTiles
          presenceXp={d.presenceXp}
          completedPauseCount={d.completedPauseCount}
          isLoading={d.practiceStatsLoading}
        />
      );

    case 'quick-capture':
    case 'night':
      return null;

    default:
      return null;
  }
}
