# Cron worker auth consistency (done)

## Summary

Scheduled workers **`refresh-btc-prices`**, **`fetch-source-feeds`**, and **`pregenerate-companions`** use **`verifyServiceAuth(req, { allowSupabaseCronHeader: true })`** — same Bearer rules as everyone else (service role JWT or **`CRON_SECRET`**), plus optional **`x-supabase-cron: true`** for legacy cron invoke paths.

Other cron-style functions use **`verifyServiceAuth(req)`** without the header flag so **`x-supabase-cron`** alone cannot unlock high-impact jobs (e.g. **`check-volatility`**).

## Related

- `supabase/functions/_shared/auth.ts` — `VerifyServiceAuthOptions.allowSupabaseCronHeader`
- `docs/ops/cron-setup.md`, `bruno/service-cron/README.md`
