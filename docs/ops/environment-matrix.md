# Environment Matrix

Canonical source for Holzen environment variables, secret storage, naming conventions, and behavior differences across local, staging, preview, and production.

**Related:** [cicd-overview.md](cicd-overview.md) · [deployment-sync-guide.md](deployment-sync-guide.md) · [vercel-frontend-setup.md](vercel-frontend-setup.md) · [staging-supabase-setup.md](staging-supabase-setup.md) · [production-supabase-setup.md](production-supabase-setup.md) · [observability-setup.md](observability-setup.md)

## Rules of thumb

| Rule | Meaning |
|---|---|
| `VITE_*` is public | Vite bakes it into the browser bundle. Safe for publishable keys, DSNs, and hostnames; never for server secrets. |
| Supabase Edge secrets stay server-side | Put Stripe, Resend, AI, cron, and logging secrets in **Supabase Dashboard → Edge Functions → Secrets**. |
| GitHub Actions secrets are for CI only | They power preflight builds and deploy orchestration; they are not runtime config for the SPA or Edge Functions. |
| Same name across environments, different value per environment | Example: both staging and prod use `STRIPE_SECRET_KEY`; staging gets a **test** value and prod gets a **live** value. |
| Local files are convenience layers, not production truth | `.env*` files drive local Vite and local CLI workflows. Hosted behavior comes from Vercel, GitHub, and Supabase. |
| Update the catalog with the docs | When deploy-time envs change, update this doc and `scripts/lib/cicd-env-catalog.mjs` in the same PR. |

## Environment behavior at a glance

| Surface | Frontend target | Backend target | Billing / email behavior | Main gotcha |
|---|---|---|---|---|
| `npm run dev` with `.env` | Local Vite | Whatever `VITE_SUPABASE_*` points to | Follows the target project | If `VITE_SUPABASE_*` is missing and mode is not `localstack`, `vite.config.ts` can fall back to Holzen hosted values. |
| `npm run dev:staging` | Local Vite | `holzen-staging` | Stripe **test** mode, staging email identity, staging observability tags | Best local setup for release QA against hosted infrastructure. |
| `npm run dev:hosted` | Local Vite | Usually `holzen-prod` | Can hit **live** Stripe / prod email if you use prod values | Treat as prod-like; do not test risky flows casually. |
| `npm run dev:local` | Local Vite | Local Docker Supabase | Local-only unless you also run functions locally with `supabase/.env` | No hosted URL/key fallback in `localstack` mode. |
| Feature-branch PR preview | Vercel Preview | `holzen-staging` | Stripe **test** mode, staging-ish behavior | PR previews are not isolated backends; they share staging Supabase. |
| `staging` branch deploy | Vercel Preview branch alias | `holzen-staging` | Stripe **test** mode, staging Resend branding, `SENTRY_ENVIRONMENT=staging` | This is the canonical pre-prod environment. |
| `main` deploy | Vercel Production | `holzen-prod` | Stripe **live** mode, production email defaults, `SENTRY_ENVIRONMENT=production` | `VITE_COMING_SOON` can gate the SPA, but it does not lock down Supabase. |

## Where values live

| Location | What belongs there | Notes |
|---|---|---|
| `.env.example` | Default local browser/build vars and documented examples | Template only; never commit real secrets. |
| `.env.staging.local` | Local Vite against staging Supabase | Preferred local hosted QA file. |
| `.env.hosted.local` | Local Vite against prod Supabase | Prod-like local sessions; use with care. |
| `.env.localstack.local` | Local Vite against local Docker Supabase | No hosted fallback in this mode. |
| `.env.staging.secrets` | Gitignored staging Edge secrets | Applied with `npm run staging:secrets-set`. |
| `.env.prod.secrets` | Gitignored prod Edge secrets | Applied with `npm run prod:secrets-set`. |
| `supabase/.env` | Local `supabase functions serve` secrets | Local only; not read in hosted Edge runs. |
| Vercel project env | Runtime/browser `VITE_*` for deployed SPA, plus build-only Sentry vars | Preview uses staging values; Production uses prod values. |
| GitHub Actions secrets | Deploy tokens, project refs, CI preflight build vars | See [cicd-overview.md](cicd-overview.md). |
| Supabase Edge secrets | Edge runtime secrets per project | Set separately on `holzen-staging` and `holzen-prod`. |
| Password manager | Long-lived source record for vendor keys and refs | Store the raw values here; copy them into Vercel / GitHub / Supabase as needed. |

