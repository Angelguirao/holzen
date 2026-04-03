/**
 * Namespaced console helpers for local debugging. Filter DevTools by `[holzen:` or `holzen:boot`, etc.
 * Use for flow tracing; keep payloads small (id prefixes, lengths, flags) — no tokens or full PII.
 *
 * Verbose traces (TanStack Query cache): Dev build, or set `localStorage.setItem('holzen:debug','1')` and reload.
 */
export function isHolzenVerbose(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('holzen:debug') === '1';
  } catch {
    return false;
  }
}

type HolzenTag =
  | 'boot'
  | 'auth'
  | 'profile'
  | 'router'
  | 'query'
  | 'pause'
  | 'subscription';

function line(tag: HolzenTag, msg: string, data?: Record<string, unknown>) {
  const prefix = `[holzen:${tag}]`;
  if (data && Object.keys(data).length > 0) console.info(prefix, msg, data);
  else console.info(prefix, msg);
}

export const holzenLog = {
  boot: (msg: string, data?: Record<string, unknown>) => line('boot', msg, data),
  auth: (msg: string, data?: Record<string, unknown>) => line('auth', msg, data),
  profile: (msg: string, data?: Record<string, unknown>) => line('profile', msg, data),
  router: (msg: string, data?: Record<string, unknown>) => line('router', msg, data),
  query: (msg: string, data?: Record<string, unknown>) => line('query', msg, data),
  pause: (msg: string, data?: Record<string, unknown>) => line('pause', msg, data),
  subscription: (msg: string, data?: Record<string, unknown>) => line('subscription', msg, data),
};
