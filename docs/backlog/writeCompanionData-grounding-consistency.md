# Grounding: dual-write consistency (`reflection_companions` vs `reflections`)

**Status:** done (2026-04).

## What shipped

1. **Rule documented** in `supabase/functions/_shared/companion-data.ts` (module header): canonical grounding JSON is `reflection_companions` / `ground_nudge`; `reflections.grounding_*` is denormalized for Home; manual holzen-reflect path must keep both aligned.
2. **`src/hooks/use-holzen.ts`:** After a successful `reflections` insert, when holzen-reflect returned grounding title/body, the client **upserts** `reflection_companions` with `companion_type` `ground_nudge` and content `{ title, body, citation, url }` (orchestrator shape), in parallel with library + profile updates. Failures are logged under `[reflection_companions]` / `holzenLog`.
3. **Migration** `20260403120000_reflection_companions_authenticated_insert.sql`: **INSERT** RLS for `authenticated` on `reflection_companions` (own reflections only) so PostgREST **upsert** can insert new rows; previously only UPDATE existed.

## Optional (not done)

- DB trigger/view to derive `reflections.grounding_*` from the join table, or dropping denormalized columns once Home reads the join.
