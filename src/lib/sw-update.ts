import { toast } from "sonner";

/**
 * Registers the service worker and listens for updates.
 * When a new version is ready, shows a persistent "Update available" toast
 * with a Refresh button — the user decides when to reload.
 */
export function listenForSwUpdate() {
  if (!('serviceWorker' in navigator)) return;
  // Vite dev serves unknown paths as HTML — registering `/sw.js` throws MIME/SecurityError noise; prod build emits a real worker.
  if (import.meta.env.DEV) return;

  let refreshing = false;

  // Reload when a new SW takes control (only after user clicks Refresh)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  // Register the service worker
  navigator.serviceWorker
    .register('/sw.js', { scope: '/', updateViaCache: 'none' })
    .then((registration) => {
      const checkForUpdate = () => {
        registration.update().catch(() => {});
      };

      // Aggressive boot-time check: bypass HTTP cache so a stale `sw.js`
      // (cached by the browser or CDN) cannot hide a newer deploy.
      // This is what unsticks PWAs that "never see" updates.
      const forceFreshSwCheck = async () => {
        try {
          await fetch('/sw.js', { cache: 'no-store' });
          await registration.update();
        } catch {
          /* offline or fetch blocked — ignore */
        }
      };
      forceFreshSwCheck();

      // Check for updates periodically (every 60s)
      setInterval(checkForUpdate, 60 * 1000);

      // When returning from background (common on mobile / PWA), fetch new sw.js sooner
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });

      const showUpdateToast = (waitingSW: ServiceWorker) => {
        let applied = false;
        const apply = () => {
          if (applied) return;
          applied = true;
          waitingSW.postMessage({ type: 'SKIP_WAITING' });
        };

        toast('A new version is available', {
          duration: Infinity,
          id: 'sw-update',
          action: {
            label: 'Refresh now',
            onClick: apply,
          },
          description: 'Tap refresh when you are ready.',
        });
      };

      // If a new SW is already waiting, prompt user
      if (registration.waiting) {
        showUpdateToast(registration.waiting);
      }

      // Listen for new SW installations
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // When the new SW is installed and waiting, prompt user
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast(newWorker);
          }
        });
      });
    })
    .catch((err) => {
      console.warn('[SW] registration failed:', err);
    });
}
