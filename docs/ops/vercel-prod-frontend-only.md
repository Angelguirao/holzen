# Vercel production — frontend-only deploy (skip GitHub Actions)

Use when **Production deploy** workflow would fail (missing GitHub secrets) or you only changed the SPA and must **not** run `supabase db push` / edge deploy on prod.

**Prerequisite:** Vercel CLI logged in (`npx vercel whoami`), project linked (`.vercel/project.json`).

## One-shot (coming soon or any frontend-only ship)

```powershell
cd c:\path\to\holzen

# 1. Production env (example: coming soon)
npx vercel env add VITE_COMING_SOON production --value true --yes --no-sensitive

# 2. Sync env locally (optional; remote build uses Vercel dashboard vars)
npx vercel pull --yes --environment=production

# 3. Deploy current checkout to Production (builds on Vercel; aliases holzen.app)
npx vercel deploy --prod --yes
```

**Launch (full app again):** remove `VITE_COMING_SOON` in Vercel → **Environment Variables**, then run step 3 again from a branch that includes the coming-soon code (or after merge to `main`).

## What this does *not* do

- Does not apply migrations or deploy edge functions (use [deploy-production.yml](../../.github/workflows/deploy-production.yml) or `npm run prod:deploy` when backend must ship).
- Does not update `main` on GitHub — merge your branch separately so the repo matches what users see.

## CI path (when secrets are ready)

Merge to `main` → **Production deploy** workflow: preflight → backend → `vercel-ci-deploy.mjs --environment=production`. See [cicd-overview.md](./cicd-overview.md).
