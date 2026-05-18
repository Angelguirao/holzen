/**
 * Forbidden imports/paths in active src/ (excludes src/legacy/**).
 * See docs/ops/active-surface.md and pause-first plan §18.2.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(root, 'src');

const FORBIDDEN_PATTERNS = [
  { re: /@\/legacy\//, label: '@/legacy/* import from active tree' },
  { re: /@\/components\/stats\//, label: '@/components/stats/*' },
  { re: /@\/lib\/badges\//, label: '@/lib/badges/*' },
  { re: /@\/lib\/stats\//, label: '@/lib/stats/*' },
  { re: /@\/pages\/Profile/, label: '@/pages/Profile' },
  { re: /@\/pages\/ToolsHub/, label: '@/pages/ToolsHub' },
  { re: /@\/hooks\/use-pause-stats-data/, label: '@/hooks/use-pause-stats-data' },
  { re: /@\/hooks\/use-badge-sync/, label: '@/hooks/use-badge-sync' },
  { re: /@\/hooks\/use-badges/, label: '@/hooks/use-badges' },
  { re: /@\/hooks\/use-tools-hub-data/, label: '@/hooks/use-tools-hub-data' },
  { re: /@\/components\/PracticeWidget/, label: '@/components/PracticeWidget (legacy full-shell)' },
  { re: /@\/components\/LetterToFutureSelf/, label: '@/components/LetterToFutureSelf (legacy full-shell)' },
  { re: /@\/components\/BadgeCelebration/, label: '@/components/BadgeCelebration (legacy full-shell)' },
  { re: /@\/components\/InsightsPanel/, label: '@/components/InsightsPanel (legacy full-shell)' },
  { re: /@\/components\/library\/HistoryContent/, label: '@/components/library/HistoryContent (legacy full-shell)' },
  { re: /@\/hooks\/use-practice-suggestion/, label: '@/hooks/use-practice-suggestion (legacy full-shell)' },
  { re: /@\/lib\/practice-suggestion/, label: '@/lib/practice-suggestion (legacy full-shell)' },
  { re: /@\/lib\/practice-entries-weekly-count-query/, label: '@/lib/practice-entries-weekly-count-query (legacy full-shell)' },
  { re: /@\/lib\/practice-primary-suggestion-query/, label: '@/lib/practice-primary-suggestion-query (legacy full-shell)' },
  { re: /@\/lib\/future-letters-query/, label: '@/lib/future-letters-query (legacy full-shell)' },
  { re: /@\/lib\/future-letter-validation/, label: '@/lib/future-letter-validation (legacy full-shell)' },
  { re: /@\/lib\/history-calendar-activities-fetch/, label: '@/lib/history-calendar-activities-fetch (legacy full-shell)' },
  { re: /@\/lib\/history-calendar-activities-query-key/, label: '@/lib/history-calendar-activities-query-key (legacy full-shell)' },
  { re: /@\/lib\/user-badge-ids-query/, label: '@/lib/user-badge-ids-query (legacy full-shell)' },
  { re: /@\/lib\/ground-history-query/, label: '@/lib/ground-history-query (legacy full-shell)' },
  { re: /@\/lib\/pause-replay-thread/, label: '@/lib/pause-replay-thread (legacy full-shell)' },
];

/** Tier B tables dropped at MVP cutover — no `.from('…')` in active src. */
const TIER_B_TABLES = [
  'practice_entries',
  'user_badges',
  'badge_definitions',
  'future_letters',
  'reflection_insights',
  'night_reflections',
];

const TIER_B_FROM_RES = TIER_B_TABLES.map(
  (t) => ({ re: new RegExp(`\\.from\\(['"]${t}['"]\\)`), label: `.from('${t}') (Tier B — use legacy/full-shell)` }),
);

const SKIP_TIER_B_FILES = new Set([
  'src/integrations/supabase/types.ts',
]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'legacy') continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(p);
  }
  return files;
}

const violations = [];
for (const file of walk(srcRoot)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (rel.startsWith('src/legacy/')) continue;
  const text = readFileSync(file, 'utf8');
  for (const { re, label } of FORBIDDEN_PATTERNS) {
    if (re.test(text)) {
      violations.push({ file: rel, label });
    }
  }
  if (!SKIP_TIER_B_FILES.has(rel)) {
    for (const { re, label } of TIER_B_FROM_RES) {
      if (re.test(text)) {
        violations.push({ file: rel, label });
      }
    }
  }
}

if (violations.length) {
  console.error('[check:active-surface] Forbidden patterns in active src/:');
  for (const v of violations) {
    console.error(`  ${v.file}: ${v.label}`);
  }
  process.exit(1);
}

console.log('[check:active-surface] OK — no forbidden imports in active src/');
process.exit(0);
