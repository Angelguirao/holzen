#!/usr/bin/env node
/**
 * Deploy only pause-first active edge functions listed in supabase/config.toml.
 * Skips supabase/functions/legacy/** (Tier B — not shipped on owned projects).
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { readConfigTomlFunctionNames } from "./lib/read-config-toml-functions.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const names = readConfigTomlFunctionNames();
const projectRefFlagIndex = process.argv.indexOf("--project-ref");
const explicitProjectRef =
  projectRefFlagIndex >= 0 ? process.argv[projectRefFlagIndex + 1] : undefined;
const projectRef = explicitProjectRef?.trim() || process.env.SUPABASE_PROJECT_REF?.trim();

const missing = names.filter(
  (name) => !existsSync(join(root, "supabase", "functions", name, "index.ts")),
);
if (missing.length) {
  console.error("[deploy-active-edge-functions] Missing index.ts for config.toml entries:");
  for (const name of missing) console.error(`  - ${name}`);
  process.exit(1);
}

console.log(
  `[deploy-active-edge-functions] Deploying ${names.length} active functions${projectRef ? ` to ${projectRef}` : ""}…`,
);

const args = ["supabase", "functions", "deploy", ...names];
if (projectRef) args.push("--project-ref", projectRef);

const result = spawnSync("npx", args, {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  console.error(`\n✗ Edge deploy failed (exit ${result.status ?? 1})`);
  process.exit(result.status ?? 1);
}

console.log(`✓ Deployed ${names.length} active edge functions`);
