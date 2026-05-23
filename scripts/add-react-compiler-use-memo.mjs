/**
 * Adds `"use memo";` as the first statement in exported function components
 * under home/pause components (React Compiler annotation mode pilot).
 * Skips hooks (use*) and render* helpers.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['src/screens/home/components', 'src/screens/pause/components'];

function walkDir(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(p, files);
    else if (p.endsWith('.tsx') && !p.includes('.test.')) files.push(p);
  }
  return files;
}

function addUseMemoToExports(content) {
  let changed = false;
  const updated = content.replace(
    /export function (\w+)\([\s\S]*?\)\s*(?::\s*[\s\S]*?)?\{/g,
    (match, name, offset) => {
      if (name.startsWith('use') || name.startsWith('render')) return match;
      const idx = content.indexOf(match, offset);
      const after = content.slice(idx + match.length);
      if (/^\s*"use memo";/.test(after)) return match;
      changed = true;
      return `${match}\n  "use memo";`;
    },
  );

  // Inner presentation helpers (e.g. ChartSkeleton)
  const updated2 = updated.replace(
    /^function (\w+)\([\s\S]*?\)\s*(?::\s*[\s\S]*?)?\{/gm,
    (match, name) => {
      if (name.startsWith('use') || name.startsWith('render')) return match;
      const idx = updated.indexOf(match);
      const after = updated.slice(idx + match.length);
      if (/^\s*"use memo";/.test(after)) return match;
      // Only annotate if file already uses compiler opt-in elsewhere
      if (!updated.includes('"use memo"')) return match;
      changed = true;
      return `${match}\n  "use memo";`;
    },
  );

  return { content: updated2, changed };
}

let touched = 0;
for (const root of ROOTS) {
  for (const file of walkDir(root)) {
    const raw = fs.readFileSync(file, 'utf8');
    const { content, changed } = addUseMemoToExports(raw);
    if (changed) {
      fs.writeFileSync(file, content);
      touched += 1;
      console.log(`updated ${file}`);
    }
  }
}
console.log(`Done. ${touched} file(s) updated.`);
