#!/usr/bin/env node
/**
 * CI-only Vercel deploy (prebuilt). Runs after backend deploy so migrations/edges
 * exist before the SPA ships.
 *
 * Requires: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
 *
 * Usage:
 *   node scripts/vercel-ci-deploy.mjs --environment=preview
 *   node scripts/vercel-ci-deploy.mjs --environment=production
 */
import { appendFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs() {
  const arg = process.argv.find((a) => a.startsWith("--environment="));
  const environment = arg?.split("=")[1] ?? "preview";
  if (environment !== "preview" && environment !== "production") {
    console.error(
      `[vercel-ci-deploy] --environment must be preview or production (got ${environment})`,
    );
    process.exit(1);
  }
  return { environment, prod: environment === "production" };
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`[vercel-ci-deploy] Missing required env: ${name}`);
    process.exit(1);
  }
  return value;
}

function run(label, cmd, cmdArgs, extraEnv = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, cmdArgs, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed (exit ${result.status ?? 1})`);
    process.exit(result.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

const token = requireEnv("VERCEL_TOKEN");
const orgId = requireEnv("VERCEL_ORG_ID");
const projectId = requireEnv("VERCEL_PROJECT_ID");
const cliEnv = { VERCEL_ORG_ID: orgId, VERCEL_PROJECT_ID: projectId };

const { environment, prod } = parseArgs();
const vercelPullEnv = prod ? "production" : "preview";

console.log(
  `[vercel-ci-deploy] Deploying ${environment} (prebuilt) for ${process.env.GITHUB_SHA?.slice(0, 12) ?? "local"}`,
);

run(
  "vercel pull",
  "npx",
  [
    "vercel@latest",
    "pull",
    "--yes",
    `--environment=${vercelPullEnv}`,
    `--token=${token}`,
  ],
  cliEnv,
);

const buildArgs = ["vercel@latest", "build", `--token=${token}`];
if (prod) buildArgs.push("--prod");
run("vercel build", "npx", buildArgs, cliEnv);

const deployArgs = ["vercel@latest", "deploy", "--prebuilt", `--token=${token}`];
if (prod) deployArgs.push("--prod");

console.log("\n▶ vercel deploy");
const deployResult = spawnSync("npx", deployArgs, {
  cwd: root,
  encoding: "utf8",
  shell: process.platform === "win32",
  env: { ...process.env, ...cliEnv },
});

if (deployResult.status !== 0) {
  console.error(`\n✗ vercel deploy failed (exit ${deployResult.status ?? 1})`);
  if (deployResult.stderr) process.stderr.write(deployResult.stderr);
  process.exit(deployResult.status ?? 1);
}

const output = `${deployResult.stdout ?? ""}${deployResult.stderr ?? ""}`.trim();
const url = output.split(/\r?\n/).filter(Boolean).at(-1) ?? "";
console.log(`✓ vercel deploy${url ? `: ${url}` : ""}`);

if (process.env.GITHUB_OUTPUT && url) {
  appendFileSync(process.env.GITHUB_OUTPUT, `url=${url}\n`);
}
