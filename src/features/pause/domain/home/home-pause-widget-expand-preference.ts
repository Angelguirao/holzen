import type { HomePauseWidgetSurface } from '@/features/pause/domain/home/home-pause-widget-surface';

const REST_SURFACES: HomePauseWidgetSurface[] = [
  'idle_collapsed',
  'idle_expanded',
  'manual_cooldown_collapsed',
  'manual_cooldown_expanded',
  'manual_cooldown_first_pause_collapsed',
  'manual_cooldown_first_pause_expanded',
];

const MANUAL_COOLDOWN_SURFACES: HomePauseWidgetSurface[] = [
  'manual_cooldown_collapsed',
  'manual_cooldown_expanded',
  'manual_cooldown_first_pause_collapsed',
  'manual_cooldown_first_pause_expanded',
];

const IDLE_SURFACES: HomePauseWidgetSurface[] = ['idle_collapsed', 'idle_expanded'];

const OPEN_PAUSE_SURFACES: HomePauseWidgetSurface[] = [
  'open_pre_reflect',
  'open_engaged',
  'open_engaged_pending_offer',
];

function includesSurface(
  surfaces: HomePauseWidgetSurface[],
  surface: HomePauseWidgetSurface,
): boolean {
  return surfaces.includes(surface);
}

/** Pure expand-preference updates when widget surface changes. */
export function resolveHomePauseWidgetExpandedAfterSurfaceChange(input: {
  previousSurface: HomePauseWidgetSurface | null;
  nextSurface: HomePauseWidgetSurface;
  newPauseArrival: boolean;
  currentExpanded: boolean;
  hasUserId: boolean;
}): boolean {
  const { previousSurface, nextSurface, newPauseArrival, currentExpanded, hasUserId } = input;

  if (
    hasUserId &&
    previousSurface &&
    includesSurface(MANUAL_COOLDOWN_SURFACES, previousSurface) &&
    includesSurface(IDLE_SURFACES, nextSurface)
  ) {
    return true;
  }

  if (
    previousSurface &&
    includesSurface(OPEN_PAUSE_SURFACES, previousSurface) &&
    includesSurface(REST_SURFACES, nextSurface)
  ) {
    return false;
  }

  const enteredOpenPauseSurface =
    previousSurface !== null &&
    includesSurface(OPEN_PAUSE_SURFACES, nextSurface) &&
    !includesSurface(OPEN_PAUSE_SURFACES, previousSurface);

  if (newPauseArrival || enteredOpenPauseSurface) {
    return true;
  }

  return currentExpanded;
}
