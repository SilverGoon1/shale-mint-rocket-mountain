# South End UPDATE Build paste (post-BENCHMARK *_1349)
**Date:** 2026-09-11 ~2:10 PM ET  
**SoT:** `shale-mint-rocket-mountain.grok.me` / `southendpizza.app`  
**Live patch top (unchanged all morning):** `2026-09-11-followup-account-load` — asset `patches-1AzV7AXO.js` sha256 `4899aa9a75df2dd3d2e82f4e289ffb2096383b0b84c71580742729a7eddf98c8`  
**Desk SoT:** `/workspace/diag/benchmark/*_1349.md` + `STYLE_MUST_BAD_LOGIN_AUTH.md`  
**Benchmark routine:** PAUSED (no auto waves)

Ship this as the next Grok Build after FOLLOWUP. Prefer **one deploy** covering CRITICAL auth + isolation + NC continuity + Style UX residuals. Zone Erase is **not** in this paste (Driver Admin GO skipped — keep English Creek IN; document Northfield false-IN for a later GO).

**Out of scope:** Neon cutover, live card payments, Better Auth / staff secret changes, zone Clear-all / paint editor, weakening bot scopes, printer buy, Completes hammering

---

## Live PASS / do not redo

- FOLLOWUP account-load **on patch page** (claim live; POS sticky now solid ×8 cold+second-session)
- Cook-note isolation; Card frozen + bot scopes API
- English Creek IN (`1000 English Creek Ave…08234`); Finance delivery-min $15; delivery tax includes fee (#000030 math)
- Category rail sticky/center/pulse; Wings×10; Review sole red CTA; section gaps ~10–12px
- Security guest `/admin` → `/login?next=/admin` + sign-out→get-session null (1349 PASS — keep regression watch after 1207 FAIL)
- Driver + NewCustomer carousel ~390 PASS
- Style search/chips clearance PASS
- POS Admin Settings path + header YES (POS view); Completes still held by CoS

---

## Ship order (MUST)

### 1. CRITICAL — Bad credentials must not authenticate
**Evidence:** Style_1349 — wrong-password on `/login` showed **no** invalid-copy error and **redirected into an authenticated South End Desk** session.  
**Also:** one sign-out briefly hit guest, then **NewCustomer Desk** resurfaced.

**Fix:**
1. Failed login stays on `/login` with Style-approved specific error copy (username/email-aware — not silent success; not generic-only if we can name the field safely). Prefer: `Invalid username or password.` (or `Invalid email, username, or password.`).
2. Failed login must **not** establish, restore, or hop into any desk/authenticated session (cookie/session must remain guest/null for that attempt).
3. One sign-out clears **all** desk sessions → sticky true guest (no NewCustomer / South End / Driver / Security Guard hop). Pair with Security harness-cookie lessons.
4. Desktop short-viewport: no Email/Phone ↔ Sign in/Create overlap/clip/black-bar when `formError` set (prior Style login paste).

**Acceptance:** deliberate wrong password → stay on login + visible error; no authenticated desk chrome; one sign-out → guest Sign in only for ≥2 consecutive desk smoke runs.

### 2. Signed-in checkout continuity (NewCustomer)
**Evidence:** NC 758→1349 — Review order forces guest (`Checking out as a guest… Use signed-in account`).

**Fix:** Preserve authenticated checkout identity through Review / form validation / navigation. Never downgrade a valid signed-in session to guest. Soft “Continue as guest” only when the user chooses it — not forced.

**Acceptance:** NewCustomer Desk signed-in → add item → Review → still signed-in; place order; ticket issued; Chat Send can unlock with that open ticket.

### 3. SessionGate residuals (narrow)
POS sticky is green ×8 — do **not** reopen as full-menu FAIL. Still harden:
- Style `/admin/pos` 1349 FAIL (sticky then “Staff only”) — was PASS 1321; restore hold through load + 15–30s.
- Driver `/admin/menu?tab=delivery` still unverified (Admin held) — when Admin GO returns, cold+×3 must PASS.
- Finance signed-in account-load still UNVERIFIED (HOLD until GO).
- Never `ALTER`/bcrypt/staff seed on every `getMe`; clear loader on fail/success.

### 4. Phone-first carousel arrows
Style still **16/31px** (or ~22px) inset — want **4–8px** from edge. Keep hysteresis/search/chips wins. NC+Driver carousel PASS — do not regress.

Ship residuals from `CAROUSEL_PHONE_FIRST_BUILD_PASTE.md` + arrow flush.

### 5. FAB ≥72px clearance
Call/Chat FABs: mobile 52×52 overlap; desktop ~16px bottom clear. Need ≥72px clearance vs lower-right menu cards.

### 6. POS header chrome discoverability
Security consistently sees `/admin/pos` account/Admin chrome **N** while POS Settings path works and POS reports header YES. Make Admin/account chrome consistently visible on `/admin/pos` when `admin_mode_allowed` (Security+POS agree Y). Soft-max roster watch (14/12–14/15 UI).

### 7. Unblocked only after sticky + CoS GO (do not ship Completes in this paste unless asked)
- POS Complete green toast + Accept disable after Accepted (sticky ×8 — greenlight separately)
- Financials / Insights / Today = `America/New_York`
- Printer buy HOLD until further notice; Dahlia Checkout surcharge **OFF** Phase 1 (shop absorbs)

---

## Zone note (NOT in this code paste)

`1600 Tilton Rd, Northfield, NJ 08225` still **false-IN** (must OUT). English Creek IN keep.  
Driver proposes street-check + **Erase Northfield corridor only** (no Clear-all) — **Admin GO skipped by Silver**. Do not treat geocode success as delivery eligibility. Track as separate GO, not this Build.

Companion still separate: `DRIVER_TAB_BUILD_PASTE.md`.

---

## MUST NOT / do not regress

- Weaken bot scopes; live cards; Pass/staff secret in source; Auto-review direct to Silver (CoS first)
- Guest self-elevate; **bad-login authenticating**; UI-only sign-out leaving other desks alive
- Clear-all zones; Dahlia auto Checkout surcharge on Phase 1
- ALTER/bcrypt on every `getMe`; zones editable outside Admin/DB
- Regress: POS sticky ×8, Security guest gate, English Creek IN, Finance delivery min/tax, cook-note, carousels NC+Driver, Style gaps/search
- Hammer Completes / printer buy without CoS greenlight
- Delivery-min $15 client; delivery tax on food+fee; tip never taxable

---

## Acceptance checklist (this update)

- [ ] Wrong password → stay on login + specific error; **never** land in a desk session
- [ ] One sign-out → sticky true guest (2× consecutive Style smoke)
- [ ] NC signed-in Review preserves account; ticket places
- [ ] Style `/admin/pos` loads and holds 15–30s (no Staff-only flake)
- [ ] Carousel arrows 4–8px inset; FAB ≥72px clearance
- [ ] Security + POS both see `/admin/pos` Admin chrome Y
- [x] POS sticky cold + later session (already ×8 — do not break)
- [x] Guest `/admin` → login + session-null (watch)
- [x] English Creek IN; Finance DELIVERY_MIN/TAX
- [ ] Northfield OUT — **separate Driver Admin GO** (not this paste)
- [ ] Completes toast — **separate CoS greenlight**

---

## Suggested Build title

`2026-09-11-update-auth-isolation-continuity`

## Retest after live

Manual (Benchmark paused): Style bad-login + sign-out; NewCustomer Review continuity; Style `/admin/pos` soak; Security guest gate; POS cold+second sticky smoke; arrow/FAB spot-check.  
Do **not** fan full desk wave unless Silver resumes Benchmark or asks.

---

*Compiled by CoS from `*_1349` fold + `STYLE_MUST_BAD_LOGIN_AUTH.md`. Sources under `/workspace/diag/benchmark/`.*
