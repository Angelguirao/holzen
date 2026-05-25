/**
 * Canonical CI/CD environment variable catalog.
 * Single source of truth for check-cicd-env.mjs and docs/ops/cicd-overview.md.
 */

export const DOCS = "docs/ops/cicd-overview.md";

export const SUPABASE_PROJECT_REFS = {
  staging: "ksplyxxdvandkwzundql",
  production: "geqkxsnyqvhtascjghuu",
};

/** @typedef {'required' | 'recommended'} EnvTier */

/**
 * @typedef {object} EnvSpec
 * @property {string} name
 * @property {string} label
 * @property {string} where
 * @property {string} how
 * @property {EnvTier} tier
 * @property {string} [docs]
 */

/** @type {Record<string, EnvSpec>} */
const githubSpecs = {
  VITE_SUPABASE_URL: {
    name: "VITE_SUPABASE_URL",
    label: "Production Supabase URL (Vite build in CI)",
    where:
      "GitHub → repository → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Create secret `VITE_SUPABASE_URL`. Value: Supabase **prod** → Project Settings → API → Project URL (`https://geqkxsnyqvhtascjghuu.supabase.co`).",
    tier: "required",
    docs: "docs/ops/cicd-overview.md#github-actions-secrets",
  },
  VITE_SUPABASE_PUBLISHABLE_KEY: {
    name: "VITE_SUPABASE_PUBLISHABLE_KEY",
    label: "Production Supabase anon key (Vite build in CI)",
    where:
      "GitHub → repository → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Create secret `VITE_SUPABASE_PUBLISHABLE_KEY`. Value: Supabase **prod** → API → **anon** / publishable key (never service role).",
    tier: "required",
    docs: "docs/ops/cicd-overview.md#github-actions-secrets",
  },
  VITE_SUPABASE_STAGING_URL: {
    name: "VITE_SUPABASE_STAGING_URL",
    label: "Staging Supabase URL (staging preflight build)",
    where:
      "GitHub → repository → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Create secret `VITE_SUPABASE_STAGING_URL`. Value: Supabase **staging** → API → Project URL (`https://ksplyxxdvandkwzundql.supabase.co`).",
    tier: "required",
    docs: "docs/ops/staging-supabase-setup.md",
  },
  VITE_SUPABASE_STAGING_PUBLISHABLE_KEY: {
    name: "VITE_SUPABASE_STAGING_PUBLISHABLE_KEY",
    label: "Staging Supabase anon key (staging preflight build)",
    where:
      "GitHub → repository → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Create secret `VITE_SUPABASE_STAGING_PUBLISHABLE_KEY`. Value: Supabase **staging** → API → **anon** key.",
    tier: "required",
    docs: "docs/ops/staging-supabase-setup.md",
  },
  SUPABASE_ACCESS_TOKEN: {
    name: "SUPABASE_ACCESS_TOKEN",
    label: "Supabase CLI personal access token",
    where:
      "GitHub → repository → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Create secret `SUPABASE_ACCESS_TOKEN`. Value: https://supabase.com/dashboard/account/tokens → Generate token (used for `db push` + `functions deploy`).",
    tier: "required",
    docs: "docs/ops/cicd-overview.md#github-actions-secrets",
  },
  SUPABASE_STAGING_PROJECT_REF: {
    name: "SUPABASE_STAGING_PROJECT_REF",
    label: "Staging Supabase project ref",
    where:
      "GitHub → repository → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Create secret `SUPABASE_STAGING_PROJECT_REF`. Value: `ksplyxxdvandkwzundql` (staging → Settings → General → Reference ID).",
    tier: "required",
    docs: "docs/ops/staging-supabase-setup.md",
  },
  SUPABASE_PROD_PROJECT_REF: {
    name: "SUPABASE_PROD_PROJECT_REF",
    label: "Production Supabase project ref",
    where:
      "GitHub → repository → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Create secret `SUPABASE_PROD_PROJECT_REF`. Value: `geqkxsnyqvhtascjghuu` (prod → Settings → General → Reference ID).",
    tier: "required",
    docs: "docs/ops/production-supabase-setup.md",
  },
  VERCEL_TOKEN: {
    name: "VERCEL_TOKEN",
    label: "Vercel API token (CLI deploy + env audit)",
    where:
      "GitHub → repository → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Create secret `VERCEL_TOKEN`. Value: https://vercel.com/account/tokens → Create token with deploy/read scope.",
    tier: "required",
    docs: "docs/ops/cicd-overview.md#vercel-project-environment",
  },
  VERCEL_ORG_ID: {
    name: "VERCEL_ORG_ID",
    label: "Vercel team / org id",
    where:
      "GitHub → repository → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Create secret `VERCEL_ORG_ID`. Value: run `npx vercel link` → `.vercel/project.json` → `orgId`.",
    tier: "required",
    docs: "docs/ops/cicd-overview.md#vercel-project-environment",
  },
  VERCEL_PROJECT_ID: {
    name: "VERCEL_PROJECT_ID",
    label: "Vercel project id",
    where:
      "GitHub → repository → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Create secret `VERCEL_PROJECT_ID`. Value: `.vercel/project.json` → `projectId` after `vercel link`.",
    tier: "required",
    docs: "docs/ops/cicd-overview.md#vercel-project-environment",
  },
};