## Naming conventions

1. **Browser/build vars:** prefix with `VITE_`.
2. **Server-only secrets:** no `VITE_` prefix.
3. **Environment-specific values:** keep the **same name** and swap the value per environment instead of inventing `*_STAGING` / `*_PROD` edge-secret names.
4. **CI-only variants:** use separate names only when CI truly needs both environments at once, for example `VITE_SUPABASE_STAGING_URL` and `VITE_SUPABASE_URL`.
5. **Provider mode lives in the value, not the name:** `STRIPE_SECRET_KEY` is test in staging and live in prod.
6. **Do not put server secrets in browser config:** never place service-role keys, webhook secrets, or API secrets in `.env` files that feed the client bundle.

## Browser and build variables (`VITE_*`)

These are public by design. They belong in local `.env*` files for local Vite, and in **Vercel → Settings → Environment Variables** for hosted builds.

| Variable | Used for | Where set | Where obtained | Environment notes |
|---|---|---|---|---|
| `VITE_SUPABASE_PROJECT_ID` | Client metadata and project-aware helpers | Local `.env*`, Vercel | Supabase project ref | `ksplyxxdvandkwzundql` on staging/preview, `geqkxsnyqvhtascjghuu` on prod. |
| `VITE_SUPABASE_URL` | Browser Supabase base URL | Local `.env*`, Vercel, GitHub preflight | Supabase → Project Settings → API → Project URL | Required for custom projects. In non-`localstack` mode, missing values may fall back in `vite.config.ts`. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser publishable/anon key | Local `.env*`, Vercel, GitHub preflight | Supabase → API → publishable / anon key | Never use the service role key here. |
| `VITE_SITE_ORIGIN` | Canonical site origin for SEO / OG / links | Local `.env*`, Vercel Production | Product domain | Prod should be `https://holzen.app`; Preview can omit it. |
| `VITE_APP_VERSION` | Release correlation across frontend, edges, Sentry, PostHog | Vercel, CI, optional local | `VERCEL_GIT_COMMIT_SHA` or current Git SHA | Must match edge `SENTRY_RELEASE` / `EDGE_RELEASE`. |
| `VITE_ADMIN_USER_IDS` | Optional `/admin` allowlist in the client | Local `.env*`, Vercel | Supabase Auth user UUIDs | Comma-separated UUIDs; server-side admin logic may still apply independently. |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN | Vercel, optional local | Sentry → Project → Client Keys (DSN) | If unset, `src/config/public-env.ts` falls back to committed defaults. |
| `VITE_POSTHOG_KEY` | Frontend PostHog project key | Vercel, optional local | PostHog → Project Settings → Project API Key | If unset, `src/config/public-env.ts` falls back to committed defaults. |
| `VITE_POSTHOG_HOST` | PostHog ingest host | Vercel, optional local | PostHog region (`https://eu.i.posthog.com` or `https://us.i.posthog.com`) | Match your PostHog region. |
| `VITE_COMING_SOON` | Replaces the public SPA with `ComingSoonScreen` | Vercel Production only | Manual flag | Use only when prod should stay closed; it does **not** disable Supabase APIs. |
| `VITE_HOLZEN_DEBUG` | Enables `[holzen:*]` console logs in hosted builds | Local `.env*`, temporary Vercel Preview/Prod | Manual flag (`1`) | Prefer short-lived use for QA/support, not normal production. |
| `VITE_PAUSE_STEP5_BREATH_LABEL_SHIFT` | Optional UI label override for pause step 5 | Local `.env*`, Vercel | Manual flag (`1`) | Keep aligned with the corresponding feature-flag intent if used. |
| `VITE_DISABLE_COMPANION_FALLBACKS` | Client-side mirror of edge fallback suppression | Local `.env*`, Vercel Preview | Manual flag (`1`) | Use with `DISABLE_COMPANION_FALLBACKS` for strict QA; not a normal prod setting. |

