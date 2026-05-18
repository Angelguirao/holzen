# ADR: Modular monolith + hexagonal client (pre-launch)

**Date:** 2026-05-17  
**Status:** accepted  
**Principles:** [holzen-application-architecture.md](../fundamentals/holzen-application-architecture.md)  
**Layout:** [frontend-module-layout.md](../fundamentals/frontend-module-layout.md)

## Context

Holzen is pre-launch with no production users. The active SPA still uses a **transitional** layout: flat `src/hooks/`, flat `src/lib/`, mixed root-level `src/components/`, and `src/legacy/` on main. That layout:

- Does not enforce dependency direction (presentation imports infrastructure freely).
- Makes cross-feature coupling easy (deep imports, types defined in `.tsx` consumed by `lib/`).
- Scales poorly for a policy-heavy product (pause ritual, subscription, AI companions, market context).

We want a **long-term** structure aligned with industry practice (bounded contexts, use cases, ports/adapters) without rewriting Postgres truth or moving to microservices. Authority remains on Supabase per [client-server-architecture-holzen.md](../fundamentals/client-server-architecture-holzen.md).

**Lovable platform constraint (verified 2026-05):** Holzen is developed and published through Lovable’s managed flow. That stack assumes a **single Vite app at the repository root** — `vite.config.ts`, `index.html`, `package.json`, `src/`, dev server on `:8080`, `lovable-tagger`, and **Publish → Update** all target `./`. There is no first-class “project root = subdirectory” setting in this project today. **pnpm workspaces**, `workspace:*`, and `pnpm --filter` are not part of the standard Lovable agent path. **Edge functions and migrations** (`supabase/`) are unaffected; the constraint applies only to the **web client**.

Moving the SPA to `apps/web` **today** would break publish (no root `index.html`), degrade preview/tagging, confuse agent file heuristics, and conflict with CI scripts that assume `src/` and `dist/assets/`.

## Decision

1. **Adopt** [holzen-application-architecture.md](../fundamentals/holzen-application-architecture.md) as the **principles constitution** (accepted pre-launch baseline).

2. **North-star client layout (when not blocked by Lovable publish):** **pnpm monorepo** with:
   - `apps/web` — Vite SPA (routing, providers, composition only).
   - `packages/<bounded-context>` — `domain`, `application` (use cases), `ports`, `public.ts` per context. **Pause** includes companions/reflect/breathing (no separate `@holzen/companion`); nav tabs are **screens** in `apps/web`, not packages (see [holzen-application-architecture.md](../fundamentals/holzen-application-architecture.md) §7–8).
   - `packages/infrastructure` — Supabase / `invokeEdge` adapter implementations.
   - `packages/contracts` — Zod + shared wire types for edge and critical RPC boundaries.
   - `packages/shared-kernel` — minimal cross-cutting types (`Result`, branded IDs, shared errors).

   **Execution path while on Lovable-managed publish:** keep **root Vite**; adopt the **same layer model** under `src/features/<context>/` with `npm run check:feature-imports`. See [frontend-module-layout.md](../fundamentals/frontend-module-layout.md) §0, §10–11.

3. **Hexagonal rules on the client:**
   - Use cases are **functions** (not a DI framework or class-per-action requirement).
   - Application code depends on **ports** only; adapters live in `packages/infrastructure` (or context-specific adapter subfolders where justified).
   - React hooks and screens are **presentation** — thin glue calling use cases.

4. **Server unchanged in role:** Postgres + RLS + RPCs + edge remain authoritative; client use cases **project** and **orchestrate**, they do not replace enforcement.

5. **Legacy IA off main runtime path:** Remove `src/legacy/` from active development on `main` after migration; retain recovery via git tag `full-ia-pre-strip` and branch `archive/full-ia-pre-strip` (per [2026-05-16-pause-first-shipped-scope.md](2026-05-16-pause-first-shipped-scope.md)).

6. **Keep React SPA + Vite** for the web app; do **not** migrate to Next.js/Remix as part of this ADR ([spa-framework-evaluation.md](../backlog/spa-framework-evaluation.md) remains the place to revisit SSR).

7. **Wave 0 (now):** `src/features/<context>/…` with the same layer folders and import rules as packages; screens stay in `src/pages/` and `src/components/` until a deliberate move. Scaffold started at `src/features/pause/`.

8. **Extract `packages/*` only when** at least one is true:
   - A **second client** (e.g. mobile/native) needs shared modules.
   - Holzen **leaves Lovable-managed publish** for the web app and runs its own CI/CD with `apps/web` as the Vite root.
   - Lovable ships **documented subdirectory-root support** and it is verified on a throwaway project.

9. **CI (phased):** `check:feature-imports` on `src/features/**` now; add `check:package-boundaries` once the monorepo exists; keep existing gates (`check:active-surface`, `test:ci`, etc.).

## Consequences

### Positive

- Compile-time and tooling-enforced boundaries between product areas.
- Use cases testable without React or Supabase (fake ports).
- Clear place for new code; better agent/human navigation.
- Second client (e.g. mobile) can depend on `packages/*` without copying hooks.
- Contracts package reduces drift between edge JSON and web adapters.

### Negative / tradeoffs

- **Up-front cost:** estimated 3–8 weeks focused work to migrate all shipped contexts into `src/features/` (see waves); **additional** cost if/when extracting to `packages/*`.
- **Tooling:** `check:feature-imports` immediately; pnpm workspaces + Turborepo deferred until extraction gate (decision §8).
- **Short-term churn:** import path touches as code moves into `src/features/`; **must not** move Vite root to `apps/web` until Lovable publish is confirmed for that layout.
- **Discipline required:** reviewers must reject deep cross-context imports and presentation-layer I/O.

### Follow-ups

| Item | Owner / when |
|------|----------------|
| Flesh out [frontend-module-layout.md](../fundamentals/frontend-module-layout.md) as structure lands | Same PR series as scaffold |
| `src/features/pause/` skeleton + `check:feature-imports` | Done on `feature/refactoring6` |
| Waves 1–4 (`src/features/*`, active app → `public`, lib shims, legacy quarantined) | Done on `feature/refactoring6` — see [frontend-module-layout.md](../fundamentals/frontend-module-layout.md) §11 |
| Scaffold `pnpm-workspace.yaml`, `apps/web`, empty `packages/*` | **Gated** — only after §8 extraction trigger |
| `packages/contracts` for top edges + critical RPCs | Early in pause/companion wave |
| ADR supersession only if we adopt Next.js or split services | Future |

## Alternatives rejected (summary)

See holzen-application-architecture §10. Key rejects: flat `src/lib` forever, features-only without packages, all logic in hooks, microservices, keeping `src/legacy/` on main.

## Supersedes

- Incremental-only folder guidance as the **primary** strategy for greenfield work in [refactoring-strategy.md](../fundamentals/refactoring-strategy.md) (that doc remains valid for small extractions inside the old tree until migration completes).

## Related decisions

- [2026-05-16-pause-first-shipped-scope.md](2026-05-16-pause-first-shipped-scope.md) — what ships in the product; bounds which packages are required at launch.
