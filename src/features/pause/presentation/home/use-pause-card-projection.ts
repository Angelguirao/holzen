import { useMemo } from 'react';
import { shouldShowHomePauseSectionSnooze } from '@/features/pause/domain/home/pause-home-widget-error';

export type UsePauseCardProjectionParams = {
  subscriptionReady: boolean;
  hasAccess: boolean;
};

export type PauseCardProjection = {
  showSnoozeToolbar: boolean;
};

/** Snooze toolbar gate for Home “Your pause” section header. */
export function usePauseCardProjection(params: UsePauseCardProjectionParams): PauseCardProjection {
  const { subscriptionReady, hasAccess } = params;

  const showSnoozeToolbar = useMemo(
    () => shouldShowHomePauseSectionSnooze(subscriptionReady, hasAccess),
    [subscriptionReady, hasAccess],
  );

  return { showSnoozeToolbar };
}