/** @type {Record<string, EnvSpec>} */
const vercelCommon = {
  VITE_SUPABASE_URL: {
    name: "VITE_SUPABASE_URL",
    label: "Supabase URL baked into the SPA",
    where: "Vercel → holzen project → Settings → Environment Variables",
    how: "Add for the target environment (Preview or Production). Prod: `https://geqkxsnyqvhtascjghuu.supabase.co`. Preview/staging: `https://ksplyxxdvandkwzundql.supabase.co`. Sync: `npm run vercel:sync-env`.",
    tier: "required",
    docs: "docs/ops/vercel-frontend-setup.md",
  },
  VITE_SUPABASE_PUBLISHABLE_KEY: {
    name: "VITE_SUPABASE_PUBLISHABLE_KEY",
    label: "Supabase anon / publishable key",
    where: "Vercel → holzen project → Settings → Environment Variables",
    how: "Add for Preview or Production scope. Value: matching Supabase project → API → anon key. Never the service role key.",
    tier: "required",
    docs: "docs/ops/vercel-frontend-setup.md",
  },
  VITE_SUPABASE_PROJECT_ID: {
    name: "VITE_SUPABASE_PROJECT_ID",
    label: "Supabase project ref (client metadata)",
    where: "Vercel → holzen project → Settings → Environment Variables",
    how: "Preview: `ksplyxxdvandkwzundql`. Production: `geqkxsnyqvhtascjghuu`.",
    tier: "required",
    docs: "docs/ops/vercel-frontend-setup.md",
  },
  VITE_APP_VERSION: {
    name: "VITE_APP_VERSION",
    label: "Release SHA for Sentry / PostHog correlation",
    where: "Vercel → holzen project → Settings → Environment Variables",
    how: "Set value to `$VERCEL_GIT_COMMIT_SHA` for Preview and Production (Vercel injects Git SHA at build time).",
    tier: "required",
    docs: "docs/ops/observability-setup.md",
  },
  VITE_SITE_ORIGIN: {
    name: "VITE_SITE_ORIGIN",
    label: "Canonical public site origin (SEO / OG)",
    where: "Vercel → holzen project → Settings → Environment Variables",
    how: "Production only: `https://holzen.app`. Preview: optional (omit → falls back in vite.config.ts).",
    tier: "required",
    docs: "docs/ops/vercel-frontend-setup.md",
  },
  VITE_POSTHOG_KEY: {
    name: "VITE_POSTHOG_KEY",
    label: "PostHog project API key",
    where: "Vercel → holzen project → Settings → Environment Variables",
    how: "PostHog → Project Settings → Project API Key. Use staging key for Preview if you split projects.",
    tier: "recommended",
    docs: "docs/ops/observability-setup.md",
  },
  VITE_POSTHOG_HOST: {
    name: "VITE_POSTHOG_HOST",
    label: "PostHog ingest host",
    where: "Vercel → holzen project → Settings → Environment Variables",
    how: "Example text: `https://eu.i.posthog.com` or `https://us.i.posthog.com` (match your PostHog region).",
    tier: "recommended",
    docs: "docs/ops/observability-setup.md",
  },
  VITE_SENTRY_DSN: {
    name: "VITE_SENTRY_DSN",
    label: "Sentry DSN (frontend errors)",
    where: "Vercel → holzen project → Settings → Environment Variables",
    how: "Sentry → Project holzen → Client Keys (DSN). Safe in client bundle; restrict allowed domains in Sentry.",
    tier: "recommended",
    docs: "docs/ops/observability-setup.md",
  },
  SENTRY_AUTH_TOKEN: {
    name: "SENTRY_AUTH_TOKEN",
    label: "Sentry auth token (source maps at build time)",
    where: "Vercel → holzen project → Environment Variables → Production (build-only)",
    how: "Sentry → Settings → Auth Tokens → scope `project:releases`. Pair with `SENTRY_ORG` + `SENTRY_PROJECT`. Plugin no-ops if missing.",
    tier: "recommended",
    docs: "docs/ops/observability-setup.md",
  },
  SENTRY_ORG: {
    name: "SENTRY_ORG",
    label: "Sentry org slug (source maps)",
    where: "Vercel → holzen project → Environment Variables → Production",
    how: "Sentry org slug from organization settings.",
    tier: "recommended",
    docs: "docs/ops/observability-setup.md",
  },
  SENTRY_PROJECT: {
    name: "SENTRY_PROJECT",
    label: "Sentry project slug (source maps)",
    where: "Vercel → holzen project → Environment Variables → Production",
    how: "Usually `holzen`.",
    tier: "recommended",
    docs: "docs/ops/observability-setup.md",
  },
};

