import { defineConfig } from 'astro/config';

/** @see docs/ops/marketing-site-split.md */
export default defineConfig({
  site: 'https://holzen.app',
  output: 'static',
  build: {
    format: 'directory',
  },
});
