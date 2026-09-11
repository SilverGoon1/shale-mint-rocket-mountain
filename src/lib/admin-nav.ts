export type AdminNavItem = {
  to: "/admin" | "/admin/background" | "/admin/bots" | "/admin/center" | "/admin/zones" | "/admin/financials" | "/admin/menu" | "/admin/patches" | "/admin/settings" | "/board";
  label: string;
  exact?: boolean;
  pip?: boolean;
  pin?: "start" | "end";
};

/** Admin destinations. Menu & Shop Details is first. Settings stays last. POS lives in the account menu. */
export const ADMIN_NAV: AdminNavItem[] = [
  { to: "/admin/menu", label: "Menu & Shop Details", pin: "start" },
  { to: "/admin/center", label: "Customer Center", pip: true },
  { to: "/admin/financials", label: "Financials" },
  { to: "/admin/bots", label: "Bot access" },
  { to: "/admin/patches", label: "Patches" },
  { to: "/board", label: "Wall menu" },
  { to: "/admin/background", label: "Settings", pin: "end" },
];

export const SHOP_BACKDROP_EVENT = "southend-backdrop";
export const SHOP_LOGO_EVENT = "southend-logo";

export function emitShopBackdrop() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SHOP_BACKDROP_EVENT));
}

export function onShopBackdrop(fn: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SHOP_BACKDROP_EVENT, fn);
  return () => window.removeEventListener(SHOP_BACKDROP_EVENT, fn);
}

export function emitShopLogo() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SHOP_LOGO_EVENT));
}

export function onShopLogo(fn: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SHOP_LOGO_EVENT, fn);
  return () => window.removeEventListener(SHOP_LOGO_EVENT, fn);
}

export const DEFAULT_BACKDROP = "/buffalo-mark.webp";
export const DEFAULT_LOGO = "/mark.jpg";
export const DEFAULT_LOGO_SM = "/mark-sm.jpg";
export const DEFAULT_FAVICON = "/favicon.svg";
