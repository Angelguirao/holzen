/**
 * Fail when active src/ calls t('key') with a key missing from src/locales/en.json.
 * Plan §18.5 optional Step 6 guard.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(root, "src");
const enPath = join(root, "src", "locales", "en.json");

function flatten(obj, prefix = "") {
  const keys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, path).forEach((x) => keys.add(x));
    else keys.add(path);
  }
  return keys;
}

const enRaw = readFileSync(enPath, "utf8").replace(/^\uFEFF/, "");
const enKeys = flatten(JSON.parse(enRaw));
const T_RE = /\bt\s*\(\s*['"]([^'"]+)['"]/g;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === "legacy") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const missing = [];
for (const file of walk(srcRoot)) {
  const rel = relative(root, file).replace(/\\/g, "/");
  if (rel.startsWith("src/legacy/")) continue;
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(T_RE)) {
    const key = m[1];
    if (key.includes("${")) continue;
    if (!enKeys.has(key)) missing.push(`${rel}: ${key}`);
  }
}

const uniq = [...new Set(missing)];
if (uniq.length) {
  console.error("[check:i18n-active-keys] missing keys in en.json:\n");
  for (const line of uniq.slice(0, 50)) console.error(" ", line);
  if (uniq.length > 50) console.error(`  … and ${uniq.length - 50} more`);
  process.exit(1);
}
console.log("[check:i18n-active-keys] OK");
