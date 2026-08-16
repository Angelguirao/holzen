# LifeOS tables in this repo — LEGACY

**Do not add new `lifeos_*` migrations here.**

LifeOS ledger ownership moved to **`personal-agent/deploy/supabase/migrations/`** and a dedicated Supabase project named **`lifeos`**.

Files matching `migrations/*lifeos*` remain only because they were already applied to holzen-staging / holzen-prod migration history. Rewriting or deleting them would break Supabase migration bookkeeping.

**holzen-prod history shims (2026-08-16):** dashboard/MCP applied three versions that were never git filenames:

- `20260715201843` / `20260715204645` / `20260716205139` (`drop_legacy_lifeos_tables_from_holzen_prod`)

Matching stub files live in this folder so `supabase db push` can proceed. Later `*lifeos*` files **no-op when `lifeos_runs` / `lifeos_issues` are missing** (prod dropped those tables). Do not add new LifeOS SQL here.

**Holzen DB model (target):** one product project (`holzen-prod`) + optional Supabase Branches for product staging (Pro+). No second Holzen staging project on Free. LifeOS is a separate project.

Cutover runbook: `personal-agent/deploy/LIFEOS-SUPABASE.md`.

Holzen product schema (pauses, waitlist, credits, …) stays in this directory as usual.
