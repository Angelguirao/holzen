import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, Zap } from 'lucide-react';
import { toast } from 'sonner';

declare const __BUILD_TIME__: string;
declare const __APP_VERSION__: string;

/**
 * Shows the app build timestamp, SW update status, and a manual check-for-updates button.
 * Placed in Settings → About.
 */
export function AppVersionBadge({ changelogVersion }: { changelogVersion?: string | null }) {
  const [updateWaiting, setUpdateWaiting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || import.meta.env.DEV) return;

    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;

    const syncWaiting = () => {
      if (disposed) return;
      setUpdateWaiting(Boolean(registration?.waiting));
    };

    const onUpdateFound = () => {
      const installing = registration?.installing;
      if (!installing) {
        syncWaiting();
        return;
      }
      installing.addEventListener(
        'statechange',
        () => {
          if (installing.state === 'installed') syncWaiting();
        },
        { once: true },
      );
    };

    (async () => {
      try {
        registration = await navigator.serviceWorker.ready;
      } catch {
        registration = (await navigator.serviceWorker.getRegistration()) ?? undefined;
      }
      if (disposed || !registration) return;

      syncWaiting();
      registration.addEventListener('updatefound', onUpdateFound);
      navigator.serviceWorker.addEventListener('controllerchange', syncWaiting);
    })();

    return () => {
      disposed = true;
      registration?.removeEventListener('updatefound', onUpdateFound);
      navigator.serviceWorker.removeEventListener('controllerchange', syncWaiting);
    };
  }, []);

  const applyUpdate = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  };

  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      toast.error('Your browser does not support service workers.');
      return;
    }
    setChecking(true);

    // Explicit user feedback matters here: without a toast, a successful "no update"
    // check is indistinguishable from a dead button. Previously we only updated a
    // 9 px / 35 %-opacity label that was effectively invisible on mobile, which is
    // why the button "looked broken" even when it worked. Every exit path below
    // must either show `updateWaiting` UI or emit a toast.
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        toast.error('Service worker not registered yet — try again in a moment.');
        return;
      }

      // Already waiting — surface immediately, no network round-trip needed.
      if (reg.waiting) {
        setUpdateWaiting(true);
        toast.success('Update ready — tap "Update available" to reload.');
        return;
      }

      // Bypass the HTTP cache before asking the SW registration to re-check.
      // Browsers (and any CDN in front of the origin) can serve a stale `sw.js`
      // to `registration.update()`, which then concludes "no change" and leaves
      // `reg.waiting` null even when a newer build is deployed. Forcing a
      // `no-store` fetch primes the cache with the current bytes so the
      // subsequent `update()` compares against the real deploy. Same trick used
      // by the boot-time auto-checker in `src/lib/sw-update.ts` — without this
      // step the button silently no-ops for PWA users on stale caches.
      // Extra `?t=…` cache-bust defends against intermediaries that ignore
      // `Cache-Control: no-store` on the request (some mobile carriers do this).
      try {
        await fetch(`/sw.js?t=${Date.now()}`, { cache: 'no-store' });
      } catch {
        // Offline or fetch blocked — let update() try anyway; it'll fail cleanly.
      }

      // Register listeners *before* calling update() so we don't miss a
      // synchronous `updatefound`. Race the install lifecycle against a
      // generous timeout so slow networks don't produce a false negative.
      const foundInstalled = new Promise<boolean>((resolve) => {
        const timer = window.setTimeout(() => resolve(false), 8000);
        const onUpdateFound = () => {
          const sw = reg.installing;
          if (!sw) return;
          const onStateChange = () => {
            if (sw.state === 'installed') {
              sw.removeEventListener('statechange', onStateChange);
              window.clearTimeout(timer);
              resolve(true);
            } else if (sw.state === 'redundant') {
              sw.removeEventListener('statechange', onStateChange);
              window.clearTimeout(timer);
              resolve(false);
            }
          };
          sw.addEventListener('statechange', onStateChange);
        };
        reg.addEventListener('updatefound', onUpdateFound, { once: true });
      });

      await reg.update();
      const didFindUpdate = await foundInstalled;
      // After `installed` + an existing controller, the new SW is in `waiting`.
      if (didFindUpdate && reg.waiting) {
        setUpdateWaiting(true);
        toast.success('Update found — tap "Update available" to reload.');
      } else {
        toast.success("You're on the latest version.");
      }
    } catch {
      // update() can fail if offline or CORS issues
      toast.error("Couldn't reach the server — check your connection and try again.");
    } finally {
      setChecking(false);
      setLastChecked(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  const forceFullRefresh = useCallback(async () => {
    if (!confirm('This will clear the app cache and reload. Continue?')) return;
    setUpdateWaiting(false);
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* ignore */
    } finally {
      // Cache-bust query param so the HTML itself isn't served from cache
      const url = new URL(window.location.href);
      url.searchParams.set('cache-bust', String(Date.now()));
      window.location.replace(url.toString());
    }
  }, []);

  const buildDate = (() => {
    try {
      const d = new Date(__BUILD_TIME__);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
        ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return __BUILD_TIME__;
    }
  })();

  // `dev` in local, short Git SHA or `<pkg>-b<stamp>` in prod — see `resolveAppVersion` in vite.config.ts.
  const releaseTag = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'unknown';

  const isDev = import.meta.env.DEV;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {changelogVersion && (
          <span className="text-muted-foreground/60 text-sm font-sans">
            Holzen v{changelogVersion}
          </span>
        )}
        <span className="text-muted-foreground/40 text-sm font-sans">
          build {buildDate}
        </span>
        {releaseTag && releaseTag !== 'dev' && (
          <span
            className="text-muted-foreground/40 text-[10px] font-mono select-all"
            title="Release identifier — quote this when reporting a bug"
          >
            {releaseTag}
          </span>
        )}
      </div>

      {updateWaiting ? (
        <button
          type="button"
          onClick={applyUpdate}
          className="inline-flex min-h-9 min-w-[11rem] items-center justify-center gap-1 rounded-sm px-2 py-2 text-left text-[10px] font-mono text-primary/80 hover:bg-primary/5 hover:text-primary active:bg-primary/10 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Update available — tap to reload
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={checkForUpdates}
            disabled={checking || isDev}
            className="inline-flex items-center gap-1 disabled:opacity-40 transition-colors text-sm font-sans text-cyan-700"
            aria-label={isDev ? 'Update checks disabled in dev mode' : 'Check for updates'}
          >
            <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking…' : 'Check for updates'}
          </button>
          {lastChecked && !checking && !isDev && (
            <span
              className="inline-flex items-center gap-1 text-xs font-sans text-muted-foreground/70"
              aria-live="polite"
            >
              <CheckCircle2 className="h-3 w-3" />
              up to date · {lastChecked}
            </span>
          )}
          {isDev && (
            <span className="text-muted-foreground/50 text-xs font-sans">
              (dev mode — SW disabled)
            </span>
          )}
        </div>
      )}

      {!isDev && (
        <button
          type="button"
          onClick={forceFullRefresh}
          className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50 hover:text-destructive transition-colors"
        >
          <Zap className="h-3 w-3" />
          Force refresh (clear cache)
        </button>
      )}
    </div>
  );
}
