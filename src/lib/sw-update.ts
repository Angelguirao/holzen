/**
 * Listens for service worker updates and auto-reloads the page
 * when a new version activates. Shows a toast if the user is
 * mid-interaction, otherwise reloads silently.
 */
export function listenForSwUpdate() {
  if (!('serviceWorker' in navigator)) return;

  let refreshing = false;

  // When a new SW takes control (after skipWaiting + clients.claim),
  // reload so the page serves fresh precached assets.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  // Periodically check for SW updates (every 60s)
  // This catches updates even if the user keeps the tab open for hours
  setInterval(() => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.update();
    });
  }, 60 * 1000);
}
