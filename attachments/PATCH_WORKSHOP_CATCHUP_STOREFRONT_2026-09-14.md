# PATCH — Workshop catch-up (keep Blueprint Storefront fixes on next Export)
**Date:** 2026-09-14 ~3:40 AM EDT  
**SoT / paste target:** Workshop `https://shale-mint-rocket-mountain.grok.me`  
**Why:** CoS shipped these on Blueprint `main` + Storefront tonight. **Grok Export overwrites Blueprint** unless Workshop has the same changes. Paste this into Workshop **before** the next Export.  
**Compiled by:** Chief of Staff for Silver  
**Blueprint commits covered:** `c22fa10` / `67ae4a6` (no prebuilt), `11c386c` (OTP gate), `d086054` (contrast), `de376ba` (2‑min TTL)

---

## MUST NOT
- Commit or Export `.vercel/output/` (or any Build Output API tree)
- Soften OTP so unverified guests can shop as signed-in
- Revert email OTP TTL back to 60 seconds
- Change Resend from-domain / API keys

---

## 1) Never commit `.vercel/output` on Export

### `.gitignore`
Keep (add if missing):
```
.vercel/output/
.vercel/output/**
```

### `AGENTS.md` (or equivalent Build / Export instructions)
Add a short Storefront note:
```
## Storefront / Vercel export
Never commit `.vercel/output` (Build Output API). Storefront (`southendpizza.app`) must run a real `npm run build`. Committed prebuilt exports cause production HTTP 500.
```

### Export hygiene
Before push, if `.vercel/output` is staged:
```
git rm -r --cached .vercel/output
```
After Export → Storefront deploy: build log must say **Running "npm run build"**, never **Using prebuilt build artifacts**.  
Ops fallback: `rm -rf .vercel/output && vercel deploy --prod --yes` from a Blueprint checkout linked to `southend/southendpizza`.

---

## 2) OTP gate — cannot dismiss into a signed-in unverified session

### `src/routes/login.tsx`

**A. Add `abandonVerify` (uses existing `dropClientSession`):**
```ts
async function abandonVerify() {
  setBusy(true);
  setError("");
  try {
    await dropClientSession();
  } catch {
    /* still leave OTP / signed-out path */
  }
  setVerifyStep(null);
  setBusy(false);
  void navigate({ to: "/", replace: true });
}
```

**B. While `verifyStep` is set (and while loading with an existing `user` that may need OTP):**
- Do **not** use `<Link to={closeTo} className="login-scrim" />` or `<Link … className="login-close" />` that navigates away and keeps the session.
- Use a non-navigating `<div className="login-scrim" aria-hidden />`.
- X / Cancel must call `abandonVerify()` (sign out, then home).
- Add quiet button: **Cancel — sign out** → `abandonVerify()`.

**C. Loading shell:** if `user` is present, no dismiss Link to menu; plain scrim only.

### `src/components/guards.tsx` (`SessionGate`)
Import `needsSignupOtp` from `@/lib/phone`. After profile is loaded:
```ts
if (needsSignupOtp(shownProfile.email) && !shownProfile.emailVerified && pathname !== "/login") {
  return <Navigate to="/login" search={{ next: pathname || "/" }} replace />;
}
```

### `src/routes/index.tsx` (home)
Import `needsSignupOtp` + `Navigate`. Before rendering the storefront with a profile:
```ts
if (profile && needsSignupOtp(profile.email) && !profile.emailVerified) {
  return <Navigate to="/login" search={{ next: "/" }} replace />;
}
```

Keep existing checkout check (`needsSignupOtp && !emailVerified` → `/login`).  
Staff / phone skip via `needsEmailOtp` / `needsPhoneOtp` unchanged. OAuth stays provider-verified.

Server already has `assertEmailVerifiedForOrder` — keep it.

---

## 3) OTP verify screen contrast (paper login dialog)

Append to `src/styles.css` (after `.login-social-off` / with other `.login-dialog` rules):

```css
/* OTP / verify step: paper dialog + dark mail slip need explicit ink/cream */
.login-dialog .ed-sub {
  color: var(--color-ink);
  opacity: 0.82;
  font-size: 0.82rem;
  line-height: 1.45;
}

.login-dialog .mail-slip {
  background: var(--color-ink);
  border-color: var(--color-ink);
  color: var(--color-cream);
}

.login-dialog .mail-slip .slip-kind {
  color: #e8a39a;
}

.login-dialog .mail-slip strong {
  color: var(--color-cream);
}

.login-dialog .mail-slip .ed-sub,
.login-dialog .mail-slip .otp-code {
  color: var(--color-cream);
  opacity: 1;
}

.login-dialog .ed-field > span {
  color: var(--color-ink);
  opacity: 0.72;
}

.login-dialog .ed-input::placeholder {
  color: var(--color-muted);
  opacity: 1;
}

.login-dialog .ed-btn,
.login-dialog .ed-btn-quiet {
  color: var(--color-ink);
  border-color: var(--color-rule);
  background: var(--color-cream);
  width: 100%;
  justify-content: center;
}

.login-dialog .ed-btn-quiet {
  background: transparent;
}

.login-dialog .ed-btn-quiet:hover:not(:disabled),
.login-dialog .ed-btn-quiet:focus-visible {
  border-color: var(--color-ink);
  color: var(--color-ink);
}
```

---

## 4) Email one-time code TTL = 2 minutes

### `src/lib/shop-server.ts`
```ts
const OTP_TTL_MS = 2 * 60_000;
const OTP_TTL_SEC = Math.round(OTP_TTL_MS / 1000);
```
(Leave `SMS_OTP_TTL_MS` at 10 minutes.)

Use `OTP_TTL_MS` for email signup (+ password-reset if it shares the constant) expiry + resend cooldown.  
Return `expiresIn: OTP_TTL_SEC` (120).  
Email body / text: **“expires in 2 minutes”** (not 60 seconds).  
Resend error: **“Wait 2 minutes to send another.”**

### `src/routes/login.tsx`
Email channel defaults: `expiresIn` / `otpExpires` / fallbacks **120** (not 60). Phone stays 600 / SMS path.  
Countdown copy: when `otpExpires >= 60`, show `N min left` (same pattern as phone).

---

## Already expected on Workshop (do not regress)
- `needsEmailOtp` **true** for real guest emails (staff + phone-auth skip)
- Resend mailer `orders@southendpizza.app` — domain is **verified** on Resend; DNS already live
- Social hide until `GROK_AUTH_*` configured (separate; not part of this catch-up)

---

## Acceptance (after Workshop apply + Export + **clean** Storefront deploy)
- [ ] Deploy log: Running `npm run build` (not prebuilt)
- [ ] Create account → OTP screen → backdrop/X/Cancel does **not** leave you signed-in unverified
- [ ] Correct code → verified access; wrong code fails
- [ ] Countdown / email say **2 minutes**; resend cooldown matches
- [ ] Verify UI: body copy, black-slip timer, Send again / Cancel labels all readable
- [ ] Home / account bounce unverified guests back to `/login`

## After Export
If apex 500s: strip `.vercel/output`, clean `vercel deploy --prod --yes`. Tell CoS.
