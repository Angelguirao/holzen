# Frontend module layout (repository map)

**Status:** accepted (companion to [holzen-application-architecture.md](holzen-application-architecture.md))  
**ADR:** [2026-05-17-modular-monolith-hexagonal-client.md](../decisions/2026-05-17-modular-monolith-hexagonal-client.md)  
**Shipped product boundary:** [active-surface.md](../ops/active-surface.md)

This document is the **operational map**: folders, packages, naming, import rules, migration waves, and CI. **Why** we do this lives in [holzen-application-architecture.md](holzen-application-architecture.md) (especially **§7 screens vs contexts** and **§8 pause includes companions**); **who enforces truth** lives in [client-server-architecture-holzen.md](client-server-architecture-holzen.md). **Modern React alignment** (feature folders, Query, colocation): [modern-react-practices-holzen.md](modern-react-practices-holzen.md).

---

## 0. Lovable constraint (execution vs north star)

| | **Now (Lovable-managed publish)** | **North star (gated)** |
|---|-----------------------------------|-------------------------|
| **Vite root** | Repository root (`vite.config.ts`, `index.html`, `src/`) | `apps/web` |
| **Bounded contexts** | `src/features/<context>/` (same layers as packages) | `packages/<context>/` |
| **Screens** | `src/pages/`, `src/components/` | `apps/web/src/screens/` |
| **Boundary enforcement** | `npm run check:feature-imports` | `check:package-boundaries` + package `public.ts` |
| **When to extract packages** | — | Second client, leave Lovable publish, or confirmed Lovable subdirectory-root support |

Do **not** move the SPA to `apps/web` without passing the extraction gate in [ADR §8](../decisions/2026-05-17-modular-monolith-hexagonal-client.md). That breaks Publish → Update, `lovable-tagger`, and agent heuristics that assume root `src/App.tsx`.

`supabase/` (migrations, edge functions) is unchanged either way.

---

## 0.1 Screens vs packages (do not conflate)

| Kind | Lives in | Examples |
|------|----------|----------|
| **Bounded context** | `src/features/<context>/` (now) → `packages/<context>/` (later) | `pause`, `subscription`, `market`, `user`, `auth` |
| **Screen / route** | `src/pages/` + `src/components/` (now) → `apps/web/src/screens/` | Home, Archive, Journey, Settings, PauseSession, Companion* |
| **Not a package** | — | `home`, `archive`, `journey`, `settings`, `companion` (companions are **inside** `pause`) |

---

## 1. Target monorepo tree (north star — gated on §0)

When Holzen extracts to `packages/*`, use this tree. Until then, mirror the **package interior** under `src/features/` (§10).

```text
holzen/
  apps/
    web/
      src/
        app/                    # App.tsx, providers, route table
        pages/                  # thin re-exports only
        modules/                # optional: wire adapters → use cases per route
      index.html
      vite.config.ts
      vitest.config.ts

  packages/
    contracts/
      src/
        edge/                   # holzen-reflect, companion-orchestrate, …
        rpc/                    # critical RPC payloads (hand-maintained or derived)
        analytics/              # optional: PostHog payloads we validate
      package.json

    shared-kernel/
      src/
        result.ts
        ids.ts
        errors.ts
      package.json

    infrastructure/
      src/
        supabase/
          client.ts             # browser factory (env from apps/web)
          pause-repository.ts   # implements @holzen/pause ports
          …
        edge/
          invoke-edge.ts        # x-cid, logging hooks
        query/                  # shared queryClient helpers if needed
      package.json

    pause/                      # ritual + reflect + companions + archive/journey reads (§3)
    subscription/
    market/
    user/                       # profile, signals, quiet windows
    auth/
    roadmap/                    # optional; small feature
    # admin → apps/web/modules/admin unless it grows

  apps/web/src/screens/         # Home, Archive, Journey, Settings, pause/*, marketing/*

  supabase/                     # unchanged role (authoritative domain)
  docs/
  bruno/
  package.json                  # workspace root scripts
  pnpm-workspace.yaml
  turbo.json                    # optional: turbo run test build
```

**Deployable today:** only `apps/web` (Lovable publish / static hosting). Packages are **libraries**, not separate services.

---

## 2. Standard package interior

Every **bounded-context** package uses:

```text
packages/<context>/src/
  domain/
  application/
    use-cases/          # group subdirs when a context is large — see §3 for pause
  ports/
  public.ts
  index.ts
```

**`@holzen/pause`** is the exception that proves the rule: it is larger and must use **ritual subfolders** (§3). Smaller contexts (`auth`, `roadmap`) may keep a flat `use-cases/`.

