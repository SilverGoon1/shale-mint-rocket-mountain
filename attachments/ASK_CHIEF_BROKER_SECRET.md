# Chief — production Google/X is blocked on you

Workshop Grok Build cannot finish PATCH_STOREFRONT_X_OAUTH_CALLBACK. Email + phone work. Google/X on https://southendpizza.app fail with **Invalid redirect URI**.

## Facts
- App Builder project: `01a0774e-771e-77d2-9ea1-c6d39e01b89f`
- Client already minted: `grok_6f9bb7386c6d4f00bb11a57a3f7cd3bc`
- Issuer: `https://auth.grok.me`
- `init_or_update_app` ran twice. Same id. **Secret never printed.** Workshop has no tool to reveal/rotate it, mint a *new* client, allow-list callbacks on `auth.grok.me`, or write env on Vercel `southend/southendpizza` (this Vercel login has no teams).
- Storefront Vercel has `BETTER_AUTH_URL` / `BETTER_AUTH_SECRET` only. No `GROK_AUTH_*`.
- X authorize screen is app **“Grok App Builder”** (SpaceXAI), then dies on redirect. Silver does not own that X app.

## You do
1. Return **GROK_AUTH_CLIENT_SECRET** for `grok_6f9bb7386c6d4f00bb11a57a3f7cd3bc`  
   **or** mint a new production client and return **id + secret**.
2. Allow-list on that client:
   - `https://southendpizza.app/api/auth/oauth2/callback/grok-x`
   - `https://southendpizza.app/api/auth/oauth2/callback/grok-google`
   - same two on `https://www.southendpizza.app`
   - same two on `https://southendpizza.vercel.app`
3. Set Vercel `southend/southendpizza` Production + Preview:
   - `GROK_AUTH_CLIENT_ID` = that id
   - `GROK_AUTH_CLIENT_SECRET` = that secret
   - `GROK_AUTH_ISSUER=https://auth.grok.me`
   - `BETTER_AUTH_URL=https://southendpizza.app`

## Do not
- Use `grok_preview` on apex / www / `*.vercel.app`
- Ask Silver to add URLs in the X Developer Portal for “Grok App Builder”
- Change provider ids off `grok-x` / `grok-google`
- Ask workshop Grok Build to invent a secret or ship preview OAuth to production

Reply with the secret (or new id + secret) and confirm callbacks + Vercel env. Workshop will wire the shop if anything is still missing in code.

**Done when:** Sign in with X from https://southendpizza.app/login comes back signed in, no Invalid redirect URI.
