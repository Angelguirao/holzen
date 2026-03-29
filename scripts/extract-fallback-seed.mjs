/**
 * One-off helper: reads supabase/functions/_shared/fallbacks.ts and writes
 * supabase/functions/_shared/fallback-seed.json (canonical pool data).
 * Run: node scripts/extract-fallback-seed.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const tsPath = path.join(root, "supabase/functions/_shared/fallbacks.ts");
const outPath = path.join(root, "supabase/functions/_shared/fallback-seed.json");

const txt = fs.readFileSync(tsPath, "utf8");

function extractArray(constName) {
  const re = new RegExp(
    `export const ${constName} = (\\[[\\s\\S]*?\\]);`,
  );
  const m = txt.match(re);
  if (!m) throw new Error(`Could not extract ${constName}`);
  const code = m[1];
  // eslint-disable-next-line no-new-func
  const arr = new Function(`"use strict"; return (${code});`)();
  return arr;
}

const seed = {
  signal: extractArray("SIGNAL_FALLBACKS"),
  grounding: extractArray("GROUNDING_FALLBACKS"),
  history: extractArray("HISTORY_FALLBACKS"),
  zoom_out: extractArray("ZOOM_OUT_FALLBACKS"),
  reflection: extractArray("REFLECTION_FALLBACKS"),
};

fs.writeFileSync(outPath, JSON.stringify(seed, null, 2) + "\n", "utf8");
console.log("Wrote", outPath, {
  signal: seed.signal.length,
  grounding: seed.grounding.length,
  history: seed.history.length,
  zoom_out: seed.zoom_out.length,
  reflection: seed.reflection.length,
});
