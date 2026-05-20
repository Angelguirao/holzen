# Architecture migration — implementation artifacts

**Branch:** `cursor/arch-migrate-src-ca70` → `feature/refactoring6`

## North star

Align **all active `src/`** with [holzen-application-architecture.md](../../fundamentals/holzen-application-architecture.md) and the shared module skeleton in [pause-client-architecture.md §9](../../systems/pause-client-architecture.md#9-applying-this-template-to-other-contexts).

**Pause** is the **reference implementation** (canonical tree: [pause-client-architecture.md](../../systems/pause-client-architecture.md)). Other contexts reuse the **shape**, not pause ritual folder names.

## Scheduling: pause-first at each tier

At every slice tier (shims → god-hooks → inline Supabase → UI placement → bounded context), **finish pause** before the same tier elsewhere — unless a human names another target.

## Phases (one vertical slice = one commit)

| Phase | Focus | Owner docs |
|-------|--------|------------|
| **A — Pause convergence** | `ritual/reflect/` + `ritual/frame/` moves, `public*` peel, ports, archive reads, session conductors | [pause-client-architecture.md](../../systems/pause-client-architecture.md) |
| **B — Cross-context template** | subscription, auth, market, user, notifications — same layers, context vocabulary | AGENTS change map + `src/features/<ctx>/README.md`; add `*-client-architecture.md` when a context needs its own narrative |
| **C — Repo-wide hygiene** | `src/lib/*` shims, misplaced UI, non-pause inline Supabase | [client-src-layout.md](../../fundamentals/client-src-layout.md) |

## Pause backlog (Phase A — indicative)

- [x] Collections strip → `src/legacy/archive-collections/` (spec §7)
- [ ] Move `application/use-cases/reflect/*` → `ritual/reflect/` (incremental)
- [ ] Move `application/use-cases/companion/*` → `ritual/frame/` (incremental)
- [ ] Peel `public.ts` toward slim target + `public-rpc` (spec §6)
- [ ] Introduce / wire `PauseRepository` port (spec §5, §8)
- [ ] Group archive queries under `infrastructure/queries/archive/` (spec §5.2)

## Running log

[implementation-notes.html](./implementation-notes.html) — design decisions, deviations, tradeoffs, open questions.

Workflow: [implementation-notes-workflow.md](../../fundamentals/implementation-notes-workflow.md). Agent rule: [.cursor/rules/architecture-migration.mdc](../../../.cursor/rules/architecture-migration.mdc).
