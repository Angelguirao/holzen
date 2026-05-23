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

- **Routing, auth, and layout** centralized around `src/App.tsx` and `@/features/auth/public` (`AuthProvider` / `useAuth`).
- **Many feature screens and hooks** (pause flow, archive, journey overview, settings, admin, marketing, …). **Legacy full IA** (tools, library, stats/badges UI) lives under `src/legacy/`.
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
| **Operational coupling** | Medium | Cron jobs, secrets, deploy ordering (see [cron-setup.md](../ops/cron-setup.md)). |

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

## 6. Industry metrics and how Holzen compares (caveats)

There is **no single authoritative “average lines of code”** for web apps or startups: definitions differ (with/without tests, generated code, `node_modules`, UI kits), and **raw LOC correlates weakly with effort or risk** across languages and frameworks. Still, a few **published reference points** help situate this repo.

### 6.1 Sonar “size” anchors (tooling, not biology)

SonarSource publishes **performance targets** keyed to **representative project sizes** (first full analysis duration). The table is a **vendor scale for analysis time**, not a claim about “healthy” project size:

| Anchor (LOC) | Sonar label (informal) |
|--------------|-------------------------|
| ≤ 1k | XS |
| ~10k | S |
| ~100k | M |
| ~500k | L |
| ~1M | XL |

Source: [Sonar’s analysis performance targets](https://www.sonarsource.com/blog/sonars-analysis-performance-targets/) (June 2022).

**Holzen (~57k code-ish LOC in §1)** sits **between the ~10k and ~100k anchors** on that ladder — i.e. **larger than a toy demo, smaller than a 100k-LOC monolith** Sonar uses as a “medium” performance scenario. Sonar’s own LOC definition (e.g. excluding comments/blanks per their docs) will not match §1’s raw line count exactly.

### 6.2 “Same app” benchmark (RealWorld)

The [RealWorld](https://github.com/gothinkster/realworld) spec (e.g. a Medium-like SPA + API) is often used to compare frameworks. Implementations are typically on the order of **~2k–4k LOC** for the **front end alone** in minimal expert solutions (exact numbers vary by implementation and counter). Holzen is **much larger** than that benchmark because it is a **full product** (many flows, admin, PWA, i18n, Stripe, rich Supabase surface), not a single reference CRUD app.

### 6.3 Churn vs inventory (GitClear)

[GitClear’s “Lines of Code Breakdown”](https://www.gitclear.com/lines_of_code_stats) analyzes **changed lines in commits** and argues that only a **small fraction** of diff volume is “purposeful” after filtering duplicates, formatting noise, and batch edits. That is a metric about **how misleading raw diff/LOC dashboards can be**, not a standard for **total repository size**. It supports the takeaway: **compare trends and risk hotspots**, not bragging rights on line count.

### 6.4 Other metrics teams use instead of raw LOC

| Metric family | What it measures | Typical use |
|---------------|------------------|-------------|
| **Cyclomatic / cognitive complexity** | Branching density per unit (function/module) | Find review/test hotspots; Sonar ESLint rules often encode this. |
| **Test coverage** | % of lines/branches exercised by tests | Holzen’s suite is small vs app size (§5); coverage is meaningful **per critical path**, not as a single target for the whole UI kit. |
| **Defect density** | Defects per KLOC (when tracked) | Historical software engineering literature; **controversial** for agile/TS codebases; still used in some regulated contexts. |
| **DORA metrics** | Lead time, deploy frequency, change failure rate, MTTR | [DORA](https://dora.dev/) — **industry-standard outcome metrics**; they do **not** reduce to LOC. |
| **Security / SAST findings** | Vuln classes, secret leaks, dependency CVEs | Comparable across repos when scoped (e.g. critical CVEs in shipped paths). |

Wikipedia’s article on [source lines of code](https://en.wikipedia.org/wiki/Source_lines_of_code) summarizes long-standing **limitations of LOC** as a productivity or quality measure.

### 6.5 Bottom line for Holzen

On **Sonar-style anchors**, Holzen is **mid-range between 10k and 100k** raw inventory. On **product scope**, it is **far beyond** a RealWorld-sized reference app. On **what “industry” actually compares**, **outcomes (DORA), security posture, and critical-path correctness** matter more than a single LOC number.

---

## 7. Related docs

- [navigating-the-codebase.md](./navigating-the-codebase.md) — how the app boots, routes, and data flow.
- [AGENTS.md](../AGENTS.md) — commands, conventions, Supabase notes.
- [cron-setup.md](../ops/cron-setup.md) — scheduled jobs and operational context.

---

*Figures in §1 were produced with a local line count (PowerShell `Get-Content` per file). Re-run the same methodology after large refactors if you need an updated snapshot.*
