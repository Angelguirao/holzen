# Landing waitlist — venture experiment runbook

**Experiment:** `landing-waitlist` · **Hypothesis:** `stranger-pull` · **Folio:** [holzen-observe](https://github.com/Angelguirao/brain/blob/master/wiki/self/inquiry/projects/holzen-observe.md)

**Metric:** Waitlist signups / unique `/welcome` visitors (7d rolling)

**Default git flow:** `feature/*` → **`staging`** (smoke) → **`main`** (prod ship). See [branch-model.md](branch-model.md).

---

## What is wired

| Piece | Location |
|-------|----------|
| Landing page | `apps/site/src/pages/welcome.astro` |
| Waitlist form | `apps/site/src/components/WaitlistForm.astro` |
| Edge: signup | `supabase/functions/waitlist-signup` |
| Edge: page views | `supabase/functions/landing-ping` |
| DB | `waitlist_signups`, `landing_daily_views` — migration `20260705140000_waitlist_and_landing_views.sql` |
| Smoke script | `node scripts/smoke-marketing-waitlist.mjs` |
| PersonalOS metrics | `/api/owner/metrics/holzen` · experiment id `landing-waitlist` on inquiry desk |

---

## Ship / change workflow

### 1. Build (feature branch)

```bash
git checkout staging && git pull
git checkout -b feature/landing-waitlist-<slice>
# edit apps/site, edges, or migrations
npm run test:ci   # or targeted checks
git push -u origin HEAD
# open PR → staging
```

### 2. Staging smoke (after merge to `staging`)

CI runs [staging-deploy.yml](../../.github/workflows/staging-deploy.yml): migrations + edges → Vercel preview for `staging`.

```bash
# Edge functions (staging Supabase)
export VITE_SUPABASE_URL=https://ksplyxxdvandkwzundql.supabase.co
export VITE_SUPABASE_PUBLISHABLE_KEY=<staging anon key>
node scripts/smoke-marketing-waitlist.mjs

# Browser: open staging preview URL /welcome
# - form renders (not "temporarily unavailable")
# - submit test email → success message
# - duplicate submit → still ok (idempotent)
```

Checklist:

- [ ] `landing-ping` returns 200
- [ ] `waitlist-signup` returns 200
- [ ] `/welcome` shows waitlist form (hero + footer)
- [ ] No console errors on submit

### 3. Production (after staging looks good)

```bash
git checkout main && git pull
git merge staging
git push origin main
```

CI runs [deploy-production.yml](../../.github/workflows/deploy-production.yml).

```bash
export VITE_SUPABASE_URL=https://geqkxsnyqvhtascjghuu.supabase.co
export VITE_SUPABASE_PUBLISHABLE_KEY=<prod anon key>
node scripts/smoke-marketing-waitlist.mjs
```

Confirm [holzen.app/welcome](https://holzen.app/welcome) — same checks as staging.

---

## Observe rhythm (4 weeks)

**Phase:** `observe` — measure stranger-pull; do not redesign unless stress test fires.

Weekly (PersonalOS):

1. Open inquiry desk → **holzen-observe** → **landing-waitlist** experiment
2. Live metrics panel pulls signups + `/welcome` views (7d)
3. **Log signal** with conversion rate — use suggested text from panel
4. Commit folio update on `brain` **`master`** when nudged

**Stress test (`no-waitlist-traction`):** 500 unique `/welcome` views and **zero** waitlist emails in 4 weeks → kill `stranger-pull` bet.

**PersonalOS env (production):**

| Variable | Value |
|----------|--------|
| `HOLZEN_SUPABASE_URL` | `https://geqkxsnyqvhtascjghuu.supabase.co` (prod — where waitlist data lives) |
| `HOLZEN_SUPABASE_SERVICE_ROLE_KEY` | holzen-prod service role |

---

## Troubleshooting

| Symptom | Likely fix |
|---------|------------|
| "Waitlist signup is temporarily unavailable" on `/welcome` | Astro build missing `PUBLIC_SUPABASE_URL` + publishable key on Vercel |
| Signup 401/500 | Edge not deployed; run staging/production deploy workflow |
| Metrics panel "not configured" on PersonalOS | Set `HOLZEN_SUPABASE_*` on Vercel personalos production |
| Views always 0 | `landing-ping` blocked or adblock; check edge logs |
| Staging form works, prod doesn't | Confirm prod migration applied + edges deployed on holzen-prod |

Related: [marketing-site-split.md](marketing-site-split.md) · [deployment-sync-guide.md](deployment-sync-guide.md)
