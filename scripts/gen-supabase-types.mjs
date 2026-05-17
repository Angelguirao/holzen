/**
 * Writes Supabase Database types to src/integrations/supabase/types.ts.
 *
 * Requires: `npx supabase login` once, or SUPABASE_ACCESS_TOKEN in the environment.
 * Uses the project linked in supabase/config.toml (--linked).
 *
 * Usage: npm run gen:types
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "src", "integrations", "supabase", "types.ts");

const banner = `/**
 * Supabase-generated \`Database\` types.
 *
 * Regenerate after migrations: \`npm run gen:types\`
 * (requires \`supabase login\` or \`SUPABASE_ACCESS_TOKEN\`; uses \`--linked\` + \`supabase/config.toml\`).
 *
 * If this file drifts from production, dropped tables/columns may still appear
 * until you re-run the generator. Application code targets Pause V2
 * (\`pause_instances\`, \`v_pause_full\`, \`pause_ai_artifacts\`, …).
 */

`;

let body;
try {
  body = execFileSync("npx", ["supabase", "gen", "types", "typescript", "--linked", "--schema", "public"], {
    encoding: "utf8",
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
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
