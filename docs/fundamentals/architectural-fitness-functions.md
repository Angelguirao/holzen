# Architectural fitness functions (Holzen)

**Status:** accepted (May 2026)  
**Audience:** engineers, reviewers, and automation  
**Scope:** How Holzen **measures** that architecture still matches intent as the codebase evolves.

This doc is the **owner** for the fitness-function catalog. It does **not** duplicate the command tables in [AGENTS.md](../../AGENTS.md) or the push checklist in [deployment-sync-guide.md](../ops/deployment-sync-guide.md) — those say **what to run**; this doc says **why each guard exists**, which **capability** it protects, and how to add new ones.

| Doc | Owns |
|-----|------|
| **This file** | Fitness-function concept, capability map, catalog, gaps, how to add checks |
| [AGENTS.md](../../AGENTS.md) | `npm run` command names and when to run them |
| [deployment-sync-guide.md](../ops/deployment-sync-guide.md) | Pre-push / Lovable sync workflow |
| [holzen-application-architecture.md](holzen-application-architecture.md) | Principles constitution (P1–P8) |
| [modern-react-practices-holzen.md](modern-react-practices-holzen.md) | Manual scorecard + PR checklist §6 |
| [frontend-module-layout.md](frontend-module-layout.md) | Migration waves + layer import rules |

---

## 1. What fitness functions are

An **architectural fitness function** is an **objective** check that a structural or quality attribute still holds as the system changes. Holzen uses them to be evolutionary architecture practice: principles in markdown, **automated guardrails** in CI/scripts, and **review scorecards** where automation is not yet worth the cost.

| Practice | Role |
|----------|------|
| **Principles docs** | Describe intent (e.g. server authority, bounded contexts) |
| **Fitness functions** | Detect drift from intent |
| **ADRs** | Record costly-to-reverse decisions |
| **Unit/integration tests** | Correctness of behavior (complement, not replace, structural guards) |

Holzen thesis #4 — *boundaries are enforced* — is implemented largely through these checks ([holzen-application-architecture.md](holzen-application-architecture.md) §3).

---

## 2. Pipeline tiers

| Tier | Entry point | Blocks merge? | Typical use |
|------|-------------|---------------|-------------|
| **CI gate** | `npm run test:ci` | Yes (GitHub Actions) | Every PR |
| **Prebuild** | `check:version-sync` via `prebuild` | Yes on `npm run build` | Build / deploy |
| **Pre-push** | `npm run check:prepush` | Local discipline | Before `git push` (requires **bash**) |
| **Optional** | `check:edge`, `check:i18n-active-keys`, `smoke:edge-logging` | No | When touching those areas |
| **Manual** | Flow review, scorecard §4, migration `rg` discovery | Reviewer judgment | Meaningful PRs |

**Rule of thumb:** if a new invariant is cheap to express as pass/fail, add a `scripts/check-*.mjs` and wire it into `test:ci` or `check:prepush`. If it needs human judgment (god-hooks, render boundaries), document it in the scorecard or [react-spa-review-template.md](../reviews/react-spa-review-template.md) until automation pays off.

---

## 3. Capability → guard map (quick reference)

| Capability | Primary automated guards | Manual backstop |
|------------|-------------------------|-----------------|
| Ship pause-first only | `check:active-surface`, `check:bundle-shipped`, `check:no-phase-labels` | [active-surface.md](../ops/active-surface.md) |
| Modular monolith / layer direction | `check:architecture-alignment` (includes `check:feature-imports`, `check:no-screens-in-features`), `check:no-root-components` | [.cursor/rules/architecture-migration.mdc](../../.cursor/rules/architecture-migration.mdc) discovery `rg` |
| Server owns truth | Vitest; RLS/migration review | [client-server-architecture-holzen.md](client-server-architecture-holzen.md), flow review |
| Edge deploy + observe | `check:edge-logging`, config.toml coverage, `check:edge-coverage-manifest`, `check:edge` | [edge-logging-conventions.md](../ops/edge-logging-conventions.md) |
| Controlled client → edge surface | `check:invoke-edge-allowlist` | `invokeEdge` + `x-cid` on new call sites |
| Analytics taxonomy | `check:posthog-events-allowlist` | [event-taxonomy.md](../ops/event-taxonomy.md) in same PR |
| Feature flags taxonomy | `check:feature-flags-doc` | [feature-flags.md](../ops/feature-flags.md) in same PR |
| API review catalog | `check:bruno-active-manifest` | `bruno/active/functions-catalog.md` |
| Schema evolves safely | `check:view-migrations`, `check:sql-search-path`, local `supabase db reset` (prepush) | [migration-view-safety.md](../ops/migration-view-safety.md), [migration-security-conventions.md](../ops/migration-security-conventions.md) |
| Release traceability | `check:version-sync`, `stamp-edge-release` / `check:release-stamp` | `VITE_APP_VERSION` = Git SHA in Lovable |
| Performance / render boundaries | Build with React Compiler pilot (`vite.react-compiler.ts`) | [ADR 2026-05-23](../decisions/2026-05-23-render-boundaries-defer-react-compiler-19.md), [modern-react-practices-holzen.md](modern-react-practices-holzen.md) §2.9 + §6 |

