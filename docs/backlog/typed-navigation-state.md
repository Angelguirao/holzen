# Typed React Router navigation state

**Status:** shipped (2026-04) for primary structured payloads; extend the same module for new routes as needed.

## What shipped

**Module:** `src/lib/router-location-state.ts`

- **`PauseSessionLocationState`** + **`parsePauseSessionLocationState`** — used by **`PauseSession`** (`/pause`).
- **`GroundPreGenerated`** / **`GroundLocationState`** + **`parseGroundLocationState`** — used by **`Ground`**; **`Home`** uses **`GroundPreGenerated`** for the grounding widget and `navigate(TOOLS.ground, { state })` (`/tools/ground`).
- **`ProfileTab`**, **`PROFILE_TAB_IDS`** — used by **Journey** (`/journey/*`) and **`journeyPath()`**; **letters** live at **`/tools/letters`** (`toolsLettersPath()`, query **`?letter=`** for deep links), not `location.state`.
- **`NotificationNavigateState`** — pause-related router state for **`NotificationBell`** (same shape as **`PauseSessionLocationState`** where `action_state` is set).

Parsers narrow **`unknown`** / wire objects at runtime (companions, prefs, grounding payload) so consumers avoid **`as any`**.

## Rationale (unchanged)

Typed state catches drift between `navigate(..., { state })` senders and page receivers at compile time and documents the contract for [pause-session-hydration.md](pause-session-hydration.md).

## Follow-ups (optional)

- Add parsers for any new routes that pass structured **`location.state`**.
- Consider a thin **`usePauseLocationState()`** hook if call sites multiply.

## Related

- [route-gating.md](route-gating.md) — auth loading vs route UX.
- [systems/routing/route-gating-system.md](../systems/routing/route-gating-system.md) — route contracts.
