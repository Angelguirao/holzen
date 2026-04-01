# Codebase size, complexity, and review practices

This document summarizes **how large Holzen is** (as of **2026-04-01**), a **qualitative complexity read**, **how long a full review might take**, and **analyses teams often run** on codebases like this one. Numbers were measured on a Windows checkout excluding `node_modules`, `dist`, `coverage`, and `.git`.

For day-to-day orientation, prefer [navigating-the-codebase.md](./navigating-the-codebase.md) and [AGENTS.md](../AGENTS.md).

---

## 1. Size snapshot

| Metric | Approximate value |
|--------|-------------------|
| **Total repository files** (excluding dirs above) | ~515 |
| **`.tsx` files** | 220 (~34,600 lines) |
| **`.ts` files** (repo-wide, incl. `src/` + `supabase/functions`) | 108 (~19,300 lines) |
| **`supabase/functions` TypeScript** | 54 files (~11,550 lines) |
| **SQL migrations** | 140 files (~3,100 lines) |
| **CSS** | 2 files (~150 lines) |
| **TypeScript + TSX + SQL + CSS (code-ish)** | **~57,000 lines** |

### Notes on what those lines represent

- **`src/integrations/supabase/types.ts`** is a large, **generated** Supabase typings file (~1,900 lines). It inflates “TypeScript line count” but is not product logic; treat it separately in review planning.
- **`src/components/ui/`** follows shadcn-style primitives; many files are small, reusable widgets. A “full UI review” can either include them (heavy) or treat them as **vendor-adjacent** and focus on app-specific components.
- **JSON** in the repo (e.g. lockfiles, config) adds many lines that are not hand-authored application code.

---

## 2. Architectural surface area (why it feels “medium-plus”)

Holzen is a **single-page React + TypeScript** app with:

- **Routing, auth, and layout** centralized around `src/App.tsx` and `use-auth.tsx`.
- **Many feature pages and hooks** (pause flow, library, profile, settings, admin, practice modes, etc.).
- **Supabase**: **~140 migrations** (schema, RLS, views, functions) plus **27 edge function entrypoints** (`supabase/functions/*/index.ts`) and a sizable **`_shared`** layer (generators, quality gates, caching, auth helpers).

So complexity is not just “lines of React” — it is **frontend + Postgres/RLS + Deno edge functions + third-party integrations** (Stripe, email hooks, push, external AI/search APIs as used in functions). That multiplies the number of concerns a “full stack” review must cover.

---

## 3. How complex is it?

**Subjective scale (for a solo maintainer or small team):**

| Dimension | Level | Comment |
|-----------|--------|---------|
| **UI breadth** | Medium–high | Many screens, admin tooling, reusable UI kit. |
| **Client state** | Medium | TanStack Query, multiple domain hooks, offline/PWA touches. |
| **Backend (Supabase)** | Medium–high | Many migrations and policies; edge functions orchestrate non-trivial flows. |
| **Operational coupling** | Medium | Cron jobs, secrets, deploy ordering (see [cron-setup.md](./cron-setup.md)). |

There is no single “god module” that defines the whole system, but **several large files** (large pages, hooks, and shared generators) reward **targeted** review and ownership boundaries rather than expecting one pass over every line.

---

## 4. How long to “review everything”?

There is no universal answer; it depends on **depth** (skim vs security audit vs line-by-line) and **reviewer background** (React-only vs Postgres/RLS vs Deno).

**Rough orders of magnitude** for this repo’s **hand-maintained** code paths (excluding treating every UI primitive as bespoke):

| Goal | Ballpark effort |
|------|------------------|
| **Onboarding skim** — README, `AGENTS.md`, navigating doc, `App.tsx`, main hooks, one representative edge function | **~0.5–1 day** |
| **Feature-level review** — all major user flows + corresponding hooks and tables | **~3–10 days** (one reviewer, calendar time) |
| **Deep security / privacy pass** — auth, RLS, edge function authz, secret handling, Stripe paths | **~1–3 weeks** (including fixes and retest), often split across people |
| **Exhaustive line-by-line** of every `.ts`/`.tsx`/`.sql` including UI kit and migrations | **Many weeks**; rarely cost-effective as a single initiative |

**Heuristic:** thorough review throughput often falls in the **~200–400+ LOC/hour** range for mixed UI + logic when you include context switching and verification — but **RLS and distributed flows** are slower per line than pure React. Use this only for **order-of-magnitude** planning.

**Practical recommendation:** prioritize **high-churn paths**, **auth and billing**, **admin surfaces**, and **anything that runs with elevated privilege** (service role, bypass RLS, cron) over a literal full read of the entire tree.

---

## 5. Best-practice analyses that fit this codebase

Below are analyses teams commonly apply; they complement (not replace) human review.

### Static quality and consistency

- **TypeScript** — `npm run build` / `tsc` (via Vite) catches many contract errors.
- **ESLint** — `npm run lint`. This repo notes **many pre-existing** ESLint findings (~300 in [AGENTS.md](../AGENTS.md)); use **trending** (no new violations in touched files) or **incremental cleanup** rather than blocking the whole tree on zero warnings unless you commit to a dedicated effort.

### Tests

- **Vitest** — `npm run test`. Current **`src/test/`** suite is **small** relative to app size; expanding **critical-path** tests (auth-gated routes, subscription gates, companion/signal invariants) usually has higher ROI than chasing coverage on presentational components.

### Dependencies and supply chain

- **`npm audit`** / Dependabot or Renovate — track **severity**, **exploitability**, and **whether the vulnerable code path ships** (dev-only vs browser bundle).

### Security-focused automation

- **Secret scanning** (git history + CI) — ensure no service keys in repo; Supabase secrets belong in the dashboard ([AGENTS.md](../AGENTS.md)).
- **SAST** (e.g. CodeQL, Semgrep) — good for **common vulnerability classes**; tune rules to reduce noise on React/Supabase patterns.
- **RLS policy review** — partly manual: for each sensitive table, confirm **select/insert/update** rules match product intent; migrations are the source of truth.

### Architecture and boundaries

- **Dependency/coupling rules** (e.g. `dependency-cruiser`, ESLint `import/no-restricted-paths`) — enforce layering such as “pages don’t import edge-only helpers” or “admin code isolated.”
- **Bundle analysis** (`vite build` + visualizer) — PWA/mobile performance; finds accidental heavy imports.

### Runtime / product quality

- **E2E tests** (Playwright, Cypress) — high value for **auth + checkout + pause** flows; higher setup cost than unit tests.
- **Accessibility** — axe-core in CI or manual passes on primary flows.

### Backend-specific (Supabase)

- **Migration ordering and idempotency** — review for **destructive** changes and **policy** regressions.
- **Edge function inventory** — each function should appear in **`supabase/config.toml`** ([AGENTS.md](../AGENTS.md)); missing entries cause **401** or deploy mismatches.

---

## 6. Related docs

- [navigating-the-codebase.md](./navigating-the-codebase.md) — how the app boots, routes, and data flow.
- [AGENTS.md](../AGENTS.md) — commands, conventions, Supabase notes.
- [cron-setup.md](./cron-setup.md) — scheduled jobs and operational context.

---

*Figures in §1 were produced with a local line count (PowerShell `Get-Content` per file). Re-run the same methodology after large refactors if you need an updated snapshot.*
