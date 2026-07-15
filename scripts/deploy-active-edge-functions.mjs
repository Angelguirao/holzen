#!/usr/bin/env node
/**
 * Deploy pause-first active edge functions listed in supabase/config.toml.
 * Skips supabase/functions/legacy/** (Tier B — not shipped on owned projects).
 *
 * Usage:
 *   node scripts/deploy-active-edge-functions.mjs
 *   node scripts/deploy-active-edge-functions.mjs --project-ref=<ref>
 *   node scripts/deploy-active-edge-functions.mjs --base=<sha>   # only changed funcs
 *   node scripts/deploy-active-edge-functions.mjs --force-all
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { readConfigTomlFunctionNames } from "./lib/read-config-toml-functions.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const activeNames = readConfigTomlFunctionNames();
const activeSet = new Set(activeNames);

function parseArgs() {
  const projectRefFlagIndex = process.argv.indexOf("--project-ref");
  const explicitProjectRef =
    projectRefFlagIndex >= 0 ? process.argv[projectRefFlagIndex + 1] : undefined;
  const projectRef =
    explicitProjectRef?.trim() ||
    process.env.SUPABASE_PROJECT_REF?.trim() ||
    undefined;

  const baseArg = process.argv.find((a) => a.startsWith("--base="));
  const base = baseArg?.split("=")[1]?.trim() || process.env.EDGE_DEPLOY_BASE?.trim();
  const forceAll = process.argv.includes("--force-all");

  return { projectRef, base, forceAll };
}

/**
 * Decide which active functions to deploy from a git diff against `base`.
 * - Changes under supabase/functions/_shared/ (except release.ts) → all
 * - Changes to supabase/config.toml → all
 * - Changes under supabase/functions/<name>/ → that name
 * - Stamp-only `_shared/release.ts` does not force a full redeploy
 */
function resolveDeployNames(base, forceAll) {
  if (forceAll || !base) {
    return { names: activeNames, reason: forceAll ? "force-all" : "full (no --base)" };
  }

  const diff = spawnSync(
    "git",
    ["diff", "--name-only", `${base}...HEAD`, "--", "supabase/"],
    {
      cwd: root,
      encoding: "utf8",
      shell: process.platform === "win32",
    },
  );

  if (diff.status !== 0) {
    console.error(
      `[deploy-active-edge-functions] git diff against ${base} failed — deploying all as fallback`,
    );
    return { names: activeNames, reason: "diff-failed-fallback" };
  }

  const files = diff.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (files.length === 0) {
    return { names: [], reason: "no-supabase-changes" };
  }

  const changed = new Set();
  let forceShared = false;

  for (const file of files) {
    const rel = file.replace(/\\/g, "/");
    if (rel === "supabase/config.toml") {
      forceShared = true;
      continue;
    }
    if (rel.startsWith("supabase/functions/_shared/")) {
      if (rel.endsWith("/release.ts") || rel.endsWith("\\release.ts")) {
        continue;
      }
      forceShared = true;
      continue;
    }
    const match = rel.match(/^supabase\/functions\/([^/]+)\//);
    if (match) {
      const name = match[1];
      if (name === "legacy" || name.startsWith("_")) continue;
      if (activeSet.has(name)) changed.add(name);
    }
  }

  if (forceShared) {
    return { names: activeNames, reason: "shared-or-config-changed" };
  }

  const names = [...changed].sort();
  return {
    names,
    reason: names.length ? `changed: ${names.join(", ")}` : "migrations-or-other-only",
  };
}

const { projectRef, base, forceAll } = parseArgs();
const { names, reason } = resolveDeployNames(base, forceAll);

const missing = names.filter(
  (name) => !existsSync(join(root, "supabase", "functions", name, "index.ts")),
);
if (missing.length) {
  console.error("[deploy-active-edge-functions] Missing index.ts for config.toml entries:");
  for (const name of missing) console.error(`  - ${name}`);
  process.exit(1);
}

if (names.length === 0) {
  console.log(
    `[deploy-active-edge-functions] Skipping edge deploy (${reason})${base ? ` vs ${base.slice(0, 12)}` : ""}`,
  );
  process.exit(0);
}

console.log(
  `[deploy-active-edge-functions] Deploying ${names.length}/${activeNames.length} functions (${reason})${projectRef ? ` → ${projectRef}` : ""}…`,
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