---

## 4. Automated catalog

Scripts live under `scripts/`. See script headers for exact rules and allowlists.

### 4.1 Product scope (pause-first)

| Script | In `test:ci` | Capability |
|--------|--------------|------------|
| `check:active-surface` | Yes | No `@/legacy/*`, Tier B tables, or retired paths in active `src/` |
| `check:no-phase-labels` | Yes | No `mvp` / `pre-mvp` tokens in shipped dev paths |
| `check:bundle-shipped` | Yes (after build) | No `BadgesPanelV2` / `ToolsHub` in `dist/assets` |
| `check:invoke-edge-allowlist` | Yes | Every `invokeEdge('…')` in active `src/` is allowlisted |

### 4.2 Client structure

| Script | In `test:ci` | Capability |
|--------|--------------|------------|
| `check:architecture-alignment` | Yes | Required `features/<ctx>/` skeleton; pause ritual paths; spawns feature-import + no-screens checks |
| `check:feature-imports` | Via architecture-alignment | Hexagonal layer rules; `public*` barrels from app code; presentation hooks import `application/` only via `*-io.ts` barrels; no Supabase client in `presentation/`; pause `presentation/` must not import `pause/infrastructure/` |
| `check:no-supabase-in-screens` | Via architecture-alignment | No `@/integrations/supabase/client` in `src/screens/**` |
| `check:no-supabase-in-app` | Via architecture-alignment | No `@/integrations/supabase/client` in `src/app/**` |
| `check:no-screens-in-features` | Via architecture-alignment | Features must not import `@/screens/` |
| `check:screen-form-action-barrels` | Via architecture-alignment | `src/screens/**/*-action.ts` re-exports only (no inline `export async function` I/O) |
| `check:no-posthog-in-screens` | Via architecture-alignment | No direct `@/lib/posthog` in `src/screens/**` (feature telemetry I/O or `app/lib`) |
| `check:no-posthog-in-app` | Via architecture-alignment | No direct `@/lib/posthog` in `src/app/**` except allowlisted widgets + `app/lib/*-telemetry.ts` |
| `check:no-holzen-in-settings` | Via architecture-alignment | No `HolzenProvider` / `useHolzen` in `src/screens/settings/**` — profile via `user/public-hooks` |
| `check:no-app-imports-in-features` | Via architecture-alignment | No `@/app/*` imports under `src/features/**` |
| `check:no-profile-spread-in-pause-home` | Via architecture-alignment | `useHolzenHomeContextState` must not `...profile` — use `useProfile` at call sites |
| `check:no-root-components` | Yes | No new `src/components/*.tsx` outside allowlist |

### 4.3 Edge platform

| Script | In `test:ci` | Capability |
|--------|--------------|------------|
| `check:edge-logging` | Yes | HTTP edges wrap handlers in `withRequestLogging` |
| `check:edge-coverage-manifest` | Yes | `EdgeCoverageScreen.tsx` ↔ `config.toml` |
| `check:bruno-active-manifest` | Yes | Bruno catalog ↔ `config.toml` |
| `check:edge` | Prepush (optional skip) | `deno check` on edge entrypoints |
| Prepush grep | Prepush | Every function folder has `[functions.<name>]` |

### 4.4 Data, observability, release

| Script | In `test:ci` | Capability |
|--------|--------------|------------|
| `check:posthog-events-allowlist` | Yes | `trackEvent` names ⊆ event taxonomy Active section |
| `check:feature-flags-doc` | Yes | `useFeatureFlag` keys ⊆ feature-flags.md Active flags table |
| `check:i18n-active-keys` | Yes | Active `t('…')` keys exist in `src/locales/en.json` |
| `check:view-migrations` | Prepush | Safe `CREATE OR REPLACE VIEW` patterns |
| `check:sql-search-path` | Yes (`test:ci`) + Prepush | Every migration function pins `public` in `search_path` |
| `check:version-sync` | Prebuild | `package.json` version = latest changelog row |
| `stamp-edge-release` / `check:release-stamp` | Prepush stamp step | Edge `EDGE_RELEASE` = Git SHA |
| `npm run test` + `npm run build` | Prepush / CI | Behavior + production bundle |

### 4.5 Optional (not merge-blocking today)

| Script | When to run |
|--------|-------------|
| `check:i18n-active-keys` | When adding `t('…')` keys (not in `test:ci` until tree complete) |
| `smoke:edge-logging` | After changing `x-cid` / edge logging wiring |
| `check:release-stamp` | Read-only verify before push |

