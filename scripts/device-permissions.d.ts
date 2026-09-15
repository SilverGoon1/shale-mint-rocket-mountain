export const CONTENT_SECURITY_POLICY: string;
export const SECURITY_HEADERS: {
  "Content-Security-Policy": string;
  "X-Content-Type-Options": string;
  "Referrer-Policy": string;
  "X-Frame-Options": string;
};
export const CUSTOMER_PERMISSIONS_POLICY: string;
export const CUSTOMER_FEATURE_POLICY: string;
export const ADMIN_PERMISSIONS_POLICY: string;
export const ADMIN_FEATURE_POLICY: string;
export const DEVICE_PERMISSIONS_POLICY: string;
export const DEVICE_FEATURE_POLICY: string;
export const DEVICE_HEADERS: {
  "Content-Security-Policy": string;
  "X-Content-Type-Options": string;
  "Referrer-Policy": string;
  "X-Frame-Options": string;
  "Permissions-Policy": string;
  "Feature-Policy": string;
};
export const ADMIN_DEVICE_HEADERS: {
  "Content-Security-Policy": string;
  "X-Content-Type-Options": string;
  "Referrer-Policy": string;
  "X-Frame-Options": string;
  "Permissions-Policy": string;
  "Feature-Policy": string;
};
export function applyDevicePermissionHeaders(
  setHeader: (key: string, value: string) => void,
): void;
export function isAdminDevicePath(pathname: string): boolean;