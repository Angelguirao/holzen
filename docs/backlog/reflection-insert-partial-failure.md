# Reflection insert after holzen-reflect (Pending)

## Current problem

On the manual path, `use-holzen` calls `holzen-reflect`, then **inserts** into `reflections` and updates `profiles` / `library_items`. If the edge function **succeeds** but a subsequent **client-side insert** fails (network, RLS, constraint), the UI can be in an inconsistent state:

- User may have seen generated content in memory while **no durable `reflections` row** exists.
- `lastReflectionId` may not be set; navigation to `/pause` may lack a stable id.

## Implications if we leave it as-is

- Support cases: "I had a reflection on screen but it's not in history."
- Possible **orphaned cost**: `holzen-reflect` ran without a persisted reflection row (depending on error timing).

## Proposed improvement

- **Tighter coupling**: treat "reflect + insert" as one user-visible operation; on insert failure, show explicit error and avoid navigating with a fake id.
- **Alternative (larger change)**: move "create reflection row + call model" to a **single edge function** so persistence and generation are one server-side unit (transactional or compensating).

## Related code pointers

- `src/hooks/use-holzen.ts` - `generateMessage` success path vs insert errors

## Acceptance criteria / how to verify

1. If `reflections` insert fails after a successful `holzen-reflect`, the user sees a clear failure state and cannot navigate to `/pause` with a non-existent `reflectionId`.
2. No silent success path that updates `message` in state without a matching row when the happy path promised one.
