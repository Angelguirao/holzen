/**
 * Mirrors `pause_sweep_window_elapsed`: `pending` rows with `created_at` older than
 * this interval are expired server-side (`system_cancelled` + `pending_stale_ttl`).
 * Client hides the pending-offer hint if the row is still `pending` before the sweep runs.
 */
export const PAUSE_PENDING_OFFER_STALE_MS = 12 * 60 * 60 * 1000;
