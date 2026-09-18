# Workshop HOTFIX — Install / download name is still “Grok App”
**Date:** 2026-09-18  
**Severity:** Production PWA install prompt shows **Grok App** instead of **South End Pizza**  
**Live target:** https://southendpizza.app/

## Diagnosis
- HTML metas already say South End (`application-name`, `apple-mobile-web-app-title`).
- The install prompt reads **`/__grok/manifest.webmanifest`**, which live currently returns the **platform default**:
  - `"name": "Grok App"`, black theme, icon `/__grok/icon-180.png`
- That payload is **not** from our `renderWebManifest()` (ours uses cream `#fbf6ec` and `/icon-180.png`).
- Live `version.json` can lag Blueprint; Grok Export has also rewritten PWA shared code before. Host-based renaming alone is not enough.

## Goal
Install / Add to Home Screen / “download app” name is always **South End Pizza** (short **South End**), cream theme, shop icons — never **Grok App**.

## MUST — three changes (do all)

### 1) `scripts/grok-pwa-shared.mjs` — hard-lock identity

Keep the existing `SOUTHEND_PWA_*` / `SOUTHEND_THEME` / `SOUTHEND_BG` constants.

Replace **`resolvePwaIdentity`** so this storefront never falls through to `"Grok App"`:

```js
/**
 * Install name for the web manifest / Apple home-screen title.
 * This repo is South End Pizza only — never platform "Grok App".
 * site.color still drives theme; names are fixed.
 */
export function resolvePwaIdentity(hostHeader, cwdOrSite) {
  let site = {};
  if (typeof cwdOrSite === "string") {
    site = readOgSite(cwdOrSite);
  } else if (isOgSite(cwdOrSite)) {
    site = cwdOrSite;
  } else {
    site = readOgSite(process.cwd());
  }

  const themeColor = themeFromSite(site);
  return {
    name: SOUTHEND_PWA_NAME,
    shortName: SOUTHEND_PWA_SHORT,
    themeColor,
    backgroundColor: themeColor || SOUTHEND_BG,
  };
}
```

Also update **`grokPwaHeadTags`** so the default head link points at the static manifest (step 2), not only `__grok`:

```js
export function grokPwaHeadTags(appName = SOUTHEND_PWA_NAME, themeColor = SOUTHEND_THEME) {
  const title = String(appName ?? "").trim() || SOUTHEND_PWA_NAME;
  const theme = String(themeColor ?? "").trim() || SOUTHEND_THEME;
  return [
    ["manifest", '<link rel="manifest" href="/manifest.webmanifest">'],
    ["apple-touch-icon", '<link rel="apple-touch-icon" href="/icon-180.png">'],
    [
      "apple-mobile-web-app-title",
      `<meta name="apple-mobile-web-app-title" content="${escapeHtml(title)}">`,
    ],
    [
      "apple-mobile-web-app-status-bar-style",
      '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
    ],
    ["theme-color", `<meta name="theme-color" content="${escapeHtml(theme)}">`],
  ];
}
```

In **`createHeadInjector` / head merge** (same file), if there is a filter that checks for  
`href="/__grok/manifest.webmanifest"`, also accept `/manifest.webmanifest` so the injector does not re-inject a duplicate. Example:

```js
if (key === "manifest") {
  return !(
    next.includes('href="/manifest.webmanifest"') ||
    next.includes('href="/__grok/manifest.webmanifest"')
  );
}
```

Keep `renderWebManifest` as-is (it already calls `resolvePwaIdentity`). Middleware + Vite plugin will then serve South End on `/__grok/manifest.webmanifest` too.

### 2) Add static `public/manifest.webmanifest`

Create this file exactly (CDN-safe fallback when `__grok` is platform-owned):

```json
{
  "name": "South End Pizza",
  "short_name": "South End",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#fbf6ec",
  "theme_color": "#fbf6ec",
  "icons": [
    {
      "src": "/icon-180.png",
      "sizes": "180x180",
      "type": "image/png"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icon-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Confirm these icon files already exist under `public/` (they do on Blueprint). Do **not** point icons at `/__grok/icon-*.png`.

### 3) `src/routes/__root.tsx` — link the static manifest

In the document head links, change:

```ts
{ rel: "manifest", href: "/__grok/manifest.webmanifest" },
```

to:

```ts
{ rel: "manifest", href: "/manifest.webmanifest" },
```

Keep:

```ts
{ name: "application-name", content: "South End Pizza" },
{ name: "apple-mobile-web-app-title", content: "South End" },
```

### Optional but recommended — `src/lib/og/site.json`

Already correct; leave as:

```json
{
  "title": "South End Pizza III",
  "pwaName": "South End Pizza",
  "shortName": "South End",
  "card": "custom",
  "color": "fbf6ec"
}
```

## MUST NOT
- Do not set `DEFAULT_APP_NAME` as the install name anywhere for this shop.
- Do not commit `.vercel/output`.
- Do not rely only on Host / `VITE_PUBLIC_HOSTNAME` checks — Export and Envoy rewrite Host to `*.vercel.app`.

## After Build / Export / Storefront deploy
1. `curl -sL https://southendpizza.app/manifest.webmanifest` → `"name": "South End Pizza"`, cream theme, `/icon-*.png`.
2. `curl -sL https://southendpizza.app/__grok/manifest.webmanifest` → same South End payload (not Grok App / not black).
3. HTML: `rel="manifest" href="/manifest.webmanifest"`.
4. On a phone: remove any existing “Grok App” home-screen icon, hard-refresh, Add to Home Screen → name **South End Pizza**.

## Note for Silver
If an old “Grok App” icon is already on the device, uninstall/remove it first — OS caches the install name from the first Add to Home Screen.
