# Naming conventions (Holzen client)

**Status:** accepted (May 2026)  
**Audience:** contributors and agents placing or renaming files under active `src/`  
**Pairs with:** [frontend-module-layout.md](frontend-module-layout.md) §5 (summary table), [client-src-layout.md](client-src-layout.md) (placement), [holzen-application-architecture.md](holzen-application-architecture.md) (principles), [refactoring-strategy.md](refactoring-strategy.md) (incremental slices)

This doc is the **canonical naming guide** for the transitional `src/features/` tree and `src/screens/`. It encodes patterns already used in shipped code (especially pause-first) so new files read consistently and agents do not invent parallel styles.

---

## 1. Goals

| Goal | How naming helps |
|------|------------------|
| **Find files by product area** | Context prefix (`pause-`, `subscription-`) or bounded-context folder |
| **See layer at a glance** | `public*` barrels vs `application/use-cases/` vs route `components/` |
| **Avoid route-as-package** | Screens stay `screens/<route>/`; no `features/home` |
| **Align client ↔ server** | Use case names mirror RPC/edge where the same action exists |

---

## 2. Bounded contexts (folders)

| Rule | Example |
|------|---------|
| Context = **product capability**, not nav tab | `pause`, `subscription`, `market`, `auth`, `user`, `notifications` |
| **No** route-named packages | ❌ `features/home`, `features/archive`, `features/journey` |
| Companions live in **pause** (use cases) | `application/use-cases/ritual/frame/` — not `features/companion` |
| Archive **reads** for pause data stay in **pause** until a later split is ADR-approved | `use-cases/archive/` (Pauses + Echoes — **not** user collections; collections → `src/legacy/archive-collections/`) |

---

## 3. Feature module (`src/features/<ctx>/`)

### 3.1 Public barrels (only cross-context import surface)

| File | Exports | Naming |
|------|---------|--------|
| `public.ts` | Types, constants, narrow facades, re-exports safe for any consumer | `camelCase` functions; `PascalCase` types |
| `public-queries.ts` | TanStack `queryOptions` factories | `get<Entity><Purpose>QueryOptions` |
| `public-hooks.ts` | React hooks screens may call | `use<Domain><Concern>` — orchestration, not 3-line wrappers |
| `public-rpc.ts` | RPC wrappers used from presentation | `pauseLogStep`, `pauseCreateOrReuse` — match RPC verb family |

Keep each barrel **small** (on the order of tens of exports, not hundreds). Prefer adding a use case + port over exporting infrastructure types.

### 3.2 Application layer (`application/`)

| Artifact | File | Export |
|----------|------|--------|
| Use case | `kebab-case` verb phrase | `camelCase` async function |
| Use case test | `<same-name>.test.ts` beside file | — |
| Port | `ports/<entity>-repository.ts` | `PascalCase` + role (`PauseRepository`) |
| Domain types | `domain/` | `PascalCase` types; no React/Supabase |

**Subfolders** group by ritual beat, session, or trigger — mirror [pause-system.md](../systems/pause-system.md) and [pause-client-architecture.md](../systems/pause-client-architecture.md) (`ritual/reflect/`, `ritual/frame/`, not top-level `companion/` + `reflect/` as peers):

```text
application/use-cases/
  ritual/reflect/run-reflect-generation.ts
  ritual/frame/run-companion-slot-orchestrate.ts
  session/pause-decide-outcome-flow.ts
  trigger/open-manual-pause-from-home.ts
```

Other contexts: group by **system-doc vocabulary** ([pause-client-architecture.md](../systems/pause-client-architecture.md) §9) — e.g. `subscription/checkout/`, `auth/sign-in/`.

**Do not** add `.tsx` under `application/` or `domain/`.

### 3.3 Infrastructure (`infrastructure/`)

