#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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
run("local cron bootstrap", "node", ["scripts/supabase-local-crons.mjs"]);
