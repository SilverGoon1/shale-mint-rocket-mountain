/**
 * Stamp Permissions-Policy by route. Public storefront stays tight.
 * Admin desk and /pair-printer keep Web Bluetooth for the shop tablet.
 * Nested preview frames still inherit the *parent* policy — pairing then
 * opens a top-level window at `/pair-printer`.
 */
import {
  ADMIN_FEATURE_POLICY,
  ADMIN_PERMISSIONS_POLICY,
  CUSTOMER_FEATURE_POLICY,
  CUSTOMER_PERMISSIONS_POLICY,
  isAdminDevicePath,
} from "../../scripts/device-permissions.mjs";

type EventLike = {
  url?: { pathname?: string };
  req?: { url?: string };
  res?: { setHeader?: (key: string, value: string) => void };
  node?: { res?: { setHeader?: (key: string, value: string) => void } };
};

function pathOf(event: EventLike) {
  const fromUrl = String(event.url?.pathname ?? "");
  if (fromUrl) return fromUrl;
  try {
    return new URL(String(event.req?.url ?? ""), "http://local").pathname;
  } catch {
    return "";
  }
}

function policiesFor(pathname: string) {
  if (isAdminDevicePath(pathname)) {
    return { permissions: ADMIN_PERMISSIONS_POLICY, feature: ADMIN_FEATURE_POLICY };
  }
  return { permissions: CUSTOMER_PERMISSIONS_POLICY, feature: CUSTOMER_FEATURE_POLICY };
}

function stamp(headers: Headers, pathname: string) {
  const p = policiesFor(pathname);
  headers.set("Permissions-Policy", p.permissions);
  headers.set("Feature-Policy", p.feature);
}

function trySet(event: EventLike, pathname: string) {
  const p = policiesFor(pathname);
  const set =
    event.res?.setHeader?.bind(event.res) ?? event.node?.res?.setHeader?.bind(event.node.res);
  set?.("Permissions-Policy", p.permissions);
  set?.("Feature-Policy", p.feature);
}

export default async function devicePermissionsMiddleware(
  event: EventLike,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const pathname = pathOf(event);
  try {
    trySet(event, pathname);
  } catch {
    // Streaming handlers may have already flushed; wrap the Response below.
  }

  const result = await next();
  if (result instanceof Response) {
    const headers = new Headers(result.headers);
    stamp(headers, pathname);
    return new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers,
    });
  }
  return result;
}