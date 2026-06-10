# @holzen/site — Astro marketing site

Static marketing surface for `holzen.app`. Product auth and the signed-in app live on the SPA (`PUBLIC_APP_URL`, default `https://app.holzen.app`).

**Owner doc:** [docs/ops/marketing-site-split.md](../../docs/ops/marketing-site-split.md)

## Commands (from repo root)

```bash
npm run dev:site
npm run build:site
```

## Vercel

Create a **separate** Vercel project rooted at `apps/site` with:

- Domain: `holzen.app` (+ `www`)
- Env: `PUBLIC_APP_URL=https://app.holzen.app`

The product SPA project keeps `app.holzen.app` (repo root `vercel.json`).
