# Pause Session Hydration

**Status:** done (2026-04).

## What shipped

- **`PauseSession.tsx`** — Coherent hydration priority (no mixing `pauseInstanceId` from one source with `message` from another when they disagree):
  1. **localStorage** `holzen_pause_session` when it matches the incoming `pauseInstanceId` (or nav has no id).
  2. **`useHolzen`** when `lastPauseInstanceId` matches nav’s `pauseInstanceId` (or nav has no id) — profile-backed, preferred over ephemeral nav text when aligned.
  3. **Nav state** when it includes a non-empty `reflectionMessage` (e.g. Home → pause before hook caught up).
  4. **DB fetch** of `pause_instances` + `pause_ai_artifacts` when only `pauseInstanceId` is present (e.g. notification “Open pause”).
  5. **Hook-only** fallback when there is no nav id but `message` exists on the hook.
- **Loading / errors:** Spinner while fetch runs; dedicated copy when fetch/RLS fails; “no reflection” only after profile is loaded and there is still nothing to show (not only because nav was empty).
- **Restored memo** depends on `location.key` + `navPauseInstanceId` so a new navigation target invalidates stale storage.
- **Session persist** effect now lists `context`, `pauseInstanceId`, `companions`, `prefs`, `severity` in deps so post-fetch hydration is saved.

## Verify

- Open pause from Home (full state).
- Open pause from notification (id only).
- Refresh `/pause` with a saved session in localStorage.
- Direct `/pause` with no state after profile load (latest hook reflection).