### Layer import rules (within any context package)

| From → To | domain | application | ports | infrastructure (in package) |
|-----------|--------|-------------|-------|-------------------------------|
| **domain** | — | no | no | no |
| **application** | yes | — | yes | no |
| **ports** | yes | no | — | no |
| **presentation** (in `apps/web`) | via public API only | yes (use cases) | no direct | via injected adapters |

**Presentation must not import** `packages/*/src/infrastructure/**` internals — only wired adapters from `apps/web/modules` or a composition root.

---

## 3. `@holzen/pause` interior (canonical — organize carefully)

Pause is the **core aggregate** in Postgres (`pause_instances`, `pause_step_events`, `pause_companion_events`, `pause_ai_artifacts`). **Companions, reflect, and breathing are ritual modules inside pause**, not `@holzen/companion`.

```text
packages/pause/src/
  domain/
    instance.ts
    ritual-steps.ts
    step-types.ts
    companion-slots.ts
  application/
    use-cases/
      session/
      ritual/
      breathing/
      reflect/
      companions/
      terminal/
    queries/              # archive list, journey overview — pause read models
  ports/
    PauseRepository.ts
    ReflectGenerator.ts
    CompanionOrchestrator.ts
    PauseSessionStorage.ts
  public.ts
```

| Ritual beat (UI) | Use-case area | Server / edge |
|------------------|---------------|---------------|
| Feel, Decide, Frame hub | `ritual/`, `terminal/` | `pause_log_step` |
| Breathe (1 & 2) | `breathing/` | `breath_completed` payloads |
| Reflect | `reflect/` | `holzen-reflect` → `pause_ai_artifacts` |
| Frame slots (signal, history, …) | `companions/` | `companion-orchestrate`, `pause_log_companion` |
| Full-screen `/companion/*` | presentation in `apps/web/src/screens/pause/` | same instance id |

**Care rules:** one domain owner for step transitions; all mutations through use cases; no `supabase` in step components. Details: [holzen-application-architecture.md](holzen-application-architecture.md) §8.4.

---

## 4. Cross-package dependency graph

```text
                    ┌─────────────┐
                    │  apps/web   │
                    └──────┬──────┘
                           │ imports public API only
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   packages/pause   packages/subscription  packages/user
         │                 │                 │
         └────────┬────────┴────────┬────────┘
                  ▼                 ▼
         packages/infrastructure   packages/contracts
                  │
                  └──────────────► packages/shared-kernel

  apps/web/src/screens/*  →  composes pause, subscription, market, user (not separate packages)
```

**Allowed:**

- `apps/web` → any `packages/<context>` **`public.ts`** + `contracts` + `shared-kernel`.
- `packages/<context>/application` → same context `domain`, `ports`; → `shared-kernel`, `contracts`.
- `packages/infrastructure` → `ports` from any context it implements, `contracts`, `shared-kernel`, Supabase client.

**Forbidden:**

- `packages/pause` → `packages/user/src/...` (deep path) except via `public.ts`.
- `packages/*/domain` → `packages/infrastructure`.
- `packages/*/application` → `react`, `@supabase/supabase-js` (except via port types that use DTO shapes only).
- Any active code → `@/legacy/*`.

**Cross-context needs:** import from `@holzen/pause/public` (published symbols only). If two contexts must share logic, lift to `shared-kernel` (rare) or expose a narrow port.

---

## 5. Naming conventions

| Artifact | Convention | Example |
|----------|--------------|---------|
| Use case file | `kebab-case` verb phrase | `log-pause-step.ts` |
| Use case export | `camelCase` function | `export async function logPauseStep(...)` |
| Port interface | `PascalCase` + role | `PauseRepository` |
| Adapter impl | `PascalCase` + technology | `PauseRepositorySupabase` |
| Query module | `*-query.ts` in `infrastructure` or context `infrastructure/queries/` | `pause-archive-list-query.ts` |
| Query key factory | `getPauseArchiveListQueryOptions` | matches [data-fetching-conventions](../backlog/data-fetching-conventions.md) |
| Screen | `PascalCase` + `Screen` suffix | `HomeScreen.tsx` under `apps/web/src/screens/` |
| Public API | `public.ts` at package root | 5–20 exports max |
| Package name | `@holzen/<context>` | `@holzen/pause` |

**No `.tsx` in `application/` or `domain/`.** Presentation-only helpers stay under `apps/web` or `packages/<context>/presentation/` if you colocate UI in packages later.

---

## 6. `apps/web` responsibilities

