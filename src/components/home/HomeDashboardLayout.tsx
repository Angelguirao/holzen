import type { HTMLAttributes, ReactNode } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { HomeHeroQuote } from '@/components/home/HomeHeroQuote';
import { HomeCustomizeSheet } from '@/components/home/HomeCustomizeSheet';
import { HomeStatTiles } from '@/components/home/HomeStatTiles';
import { HomePullRefreshIndicator } from '@/components/home/HomePullRefreshIndicator';
import { HomeCustomizeLinkButton } from '@/components/home/HomeCustomizeLinkButton';
import { InstallHolzenCard } from '@/components/InstallHolzenCard';
import { TestimonialRequest } from '@/components/TestimonialRequest';
import { JOURNEY_STAT_TILES_VISIBILITY_ID } from '@/hooks/use-home-optional-visibility';

export interface HomeDashboardLayoutCustomizeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: string[];
  onReorder: (next: string[]) => void;
  visible: Record<string, boolean>;
  onSetVisible: (id: string, value: boolean) => void;
  sectionTitle: (id: string) => string;
  sectionDescription: (id: string) => string;
  zenMode: boolean;
  onZenModeChange: (zen: boolean) => void;
  onResetAll: () => void;
  nightToggleDisabled: boolean;
  dndRemountKey: number;
}

export type HomePullHandlers = Pick<
  HTMLAttributes<HTMLDivElement>,
  'onTouchStart' | 'onTouchMove' | 'onTouchEnd'
>;

export interface HomeDashboardLayoutProps {
  pullHandlers: HomePullHandlers;
  pullDistance: number;
  pullRefreshing: boolean;
  userId: string | undefined;
  firstName: string | null | undefined;
  todaySectionIds: string[];
  showJourneyStatTiles: boolean;
  goalWhyBlock: ReactNode | null;
  renderSection: (sectionId: string) => ReactNode;
  onOpenCustomize: () => void;
  customize: HomeDashboardLayoutCustomizeProps;
  completedPauseCount: number;
}

/** Full Home dashboard shell: hero, widgets, customize sheet, testimonial (non-zen). */
export const HomeDashboardLayout = memo(function HomeDashboardLayout({
  pullHandlers,
  pullDistance,
  pullRefreshing,
  userId,
  firstName,
  todaySectionIds,
  showJourneyStatTiles,
  goalWhyBlock,
  renderSection,
  onOpenCustomize,
  customize,
  completedPauseCount,
}: HomeDashboardLayoutProps) {
  const { t } = useTranslation();

  return (
    <div {...pullHandlers} className="space-y-6">
      <HomeHeroQuote userId={userId} firstName={firstName} />

      <InstallHolzenCard />

      <HomePullRefreshIndicator pullDistance={pullDistance} pullRefreshing={pullRefreshing} />

      <div className="space-y-4">
        {todaySectionIds.length === 0 ? (
          <div className="flex justify-end">
            <HomeCustomizeLinkButton label={t('home.customize')} onClick={onOpenCustomize} />
          </div>
        ) : null}
        {goalWhyBlock ? <div key="goal-why">{goalWhyBlock}</div> : null}
        {todaySectionIds.length > 0 ? (
          <section aria-labelledby="home-today-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="home-today-heading" className="text-base font-medium text-foreground">
                {t('home.today')}
              </h2>
              <HomeCustomizeLinkButton
                label={t('home.customize')}
                onClick={onOpenCustomize}
                variant="shrink"
              />
            </div>
            <div className="space-y-4">
              {todaySectionIds.map((sectionId) => {
                if (sectionId === JOURNEY_STAT_TILES_VISIBILITY_ID) {
                  if (!showJourneyStatTiles) return null;
                  return (
                    <div key={sectionId}>
                      <HomeStatTiles />
                    </div>
                  );
                }
                const node = renderSection(sectionId);
                if (node == null) return null;
                return <div key={sectionId}>{node}</div>;
              })}
            </div>
          </section>
        ) : null}
      </div>

      <HomeCustomizeSheet
        open={customize.open}
        onOpenChange={customize.onOpenChange}
        order={customize.order}
        onReorder={customize.onReorder}
        visible={customize.visible}
        onSetVisible={customize.onSetVisible}
        sectionTitle={customize.sectionTitle}
        sectionDescription={customize.sectionDescription}
        zenMode={customize.zenMode}
        onZenModeChange={customize.onZenModeChange}
        onResetAll={customize.onResetAll}
        nightToggleDisabled={customize.nightToggleDisabled}
        dndRemountKey={customize.dndRemountKey}
      />

      <TestimonialRequest completedPauseCount={completedPauseCount} />
    </div>
  );
});
