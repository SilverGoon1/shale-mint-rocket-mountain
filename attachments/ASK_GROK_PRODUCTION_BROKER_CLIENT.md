# Need a production Grok broker client for South End Pizza III

Google/X on the live shop fail with Invalid redirect URI.

## Shop
- Live: https://southendpizza.app (also www + southendpizza.vercel.app)
- Vercel: southend/southendpizza
- GitHub: SilverGoon1/shale-mint-rocket-mountain
- Workshop: https://shale-mint-rocket-mountain.grok.me

## What’s wrong
Storefront Vercel has `BETTER_AUTH_URL` / `BETTER_AUTH_SECRET` but no `GROK_AUTH_CLIENT_ID` / `GROK_AUTH_CLIENT_SECRET`. The app was falling back to preview client `grok_preview`, which the broker only allows on `*.grok-sandbox.com` — not the apex. X shows the authorize screen for app “Grok App Builder” (SpaceXAI), then dies on redirect.

## Please do
1. Mint a **per-app production** broker client for this shop (**not** `grok_preview`).
2. Reply with `GROK_AUTH_CLIENT_ID` and `GROK_AUTH_CLIENT_SECRET` (and confirm issuer, should be `https://auth.grok.me`).
3. Allow these callbacks on that client:
   - `https://southendpizza.app/api/auth/oauth2/callback/grok-x`
   - `https://southendpizza.app/api/auth/oauth2/callback/grok-google`
   - same two paths on `https://www.southendpizza.app` and `https://southendpizza.vercel.app`
4. If you can set Vercel Production + Preview env on `southend/southendpizza`, do that too:
   - `GROK_AUTH_CLIENT_ID`
   - `GROK_AUTH_CLIENT_SECRET`
   - `GROK_AUTH_ISSUER=https://auth.grok.me`
   - `BETTER_AUTH_URL=https://southendpizza.app`

## Do not
- Use `grok_preview` on apex/www/Vercel
- Ask me to add URLs in the X Developer Portal for “Grok App Builder” — I don’t own that app
- Change provider ids off `grok-x` / `grok-google`

## Done when
Sign in with X from https://southendpizza.app/login comes back signed in, no Invalid redirect URI.
