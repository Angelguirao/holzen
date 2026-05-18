# Phase 6: Supabase RLS/authz security model

> **Pre-strip / security reference (2026-05).** Tier B drops: [active-surface.md](../ops/active-surface.md).

## Goal

Verify the security posture for the tables involved in the pause + companion pipeline:

- `notifications` (cron-side inserts, client-side reads)
- `pause_instances` (client-side inserts via RPCs, cron-side inserts, client-side reads)
- `pause_ai_artifacts` (client-side reads, orchestrator writes)
- `analytics_events` (client inserts for its own events; edge/orchestrator writes for allowlisted telemetry)
- Companion/caching tables:
  - `companion_cache` (cron/worker inserts; client reads)
  - `companion_serves` (orchestrator writes; admin reads)
  - `user_companion_serves` (worker writes; client reads)
- Other context tables touched in the flow:
  - `profiles` (client updates; cron updates `last_*` and cooldown fields)
  - `push_subscriptions` (client manages; cron reads for push)
  - `generation_attempts` (worker writes; admin reads)

## High-level pattern observed

The schema uses:

1. **Explicit RLS policies** for authenticated users to read/update only their own rows (often via `auth.uid()`).
2. **Service-role writes** performed by edge functions via the service key (`createServiceClient` / service-role `Authorization`).
3. Some tables have **no explicit `service_role` INSERT/UPDATE policies**, which implies an assumption that the `service_role` key bypasses RLS (Supabase service role behavior).

This is normal in Supabase setups, but it is worth making explicit because it’s a “correctness + security invariant”.

## Table-by-table findings

### `notifications`

Migration: `supabase/migrations/20260422181000_notifications_feed_unification.sql`

- Enables RLS.
- Policy: `**Users can view their own notifications`** for `FOR SELECT` on `notifications` when `auth.uid() = user_id`.
- **No explicit `INSERT`/`UPDATE`/`DELETE` policies** exist for `authenticated` or `service_role`.

Runtime impact:

- `NotificationBell` reads `notifications` with the browser client (authenticated), which should work due to the SELECT policy.
- `check-volatility` inserts into `notifications` (service role).

Risk / assumption:

- Cron inserts rely on the service-role key bypassing RLS. If bypass were ever disabled/misconfigured, the notification pipeline would fail at the write step.

### `pause_instances`

Migration: `supabase/migrations/20260423200700_pause_types_and_instances.sql`

- Enables RLS.
- Policies:
  - **SELECT** for authenticated where `auth.uid() = user_id`
  - **service_role** `FOR ALL` policy for edge writes.
- Client inserts go through RPCs (`pause_create_or_reuse`, `pause_create_or_reuse_as`), so direct authenticated INSERT is intentionally not allowed.

Runtime impact:

- Browser client uses RPCs for manual pause creation.
- Cron (`check-volatility`) inserts pauses using service role.

Risk / assumption:

- Cron inserts rely on service-role bypass (or explicit service role policy above).
The RPCs should be the only authenticated insert path; direct INSERTs are not allowed.

### `pause_ai_artifacts`

Migration: `supabase/migrations/20260423200720_pause_ai_artifacts.sql`

- Enables RLS.
- Policies:
  - **SELECT** for authenticated where `auth.uid() = user_id`
  - **Service role full access**: `FOR ALL` when `auth.role() = 'service_role'`
  - **Owner INSERT/UPDATE** policy added in `20260423201500_pause_ai_artifacts_owner_write.sql`

Runtime impact:

- Browser reads artifacts to hydrate Pause UI.
- Orchestrator writes companion/intervention payloads via service role.
- Manual path can upsert reflection_text/haiku with owner policies.

### `analytics_events`

Migration: `supabase/migrations/20260309104933_table_analytics_events.sql` + admin setup `20260321000002_admin_dashboard_setup.sql`

- Enables RLS.
- Policies:
  - Authenticated: `FOR INSERT` with `WITH CHECK (auth.uid() = user_id)`
  - Authenticated: `FOR SELECT` where `auth.uid() = user_id`
- Admin setup adds:
  - Admin-only read via `public.is_admin()`

Runtime impact:

- Browser writes events for itself (allowed).
- Edge functions insert allowlisted telemetry events like `pause_ai_call`, `reflection_generated`, `intervention_selected`, etc. (uses service-role clients).

Risk / assumption:

- Edge function writes rely on service-role bypass. The database does not provide explicit `service_role` policies for `analytics_events` in the base migrations.

### `companion_cache`

Migration: `supabase/migrations/20260320073402_table_companion_cache.sql`

- Enables RLS.
- Policy: **Authenticated users can read companion cache** (`FOR SELECT USING (true)`).
- No explicit insert/update policies appear in the base creation migration.
- Admin tooling adds explicit admin-only policies for:
  - delete/update on `companion_cache` (`20260329230000_admin_companion_cache_signal_sources_write.sql`)
  - but this does not cover edge-function writes.

