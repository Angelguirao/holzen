/**
 * Plan §5.0 — no mvp|pre-mvp tokens in shipped dev paths (code, ops, Bruno, CI).
 * @see .cursor/plans/pause-first_mvp_launch_09b4d948.plan.md
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const RE = /mvp|pre-mvp/i;

/** Line-level allowlist (immutable artifacts / team branch name). */
const LINE_ALLOW = [
  /feature\/mvpPauseCleanup/,
  /20260521200000_holzen_mvp_launch_cutover\.sql/,
  /pause-first_mvp_launch/, // plan artifact filename in cross-links only
];

const SCAN_ROOTS = [
  join(root, "src"),
  join(root, "supabase", "functions"),
  join(root, "scripts"),
  join(root, "docs", "ops"),
  join(root, ".cursor", "rules"),
  join(root, "bruno"),
  join(root, "package.json"),
];

const SKIP_DIR = new Set(["legacy", "migrations-archive", "node_modules"]);

function walk(dir, out = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|mjs|md|mdc|json|ps1)$/.test(name) || name === "package.json") out.push(p);
  }
  return out;
}

const violations = [];
for (const scanRoot of SCAN_ROOTS) {
  const files = statSync(scanRoot, { throwIfNoEntry: false })?.isFile()
    ? [scanRoot]
    : walk(scanRoot);
  for (const file of files) {
    const rel = relative(root, file).replace(/\\/g, "/");
    if (rel.includes("/legacy/") || rel.includes(".cursor/plans/")) continue;
    if (rel === "scripts/check-no-phase-labels.mjs") continue;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (!RE.test(line)) return;
      if (LINE_ALLOW.some((a) => a.test(line))) return;
      violations.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
}

if (violations.length) {
  console.error("[check:no-phase-labels] forbidden mvp|pre-mvp in shipped paths:\n");
  for (const v of violations.slice(0, 40)) console.error(" ", v);
  if (violations.length > 40) console.error(`  … and ${violations.length - 40} more`);
  process.exit(1);
}
console.log("[check:no-phase-labels] OK");
