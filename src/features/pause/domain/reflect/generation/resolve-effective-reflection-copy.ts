/** Session/nav seed first; otherwise persisted `reflection_text` from artifacts. */
export function resolveEffectiveReflectionCopy(
  reflectionMessage: string,
  artifactReflectionText: string | null | undefined,
): string {
  const prop = reflectionMessage.trim();
  if (prop) return prop;
  return (artifactReflectionText ?? '').trim();
}