/** @type {Record<string, EnvSpec>} */
const supabaseEdgeSpecs = {
  RESEND_API_KEY: {
    name: "RESEND_API_KEY",
    label: "Resend API key (auth + transactional email)",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Resend dashboard → API Keys. Apply locally: copy `.env.staging.secrets.example` → `.env.staging.secrets` → `npm run staging:secrets-set` (or `prod:secrets-set`).",
    tier: "required",
    docs: "docs/ops/resend-environment-setup.md",
  },
  SEND_EMAIL_HOOK_SECRET: {
    name: "SEND_EMAIL_HOOK_SECRET",
    label: "Supabase Auth Send Email Hook secret",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Must match Supabase → Authentication → Hooks → Send Email hook secret. Same value as `auth-email-hook` expects.",
    tier: "required",
    docs: "docs/ops/resend-environment-setup.md",
  },
  RESEND_WEBHOOK_SECRET: {
    name: "RESEND_WEBHOOK_SECRET",
    label: "Resend bounce/complaint webhook signing secret",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Resend → Webhooks → signing secret for `handle-email-suppression` edge URL on this Supabase project.",
    tier: "recommended",
    docs: "docs/ops/resend-environment-setup.md",
  },
  GOOGLE_AI_API_KEY: {
    name: "GOOGLE_AI_API_KEY",
    label: "Google AI / Gemini API key",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Google AI Studio → API key. Secret name must be `GOOGLE_AI_API_KEY` (see `_shared/llm-gateway.ts`).",
    tier: "required",
    docs: "docs/systems/pause/ai-powered-pause-system.md",
  },
  STRIPE_SECRET_KEY: {
    name: "STRIPE_SECRET_KEY",
    label: "Stripe secret key",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Staging: Stripe **test** `sk_test_…`. Production: live `sk_live_…`. See docs/ops/stripe-environment-setup.md.",
    tier: "required",
    docs: "docs/ops/stripe-environment-setup.md",
  },
  STRIPE_WEBHOOK_SECRET: {
    name: "STRIPE_WEBHOOK_SECRET",
    label: "Stripe webhook signing secret",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Stripe → Developers → Webhooks → endpoint `…/functions/v1/stripe-webhook` on **this** Supabase project → Signing secret.",
    tier: "required",
    docs: "docs/ops/stripe-environment-setup.md",
  },
  STRIPE_PRICE_ID_PRO: {
    name: "STRIPE_PRICE_ID_PRO",
    label: "Stripe Pro subscription price id",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Stripe → Products → Pro → recurring `price_…` (test mode on staging, live on prod).",
    tier: "required",
    docs: "docs/ops/stripe-environment-setup.md",
  },
  STRIPE_PRICE_ID_FLEX_PACK_S: {
    name: "STRIPE_PRICE_ID_FLEX_PACK_S",
    label: "Stripe flex pack S price id",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Stripe one-time `price_…` for flex pack S.",
    tier: "recommended",
    docs: "docs/ops/stripe-environment-setup.md",
  },
  STRIPE_PRICE_ID_FLEX_PACK_M: {
    name: "STRIPE_PRICE_ID_FLEX_PACK_M",
    label: "Stripe flex pack M price id",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Stripe one-time `price_…` for flex pack M.",
    tier: "recommended",
    docs: "docs/ops/stripe-environment-setup.md",
  },
  CRON_SECRET: {
    name: "CRON_SECRET",
    label: "Shared secret for pg_cron → edge HTTP",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Random high-entropy string; must match Vault/cron wiring in SQL migrations. See docs/ops/staging-supabase-setup.md.",
    tier: "required",
    docs: "docs/ops/staging-supabase-setup.md",
  },
  SENTRY_DSN_EDGES: {
    name: "SENTRY_DSN_EDGES",
    label: "Sentry DSN for edge functions",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Same Sentry project as frontend is fine. Sentry → Project → Client Keys (DSN).",
    tier: "required",
    docs: "docs/ops/observability-setup.md",
  },
  SENTRY_ENVIRONMENT: {
    name: "SENTRY_ENVIRONMENT",
    label: "Sentry environment tag for edges",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Staging: `staging`. Production: `production`.",
    tier: "required",
    docs: "docs/ops/observability-setup.md",
  },
  LOG_DRAIN_URL: {
    name: "LOG_DRAIN_URL",
    label: "BetterStack log ingest URL",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "BetterStack → Sources → HTTP → ingest URL (e.g. `https://in.logs.betterstack.com`).",
    tier: "required",
    docs: "docs/ops/observability-setup.md",
  },
  LOG_DRAIN_TOKEN: {
    name: "LOG_DRAIN_TOKEN",
    label: "BetterStack source token",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "BetterStack source token (not the account API token).",
    tier: "required",
    docs: "docs/ops/observability-setup.md",
  },
  SLACK_WEBHOOK_URL: {
    name: "SLACK_WEBHOOK_URL",
    label: "Slack #holzen-alerts webhook",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Slack → Apps → Incoming Webhooks → `#holzen-alerts` URL (`https://hooks.slack.com/services/…`).",
    tier: "required",
    docs: "docs/ops/observability-setup.md",
  },
  OPENROUTER_API_KEY: {
    name: "OPENROUTER_API_KEY",
    label: "OpenRouter failover API key",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Optional LLM failover when Gemini returns 429/5xx. OpenRouter dashboard → API key.",
    tier: "recommended",
    docs: "docs/systems/costs/ai-cost-model.md",
  },
  PERPLEXITY_API_KEY: {
    name: "PERPLEXITY_API_KEY",
    label: "Perplexity API key",
    where: "Supabase Dashboard → {project} → Edge Functions → Secrets",
    how: "Used by companion generators / fetch-source-feeds. Perplexity dashboard → API key.",
    tier: "recommended",
    docs: "docs/systems/pause/ai-powered-pause-system.md",
  },
};

