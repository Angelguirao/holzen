#!/usr/bin/env node
/**
 * Execute SQL against a named remote Supabase project.
 *
 * This wraps `supabase db query --linked` because the CLI does not currently
 * accept a project ref directly for that command. We relink explicitly first so
 * the target is never implicit.
 *
 * Usage:
 *   node scripts/run-remote-sql.mjs staging --file scripts/sql/reschedule-owned-crons.sql
 *   node scripts/run-remote-sql.mjs prod --query "select now();"
 */
import { spawnSync } from "node:child_process";
import { formatSupabaseTarget, resolveSupabaseTarget } from "./lib/supabase-targets.mjs";

const targetArg = process.argv[2];
const queryFlagIndex = process.argv.indexOf("--query");
const fileFlagIndex = process.argv.indexOf("--file");
const query = queryFlagIndex >= 0 ? process.argv[queryFlagIndex + 1] : undefined;
const filePath = fileFlagIndex >= 0 ? process.argv[fileFlagIndex + 1] : undefined;

if (!targetArg) {
  console.error("Usage: node scripts/run-remote-sql.mjs <staging|prod> [--file <path> | --query <sql>]");
  process.exit(1);
}

if (!query?.trim() && !filePath?.trim()) {
  console.error("Pass either --file <path> or --query <sql>.");
  process.exit(1);
}

const target = resolveSupabaseTarget(targetArg);

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

console.log(`Target project: ${formatSupabaseTarget(target)}`);
run(`supabase link (${target.label})`, ["link", "--project-ref", target.projectRef]);

const args = ["db", "query", "--linked"];
if (filePath?.trim()) args.push("--file", filePath.trim());
if (query?.trim()) args.push(query.trim());
run("supabase db query", args);
