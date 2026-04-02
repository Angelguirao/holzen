# Holzen Docs Index

This folder contains human-readable notes that complement the source code and in-repo reference docs.

## Architecture (C4)

- `architecture/README.md` — index for **C4** context + container views  
- `architecture/c4-holzen.md` — Mermaid diagrams (System Context, Container)  
- `architecture/workspace.dsl` — **Structurizr** workspace (same model; use Lite or CLI to render)

## Fundamentals

- `fundamentals/navigating-the-codebase.md` - repo tour: boot flow, routing, auth, hooks, Supabase basics.
- `fundamentals/codebase-size-and-review-practices.md` - codebase size snapshot and review best-practices.

## Ops

- `ops/cron-setup.md` - scheduled jobs: pg_cron + `net.http_post` callouts for pause-adjacent workers.

## Backlog

- `backlog/backlog.md` - pending improvements and fixes (category drill-down)

## Reviews

- `reviews/phase-1-frontend-routing-auth.md` - onboarding review for frontend auth + routing contracts
- `reviews/phase-2-manual-pause-pipeline.md` - manual pause producer/client processing review
- `reviews/phase-3-server-cron-triggers.md` - server cron trigger review (check-volatility)
- `reviews/phase-4-cron-workers-caching.md` - cron workers + caching lifecycle review
- `reviews/phase-5-quality-gates-rate-limit-cache.md` - quality gates, rate limiting, and cache logic review
- `reviews/phase-6-rls-authz-security-model.md` - RLS/authz security model review
- `reviews/phase-7-edge-function-auth-correctness.md` - edge function auth correctness review
- `reviews/phase-8-rls-hardening-service-role-policies.md` - service-role hardening policies review

## Systems

- `systems/auth/auth-and-referral-system.md` - Auth system (Supabase) + optional referral side-effect
- `systems/routing/route-gating-system.md` - protected vs public-only vs ungated routes; `ProtectedRoute` / `PublicOnlyRoute` contracts
- `systems/pause/ai-powered-pause-system.md` - end-to-end architecture of manual vs automatic pause and how companions/interventions are produced.
- `systems/pause/pause-session-cost-estimates.md` - order-of-magnitude API spend estimates for a live pause session.
- `systems/pause/companions/` - deep dives per companion type (see [companions/signal.md](systems/pause/companions/signal.md) for Signal).

## Postmortems

- `postmortems/holzen-postmortem-invariants.md` - core invariants and the "why" behind key codebase hardening

