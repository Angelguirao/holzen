#!/usr/bin/env node
/**
 * Validate CI/CD environment configuration across GitHub Actions, Vercel, and Supabase Edge.
 *
 * Usage:
 *   node scripts/check-cicd-env.mjs --profile=ci --platform=github
 *   node scripts/check-cicd-env.mjs --profile=staging --platform=all
 *   node scripts/check-cicd-env.mjs --profile=production --platform=all
 *   node scripts/check-cicd-env.mjs --profile=staging --platform=all --strict-recommended
 *
 * Platforms: github | vercel | supabase | all
 */
import { spawnSync } from "node:child_process";
import {
  DOCS,
  GITHUB_PROFILE_KEYS,
  PLATFORM_LABELS,
  PROFILE_HELP,
  SUPABASE_EDGE_KEYS,
  SUPABASE_PROJECT_REFS,
  VERCEL_TARGET_KEYS,
  formatWhere,
  getGithubSpec,
  getSupabaseEdgeSpec,
  getVercelSpec,
} from "./lib/cicd-env-catalog.mjs";

const VALID_PROFILES = ["ci", "staging", "production"];
const VALID_PLATFORMS = ["github", "vercel", "supabase", "all"];

function parseArgs() {
  const profile = process.argv.find((a) => a.startsWith("--profile="))?.split("=")[1];
  const platform = process.argv.find((a) => a.startsWith("--platform="))?.split("=")[1] ?? "all";
  const strictRecommended = process.argv.includes("--strict-recommended");

  if (!profile || !VALID_PROFILES.includes(profile)) {
    console.error(
      `[check-cicd-env] Pass --profile=ci, --profile=staging, or --profile=production`,
    );
    process.exit(1);
  }
  if (!VALID_PLATFORMS.includes(platform)) {
    console.error(
      `[check-cicd-env] Pass --platform=github, vercel, supabase, or all`,
    );
    process.exit(1);
  }

  return { profile, platform, strictRecommended };
}

function githubAnnotation(platformLabel, spec) {
  const short = `[${platformLabel}] Missing ${spec.name}. Where: ${spec.where}. ${spec.how}`;
  const escaped = short.replace(/\n/g, " ").replace(/%/g, "%25");
  console.log(`::error title=Missing ${spec.name} (${platformLabel})::${escaped}`);
}

function printEntry(index, platformLabel, spec, tierLabel) {
  console.error(`── ${index}. ${spec.name} (${tierLabel}) ──`);
  console.error(`   Platform: ${platformLabel}`);
  console.error(`   Purpose:  ${spec.label}`);
  console.error(`   Where:    ${spec.where}`);
  console.error(`   How:      ${spec.how}`);
  if (spec.docs) console.error(`   Docs:     ${spec.docs}`);
  console.error("");
  if (process.env.GITHUB_ACTIONS === "true") {
    githubAnnotation(platformLabel, spec);
  }
}

function checkGithub(profile, strictRecommended) {
  const keys = GITHUB_PROFILE_KEYS[profile] ?? [];
  const missingRequired = [];
  const missingRecommended = [];

  for (const name of keys) {
    const spec = getGithubSpec(name);
    if (!spec) continue;
    if (process.env[name]?.trim()) continue;
    if (spec.tier === "required" || strictRecommended) missingRequired.push(spec);
    else missingRecommended.push(spec);
  }

  return { platform: "github", missingRequired, missingRecommended };
}

async function fetchVercelEnvKeys({ token, projectId, orgId, target }) {
  const params = new URLSearchParams();
  if (orgId) params.set("teamId", orgId);
  const url = `https://api.vercel.com/v9/projects/${projectId}/env?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel env API failed (${res.status}): ${body.slice(0, 400)}`);
  }
  const data = await res.json();
  const envs = data.envs ?? [];
  return new Set(
    envs
      .filter((entry) => Array.isArray(entry.target) && entry.target.includes(target))
      .map((entry) => entry.key),
  );
}

function checkVercel(profile, strictRecommended) {
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  const orgId = process.env.VERCEL_ORG_ID?.trim();

  if (!token || !projectId) {
    throw new Error(
      "Vercel audit requires VERCEL_TOKEN and VERCEL_PROJECT_ID in the environment (set as GitHub Actions secrets).",
    );
  }

  const target = profile === "production" ? "production" : "preview";
  const platform = target === "production" ? "vercel-production" : "vercel-preview";
  const keys = VERCEL_TARGET_KEYS[target] ?? [];

  return fetchVercelEnvKeys({ token, projectId, orgId, target }).then((present) => {
    const missingRequired = [];
    const missingRecommended = [];

    for (const name of keys) {
      const spec = getVercelSpec(name);
      if (!spec) continue;
      if (present.has(name)) continue;
      if (spec.tier === "required" || strictRecommended) missingRequired.push(spec);
      else missingRecommended.push(spec);
    }

    return { platform, missingRequired, missingRecommended };
  });
}

function fetchSupabaseSecretNames({ token, projectRef }) {
  const result = spawnSync(
    "npx",
    ["supabase", "secrets", "list", "--project-ref", projectRef, "-o", "json"],
    {
      encoding: "utf8",
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
      shell: process.platform === "win32",
    },
  );

  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || "").trim();
    throw new Error(
      `supabase secrets list failed for ${projectRef}: ${err || `exit ${result.status}`}`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    throw new Error(`supabase secrets list returned non-JSON for ${projectRef}`);
  }

  const names = Array.isArray(parsed)
    ? parsed.map((row) => row.name ?? row.key ?? row).filter(Boolean)
    : Object.keys(parsed);

  return new Set(names);
}

