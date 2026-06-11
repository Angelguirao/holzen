import { hasReachedReflectForHome } from '@/features/pause/domain/home/has-reached-reflect-for-home';

/**
 * Home “Your pause” widget **surface** — derived UI state from pause lifecycle + profile.
 * Names reflect user-visible situations, not design artifacts.
 */
export type HomePauseWidgetSurface =
  | 'loading'
  | 'blocking_error'
  /** Open pause, pre-Reflect — primary CTA: Let's pause. */
  | 'open_pre_reflect'
  /** Open pause, Reflect reached — Continue / Discard. */
  | 'open_engaged'
  /** Engaged open pause + cron pending offer queued — adopt / decline branch. */
  | 'open_engaged_pending_offer'
  /** Manual trigger cooldown (has archive) — collapsed shell. */
  | 'manual_cooldown_collapsed'
  /** Manual trigger cooldown (has archive) — expanded cooldown copy. */
  | 'manual_cooldown_expanded'
  /** Manual trigger cooldown (no archive yet) — collapsed. */
  | 'manual_cooldown_first_pause_collapsed'
  /** Manual trigger cooldown (no archive yet) — expanded. */
  | 'manual_cooldown_first_pause_expanded'
  /** No open pause, market idle — collapsed (chevron only). */
  | 'idle_collapsed'
  /** No open pause — expanded Let's pause onboarding. */
  | 'idle_expanded';

export type ResolveHomePauseWidgetSurfaceInput = {
  loading: boolean;
  blockingError: boolean;
  hasOpenPause: boolean;
  openPauseState: 'active' | 'engaged' | null;
  hasReflectionStep: boolean;
  reflectionMessage: string | null;
  trackedAssetSymbol: string;
  hasPendingOffer: boolean;
  /** Ms remaining on Home manual “Let’s pause” local cooldown (localStorage only). */
  manualCooldownRemainingMs: number;
  completedPauseCount: number;
  /** Reserved — ritual progress does not change Home surface; only `engaged` unlocks Continue. */
  hasOpenPauseStepEvents: boolean;
  /** User expanded the collapsible shell manually. */
  userExpanded: boolean;
};

export type HomePauseWidgetSurfaceResult = {
  surface: HomePauseWidgetSurface;
  /** Whether the section shell should start collapsed. */
  defaultCollapsed: boolean;
  hasReachedReflect: boolean;
};

export function resolveHomePauseWidgetSurface(
  input: ResolveHomePauseWidgetSurfaceInput,
): HomePauseWidgetSurfaceResult {
  const hasReachedReflect = input.hasOpenPause
    ? hasReachedReflectForHome({
        hasReflectionStep: input.hasReflectionStep,
        reflectionMessage: input.reflectionMessage,
        trackedAssetSymbol: input.trackedAssetSymbol,
      })
    : false;

  if (input.loading) {
    return { surface: 'loading', defaultCollapsed: false, hasReachedReflect };
  }

  if (input.blockingError && !input.hasOpenPause) {
    return { surface: 'blocking_error', defaultCollapsed: false, hasReachedReflect };
  }

  if (input.hasOpenPause) {
    if (input.openPauseState === 'engaged') {
      if (input.hasPendingOffer) {
        return { surface: 'open_engaged_pending_offer', defaultCollapsed: false, hasReachedReflect };
      }
      return { surface: 'open_engaged', defaultCollapsed: false, hasReachedReflect };
    }

    return { surface: 'open_pre_reflect', defaultCollapsed: false, hasReachedReflect };
  }

  if (input.manualCooldownRemainingMs > 0) {
    const hasArchive = input.completedPauseCount > 0;
    if (!hasArchive) {
      return {
        surface: input.userExpanded
          ? 'manual_cooldown_first_pause_expanded'
          : 'manual_cooldown_first_pause_collapsed',
        defaultCollapsed: !input.userExpanded,
        hasReachedReflect,
      };
    }
    return {
      surface: input.userExpanded ? 'manual_cooldown_expanded' : 'manual_cooldown_collapsed',
      defaultCollapsed: !input.userExpanded,
      hasReachedReflect,
    };
  }

  return {
    surface: input.userExpanded ? 'idle_expanded' : 'idle_collapsed',
    defaultCollapsed: !input.userExpanded,
    hasReachedReflect,
  };
}

export function homePauseWidgetSectionTitleKey(surface: HomePauseWidgetSurface): string {
  switch (surface) {
    case 'open_engaged':
    case 'open_engaged_pending_offer':
      return 'home.widget.continueYourPause';
    default:
      return 'home.widget.yourPause';
  }
}

export function homePauseWidgetSurfaceIsCollapsible(surface: HomePauseWidgetSurface): boolean {
  return (
    surface === 'idle_collapsed' ||
    surface === 'idle_expanded' ||
    surface === 'manual_cooldown_collapsed' ||
    surface === 'manual_cooldown_expanded' ||
    surface === 'manual_cooldown_first_pause_collapsed' ||
    surface === 'manual_cooldown_first_pause_expanded'
  );
}

export function homePauseWidgetSurfaceIsCollapsed(surface: HomePauseWidgetSurface): boolean {
  return (
    surface === 'idle_collapsed' ||
    surface === 'manual_cooldown_collapsed' ||
    surface === 'manual_cooldown_first_pause_collapsed'
  );
}

export function homePauseWidgetSurfaceIsManualCooldownWithArchive(
  surface: HomePauseWidgetSurface,
): boolean {
  return surface === 'manual_cooldown_collapsed' || surface === 'manual_cooldown_expanded';
}

export function homePauseWidgetSurfaceIsManualCooldownFirstPause(
  surface: HomePauseWidgetSurface,
): boolean {
  return (
    surface === 'manual_cooldown_first_pause_collapsed' ||
    surface === 'manual_cooldown_first_pause_expanded'
  );
}

export function homePauseWidgetSurfaceIsManualCooldown(surface: HomePauseWidgetSurface): boolean {
  return (
    homePauseWidgetSurfaceIsManualCooldownWithArchive(surface) ||
    homePauseWidgetSurfaceIsManualCooldownFirstPause(surface)
  );
}
