#!/usr/bin/env node
/**
 * Deploy schema + active edge functions to the linked Supabase project.
 *
 * Prerequisites:
 *   npx supabase login
 *   npx supabase link --project-ref ksplyxxdvandkwzundql   # staging
 *   npx supabase link --project-ref geqkxsnyqvhtascjghuu    # prod (manual / CI)
 *
 * Usage:
 *   npm run staging:db-push            — migrations only
 *   npm run staging:functions-deploy   — active edges only (config.toml manifest)
 *   npm run staging:deploy             — migrations + active edges
 */
import { spawnSync } from "node:child_process";

const mode = process.argv[2] ?? "deploy";

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

function runNode(label, script, scriptArgs = []) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync("node", [script, ...scriptArgs], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

if (mode === "db-push" || mode === "deploy") {
  run("supabase db push", ["db", "push"]);
} else if (mode === "functions") {
  runNode("deploy active edge functions", "scripts/deploy-active-edge-functions.mjs");
} else if (mode !== "deploy") {
  console.error(`Unknown mode: ${mode}. Use db-push, functions, or deploy.`);
  process.exit(1);
}

if (mode === "deploy") {
  runNode("deploy active edge functions", "scripts/deploy-active-edge-functions.mjs");
}
