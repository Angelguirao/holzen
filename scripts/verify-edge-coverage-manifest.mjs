/**
 * Ensures `src/pages/EdgeCoverage.tsx` lists every `[functions.<name>]` from
 * `supabase/config.toml` (and has no stray names). Prevents the admin UI drift
 * that missed new deployables.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(root, "supabase", "config.toml");
const coveragePath = join(root, "src", "pages", "EdgeCoverage.tsx");

if (!existsSync(configPath) || !existsSync(coveragePath)) {
  console.error("[check:edge-coverage-manifest] Missing config or EdgeCoverage.tsx");
  process.exit(1);
}

const configToml = readFileSync(configPath, "utf8");
const fromConfig = new Set(
  [...configToml.matchAll(/^\s*\[functions\.([^\]]+)\]/gm)].map((m) => m[1]),
);

const coverageSrc = readFileSync(coveragePath, "utf8");
const fromCoverage = new Set(
  [...coverageSrc.matchAll(/\{\s*name:\s*"([^"]+)",\s*wrl:/g)].map((m) => m[1]),
);

const missingInCoverage = [...fromConfig].filter((n) => !fromCoverage.has(n)).sort();
const extraInCoverage = [...fromCoverage].filter((n) => !fromConfig.has(n)).sort();

if (missingInCoverage.length || extraInCoverage.length) {
  console.error("[check:edge-coverage-manifest] Manifest mismatch.");
  if (missingInCoverage.length) {
    console.error("  In config.toml but not EdgeCoverage COVERAGE:", missingInCoverage.join(", "));
  }
  if (extraInCoverage.length) {
    console.error("  In EdgeCoverage but not config.toml:", extraInCoverage.join(", "));
  }
  process.exit(1);
}

console.log("[check:edge-coverage-manifest] OK:", fromConfig.size, "functions");
process.exit(0);
