self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(payload.title || "Tanyora", {
      body: payload.body || "Vous avez une nouvelle notification.",
      icon: "/favicon/favicon.svg",
      badge: "/favicon/favicon.svg",
      data: { href: payload.href || "/profil" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/profil";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      return existing ? existing.focus() : clients.openWindow(href);
    }),
  );
});
