# Grounding: dual-write consistency (`reflection_companions` vs `reflections`) (Pending)

## Context (from Phase 5)

`writeCompanionData` in `supabase/functions/_shared/companion-data.ts`:

1. **Upserts** `reflection_companions` for every companion type (canonical store for companion JSON).
2. For **grounding** only, also **updates** `reflections.grounding_title` and `reflections.grounding_body` for Home pinned reflection display.

`markCompanionRead` updates `reflection_companions.read` and, for grounding, **`reflections.grounding_read`**.

Elsewhere, **manual** pause may insert initial `haiku` / grounding fields on `reflections` from `holzen-reflect` before orchestration; **cron** may leave `grounding_*` null until `companion-orchestrate` + `writeCompanionData` runs.

## Current problem

Two surfaces for **grounding** text and read state (`reflection_companions` vs denormalized `reflections` columns) can **drift** if:

- code updates one store without the other,
- a different code path writes grounding only to `reflections` (legacy insert) without updating `reflection_companions`, or vice versa.

## Implications if we leave it as-is

- Home shows **pinned** text from `reflections` while pause UI reads from **companions** or merged state — **mismatch** if not kept in sync.
- Harder debugging: "which row is source of truth?" for grounding.

## Proposed improvement

1. **Inventory** all code paths that set `reflections.grounding_*` or grounding rows in `reflection_companions` (orchestrate, manual insert, migrations).
2. **Prefer** routing grounding writes through `writeCompanionData` where possible.
3. **Optional (larger)**: DB **trigger** or **view** to keep `reflections` in sync from `reflection_companions`, or drop denormalized columns once Home reads from join (breaking change).

## Related code pointers

- `supabase/functions/_shared/companion-data.ts` — `writeCompanionData`, `markCompanionRead`, `readCompanionData`
- `src/hooks/use-holzen.ts` — initial reflection insert with grounding fields from `holzen-reflect`
- `docs/reviews/phase-2-manual-pause-pipeline.md`, `docs/reviews/phase-3-server-cron-triggers.md`

## Acceptance criteria / how to verify

1. Documented rule: **grounding content** for display is updated only from paths that keep `reflection_companions` and `reflections` aligned (or one is explicitly derived).
2. Spot checks or tests: after orchestration write, Home and pause **see the same** grounding text for the same `reflectionId`.
