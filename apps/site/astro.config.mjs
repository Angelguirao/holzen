import { defineConfig } from 'astro/config';

/** Dev-only: Astro site has no `/` page or SPA routes — send to `/welcome`. */
function devMarketingRedirects() {
  return {
    name: 'holzen-dev-marketing-redirects',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (url === '/' || url.startsWith('/?')) {
          const qs = url.length > 1 ? url.slice(1) : '';
          res.writeHead(302, { Location: `/welcome${qs}` });
          res.end();
          return;
        }
        next();
      });
    },
  };
}

/** @see docs/ops/marketing-site-split.md */
export default defineConfig({
  site: 'https://holzen.app',
  output: 'static',
  build: {
    format: 'directory',
  },
  vite: {
    envDir: '../../',
    envPrefix: ['PUBLIC_', 'VITE_'],
    plugins: [devMarketingRedirects()],
  },
});
