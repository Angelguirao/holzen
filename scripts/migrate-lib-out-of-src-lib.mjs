/**
 * Move domain modules out of src/lib into features/screens/hooks/legacy.
 * Run: node scripts/migrate-lib-out-of-src-lib.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** [fromRelative, toRelative] — file moves under repo root */
const MOVES = [
  // Home screen lib
  ['src/lib/home-app-layout-outlet.ts', 'src/screens/home/lib/home-app-layout-outlet.ts'],
  ['src/lib/home-customize-section-copy.ts', 'src/screens/home/lib/home-customize-section-copy.ts'],
  ['src/lib/home-hero-quote.ts', 'src/screens/home/lib/home-hero-quote.ts'],
  ['src/lib/home-pause-navigate.ts', 'src/screens/home/lib/home-pause-navigate.ts'],
  ['src/lib/home-pause-widget-error.ts', 'src/screens/home/lib/home-pause-widget-error.ts'],
  ['src/lib/home-section-order-normalize.ts', 'src/screens/home/lib/home-section-order-normalize.ts'],
  ['src/lib/home-section-visibility-constants.ts', 'src/screens/home/lib/home-section-visibility-constants.ts'],
  ['src/lib/notification-tone.ts', 'src/screens/home/lib/notification-tone.ts'],
  ['src/lib/next-cron-quarter.ts', 'src/screens/home/lib/next-cron-quarter.ts'],
  ['src/lib/home-customize-section-copy.test.ts', 'src/screens/home/lib/home-customize-section-copy.test.ts'],
  ['src/lib/home-hero-quote.test.ts', 'src/screens/home/lib/home-hero-quote.test.ts'],
  ['src/lib/home-pause-navigate.test.ts', 'src/screens/home/lib/home-pause-navigate.test.ts'],
  ['src/lib/home-pause-widget-error.test.ts', 'src/screens/home/lib/home-pause-widget-error.test.ts'],
  ['src/lib/home-section-order-normalize.test.ts', 'src/screens/home/lib/home-section-order-normalize.test.ts'],
  // Admin screen lib
  ['src/lib/admin-applied-migrations-query.ts', 'src/screens/admin/lib/admin-applied-migrations-query.ts'],
  ['src/lib/admin-app-config-tools-query.ts', 'src/screens/admin/lib/admin-app-config-tools-query.ts'],
  ['src/lib/admin-companion-fallbacks-query.ts', 'src/screens/admin/lib/admin-companion-fallbacks-query.ts'],
  ['src/lib/admin-cost-analytics-query.ts', 'src/screens/admin/lib/admin-cost-analytics-query.ts'],
  ['src/lib/admin-delete.ts', 'src/screens/admin/lib/admin-delete.ts'],
  ['src/lib/admin-dev-mode-setting-query.ts', 'src/screens/admin/lib/admin-dev-mode-setting-query.ts'],
  ['src/lib/admin-provider-health-query.ts', 'src/screens/admin/lib/admin-provider-health-query.ts'],
  ['src/lib/admin-query-namespace.ts', 'src/screens/admin/lib/admin-query-namespace.ts'],
  ['src/lib/admin-source-suggestions-query.ts', 'src/screens/admin/lib/admin-source-suggestions-query.ts'],
  ['src/lib/admin-stats-bundle-query.ts', 'src/screens/admin/lib/admin-stats-bundle-query.ts'],
  // Marketing screen lib
  ['src/lib/blog-post-query.ts', 'src/screens/marketing/lib/blog-post-query.ts'],
  ['src/lib/changelog-query.ts', 'src/features/user/infrastructure/queries/changelog-query.ts'],
  ['src/lib/email-unsubscribe-query.ts', 'src/screens/marketing/lib/email-unsubscribe-query.ts'],
  ['src/lib/landing-testimonials-query.ts', 'src/screens/marketing/lib/landing-testimonials-query.ts'],
  ['src/lib/roadmap-query.ts', 'src/screens/marketing/lib/roadmap-query.ts'],
  // Ops
  ['src/lib/edge-coverage-heartbeats-query.ts', 'src/screens/ops/lib/edge-coverage-heartbeats-query.ts'],
  // Shared hooks (were wrongly under lib/)
  ['src/lib/use-feature-flag.ts', 'src/hooks/use-feature-flag.ts'],
  ['src/lib/use-infinite-scroll.ts', 'src/hooks/use-infinite-scroll.ts'],
  ['src/lib/use-latest-ref.ts', 'src/hooks/use-latest-ref.ts'],
  ['src/lib/use-pull-to-refresh.ts', 'src/hooks/use-pull-to-refresh.ts'],
  // Features — subscription
  ['src/lib/limit-upsell.ts', 'src/features/subscription/application/limit-upsell.ts'],
  // Features — auth
  ['src/lib/signup-gate.ts', 'src/features/auth/application/signup-gate.ts'],
  ['src/lib/signup-gate.test.ts', 'src/features/auth/application/signup-gate.test.ts'],
  // Features — user queries
  ['src/lib/referral-query.ts', 'src/features/user/infrastructure/queries/referral-query.ts'],
  ['src/lib/quiet-windows-query.ts', 'src/features/user/infrastructure/queries/quiet-windows-query.ts'],
  ['src/lib/signal-sources-catalog-query.ts', 'src/features/user/infrastructure/queries/signal-sources-catalog-query.ts'],
  ['src/lib/threshold-volatility-estimator-query.ts', 'src/features/user/infrastructure/queries/threshold-volatility-estimator-query.ts'],
  ['src/lib/holzen-number-query.ts', 'src/features/user/infrastructure/queries/holzen-number-query.ts'],
  // Features — pause
  ['src/lib/archive-segment.ts', 'src/features/pause/domain/archive-segment.ts'],
  ['src/lib/archive-segment.test.ts', 'src/features/pause/domain/archive-segment.test.ts'],
  ['src/lib/grounding-enrichment-query.ts', 'src/features/pause/infrastructure/queries/grounding-enrichment-query.ts'],
  ['src/lib/related-biases-ground-nudge-query.ts', 'src/features/pause/infrastructure/queries/related-biases-ground-nudge-query.ts'],
  ['src/lib/wisdom-quotes.ts', 'src/features/pause/application/session/wisdom-quotes.ts'],
  ['src/lib/writing-surface.ts', 'src/features/pause/domain/writing-surface.ts'],
  ['src/lib/library-source-label.ts', 'src/features/pause/domain/library-source-label.ts'],
  ['src/lib/normalize-library-source-type.ts', 'src/features/pause/domain/normalize-library-source-type.ts'],
  ['src/lib/library-source-label.test.ts', 'src/features/pause/domain/library-source-label.test.ts'],
  ['src/lib/normalize-library-source-type.test.ts', 'src/features/pause/domain/normalize-library-source-type.test.ts'],
  ['src/lib/library-item-url.ts', 'src/features/pause/domain/library-item-url.ts'],
  ['src/lib/library-item-url.test.ts', 'src/features/pause/domain/library-item-url.test.ts'],
  // Legacy-only — colocate under full-shell lib
  ['src/lib/companion-strict.ts', 'src/legacy/full-shell/src/lib/companion-strict.ts'],
  ['src/lib/router-location-state.ts', 'src/legacy/full-shell/src/lib/router-location-state.ts'],
  ['src/lib/practice-query-namespace.ts', 'src/legacy/full-shell/src/lib/practice-query-namespace.ts'],
  ['src/lib/grounding-chime.ts', 'src/legacy/full-shell/src/lib/grounding-chime.ts'],
  ['src/lib/grounding-activity-label.ts', 'src/legacy/full-shell/src/lib/grounding-activity-label.ts'],
  ['src/lib/mempool-space-block-data.ts', 'src/legacy/full-shell/src/lib/mempool-space-block-data.ts'],
];

