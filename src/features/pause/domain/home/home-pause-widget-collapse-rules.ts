import type { HomePauseWidgetMode } from '@/features/pause/domain/home/home-pause-widget-mode';

const REST_MODES: HomePauseWidgetMode[] = [
  'A_collapsed',
  'A_expanded',
  'D_collapsed',
  'D_expanded',
  'D_prime_collapsed',
  'D_prime_expanded',
];

const D_MODES: HomePauseWidgetMode[] = [
  'D_collapsed',
  'D_expanded',
  'D_prime_collapsed',
  'D_prime_expanded',
];

const A_MODES: HomePauseWidgetMode[] = ['A_collapsed', 'A_expanded'];

const ACTIVE_OPEN_MODES: HomePauseWidgetMode[] = ['B', 'C', 'C_prime'];

const AUTO_EXPAND_ON_ENTER: HomePauseWidgetMode[] = ['B', 'C', 'C_prime'];

function includesMode(modes: HomePauseWidgetMode[], mode: HomePauseWidgetMode): boolean {
  return modes.includes(mode);
}

/** Pure collapse preference updates when widget mode changes (mirrors projection hook effects). */
export function resolveHomePauseWidgetExpandedAfterModeChange(input: {
  previousMode: HomePauseWidgetMode | null;
  nextMode: HomePauseWidgetMode;
  newPauseArrival: boolean;
  currentExpanded: boolean;
  /** D → A expand only when signed in (post-manual idle). */
  hasUserId: boolean;
}): boolean {
  const { previousMode, nextMode, newPauseArrival, currentExpanded, hasUserId } = input;

  if (
    hasUserId &&
    previousMode &&
    includesMode(D_MODES, previousMode) &&
    includesMode(A_MODES, nextMode)
  ) {
    return true;
  }

  if (
    previousMode &&
    includesMode(ACTIVE_OPEN_MODES, previousMode) &&
    includesMode(REST_MODES, nextMode)
  ) {
    return false;
  }

  const enteredAutoExpand =
    previousMode !== null &&
    includesMode(AUTO_EXPAND_ON_ENTER, nextMode) &&
    !includesMode(AUTO_EXPAND_ON_ENTER, previousMode);

  if (newPauseArrival || enteredAutoExpand) {
    return true;
  }

  return currentExpanded;
}
