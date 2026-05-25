/**
 * Namespaced console helpers for local debugging. Filter DevTools by `[holzen:` or `holzen:boot`, etc.
 * Use for flow tracing; keep payloads small (id prefixes, lengths, flags) — no tokens or full PII.
 *
 * **When `[holzen:*]` is on (any of):**
 * - **`import.meta.env.DEV`** — local Vite dev server.
 * - **`VITE_HOLZEN_DEBUG=1`** — staging/prod-like build (e.g. `.env.prod.local` for `npm run dev:prod`).
 * - **`?holzenDebug=1`** once in the URL — sets **session** `holzen:debug` and strips the param (this tab only).
 * - **`localStorage.setItem('holzen:debug','1')`** + reload — persistent opt-in (support / power users).
 *
 * **Default production build** (none of the above): off — privacy and cleaner support screenshots.
 */
function bootstrapHolzenDebugFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("holzenDebug") !== "1") return;
    sessionStorage.setItem("holzen:debug", "1");
    params.delete("holzenDebug");
    const rest = params.toString();
    const path = window.location.pathname + window.location.hash;
    const next = rest ? `${path}?${rest}` : path;
    window.history.replaceState({}, "", next);
  } catch {
    /* ignore */
  }
}

bootstrapHolzenDebugFromUrl();

export function isHolzenDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_HOLZEN_DEBUG === "1") return true;
  try {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("holzen:debug") === "1") return true;
  } catch {
    /* ignore */
  }
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem("holzen:debug") === "1";
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
  | 'companion'
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
  /** Lazy fetch / regenerate / intervention hydration for companion-orchestrate slots (pause session). */
  companion: (msg: string, data?: Record<string, unknown>) => line('companion', msg, data),
  subscription: (msg: string, data?: Record<string, unknown>) => line('subscription', msg, data),
  manual: (msg: string, data?: Record<string, unknown>) => line('manual', msg, data),
  home: (msg: string, data?: Record<string, unknown>) => line('home', msg, data),
};
