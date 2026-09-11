# South End Pizza — Email OTP + Resend mailer (build paste)

## What this adds
- Shared Resend mailer (`sendEmail`) for transactional mail.
- Password-reset OTP now **actually emails** the 6-digit code when Resend is configured (still shows `previewCode` on PGLite/local only — never in prod responses).
- Signup email verification OTP for **real** email credential accounts (skips `*@phone.southend.pizza`).
- Login UI: after email create-account / sign-in, show a 6-digit code step until `user.emailVerified=true`. Refresh with an unverified session is re-gated on `/login`.
- Google / X OAuth unchanged (treated as already verified).

## Resend install (repo)
```bash
cd /workspace/pepper-reef-monarch-hill   # or your checkout
npm install resend
```
Package used: `resend` (see `package.json`).

## Env vars
Resend is live on Vercel project **southend/southendpizza** (Production + Preview). Set the **same** names on **Grok Build**:

| Name | Required | Notes |
|------|----------|--------|
| `RESEND_API_KEY` | Yes in production | Vercel Marketplace Resend |
| `RESEND_EMAIL_DOMAIN` | Yes (recommended) | e.g. `southendpizza.app` — From becomes `South End Pizza <orders@${RESEND_EMAIL_DOMAIN}>` |
| `EMAIL_FROM` | Optional | Full From override if set |

**Grok Build note:** live shop SoT is Grok Build — you **must** set `RESEND_API_KEY` and `RESEND_EMAIL_DOMAIN` on the Build environment, not only on Vercel. Missing `RESEND_API_KEY` in non-prod logs a clear skip; in production `sendEmail` throws a friendly “Email is not configured yet…” error.

Domain: confirm `RESEND_EMAIL_DOMAIN` is verified in Resend before expecting inbox delivery.

## Acceptance criteria
1. `npm install` includes `resend`; `src/lib/email/resend.server.ts` exports `sendEmail({ to, subject, html, text })` and reads `RESEND_API_KEY` + `RESEND_EMAIL_DOMAIN` (optional `EMAIL_FROM`).
2. Account → Reset password → “Send one-time code” delivers email subject **Your South End Pizza reset code** when the key is set; PGLite still returns `previewCode` only.
3. Email create-account shows **Check your inbox** OTP step; wrong/expired codes fail; success sets `"emailVerified"=true` and continues.
4. Email sign-in of an unverified credential account is blocked at the OTP step (including refresh on `/login`).
5. Phone signup/sign-in (`*@phone.southend.pizza`) skips email OTP.
6. Google / X continue without OTP.
7. Rate limits: **60s** between sends; **hourly cap 8** (same constants as password reset).
8. No Neon cutover, no card-processor, no bot-scope, no auth `server.ts` rewrite.
9. Do **not** push/deploy from this paste alone — ship via your usual Build/Vercel flow after env is set.

## File list
- `src/lib/email/resend.server.ts` — shared Resend mailer
- `src/lib/phone.ts` — `isPhoneAuthEmail()` helper
- `src/lib/shop-types.ts` — `ProfileView.emailVerified`
- `src/lib/shop-server.ts` — schema ensure for `email_signup_codes`; wire `sendPasswordResetCode`; `sendSignupEmailCode` / `verifySignupEmailCode`; `getMe.emailVerified`
- `src/routes/login.tsx` — signup/sign-in OTP UI + unverified-session gate
- `migrations/0026_email_signup_codes.sql` — table + indexes
- `package.json` / `package-lock.json` — `resend` dependency
- `/workspace/email-otp.patch` — git diff of src + migration + package files (excludes `node_modules`)
- `/workspace/EMAIL_OTP_BUILD_PASTE.md` — this doc

## Quick verify (local / PGLite)
1. Create account with a real-looking email → OTP step appears; preview code shown in the mail slip.
2. Enter code → lands on shop; account is verified.
3. Account password reset → preview code + (with key) Resend send.
4. Sign up with phone → no OTP step.
