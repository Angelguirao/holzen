# Phase 6: Supabase RLS/authz security model

## Goal

Verify the security posture for the tables involved in the pause + companion pipeline:

- `pause_notifications` (cron-side inserts, client-side reads)
- `reflections` (client-side inserts, cron-side inserts, client-side reads)
- `reflection_companions` (client-side reads + read-flag updates, orchestrator writes)
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

### `pause_notifications`

Migration: `supabase/migrations/20260327000001_pause_notifications.sql`

- Enables RLS.
- Policy: **`Users can view their own pause notifications`** for `FOR SELECT` on `pause_notifications` when `auth.uid() = user_id`.
- **No explicit `INSERT`/`UPDATE`/`DELETE` policies** exist for `authenticated` or `service_role`.

Runtime impact:

- `NotificationBell` reads `pause_notifications` with the browser client (authenticated), which should work due to the SELECT policy.
- `check-volatility` inserts into `pause_notifications` (service role).

Risk / assumption:

- Cron inserts rely on the service-role key bypassing RLS. If bypass were ever disabled/misconfigured, the notification pipeline would fail at the write step.

### `reflections`

Migration: `supabase/migrations/20260305210513_table_reflections.sql`

- Enables RLS.
- Policies:
  - **SELECT** for authenticated where `auth.uid() = user_id`
  - **INSERT** for authenticated where `WITH CHECK (auth.uid() = user_id)`
- The base migration does not define explicit `service_role` policies.

Runtime impact:

- Browser client (`useHolzen`) inserts reflections and uses the user JWT, so RLS INSERT applies.
- Cron (`check-volatility`) inserts reflections using service role.

Risk / assumption:

- Cron inserts rely on service-role bypass behavior.
- If the code ever changes to use an authenticated client for cron inserts, it would fail RLS unless new policies are added.

### `reflection_companions`

Migration: `supabase/migrations/20260321000005_normalize_companion_data.sql`

- Enables RLS.
- Policies:
  - **SELECT** for authenticated: allowed when `reflection_id IN (SELECT id FROM reflections WHERE user_id = auth.uid())`
  - **UPDATE** for authenticated: same `USING (...)` condition
  - **Service role full access**: `FOR ALL` when `auth.role() = 'service_role'`
- `v_reflection_with_companions` has invoker security set via `supabase/migrations/20260329190000_v_reflection_with_companions_security_invoker.sql` (good: it doesn’t accidentally bypass RLS through view ownership).

Runtime impact:

- Browser reads reflection companion content and updates `read` flags (client uses browser client).
- Orchestrator writes companion payloads and intervention payloads via `writeCompanionData` using a service-role client.

Notable nuance:

- The authenticated `FOR UPDATE` policy specifies `USING(...)` but does not explicitly define a `WITH CHECK(...)`.
- In this particular app, updates appear to only toggle `read` boolean (no changes to `reflection_id`), so it’s likely safe in practice.

Hardening candidate:

- Add `WITH CHECK` mirroring the same `reflection_id IN (SELECT ...)` condition to make the policy fully explicit and robust against future update shapes.

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
- Cron updates `profiles.last_message/last_context/last_trigger_at` for eligible users.

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

- `reflection_companions` has explicit service-role full access policy.
- `user_companion_serves` has explicit service-role full access policy.
- User isolation for reads/updates is explicit for the above and for `pause_notifications` SELECT.

Assumption-heavy (no explicit service-role insert/update policies observed in the inspected migrations):

- `pause_notifications` INSERT (cron)
- `companion_cache` INSERT (cron)
- `companion_serves` INSERT (orchestrator)
- `generation_attempts` INSERT (orchestrator)
- `reflections` INSERT/UPDATE (cron)
- `profiles` UPDATE (cron)
- `analytics_events` INSERT (edge/orchestrator)

In all these cases, correctness depends on Supabase service-role key bypassing RLS.

Additional mitigation: `companion-orchestrate` now explicitly checks `reflections.user_id === userId` for any provided `reflectionId` (returns `403` otherwise), so cross-user writes are blocked even though the service-role client bypasses RLS.

## Recommended validation & hardening options

1. Validation (in Supabase SQL editor / dashboard):
   - Run a service-role authenticated INSERT against each “assumption-heavy” table and confirm it succeeds.
   - Optionally, run the same INSERT with an authenticated user to confirm it fails where expected.

2. Hardening (if you want defense-in-depth):
   - Add explicit `service_role` `FOR INSERT` and `FOR UPDATE` policies for the tables the edge functions write to:
     - `pause_notifications`, `reflections`, `profiles`, `analytics_events`, `companion_cache`, `companion_serves`, `generation_attempts`
   - This makes the security model self-documenting and reduces reliance on service-role bypass semantics.

## Open question

Do you prefer we keep the “service-role bypass is the invariant” model (simpler migrations), or should we harden by adding explicit `service_role` policies for every edge-write table (more migrations, clearer intent)?

