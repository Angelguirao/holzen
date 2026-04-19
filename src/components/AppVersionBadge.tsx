import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle2, Zap } from 'lucide-react';

declare const __BUILD_TIME__: string;

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

    const check = async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg?.waiting) setUpdateWaiting(true);
    };
    check();

    const onControllerChange = () => setUpdateWaiting(false);
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  const applyUpdate = async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  };

  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    setChecking(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return;

      // Already waiting — surface immediately, no network round-trip needed.
      if (reg.waiting) {
        setUpdateWaiting(true);
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
      try {
        await fetch('/sw.js', { cache: 'no-store' });
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
      }
    } catch {
      // update() can fail if offline or CORS issues
    } finally {
      setChecking(false);
      setLastChecked(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
    }
  }, []);

  const forceFullRefresh = useCallback(async () => {
    if (!confirm('This will clear the app cache and reload. Continue?')) return;
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

  const isDev = import.meta.env.DEV;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {changelogVersion && (
          <span className="text-[10px] font-mono text-muted-foreground/60">
            Holzen v{changelogVersion}
          </span>
        )}
        <span className="text-[9px] font-mono text-muted-foreground/40">
          build {buildDate}
        </span>
      </div>

      {updateWaiting ? (
        <button
          type="button"
          onClick={applyUpdate}
          className="inline-flex items-center gap-1 text-[10px] font-mono text-primary/80 hover:text-primary transition-colors"
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
            className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/50 hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking…' : 'Check for updates'}
          </button>
          {lastChecked && !checking && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground/35">
              <CheckCircle2 className="h-2.5 w-2.5" />
              up to date · {lastChecked}
            </span>
          )}
          {isDev && (
            <span className="text-[9px] font-mono text-muted-foreground/30">(dev mode — SW disabled)</span>
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
