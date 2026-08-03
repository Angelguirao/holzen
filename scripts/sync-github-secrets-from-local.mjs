#!/usr/bin/env node
/**
 * One-time helper: push known CI secrets to GitHub Actions from local files.
 * Does not print secret values.
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"#]*)"?/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

function setSecret(name, value) {
  if (!value) {
    console.log(`skip ${name} (no value)`);
    return false;
  }
  const r = spawnSync('gh', ['secret', 'set', name, '--body', value], {
    cwd: root,
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`set ${name}`);
  return true;
}

const vercelProject = existsSync(join(root, '.vercel/project.json'))
  ? JSON.parse(readFileSync(join(root, '.vercel/project.json'), 'utf8'))
  : {};

const prod = {
  ...parseEnv(join(root, '.env.prod')),
  ...parseEnv(join(root, '.env.prod.local')),
};

const githubSecrets = parseEnv(join(root, '.env.github-secrets.local'));

const literals = {
  VERCEL_ORG_ID: vercelProject.orgId,
  VERCEL_PROJECT_ID: vercelProject.projectId,
  SUPABASE_PROD_PROJECT_REF: 'geqkxsnyqvhtascjghuu',
  VITE_SUPABASE_URL: 'https://geqkxsnyqvhtascjghuu.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: prod.VITE_SUPABASE_PUBLISHABLE_KEY,
};

for (const [name, value] of Object.entries(literals)) {
  setSecret(name, value);
}

// Tokens must be supplied by the operator — never committed.
// Paste once into .env.github-secrets.local (gitignored) or export in shell.
const tokenNames = ['SUPABASE_ACCESS_TOKEN', 'VERCEL_TOKEN'];
for (const name of tokenNames) {
  const value = (process.env[name] ?? githubSecrets[name])?.trim();
  if (value) setSecret(name, value);
  else console.log(`skip ${name} (add to .env.github-secrets.local or set in shell)`);
}

console.log('Done. Run: gh secret list');
