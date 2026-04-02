# Phase 2: Manual pause pipeline review (client → edge functions)

## Scope

Manual pause entry into `/pause` and the first-order chain of responsibility:

- `src/pages/Home.tsx` (creates reflection + navigates to `/pause`)
- `src/pages/PauseSession.tsx` (pause UI orchestration + session restoration)
- `src/hooks/use-holzen.ts` (invokes `holzen-reflect` and writes `reflections` / `profiles` / `library_items`)
- `src/components/pause/PauseReflect.tsx` + `src/components/CompanionSection.tsx` (featured intervention + companion cards)
- `src/hooks/use-companion-data.ts` (invokes `companion-orchestrate`)
- `supabase/functions/holzen-reflect/index.ts` + `supabase/functions/companion-orchestrate/index.ts`

## Key flow (manual happy path)

1. User clicks the pause button in `Home.tsx`.
2. `useHolzen.manualTrigger()` (inside `useHolzen`) calls `holzen-reflect` to get `{ message, haiku, grounding_* }`.
3. `useHolzen` inserts the reflection into `reflections` and updates `profiles.last_message/last_context` (+ `library_items` bookmarks).
4. `Home.tsx` navigates to `/pause` with state containing:
   - `reflectionMessage`, `context`, `reflectionId`, `companions` (haiku + grounding snippet), `companionPrefs`, `severity`.
5. `PauseSession.tsx` renders `PauseReflect` and `CompanionSection`.
6. `useCompanionData` invokes `companion-orchestrate` to generate the *expanded* companions + choose an intervention headline.

## Findings

### 1. Notification deep-link likely opens `/pause` in a “noReflection” state

- `src/components/NotificationBell.tsx` opens `/pause` with only `state: { reflectionId: p.reflection_id }`.
- `src/pages/PauseSession.tsx` initializes its UI from `location.state` / restored localStorage session.
- When `reflectionMessage` isn’t present in navigation state, `PauseSession` currently shows the “no reflection” overlay instead of using `useHolzen`’s already-available profile/reflection loading logic.

**Impact:** pause notifications may require an extra “Return” step (and/or fail to display companions) until the state is refreshed.

### 2. Session restoration mismatch guard depends on `navState.reflectionMessage`

`PauseSession` discards a saved local session only when both `navState.reflectionMessage` and `navState.reflectionId` exist and differ.

When navigating with only `reflectionId`, the saved session may be reused even if it belongs to a different reflection.

## Recommended next changes (to apply after we confirm)

1. Teach `PauseSession.tsx` to fall back to `useHolzen` values (`message/context/companions/companionPrefs/severity`) when navState/restored session doesn’t supply them.
2. Update the session restoration guard so it discards saved state whenever `navState.reflectionId` differs (even if `reflectionMessage` is missing).

Applied in this branch: `src/pages/PauseSession.tsx` now hydrates message/context/featured companions/prefs from `useHolzen` when `location.state` lacks them, and the saved-session mismatch check keys off `navState.reflectionId` (not `reflectionMessage`).

## Phase 3 (next)

Trace *server-side triggers* (`check-volatility` + cron delivery) and confirm they write the fields expected by `NotificationBell`, `useProfile` hydration, and pause UI restoration.

