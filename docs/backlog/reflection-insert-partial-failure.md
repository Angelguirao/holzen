# Reflection insert after holzen-reflect

**Status:** done (2026-04).

## What shipped

- **`src/hooks/use-holzen.ts`:** After a successful `holzen-reflect` (or silent-mode copy), if the `reflections` **insert** fails, the hook **clears** the optimistic `message` / `context` / `companions` / `newReflection` state, sets a user-facing error containing **`Could not save your reflection`**, and does **not** set `lastReflectionId` for that attempt.
- **`src/pages/Home.tsx`:** Surfaces that error in the reflection widget and in **zen mode** even when **`btcData`** is already loaded (`isReflectionPersistError`), with **Try again** → `manualTrigger`.

Orphaned edge-function cost if insert fails is unchanged; this ticket was UX/consistency and navigation safety.

## Related

- Larger alternative (not done): single edge function for “generate + insert” — still valid if you want server-side coupling.
