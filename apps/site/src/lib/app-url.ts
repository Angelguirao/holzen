/**
 * Product SPA origin. Empty in production static build → same-origin on holzen.app.
 * `npm run dev:site` only serves marketing HTML; auth lives on the Vite app (:8080).
 */
function appOrigin(): string {
  const configured = import.meta.env.PUBLIC_APP_ORIGIN?.replace(/\/$/, '');
  if (configured) return configured;
  if (import.meta.env.DEV) return 'http://localhost:8080';
  return '';
}

/** Auth deep link — same-origin in unified deploy, SPA origin in local Astro dev. */
export function appAuthUrl(view: 'sign-in' | 'sign-up' = 'sign-up', ref?: string | null): string {
  const params = new URLSearchParams({ view });
  if (ref) params.set('ref', ref);
  const path = `/auth?${params.toString()}`;
  const origin = appOrigin();
  return origin ? `${origin}${path}` : path;
}
