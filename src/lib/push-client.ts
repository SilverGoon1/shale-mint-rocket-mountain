import { getVapidPublicKey, savePushSubscription } from "@/lib/shop-server";

function urlBase64ToUint8Array(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(base64.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export async function registerShopWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function enableOrderAlerts() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    throw new Error("This browser cannot show order alerts.");
  }
  const reg = await registerShopWorker();
  if (!reg) throw new Error("Could not install the shop app worker.");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Alerts were not allowed on this device.");
  let pushOn = false;
  try {
    const vapid = await getVapidPublicKey();
    const key = String(vapid?.publicKey ?? "");
    if (key && "pushManager" in reg) {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      await savePushSubscription({ data: { subscription: sub.toJSON() } });
      pushOn = true;
    }
  } catch {
    /* local notification still confirms the permission */
  }
  await reg.showNotification("South End Pizza", {
    body: pushOn
      ? "Order alerts are on. We’ll ping you when your food is ready."
      : "Alerts are on for this device. Keep the app installed to get Ready pings.",
    icon: "/icon-192.png",
  });
  return { ok: true as const, push: pushOn };
}
