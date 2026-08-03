# @holzen/site — Astro marketing site (thin)

Static marketing HTML for **legal / about / blog**. Merges into the same `holzen.app` deploy as the React app.

**Waitlist landing** is no longer Astro — it lives in the SPA at `/welcome` (Figma Make port).

## Read the full guide first

**[docs/ops/marketing-site-split.md](../../docs/ops/marketing-site-split.md)**

## Quick reference

| Task | Command |
| --- | --- |
| Dev this site only | `npm run dev:site` → http://localhost:4321/about |
| Build for production | `npm run build:unified` (from repo root — merges SPA + Astro) |

| File | Purpose |
| --- | --- |
| `src/pages/about.astro` | About → `/about` |
| `src/pages/terms.astro`, `privacy.astro` | Legal |
| `src/pages/blog/` | Index + `[slug]` (build-time Supabase) |
| `src/lib/app-url.ts` | Auth links (`:8080` in dev, same-origin in prod) |
| `src/layouts/MarketingLayout.astro` | Shared HTML `<head>` |

**Venture experiment:** [landing-waitlist runbook](../../docs/ops/landing-waitlist-runbook.md) — SPA `/welcome` + weekly observe.

Production Vercel settings live in **repo root** `vercel.json`, not `apps/site/vercel.json`.
