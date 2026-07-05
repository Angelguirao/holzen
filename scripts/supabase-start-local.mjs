#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { waitForLocalPostgres } from "./supabase-local-db-query.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(label, command, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }

  console.log(`✓ ${label}`);
}

run("supabase start", "npx", ["supabase", "start"]);

console.log("\n▶ wait for local Postgres");
try {
  waitForLocalPostgres();
  console.log("✓ wait for local Postgres");
} catch (error) {
  console.error(`\n✗ wait for local Postgres failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

run("local cron bootstrap", "node", ["scripts/supabase-local-crons.mjs"]);
