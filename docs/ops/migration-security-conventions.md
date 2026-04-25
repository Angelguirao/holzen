# Migration conventions: `SECURITY DEFINER` and `search_path`

Every Postgres function we ship in `supabase/migrations/` must follow the
two rules below. They protect against `search_path` hijacking attacks,
keep RLS evaluation predictable, and match the pattern already used by
every helper in this repo (`is_admin`, `has_role`, `claim_trigger_slot`,
`update_profile_safe`, `notifications_upsert`, etc.).

## TL;DR

```sql
CREATE OR REPLACE FUNCTION public.<name>(...)
RETURNS <type>
LANGUAGE plpgsql           -- or sql
[STABLE | VOLATILE]
SECURITY DEFINER           -- only when the function MUST bypass RLS
SET search_path = public   -- ALWAYS, on every function we author
AS $$ ... $$;
```

## Rule 1 — Always pin `search_path`

**Every** function (definer or invoker) must include
`SET search_path = public` (add `, extensions` only when calling
`net.http_*`, `pgcrypto`, etc.).

Why: without a pinned path, a malicious schema earlier in the caller's
`search_path` can shadow `public.<table>` or `public.<func>` and run
arbitrary code under the definer's privileges. This is the supabase
linter's `function_search_path_mutable` finding — treat it as a release
blocker, not a warning.

## Rule 2 — `SECURITY DEFINER` only when you need to bypass RLS

Default to `SECURITY INVOKER` (the implicit default). Use
`SECURITY DEFINER` only when the function **must** read or write rows
the caller cannot see directly under RLS. Typical legitimate uses in
this repo:

- **RLS helper predicates** called from policies — `is_admin()`,
  `has_role()`, `owns_collection()`. These must be definer + stable so
  the policy doesn't recurse into itself.
- **Atomic claim/quota writes** that need to ignore the caller's RLS —
  `claim_trigger_slot`, `consume_monthly_feature_quota`,
  `consume_feature_allowance_or_credits`, `add_flex_credits`.
- **Cross-user system writes from triggers/cron** —
  `notifications_upsert`, `handle_new_user`, `emit_job_heartbeat`.
- **Whitelisted profile updates** that must strip protected columns —
  `update_profile_safe` (paired with `protect_subscription_fields`).

If a function only reads or writes the caller's own rows under RLS, it
should stay `SECURITY INVOKER`.

## When you DO use `SECURITY DEFINER`

1. **Pin `search_path`** (Rule 1 — non-negotiable).
2. **Validate the caller inside the function.** Re-check
   `auth.uid()`, call `is_admin()`, or filter by `_user_id` parameters.
   Never trust that the caller "couldn't have called this".
3. **Strip privileged columns from inputs** when the function accepts a
   `jsonb` patch (see `update_profile_safe` removing
   `subscription_status`, `lifetime_access`, `is_admin`, etc.).
4. **Mark `STABLE` when read-only**, `VOLATILE` (default) otherwise —
   this matters for use inside RLS policies.
5. **Grant narrowly.** Default `EXECUTE` for definer functions should
   be `authenticated` (or `service_role` for cron-only helpers); revoke
   from `public` if the migration scaffolding granted it.

## Templates

### RLS predicate (definer + stable)

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
```

### Per-user invoker function (no definer)

```sql
-- Example shape (Pause V2): read the caller’s pause rows — not legacy `reflections`.
CREATE OR REPLACE FUNCTION public.my_recent_pauses()
RETURNS SETOF public.pause_instances
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT *
  FROM public.pause_instances
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 20;
$$;
```

### Definer write that must validate the caller

```sql
CREATE OR REPLACE FUNCTION public.admin_archive_source(_source_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.signal_sources SET demoted_for_live = true WHERE id = _source_id;
END;
$$;
```

### When `extensions` is needed

Only add `extensions` to the path if the function calls something from
that schema (e.g. `net.http_get`, `gen_random_uuid` is fine without it
because it's resolved via `pg_catalog`):

```sql
SET search_path = public, extensions
```

See `emit_job_heartbeat` for a working example.

## Pre-push checklist (functions touched)

- [ ] `grep -nE "CREATE (OR REPLACE )?FUNCTION" supabase/migrations/<new>.sql`
- [ ] Every match has `SET search_path = ...`.
- [ ] `SECURITY DEFINER` is present **only** where bypassing RLS is
      required, and the function validates the caller.
- [ ] Read-only definer helpers used in RLS policies are marked
      `STABLE`.
- [ ] No definer function blindly applies a caller-supplied `jsonb`
      patch to a privileged table — strip protected keys first.
- [ ] Run `npm run lint` and the Supabase linter; resolve any
      `function_search_path_mutable` or `security_definer_view` finding
      before pushing.

## See also

- `docs/ops/migration-view-safety.md` — companion rules for views.
- `<user-roles>` block in the project agent prompt — canonical
  `has_role` pattern.
- Existing definer functions in this repo for reference shape:
  `is_admin`, `claim_trigger_slot`, `update_profile_safe`,
  `notifications_upsert`, `consume_monthly_feature_quota`.