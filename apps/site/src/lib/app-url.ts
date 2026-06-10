/** Same-origin auth links (single-domain deploy on holzen.app). */
export function appAuthUrl(view: 'sign-in' | 'sign-up' = 'sign-up', ref?: string | null): string {
  const params = new URLSearchParams({ view });
  if (ref) params.set('ref', ref);
  return `/auth?${params.toString()}`;
}
