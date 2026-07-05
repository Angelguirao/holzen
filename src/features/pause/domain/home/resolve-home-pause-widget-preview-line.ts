import { buildHomePauseOpeningPreviewKey } from '@/features/pause/domain/home/build-home-pause-opening-preview-key';
import { hasReachedReflectForHome } from '@/features/pause/domain/home/has-reached-reflect-for-home';

export type ResolveHomePauseWidgetPreviewLineInput = {
  hasReflectionStep: boolean;
  reflectionMessage: string | null;
  trackedAssetSymbol: string;
  contextSnapshot: Record<string, unknown> | null | undefined;
  openPauseState: 'active' | 'engaged' | null;
};

export type HomePauseWidgetPreviewLine =
  | { kind: 'template'; i18nKey: ReturnType<typeof buildHomePauseOpeningPreviewKey> }
  | { kind: 'reflection'; text: string }
  | { kind: 'loading' }
  | { kind: 'none' };

/** Empathy/opening line for Home widget — template pre-Reflect, artifact after. */
export function resolveHomePauseWidgetPreviewLine(
  input: ResolveHomePauseWidgetPreviewLineInput,
): HomePauseWidgetPreviewLine {
  if (!input.openPauseState) return { kind: 'none' };

  const reached = hasReachedReflectForHome({
    hasReflectionStep: input.hasReflectionStep,
    reflectionMessage: input.reflectionMessage,
    trackedAssetSymbol: input.trackedAssetSymbol,
  });

  if (reached) {
    const text = input.reflectionMessage?.trim();
    if (text) return { kind: 'reflection', text };
    return { kind: 'loading' };
  }

  return {
    kind: 'template',
    i18nKey: buildHomePauseOpeningPreviewKey(input.contextSnapshot),
  };
}