### Public fallback behavior

- `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`, and `VITE_POSTHOG_HOST` fall back to committed values in `src/config/public-env.ts` when unset.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` can be injected by `vite.config.ts` when unset and mode is not `localstack`. This is convenient for Holzen development, but dangerous if you assume "missing env" means "fully isolated."

## GitHub Actions and CI variables

These belong in **GitHub → repository → Settings → Secrets and variables → Actions**.

| Variable | Used for | Where obtained | Notes |
|---|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | `supabase db push`, `functions deploy`, env audits | Supabase → account tokens | CI/deploy only. |
| `SUPABASE_STAGING_PROJECT_REF` | Staging deploy target | Supabase staging project ref | Used by staging workflow. |
| `SUPABASE_PROD_PROJECT_REF` | Production deploy target | Supabase prod project ref | Used by prod workflow. |
| `VERCEL_TOKEN` | Vercel CLI deploy and env audit | Vercel account tokens | CI/deploy only. |
| `VERCEL_ORG_ID` | Vercel project lookup | `.vercel/project.json` after `vercel link` | CI/deploy only. |
| `VERCEL_PROJECT_ID` | Vercel project lookup | `.vercel/project.json` after `vercel link` | CI/deploy only. |
| `VITE_SUPABASE_STAGING_URL` | Staging preflight build | Supabase staging API page | CI needs explicit staging values. |
| `VITE_SUPABASE_STAGING_PUBLISHABLE_KEY` | Staging preflight build | Supabase staging API page | CI-only build input. |
| `VITE_SUPABASE_URL` | CI / prod preflight build | Supabase prod API page | CI-only build input here; runtime prod SPA still reads from Vercel env. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | CI / prod preflight build | Supabase prod API page | CI-only build input here. |
| `SENTRY_AUTH_TOKEN` | Source-map upload during build | Sentry auth token | Build-only; never client-side. |
| `SENTRY_ORG` | Sentry source-map upload | Sentry org slug | Build-only. |
| `SENTRY_PROJECT` | Sentry source-map upload | Sentry project slug | Build-only. |

### Platform-provided CI vars

These are injected by the platform and are **not** part of the manual secret inventory:

- `GITHUB_SHA`
- `GITHUB_OUTPUT`
- `VERCEL_GIT_COMMIT_SHA`

## Supabase Edge runtime

### Auto-injected by Supabase

These exist in hosted Edge Functions without you creating matching secrets manually:

| Variable | Meaning | Notes |
|---|---|---|
| `SUPABASE_URL` | Project base URL | Available to Edge Functions; for local serve, supply as needed in `supabase/.env`. |
| `SUPABASE_ANON_KEY` | Project anon/publishable key | Used by some edges when acting as the public client. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key | Server-only; never expose to the client. |

### AI and companion secrets

| Variable | Used for | Where obtained | Environment notes |
|---|---|---|---|
| `GOOGLE_AI_API_KEY` | Primary Gemini access | Google AI Studio | Core active-surface AI secret. |
| `GEMINI_API_KEY` | Alias accepted by `_shared/llm-gateway.ts` and helper scripts | Same Google AI key | Prefer `GOOGLE_AI_API_KEY` as the canonical name; use this only for compatibility. |
| `OPENROUTER_API_KEY` | LLM failover when Gemini is degraded | OpenRouter dashboard | Optional but recommended. |
| `OPENROUTER_HTTP_REFERER` | OpenRouter attribution header | Manual value | Optional. |
| `OPENROUTER_APP_TITLE` | OpenRouter attribution title | Manual value | Optional; defaults to `Holzen`. |
| `PERPLEXITY_API_KEY` | Companion generation and feed ingest | Perplexity dashboard | Optional but recommended for the current AI stack. |
| `COMPANION_PHASE_CATALOG` | Enable catalog phase | Manual flag (`1`/`0`) | Default on. |
| `COMPANION_PHASE_CACHE` | Enable cache phase | Manual flag (`1`/`0`) | Default on. |
| `COMPANION_PHASE_LIVE` | Enable live phase | Manual flag (`1`/`0`) | Default on. |
| `DISABLE_COMPANION_FALLBACKS` | Force strict live-only behavior on Edge | Manual flag (`1`) | Testing/QA only; pairs with `VITE_DISABLE_COMPANION_FALLBACKS`. |
| `COST_MAP_OVERRIDE` | Override default model pricing | Manual JSON string | Ops override; keep synchronized with cost docs if used. |
| `PERPLEXITY_REQUEST_FEE_USD_JSON` | Override Perplexity per-request fee model | Manual JSON string | Ops override; used when negotiated pricing differs. |

### Email, notification, and web push secrets

| Variable | Used for | Where obtained | Environment notes |
|---|---|---|---|
| `RESEND_API_KEY` | Transactional email and auth emails | Resend dashboard | Separate key per Supabase project. |
| `RESEND_WEBHOOK_SECRET` | Bounce/complaint webhook verification | Resend webhook signing secret | Separate webhook per Supabase project. |
| `SEND_EMAIL_HOOK_SECRET` | Supabase Auth Send Email hook verification | Supabase Auth hook secret | Must match the hook config on the same project. |
| `EMAIL_BRAND_NAME` | Email sender branding override | Manual value | Usually set on staging only (`Holzen Staging`). |
| `EMAIL_FROM_DOMAIN` | From domain override | Manual value | Staging often uses `resend.dev`; prod usually leaves defaults. |
| `EMAIL_FROM_LOCAL` | Auth sender local part | Manual value | Staging often uses `onboarding`. |
| `EMAIL_NOTIFY_LOCAL` | Notification sender local part | Manual value | Staging often uses `onboarding`. |
| `EMAIL_SENDER_DOMAIN` | Sender domain override | Manual value | Staging often uses `resend.dev`. |
| `EMAIL_SUBJECT_PREFIX` | Prefix email subjects | Manual value | Staging commonly sets `[STAGING]`. |
| `EMAIL_APP_URL` | Links inside emails | Manual value | Staging often points at localhost or a preview URL. |
| `EMAIL_ROOT_DOMAIN` | Root domain for templates | Manual value | Defaults to `holzen.app`. |
| `EMAIL_FEEDBACK_INBOX` | Feedback/contact inbox | Manual value | Defaults to `hello@holzen.app`. |
| `EMAIL_PREVIEW_SECRET` | Bearer secret for preview email endpoints | Manual value | Optional ops-only secret; not a normal product flow. |
| `VAPID_PUBLIC_KEY` | Web Push public key | Web Push/VAPID keypair | Optional unless push is enabled for the environment. |
| `VAPID_PRIVATE_KEY` | Web Push private key | Web Push/VAPID keypair | Server-only. |

### Billing, cron, and observability secrets

| Variable | Used for | Where obtained | Environment notes |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe API access | Stripe Dashboard → API keys | **Test** on staging, **live** on prod. |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | Stripe webhook endpoint signing secret | One endpoint per Supabase project per mode. |
| `STRIPE_PRICE_ID_PRO` | Pro subscription price | Stripe product/price | Required; test price in staging, live price in prod. |
| `STRIPE_PRICE_ID_FLEX_PACK_S` | Flex pack S price | Stripe product/price | Recommended; mode-specific value. |
| `STRIPE_PRICE_ID_FLEX_PACK_M` | Flex pack M price | Stripe product/price | Recommended; mode-specific value. |
| `CRON_SECRET` | Shared secret for pg_cron and ops endpoints | Random high-entropy value | Must match the value used by cron/Vault wiring. |
| `SENTRY_DSN_EDGES` | Edge error reporting | Sentry DSN | Usually same Sentry project as frontend. |
| `SENTRY_RELEASE` | Edge release tag | Deploy-time Git SHA | Keep equal to `VITE_APP_VERSION` and `EDGE_RELEASE`. |
| `SENTRY_ENVIRONMENT` | Edge environment tag | Manual value | `staging` on staging, `production` on prod. |
| `LOG_DRAIN_URL` | BetterStack ingest endpoint | BetterStack source config | Required for edge log forwarding. |
| `LOG_DRAIN_TOKEN` | BetterStack source token | BetterStack source config | Server-only. |
| `SLACK_WEBHOOK_URL` | Alert delivery to `#holzen-alerts` | Slack Incoming Webhook | Server-only. |

