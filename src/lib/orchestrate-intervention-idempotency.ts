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

/**
 * In-memory fallback for environments where `sessionStorage` is unavailable
 * or throws on access — Safari ITP after the 7-day cap, private/Lockdown
 * mode, embedded webviews with storage disabled, or quota-exceeded errors.
 *
 * Without this set, a `sessionStorage.setItem` failure would silently drop
 * the marker. The single-flight `inFlight` Map clears as soon as the
 * promise settles, so a subsequent remount (StrictMode's second pass, a
 * route bounce) would re-fire `companion-orchestrate` for the same
 * `reflectionId` — exactly the duplicate-call regression this module
 * exists to prevent.
 *
 * The set is per tab (module-scoped, lost on full reload) which mirrors
 * `sessionStorage` semantics closely enough for the intervention contract:
 * "at most one call per reflectionId per tab session".
 */
const memoryMarkers = new Set<string>();

// ── Metrics ──────────────────────────────────────────────────────────────────
// We instrument the idempotency layer itself so every caller (current and
// future) is observed without needing to remember to log at the call-site.
//
//  - `intervention_idempotency_skip` — caller asked, marker already set.
//  - `intervention_idempotency_dedup` — concurrent caller joined the in-flight
//    Promise (StrictMode double-invoke, fast remounts).
//  - `intervention_first_call_latency` — wall-clock latency of the *first*
//    real invocation per `reflectionId`, captured on success or failure.
//
// Events are forwarded to PostHog via `trackEvent` (no-op when PostHog is
// disabled) and mirrored to the `[holzen:companion]` console channel so
// they show up in dev / VITE_HOLZEN_DEBUG=1 builds.
import { trackEvent } from '@/lib/posthog';
import { holzenLog } from '@/lib/holzen-console';

function emit(event: string, props: Record<string, unknown>): void {
  try {
    trackEvent(event, props);
  } catch {
    /* posthog itself swallows errors — this is belt-and-suspenders */
  }
  try {
    holzenLog.companion(event, props);
  } catch {
    /* ignore */
  }
}

function reflectionPrefix(id: string): string {
  return id.slice(0, 8);
}

function storageKey(reflectionId: string): string {
  return `${STORAGE_PREFIX}${reflectionId}`;
}

/**
 * Canonical form of a `reflectionId` used for every map / storage / Set
 * lookup in this module. Reflection IDs are UUIDs minted by Postgres and
 * are already lowercase in the happy path, but they can reach the
 * idempotency layer via:
 *
 *  - React Router `useParams()` (string from the URL — preserves whatever
 *    case the link was generated with),
 *  - hand-crafted deep links shared between users,
 *  - copy-pasted IDs from the admin dashboard.
 *
 * Without normalization, `"ABC..."` and `"abc..."` would write to two
 * separate sessionStorage slots and the duplicate-call guarantee would
 * silently break across remounts that disagree on case. Trim guards
 * against accidental whitespace from query-string parsing.
 */
function normalizeReflectionId(reflectionId: string): string {
  return reflectionId.trim().toLowerCase();
}

/**
 * Returns true iff the intervention call has already been issued in this
 * tab session for the given reflection. Safe to call from SSR — degrades
 * to "not yet invoked" when `sessionStorage` is unavailable.
 */
