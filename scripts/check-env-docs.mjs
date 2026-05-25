#!/usr/bin/env node
/**
 * Fail when Holzen runtime/deploy env vars drift from docs/ops/environment-matrix.md.
 *
 * Scope (intentionally narrow to avoid noisy false positives):
 * - Browser/runtime usage in src/
 * - Edge runtime usage in supabase/functions/
 * - Build/deploy config in vite.config.ts, vitest.config.ts, vite.react-compiler.ts
 * - CI/deploy catalog in scripts/lib/cicd-env-catalog.mjs
 * - Public example env files committed in the repo
 *
 * This check does NOT try to police every ad-hoc helper-script env var. It is a
 * fitness function for the documented app/deploy surface.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GITHUB_PROFILE_KEYS,
  SUPABASE_EDGE_KEYS,
  VERCEL_TARGET_KEYS,
} from "./lib/cicd-env-catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envDocPath = join(root, "docs", "ops", "environment-matrix.md");

const runtimeScanTargets = [
  join(root, "src"),
  join(root, "supabase", "functions"),
  join(root, "vite.config.ts"),
  join(root, "vitest.config.ts"),
  join(root, "vite.react-compiler.ts"),
];

const exampleEnvFiles = [
  ".env.example",
  ".env.staging.example",
  ".env.hosted.example",
  ".env.localstack.example",
  ".env.staging.secrets.example",
  ".env.prod.secrets.example",
].map((path) => join(root, path));

const envTokenRe = /[A-Z][A-Z0-9_]*[A-Z0-9]/;
const codeEnvPatterns = [
  new RegExp(String.raw`import\.meta\.env\.(${envTokenRe.source})(?![A-Z0-9_])`, "g"),
  new RegExp(String.raw`process\.env\.(${envTokenRe.source})(?![A-Z0-9_])`, "g"),
  new RegExp(String.raw`Deno\.env\.get\(\s*["'](${envTokenRe.source})["']\s*\)`, "g"),
];

const ignoredRuntimeNames = new Set(["DEV", "PROD", "MODE"]);
const ignoredDocumentedOnlyWarnings = new Set([
  "EDGE_RELEASE",
  "EMAIL_FEEDBACK_INBOX",
  "EMAIL_ROOT_DOMAIN",
  "GITHUB_OUTPUT",
  "GITHUB_SHA",
  "VERCEL_GIT_COMMIT_SHA",
]);

function toRepoPath(path) {
  return relative(root, path).replace(/\\/g, "/");
}

function walk(target, files = []) {
  const st = statSync(target);
  if (st.isFile()) {
    files.push(target);
    return files;
  }
  for (const name of readdirSync(target)) {
    const next = join(target, name);
    const nextStat = statSync(next);
    if (nextStat.isDirectory()) {
      walk(next, files);
      continue;
    }
    if (/\.(ts|tsx|js|mjs)$/.test(name)) files.push(next);
  }
  return files;
}

function collectRuntimeEnvUsage() {
  /** @type {Map<string, Set<string>>} */
  const usage = new Map();

  for (const target of runtimeScanTargets) {
    for (const file of walk(target)) {
      const rel = toRepoPath(file);
      const text = readFileSync(file, "utf8");
      for (const pattern of codeEnvPatterns) {
        for (const match of text.matchAll(pattern)) {
          const name = match[1];
          if (ignoredRuntimeNames.has(name)) continue;
          if (!usage.has(name)) usage.set(name, new Set());
          usage.get(name).add(rel);
        }
      }
    }
  }

  return usage;
}

function collectExampleEnvNames() {
  /** @type {Map<string, Set<string>>} */
  const usage = new Map();
  const lineRe = new RegExp(String.raw`^\s*#?\s*(${envTokenRe.source})\s*=`, "gm");

  for (const file of exampleEnvFiles) {
    const rel = toRepoPath(file);
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(lineRe)) {
      const name = match[1];
      if (!usage.has(name)) usage.set(name, new Set());
      usage.get(name).add(rel);
    }
  }

  return usage;
}

function collectCatalogNames() {
  const names = new Set();
  for (const list of Object.values(GITHUB_PROFILE_KEYS)) {
    for (const name of list) names.add(name);
  }
  for (const list of Object.values(VERCEL_TARGET_KEYS)) {
    for (const name of list) names.add(name);
  }
  for (const list of Object.values(SUPABASE_EDGE_KEYS)) {
    for (const name of list) names.add(name);
  }
  return names;
}

function collectDocumentedNames() {
  const text = readFileSync(envDocPath, "utf8");
  const documented = new Set();
  const docTokenRe = new RegExp("`(" + envTokenRe.source + ")`", "g");
  for (const match of text.matchAll(docTokenRe)) {
    if (!match[1].includes("_")) continue;
    documented.add(match[1]);
  }
  return documented;
}

function sorted(iterable) {
  return [...iterable].sort((a, b) => a.localeCompare(b));
}

function namesMissingFromDocs(names, documented) {
  return sorted([...names].filter((name) => !documented.has(name)));
}

function printSection(title, rows) {
  if (rows.length === 0) return;
  console.error(title);
  for (const row of rows) {
    console.error(`  - ${row}`);
  }
  console.error("");
}

function main() {
  const documented = collectDocumentedNames();
  const runtimeUsage = collectRuntimeEnvUsage();
  const exampleUsage = collectExampleEnvNames();
  const catalogNames = collectCatalogNames();

  const runtimeMissing = namesMissingFromDocs(runtimeUsage.keys(), documented).map((name) => {
    const files = sorted(runtimeUsage.get(name) ?? []).join(", ");
    return `${name} (used in ${files})`;
  });

  const exampleMissing = namesMissingFromDocs(exampleUsage.keys(), documented).map((name) => {
    const files = sorted(exampleUsage.get(name) ?? []).join(", ");
    return `${name} (listed in ${files})`;
  });

  const catalogMissing = namesMissingFromDocs(catalogNames, documented).map((name) => name);

  const documentedOnly = sorted(
    [...documented].filter(
      (name) =>
        !ignoredDocumentedOnlyWarnings.has(name) &&
        !runtimeUsage.has(name) &&
        !exampleUsage.has(name) &&
        !catalogNames.has(name),
    ),
  );

  if (runtimeMissing.length || exampleMissing.length || catalogMissing.length) {
    console.error(
      "[check:env-docs] Environment docs drift detected against docs/ops/environment-matrix.md",
    );
    console.error("");
    printSection("Runtime/build env names missing from the matrix:", runtimeMissing);
    printSection("Example-file env names missing from the matrix:", exampleMissing);
    printSection("CI/catalog env names missing from the matrix:", catalogMissing);
    console.error("Fix by updating docs/ops/environment-matrix.md (and examples/catalog if needed).");
    process.exit(1);
  }

  console.log(
    `[check:env-docs] OK — ${runtimeUsage.size} runtime/build env names, ${exampleUsage.size} example env names, ${catalogNames.size} catalog env names documented`,
  );
  if (documentedOnly.length) {
    console.warn(
      `[check:env-docs] Warning — ${documentedOnly.length} documented env name(s) were not seen in runtime scan, examples, or CI catalog: ${documentedOnly.join(", ")}`,
    );
  }
}

main();
