# PATCH — Require email signup verification (OTP)
**Date:** 2026-09-14 ~12:45 AM EDT  
**SoT / paste target:** Workshop `https://shale-mint-rocket-mountain.grok.me`  
**Also ship to:** Storefront (`southendpizza.app`) via Blueprint export + **clean** Vercel deploy (no broken `.vercel/output` prebuilt — see Storefront 500 runbook)  
**Compiled by:** Chief of Staff for Silver  

---

## Problem
Email Create account already has OTP UI + Resend send/verify server fns, but signup **skips verification** because `needsEmailOtp` is hard-coded `false` in `src/routes/login.tsx` (“time-boxed until OTP ships as required”). Guests land signed-in with `emailVerified` unset/false and never see the code screen.

Storefront already has `RESEND_API_KEY` + `RESEND_EMAIL_DOMAIN` on Vercel.

---

## MUST

### 1) Turn on email OTP for credential signup
In `src/routes/login.tsx`, change `needsEmailOtp` so it returns **true** for normal guest emails:

- Return **false** (skip OTP) when:
  - phone-auth synthetic emails
  - staff/desk admin accounts (`isStaffAdminAccount` / existing skip helpers already used in `sendSignupEmailCode`)
- Return **true** for every other real email on Create account **and** when an existing session is credential + `emailVerified === false` (gate already sketched in the `useEffect` around lines 111–145)

Remove / replace the “return false” stub comment.

### 2) Keep existing server path (do not rewrite mailer)
Reuse:
- `sendSignupEmailCode` / `verifySignupEmailCode` in `src/lib/shop-server.ts`
- Resend via `src/lib/email/resend.server.ts`
- Table `email_signup_codes` (already migrated)

On Create account success → send code → show existing verify step (6-digit, Resend, 60s TTL UI already present).

### 3) Block unverified email sessions from shopping as “done”
Until OTP succeeds:
- Stay on verify step (existing intent)
- Do **not** treat account as fully usable for placing orders if product already checks `emailVerified` — if not checked at checkout, add a clear block or redirect to `/login` verify step for credential users with `emailVerified === false`

Phone signup + Google/X (when working) stay provider-verified (server already marks OAuth as verified).

### 4) Preview vs production code display
- **pglite / local preview:** may still return `previewCode` on screen (already gated by `dbSource === "pglite"`)
- **Storefront / Neon:** never show the code in UI — email only

### 5) Copy
Keep subject/body style: “Your South End Pizza signup code”. Expiry messaging must match server TTL (60s).

---

## MUST NOT
- Break desk bot email+password signup without a documented escape (staff skip is OK)
- Require OTP for Google/X once those work
- Change Resend from-domain without Silver approval
- Commit `.vercel/output` as the deploy artifact

---

## Acceptance
- [ ] Create account with a real inbox → OTP screen appears (no silent jump to menu)
- [ ] Email arrives via Resend; wrong code fails; correct 6-digit marks `emailVerified` and continues
- [ ] Resend respects rate limit / 60s wait copy
- [ ] Refresh / deep-link while unverified returns to OTP (not empty menu as “done”)
- [ ] Phone + staff skips still work
- [ ] Storefront: hard-refresh test after clean deploy

## After publish
CoS or Silver: one real-email signup on `southendpizza.app`. Security/CS: smoke PASS/FAIL to CoS.
