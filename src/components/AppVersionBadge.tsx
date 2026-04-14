import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

declare const __BUILD_TIME__: string;

/**
 * Shows the app build timestamp and whether a service-worker update is waiting.
 * Placed in Settings → About.
 */
export function AppVersionBadge({ changelogVersion }: { changelogVersion?: string | null }) {
  const [updateWaiting, setUpdateWaiting] = useState(false);

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

  const buildDate = (() => {
    try {
      const d = new Date(__BUILD_TIME__);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
        ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return __BUILD_TIME__;
    }
  })();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {changelogVersion && (
          <span className="text-[10px] font-mono text-muted-foreground/60">
            Holzen v{changelogVersion}
          </span>
        )}
        <span className="text-[9px] font-mono text-muted-foreground/40">
          build {buildDate}
        </span>
      </div>

      {updateWaiting && (
        <button
          type="button"
          onClick={applyUpdate}
          className="inline-flex items-center gap-1 text-[10px] font-mono text-primary/80 hover:text-primary transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Update available — tap to reload
        </button>
      )}
    </div>
  );
}
