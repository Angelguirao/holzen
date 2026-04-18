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
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      const checkForUpdate = () => {
        registration.update().catch(() => {});
      };

      // Check for updates periodically (every 60s)
      setInterval(checkForUpdate, 60 * 1000);

      // When returning from background (common on mobile / PWA), fetch new sw.js sooner
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
      window.addEventListener('focus', checkForUpdate);

      const showUpdateToast = (waitingSW: ServiceWorker) => {
        let applied = false;
        const apply = () => {
          if (applied) return;
          applied = true;
          waitingSW.postMessage({ type: 'SKIP_WAITING' });
        };

        toast('A new version is available', {
          duration: 10000,
          id: 'sw-update',
          action: {
            label: 'Refresh now',
            onClick: apply,
          },
          description: 'Auto-updating in 10s…',
        });

        // Auto-apply after 10s if the user doesn't interact — prevents PWA users
        // from getting stuck on stale builds (common on iOS / installed PWAs).
        window.setTimeout(apply, 10_000);
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
