# Reflection insert after holzen-reflect

**Status:** done (2026-04). **Update (Pause V2):** non-silent manual runs **`holzen-reflect`** at **Reflect** (`generateReflectionAtReflectStep`); **`use-holzen`** still owns **silent** stub persistence and **Home** error surfacing when **`pause_create_or_reuse`** or related client writes fail.

## What shipped

- **`src/hooks/use-holzen.ts`:** When opening a pause from Home, if persisting context / instance / **silent** stub (`pause_ai_artifacts`) **fails**, the hook **clears** optimistic `message` / `context` / `companions` / `newPauseArrival` where applicable, sets a user-facing error (see `src/lib/reflection-persist-error.ts` — **pause** copy with legacy substring match), and does **not** advance `lastPauseInstanceId` for that attempt. Reflect-step failures for non-silent pauses are handled in **`use-pause-reflect-generation`** / **`PauseReflect`** (retry), not this path.
- **`src/pages/Home.tsx`:** Surfaces that error in the pause widget and in **zen mode** even when **`btcData`** is already loaded (`isPausePersistError` / `isReflectionPersistError`), with **Try again** → `manualTrigger`.

Orphaned edge-function cost if insert fails is unchanged; this ticket was UX/consistency and navigation safety.

## Related

- Larger alternative (not done): single edge function for “generate + insert” — still valid if you want server-side coupling.