| Path | Responsibility |
|------|----------------|
| `app/App.tsx` | Router, `QueryClientProvider`, `AuthProvider`, lazy routes |
| `pages/*.tsx` | `export { default } from '@holzen/home/screens/HomeScreen'` (one line) |
| `modules/<route>/wire.ts` | Composition root: construct adapters, pass to hooks |
| `modules/<route>/*.tsx` | Thin hooks that call use cases (or colocate in package `presentation/` later) |

**Example composition root (sketch):**

```ts
// apps/web/src/modules/pause/wire.ts
import { createPauseRepository } from '@holzen/infrastructure';
import { logPauseStep } from '@holzen/pause';

export function createPauseActions(deps: { supabase: SupabaseClient }) {
  const repo = createPauseRepository(deps.supabase);
  return {
    logPauseStep: (input: LogPauseStepInput) => logPauseStep(input, { pauseRepository: repo }),
  };
}
```

---

## 7. `packages/contracts`

**Owns:** wire formats, not behavior.

| Include | Exclude |
|---------|---------|
| Zod schemas for edge bodies we control | Full `Database` type (stays `gen:types`) |
| Narrow RPC argument objects for hand-written clients | Duplicating every PostgREST table |
| Shared error codes / result envelopes | React types |

**Consumers:** `packages/infrastructure` adapters (parse responses), edge functions (validate input — import via relative path or deno-compatible bundle per [documentation-strategy.md](documentation-strategy.md)).

---

## 8. Edge alignment (server application layer)

Edge handlers stay in `supabase/functions/`. Align **names** with client use cases where the same product action exists:

| Client use case | Server counterpart |
|-----------------|-------------------|
| `generateReflectArtifact` | `holzen-reflect` + `_shared/` steps |
| `orchestrateCompanions` | `companion-orchestrate` |
| `logPauseStep` | `pause_log_step` RPC |

Fat `index.ts` → extract steps under `supabase/functions/_shared/<context>/` (validate → authorize → act → log). Validate request bodies with schemas from `packages/contracts` when wired.

---

## 9. Mapping: current `src/` → target (shipped scope)

Use this when moving files. Paths are indicative — adjust to actual filenames during migration.

| Current (transitional) | Target |
|------------------------|--------|
| `src/hooks/use-pause-*.ts` | `packages/pause` (§3 subdirs) + thin hooks in `apps/web` |
| `src/hooks/use-companion-data.ts` | `packages/pause/application/companion/` |
| `src/hooks/use-holzen.ts` | `packages/market` + `apps/web/screens/home` (wires pause triggers) |
| `src/hooks/use-subscription.ts` | `packages/subscription` |
| `src/hooks/use-auth.tsx` (re-export) | `features/auth/presentation/AuthProvider.tsx` → `packages/auth` |
| `src/hooks/use-library.ts` | `packages/pause` queries (archive collections) |
| `src/lib/pause-*.ts`, `src/lib/companion-*.ts` | Thin re-exports → `features/pause/public` or `public-queries` (until legacy removed) |
| `src/lib/*-query.ts` (subscription, market, user) | Re-exports → owning `features/*/public-queries` |
| `src/lib/posthog.ts`, `sentry.ts`, `invoke-edge.ts`, `cid.ts` | `packages/infrastructure` or `shared-kernel` |
| `src/screens/pause/components/*`, `Companion*.tsx` | `apps/web/src/screens/pause/` (5c); was `components/pause/*` |
| `src/screens/home/components/*` | `apps/web/src/screens/home/` |
| `src/pages/settings/*` | `apps/web/src/screens/settings/` + `packages/user` |
| `src/pages/PauseSession.tsx` | `apps/web/pages` re-export + pause screen |
| `src/integrations/supabase/types.ts` | Stay generated; consumed by infrastructure only |
| `src/legacy/**` | Remove from `main`; git tag / archive branch only |

**Delete or archive (not in target):** empty `src/components/stats/**`, unused `PracticeWidget` path, any file with no path from [active-surface.md](../ops/active-surface.md).

---

## 10. Transitional layout (active — root Vite + `src/features/`)

**This is the execution layout** while Lovable publish stays at the repo root. See `src/features/README.md` and `src/features/pause/`.

```text
src/
  App.tsx, pages/, components/     # screens & UI (unchanged for Lovable)
  hooks/, lib/                      # shrink as contexts migrate into features/
  features/
    pause/
      domain/
      application/
        use-cases/
        companion/                 # ritual modules inside pause (§3)
        reflect/
        breathing/
      ports/
      public.ts                    # cross-feature API (no eager Supabase)
      public-queries.ts            # TanStack query modules (app hooks/screens)
    subscription/
    market/
    user/
    …
  integrations/supabase/           # until adapters move to features/*/infrastructure
```