### Feed-ingest and backfill tuning

| Variable | Used for | Notes |
|---|---|---|
| `FETCH_FEEDS_MAX_SOURCES` | Max sources per `fetch-source-feeds` invocation | Launch/backfill tuning; optional. |
| `FETCH_FEEDS_MAX_ARTICLES_PER_SOURCE` | Max inserted articles per source | Launch/backfill tuning; optional. |
| `FETCH_FEEDS_ARTICLE_DELAY_MS` | Delay between article attempts | Lower values speed backfills but can increase provider pressure. |
| `FETCH_FEEDS_LOG_ORIGINAL_INFER` | Toggle original-resolution logging | Optional debug/tuning flag. |

### Legacy or non-active-surface secrets

| Variable | Status | Notes |
|---|---|---|
| `LOVABLE_API_KEY` | Retired for owned-project active surface | Do **not** set on owned staging/prod. Historical docs may still mention it for pre-exit paths. |
| `FIRECRAWL_API_KEY` | Tier B / legacy feed-ingest support | Only relevant when touching the legacy `fetch-source-feeds` path. |

## How to obtain values

| Kind of value | Where to get it |
|---|---|
| Supabase URL / publishable key / project ref | Supabase Dashboard → Project Settings / API / General |
| Supabase CLI deploy token | Supabase Dashboard → Account → Access Tokens |
| Vercel deploy token / ids | Vercel account tokens, plus `.vercel/project.json` after `vercel link` |
| Sentry DSN / source-map token | Sentry project Client Keys and Auth Tokens |
| PostHog key / host | PostHog project settings and region |
| Stripe secret keys / webhook secrets / price ids | Stripe Dashboard → API keys / Webhooks / Products |
| Resend API key / webhook secret | Resend Dashboard → API Keys / Webhooks |
| Slack webhook | Slack app → Incoming Webhooks |
| BetterStack ingest URL / token | BetterStack Logs → Sources |
| Gemini / OpenRouter / Perplexity keys | Provider dashboards |

