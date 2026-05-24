import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Active edge function names from `supabase/config.toml` `[functions.*]` blocks. */
export function readConfigTomlFunctionNames(configPath = join(root, "supabase", "config.toml")) {
  const configToml = readFileSync(configPath, "utf8");
  return [...configToml.matchAll(/^\s*\[functions\.([^\]]+)\]/gm)].map((m) => m[1]).sort();
}