Same dependency rules as §2–3 for layers that exist. `npm run check:feature-imports` enforces layer rules under `src/features/**` and blocks deep `@/features/<ctx>/(application|infrastructure|domain|presentation)/` imports from active `src/hooks`, `src/pages`, `src/components`, and `src/test` (allowed: `public`, `public-queries`, `public-rpc`, plus RPC lib shims `apply-bulk-hold-outcomes` / `pause-ritual-depth-upgrade`).

**`src/lib/*` shims (legacy + gradual removal):** re-export from `@/features/<ctx>/public` (domain/application, no Supabase) or `public-queries.ts` (TanStack + Supabase). RPC-heavy use cases (`applyBulkHoldOutcomes`, `logPauseRitualDepthUpgraded`) stay on narrow `application/` or `public-rpc` paths — not `public.ts` — so Vitest does not eager-load the Supabase client.

---

## 11. Migration waves (recommended order)

| Wave | Scope | Exit criteria |
|------|--------|----------------|
| **0** | Docs + ADR (Lovable §) + `src/features/pause/` skeleton + `check:feature-imports` | `test:ci` green; root `npm run build` |
| **1** | Migrate **pause** domain + use cases into `src/features/pause/` (small PRs) | Pause E2E green; companions under `application/companion/` |
| **2** | `subscription`, `market`, `user`, `auth` features + shrink root `hooks/`/`lib/` | Cross-feature: `public.ts` only; app hooks may use `public-queries.ts` where queries need Supabase |
| **3** | Optional `src/features/*/infrastructure` adapters; keep Supabase types in `integrations/` until needed | Adapter tests |
| **4** | `src/legacy` off main runtime path | **Done (transitional):** `tsconfig.app.json` + Vitest exclude `src/legacy/**`; `check:active-surface` blocks `@/legacy/*` in active tree; folder kept for `archive/full-ia-pre-strip` recovery only. Physical delete is optional / separate archive PR. |
| **5a** | Domain contexts in `src/features/*` + `check:architecture-alignment` | **Done** on `feature/refactoring6` — see §10 |
| **5b** | Presentation guardrails | **Done** — `src/screens/README.md`; `check:no-root-components` in `test:ci` |
| **5c** | **Pause** screen pilot | **Done** — `components/pause/**` → `screens/pause/components/**`; [docs/screens/pause.md](../screens/pause.md) |
| **5d** | **Home** screen | **Done** — `components/home/**` → `screens/home/components/`; thin `pages/Home.tsx` → `HomeScreen` |
| **5e** | **Archive, Journey, Settings** | **Done** — `screens/{archive,journey,settings}/components/` |
| **5f** | Companion routes | **Done** — `/companion/*` pages + companion UI under `screens/pause/`; thin `pages/Companion*.tsx` re-exports |
| **5g** | Marketing / admin | **Done** — `screens/marketing/components/`, `screens/admin/` |
| **5h** | Orchestration | **Done (shipped surfaces)** — `use-home-*` + `HolzenProvider`/`useHolzen` → `screens/home/hooks/` (active imports `@/screens/home/hooks/use-holzen`; root `@/hooks/use-holzen` shim for legacy only); `use-pause-session-*` + ritual hooks → `screens/pause/hooks/`; `HomeScreen` / `PauseSessionScreen` with thin `pages/` re-exports |
| **5i** | Shrink global layers | **Done (shipped)** — allowlist **37** root shell/shared components (was 59); home market widgets + onboarding + `MoodCheck` under screens; domain `MoodValue` in `features/pause` |
| **5j** | App shell | **In progress** — `src/app/components/` (layout, nav, meta, error boundary, cookie/offline, public footer); allowlist **28**; `check:no-screens-in-features` |
| **6** | **Gated:** `pnpm-workspace.yaml`, `apps/web`, `packages/*` extract | Only after ADR §8 trigger; `build` from `apps/web` |
| **7** | `shared-kernel`, `contracts` (minimal), `packages/infrastructure` | Adapter smoke test |
| **8+** | `apps/web/src/screens`; `check:package-boundaries` | Post-extraction only |

**Per-PR rule:** mechanical moves + import updates only; behavior changes in separate PRs.

---

## 12. Tooling

### Package manager

