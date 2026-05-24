/**
 * Fail when any migration leaves a CREATE [OR REPLACE] FUNCTION without a pinned
 * search_path that includes `public` (see docs/ops/migration-security-conventions.md).
 *
 * Tracks CREATE / ALTER FUNCTION SET search_path / DROP across all migrations in order.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(root, 'supabase', 'migrations');

function stripSqlComments(sql) {
  let out = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  out = out.replace(/--[^\n]*/g, '');
  return out;
}

function fnKey(name) {
  const m = name.match(/^(?:(public|extensions)\.)?([a-zA-Z_][a-zA-Z0-9_]*)/i);
  if (!m) return null;
  return `${m[1] || 'public'}.${m[2]}`;
}

function extractFunctionName(header) {
  const m = header.match(
    /FUNCTION\s+(?:(public|extensions)\.)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/i,
  );
  if (!m) return null;
  return `${m[1] || 'public'}.${m[2]}`;
}

function analyzeSearchPath(header) {
  const spRe = /SET\s+search_path\s*(?:=|TO)\s*([^;\n]+)/gi;
  let match;
  while ((match = spRe.exec(header)) !== null) {
    const path = match[1].replace(/'/g, '').trim();
    if (/\bpublic\b/i.test(path)) return true;
    return false;
  }
  return false;
}

function parseAlterSearchPath(sql) {
  const cleaned = stripSqlComments(sql);
  const alters = [];
  const re =
    /ALTER\s+FUNCTION\s+(?:(public|extensions)\.)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s+SET\s+search_path\s*(?:=|TO)\s*([^;\n]+)/gi;
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    const key = `${m[1] || 'public'}.${m[2]}`;
    const path = m[3].replace(/'/g, '').trim();
    alters.push({ key, ok: /\bpublic\b/i.test(path) });
  }
  return alters;
}

function parseDrops(sql) {
  const cleaned = stripSqlComments(sql);
  const drops = new Set();
  const re =
    /DROP\s+FUNCTION\s+(?:IF\s+EXISTS\s+)?(?:(public|extensions)\.)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gi;
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    drops.add(`${m[1] || 'public'}.${m[2]}`);
  }
  return drops;
}

function parseCreates(sql) {
  const cleaned = stripSqlComments(sql);
  const creates = [];
  const createRe = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+/gi;
  let m;
  while ((m = createRe.exec(cleaned)) !== null) {
    const start = m.index;
    const afterKeyword = m.index + m[0].length;
    const rest = cleaned.slice(afterKeyword);
    const asMatch = rest.match(/\sAS\s+(\$\$|\$[a-zA-Z_][a-zA-Z0-9_]*\$)/i);
    if (!asMatch) {
      const header = cleaned.slice(start, Math.min(cleaned.length, start + 800));
      creates.push({
        key: extractFunctionName(header),
        ok: false,
        reason: 'could not find function body AS delimiter',
      });
      continue;
    }
    const headerEnd = afterKeyword + asMatch.index;
    const header = cleaned.slice(start, headerEnd);
    const key = extractFunctionName(header);
    creates.push({
      key,
      ok: analyzeSearchPath(header),
      reason: analyzeSearchPath(header) ? null : 'missing SET search_path on CREATE',
    });
  }
  return creates;
}

/** @type {Map<string, { ok: boolean, reason: string, file: string }>} */
const registry = new Map();

function setFn(key, ok, reason, file) {
  if (!key) return;
  if (ok) {
    registry.set(key, { ok: true, reason: '', file });
    return;
  }
  registry.set(key, { ok: false, reason, file });
}

if (!statSync(migrationsDir).isDirectory()) {
  console.error('[check:sql-search-path] missing supabase/migrations/');
  process.exit(2);
}

const files = readdirSync(migrationsDir)
  .filter((n) => n.endsWith('.sql'))
  .sort();

for (const name of files) {
  const filePath = join(migrationsDir, name);
  const rel = relative(root, filePath).replace(/\\/g, '/');
  const sql = readFileSync(filePath, 'utf8');

  for (const key of parseDrops(sql)) {
    registry.delete(key);
  }

  for (const { key, ok, reason } of parseCreates(sql)) {
    setFn(key, ok, reason ?? 'missing SET search_path on CREATE', rel);
  }

  for (const { key, ok } of parseAlterSearchPath(sql)) {
    setFn(key, ok, ok ? '' : 'ALTER search_path without public', rel);
  }
}

const violations = [...registry.entries()].filter(([, v]) => !v.ok);

if (violations.length) {
  console.error('[check:sql-search-path] Functions without pinned public search_path:\n');
  for (const [key, v] of violations) {
    console.error(`  - ${key} (last touched in ${v.file}: ${v.reason})`);
  }
  console.error(
    '\nSee docs/ops/migration-security-conventions.md — add SET search_path = public on CREATE, or ALTER FUNCTION ... SET search_path = public.',
  );
  process.exit(1);
}

console.log(
  `[check:sql-search-path] OK — ${registry.size} function(s) across ${files.length} migration(s) pin public search_path`,
);
process.exit(0);
