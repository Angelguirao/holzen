/**
 * Client-side mirror of Edge `DISABLE_COMPANION_FALLBACKS`.
 * Set `VITE_DISABLE_COMPANION_FALLBACKS=1` in `.env` / preview env so the UI does not
 * substitute local fallbacks when AI calls fail (pairs with the same flag on functions).
 */
export function companionFallbacksDisabledClient(): boolean {
  const v = import.meta.env.VITE_DISABLE_COMPANION_FALLBACKS as string | undefined;
  return v === '1' || v === 'true' || v === 'yes';
}
