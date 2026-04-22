/**
 * Per-trigger idempotency for the AI intervention call.
 *
 * The AI "intervention" recommendation served on the pause screen is keyed
 * one-to-one against a `reflectionId` (each volatility trigger or manual
 * pause inserts exactly one reflection row). Once that recommendation has
 * been requested for a given reflection we never need to call
 * `companion-orchestrate` again for the same id — the persisted result
 * lives in `reflection_companions` and is hydrated via
 * `fetchParsedReflectionCompanionCache`.
 *
 * In practice though, the network call could still fire multiple times
 * within a single tab session even when the user has not opened a brand
 * new pause:
 *
 *  - React StrictMode double-invokes effects in development.
 *  - Fast component remounts (route navigation back-and-forth, modal open
 *    + close, mood change re-renders) re-run the effect before the server
 *    has had time to commit the row that the cache lookup reads.
 *  - The user comes back to the Pause screen *during* the cooldown window
 *    while the same reflection is still active.
 *
 * We absorb all three cases with two layered guards:
 *
 *  1. **In-memory single-flight Map** — captures the in-flight Promise so
 *     two concurrent renders share one network call (handles StrictMode +
 *     near-simultaneous remounts before sessionStorage is written).
 *  2. **`sessionStorage` marker** — survives any number of remounts within
 *     the same tab session and intentionally does *not* survive a tab
 *     close (a fresh tab represents a fresh attempt at the user's
 *     discretion; the server-side cache will still short-circuit the
 *     duplicate call once it returns).
 *
 * The combination guarantees: **at most one `companion-orchestrate`
 * intervention invocation per `reflectionId` per tab session**, regardless
 * of remount frequency.
 */
const STORAGE_PREFIX = 'holzen.orchestrate.intervention.invoked:';

const inFlight = new Map<string, Promise<unknown>>();

function storageKey(reflectionId: string): string {
  return `${STORAGE_PREFIX}${reflectionId}`;
}

/**
 * Returns true iff the intervention call has already been issued in this
 * tab session for the given reflection. Safe to call from SSR — degrades
 * to "not yet invoked" when `sessionStorage` is unavailable.
 */
export function hasInvokedIntervention(reflectionId: string): boolean {
  if (!reflectionId) return false;
  if (inFlight.has(reflectionId)) return true;
  try {
    return sessionStorage.getItem(storageKey(reflectionId)) === '1';
  } catch {
    return false;
  }
}

/**
 * Single-flight wrapper. Concurrent callers with the same `reflectionId`
 * share the same Promise; subsequent callers (after resolution) read the
 * sessionStorage marker via `hasInvokedIntervention` and should bail
 * before reaching this function.
 *
 * If `factory` rejects we *also* clear the marker so the user can retry
 * via the existing retry affordance (`retryOrchestrate`) without the
 * idempotency guard wedging them out.
 */
export async function runOnceIntervention<T>(
  reflectionId: string,
  factory: () => Promise<T>,
): Promise<T> {
  const key = reflectionId;
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = (async () => {
    try {
      const result = await factory();
      try {
        sessionStorage.setItem(storageKey(key), '1');
      } catch {
        /* private mode / storage full — best-effort */
      }
      return result;
    } catch (err) {
      // Allow a manual retry to fire a fresh call; the in-memory entry is
      // dropped in `finally` below either way.
      try {
        sessionStorage.removeItem(storageKey(key));
      } catch {
        /* ignore */
      }
      throw err;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

/**
 * Explicit reset hook for the manual retry path (e.g. user taps "Try
 * again" after a failed intervention). Clears both layers so the next
 * call falls through cleanly.
 */
export function resetInterventionIdempotency(reflectionId: string): void {
  if (!reflectionId) return;
  inFlight.delete(reflectionId);
  try {
    sessionStorage.removeItem(storageKey(reflectionId));
  } catch {
    /* ignore */
  }
}
