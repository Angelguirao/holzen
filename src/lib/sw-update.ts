import { toast } from "sonner";

/**
 * Registers the service worker and listens for updates.
 * When a new version is ready, shows a persistent "Update available" toast
 * with a Refresh button — the user decides when to reload.
 */
export function listenForSwUpdate() {
  if (!('serviceWorker' in navigator)) return;

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
      // Check for updates periodically (every 60s)
      setInterval(() => registration.update(), 60 * 1000);

      const showUpdateToast = (waitingSW: ServiceWorker) => {
        toast('A new version is available', {
          duration: Infinity,
          id: 'sw-update',
          action: {
            label: 'Refresh',
            onClick: () => {
              waitingSW.postMessage({ type: 'SKIP_WAITING' });
            },
          },
          cancel: {
            label: 'Later',
            onClick: () => {},
          },
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
