# Cron worker auth consistency (mostly done)

## Context (from Phase 4)

Scheduled workers (`refresh-btc-prices`, `fetch-source-feeds`, `pregenerate-companions`) are invoked by pg_cron or similar with specific headers. As of the `fetch-source-feeds` alignment, all three accept **`Authorization`** with service role or **`CRON_SECRET`**, and the first two also accept **`x-supabase-cron: true`**.

## Remaining gaps

- Documented cron SQL (`cron-setup.md`) should stay aligned with these auth paths after env changes.
- Optional hardening: require `cronSecret.length > 0 && token === cronSecret` (as in `pregenerate-companions`) so an empty `CRON_SECRET` does not weaken checks when combined with empty `Authorization`.

## Related code pointers

- `supabase/functions/refresh-btc-prices/index.ts`
- `supabase/functions/fetch-source-feeds/index.ts`
- `supabase/functions/pregenerate-companions/index.ts`
- `docs/ops/cron-setup.md`

## Acceptance criteria / how to verify

1. Every scheduled job in `cron-setup.md` matches an accepted auth path in the target function.
2. No worker relies on undocumented header combinations only known from reading code.
