import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';
import { BtcStatus } from '@/components/BtcStatus';
import { HomeGoalWhyCard } from '@/components/home/HomeGoalWhyCard';
import { HomeSectionCard } from '@/components/home/HomeSectionCard';
import type { BtcPriceData } from '@/lib/btc';
import type { TrackedAssetId } from '@/lib/tracked-assets';

/** Everything needed to render one Home “Today” / goal-why section by id. */
export interface HomeDashboardSectionDeps {
  t: TFunction;
  goalWhyHoldSummary: string | null;
  setGoalWhyHoldSummary: (v: string | null) => void;
  goalWhyHeaderRight: ReactNode;
  goalWhyExpanded: boolean;
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
  subscribed: boolean;
  collapsed: Record<string, boolean>;
  toggleCollapsed: (id: string) => void;
}

export function renderHomeDashboardSection(sectionId: string, d: HomeDashboardSectionDeps): ReactNode {
  switch (sectionId) {
    case 'goal-why':
      return (
        <HomeSectionCard
          className="rounded-lg"
          title={d.t('home.widget.whyHoldTitle')}
          headerSubtitle={d.goalWhyHoldSummary ?? undefined}
          headerRight={d.goalWhyHeaderRight}
        >
          <HomeGoalWhyCard
            currentPrice={d.btcData?.currentPrice}
            detailsExpanded={d.goalWhyExpanded}
            onHoldGoalSummaryChange={d.setGoalWhyHoldSummary}
          />
        </HomeSectionCard>
      );

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
        <HomeSectionCard title={d.t('home.widget.yourPause')} headerRight={d.pauseSectionHeaderRight}>
          {d.pauseCardBody}
        </HomeSectionCard>
      );

    case 'quick-capture':
    case 'night':
    case 'journey-pulse':
      return null;

    default:
      return null;
  }
}
