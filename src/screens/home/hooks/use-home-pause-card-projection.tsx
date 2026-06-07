import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { HomePauseWidgetBody } from '@/screens/home/components/HomePauseWidgetBody';
import { SnoozeToolbarControl } from '@/screens/home/components/SnoozeControl';
import { usePauseCardProjection } from '@/features/pause/presentation/home/use-pause-card-projection';
import {
  useHomePauseWidgetProjection,
  type UseHomePauseWidgetScreenDeps,
} from '@/features/pause/presentation/home/use-home-pause-widget-projection';

export type UseHomePauseCardProjectionParams = UseHomePauseWidgetScreenDeps;

/** Screen conductor: pause widget projection + Home route components (snooze + body). */
export function useHomePauseCardProjection(params: UseHomePauseCardProjectionParams) {
  const widgetProjection = useHomePauseWidgetProjection(params);

  const { showSnoozeToolbar } = usePauseCardProjection({
    subscriptionReady: params.subscriptionReady,
    hasAccess: widgetProjection.body.subscription.hasAccess,
  });

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
