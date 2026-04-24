# Reflection insert after holzen-reflect

**Status:** done (2026-04).

## What shipped

- **`src/hooks/use-holzen.ts`:** After a successful `holzen-reflect` (or silent-mode copy), if persisting the pause (`pause_ai_artifacts` / related writes) **fails**, the hook **clears** the optimistic `message` / `context` / `companions` / `newPauseArrival` state, sets a user-facing error (see `src/lib/reflection-persist-error.ts` — **pause** copy with legacy substring match), and does **not** advance `lastPauseInstanceId` for that attempt.
- **`src/pages/Home.tsx`:** Surfaces that error in the reflection widget and in **zen mode** even when **`btcData`** is already loaded (`isReflectionPersistError`), with **Try again** → `manualTrigger`.

Orphaned edge-function cost if insert fails is unchanged; this ticket was UX/consistency and navigation safety.

## Related

- Larger alternative (not done): single edge function for “generate + insert” — still valid if you want server-side coupling.
