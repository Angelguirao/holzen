/**
 * Writes Supabase Database types to src/integrations/supabase/types.ts.
 *
 * Requires: `npx supabase login` once, or SUPABASE_ACCESS_TOKEN in the environment.
 * Uses an explicit Supabase project ref (`--project-id`) instead of `--linked`.
 *
 * Usage: npm run gen:types
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { formatSupabaseTarget, resolveSupabaseTarget } from "./lib/supabase-targets.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "src", "integrations", "supabase", "types.ts");
const target = resolveSupabaseTarget(process.argv[2] ?? "production");

const banner = `/**
 * Supabase-generated \`Database\` types.
 *
 * Regenerate after migrations: \`npm run gen:types\` (production) or
 * \`npm run gen:types:staging\` (staging).
 * Generated from explicit target: ${formatSupabaseTarget(target)}.
 *
 * If this file drifts from production, dropped tables/columns may still appear
 * until you re-run the generator. Application code targets Pause V2
 * (\`pause_instances\`, \`v_pause_full\`, \`pause_ai_artifacts\`, …).
 */

`;

let body;
try {
  console.log(`[gen:types] Generating Database types from ${formatSupabaseTarget(target)}…`);
  body = execFileSync(
    "npx",
    [
      "supabase",
      "gen",
      "types",
      "typescript",
      "--project-id",
      target.projectRef,
      "--schema",
      "public",
    ],
    {
      encoding: "utf8",
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    },
  );
} catch (e) {
  const err = e instanceof Error ? e.message : String(e);
  const stderr = e && typeof e === "object" && "stderr" in e ? String(e.stderr) : "";
  console.error("gen:types failed:", err, stderr);
  process.exit(1);
}

// CLI may emit its own leading file comment; keep a single Holzen banner.
const trimmed = body.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*\n?/, "");
writeFileSync(outPath, banner + trimmed, "utf8");
console.log("Wrote", outPath);
