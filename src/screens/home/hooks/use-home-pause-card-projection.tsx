import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { HomePauseWidgetBody } from '@/screens/home/components/HomePauseWidgetBody';
import { SnoozeToolbarControl } from '@/screens/home/components/SnoozeControl';
import { usePauseCardProjection } from '@/features/pause/presentation/home/use-pause-card-projection';
import { useHomePauseWidgetProjection } from '@/features/pause/presentation/home/use-home-pause-widget-projection';
import type { UseHomePauseWidgetProjectionParams } from '@/features/pause/presentation/home/use-home-pause-widget-projection';

export type UseHomePauseCardProjectionParams = UseHomePauseWidgetProjectionParams & {
  subscriptionReady: boolean;
};

/** Screen conductor: pause widget projection + Home route components (snooze + body). */
export function useHomePauseCardProjection(params: UseHomePauseCardProjectionParams) {
  const { subscriptionReady, hasAccess, ...widgetParams } = params;
  const { showSnoozeToolbar } = usePauseCardProjection({ subscriptionReady, hasAccess });

  const widgetProjection = useHomePauseWidgetProjection(widgetParams);

  const pauseSectionHeaderRight = useMemo((): ReactNode | undefined => {
    if (!showSnoozeToolbar) return undefined;
    return <SnoozeToolbarControl />;
  }, [showSnoozeToolbar]);

  const pauseCardBody = useMemo(
    () => <HomePauseWidgetBody {...widgetProjection.body} />,
    [widgetProjection.body],
  );

  return {
    pauseSectionHeaderRight,
    pauseCardBody,
    pauseWidgetProjection: widgetProjection,
  };
}
