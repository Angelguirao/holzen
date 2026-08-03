# holzen-staging (deleted)

The owned **holzen-staging** Supabase project (`ksplyxxdvandkwzundql`) was **deleted 2026-07-16** after LifeOS cutover. Do **not** recreate it on the Free plan — that slot is used by LifeOS.

**Current model:** `feature/*` → PR → `main` → [holzen-prod](production-supabase-setup.md). See [branch-model.md](branch-model.md).

**When you need an isolated product DB again:** upgrade `holzen-prod` to **Pro** and use [Supabase Branching](https://supabase.com/docs/guides/platform/branching).

Local schema work: Docker via `npm run dev:local`.
