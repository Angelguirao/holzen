import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'legacy' || ent.name === 'node_modules') continue;
      walk(p, out);
    } else if (/\.(tsx|jsx)$/.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

let filesChanged = 0;
let replacements = 0;

for (const file of walk(root)) {
  const original = fs.readFileSync(file, 'utf8');
  const next = original.replace(/\s+role="status"/g, () => {
    replacements += 1;
    return '';
  });
  if (next !== original) {
    fs.writeFileSync(file, next);
    filesChanged += 1;
  }
}

console.log(JSON.stringify({ filesChanged, replacements }));
