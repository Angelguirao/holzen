#!/usr/bin/env node
/**
 * Fail CI when required GitHub Actions deploy secrets are missing.
 * Usage: node scripts/check-github-deploy-secrets.mjs --profile=staging|production
 */
const profile = process.argv.find((a) => a.startsWith("--profile="))?.split("=")[1];

const REQUIRED = {
  staging: [
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_STAGING_PROJECT_REF",
    "VERCEL_TOKEN",
    "VERCEL_ORG_ID",
    "VERCEL_PROJECT_ID",
  ],
  production: [
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_PROD_PROJECT_REF",
    "VERCEL_TOKEN",
    "VERCEL_ORG_ID",
    "VERCEL_PROJECT_ID",
  ],
};

if (!profile || !REQUIRED[profile]) {
  console.error(
    `[check-github-deploy-secrets] Pass --profile=staging or --profile=production`,
  );
  process.exit(1);
}

const missing = REQUIRED[profile].filter((name) => !process.env[name]?.trim());

if (missing.length) {
  console.error(
    `[check-github-deploy-secrets] Missing GitHub Actions secrets for ${profile}:`,
  );
  for (const name of missing) console.error(`  - ${name}`);
  console.error(
    "\nSee docs/ops/cicd-overview.md § GitHub Actions secrets.",
  );
  process.exit(1);
}

console.log(`✓ All required ${profile} deploy secrets are present`);
