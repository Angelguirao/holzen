/**
 * Push edge secrets from a gitignored env file to a Supabase project.
 *
 * Usage:
 *   npm run staging:secrets-set
 *   npm run prod:secrets-set
 *
 * Or: node scripts/supabase-secrets-set.mjs .env.staging.secrets ksplyxxdvandkwzundql
 */
import { readFileSync, existsSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { parseDotenv } from "./parse-dotenv.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, process.argv[2] ?? ".env.staging.secrets");
const projectRef = process.argv[3];

if (!existsSync(envPath)) {
  console.error(`Missing ${envPath} — copy the matching *.example and fill values.`);
  process.exit(1);
}

const parsed = parseDotenv(readFileSync(envPath, "utf8"));
const lines = [];
for (const [key, value] of Object.entries(parsed)) {
  if (!value.trim()) {
    console.warn(`skip empty: ${key}`);
    continue;
  }
  lines.push(`${key}=${value}`);
}

if (lines.length === 0) {
  console.error(`No non-empty secrets in ${envPath}`);
  process.exit(1);
}

const tempDir = mkdtempSync(join(tmpdir(), "holzen-secrets-"));
const tempEnvPath = join(tempDir, "secrets.env");
writeFileSync(tempEnvPath, `${lines.join("\n")}\n`, "utf8");

const args = ["supabase", "secrets", "set", "--env-file", tempEnvPath];
if (projectRef) {
  args.push("--project-ref", projectRef);
}

console.log(
  `Setting ${lines.length} edge secret(s)${projectRef ? ` on ${projectRef}` : " on linked project"}…`,
);
const result = spawnSync("npx", args, {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});
rmSync(tempDir, { recursive: true, force: true });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("Done.");
