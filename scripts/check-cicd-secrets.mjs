#!/usr/bin/env node
/**
 * Fail CI/CD when required GitHub Actions secrets are missing.
 * Prints each missing secret with where to set it and how to obtain the value.
 *
 * Usage:
 *   node scripts/check-cicd-secrets.mjs --profile=ci
 *   node scripts/check-cicd-secrets.mjs --profile=staging
 *   node scripts/check-cicd-secrets.mjs --profile=production
 *
 * Profiles:
 *   ci          — pullOptions / push CI build (ci.yml)
 *   staging     — full staging deploy (staging-backend.yml)
 *   production  — full production deploy (deploy-production.yml)
 */
const DOCS = "docs/ops/cicd-overview.md";

/** @type {Record<string, { label: string; where: string; how: string; profiles: string[] }>} */
const SECRETS = {
  VITE_SUPABASE_URL: {
    label: "Production Supabase URL (Vite build)",
    where:
      "GitHub → repo → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      'Name exactly `VITE_SUPABASE_URL`. Value: Supabase prod dashboard → Project Settings → API → Project URL (e.g. `https://geqkxsnyqvhtascjghuu.supabase.co`).',
    profiles: ["ci", "production"],
  },
  VITE_SUPABASE_PUBLISHABLE_KEY: {
    label: "Production Supabase anon key (Vite build)",
    where:
      "GitHub → repo → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Name exactly `VITE_SUPABASE_PUBLISHABLE_KEY`. Value: Supabase prod → Project Settings → API → **anon** / publishable key (never the service role key).",
    profiles: ["ci", "production"],
  },
  VITE_SUPABASE_STAGING_URL: {
    label: "Staging Supabase URL (Vite build)",
    where:
      "GitHub → repo → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      'Name exactly `VITE_SUPABASE_STAGING_URL`. Value: Supabase **staging** project → API → Project URL (e.g. `https://ksplyxxdvandkwzundql.supabase.co`).',
    profiles: ["staging"],
  },
  VITE_SUPABASE_STAGING_PUBLISHABLE_KEY: {
    label: "Staging Supabase anon key (Vite build)",
    where:
      "GitHub → repo → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Name exactly `VITE_SUPABASE_STAGING_PUBLISHABLE_KEY`. Value: Supabase **staging** → API → **anon** / publishable key.",
    profiles: ["staging"],
  },
  SUPABASE_ACCESS_TOKEN: {
    label: "Supabase CLI access token",
    where:
      "GitHub → repo → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Name exactly `SUPABASE_ACCESS_TOKEN`. Value: https://supabase.com/dashboard/account/tokens → Generate new token (used by `supabase link`, `db push`, `functions deploy` in Actions).",
    profiles: ["staging", "production"],
  },
  SUPABASE_STAGING_PROJECT_REF: {
    label: "Staging Supabase project ref",
    where:
      "GitHub → repo → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Name exactly `SUPABASE_STAGING_PROJECT_REF`. Value: staging project ref id (Settings → General → Reference ID), e.g. `ksplyxxdvandkwzundql`. See docs/ops/staging-supabase-setup.md.",
    profiles: ["staging"],
  },
  SUPABASE_PROD_PROJECT_REF: {
    label: "Production Supabase project ref",
    where:
      "GitHub → repo → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Name exactly `SUPABASE_PROD_PROJECT_REF`. Value: prod project ref id, e.g. `geqkxsnyqvhtascjghuu`. See docs/ops/production-supabase-setup.md.",
    profiles: ["production"],
  },
  VERCEL_TOKEN: {
    label: "Vercel deploy token",
    where:
      "GitHub → repo → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Name exactly `VERCEL_TOKEN`. Value: https://vercel.com/account/tokens → Create Token (Full Account or scoped to deploy). Used by scripts/vercel-ci-deploy.mjs in Actions.",
    profiles: ["staging", "production"],
  },
  VERCEL_ORG_ID: {
    label: "Vercel team / org id",
    where:
      "GitHub → repo → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      'Name exactly `VERCEL_ORG_ID`. Value: run `npx vercel link` locally → read `.vercel/project.json` → field `orgId` (or Vercel team Settings → General).',
    profiles: ["staging", "production"],
  },
  VERCEL_PROJECT_ID: {
    label: "Vercel project id",
    where:
      "GitHub → repo → Settings → Secrets and variables → Actions → Repository secrets",
    how:
      "Name exactly `VERCEL_PROJECT_ID`. Value: `.vercel/project.json` → field `projectId` after `vercel link`, or Vercel project Settings → General.",
    profiles: ["staging", "production"],
  },
};

/** @type {Record<string, string[]>} */
const PROFILES = {
  ci: ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"],
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

const PROFILE_HELP = {
  ci: "CI workflow (.github/workflows/ci.yml) — PR checks and production build gate",
  staging:
    "Staging deploy (.github/workflows/staging-backend.yml) — push to `staging`",
  production:
    "Production deploy (.github/workflows/deploy-production.yml) — push to `main`",
};

function parseProfile() {
  const arg = process.argv.find((a) => a.startsWith("--profile="));
  const profile = arg?.split("=")[1];
  if (!profile || !PROFILES[profile]) {
    console.error(
      "[check-cicd-secrets] Pass --profile=ci, --profile=staging, or --profile=production",
    );
    process.exit(1);
  }
  return profile;
}

function githubAnnotation(name, meta) {
  const short = `Missing GitHub Actions secret: ${name}. Set in ${meta.where}. ${meta.how}`;
  const escaped = short.replace(/\n/g, " ").replace(/%/g, "%25");
  console.log(`::error title=Missing secret ${name}::${escaped}`);
}

function printReport(profile, missing) {
  const workflow = PROFILE_HELP[profile];
  console.error("");
  console.error(
    "════════════════════════════════════════════════════════════════",
  );
  console.error(`  CI/CD BLOCKED — ${missing.length} required secret(s) missing`);
  console.error(`  Profile: ${profile}`);
  console.error(`  Workflow: ${workflow}`);
  console.error(
    "════════════════════════════════════════════════════════════════",
  );
  console.error("");

  missing.forEach((name, index) => {
    const meta = SECRETS[name];
    console.error(`── ${index + 1}. ${name} ──`);
    console.error(`   Purpose:  ${meta.label}`);
    console.error(`   Where:    ${meta.where}`);
    console.error(`   How:      ${meta.how}`);
    console.error("");
    if (process.env.GITHUB_ACTIONS === "true") {
      githubAnnotation(name, meta);
    }
  });

  console.error("── After fixing ──");
  console.error(
    `   1. Add each secret under GitHub → Settings → Secrets and variables → Actions`,
  );
  console.error(
    `   2. Re-run the failed workflow (Actions tab → workflow run → Re-run jobs)`,
  );
  console.error(`   3. Full reference: ${DOCS}`);
  console.error(
    `   4. Local check:     npm run check:cicd-secrets -- --profile=${profile}`,
  );
  console.error("");
}

const profile = parseProfile();
const required = PROFILES[profile];
const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length) {
  printReport(profile, missing);
  process.exit(1);
}

console.log(
  `✓ All ${required.length} required secret(s) present for profile "${profile}" (${PROFILE_HELP[profile]})`,
);
