/**
 * Customer pages (menu, account, checkout, login, help) stay tight.
 * Admin / printer pairing keep Web Bluetooth and sibling device APIs.
 *
 * `geolocation=(self)` is intentional: Chrome on Android will not scan BLE
 * unless the document is allowed to use location.
 */
export const CUSTOMER_PERMISSIONS_POLICY = "geolocation=(self), notifications=(self)";
export const CUSTOMER_FEATURE_POLICY = "geolocation 'self'";

export const ADMIN_PERMISSIONS_POLICY =
  "bluetooth=*, serial=*, hid=*, usb=*, geolocation=(self), notifications=(self)";
export const ADMIN_FEATURE_POLICY = "bluetooth *; usb *; serial *; hid *; geolocation 'self'";

export const DEVICE_PERMISSIONS_POLICY = CUSTOMER_PERMISSIONS_POLICY;
export const DEVICE_FEATURE_POLICY = CUSTOMER_FEATURE_POLICY;

export const DEVICE_HEADERS = {
  "Permissions-Policy": CUSTOMER_PERMISSIONS_POLICY,
  "Feature-Policy": CUSTOMER_FEATURE_POLICY,
};

export const ADMIN_DEVICE_HEADERS = {
  "Permissions-Policy": ADMIN_PERMISSIONS_POLICY,
  "Feature-Policy": ADMIN_FEATURE_POLICY,
};

/** @param {(key: string, value: string) => void} setHeader */
export function applyDevicePermissionHeaders(setHeader) {
  setHeader("Permissions-Policy", ADMIN_PERMISSIONS_POLICY);
  setHeader("Feature-Policy", ADMIN_FEATURE_POLICY);
}

/** @param {string} pathname */
export function isAdminDevicePath(pathname) {
  const p = String(pathname ?? "");
  return p === "/admin" || p.startsWith("/admin/") || p === "/pair-printer" || p.startsWith("/pair-printer/");
}