| Artifact | Convention | Example |
|----------|--------------|---------|
| Adapter | `<entity>-repository.ts` or `supabase-<entity>-repository.ts` | implements port |
| Query module | `*-query.ts` or `queries/<name>.ts` | `pause-archive-list-query.ts` |
| Edge invoke helpers | live next to use case or under `infrastructure/edge/` | must use `invokeEdge` / `x-cid` |

### 3.4 Presentation (`presentation/`)

| Artifact | Convention | Example |
|----------|--------------|---------|
| Screen conductor hooks | `use-<screen-or-flow>.ts` | `use-pause-session-screen.ts` |
| Flow-specific handlers | `use-<screen>-<flow>-handlers.ts` | `use-pause-session-depth-picker-handlers.ts` |
| Thin re-export to `public-hooks` | export from `public-hooks.ts` | — |

Presentation **may** import React; it wires use cases + queries for screens.

---

## 4. Screens (`src/screens/<route>/`)

### 4.1 Route entry

| Artifact | Convention | Example |
|----------|--------------|---------|
| Screen file | `PascalCase` + `Screen` suffix | `PauseSessionScreen.tsx` |
| Page wrapper (if any) | Same folder or `*Page.tsx` for full-page routes | `CompanionHistoryPage.tsx` |

### 4.2 Route components (`components/`)

Prefer **kebab-case** filenames for new extractions. Legacy `PascalCase.tsx` files may remain until touched.

| Kind | File pattern | Component export |
|------|--------------|------------------|
| **Orchestrator** (composes children) | `PascalCase.tsx` or `pause-<flow>.tsx` | `PauseDecide`, `PauseDepthPicker` |
| **Section / leaf UI** | `<route-prefix>-<parent>-<role>.tsx` | `pause-depth-picker-header.tsx` → `PauseDepthPickerHeader` |
| **Companion subfolder** | `components/companion/` | `companion-card.tsx`, `CompanionSection.tsx` |

**Prefix rules:**

- Use **`pause-`** (or the route’s product prefix) on kebab files so grep and folder listings group related UI.
- **Role suffix** describes UI responsibility: `-header`, `-footer`, `-body`, `-actions`, `-row`, `-panel`, `-ring`, `-chrome`.
- **Parent segment** ties children to orchestrator: `pause-depth-picker-depth-cards.tsx` belongs to `PauseDepthPicker`.

**Export name:** `PascalCase` matching the primary concept; file name can stay kebab (Vite/React norm).

### 4.3 Screen-local lib (`screens/<route>/lib/`)

| Kind | Pattern | Example |
|------|---------|---------|
| Pure presentation rules | `kebab-case.ts` | `pause-depth-picker-styles.ts` |
| Pure helpers with tests | `kebab-case.ts` + `.test.ts` | `resolve-pause-reflect-message-view.ts` |
| Telemetry wrappers | `<area>-telemetry.ts` | `pause-session-telemetry.ts` (when not yet in feature use case) |

**No** Supabase or `invokeEdge` in `screens/*/lib/` — move I/O to `features/<ctx>/`.

---

## 5. Hooks (naming matrix)

| Location | Prefix | Owns |
|----------|--------|------|
| `features/<ctx>/presentation/` | `use` + domain | Orchestration, subscriptions, calling use cases |
| `features/<ctx>/public-hooks.ts` | exported `use*` | Stable API for screens |
| `screens/<route>/` (rare) | `use` + route | **Only** presentation wiring; delegate I/O to feature |
| `src/app/hooks/` | `use` + shell | Nav, install prompt, shell profile |
| `src/lib/` | generic | Cross-cutting utilities — **not** new `pause-*` domain |

Avoid `usePausePause*` duplication; prefer `usePauseSession*` / `usePauseReflect*`.

---

## 6. Tests

| Layer | Location |
|-------|----------|
| Use case / pure module | Beside source: `foo.ts` + `foo.test.ts` |
| Screen lib pure helper | `screens/<route>/lib/*.test.ts` |
| Hook with heavy mocking | `features/<ctx>/presentation/*.test.ts` or `test/` tree per existing pattern |

