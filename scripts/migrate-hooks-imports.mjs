import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const srcRoot = join(root, 'src');

const replacements = [
  ["@/hooks/use-auth", "@/features/auth/public"],
  ["@/hooks/use-toast", "@/components/ui/use-toast"],
  ["@/lib/use-feature-flag", "@/app/hooks/use-feature-flag"],
  ["@/lib/use-pull-to-refresh", "@/app/hooks/use-pull-to-refresh"],
  ["@/lib/use-infinite-scroll", "@/app/hooks/use-infinite-scroll"],
  ["@/lib/use-latest-ref", "@/app/hooks/use-latest-ref"],
  ["@/hooks/use-feature-flag", "@/app/hooks/use-feature-flag"],
  ["@/hooks/use-pull-to-refresh", "@/app/hooks/use-pull-to-refresh"],
  ["@/hooks/use-infinite-scroll", "@/app/hooks/use-infinite-scroll"],
  ["@/hooks/use-latest-ref", "@/app/hooks/use-latest-ref"],
  ["@/hooks/use-install-prompt", "@/app/hooks/use-install-prompt"],
  ["@/hooks/use-mobile", "@/components/ui/use-mobile"],
  ["@/hooks/use-pause-stats-data", "@/legacy/full-shell/src/hooks/use-pause-stats-data"],
  ["@/hooks/use-badges", "@/legacy/full-shell/src/hooks/use-badges"],
  ["@/hooks/use-badge-sync", "@/legacy/full-shell/src/hooks/use-badge-sync"],
  ["@/hooks/use-tools-hub-data", "@/legacy/full-shell/src/hooks/use-tools-hub-data"],
];

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx?)$/.test(name)) files.push(p);
  }
  return files;
}

let count = 0;
for (const file of walk(srcRoot)) {
  let text = readFileSync(file, 'utf8');
  let next = text;
  for (const [from, to] of replacements) next = next.split(from).join(to);
  if (next !== text) {
    writeFileSync(file, next);
    count++;
  }
}

const docPaths = [
  join(root, 'docs/ops/feature-flags.md'),
  join(root, 'docs/fundamentals/client-src-layout.md'),
  join(root, 'src/features/auth/README.md'),
];
for (const file of docPaths) {
  try {
    let text = readFileSync(file, 'utf8');
    let next = text;
    for (const [from, to] of replacements) next = next.split(from).join(to);
    next = next.replace(
      /\| `src\/hooks\/`[^\n]+\n/g,
      '| `src/lib/use-*.ts`, `components/ui/use-*.ts`, `app/hooks/` | Shared UI utilities | Cross-route helpers (toast, flags, gestures) |\n',
    );
    next = next.replace(
      /\*\*App wiring:\*\*[^\n]+\n[^\n]+\n/,
      '**App wiring:** import `AuthProvider` / `useAuth` from `@/features/auth/public` only.\n\n',
    );
    if (next !== text) writeFileSync(file, next);
  } catch {
    /* optional */
  }
}

console.log(`migrate-hooks-imports: updated ${count} src file(s)`);
