/** Prefer generated copy when non-empty; otherwise keep session message seed. */
export function resolveEffectiveReflectionMessage(
  generatedMessage: string,
  sessionMessage: string,
): string {
  const trimmed = generatedMessage.trim();
  return trimmed || sessionMessage;
}
