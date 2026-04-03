/**
 * Namespaced console helpers for local debugging. Filter DevTools by `[holzen:` or `holzen:boot`, etc.
 * Use for flow tracing; keep payloads small (id prefixes, lengths, flags) — no tokens or full PII.
 *
 * **Production:** Nothing is printed unless the user opts in (`localStorage.setItem('holzen:debug','1')` + reload).
 * That keeps session/entitlement hints out of typical user consoles (privacy) and avoids misleading support
 * screenshots. **Cost:** no server or analytics usage — only `console.info` when enabled; bundle impact is negligible.
 *
 * **Dev:** All `[holzen:*]` lines are emitted so local debugging stays frictionless.
 */
export function isHolzenDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('holzen:debug') === '1';
  } catch {
    return false;
  }
}

/** Alias for {@link isHolzenDebugEnabled} (query logging and older imports). */
export const isHolzenVerbose = isHolzenDebugEnabled;

type HolzenTag =
  | 'boot'
  | 'auth'
  | 'profile'
  | 'router'
  | 'query'
  | 'pause'
  | 'subscription'
  | 'manual'
  | 'home';

function line(tag: HolzenTag, msg: string, data?: Record<string, unknown>) {
  if (!isHolzenDebugEnabled()) return;
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
  manual: (msg: string, data?: Record<string, unknown>) => line('manual', msg, data),
  home: (msg: string, data?: Record<string, unknown>) => line('home', msg, data),
};
