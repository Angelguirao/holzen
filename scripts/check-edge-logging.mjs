#!/usr/bin/env node
/**
 * CI guardrail: every Supabase Edge Function entrypoint that boots an HTTP
 * server (`Deno.serve` or `serve` from std/http) MUST wrap its handler in
 * `withRequestLogging(...)` from `_shared/with-request-logging.ts`.
 *
 * Why: that wrapper is the single place we attach the `cid` correlation ID,
 * forward structured JSON to BetterStack via `observe.ts`, and route caught
 * errors to `captureEdgeError`. A function that calls `serve(handler)`
 * directly silently disappears from logs and Sentry — the failure mode is
 * "everything looks fine until an incident."
 *
 * The check is intentionally syntactic (regex over source) rather than
 * AST-based: it catches the only realistic regression (someone copy-pastes
 * an old function template) without adding a TS/Deno parse step to CI.
 *
 * Allowlist below covers entrypoints that legitimately don't serve HTTP
 * (cron handlers invoked via shared modules, pure helpers re-exported as
 * `index.ts`). Add a comment explaining *why* whenever you extend it.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fnRoot = join(__dirname, '..', 'supabase', 'functions');

// Functions that intentionally do not boot an HTTP server in `index.ts`.
// Keep this list minimal and annotated.
const ALLOWLIST = new Set([
  // (none today — every deployed function should serve HTTP through the wrapper)
]);

if (!existsSync(fnRoot)) {
  console.log('[check:edge-logging] Skipped: supabase/functions not found.');
  process.exit(0);
}

const entries = readdirSync(fnRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && e.name !== '_shared' && !ALLOWLIST.has(e.name))
  .map((e) => ({ name: e.name, path: join(fnRoot, e.name, 'index.ts') }))
  .filter((e) => existsSync(e.path) && statSync(e.path).isFile());

// Patterns that indicate the function boots an HTTP server.
// We match common shapes: `Deno.serve(`, `serve(` (after a std/http import).
const SERVE_PATTERN = /\b(?:Deno\.serve|(?<![.\w])serve)\s*\(/;
// withRequestLogging must appear (import + call). We only require the call —
// import without call would be dead code and still get flagged.
const WRAPPER_PATTERN = /\bwithRequestLogging\s*\(/;
// If `serve(` shows up but the file never imports std/http or supabase, it's
// almost certainly a different `serve` (e.g. local helper). Bias toward
// false positives — better to whitelist than to miss a real regression.
const STD_HTTP_IMPORT = /from\s+["']https:\/\/deno\.land\/std@[^"']+\/http\/server\.ts["']/;

const violations = [];
const skipped = [];

for (const { name, path } of entries) {
  const src = readFileSync(path, 'utf8');
  const usesDenoServe = /\bDeno\.serve\s*\(/.test(src);
  const usesStdServe = STD_HTTP_IMPORT.test(src) && /\bserve\s*\(/.test(src);
  const servesHttp = usesDenoServe || usesStdServe;

  if (!servesHttp) {
    skipped.push(name);
    continue;
  }

  if (!WRAPPER_PATTERN.test(src)) {
    violations.push({
      name,
      path,
      reason: usesDenoServe ? 'Deno.serve(...) without withRequestLogging' : 'serve(...) without withRequestLogging',
    });
    continue;
  }

  // Sanity: the serve call should pass the wrapper's return value, not call
  // both independently. Match `serve(\s*withRequestLogging` or `Deno.serve(\s*withRequestLogging`.
  const wrappedServe = /(?:Deno\.serve|(?<![.\w])serve)\s*\(\s*withRequestLogging\s*\(/.test(src);
  if (!wrappedServe) {
    violations.push({
      name,
      path,
      reason: 'serve(...) call does not wrap withRequestLogging(...) directly',
    });
  }
}

const total = entries.length;
console.log(
  `[check:edge-logging] Scanned ${total} function${total === 1 ? '' : 's'}; ` +
    `${total - skipped.length - violations.length} OK, ${skipped.length} non-HTTP, ${violations.length} violations.`,
);

if (violations.length > 0) {
  console.error('\n[check:edge-logging] FAIL — the following functions boot an HTTP server without withRequestLogging:\n');
  for (const v of violations) {
    console.error(`  • ${v.name}  (${v.reason})`);
    console.error(`      ${v.path}`);
  }
  console.error(
    '\nFix by importing the wrapper and wrapping the handler:\n' +
      '    import { withRequestLogging } from "../_shared/with-request-logging.ts";\n' +
      '    Deno.serve(withRequestLogging("function-name", async ({ req }) => { ... }));\n' +
      '\nIf the function intentionally does not serve HTTP, add it to ALLOWLIST in scripts/check-edge-logging.mjs with a comment.',
  );
  process.exit(1);
}

process.exit(0);
