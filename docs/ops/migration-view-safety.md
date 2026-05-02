# Migration safety: views and `CREATE OR REPLACE VIEW`

## TL;DR

**Never use `CREATE OR REPLACE VIEW` to change column order, rename
columns, or insert columns in the middle of the SELECT list.** Postgres
rejects this with:

```
ERROR: 42P16: cannot change name of view column "X" to "Y"
HINT: Use ALTER VIEW ... RENAME COLUMN ... to change name of view column instead.
```

When this happens inside a Lovable-synced GitHub push, the **entire
migration batch fails silently** in the dashboard and subsequent
migrations are never applied. The frontend keeps deploying as if
nothing happened, and you get a desync between repo schema and live DB.

## The rule

`CREATE OR REPLACE VIEW` only works when:

- You add new columns **at the end** of the SELECT list, AND
- You don't rename or reorder any existing column, AND
- You don't change a column's data type incompatibly.

For anything else — reordering, renaming, inserting columns mid-list,
changing aggregations that change the inferred type — use:

```sql
DROP VIEW IF EXISTS public.<view_name>;

CREATE VIEW public.<view_name> AS
SELECT ...;
```

If the view is referenced by other views or by `GRANT`s, drop with
`CASCADE` and re-grant explicitly:

```sql
DROP VIEW IF EXISTS public.<view_name> CASCADE;

CREATE VIEW public.<view_name> AS
SELECT ...;

GRANT SELECT ON public.<view_name> TO authenticated;
```

## Known landmines in this repo

1. **`20260329000001_fix_admin_generation_and_cache_hit_views.sql`** — was
   historically an unsafe `CREATE OR REPLACE VIEW` on
   `v_companion_cache_hit_rate` (column reorder vs
   `20260320205315_view_v_companion_cache_hit_rate.sql`). **Patched in-repo**
   to `DROP VIEW IF EXISTS` + `CREATE VIEW … WITH (security_barrier = true)`
   + re-`GRANT` for `service_role`.

2. **`20260418120000_companion_serves_allow_library_source.sql`** — inserts
   `library_hits` mid-list. **This one already failed on sync** and was
   repaired in production via a corrective migration on 2026-04-18 that
   uses `DROP VIEW IF EXISTS`.

If you add a new migration that changes a view’s column list in a non-append-only
way, use `DROP VIEW IF EXISTS … CREATE VIEW …` (and re-apply `ALTER VIEW` /
`GRANT`s) from the start. Lovable’s migration runner cannot edit
`supabase/migrations/` in place for you — fix belongs in Git.

## Pre-push checklist

Before pushing migrations that touch a view:

- [ ] `grep -n "CREATE OR REPLACE VIEW" supabase/migrations/<new>.sql`
- [ ] For every match, confirm the column list is **identical or
      append-only** vs. the previous definition of the same view.
- [ ] If not, switch to `DROP VIEW IF EXISTS … CREATE VIEW …`.
- [ ] If the view is referenced elsewhere, use `CASCADE` and re-create
      dependents in the same migration.

## Safe append-only example (works with `CREATE OR REPLACE`)

```sql
-- v1
CREATE OR REPLACE VIEW v_x AS SELECT a, b FROM t;

-- v2 — OK, only appends
CREATE OR REPLACE VIEW v_x AS SELECT a, b, c FROM t;
```

## Unsafe example (fails)

```sql
-- v1
CREATE OR REPLACE VIEW v_x AS SELECT a, b, c FROM t;

-- v2 — FAILS: 'b' becomes 'new_col' positionally
CREATE OR REPLACE VIEW v_x AS SELECT a, new_col, b, c FROM t;
```

Fix:

```sql
DROP VIEW IF EXISTS v_x;
CREATE VIEW v_x AS SELECT a, new_col, b, c FROM t;
```
