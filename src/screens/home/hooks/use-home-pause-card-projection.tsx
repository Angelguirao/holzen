import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { HomePauseWidgetBody } from '@/screens/home/components/HomePauseWidgetBody';
import { PauseWelcomeBackSheet } from '@/screens/home/components/PauseWelcomeBackSheet';
import { SnoozeToolbarControl } from '@/screens/home/components/SnoozeControl';
import { usePauseCardProjection } from '@/features/pause/public-home';
import {
  useHomePauseWidgetProjection,
  type UseHomePauseWidgetScreenDeps,
} from '@/features/pause/public-home';

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

  const pauseWelcomeBackSheet = useMemo(
    () => (
      <PauseWelcomeBackSheet
        open={widgetProjection.welcomeBackOpen}
        onOpenChange={widgetProjection.setWelcomeBackOpen}
        onContinue={widgetProjection.welcomeBackHandlers.onContinue}
        onStartOver={widgetProjection.welcomeBackHandlers.onStartOver}
        onDiscard={widgetProjection.welcomeBackHandlers.onDiscard}
        hasPendingOffer={widgetProjection.welcomeBackHasPendingOffer}
        openPauseOpenMaxAnchorAt={widgetProjection.welcomeBackOpenMaxAnchorAt}
      />
    ),
    [
      widgetProjection.welcomeBackOpen,
      widgetProjection.setWelcomeBackOpen,
      widgetProjection.welcomeBackHandlers,
    ],
  );

  return {
    pauseSectionHeaderRight,
    pauseCardBody,
    pauseWelcomeBackSheet,
    pauseWidgetProjection: widgetProjection,
  };
}