**Preferred:** [pnpm](https://pnpm.io/) workspaces (`pnpm-workspace.yaml`).

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

Root `package.json` scripts delegate: `"build": "turbo run build"` or `"pnpm --filter @holzen/web build"`.

**Vite:** `apps/web/vite.config.ts` resolves workspace packages via `resolve.dedupe` and TS `paths` → `@holzen/*`.

### TypeScript

Root `tsconfig.json` references project refs per package, or a single base + per-package `tsconfig.json` extending base.

### Tests

| Package | Runner | Location |
|---------|--------|----------|
| `domain`, `application` | Vitest (node) | `packages/<ctx>/src/**/*.test.ts` |
| `apps/web` | Vitest (jsdom) | existing component/integration patterns |
| Infrastructure | Vitest + mocks | adapter contract tests |

### CI checks (phased)

| Script | When | Purpose |
|--------|------|---------|
| `check:active-surface` | now | No legacy imports, shipped surface |
| `check:feature-imports` | **now** (`scripts/check-feature-imports.mjs`) | Enforce §2 layer rules under `src/features/` |
| `check:architecture-alignment` | **now** (`scripts/check-architecture-alignment.mjs`) | Waves 0–4 scaffold (five contexts, root Vite, legacy excluded); runs `check:feature-imports`; in **`test:ci`** |
| `check:no-root-components` | **now** (`scripts/check-no-root-components.mjs`) | Blocks new `src/components/*.tsx` at repo root; allowlist shrinks during waves 5c–5i |
| `check:package-boundaries` | post-monorepo | dependency-cruiser or eslint-plugin-boundaries on `@holzen/*` graph |
| `test:ci` | always | Existing gate (includes `check:architecture-alignment`) |

**`check:feature-imports` rules (summary):**

- `domain/**` must not import `presentation`, `infrastructure`, `react`, `@supabase/*`.
- `application/**` must not import `react`, `@supabase/*`.
- `presentation/**` must not import other features’ `infrastructure/**` (only `public.ts`).

---

## 13. Lovable and env

**Today:** publish and dev use **repository root** — do not relocate `index.html` or `vite.config.ts` without ADR §8.

**After extraction:** publish root becomes `apps/web` (document in README / AGENTS when switched). `VITE_*` env vars load in `apps/web`; `packages/infrastructure` receives config via factory args, not `import.meta` in packages (keeps packages testable).

---

## 14. Package ↔ shipped route map

| Route / area | Screen (apps/web) | Packages used |
|--------------|-------------------|---------------|
| `/` | `HomeScreen` | `pause`, `market`, `subscription`, `user` |
| `/pause` | `PauseSessionScreen` | `pause` |
| `/companion/*` | `Companion*Screen` | `pause` (slot presentation) |
| `/archive` | `ArchiveScreen` | `pause` (read queries) |
| `/journey` | `JourneyScreen` | `pause` (aggregates) |
| `/settings/*` | `SettingsShell` | `user`, `subscription` |
| `/welcome`, `/auth`, legal, blog | marketing/auth screens | `auth`, thin marketing |
| `/roadmap` | `RoadmapScreen` | `roadmap` or `apps/web` only |
| `/admin`, ops pages | `AdminScreen` | `apps/web` / admin module |

---

## 15. Review checklist (layout-specific)

- [ ] New code lands in the correct **package** and **layer**.
- [ ] Cross-package import uses **`public.ts`** only.
- [ ] Use case added for new **user intention** (not only a hook).
- [ ] Query keys live in **infrastructure/queries**, invoked from presentation via `useQuery`.
- [ ] Contract schema updated if edge/RPC shape changed.
- [ ] `pages/*.tsx` stays a **re-export** (no new logic).

---

## 16. Related docs

| Doc | Role |
|-----|------|
| [holzen-application-architecture.md](holzen-application-architecture.md) | Principles, inspirations, anti-patterns |
| [client-server-architecture-holzen.md](client-server-architecture-holzen.md) | Truth vs projection |
| [react-screen-orchestration.md](react-screen-orchestration.md) | Thin screens, hook rules |
| [refactoring-strategy.md](refactoring-strategy.md) | Small moves inside old tree until wave complete |
| [navigating-the-codebase.md](navigating-the-codebase.md) | Runtime tour (update after wave 7) |

---

## 17. Summary

- **One web app** (`apps/web`), **few context packages** — **`pause` is the big one** (ritual + companions + reflect).
- **Tabs are screens**, not packages; **companions are not `@holzen/companion`**.
- **Same layer cake** per context: domain → application → ports; infrastructure implements ports.
- **Migrate in waves**; organize pause by **ritual submodule** (§3); **do not** keep `src/legacy` on main.
