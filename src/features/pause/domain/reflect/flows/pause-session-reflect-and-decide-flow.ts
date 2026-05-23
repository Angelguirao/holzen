import {
  buildPauseSessionReflectAndDecideView,
  type PauseSessionReflectAndDecideViewInput,
} from './pause-session-reflect-and-decide-view';

export type { PauseSessionReflectAndDecideViewInput };

type ReflectAndDecidePreflightInput = Omit<
  PauseSessionReflectAndDecideViewInput,
  'generatedReflectionMessage'
>;

/** Before holzen-reflect: generation gate + severity from nav seed only. */
export function resolvePauseSessionReflectAndDecidePreflight(input: ReflectAndDecidePreflightInput) {
  return buildPauseSessionReflectAndDecideView({
    ...input,
    generatedReflectionMessage: input.seedMessage,
  });
}

/** After holzen-reflect: effective copy from generated message + seed fallback. */
export function resolvePauseSessionReflectAndDecideAfterGeneration(
  input: PauseSessionReflectAndDecideViewInput,
) {
  return buildPauseSessionReflectAndDecideView(input);
}
