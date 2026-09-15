export type AdminNavItem = {
  to: "/admin" | "/admin/background" | "/admin/bots" | "/admin/center" | "/admin/zones" | "/admin/financials" | "/admin/menu" | "/admin/patches" | "/admin/pos" | "/admin/settings" | "/board";
  label: string;
  exact?: boolean;
  pip?: boolean;
  search?: { tab: string };
};

/** Admin destinations in drawer order. Bot access, Patches, and Wall menu stay off this list. */
export const ADMIN_NAV: AdminNavItem[] = [
  { to: "/admin/pos", label: "Tickets" },
  { to: "/admin/menu", label: "Menu" },
  { to: "/admin/menu", label: "Shop", search: { tab: "shop" } },
  { to: "/admin/center", label: "Customers", pip: true },
  { to: "/admin/financials", label: "Books" },
  { to: "/admin/background", label: "Look" },
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