/** @type {Record<string, string[]>} */
export const GITHUB_PROFILE_KEYS = {
  ci: ["VITE_SUPABASE_STAGING_URL", "VITE_SUPABASE_STAGING_PUBLISHABLE_KEY"],
  staging: [
    "VITE_SUPABASE_STAGING_URL",
    "VITE_SUPABASE_STAGING_PUBLISHABLE_KEY",
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_STAGING_PROJECT_REF",
    "VERCEL_TOKEN",
    "VERCEL_ORG_ID",
    "VERCEL_PROJECT_ID",
  ],
  production: [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_PROD_PROJECT_REF",
    "VERCEL_TOKEN",
    "VERCEL_ORG_ID",
    "VERCEL_PROJECT_ID",
  ],
};

/** @type {Record<string, string[]>} */
export const VERCEL_TARGET_KEYS = {
  preview: [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PROJECT_ID",
    "VITE_APP_VERSION",
    "VITE_POSTHOG_KEY",
    "VITE_POSTHOG_HOST",
    "VITE_SENTRY_DSN",
  ],
  production: [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PROJECT_ID",
    "VITE_APP_VERSION",
    "VITE_SITE_ORIGIN",
    "VITE_POSTHOG_KEY",
    "VITE_POSTHOG_HOST",
    "VITE_SENTRY_DSN",
    "SENTRY_AUTH_TOKEN",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
  ],
};

