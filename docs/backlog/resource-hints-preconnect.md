# Resource hints: `preconnect` for critical origins

**Status:** shipped (2026-04).

## What shipped

**Injection:** `vite.config.ts` plugin **`holzen-inject-preconnect`** runs **`transformIndexHtml`** and inserts **`link rel="preconnect"`** before **`</head>`** in the built (and dev-served) HTML.

**Origins (≤4 budget):**

| Origin | Why |
|--------|-----|
| **Supabase project origin** | Parsed from the same effective **`VITE_SUPABASE_URL`** as **`define`** (fallback or env) — auth, REST, functions. |
| **`https://fonts.googleapis.com`** | **`@import`** in **`src/index.css`**. |
| **`https://fonts.gstatic.com`** | Font files (`crossorigin` per Google Fonts guidance). |
| **`https://api.coingecko.com`** | BTC market chart fetches on Home / **`fetchBtcData`**. |

**Not preconnected (budget):** `mempool.space`, `api.alternative.me` — add only if profiling shows they dominate cold path.

## Verify

After **`npm run build`**, open **`dist/index.html`** and confirm the four **`preconnect`** lines (Supabase host matches your deploy env).

## Related

- [home-fetch-deduplication.md](home-fetch-deduplication.md) — dedupe before widening hints.
- [pwa-mobile-web-app-meta.md](pwa-mobile-web-app-meta.md) — other head metadata.
