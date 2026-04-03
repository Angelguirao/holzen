/**
 * Namespaced console helpers for local debugging. Filter DevTools by `[holzen:` or `holzen:boot`, etc.
 * Use for flow tracing; keep payloads small (id prefixes, lengths, flags) — no tokens or full PII.
 */
function line(tag: 'boot' | 'auth' | 'profile' | 'router', msg: string, data?: Record<string, unknown>) {
  const prefix = `[holzen:${tag}]`;
  if (data && Object.keys(data).length > 0) console.info(prefix, msg, data);
  else console.info(prefix, msg);
}

export const holzenLog = {
  boot: (msg: string, data?: Record<string, unknown>) => line('boot', msg, data),
  auth: (msg: string, data?: Record<string, unknown>) => line('auth', msg, data),
  profile: (msg: string, data?: Record<string, unknown>) => line('profile', msg, data),
  router: (msg: string, data?: Record<string, unknown>) => line('router', msg, data),
};
