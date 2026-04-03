# Resource hints: `preconnect` for critical origins

**Status:** backlog — **after** redundant fetches are reduced.

## Goal

Add **`link rel="preconnect"`** (and optionally **`dns-prefetch`**) for origins that **consistently** back first-party UX, so TLS/DNS work starts earlier on cold loads.

## Rationale

The **Network dependency tree** insight reported **no preconnects** and a long critical path. **Preconnect** helps only when those origins are **actually** used and not over-fetched; otherwise it competes for the browser’s **~4 preconnect** budget for little gain.

**Do first:** [home-fetch-deduplication.md](home-fetch-deduplication.md) (fewer duplicate calls to CoinGecko, mempool, Supabase).

## Direction

1. Pick **≤4** origins after dedup (candidates: **`*.supabase.co`**, **`fonts.googleapis.com`** / **`fonts.gstatic.com`**, **`api.coingecko.com`**, **`mempool.space`** — not all at once).
2. Add hints in **`index.html`** or a single head helper used in production builds.
3. Re-check Network insight and **LCP** on a **production-like** build when possible (dev server behavior differs).

## Related

- [pwa-mobile-web-app-meta.md](pwa-mobile-web-app-meta.md) — other head metadata.
- [browser-360-mcp-playbook.md](../fundamentals/browser-360-mcp-playbook.md) — how to measure.
