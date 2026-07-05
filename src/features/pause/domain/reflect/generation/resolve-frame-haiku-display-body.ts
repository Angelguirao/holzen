/** Body text for the Frame step haiku card (artifact, fallback reflection, or empty). */
export function resolveFrameHaikuDisplayBody(input: {
  artifactHaiku?: string | null;
  haikuFetch: 'idle' | 'loading' | 'done' | 'error';
  reflectionMessage: string;
}): string {
  const trimmedArtifact = input.artifactHaiku?.trim();
  if (trimmedArtifact) return trimmedArtifact;

  const trimmedReflection = input.reflectionMessage.trim();
  if (!trimmedReflection) return '';

  // Show the card while the artifact read is in flight (and when no row exists yet).
  // Real haiku replaces this once `artifactHaiku` hydrates.
  return trimmedReflection;
}
