# Return GROK_AUTH_CLIENT_SECRET + allow-list Storefront callbacks

App Builder project: `01a0774e-771e-77d2-9ea1-c6d39e01b89f`  
Client id already minted: `grok_6f9bb7386c6d4f00bb11a57a3f7cd3bc`  
Issuer: `https://auth.grok.me`  
Secret was not re-printed (project already existed). Workshop cannot see it.

## Please
1. Return **GROK_AUTH_CLIENT_SECRET** for `grok_6f9bb7386c6d4f00bb11a57a3f7cd3bc`  
   — or mint a **new** production client and return **id + secret**.
2. Allow-list callbacks on that client:
   - `https://southendpizza.app/api/auth/oauth2/callback/grok-x`
   - `https://southendpizza.app/api/auth/oauth2/callback/grok-google`
   - same on `https://www.southendpizza.app`
   - same on `https://southendpizza.vercel.app`
3. If you can write Vercel `southend/southendpizza` Production + Preview:
   - `GROK_AUTH_CLIENT_ID`
   - `GROK_AUTH_CLIENT_SECRET`
   - `GROK_AUTH_ISSUER=https://auth.grok.me`
   - `BETTER_AUTH_URL=https://southendpizza.app`

## Do not
- Use `grok_preview` on apex/www/Vercel
- Ask Silver to edit the X Developer Portal for “Grok App Builder”
- Change provider ids off `grok-x` / `grok-google`

Done when X sign-in from https://southendpizza.app/login returns signed in.