Test `describe` names: product language (`brief-integrate timer`, `depth picker cards`).

---

## 7. Shared `src/lib/` and shims

| Rule | Detail |
|------|--------|
| **No new** `@/lib/<context>-*` for bounded contexts | Use `features/<ctx>/` or `screens/<route>/lib/` |
| Shims are **temporary** | Re-export from `features/<ctx>/public*`; delete when call sites migrate |
| Allowed in `src/lib/` | `utils`, `invoke-edge`, `posthog`, `cid`, `app-routes`, cross-cutting infra |

Facade pattern for orchestrate/edge errors: `features/pause/application/use-cases/edge/` re-exporting shared lib until pause owns the type.

---

## 8. Server alignment (names only)

| Client | Server |
|--------|--------|
| `logPauseStep` | `pause_log_step` RPC |
| `invokeEdge('companion-orchestrate')` | `supabase/functions/companion-orchestrate/` |
| `generateReflectionAtReflectStep` | `holzen-reflect` |

When adding a use case that maps to RPC/edge, **name the client function** after the product action, not the HTTP path string.

---

## 9. Branches and PRs (architecture migration)

Cloud Agent branches use prefix **`cursor/`** and suffix **`-ca70`** (environment id).

### One long-lived migration branch (preferred)

Use **one** branch for the whole incremental migration (e.g. **`cursor/arch-migrate-src-ca70`**), not a new branch per slice. Land work as **many commits** on that branch; open **one** PR into `feature/refactoring6` and keep the PR description updated with slices merged.

Rename the branch once if the old name was too narrow (GitHub updates open PRs when the head branch is renamed).

| Pattern | When |
|---------|------|
| `cursor/arch-migrate-src-ca70` | Default long-lived client architecture migration |
| `cursor/refactor-<ctx>-<topic>-ca70` | Rare: isolated experiment you will merge quickly |
| `cursor/fix-<area>-<issue>-ca70` | Behavior fix, not structure |

**Avoid** spinning a new branch per session unless you intentionally want parallel review streams.

**Commit discipline:**

- One **vertical slice** per commit when possible (`refactor(pause): …`, `refactor(admin): …`, `docs(architecture): …`).
- PR title stays broad; **commit messages** carry slice detail.

Base branch: **`feature/refactoring6`** (or successor in AGENTS.md) unless the user specifies `main`.

---

## 10. Anti-patterns

| Anti-pattern | Why |
|--------------|-----|
| `features/home` / `features/archive` | Confuses route with bounded context |
| `HomePauseCard.tsx` in `src/components/` | Violates `check:no-root-components` |
| `use-pause-data.ts` fetching in screen folder | Breaks P6 — use `public-queries` |
| `application/FooScreen.tsx` | Screens belong in `screens/` |
| Deep import `@/features/pause/application/...` from screen | Use `public*` only |
| New `src/lib/pause-orchestrate.ts` shim | Extend `features/pause` |

---

## 11. Quick decision tree

```text
New code?
├─ Enforces invariant on server? → migration/RPC/edge (systems doc), not a rename-only PR
├─ Business rule / mutation? → features/<ctx>/application/use-cases/
├─ Supabase read cache? → features/<ctx>/infrastructure + public-queries
├─ React orchestration? → features/<ctx>/presentation → public-hooks
├─ Route-specific JSX? → screens/<route>/components/ (kebab file, Pascal export)
├─ Pure formatting / layout math? → screens/<route>/lib/ or application use case (if reused)
└─ Design primitive? → components/ui/
```

---

## 12. References

- [frontend-module-layout.md](frontend-module-layout.md) §5 — short table (points here for detail)
- [client-src-layout.md](client-src-layout.md) — placement + PR checklist
- [react-screen-orchestration.md](react-screen-orchestration.md) — conductor / memoization
- [AGENTS.md](../../AGENTS.md) — change map row for application structure

When this doc and code disagree, **fix the doc in the same PR** if you introduced the new pattern intentionally.
