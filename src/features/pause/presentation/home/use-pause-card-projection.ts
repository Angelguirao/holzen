import { useMemo } from 'react';
import {
  buildHomePauseCardBodyProps,
  type BuildHomePauseCardBodyPropsInput,
  type HomePauseCardBodyPropsProjection,
} from '@/features/pause/public';
import { shouldShowHomePauseSectionSnooze } from '@/features/pause/application/use-cases/home/pause-home-widget-error';

export type UsePauseCardProjectionParams = BuildHomePauseCardBodyPropsInput & {
  subscriptionReady: boolean;
  hasAccess: boolean;
};

export type PauseCardProjection = {
  showSnoozeToolbar: boolean;
  pauseCardBodyProps: HomePauseCardBodyPropsProjection;
};

/** Read-model for Home “Your pause” widget (body props + snooze gate; screen wires JSX). */
export function usePauseCardProjection(params: UsePauseCardProjectionParams): PauseCardProjection {
  const { subscriptionReady, hasAccess, ...bodyInput } = params;

  const showSnoozeToolbar = useMemo(
    () => shouldShowHomePauseSectionSnooze(subscriptionReady, hasAccess),
    [subscriptionReady, hasAccess],
  );

  const pauseCardBodyProps = useMemo(() => buildHomePauseCardBodyProps(bodyInput), [params]);

  return { showSnoozeToolbar, pauseCardBodyProps };
}