/** @type {Record<'staging' | 'production', string[]>} */
export const SUPABASE_EDGE_KEYS = {
  staging: Object.keys(supabaseEdgeSpecs),
  production: Object.keys(supabaseEdgeSpecs),
};

export function getGithubSpec(name) {
  return githubSpecs[name];
}

export function getVercelSpec(name) {
  return vercelCommon[name];
}

export function getSupabaseEdgeSpec(name) {
  return supabaseEdgeSpecs[name];
}

export function formatWhere(where, ctx = {}) {
  return where.replace("{project}", ctx.projectLabel ?? "project");
}

export const PROFILE_HELP = {
  ci: "CI workflow (.github/workflows/ci.yml) — PR checks and production build gate",
  staging:
    "Staging deploy (.github/workflows/staging-deploy.yml) — push to `staging`",
  production:
    "Production deploy (.github/workflows/deploy-production.yml) — push to `main`",
};

export const PLATFORM_LABELS = {
  github: "GitHub Actions secrets",
  "vercel-preview": "Vercel → Preview environment variables",
  "vercel-production": "Vercel → Production environment variables",
  "supabase-edge-staging": "Supabase Edge secrets (holzen-staging)",
  "supabase-edge-production": "Supabase Edge secrets (holzen-prod)",
};

/**
 * Example / placeholder values for missing-variable output (not secrets — patterns only).
 * @type {Record<string, string | Record<string, string>>}
 */
export const SUGGESTED_VALUES = {
  VITE_SUPABASE_URL: {
    ci: "https://geqkxsnyqvhtascjghuu.supabase.co",
    production: "https://geqkxsnyqvhtascjghuu.supabase.co",
    staging: "https://ksplyxxdvandkwzundql.supabase.co",
  },
  VITE_SUPABASE_STAGING_URL: "https://ksplyxxdvandkwzundql.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "<prod-anon-key-from-supabase-dashboard>",
  VITE_SUPABASE_STAGING_PUBLISHABLE_KEY: "<staging-anon-key-from-supabase-dashboard>",
  VITE_SUPABASE_PROJECT_ID: {
    production: "geqkxsnyqvhtascjghuu",
    staging: "ksplyxxdvandkwzundql",
  },
  VITE_APP_VERSION: "$VERCEL_GIT_COMMIT_SHA",
  VITE_SITE_ORIGIN: "https://holzen.app",
  VITE_POSTHOG_HOST: "https://eu.i.posthog.com",
  SUPABASE_STAGING_PROJECT_REF: "ksplyxxdvandkwzundql",
  SUPABASE_PROD_PROJECT_REF: "geqkxsnyqvhtascjghuu",
  SUPABASE_ACCESS_TOKEN: "<token-from-supabase.com/dashboard/account/tokens>",
  VERCEL_TOKEN: "<token-from-vercel.com/account/tokens>",
  VERCEL_ORG_ID: "<orgId-from-.vercel/project.json>",
  VERCEL_PROJECT_ID: "<projectId-from-.vercel/project.json>",
  SENTRY_ENVIRONMENT: { staging: "staging", production: "production" },
  SENTRY_ORG: "holzen",
  SENTRY_PROJECT: "holzen",
  STRIPE_SECRET_KEY: {
    staging: "sk_test_…",
    production: "sk_live_…",
  },
  CRON_SECRET: "<random-high-entropy-string>",
  LOG_DRAIN_URL: "https://in.logs.betterstack.com",
};

/** @param {string} name @param {string} [profile] */
export function getSuggestedValue(name, profile) {
  const entry = SUGGESTED_VALUES[name];
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  if (profile && entry[profile]) return entry[profile];
  if (entry.staging) return entry.staging;
  if (entry.production) return entry.production;
  if (entry.ci) return entry.ci;
  return null;
}
