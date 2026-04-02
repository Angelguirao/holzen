# Pause Session Hydration (Pending Enhancements)

## Enhancement 3: Reduce reliance on `location.state` for pause entry

### Current problem
`/pause` can be entered with `location.state` (navigation payload). However, `location.state` is ephemeral:
- deep links may not include it
- refresh/back/forward flows can drop it
- multi-tab scenarios can make it stale

So `PauseSession` may have missing/partial `reflectionMessage`, `context`, `reflectionId`, `companions`, etc.

### Implications if we leave it as-is
- More "fallback behavior" paths get exercised (using `useHolzen` or `noReflection` UI).
- The app can present incorrect or empty pause content if state sources disagree.
- Reasoning complexity increases: correctness depends on a best-effort blend of `location.state`, `localStorage` session restore, and live hook state.

### Proposed improvement
Treat `location.state` as a hint, but reduce dependence on it by re-hydrating critical pause fields from persisted sources where feasible:
- favor persisted DB/session-derived values (e.g. `useHolzen` / profile-backed values) over nav payload
- when entering `/pause`, proactively ensure the fields required by the session contract are present or intentionally fallback to a deterministic “loading” or “can’t restore” screen

### Related code pointers
- `src/pages/PauseSession.tsx`: constructs the pause view model from `navState` + `restored` + `useHolzen()`
- Session persistence: `PauseSession` uses `localStorage` key `holzen_pause_session`

### Acceptance criteria / how to verify
1. If `location.state` is missing, `/pause` still restores the correct session content whenever the persisted sources have it.
2. The “no reflection” UI appears only when there is genuinely no restorable reflection content (not just because nav payload was missing).
3. Avoid mismatched states (e.g. `reflectionId` present but `reflectionMessage` empty) by enforcing a consistent restoration priority.

