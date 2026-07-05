#!/usr/bin/env node
/**
 * Verifies design token single-source-of-truth:
 * - packages/design-tokens/tokens.css defines all --nox-* / --font-* raw tokens
 * - src/index.css must not redefine those (only shadcn bridge vars)
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokensPath = join(root, 'packages/design-tokens/tokens.css');
const indexPath = join(root, 'src/index.css');

const REQUIRED_NOX_VARS = [
  '--nox-color-background-primary',
  '--nox-color-background-secondary',
  '--nox-color-background-accent',
  '--nox-color-background-deep',
  '--nox-color-background-inverse',
  '--nox-color-background-overlay',
  '--nox-color-text-primary',
  '--nox-color-text-secondary',
  '--nox-color-text-muted',
  '--nox-color-text-contrast',
  '--nox-color-text-link',
  '--nox-color-text-highlight',
  '--nox-color-text-inverse-contrast',
  '--nox-color-state-success',
  '--nox-color-state-error',
  '--nox-color-state-warning',
  '--nox-color-accent-cyan',
  '--nox-color-accent-cyan-strong',
  '--nox-color-accent-green',
  '--nox-color-accent-violet',
  '--nox-color-accent-magenta',
  '--nox-color-accent-mustard',
  '--nox-color-border-default',
  '--nox-color-border-focus',
  '--nox-radius-m',
  '--font-body',
  '--font-editorial',
  '--font-mono',
];

function extractDefinedVars(css) {
  const names = new Set();
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
    names.add(match[1]);
  }
  return names;
}

function main() {
  const tokensCss = readFileSync(tokensPath, 'utf8');
  const indexCss = readFileSync(indexPath, 'utf8');
  const tokenVars = extractDefinedVars(tokensCss);
  const indexVars = extractDefinedVars(indexCss);

  const missing = REQUIRED_NOX_VARS.filter((name) => !tokenVars.has(name));
  if (missing.length > 0) {
    console.error('Design tokens check failed: tokens.css is missing required variables:');
    for (const name of missing) console.error(`  - ${name}`);
    process.exit(1);
  }

  const duplicated = [...indexVars].filter(
    (name) =>
      (name.startsWith('--nox-') || name.startsWith('--font-')) && tokenVars.has(name),
  );
  if (duplicated.length > 0) {
    console.error('Design tokens check failed: src/index.css redefines raw Nox tokens.');
    console.error('Import @holzen/design-tokens/tokens.css instead. Duplicates:');
    for (const name of duplicated.sort()) console.error(`  - ${name}`);
    process.exit(1);
  }

  if (!indexCss.includes("@holzen/design-tokens/tokens.css")) {
    console.error('Design tokens check failed: src/index.css must import @holzen/design-tokens/tokens.css');
    process.exit(1);
  }

  console.log(`Design tokens ok (${REQUIRED_NOX_VARS.length} required vars, no index.css drift).`);
}

main();
