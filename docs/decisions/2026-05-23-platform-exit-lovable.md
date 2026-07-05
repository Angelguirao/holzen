# ADR: Platform exit — leave Lovable Cloud

**Status:** Accepted (2026-05-23)  
**Context:** Holzen outgrew Lovable’s managed sync (migrations hit prod on merge, no visible CI, secrets and hosting tied to the platform).

## Decision

Move to **owned infrastructure**:

| Layer | Target |
|-------|--------|
| Code | GitHub (Cursor/local dev) |
| Database + Edge | Owned Supabase projects (staging + prod) via CLI/CI |
| Frontend | **Vercel** (GitHub integration) |
| AI | Gemini via OpenRouter (`OPENROUTER_API_KEY`) via `_shared/llm-gateway.ts` |
| Email | Resend (`RESEND_API_KEY`) with Supabase Auth custom SMTP |
| Auth OAuth | Supabase Auth native Google provider |

Lovable may remain as an optional editor until fully dropped; **Lovable must not auto-apply migrations or deploy edges to production** after cutover.

## Consequences

**Positive**

- Staging dry-runs before prod migrations
- Visible GitHub Actions CI (`test:ci`, build)
- Full Supabase dashboard, PITR, secret rotation without Lovable support
- Direct vendor relationships (Google, Resend, Stripe)

**Negative / cost**

- Team owns deploy runbooks, billing, and incident response
- One-time cutover: DNS, Auth redirect URLs, Stripe webhooks, secret export
- `check:version-sync` and CI need `VITE_SUPABASE_*` pointed at the correct project per environment

## Implementation

- Runbook: [platform-exit-runbook.md](../ops/platform-exit-runbook.md)
- Staging setup: [staging-supabase-setup.md](../ops/staging-supabase-setup.md)
- Production setup: [production-supabase-setup.md](../ops/production-supabase-setup.md)
- Frontend (Vercel): [vercel-frontend-setup.md](../ops/vercel-frontend-setup.md)
- Risk model: [lovable-staging-and-platform-exit.md](../ops/lovable-staging-and-platform-exit.md)

## Alternatives considered

1. **Hybrid (staging only, keep Lovable prod sync)** — rejected as end state; acceptable as Phase 1 only.
2. **Stay on Lovable** — rejected; invisible prod migrations and no owned staging are unacceptable at current scale.
