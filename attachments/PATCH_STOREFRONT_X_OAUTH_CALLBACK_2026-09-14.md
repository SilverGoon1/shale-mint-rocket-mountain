# PATCH — Fix Sign in with X / Google callback on Storefront
**Date:** 2026-09-14 ~12:45 AM EDT  
**SoT / paste target:** Workshop `https://shale-mint-rocket-mountain.grok.me`  
**Storefront:** `https://southendpizza.app` (Vercel `southend/southendpizza`)  
**Compiled by:** Chief of Staff for Silver  

---

## What Silver saw (correct read)
Trying **Sign in with X** on Storefront reached X authorize for app **“Grok App Builder”** (SpaceXAI), then failed with:

`{"message":"Invalid redirect URI"}`

**Yes — the OAuth round-trip never returns successfully to the shop.** X rejects the `redirect_uri` before auth can complete. It is **not** “you forgot to approve something on the pizza site first.” It is a **callback URL / client mismatch** in the broker chain.

Flow (intended):

`southendpizza.app` → Better Auth → Grok broker `auth.grok.me` → X → **back** to  
`https://southendpizza.app/api/auth/oauth2/callback/grok-x`  
(then app session + `callbackURL` `/`).

---

## Root cause (Storefront)
In `src/lib/auth/server.ts`:

- Production should use deployer-injected **`GROK_AUTH_CLIENT_ID`** + **`GROK_AUTH_CLIENT_SECRET`** (+ optional `GROK_AUTH_ISSUER`).
- Storefront Vercel today has `BETTER_AUTH_URL` / `BETTER_AUTH_SECRET` but **no `GROK_AUTH_*`**.
- Code then **falls back** to preview client `grok_preview` (`src/lib/auth/preview.ts`), which the broker only allows for **`*.grok-sandbox.com`** callbacks — **not** `southendpizza.app`.

So X gets a redirect URI that is **not** registered for that client → `Invalid redirect URI`.

`PRODUCTION_AUTH_ORIGINS` already lists:

- `https://southendpizza.app`
- `https://www.southendpizza.app`
- `https://southendpizza.vercel.app`

Trusted origins alone do **not** fix a missing production broker client.

Workshop (Grok-hosted) usually gets `GROK_AUTH_*` injected by the deployer — which is why social can work there while Storefront fails.

---

## MUST

### A) Env / broker (ops — required for X/Google on apex)
On Vercel project **`southend/southendpizza`** (Production + Preview):

1. Set **`GROK_AUTH_CLIENT_ID`** and **`GROK_AUTH_CLIENT_SECRET`** to the **per-app production** broker client for this shop (from Grok App Builder / deployer — **not** `grok_preview`).
2. Confirm **`GROK_AUTH_ISSUER`** = `https://auth.grok.me` (or current broker issuer).
3. Confirm **`BETTER_AUTH_URL`** = `https://southendpizza.app` (canonical apex; www should still be in trusted origins).
4. Ensure the broker client allow-list includes callbacks:
   - `https://southendpizza.app/api/auth/oauth2/callback/grok-x`
   - `https://southendpizza.app/api/auth/oauth2/callback/grok-google`
   - same paths on `https://www.southendpizza.app` if www is used for login
5. Redeploy Storefront with a **real build** (strip committed `.vercel/output` — prebuilt exports 500 the apex).

Silver cannot fix this by editing the **X Developer Portal** for “Grok App Builder” — that app is SpaceXAI’s. Fix is **Grok broker client + env on Vercel**.

### B) Code hardening (Build paste)
1. **Fail loud in production** if `VERCEL_ENV=production` (or `southendpizza.app` host) and `GROK_AUTH_CLIENT_ID` is missing / equals `grok_preview`:  
   - Disable Google/X buttons **or** show: “Social sign-in isn’t configured for this shop — use email.”  
   - Log a clear server error once at boot (no secret values).
2. Keep friendly copy in `friendlyAuthError` for redirect URI mismatches (already points users at email / published link).
3. Do **not** use preview client credentials on apex/www/`*.vercel.app` production aliases.

### C) Verify after ship
- Sign in with X from `https://southendpizza.app/login` → authorize @account → lands back on shop signed in (no `Invalid redirect URI` page).
- Same smoke for Google if enabled.
- Email OTP path remains available (see sibling patch).

---

## MUST NOT
- Hardcode preview client secret into Storefront “to make it work”
- Ask Silver to add random URLs into an X app he doesn’t own
- Change provider ids away from `grok-x` / `grok-google` without broker support

---

## Acceptance
- [ ] Vercel Production shows `GROK_AUTH_CLIENT_ID` set (not preview)
- [ ] X sign-in from apex completes back to `southendpizza.app` with a session
- [ ] Missing `GROK_AUTH_*` on production no longer silently uses `grok_preview`
- [ ] Email signup still works

## After publish
Silver: one X login on apex. CoS: confirm env present via `vercel env ls` (names only). Security: note in diag.
