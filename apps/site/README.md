# @holzen/site — Astro marketing site

Static marketing HTML. **Not a separate website** — it merges into the same `holzen.app` deploy as the React app.

## Read the full guide first

**[docs/ops/marketing-site-split.md](../../docs/ops/marketing-site-split.md)** explains:

- Why there are two codebases but one URL
- What happens when a user opens `/welcome` vs `/auth`
- How `npm run build:unified` and `spa.html` work
- Local dev (this folder on :4321 vs SPA on :8080)

## Quick reference

| Task | Command |
| --- | --- |
| Dev this site only | `npm run dev:site` → http://localhost:4321/welcome |
| Build for production | `npm run build:unified` (from repo root — merges SPA + Astro) |

| File | Purpose |
| --- | --- |
| `src/pages/welcome.astro` | Landing page → `/welcome` |
| `src/lib/app-url.ts` | Same-origin links to `/auth` |
| `src/layouts/MarketingLayout.astro` | Shared HTML `<head>` |

Production Vercel settings live in **repo root** `vercel.json`, not `apps/site/vercel.json`.