function checkSupabase(profile, strictRecommended) {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const envKey = profile === "production" ? "production" : "staging";
  const projectRef =
    profile === "production"
      ? process.env.SUPABASE_PROD_PROJECT_REF?.trim() || SUPABASE_PROJECT_REFS.production
      : process.env.SUPABASE_STAGING_PROJECT_REF?.trim() || SUPABASE_PROJECT_REFS.staging;

  if (!token) {
    throw new Error(
      "Supabase audit requires SUPABASE_ACCESS_TOKEN in the environment.",
    );
  }

  const platform =
    envKey === "production" ? "supabase-edge-production" : "supabase-edge-staging";
  const keys = SUPABASE_EDGE_KEYS[envKey] ?? [];
  const projectLabel =
    envKey === "production" ? "holzen-prod (geqkxsnyqvhtascjghuu)" : "holzen-staging (ksplyxxdvandkwzundql)";

  const present = fetchSupabaseSecretNames({ token, projectRef });
  const missingRequired = [];
  const missingRecommended = [];

  for (const name of keys) {
    const raw = getSupabaseEdgeSpec(name);
    if (!raw) continue;
    const spec = {
      ...raw,
      where: formatWhere(raw.where, { projectLabel }),
    };
    if (present.has(name)) continue;
    if (spec.tier === "required" || strictRecommended) missingRequired.push(spec);
    else missingRecommended.push(spec);
  }

  return { platform, missingRequired, missingRecommended };
}

function printReport(profile, results, strictRecommended) {
  const totalRequired = results.reduce((n, r) => n + r.missingRequired.length, 0);
  const totalRecommended = results.reduce((n, r) => n + r.missingRecommended.length, 0);

  if (totalRequired === 0 && totalRecommended === 0) {
    console.log(`✓ All checked environment variables present for profile "${profile}"`);
    for (const r of results) {
      console.log(`  - ${PLATFORM_LABELS[r.platform] ?? r.platform}: ok`);
    }
    return 0;
  }

  console.error("");
  console.error(
    "════════════════════════════════════════════════════════════════",
  );
  if (totalRequired > 0) {
    console.error(
      `  CI/CD BLOCKED — ${totalRequired} required variable(s) missing`,
    );
  } else if (totalRecommended > 0) {
    console.error(
      `  CI/CD OK (required) — ${totalRecommended} recommended variable(s) missing`,
    );
  }
  console.error(`  Profile: ${profile}`);
  console.error(`  Workflow: ${PROFILE_HELP[profile]}`);
  if (strictRecommended) {
    console.error("  Mode: --strict-recommended (recommended vars also block)");
  }
  console.error(
    "════════════════════════════════════════════════════════════════",
  );
  console.error("");

  let index = 1;
  for (const result of results) {
    const label = PLATFORM_LABELS[result.platform] ?? result.platform;
    if (result.missingRequired.length === 0 && result.missingRecommended.length === 0) {
      continue;
    }
    console.error(`▸ ${label}`);
    console.error("");
    for (const spec of result.missingRequired) {
      printEntry(index++, label, spec, "REQUIRED");
    }
    for (const spec of result.missingRecommended) {
      printEntry(index++, label, spec, "recommended");
    }
  }

  console.error("── After fixing ──");
  console.error("   GitHub secrets  → Settings → Secrets and variables → Actions");
  console.error("   Vercel env      → vercel.com → holzen → Settings → Environment Variables");
  console.error(
    "   Supabase Edge   → supabase.com/dashboard → project → Edge Functions → Secrets",
  );
  console.error("   Local apply     → npm run staging:secrets-set / prod:secrets-set");
  console.error("   Vercel sync     → npm run vercel:sync-env");
  console.error(`   Full catalog    → ${DOCS}`);
  console.error(
    `   Re-check        → npm run check:cicd-env -- --profile=${profile} --platform=all`,
  );
  if (totalRecommended > 0 && !strictRecommended) {
    console.error(
      "   Strict mode     → add --strict-recommended to fail on recommended vars too",
    );
  }
  console.error("");

  return totalRequired > 0 ? 1 : strictRecommended && totalRecommended > 0 ? 1 : 0;
}

async function main() {
  const { profile, platform, strictRecommended } = parseArgs();

  const platformsToCheck =
    platform === "all"
      ? profile === "ci"
        ? ["github"]
        : ["github", "vercel", "supabase"]
      : [platform];

  /** @type {Promise<{ platform: string; missingRequired: any[]; missingRecommended: any[] }>[]} */
  const tasks = [];

  if (platformsToCheck.includes("github")) {
    tasks.push(Promise.resolve(checkGithub(profile, strictRecommended)));
  }
  if (platformsToCheck.includes("vercel")) {
    if (profile === "ci") {
      console.log("ℹ Skipping Vercel audit for profile=ci (not needed for PR CI).");
    } else {
      tasks.push(checkVercel(profile, strictRecommended));
    }
  }
  if (platformsToCheck.includes("supabase")) {
    if (profile === "ci") {
      console.log("ℹ Skipping Supabase Edge audit for profile=ci.");
    } else {
      tasks.push(Promise.resolve(checkSupabase(profile, strictRecommended)));
    }
  }

  const results = await Promise.all(tasks);
  const code = printReport(profile, results, strictRecommended);
  process.exit(code);
}

main().catch((err) => {
  console.error(`[check-cicd-env] ${err.message}`);
  console.error(`See ${DOCS} for setup instructions.`);
  process.exit(1);
});
