import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Zap } from 'lucide-react';

declare const __BUILD_TIME__: string;
declare const __APP_VERSION__: string;

/**
 * Shows the app build timestamp, SW update status, and a manual check-for-updates button.
 * Placed in Settings → About.
 */
export function AppVersionBadge({ changelogVersion }: { changelogVersion?: string | null }) {
  const [updateWaiting, setUpdateWaiting] = useState(false);

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
            Changelog v{changelogVersion}
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
      {!isDev && (
        <p className="text-muted-foreground/50 text-xs font-sans">
          Updates are checked automatically while the app is open.
        </p>
      )}

      {updateWaiting ? (
        <button
          type="button"
          onClick={applyUpdate}
          className="inline-flex min-h-9 min-w-[11rem] items-center justify-center gap-1 rounded-sm px-2 py-2 text-left text-[10px] font-mono text-muted-foreground hover:bg-muted/40 hover:text-foreground active:bg-muted/60 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Update available — tap to reload
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
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
