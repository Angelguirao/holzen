# Documentation strategy (Holzen)

This note answers two recurring questions: **where should a piece of information live?** and **how do we document HTTP / APIs without drowning in OpenAPI?**

It does **not** replace the canonical owner table in [docs/README.md](../README.md); that table stays the index of truth. Use this file for **intent and tradeoffs**.

## Single-owner rule

When behavior or contracts change, update **one** primary doc (or code comment only when the invariant is obvious and local). Cross-link from secondary places; do not copy long narratives into `AGENTS.md` or the root `README.md`.

## Where to put new information

| You are documenting… | Prefer |
|------------------------|--------|
| Domain rules, pipelines, “how this subsystem works” | `docs/systems/` (one primary doc per concern) |
| Deploy, sync, cron, observability, incident response | `docs/ops/` |
| A decision that is costly to reverse | `docs/decisions/` (short ADR; see [decisions/README.md](../decisions/README.md)) |
| Why something broke and how we hardened it | `docs/postmortems/` |
| Planned work, experiments, “nice to have” | `docs/backlog/` (not normative for current behavior) |
| Running implementation log (decisions, deviations, tradeoffs, open questions during a multi-slice initiative) | `docs/artifacts/<initiative>/implementation-notes.html` — see [implementation-notes-workflow.md](implementation-notes-workflow.md) |
| Commands, env vars, “where to edit” for agents and quick lookup | [AGENTS.md](../../AGENTS.md) |
| Executable HTTP calls (auth, edges, service cron) | [bruno/](../../bruno/) plus [http-review-playbooks.md](http-review-playbooks.md) |
| Visual tokens and Nox migration rules | [DESIGN.md](../../DESIGN.md) and [docs/design/nox/](../design/nox/) |

If two docs disagree, fix the **owner** doc in the same change that updates behavior (or a deliberate follow-up PR if scope is intentionally split).

## HTTP and “API documentation”

Holzen’s callable HTTP surface is mostly **Supabase Auth**, **PostgREST** (behind RLS), and **Edge Functions** under `supabase/functions/`. The SPA usually talks through **supabase-js**, not raw REST.

**Default posture**

- **Human + reviewer truth:** [http-review-playbooks.md](http-review-playbooks.md), the [bruno/](../../bruno/) collection, [bruno/SCOPE.md](../../bruno/SCOPE.md) (what HTTP review can and cannot cover), and [bruno/functions-catalog.md](../../bruno/functions-catalog.md) (edge names aligned with `supabase/config.toml`).
- **Data and authorization truth:** SQL migrations, RLS policies, RPC signatures, and regenerated `src/integrations/supabase/types.ts` when you can run `npm run gen:types` (see [deployment-sync-guide.md](../ops/deployment-sync-guide.md) if types lag).

**OpenAPI / Swagger**

- We do **not** treat a hand-maintained OpenAPI document as the default source of truth: it drifts from Deno handlers unless it is **generated** or enforced by CI.
- Consider OpenAPI (or similar) when you have **external integrators**, **versioned public HTTP contracts**, **generated clients**, or **contract tests** driven from a schema. Prefer **code-derived** specs over parallel YAML.

**Browser journeys**

- Full user flows (pause, journal, settings) belong with **UI automation** and product review, not Bruno alone. See [e2e-browser-automation.md](../backlog/e2e-browser-automation.md) and [bruno/SCOPE.md](../../bruno/SCOPE.md).

## New edge function: documentation and wiring (checklist)

Ship the **same** change as the function (or an immediately adjacent PR) so production never has a mystery endpoint:

- Handler wrapped with `withRequestLogging`; follow [edge-logging-conventions.md](../ops/edge-logging-conventions.md).
- `[functions.<name>]` in `supabase/config.toml`; name listed in `EdgeCoverage.tsx`; run the edge logging and coverage manifest checks described in [AGENTS.md](../../AGENTS.md).
- Client calls use `invokeEdge` (or equivalent) so **`x-cid`** stays consistent (see AGENTS “Cross-surface correlation”).
- Add or extend a **`.bru`** request where manual HTTP review matters; update [functions-catalog.md](../../bruno/functions-catalog.md) when the catalog is the inventory source of truth for your workflow.

## Related reading

- [mental-models-for-contributors.md](mental-models-for-contributors.md) — types as checked documentation; Bruno vs browser.
- [client-server-architecture-holzen.md](client-server-architecture-holzen.md) — truth vs projection at edge and database boundaries.
