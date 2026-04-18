#!/usr/bin/env node
/**
 * scripts/lint-view-migrations.mjs
 *
 * Fails (exit 1) when a migration uses `CREATE OR REPLACE VIEW <name>` for a
 * view that was already defined in an EARLIER migration AND the new column
 * list isn't a strict append-only extension of the previous one.
 *
 * Why this exists:
 *   Postgres `CREATE OR REPLACE VIEW` only allows adding new columns at the
 *   END of the SELECT list. Renaming a column, reordering, or inserting one
 *   in the middle errors out with:
 *     "cannot change name of view column"
 *     "cannot drop columns from view"
 *   That breaks `supabase db reset` and any fresh deploy, even though the
 *   live DB looks fine because it was built up incrementally.
 *
 * Safe alternative (recommended for any non-append-only change):
 *   DROP VIEW IF EXISTS public.<name> CASCADE;
 *   CREATE VIEW public.<name> AS ...;
 *   -- re-apply ALTER VIEW ... SET (...) and GRANTs
 *
 * Usage:
 *   node scripts/lint-view-migrations.mjs
 *   npm run check:view-migrations
 *
 * Exit codes:
 *   0  no violations (or only safe append-only redefinitions)
 *   1  at least one unsafe CREATE OR REPLACE VIEW found
 *   2  internal error (couldn't read migrations dir, etc.)
 *
 * Limitations (intentional — keep the script simple):
 *   - We compare TOP-LEVEL select column aliases only. Nested subqueries,
 *     CTE columns, etc. are ignored.
 *   - We require a trailing `;` on the CREATE VIEW statement.
 *   - We don't try to evaluate dynamic SQL or DO blocks.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const MIGRATIONS_DIR = resolve(process.cwd(), 'supabase', 'migrations');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// ---------- helpers ---------------------------------------------------------

/** Strip SQL comments so we don't match CREATE VIEW inside `-- ...` lines. */
function stripSqlComments(sql) {
  // Block comments
  let out = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  // Line comments
  out = out.replace(/--[^\n]*/g, '');
  return out;
}

/**
 * Find every CREATE [OR REPLACE] VIEW statement in a migration file.
 * Returns: [{ kind: 'create' | 'replace', name: 'public.foo', columns: [...] }, ...]
 */
function findViewStatements(rawSql) {
  const sql = stripSqlComments(rawSql);
  const stmts = [];

  // Match `CREATE [OR REPLACE] VIEW [public.]<name> AS <body> ;`
  // We capture greedily up to the next `;` that isn't inside parens.
  // For column extraction we look at the FIRST top-level SELECT.
  const re = /CREATE\s+(OR\s+REPLACE\s+)?VIEW\s+(?:(public)\.)?([a-zA-Z_][a-zA-Z0-9_]*)\s+AS\s+([\s\S]*?);/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const isReplace = !!m[1];
    const schema = m[2] || 'public';
    const name = `${schema}.${m[3]}`;
    const body = m[4];

    const columns = extractTopLevelSelectColumns(body);
    stmts.push({ kind: isReplace ? 'replace' : 'create', name, columns, body });
  }
  return stmts;
}

/**
 * Extract column aliases from the FIRST top-level SELECT in a view body.
 * Returns an array of lower-cased alias names, or null if we can't parse it
 * (e.g. `SELECT *`, dynamic SQL).
 *
 * We track parenthesis depth so we ignore commas inside function calls,
 * subqueries, and CASE expressions.
 */
function extractTopLevelSelectColumns(body) {
  // Find the first SELECT keyword at depth 0
  const selectMatch = body.match(/^\s*SELECT\s+/i);
  if (!selectMatch) return null;

  let i = selectMatch[0].length;
  // Reject SELECT * — we can't compare those at all
  if (/^\s*\*/.test(body.slice(i))) return null;

  // Walk forward until we hit FROM at depth 0
  let depth = 0;
  let start = i;
  const parts = [];

  while (i < body.length) {
    const c = body[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (depth === 0) {
      if (c === ',') {
        parts.push(body.slice(start, i));
        start = i + 1;
      } else {
        // Look for FROM keyword at word boundary
        const tail = body.slice(i);
        const fromMatch = tail.match(/^FROM\s/i);
        if (fromMatch) {
          parts.push(body.slice(start, i));
          break;
        }
      }
    }
    i++;
  }
  if (parts.length === 0) return null;

  return parts.map(extractAlias).filter(Boolean);
}

/**
 * Pull the column alias out of a single SELECT-list entry.
 * Handles `expr AS alias`, `expr alias`, `tbl.col`, and bare identifiers.
 */
function extractAlias(rawPart) {
  const part = rawPart.trim();
  if (!part) return null;

  // 1) `... AS alias`
  const asMatch = part.match(/\sAS\s+"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*$/i);
  if (asMatch) return asMatch[1].toLowerCase();

  // 2) Trailing bareword alias: `expr alias`. Risky for arithmetic — we only
  //    accept it when the token before the alias looks like the END of an
  //    expression (`)`, identifier, or quoted string).
  const trailingMatch = part.match(/(?:[)\]"a-zA-Z0-9_])\s+"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*$/);
  if (trailingMatch) {
    const candidate = trailingMatch[1].toLowerCase();
    // Avoid false positives where the trailing word is a SQL keyword.
    const keywords = new Set([
      'and', 'or', 'not', 'null', 'true', 'false', 'is', 'in', 'between',
      'distinct', 'all', 'asc', 'desc', 'as',
    ]);
    if (!keywords.has(candidate)) return candidate;
  }

  // 3) `tbl.col` -> col
  const dotMatch = part.match(/\.([a-zA-Z_][a-zA-Z0-9_]*)\s*$/);
  if (dotMatch) return dotMatch[1].toLowerCase();

  // 4) Bare identifier
  const bareMatch = part.match(/^"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*$/);
  if (bareMatch) return bareMatch[1].toLowerCase();

  return null;
}

/**
 * Returns true if `next` is a strict APPEND of `prev` (same prefix, optional
 * extra columns at the end). Returns false on any rename / reorder / removal.
 */
function isAppendOnly(prev, next) {
  if (!prev || !next) return false;
  if (next.length < prev.length) return false;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i] !== next[i]) return false;
  }
  return true;
}

