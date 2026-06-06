# Cron worker auth consistency (done)

## Summary

Scheduled workers **`refresh-market-prices`**, **`fetch-source-feeds`**, and **`pregenerate-companions`** use the same **`verifyServiceAuth(req)`** as other cron-style functions: **`Authorization: Bearer`** must match **`SUPABASE_SERVICE_ROLE_KEY`** or **`CRON_SECRET`** on the Edge runtime.

We intentionally **do not** treat **`x-supabase-cron: true`** as auth on these URLs — it is spoofable on public Edge endpoints. Use Vault + Bearer (see **`docs/ops/cron-setup.md`**) or Bruno **`SERVICE_CRON_BEARER`**.

## Related

- `supabase/functions/_shared/auth.ts`
- `docs/ops/cron-setup.md`, `bruno/service-cron/README.md`
