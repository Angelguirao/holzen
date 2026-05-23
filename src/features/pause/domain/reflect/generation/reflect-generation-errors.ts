/** True when an error represents an aborted `holzen-reflect` fetch (superseded run or cleanup). */
export function isAbortLikeReflectError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  if (e instanceof Error && e.name === 'AbortError') return true;
  if (typeof e === 'object' && e !== null && 'name' in e && (e as { name: unknown }).name === 'AbortError') {
    return true;
  }
  return false;
}

/** User-facing copy for Reflect-step generation failures (hook maps raw edge/network messages). */
export function reflectGenerationUserErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Could not reach Holzen. Check your connection.';
  }
  if (lower.includes('rate') || lower.includes('limit') || lower.includes('429')) {
    return 'Too many requests — please wait a moment and try again.';
  }
  return 'Reflection unavailable right now. Try again shortly.';
}
