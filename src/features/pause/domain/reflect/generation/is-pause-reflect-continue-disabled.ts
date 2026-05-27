/** Reflect-step Continue: allow skip after error or when copy exists; block only when there is nothing to show yet. */
export function isPauseReflectContinueDisabled(input: {
  reflectionError: string | null;
  reflectionMessage: string;
}): boolean {
  if (input.reflectionError) return false;
  return input.reflectionMessage.trim().length === 0;
}
