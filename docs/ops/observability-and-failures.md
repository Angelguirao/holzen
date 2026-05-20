# Observability and failure modes

This doc is an **index and checklist**: where to document logs, metrics, retries, and “what breaks if…” for each major pipeline. Prefer linking to **system docs** and **postmortems** instead of duplicating long narratives here.

**Logging conventions** (edge vs browser vs DB): [logging-strategy.md](logging-strategy.md).

## Principles

- **Idempotency:** Note whether workers or webhooks can safely retry the same payload (and where deduplication lives).
- **Secrets:** Edge function secrets live in the Supabase dashboard; see [AGENTS.md](../../AGENTS.md).
- **User-visible failure:** Prefer documenting UX (toasts, fallbacks) in the relevant [systems/](../systems/) doc.

## Checklist (fill as you touch each area)

| Area | Cron / triggers | Logs / debugging | Safe retry? | Owned doc |
|------|-----------------|------------------|-------------|-----------|
| Pause + companions | [cron-setup.md](cron-setup.md) | Edge: **`orchestrate_invoke`**, **`companion_slot_resolved`**, **`cache_serve`**, **`quality_gate_reject`**; client: **`[holzen:companion]`** — see [pause-signal-companion-logging-e2e.md](pause-signal-companion-logging-e2e.md) | Varies by step | [ai-powered-pause-system.md](../systems/pause/ai-powered-pause-system.md) |
| Auth + referrals | — | Client: `@/features/auth/public` (`useAuth`); server: referral edge function | Referral consume once | [auth-and-referral-system.md](../systems/auth/auth-and-referral-system.md) |
| Stripe / billing | Webhooks | Edge function logs; Stripe dashboard | Webhook idempotency per Stripe docs | *(add systems doc or link to function README when introduced)* |

Extend the table when you add pipelines. Keep **one** authoritative narrative per pipeline in `systems/` or the edge function folder.

## Related

- [holzen-postmortem-invariants.md](../postmortems/holzen-postmortem-invariants.md) — invariants and hardening rationale.
- [cron-setup.md](cron-setup.md) — pg_cron and HTTP callouts.
