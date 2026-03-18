import { toast } from "sonner";

/**
 * Registers the service worker and listens for updates.
 * When a new version activates, shows a toast then reloads.
 */
export function listenForSwUpdate() {
  if (!('serviceWorker' in navigator)) return;

  let refreshing = false;

  // Reload when a new SW takes control
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    toast('Holzen updated — reloading…', { duration: 1500 });
    setTimeout(() => window.location.reload(), 1200);
  });

  // Register the service worker
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      // Check for updates periodically (every 60s)
      setInterval(() => registration.update(), 60 * 1000);

      // If a new SW is already waiting (installed before this page loaded), activate it
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // Listen for new SW installations
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // When the new SW is installed and waiting, activate it immediately
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    })
    .catch((err) => {
      console.warn('[SW] registration failed:', err);
    });
}
