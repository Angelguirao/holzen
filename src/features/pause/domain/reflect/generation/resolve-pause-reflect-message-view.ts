export type PauseReflectMessageView = 'error' | 'loading' | 'body';

/** Which reflection message surface to show (parity with `PauseReflectCard` branches). */
export function resolvePauseReflectMessageView(input: {
  reflectionError: string | null;
  reflectionLoading: boolean;
  reflectionMessage: string;
}): PauseReflectMessageView {
  if (input.reflectionError) return 'error';
  if (input.reflectionLoading && !input.reflectionMessage.trim()) return 'loading';
  return 'body';
}
