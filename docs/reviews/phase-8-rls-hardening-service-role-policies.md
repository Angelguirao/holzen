# Phase 8: RLS hardening (explicit service-role write policies)

> **Pause V2 (2026-04):** `public.reflections`, `public.reflection_companions`, and `public.pause_notifications` were **dropped** in `supabase/migrations/20260423202000_pause_v2_destructive_cutover.sql`. Companion + pause writes now target **`pause_instances`**, **`pause_ai_artifacts`**, **`companion_serves`**, **`notifications`**, etc. Treat the **target tables** section below as **historical audit context** for the migrations that existed before cutover — not the live schema checklist.

## Why this exists

Even though Supabase’s service-role key bypasses RLS, that bypass is an important implicit invariant. The earlier audits found that some edge/cron write paths rely on this bypass without explicit `service_role` `INSERT`/`UPDATE` policies.

This phase proposes defense-in-depth: add explicit `service_role` policies for the tables that edge functions/cron workers write to.

## Target tables (based on pipeline)

The following tables **were** part of the pause + companion pipeline before Pause V2 (this list is frozen for historical comparison with migration `20260402093000_service_role_write_policies_pause_companions.sql`):

- `public.pause_notifications` (**dropped** — replaced by unified `notifications`)
- `public.reflections` (**dropped** — replaced by `pause_instances` + `pause_ai_artifacts`)
- `public.profiles` (cron still updates `last_*` and cooldown fields)
- `public.analytics_events` (edge functions insert allowlisted telemetry)
- `public.companion_cache` (cron inserts/updates cache warm pool)
- `public.companion_serves` (orchestrator inserts serve rows)
- `public.generation_attempts` (edge functions insert attempt telemetry)

Notes on tables already handled explicitly (from earlier migration inspection):

- `public.reflection_companions` had a `service_role` “FOR ALL” style policy (**table dropped** in Pause V2).
- `public.user_companion_serves` already has explicit `service_role` “FOR ALL”.

## Proposed policy shape

Use the same intent everywhere:

1. Keep existing authenticated policies unchanged.
2. Add explicit `service_role` policies for `INSERT` and (where needed) `UPDATE/DELETE`.
3. Prefer `WITH CHECK (auth.role() = 'service_role')` for write commands.

### Example templates (pseudo-SQL)

Apply this pattern per table, adjusting command types:

```sql
-- INSERT policy
CREATE POLICY "Service role can insert <table>"
ON public.<table>
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'service_role');

-- UPDATE policy (only if you update rows)
CREATE POLICY "Service role can update <table>"
ON public.<table>
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
```

However, the exact `TO <role>` should match your conventions/migrations. In existing codebase policies, you may also see style like:

```sql
CREATE POLICY "Service role full access"
ON public.<table>
FOR ALL
USING (auth.role() = 'service_role');
```

If you want to keep consistent style with existing “service_role full access” policies, we should mirror that format exactly.

## Concrete per-table suggestions *(historical — pre–Pause V2 targets)*

The subsections through **`generation_attempts`** describe the **2026-04-02** migration’s intent. **`pause_notifications`** and **`reflections`** (and companion join rows on **`reflection_companions`**) were **dropped** in Pause V2 — do **not** add new RLS policies on those names; audit **`notifications`**, **`pause_instances`**, **`pause_ai_artifacts`**, etc. instead.

### `pause_notifications` *(removed)*
- **Was:** `FOR INSERT` for `service_role` on cron-created rows.
- **Now:** unified **`notifications`** table; see migrations after `20260423202000_pause_v2_destructive_cutover.sql`.

### `reflections` *(removed)*
- **Was:** `FOR INSERT` / `FOR UPDATE` for `service_role` + authenticated client inserts.
- **Now:** **`pause_instances`** + **`pause_ai_artifacts`**; cron uses `pause_create_or_reuse_as` + artifact upserts.

### `profiles`
- Implement: `FOR UPDATE` for `service_role`
- Current flows update `last_message`, `last_context`, and `last_trigger_at`.

### `analytics_events`
- Implement: `FOR INSERT` for `service_role`
- Current flows insert allowlisted events from edge functions.

### `companion_cache`
- Implement: `FOR INSERT` and (if you update TTL/quality during lifecycle) `FOR UPDATE` for `service_role`
- Current flows:
  - `pregenerate-companions` inserts into `companion_cache`
  - it may also update quality scores during feedback processing

### `companion_serves`
- Implement: `FOR INSERT` for `service_role`
- Current flows: orchestrator inserts serve logs; users only read.

### `generation_attempts`
- Implement: `FOR INSERT` for `service_role`
- Current flows: edge functions insert attempt telemetry; users don’t read directly (admin-only via RLS/views).

## Why this is worth doing (risk reduction)

- Removes reliance on a “service-role bypass is always enabled and works as expected” invariant.
- Makes your security model explicit and easier to review.
- Prevents future regressions if Supabase settings/policy defaults change.

## Next step (your approval needed)

If you approve, I’ll generate one or more new SQL migration files under `supabase/migrations/` implementing the policies for the tables above.

Before writing migrations, I’ll also:
- check for any existing `service_role` policies already present for each target table (avoid duplicates)
- match the exact policy syntax/style currently used in `user_companion_serves` (and other live companion tables)

Applied in this branch:

- Added `supabase/migrations/20260402093000_service_role_write_policies_pause_companions.sql` which creates `service_role`-scoped `FOR ALL` policies for:
  - `pause_notifications`, `reflections`, `profiles`, `analytics_events`
  - `companion_cache`, `companion_serves`, `generation_attempts`