## Common testing and behavior differences

1. **PR previews and `staging` both hit staging Supabase.** They are not throwaway backend environments, so test data mutations are real staging mutations.
2. **Stripe mode follows the Supabase project, not the frontend host.** Preview/staging should use test keys and test price IDs; production should use live keys and live price IDs.
3. **Resend has no test/live mode split.** Separation comes from distinct API keys, webhook endpoints, and optional staging email identity overrides.
4. **`VITE_COMING_SOON` gates only the SPA shell.** It does not disable Supabase auth, Edge Functions, or the anon key.
5. **`npm run dev:hosted` can be production-dangerous.** If `.env.hosted.local` points at prod, local checkout or email flows can use live vendors.
6. **`npm run dev:local` is the safest isolated mode.** It avoids hosted Supabase URL/key fallback, but vendor-backed Edge behavior still requires local function secrets if you run functions locally.
7. **Edge secret updates do not require a frontend rebuild.** They take effect on subsequent function invocations. `VITE_*` changes do require a rebuild/redeploy.
8. **Frontend observability defaults are asymmetric.** Sentry/PostHog can still initialize from committed fallback values in `src/config/public-env.ts` even if Vercel env vars are unset.

## When you add or change an env variable

Update the relevant pieces in the same PR:

1. This file: `docs/ops/environment-matrix.md`
2. Deploy-time catalog: `scripts/lib/cicd-env-catalog.mjs`
3. The relevant example file:
   - `.env.example`
   - `.env.staging.example`
   - `.env.hosted.example`
   - `.env.localstack.example`
   - `.env.staging.secrets.example`
   - `.env.prod.secrets.example`
4. The owning subsystem doc when behavior is domain-specific:
   - `docs/ops/observability-setup.md`
   - `docs/ops/stripe-environment-setup.md`
   - `docs/ops/resend-environment-setup.md`
   - `docs/systems/pause/ai-powered-pause-system.md`

If the new variable affects CI, Preview, or Production readiness, also update [cicd-overview.md](cicd-overview.md).
