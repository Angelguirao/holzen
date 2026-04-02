# Cron worker auth consistency (Pending)

## Context (from Phase 4)

Scheduled workers (`refresh-btc-prices`, `fetch-source-feeds`, `pregenerate-companions`) are invoked by pg_cron or similar with specific headers. `refresh-btc-prices` accepts `Authorization` (service role or `CRON_SECRET`), **`x-supabase-cron: true`**, and related patterns; other workers may not expose identical gates.

## Current problem

If **ops** (`docs/ops/cron-setup.md`) and **code** disagree on which headers unlock a function, cron jobs can **401** or teams may rely on inconsistent secrets across workers.

## Implications if we leave it as-is

- Deploy or env changes break one worker but not others.
- Harder onboarding: "which header does which function need?"

## Proposed improvement

1. **Audit** all three workers (and Phase 3 `check-volatility` if needed) for allowed auth paths.
2. **Align** with a single convention documented in `docs/ops/cron-setup.md` (e.g. always send `Authorization: Bearer <CRON_SECRET>` or always service role + document `x-supabase-cron` where used).
3. **Test** `functions serve` / deployed invoke with the same headers cron uses.

## Related code pointers

- `supabase/functions/refresh-btc-prices/index.ts`
- `supabase/functions/fetch-source-feeds/index.ts`
- `supabase/functions/pregenerate-companions/index.ts`
- `docs/ops/cron-setup.md`

## Acceptance criteria / how to verify

1. Every scheduled job in `cron-setup.md` matches an accepted auth path in the target function.
2. No worker relies on undocumented header combinations only known from reading code.