Runtime impact:

- Clients read from `companion_cache` for fallback content.
- Cron/edge functions (`pregenerate-companions`) insert into `companion_cache`.

Risk / assumption:

- Cron/edge insert/update relies on service-role bypass (since there’s no `service_role` INSERT/UPDATE policy for `companion_cache`).

### `companion_serves`

Migration: `supabase/migrations/20260320202301_index_idx_companion_cache_selection.sql` (table + RLS policies)

- Table `companion_serves` has RLS enabled.
- Policy: authenticated users can `FOR SELECT` their own serves where `auth.uid() = user_id`.
- Comments indicate service-role inserts are expected, but there is no explicit `service_role FOR ALL` policy here in the snippet we reviewed.

Runtime impact:

- Orchestrator inserts rows into `companion_serves` via service-role client.
- Admin reads use `is_admin()` gating via `20260321000002_admin_dashboard_setup.sql` (and associated grants on views).

Risk / assumption:

- Orchestrator inserts rely on service-role bypass unless an explicit service_role insert policy exists elsewhere.

### `user_companion_serves`

Migration: `supabase/migrations/20260324073826_table_user_companion_serves.sql` + `20260321000001_user_cache_tracking.sql`

- RLS enabled.
- Policies:
  - Authenticated users can `FOR SELECT` where `user_id = auth.uid()`
  - Service role full access on `user_companion_serves` via `FOR ALL USING (auth.role() = 'service_role')`

This is the most explicitly defensive pattern we’ve seen for service-role writes.

### `generation_attempts`

Migrations:

- Table creation + RLS enable: `20260320202301_index_idx_companion_cache_selection.sql`
- Authenticated select restricted: `20260320202314_policy_generation_attempts_no_user_select.sql`
- Admin read policies: `20260321000002_admin_dashboard_setup.sql`

Observed policy shape:

- Authenticated select is denied (or effectively denied via a “false” policy).
- No explicit `service_role` INSERT/UPDATE policy is defined in the inspected snippets.

Runtime impact:

- Edge functions insert generation attempts with a service-role client.
- Admin reads generation attempts via RLS gating (`public.is_admin()`).

Risk / assumption:

- Worker writes rely on service-role bypass.

### `profiles`

Migration: `supabase/migrations/20260305200517_table_profiles.sql`

- RLS enabled.
- Policies:
  - Authenticated SELECT/INSERT/UPDATE for own `user_id`.

Runtime impact:

- Browser updates profiles in app.
- Cron updates `profiles.last_context` and `last_trigger_at` for eligible users.

Risk / assumption:

- Cron updates rely on service-role bypass (no explicit service_role policies in base migration).

### `push_subscriptions`

Migration: `supabase/migrations/20260305232722_table_push_subscriptions.sql`

- Enables RLS.
- Policy: Users can manage their own push subscriptions (`FOR ALL` with `auth.uid() = user_id`).

Runtime impact:

- Browser manages its subscription rows.
- Cron reads push subscriptions for each eligible user (service role).

Risk / assumption:

- Cron reads rely on service-role bypass.

## Summary: what’s solid vs what’s assumed

Solid (explicit policies):

- `pause_ai_artifacts` has explicit service-role full access policy.
- `user_companion_serves` has explicit service-role full access policy.
- User isolation for reads/updates is explicit for the above and for `notifications` SELECT.

Assumption-heavy (no explicit service-role insert/update policies observed in the inspected migrations):

- `notifications` INSERT (cron)
- `companion_cache` INSERT (cron)
- `companion_serves` INSERT (orchestrator)
- `generation_attempts` INSERT (orchestrator)
- `pause_instances` INSERT/UPDATE (cron)
- `profiles` UPDATE (cron)
- `analytics_events` INSERT (edge/orchestrator)

In all these cases, correctness depends on Supabase service-role key bypassing RLS.

Additional mitigation: `companion-orchestrate` explicitly checks `pause_instances.user_id === userId` for any provided `pauseInstanceId` (returns `403` otherwise), so cross-user writes are blocked even though the service-role client bypasses RLS.

## Recommended validation & hardening options

1. Validation (in Supabase SQL editor / dashboard):
  - Run a service-role authenticated INSERT against each “assumption-heavy” table and confirm it succeeds.
  - Optionally, run the same INSERT with an authenticated user to confirm it fails where expected.
2. Hardening (if you want defense-in-depth):
  - Add explicit `service_role` `FOR INSERT` and `FOR UPDATE` policies for the tables the edge functions write to:
    - `notifications`, `pause_instances`, `profiles`, `analytics_events`, `companion_cache`, `companion_serves`, `generation_attempts`
  - This makes the security model self-documenting and reduces reliance on service-role bypass semantics.

## Open question

Do you prefer we keep the “service-role bypass is the invariant” model (simpler migrations), or should we harden by adding explicit `service_role` policies for every edge-write table (more migrations, clearer intent)?