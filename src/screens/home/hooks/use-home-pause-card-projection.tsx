import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { HomePauseWidgetBody } from '@/screens/home/components/HomePauseWidgetBody';
import { SnoozeToolbarControl } from '@/screens/home/components/SnoozeControl';
import { usePauseCardProjection } from '@/features/pause/presentation/home/use-pause-card-projection';
import { useHomePauseWidgetProjection } from '@/features/pause/public-home';
import type { UseHomePauseWidgetProjectionParams } from '@/features/pause/public-home';

export type UseHomePauseCardProjectionParams = UseHomePauseWidgetProjectionParams & {
  subscriptionReady: boolean;
};

/** Screen conductor: pause widget projection + Home route components (snooze + body). */
export function useHomePauseCardProjection(params: UseHomePauseCardProjectionParams) {
  const { subscriptionReady, ...widgetParams } = params;
  const { showSnoozeToolbar } = usePauseCardProjection({
    subscriptionReady,
    hasAccess: widgetParams.hasAccess,
  });

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