// ---------- main ------------------------------------------------------------

let exitCode = 0;
let files;
try {
  files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // chronological by filename prefix
} catch (err) {
  console.error(`${RED}error:${RESET} couldn't read ${MIGRATIONS_DIR}: ${err.message}`);
  process.exit(2);
}

console.log(`${BOLD}Linting ${files.length} migration(s) in supabase/migrations/${RESET}`);

// Map view name -> { columns, file } from the most recent definition we've seen
const seen = new Map();

let totalReplaces = 0;
let safeReplaces = 0;
let unsafeReplaces = 0;
let unparseable = 0;

for (const file of files) {
  const path = join(MIGRATIONS_DIR, file);
  if (!statSync(path).isFile()) continue;
  const sql = readFileSync(path, 'utf8');
  const stmts = findViewStatements(sql);

  for (const stmt of stmts) {
    if (stmt.kind === 'create') {
      // First-time CREATE (no OR REPLACE). Record the column list.
      seen.set(stmt.name, { columns: stmt.columns, file });
      continue;
    }

    // CREATE OR REPLACE VIEW
    totalReplaces++;
    const prior = seen.get(stmt.name);

    // Detect "safe by construction": this file did `DROP VIEW IF EXISTS <name>`
    // before the CREATE OR REPLACE. In that case it doesn't matter what
    // columns changed.
    const droppedFirst = new RegExp(
      `DROP\\s+VIEW\\s+IF\\s+EXISTS\\s+(public\\.)?${stmt.name.split('.').pop()}\\b`,
      'i',
    ).test(stripSqlComments(sql));

    if (droppedFirst) {
      safeReplaces++;
      seen.set(stmt.name, { columns: stmt.columns, file });
      continue;
    }

    if (!prior) {
      // First sighting is a CREATE OR REPLACE — fine on its own, no prior
      // definition to clash with. Track it for future migrations.
      seen.set(stmt.name, { columns: stmt.columns, file });
      continue;
    }

    if (!prior.columns || !stmt.columns) {
      // We couldn't parse one of the column lists (SELECT *, dynamic SQL).
      // Don't fail CI on something we can't analyze — emit a warning.
      unparseable++;
      console.log(
        `${YELLOW}⚠${RESET} ${file}: CREATE OR REPLACE VIEW ${stmt.name}` +
        ` — couldn't parse column list (prior: ${prior.file}). Manual review recommended.`,
      );
      seen.set(stmt.name, { columns: stmt.columns, file });
      continue;
    }

    if (isAppendOnly(prior.columns, stmt.columns)) {
      safeReplaces++;
      seen.set(stmt.name, { columns: stmt.columns, file });
      continue;
    }

    // 🚨 Unsafe — column list changed in a way Postgres will reject.
    unsafeReplaces++;
    exitCode = 1;
    console.log('');
    console.log(`${RED}${BOLD}✗ unsafe CREATE OR REPLACE VIEW${RESET}`);
    console.log(`  file:   ${file}`);
    console.log(`  view:   ${stmt.name}`);
    console.log(`  prior:  ${prior.file}`);
    console.log(`  before: [${prior.columns.join(', ')}]`);
    console.log(`  after:  [${stmt.columns.join(', ')}]`);
    console.log(
      `  ${YELLOW}fix:${RESET} replace CREATE OR REPLACE with` +
      ` "DROP VIEW IF EXISTS ${stmt.name} CASCADE; CREATE VIEW ...;"` +
      ` and re-apply any ALTER VIEW / GRANTs. See docs/ops/migration-view-safety.md.`,
    );

    seen.set(stmt.name, { columns: stmt.columns, file });
  }
}

console.log('');
console.log(`${BOLD}── Summary ──${RESET}`);
console.log(`  total CREATE OR REPLACE VIEW:  ${totalReplaces}`);
console.log(`  ${GREEN}safe${RESET} (append-only or DROP'd first): ${safeReplaces}`);
console.log(`  ${YELLOW}unparseable${RESET} (manual review):        ${unparseable}`);
console.log(`  ${RED}unsafe${RESET} (CI failure):                ${unsafeReplaces}`);

if (exitCode === 0) {
  console.log(`\n${GREEN}${BOLD}✓ no unsafe view migrations.${RESET}`);
} else {
  console.log(`\n${RED}${BOLD}✗ ${unsafeReplaces} unsafe view migration(s) found.${RESET}`);
  console.log(`  See docs/ops/migration-view-safety.md for the fix pattern.`);
}

process.exit(exitCode);
