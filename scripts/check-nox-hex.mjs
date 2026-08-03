#!/usr/bin/env node
/**
 * Forbid hardcoded legacy Holzen hex colors in active src/ (excludes src/legacy/**).
 * Use Tailwind nox tokens instead: text-nox-text-highlight, bg-nox-background-deep, etc.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'src');

const FORBIDDEN_HEX = [
  { re: /#dbb366/i, label: 'brand highlight — use text-nox-text-highlight or nox.text.highlight' },
  { re: /#0f172a/i, label: 'legacy slate background — use bg-nox-background-deep or bg-background' },
  { re: /#24b2c8/i, label: 'legacy cyan link — use text-nox-text-link' },
  { re: /#22d3ee/i, label: 'bright cyan — use text-nox-text-link or nox.accent.cyan' },
];

const EXTENSIONS = new Set(['.ts', '.tsx', '.css', '.astro']);

/** Figma Make pixel ports that intentionally keep source hexes. */
const ALLOWLIST = new Set([
  'src/screens/marketing/welcome/WelcomeLandingScreen.tsx',
]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(srcRoot, full).replace(/\\/g, '/');
    if (rel.startsWith('legacy/')) continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
      continue;
    }
    const ext = name.slice(name.lastIndexOf('.'));
    if (EXTENSIONS.has(ext)) files.push(full);
  }
  return files;
}

function main() {
  const violations = [];
  for (const file of walk(srcRoot)) {
    const content = readFileSync(file, 'utf8');
    const rel = relative(root, file).replace(/\\/g, '/');
    if (ALLOWLIST.has(rel)) continue;
    for (const { re, label } of FORBIDDEN_HEX) {
      if (re.test(content)) {
        violations.push({ file: rel, label, pattern: re.source });
      }
    }
  }

  if (violations.length > 0) {
    console.error('Nox hex check failed — hardcoded colors in active src/:');
    for (const v of violations) {
      console.error(`  - ${v.file}: ${v.label} (${v.pattern})`);
    }
    process.exit(1);
  }

  console.log('Nox hex check ok (no forbidden legacy colors in active src/).');
}

main();
