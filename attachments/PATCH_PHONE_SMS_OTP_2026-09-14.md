# PATCH — Phone signup SMS verification (OTP)
**Date:** 2026-09-14  
**SoT:** Workshop `https://shale-mint-rocket-mountain.grok.me`  
**Storefront:** `southendpizza.app` after clean Vercel deploy  
**Compiled by:** Chief of Staff for Silver  

---

## Problem
Phone Create account maps to synthetic email `##########@phone.southend.pizza` and **skips** OTP (`needsEmailOtp` returns false for phone). Guests can create a phone account with only a password — no SMS proof they own the number.

Email OTP path (Resend) already exists. Phone needs a parallel **SMS** OTP.

---

## MUST

### 1) SMS provider: Twilio Verify (preferred) or Twilio Programmable Messaging
Env on Vercel `southend/southendpizza` Production + Preview:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID` (if Verify) **or** `TWILIO_FROM_NUMBER` (E.164) if raw SMS

Do not hardcode secrets in the repo.

### 2) Server: send + verify phone codes
Mirror email signup codes:
- Table e.g. `phone_signup_codes` (or reuse a channel column on a generic otp table): phone E.164 / 10-digit US, code hash, salt, expires, attempts, consumed
- `sendSignupPhoneCode({ phone })` — rate limit like email (60s / hourly cap)
- `verifySignupPhoneCode({ phone, code })` — on success mark phone verified (profile flag and/or treat session as verified)

US numbers only for v1 (existing `toTenDigitPhone`).

### 3) Login UI
On Phone + Create account (and unverified phone session gate):
- After password signup → show OTP step (“Enter the 6-digit code we texted to ••••1234”)
- Resend with cooldown
- Same UX pattern as email verify step

### 4) When OTP is required
- **Phone credential signup / login to unverified phone account:** require SMS OTP
- **Email:** keep Resend email OTP (unchanged)
- **Staff / desk Admin:** skip (existing staff skip)
- **Google/X:** skip when social works

### 5) Copy
SMS body roughly: `South End Pizza code: ###### (expires in 10 min).`  
Align TTL in UI with server.

---

## MUST NOT
- Store plaintext OTP in DB
- Log full codes in production
- Require SMS for email accounts
- Block the shop if Twilio env missing in **preview** — fail with clear “SMS not configured” on Storefront production instead of silent skip
- Use `grok_preview` OAuth as a substitute for phone verify

---

## Acceptance
- [ ] Phone Create account → SMS received → correct code unlocks account
- [ ] Wrong code / expired / rate limit show clear errors
- [ ] Email OTP path still works (after Resend domain verified)
- [ ] No SMS sent for email-mode signup

## After publish
CoS: set Twilio env on Vercel, clean-redeploy, smoke one US number. Security: note in diag.
