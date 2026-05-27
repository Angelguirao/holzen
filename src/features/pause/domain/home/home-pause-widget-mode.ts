import { canShowHomePauseContinueCta } from '@/features/pause/domain/home/can-show-home-pause-continue-cta';
import { hasReachedReflectForHome } from '@/features/pause/domain/home/has-reached-reflect-for-home';

/** Figma-aligned Home “Your pause” widget modes (UI projection only). */
export type HomePauseWidgetMode =
  | 'loading'
  | 'blocking_error'
  | 'calm_waters'
  | 'B'
  | 'C'
  | 'C_prime'
  | 'E'
  | 'D_collapsed'
  | 'D_expanded'
  | 'D_prime_collapsed'
  | 'D_prime_expanded'
  | 'A_collapsed'
  | 'A_expanded';

export type ResolveHomePauseWidgetModeInput = {
  loading: boolean;
  blockingError: boolean;
  showCalmWaters: boolean;
  hasOpenPause: boolean;
  openPauseState: 'active' | 'engaged' | null;
  hasReflectionStep: boolean;
  reflectionMessage: string | null;
  trackedAssetSymbol: string;
  /** From `v_pause_full.is_brief_ritual` — gates Continue to deep + Reflect only. */
  isBriefRitual: boolean;
  hasPendingOffer: boolean;
  /** Ms remaining on profile auto cooldown when no open pause (post-pause rest). */
  postPauseAutoCooldownRemainingMs: number;
  completedPauseCount: number;
  /** User expanded the widget manually (A′ / D expanded). */
  userExpanded: boolean;
};

export type HomePauseWidgetModeResult = {
  mode: HomePauseWidgetMode;
  /** Whether the section shell should start collapsed. */
  defaultCollapsed: boolean;
  hasReachedReflect: boolean;
};

export function resolveHomePauseWidgetMode(
  input: ResolveHomePauseWidgetModeInput,
): HomePauseWidgetModeResult {
  const hasReachedReflect = input.hasOpenPause
    ? hasReachedReflectForHome({
        hasReflectionStep: input.hasReflectionStep,
        reflectionMessage: input.reflectionMessage,
        trackedAssetSymbol: input.trackedAssetSymbol,
      })
    : false;

  if (input.loading && !input.hasOpenPause) {
    return { mode: 'loading', defaultCollapsed: false, hasReachedReflect };
  }

  if (input.blockingError && !input.hasOpenPause) {
    return { mode: 'blocking_error', defaultCollapsed: false, hasReachedReflect };
  }

  if (input.showCalmWaters && !input.hasOpenPause) {
    return { mode: 'calm_waters', defaultCollapsed: true, hasReachedReflect };
  }

  if (input.hasOpenPause) {
    const inPostPauseCooldown = input.postPauseAutoCooldownRemainingMs > 0;
    const hasArchive = input.completedPauseCount > 0;

    if (inPostPauseCooldown && input.openPauseState === 'active' && !hasReachedReflect) {
      return { mode: 'E', defaultCollapsed: false, hasReachedReflect };
    }

    const showContinueCta = canShowHomePauseContinueCta({
      hasReachedReflect,
      isBriefRitual: input.isBriefRitual,
    });

    if (showContinueCta && input.hasPendingOffer) {
      return { mode: 'C_prime', defaultCollapsed: false, hasReachedReflect };
    }

    if (showContinueCta) {
      return { mode: 'C', defaultCollapsed: false, hasReachedReflect };
    }

    return { mode: 'B', defaultCollapsed: false, hasReachedReflect };
  }

  const inPostPauseRest = input.postPauseAutoCooldownRemainingMs > 0;
  if (inPostPauseRest) {
    const hasArchive = input.completedPauseCount > 0;
    if (!hasArchive) {
      return {
        mode: input.userExpanded ? 'D_prime_expanded' : 'D_prime_collapsed',
        defaultCollapsed: !input.userExpanded,
        hasReachedReflect,
      };
    }
    return {
      mode: input.userExpanded ? 'D_expanded' : 'D_collapsed',
      defaultCollapsed: !input.userExpanded,
      hasReachedReflect,
    };
  }

  return {
    mode: input.userExpanded ? 'A_expanded' : 'A_collapsed',
    defaultCollapsed: !input.userExpanded,
    hasReachedReflect,
  };
}

/** Section title i18n keys per mode. */
export function homePauseWidgetSectionTitleKey(mode: HomePauseWidgetMode): string {
  switch (mode) {
    case 'C':
    case 'C_prime':
      return 'home.widget.continueYourPause';
    case 'D_collapsed':
    case 'D_expanded':
    case 'D_prime_collapsed':
    case 'D_prime_expanded':
      return 'home.widget.youPaused';
    case 'E':
      return 'home.widget.newPauseAvailable';
    default:
      return 'home.widget.yourPause';
  }
}

export function homePauseWidgetModeIsCollapsible(mode: HomePauseWidgetMode): boolean {
  return (
    mode === 'A_collapsed' ||
    mode === 'A_expanded' ||
    mode === 'D_collapsed' ||
    mode === 'D_expanded' ||
    mode === 'D_prime_collapsed' ||
    mode === 'D_prime_expanded' ||
    mode === 'calm_waters'
  );
}

export function homePauseWidgetModeIsCollapsed(mode: HomePauseWidgetMode): boolean {
  return (
    mode === 'A_collapsed' ||
    mode === 'D_collapsed' ||
    mode === 'D_prime_collapsed' ||
    mode === 'calm_waters'
  );
}
