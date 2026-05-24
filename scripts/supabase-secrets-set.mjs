/**
 * Push edge secrets from a gitignored env file to a Supabase project.
 *
 * Usage:
 *   npm run staging:secrets-set
 *   npm run prod:secrets-set
 *
 * Or: node scripts/supabase-secrets-set.mjs .env.staging.secrets ksplyxxdvandkwzundql
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, process.argv[2] ?? ".env.staging.secrets");
const projectRef = process.argv[3];

if (!existsSync(envPath)) {
  console.error(`Missing ${envPath} — copy the matching *.example and fill values.`);
  process.exit(1);
}

const raw = readFileSync(envPath, "utf8");
const pairs = [];
for (const line of raw.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq <= 0) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  if (!value) {
    console.warn(`skip empty: ${key}`);
    continue;
  }
  pairs.push(`${key}=${value}`);
}

if (pairs.length === 0) {
  console.error(`No non-empty secrets in ${envPath}`);
  process.exit(1);
}

const args = ["supabase", "secrets", "set", ...pairs];
if (projectRef) {
  args.push("--project-ref", projectRef);
}

console.log(`Setting ${pairs.length} edge secret(s)${projectRef ? ` on ${projectRef}` : " on linked project"}…`);
const result = spawnSync("npx", args, {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("Done.");
