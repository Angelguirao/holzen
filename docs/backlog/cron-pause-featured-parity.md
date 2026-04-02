# Cron pause: featured fields vs manual path on first paint (Pending)

## Context (from Phase 3)

Automatic pauses created by `check-volatility` may insert `reflections` with **`grounding_title` / `grounding_body` null** initially; those columns are expected to be filled later by `companion-orchestrate`. Manual pauses from `use-holzen` + `holzen-reflect` may populate more featured fields in the same insert.

## Current problem

**First paint** of `/pause` can **differ** between:

- **Manual path**: user often arrives from Home with full `location.state` + reflect output already merged into state.
- **Cron / notification path**: user may open with only `reflectionId`; reflection row may still be **mid-orchestration** for featured snippets.

## Implications if we leave it as-is

- UI that assumes "featured grounding always exists" on `reflections` can look **empty or inconsistent** for cron-driven pauses until orchestration completes.
- Users may perceive automatic pauses as "broken" compared to manual pauses if copy does not explain loading.

## Proposed improvement

- **Document** in UI components (`PauseReflect`, `CollapsibleReflectionHeader`, etc.) which fields are **best-effort on first paint** for automatic pauses.
- **Optional**: after `reflectionId` is known, **fetch** the latest reflection row (or companion view) when featured fields are null and show skeletons until populated.
- Overlaps with `pause-session-hydration.md` for navigation; this file focuses on **cron vs manual content parity**, not only `location.state`.

## Related code pointers

- `supabase/functions/check-volatility/index.ts` — what is written to `reflections` before orchestrate
- `src/pages/PauseSession.tsx` — merged view model
- `docs/reviews/phase-3-server-cron-triggers.md`

## Acceptance criteria / how to verify

1. Opening `/pause` from a **notification** right after an automatic pause never shows a **silent** empty featured area without a loading or "still preparing" affordance.
2. After orchestration completes, featured/expanded content **converges** with what manual pauses would show for equivalent settings.
