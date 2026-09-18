/* South End Pizza — push + install worker. No HTML cache: deploys stay live. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function safePushPath(raw) {
  const fallback = "/account";
  try {
    const base = self.location.origin;
    const u = new URL(String(raw || fallback), base);
    if (u.origin !== base) return fallback;
    if (u.protocol !== "https:" && u.protocol !== "http:") return fallback;
    return u.pathname + u.search + u.hash || fallback;
  } catch {
    return fallback;
  }
}

self.addEventListener("push", (event) => {
  let data = {
    title: "South End Pizza",
    body: "Your order is ready.",
    url: "/account",
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    try {
      const text = event.data?.text?.() ?? "";
      if (text) data.body = text;
    } catch {
      /* keep defaults */
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "South End Pizza", {
      body: data.body || "Your order is ready.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: safePushPath(data.url || "/account") },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = safePushPath(event.notification.data?.url || "/account");
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
