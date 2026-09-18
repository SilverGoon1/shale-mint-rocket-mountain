# Workshop HOTFIX — Restore CSP script unsafe-inline (blank site)
**Date:** 2026-09-18  
**Severity:** Production blank page  
**Cause:** Security harden removed `script-src 'unsafe-inline'`. TanStack Start ships a large inline hydrate script (`<script class="$tsr" id="$tsr-stream-barrier">`). CSP blocked it → white/blank page. Assets still 200.

## MUST
Restore **exactly** this in every CSP string (`vercel.json` ×3 places + `scripts/device-permissions.mjs`):

`script-src 'self' 'unsafe-inline' https://grok.com`

Full policy (match existing, only script-src change):

```
default-src 'self'; script-src 'self' 'unsafe-inline' https://grok.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.tile.openstreetmap.org; connect-src 'self' https://nominatim.openstreetmap.org https://geocoding.geo.census.gov https://grok.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'
```

## KEEP (do not revert)
- SW same-origin push URL allowlist
- `/sw.js` ACAO `https://southendpizza.app` (not `*`)
- Social email-only / no broker secret inventing

## MUST NOT
- Remove `'unsafe-inline'` from script-src again until TanStack hydrate uses nonces/hashes
- Commit `.vercel/output`

## Smoke
1. Hard-refresh https://southendpizza.app/ — menu visible  
2. `curl -sI https://southendpizza.app/` → CSP `script-src` includes `'unsafe-inline'`  
3. Real Storefront `npm run build`

**Status:** Paste into Workshop Build immediately, Export, confirm live.
