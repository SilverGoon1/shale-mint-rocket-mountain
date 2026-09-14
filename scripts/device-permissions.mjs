/**
 * Opt this origin into Web Bluetooth (and the sibling device APIs thermal
 * printers use). `*` is required so a shop tablet, a PWA, and a top-level
 * pairing window can all call `navigator.bluetooth.requestDevice`.
 *
 * `geolocation=(self)` is intentional: Chrome on Android will not scan BLE
 * unless the document is allowed to use location.
 */
export const DEVICE_PERMISSIONS_POLICY = [
  "bluetooth=*",
  "serial=*",
  "hid=*",
  "usb=*",
  "geolocation=(self)",
  "notifications=(self)",
].join(", ");

export const DEVICE_FEATURE_POLICY = [
  "bluetooth *",
  "usb *",
  "serial *",
  "hid *",
  "geolocation 'self'",
].join("; ");

export const DEVICE_HEADERS = {
  "Permissions-Policy": DEVICE_PERMISSIONS_POLICY,
  "Feature-Policy": DEVICE_FEATURE_POLICY,
};

/** @param {(key: string, value: string) => void} setHeader */
export function applyDevicePermissionHeaders(setHeader) {
  setHeader("Permissions-Policy", DEVICE_PERMISSIONS_POLICY);
  setHeader("Feature-Policy", DEVICE_FEATURE_POLICY);
}