const DELETE_IF_EXISTS = ['src/lib/skill-detection.ts'];

/** @/lib/foo -> new path (sorted longest first at runtime) */
function buildImportReplacements() {
  const reps = [];
  for (const [from, to] of MOVES) {
    const fromBase = from.replace(/^src\/lib\//, '').replace(/\.tsx?$/, '');
    const toImport = '@/' + to.replace(/^src\//, '').replace(/\.tsx?$/, '');
    reps.push([`@/lib/${fromBase}`, toImport]);
  }
  // Legacy paths for modules moved into legacy/full-shell
  reps.push(['@/legacy/full-shell/src/lib/companion-strict', '@/legacy/full-shell/src/lib/companion-strict']);
  reps.push(['@/legacy/full-shell/src/lib/router-location-state', '@/legacy/full-shell/src/lib/router-location-state']);
  reps.push(['@/legacy/full-shell/src/lib/practice-query-namespace', '@/legacy/full-shell/src/lib/practice-query-namespace']);
  reps.push(['@/legacy/full-shell/src/lib/grounding-chime', '@/legacy/full-shell/src/lib/grounding-chime']);
  reps.push(['@/legacy/full-shell/src/lib/grounding-activity-label', '@/legacy/full-shell/src/lib/grounding-activity-label']);
  reps.push(['@/legacy/full-shell/src/lib/mempool-space-block-data', '@/legacy/full-shell/src/lib/mempool-space-block-data']);
  // Broken legacy imports that never had src/lib files
  reps.push(['@/legacy/full-shell/src/lib/tools-hub-data-query', '@/legacy/full-shell/src/lib/tools-hub-data-query']);
  reps.push(['@/legacy/full-shell/src/lib/tools-hub-practice-suggestions', '@/legacy/full-shell/src/lib/tools-hub-practice-suggestions']);
  reps.push(['@/legacy/full-shell/src/lib/tools-catalog', '@/legacy/full-shell/src/lib/tools-catalog']);
  reps.push(['@/legacy/full-shell/src/lib/guided-journal-prompts-query', '@/legacy/full-shell/src/lib/guided-journal-prompts-query']);
  reps.push(['@/legacy/full-shell/src/lib/night-reflection-visible-query', '@/legacy/full-shell/src/lib/night-reflection-visible-query']);
  reps.push(['@/legacy/full-shell/src/lib/home-quick-capture-last-pause-query', '@/legacy/full-shell/src/lib/home-quick-capture-last-pause-query']);
  return reps.sort((a, b) => b[0].length - a[0].length);
}

function ensureDir(filePath) {
  mkdirSync(dirname(join(root, filePath)), { recursive: true });
}

function moveFile(fromRel, toRel) {
  const from = join(root, fromRel);
  const to = join(root, toRel);
  if (!existsSync(from)) {
    console.warn('skip missing', fromRel);
    return false;
  }
  if (existsSync(to)) {
    console.warn('skip exists', toRel);
    unlinkSync(from);
    return false;
  }
  ensureDir(toRel);
  renameSync(from, to);
  console.log('moved', fromRel, '->', toRel);
  return true;
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (/\.(tsx?|mjs|md)$/.test(name)) files.push(p);
  }
  return files;
}

// 1. Move files
for (const [from, to] of MOVES) {
  moveFile(from, to);
}
for (const rel of DELETE_IF_EXISTS) {
  const p = join(root, rel);
  if (existsSync(p)) {
    unlinkSync(p);
    console.log('deleted', rel);
  }
}

// 2. Fix internal imports in moved files (same-folder relative + cross lib)
const replacements = buildImportReplacements();
const patchDirs = [
  join(root, 'src'),
  join(root, 'scripts'),
  join(root, 'docs'),
];
let changed = 0;
for (const dir of patchDirs) {
  if (!existsSync(dir)) continue;
  for (const file of walk(dir)) {
    let text = readFileSync(file, 'utf8');
    let next = text;
    for (const [from, to] of replacements) {
      next = next.split(from).join(to);
    }
    if (next !== text) {
      writeFileSync(file, next);
      changed++;
    }
  }
}
console.log(`\n${changed} file(s) import paths updated`);
