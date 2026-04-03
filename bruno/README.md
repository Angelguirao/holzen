# Bruno collections (optional)

This folder is for **git-friendly** HTTP collections used to step through Supabase Edge Functions and related APIs during reviews. See [docs/fundamentals/http-review-playbooks.md](../docs/fundamentals/http-review-playbooks.md) for when to use Bruno vs tests vs the app.

## Setup

1. Install [Bruno](https://www.usebruno.com/).
2. Open this `bruno/` directory as a Bruno collection (or create a collection here and save).
3. Copy `environments/local.bru.example` to `environments/local.bru` and fill in values.
4. **Never commit `local.bru`** — it is gitignored.

## Variables (typical)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | Project anon key (same idea as `VITE_SUPABASE_PUBLISHABLE_KEY`) |
| `ACCESS_TOKEN` | Short-lived user JWT from the signed-in app or Auth API |

## Maintenance

- Prefer **few, named folders** that mirror review phases (e.g. `pause-pipeline`) rather than one giant flat list.
- When a function’s contract changes, update the matching request in the same PR when practical.
