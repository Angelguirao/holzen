/** Body text for the Frame step haiku card (artifact, fallback reflection, or empty). */
export function resolveFrameHaikuDisplayBody(input: {
  artifactHaiku?: string | null;
  haikuFetch: 'idle' | 'loading' | 'done' | 'error';
  reflectionMessage: string;
}): string {
  const trimmedArtifact = input.artifactHaiku?.trim();
  if (trimmedArtifact) return trimmedArtifact;
  if (input.haikuFetch === 'error' || input.haikuFetch === 'done') {
    return input.reflectionMessage.trim();
  }
  return '';
}