---

## 5. Manual and semi-automated guards

These are **real** fitness functions even when CI does not run them.

### 5.1 Flow-first review

[react-spa-review-template.md](../reviews/react-spa-review-template.md) — trace one user journey (UI → state → Supabase/edge → UI) before screen polish. Cursor skill: `.cursor/skills/holzen-flow-review/SKILL.md`.

### 5.2 Modern React scorecard

[modern-react-practices-holzen.md](modern-react-practices-holzen.md) §4 — Strong / Partial / Weak per practice. Use in PR descriptions and pre-launch audits. §6 is the PR checklist for UI changes.

### 5.3 Architecture migration discovery

During migration sessions ([architecture-migration.mdc](../../.cursor/rules/architecture-migration.mdc)):

```bash
rg '@/lib/(pause|companion|holzen|subscription)-' src --glob '!**/legacy/**'
rg "from '@/integrations/supabase" src/screens
rg "from '@/features/[^']+/(application|infrastructure|domain)" src/screens src/app
```

### 5.4 Render boundaries and React Compiler

Policy: [ADR 2026-05-23](../decisions/2026-05-23-render-boundaries-defer-react-compiler-19.md).

| Guard | Type | Notes |
|-------|------|-------|
| Boundaries-first policy | Manual | State low; `React.memo` on heavy shells; no mass memo deletion during migration |
| Three-question memo gate | Manual (§2.9) | New `useMemo`/`useCallback` only for memo child, expensive derive, or effect deps |
| Compiler pilot | Build-time | `vite.react-compiler.ts` — annotation mode on home/pause `components/**` + `app/components/*.tsx`; `HOLZEN_REACT_COMPILER=0` disables |
| React 19 leverage closure | CI | `npm run check:react19-leverage` — no manual mutation loading flags in active `src/` outside allowlist (auth boot, admin) |
| Build green with Compiler | Implicit | `npm run build` / `test:ci` |

### 5.5 Security and migration conventions

[migration-security-conventions.md](../ops/migration-security-conventions.md) — `search_path` on functions: **`check:sql-search-path`**; `SECURITY DEFINER` caller validation remains code review.

### 5.6 Paired artifacts (manual)

| Change | Pair in same PR |
|--------|-----------------|
| New PostHog event | [event-taxonomy.md](../ops/event-taxonomy.md) (+ allowlist check) |
| New feature flag | [feature-flags.md](../ops/feature-flags.md) (**no CI yet**) |
| New edge function | `config.toml`, `EdgeCoverage.tsx`, logging checks, Bruno catalog |

---

## 6. Known gaps (candidates for new checks)

Ordered by impact ÷ effort. Do not implement here unless a separate task scopes the script.

| Candidate | Protects | Notes |
|-----------|----------|-------|
| ~~`check:no-supabase-in-screens`~~ | *(shipped)* | Wired in `check:architecture-alignment` |
| ~~`check:screen-form-action-barrels`~~ | *(shipped)* | `src/screens/**/*-action.ts` must re-export feature `*-io` actions only |
| ~~`check:feature-flags-doc`~~ | *(shipped)* | In `test:ci` + prepush |
| ~~Enable `check:i18n-active-keys` in CI~~ | *(shipped)* | In `test:ci` |
| ~~`check:sql-search-path`~~ | *(shipped)* | In `test:ci` + prepush |
| Bundle size budget | Performance regression | Threshold on main chunk post-build |

---

## 7. Adding a new fitness function

1. **Name** — `scripts/check-<invariant>.mjs` with a header comment linking the owner doc.
2. **Wire** — add to `package.json`; put in `test:ci` if merge-blocking, or `check:prepush` if push-time only.
3. **Pair the doc** — update the canonical owner (principles, ops, or system doc) in the same PR.
4. **Allowlist explicitly** — legacy paths, tests, pilots (follow `check:active-surface` / Compiler pilot patterns).
5. **Plan sunset** — document when the check can tighten or be removed.

**Trigger matrix (when editing…):**

| Area | Run |
|------|-----|
| `src/screens/`, `src/features/` | `test:ci` |
| `supabase/functions/` | `check:edge-logging`, `check:edge-coverage-manifest`, `check:edge` |
| `supabase/migrations/` | `check:view-migrations`, local `db reset` |
| PostHog events | `check:posthog-events-allowlist` + taxonomy doc |
| Vite / Compiler config | `npm run build` with Compiler enabled |
| Before push | `check:prepush` |

---

## 8. Related reading

- [holzen-application-architecture.md](holzen-application-architecture.md) §15 — evolution and governance  
- [frontend-module-layout.md](frontend-module-layout.md) §11 — CI checks phased with migration waves  
- [codebase-size-and-review-practices.md](codebase-size-and-review-practices.md) — review depth vs codebase size  
- [documentation-strategy.md](documentation-strategy.md) — single-owner rule for new docs
