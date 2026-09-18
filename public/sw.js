/* South End Pizza — push + install worker. No HTML cache: deploys stay live. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function sameOriginUrl(raw) {
  const fallback = "/account";
  try {
    const next = new URL(String(raw || fallback), self.location.origin);
    if (next.origin !== self.location.origin) return new URL(fallback, self.location.origin).href;
    if (next.protocol !== "http:" && next.protocol !== "https:") {
      return new URL(fallback, self.location.origin).href;
    }
    return next.href;
  } catch {
    return new URL(fallback, self.location.origin).href;
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
      data: { url: sameOriginUrl(data.url) },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = sameOriginUrl(event.notification.data?.url);
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
