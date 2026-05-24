/**
 * Push edge secrets from a gitignored env file to the linked Supabase project.
 *
 * Usage:
 *   cp .env.staging.secrets.example .env.staging.secrets
 *   # fill values, then:
 *   npm run staging:secrets-set
 *
 * Requires: npx supabase login + link --project-ref ksplyxxdvandkwzundql
 */
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.staging.secrets");

if (!existsSync(envPath)) {
  console.error(
    "Missing .env.staging.secrets — copy .env.staging.secrets.example and fill values.",
  );
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
  console.error("No non-empty secrets in .env.staging.secrets");
  process.exit(1);
}

console.log(`Setting ${pairs.length} edge secret(s) on linked project…`);
execFileSync("npx", ["supabase", "secrets", "set", ...pairs], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});
console.log("Done.");