export function hasInvokedIntervention(reflectionId: string): boolean {
  if (!reflectionId) return false;
  const id = normalizeReflectionId(reflectionId);
  if (!id) return false;
  if (inFlight.has(id)) {
    emit('intervention_idempotency_skip', {
      reflection_prefix: reflectionPrefix(id),
      layer: 'in_flight',
    });
    return true;
  }
  try {
    const hit = sessionStorage.getItem(storageKey(id)) === '1';
    if (hit) {
      emit('intervention_idempotency_skip', {
        reflection_prefix: reflectionPrefix(id),
        layer: 'session_storage',
      });
      return true;
    }
  } catch (err) {
    emit('intervention_idempotency_storage_error', {
      reflection_prefix: reflectionPrefix(id),
      op: 'getItem',
      error_name: (err as { name?: string } | null)?.name ?? 'unknown',
    });
    /* fall through to in-memory fallback */
  }
  if (memoryMarkers.has(id)) {
    emit('intervention_idempotency_skip', {
      reflection_prefix: reflectionPrefix(id),
      layer: 'memory_fallback',
    });
    emit('intervention_idempotency_fallback_used', {
      reflection_prefix: reflectionPrefix(id),
      phase: 'read',
    });
    return true;
  }
  return false;
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
  const key = normalizeReflectionId(reflectionId);
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) {
    emit('intervention_idempotency_dedup', {
      reflection_prefix: reflectionPrefix(key),
    });
    return existing;
  }

  const startedAt =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  const promise = (async () => {
    try {
      const result = await factory();
      // Always set the in-memory fallback first — it cannot throw and
      // guarantees the marker survives a sessionStorage failure.
      memoryMarkers.add(key);
      try {
        sessionStorage.setItem(storageKey(key), '1');
      } catch (err) {
        emit('intervention_idempotency_storage_error', {
          reflection_prefix: reflectionPrefix(key),
          op: 'setItem',
          error_name: (err as { name?: string } | null)?.name ?? 'unknown',
        });
        emit('intervention_idempotency_fallback_used', {
          reflection_prefix: reflectionPrefix(key),
          phase: 'write',
        });
        /* private mode / storage full — best-effort */
      }
      emit('intervention_first_call_latency', {
        reflection_prefix: reflectionPrefix(key),
        latency_ms: Math.round(
          (typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now()) - startedAt,
        ),
        outcome: 'success',
      });
      return result;
    } catch (err) {
      // Allow a manual retry to fire a fresh call; the in-memory entry is
      // dropped in `finally` below either way.
      memoryMarkers.delete(key);
      try {
        sessionStorage.removeItem(storageKey(key));
      } catch (err) {
        emit('intervention_idempotency_storage_error', {
          reflection_prefix: reflectionPrefix(key),
          op: 'removeItem',
          error_name: (err as { name?: string } | null)?.name ?? 'unknown',
        });
      }
      emit('intervention_first_call_latency', {
        reflection_prefix: reflectionPrefix(key),
        latency_ms: Math.round(
          (typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now()) - startedAt,
        ),
        outcome: 'error',
      });
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
  memoryMarkers.delete(reflectionId);
  try {
    sessionStorage.removeItem(storageKey(reflectionId));
  } catch {
    /* ignore */
  }
}

/**
 * Idempotency decision for a given `reflectionId`. UI layers (e.g. the
 * retry affordance on the Pause screen) use this to render an accurate
 * skip message instead of guessing from the boolean `hasInvokedIntervention`.
 *
 *  - `none`               — no marker found; a fresh call will fire.
 *  - `inFlight`           — a call is currently in progress in this tab.
 *  - `completedStorage`   — a prior call finished and the marker survives
 *                           in `sessionStorage` (normal browser path).
 *  - `completedFallback`  — a prior call finished and the marker only
 *                           lives in the in-memory Set because
 *                           `sessionStorage` is unavailable / threw
 *                           (Safari ITP, private mode, quota exceeded).
 */
export type InterventionIdempotencyDecision =
  | 'none'
  | 'inFlight'
  | 'completedStorage'
  | 'completedFallback';

/**
 * Pure read — does not emit telemetry (callers may poll on every render).
 * Mirrors the precedence used inside `hasInvokedIntervention`:
 *   in-flight Map → sessionStorage → in-memory fallback Set.
 */
export function getInterventionIdempotencyDecision(
  reflectionId: string,
): InterventionIdempotencyDecision {
  if (!reflectionId) return 'none';
  if (inFlight.has(reflectionId)) return 'inFlight';
  try {
    if (sessionStorage.getItem(storageKey(reflectionId)) === '1') {
      return 'completedStorage';
    }
  } catch {
    /* fall through */
  }
  if (memoryMarkers.has(reflectionId)) return 'completedFallback';
  return 'none';
}
