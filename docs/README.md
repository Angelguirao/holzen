# Holzen Docs Index

This folder contains human-readable notes that complement the source code and in-repo reference docs.

## Fundamentals

- `fundamentals/navigating-the-codebase.md` — repo tour: boot flow, routing, auth, hooks, Supabase basics.
- `fundamentals/codebase-size-and-review-practices.md` — codebase size snapshot and review best-practices.

## Ops

- `ops/cron-setup.md` — scheduled jobs: pg_cron + `net.http_post` callouts for pause-adjacent workers.

## Systems (Pause)

- `systems/pause/ai-powered-pause-system.md` — end-to-end architecture of manual vs automatic pause and how companions/interventions are produced.
- `systems/pause/pause-session-cost-estimates.md` — order-of-magnitude API spend estimates for a live pause session.
- `systems/pause/signal-perplexity-prompts.md` — what the Signal pipeline sends to Perplexity + how it’s structured by the secondary model.

