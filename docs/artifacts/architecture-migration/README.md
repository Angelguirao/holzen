# Architecture migration — implementation artifacts

**Branch:** Integration target **`feature/refactoring6`**; migration working branch **`cursor/arch-migrate-src-ca70`** (one branch, many slices — see agent rule).

## North star

Align **all active `src/`** — not only `features/` — with [holzen-application-architecture.md](../../fundamentals/holzen-application-architecture.md) and [client-architecture-overview.md](../../fundamentals/client-architecture-overview.md) (app, screens, components, features, lib, integrations).

**Pause** is the **reference implementation** ([pause-client-architecture.md](../../systems/pause-client-architecture.md)). Other contexts have scaffold client-architecture docs before Phase B.

## Scheduling: pause-first at each tier

At every slice tier (shims → god-hooks → inline Supabase → UI placement → bounded context), **finish pause** before the same tier elsewhere — unless a human names another target.

## Phases (one vertical slice = one commit)

| Phase | Focus | Read first |
|-------|--------|------------|
| **0 — Client-architecture docs** ✅ | [client-architecture-overview.md](../../fundamentals/client-architecture-overview.md) + per-context `*-client-architecture.md` scaffolds | Overview index |
| **A — Pause convergence** | `features/pause` + pause/companion/archive screens | [pause-client-architecture.md](../../systems/pause-client-architecture.md) |
| **B — Cross-context template** | `features/subscription`, `auth`, `market`, `user`, `notifications` + their screens | Matching `*-client-architecture.md` |
| **C — Repo-wide presentation** | `app/`, `components/`, `lib/` shims, non-feature inline Supabase | [client-src-layout.md](../../fundamentals/client-src-layout.md) |

## Per-context client architecture (Phase 0)

| Doc | Context |
|-----|---------|
| [pause-client-architecture.md](../../systems/pause-client-architecture.md) | pause (reference) |
| [subscription-client-architecture.md](../../systems/subscription-client-architecture.md) | subscription |
| [auth-client-architecture.md](../../systems/auth-client-architecture.md) | auth |
| [market-client-architecture.md](../../systems/market-client-architecture.md) | market |
| [user-client-architecture.md](../../systems/user-client-architecture.md) | user |
| [notifications-client-architecture.md](../../systems/notifications-client-architecture.md) | notifications |

Index + full-`src` rings: [client-architecture-overview.md](../../fundamentals/client-architecture-overview.md).

## Pause backlog (Phase A — indicative)

- [x] Collections strip → `src/legacy/archive-collections/` (spec §7)
- [x] Move `application/use-cases/reflect/*` → `ritual/reflect/` (incremental)
- [x] Move `application/use-cases/companion/*` → `ritual/frame/` (incremental)
- [x] Peel `public.ts` toward slim target + `public-rpc` (spec §6) — active tree done; legacy stats re-exports remain
- [ ] Route remaining pause mutations through `PauseRepository` port (exists — wire call sites; spec §5, §8)
- [x] Group archive queries under `infrastructure/queries/archive/` (spec §5.2)

## Running log

[implementation-notes.html](./implementation-notes.html) — design decisions, deviations, tradeoffs, open questions.

Workflow: [implementation-notes-workflow.md](../../fundamentals/implementation-notes-workflow.md). Agent rule: [.cursor/rules/architecture-migration.mdc](../../../.cursor/rules/architecture-migration.mdc).

**Doc reconciliation (May 2026):** through eleventh-pass. **Tenth-pass:** `useHolzen` producer paths, Phase B learning path, archive query filenames. **Eleventh-pass (pre–Phase A code):** navigating §12 edge call sites (auth/public-rpc, legacy full-IA rows); refactoring-strategy + modern-react + hook-splitting backlog aligned with shipped `useHolzen` split; codebase-size auth path; observability auth row. **Shipped routes/tabs:** always [active-surface.md](../../ops/active-surface.md) over [information-architecture.md](../../design/information-architecture.md) §1–§3.
