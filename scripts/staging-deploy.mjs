#!/usr/bin/env node
/**
 * Deploy schema + edge functions to the linked Supabase project (staging).
 *
 * Prerequisites:
 *   npx supabase login
 *   npx supabase link --project-ref YOUR_STAGING_REF
 *
 * Usage:
 *   npm run staging:db-push   — migrations only
 *   npm run staging:deploy    — migrations + all edge functions
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

if (mode === "db-push" || mode === "deploy") {
  run("supabase db push", ["db", "push"]);
} else {
  console.error(`Unknown mode: ${mode}. Use db-push or deploy.`);
  process.exit(1);
}

if (mode === "deploy") {
  run("supabase functions deploy", ["functions", "deploy"]);
}
