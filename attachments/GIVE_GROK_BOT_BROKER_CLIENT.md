# South End Pizza III — production Grok broker client

Give this to Grok / App Builder deployer. Do **not** use `grok_preview` on the live shop.

## Shop
- Live: https://southendpizza.app (also www + southendpizza.vercel.app)
- Vercel: `southend/southendpizza`
- GitHub: `SilverGoon1/shale-mint-rocket-mountain`
- Workshop: https://shale-mint-rocket-mountain.grok.me
- App Builder project: `01a0774e-771e-77d2-9ea1-c6d39e01b89f`

## What already happened
Workshop asked the deployer to mint/update a per-app broker client. It returned a **real** client (not `grok_preview`). The **secret was not re-printed** because the project already existed.

| Key | Value |
|---|---|
| `GROK_AUTH_CLIENT_ID` | `grok_6f9bb7386c6d4f00bb11a57a3f7cd3bc` |
| `GROK_AUTH_ISSUER` | `https://auth.grok.me` |
| `GROK_AUTH_CLIENT_SECRET` | **missing — please return it** (issued with this client; workshop cannot see it) |

Google/X on the live shop still fail with **Invalid redirect URI**. Storefront Vercel has `BETTER_AUTH_URL` / `BETTER_AUTH_SECRET` but no `GROK_AUTH_*`. X authorize shows app **“Grok App Builder”** (SpaceXAI), then dies on redirect.

This client is for the Grok App Builder project. It does **not** automatically allow callbacks on `southendpizza.app`.

## Please do
1. Return `GROK_AUTH_CLIENT_SECRET` for client `grok_6f9bb7386c6d4f00bb11a57a3f7cd3bc` (or mint a new production client and return **id + secret**).
2. Allow these callbacks on that client:
   - `https://southendpizza.app/api/auth/oauth2/callback/grok-x`
   - `https://southendpizza.app/api/auth/oauth2/callback/grok-google`
   - same two paths on `https://www.southendpizza.app`
   - same two paths on `https://southendpizza.vercel.app`
3. If you can set Vercel Production + Preview env on `southend/southendpizza`, set:
   - `GROK_AUTH_CLIENT_ID=grok_6f9bb7386c6d4f00bb11a57a3f7cd3bc` (or the new id)
   - `GROK_AUTH_CLIENT_SECRET=` *(the secret you return)*
   - `GROK_AUTH_ISSUER=https://auth.grok.me`
   - `BETTER_AUTH_URL=https://southendpizza.app`

## Do not
- Use `grok_preview` on apex / www / `*.vercel.app`
- Ask Silver to add URLs in the X Developer Portal for “Grok App Builder” — he does not own that app
- Change provider ids off `grok-x` / `grok-google`

## Done when
Sign in with X from https://southendpizza.app/login comes back signed in, no Invalid redirect URI.
