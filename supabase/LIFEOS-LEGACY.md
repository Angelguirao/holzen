# LifeOS tables in this repo — LEGACY

**Do not add new `lifeos_*` migrations here.**

LifeOS ledger ownership moved to **`personal-agent/deploy/supabase/migrations/`** and a dedicated Supabase project named **`lifeos`**.

Files matching `migrations/*lifeos*` remain only because they were already applied to holzen-staging / holzen-prod migration history. Rewriting or deleting them would break Supabase migration bookkeeping.

**Holzen DB model (target):** one product project (`holzen-prod`) + optional Supabase Branches for product staging (Pro+). No second Holzen staging project on Free. LifeOS is a separate project.

Cutover runbook: `personal-agent/deploy/LIFEOS-SUPABASE.md`.

Holzen product schema (pauses, waitlist, credits, …) stays in this directory as usual.
