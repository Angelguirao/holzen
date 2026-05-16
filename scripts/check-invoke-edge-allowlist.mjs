/**
 * Allowlisted invokeEdge('name') in active src/ (excludes src/legacy/**).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ALLOWED = new Set([
  'holzen-reflect',
  'companion-orchestrate',
  'check-subscription',
  'ensure-trial-subscription',
  'create-checkout',
  'customer-portal',
  'retry-flex-credit',
  'list-checkout-events',
  'notify-checkout-confirmation',
  'holzen-number',
  'health',
  'register-push',
  'delete-account',
  'send-feedback',
  'record-referral',
  'send-transactional-email',
  'handle-email-unsubscribe',
  'admin-check-stripe-prices',
  'process-referral-pending',
  'grounding-enrich',
]);

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'src');

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'legacy') continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const INVOKE_RE = /invokeEdge(?:<[^>]*>)?\(\s*['"`]([^'"`]+)['"`]/g;
const violations = [];

for (const file of walk(srcRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (rel.startsWith('src/legacy/')) continue;
  if (rel === 'src/lib/invoke-edge.ts') continue;
  const text = readFileSync(file, 'utf8');
  let m;
  while ((m = INVOKE_RE.exec(text)) !== null) {
    const name = m[1];
    if (!ALLOWED.has(name)) {
      violations.push({ file: rel, name });
    }
  }
}

if (violations.length) {
  console.error('[check:invoke-edge-allowlist] Disallowed invokeEdge names:');
  for (const v of violations) {
    console.error(`  ${v.file}: ${v.name}`);
  }
  process.exit(1);
}

console.log('[check:invoke-edge-allowlist] OK');
process.exit(0);
