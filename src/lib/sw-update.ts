import { toast } from "sonner";

/**
 * Listens for service worker updates and auto-reloads the page
 * when a new version activates. Shows a brief toast first.
 */
export function listenForSwUpdate() {
  if (!('serviceWorker' in navigator)) return;

  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    toast('Holzen updated — reloading…', { duration: 1500 });
    setTimeout(() => window.location.reload(), 1200);
  });

  setInterval(() => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.update();
    });
  }, 60 * 1000);
}
