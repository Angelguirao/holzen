# @holzen/site — Astro marketing site

Static marketing HTML merged into the product `dist/` on deploy. **One domain:** `holzen.app`.

**Owner doc:** [docs/ops/marketing-site-split.md](../../docs/ops/marketing-site-split.md)

## Production

Marketing is not a separate Vercel project. Root `vercel.json` runs:

```bash
npm run build:unified
```

Astro output (e.g. `/welcome`) is copied into `dist/` beside `spa.html` (the React app shell).

## Local dev

```bash
npm run dev:site   # :4321 — Astro only
npm run dev        # :8080 — SPA only
```

## Pages

| Astro path | Replaces (eventually) |
| --- | --- |
| `/welcome` | `LandingScreen` |
