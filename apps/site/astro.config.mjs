import { defineConfig } from 'astro/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const holzenRoot = fileURLToPath(new URL('../..', import.meta.url));
const designTokensRoot = path.resolve(holzenRoot, 'packages/design-tokens');

/** @see docs/ops/marketing-site-split.md — waitlist landing is SPA `/welcome` (Make port). */
export default defineConfig({
  site: 'https://holzen.app',
  output: 'static',
  build: {
    format: 'directory',
  },
  vite: {
    envDir: '../../',
    envPrefix: ['PUBLIC_', 'VITE_'],
    resolve: {
      alias: {
        '@holzen/design-tokens': designTokensRoot,
      },
    },
  },
});
