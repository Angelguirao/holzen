const DEFAULT_APP_URL = 'https://app.holzen.app';

/** Product SPA origin (no trailing slash). */
export function getAppUrl(): string {
  const raw = import.meta.env.PUBLIC_APP_URL?.trim();
  if (!raw) return DEFAULT_APP_URL;
  return raw.replace(/\/$/, '');
}

export function appAuthUrl(view: 'sign-in' | 'sign-up' = 'sign-up', ref?: string | null): string {
  const params = new URLSearchParams({ view });
  if (ref) params.set('ref', ref);
  return `${getAppUrl()}/auth?${params.toString()}`;
}
