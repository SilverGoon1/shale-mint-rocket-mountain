# Workshop Build — Security harden SW + CSP
**Date:** 2026-09-18  
**Live target:** https://southendpizza.app  
**From re-eval:** SECURITY_DIAGNOSTIC_southendpizza_2026-09-18_REEVAL.md  
**Scope:** Workshop only — Med items from security re-eval (SW CORS, push URL allowlist, CSP script tighten)

## Goal
1. Stop `/sw.js` from advertising `Access-Control-Allow-Origin: *`.
2. Only open **same-origin** paths from push `notificationclick` (`data.url`).
3. Tighten CSP: drop `'unsafe-inline'` from **`script-src`** (keep style `unsafe-inline` for now — CSS-in-JS / Vite).

## MUST NOT
- Touch auth brokers, Neon, POS, delivery zones, bots, menu/board layout
- Invent `GROK_AUTH_*` secrets or turn social back on
- Commit `.vercel/output`
- Break PWA install / order-alert push for signed-in users
- Break Admin Web Bluetooth (admin Permissions-Policy stays)

---

## 1) `public/sw.js` — same-origin allowlist for push URLs

Replace the open `notificationclick` handler with allowlisted navigation.

Add helpers + harden click:

```js
function safePushPath(raw) {
  const fallback = "/account";
  try {
    const base = self.location.origin;
    const u = new URL(String(raw || fallback), base);
    if (u.origin !== base) return fallback;
    if (u.protocol !== "https:" && u.protocol !== "http:") return fallback;
    // Path + search + hash only — never //evil.com
    return u.pathname + u.search + u.hash || fallback;
  } catch {
    return fallback;
  }
}

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
```

Also sanitize when storing notification data on `push`:

```js
data: { url: safePushPath(data.url || "/account") },
```

(Define `safePushPath` above both listeners.)

---

## 2) Strip / override SW ACAO (`vercel.json` + keep middleware)

Live still shows `Access-Control-Allow-Origin: *` on `GET /sw.js` even though `server/middleware/device-permissions.ts` deletes it — static/CDN path often bypasses middleware.

### `vercel.json` — `/sw.js` headers block
Replace the existing `/sw.js` entry with:

```json
{
  "source": "/sw.js",
  "headers": [
    { "key": "Cache-Control", "value": "no-store" },
    { "key": "Access-Control-Allow-Origin", "value": "https://southendpizza.app" },
    { "key": "Cross-Origin-Resource-Policy", "value": "same-origin" },
    { "key": "X-Content-Type-Options", "value": "nosniff" }
  ]
}
```

Do **not** use `*`. Same-origin register from the apex is enough; `www` should eventually 301 to apex (optional Low, not this paste).

### Keep middleware delete
Leave `server/middleware/device-permissions.ts` delete of ACAO on `/sw.js` as defense-in-depth when the request hits the server handler.

### `vite.config.ts` nitro headers (if present)
Where `/sw.js` is set to `{ "cache-control": "no-store" }` only, mirror:

```js
"/sw.js": {
  headers: {
    "cache-control": "no-store",
    "access-control-allow-origin": "https://southendpizza.app",
    "cross-origin-resource-policy": "same-origin",
  },
},
```

---

## 3) CSP — drop script `'unsafe-inline'` (keep style for now)

Update **all three** places that define the shop CSP string so they stay in sync:

1. `scripts/device-permissions.mjs` — `CONTENT_SECURITY_POLICY`
2. `vercel.json` — every `Content-Security-Policy` value (root `/(.*)`, `/_serverFn`, `/_serverFn/(.*)`)
3. Any generated `scripts/device-permissions.d.ts` comments if they duplicate the string (optional)

**New policy string** (script without unsafe-inline; style still unsafe-inline):

```
default-src 'self'; script-src 'self' https://grok.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.tile.openstreetmap.org; connect-src 'self' https://nominatim.openstreetmap.org https://geocoding.geo.census.gov https://grok.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'
```

If a page breaks after Export (blank shell / CSP console errors for inline scripts), either:
- move the offending inline into a bundled module, or
- temporarily restore `'unsafe-inline'` on **script-src** only and report — do not silently leave production broken.

Nonce/hash CSP is a later pass; this paste is the incremental Med fix from the re-eval.

---

## Files to touch
1. `public/sw.js`
2. `vercel.json`
3. `scripts/device-permissions.mjs` (and vite nitro `/sw.js` headers if present)
4. Keep `server/middleware/device-permissions.ts` ACAO delete

## Smoke after Build + Export
1. `curl -sI https://southendpizza.app/sw.js` — **no** `Access-Control-Allow-Origin: *`; prefer absent or `https://southendpizza.app`; `Cache-Control: no-store`; CORP `same-origin` if set
2. `curl -sI https://southendpizza.app/` — CSP `script-src` has **no** `'unsafe-inline'`; `style-src` may still have it
3. Home / login / menu / checkout load with console clean of CSP script blocks
4. Signed-in: enable order alerts if possible; click a test notification → opens `/account` or same-origin path only; a forged `https://evil.example/` in payload must fall back to `/account`
5. Guest social still off (email only) — do not re-enable Google/X
6. Real `npm run build` on Storefront (not prebuilt `.vercel/output`)

## Optional (not this paste)
- www → apex 301  
- HSTS `includeSubDomains`  
- Mint new `GROK_AUTH` id+secret when ready for social  

**Status:** Workshop-only Build paste — implement in Grok Workshop, then Export.
