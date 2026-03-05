// Custom service worker for push notifications
// This file is used with vite-plugin-pwa injectManifest

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "Holzen";
  const options = {
    body: data.body || "A moment to pause.",
    icon: "/icon-512.png",
    badge: "/icon-512.png",
    tag: "holzen-reflection",
    renotify: true,
    data: { url: "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
