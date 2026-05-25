#!/usr/bin/env node
/**
 * Deploy schema + active edge functions to an owned Supabase project.
 *
 * Prerequisites:
 *   npx supabase login
 *
 * Usage:
 *   npm run staging:db-push            — migrations only (staging)
 *   npm run staging:functions-deploy   — active edges only (staging)
 *   npm run staging:deploy             — migrations + active edges (staging)
 *   npm run prod:db-push               — migrations only (production)
 *   npm run prod:functions-deploy      — active edges only (production)
 *   npm run prod:deploy                — migrations + active edges (production)
 */
import { spawnSync } from "node:child_process";

const targetArg = (process.argv[2] ?? "staging").toLowerCase();
const mode = process.argv[3] ?? "deploy";

const TARGETS = {
  staging: {
    label: "staging",
    projectRef: process.env.SUPABASE_STAGING_PROJECT_REF?.trim() || "ksplyxxdvandkwzundql",
  },
  prod: {
    label: "production",
    projectRef: process.env.SUPABASE_PROD_PROJECT_REF?.trim() || "geqkxsnyqvhtascjghuu",
  },
  production: {
    label: "production",
    projectRef: process.env.SUPABASE_PROD_PROJECT_REF?.trim() || "geqkxsnyqvhtascjghuu",
  },
};

const target = TARGETS[targetArg];

if (!target) {
  console.error(`Unknown target: ${targetArg}. Use staging, prod, or production.`);
  process.exit(1);
}

function run(label, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync("npx", ["supabase", ...args], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

function ensureLinkedProject() {
  run(`supabase link (${target.label})`, ["link", "--project-ref", target.projectRef]);
}

function runNode(label, script, scriptArgs = []) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync("node", [script, ...scriptArgs], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      SUPABASE_PROJECT_REF: target.projectRef,
    },
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

console.log(`Target project: ${target.label} (${target.projectRef})`);
ensureLinkedProject();

if (mode === "db-push" || mode === "deploy") {
  run("supabase db push", ["db", "push", "--yes"]);
} else if (mode === "functions") {
  runNode("deploy active edge functions", "scripts/deploy-active-edge-functions.mjs");
} else if (mode !== "deploy") {
  console.error(`Unknown mode: ${mode}. Use db-push, functions, or deploy.`);
  process.exit(1);
}

if (mode === "deploy") {
  runNode("deploy active edge functions", "scripts/deploy-active-edge-functions.mjs");
}
