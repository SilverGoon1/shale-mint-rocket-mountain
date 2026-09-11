# South End Pizza — Complete bugfix drop (team double-check)
**Audience:** Silvergoon  
**SoT:** `https://shale-mint-rocket-mountain.grok.me`  
**Official domain:** `https://southendpizza.app` → 307 → Grok (ops: re-apply if Vercel wipe)  
**When:** 2026-09-10 / 11 (ET)

This is the **one complete file** after lane double-check.  
**Code patch:** `/workspace/bugfix-combined.patch`  
**Build paste (per-item must/must-not/acceptance):** `/workspace/BUGFIX_BUILD_PASTE.md`  
**Diag rollup:** `/workspace/BUGFIX_DIAG_REPORT.md`  
**Admin/Pass source paste:** `/workspace/DIAG_ADMIN_ACCOUNT_BUILD_PASTE.md`

---

## A) What this drop fixes (code)

| # | Item | Lane | Status in patch |
|---|------|------|-----------------|
| 0 | Diagnostic **Admin / Pass** + Bot access kill switch + Security constraints | Security / CoS | **Included** |
| 1 | POS **Completed toast** (`Completed # · $` + tip), 3–4s green, reuse Accept helper | POS / Style | **Included** |
| 2 | POS **disable Accept** once Accepted (client); server idempotent | POS | **Included** |
| 3 | Checkout **`validateCheckout()` delivery min $15** client gate | Finance | **Included** |
| 4 | **FAB** Call/Chat clearance ~390 + hide on checkout | Style | **Included** |
| 5 | **Wings qty** step=10 min=10 (not extra-dips ×2) | Style | **Included** |
| 6 | Guest **Continue as guest** / no mid-review bounce to Silver/account | NewCustomer / Style | **Included** |
| 7 | Clear stale **“We deliver here”** when address changes | NewCustomer | **Included** |

**Zones / delivery map paint:** **OUT of code.** Zion FAIL + Admin session drop stay ops (`diag/driver.md`). Do not seed `delivery_zones` in this patch.

---

## B) Diagnostic Admin / Pass — Security constraints (locked)

1. Kill switch **default OFF** (`staff_admin_login_enabled` default false).  
2. ON only for explicit QA: `STAFF_ADMIN_LOGIN_ENABLED=true` and/or Admin → Bot access **Diagnostic Admin login** toggle.  
3. Password **env-only** (`STAFF_ADMIN_PASSWORD=Pass` on Grok secrets) — **never in source / client / guest UI**.  
4. Short Pass accepted **only** on non-prod diagnostic path (`!isVercelProduction()`); production still needs ≥12 or `STAFF_ADMIN_PASSWORD_HASH`.  
5. Kill switch OFF → **wipe** credential row (same as missing env); bots unchanged.  
6. `GET /api/bot/v1/security/summary` exposes `diagnosticDeskAuth`, `staffAdminLoginEnabled`, honest `staffSecretConfigured`.  
7. Audit diagnostic desk logins (`noteStaffDeskLogin` → `staff_desk_audit`).  
8. Do not keep Pass as long-term staff secret once real hash is set.  
9. `patches.ts` entry documents diag account + toggle.

### Grok secrets (required for desk QA)
```
STAFF_ADMIN_PASSWORD=Pass
STAFF_ADMIN_LOGIN_ENABLED=true
```

### Acceptance (desk)
- Admin / Pass → `/admin` when ON + env set  
- Toggle OFF → login rejected; credential wiped  
- Bot mint/rotate unaffected  
- Guest still cannot operate `/admin` without credentials  

**Unblocks:** `staffSecretConfigured: false` (Security diag) so POS/Driver/Style desk work can continue.

---

## C) POS / Style / Finance / Guest — acceptance checklist

### POS
- [ ] Complete → green toast `Completed #XXXXXX · $XX.XX` (+ tip); 3–4s; non-blocking  
- [ ] Popup closes; Open stays selected; empty Open “You're caught up”  
- [ ] Accept disabled/hidden once Accepted  
- [ ] Completing… disables double-submit (no regress)

### Finance
- [ ] Delivery under min blocked in `validateCheckout()` before submit  
- [ ] Card stays disabled / notice-only (no enable)

### Style
- [ ] FAB does not cover lower-right menu cards ~390; off Checkout  
- [ ] Wings: 10/20/30… only; dips stepper separate  

### Guest / NewCustomer
- [ ] Continue as guest available; Review does not snap to account mid-flow  
- [ ] Address edit clears stale “We deliver here” until re-check  

### Zones (ops only — not this patch)
- [ ] Zion / Admin Delivery tab — separate Admin session repair  

---

## D) Diag lane snapshot (pre-patch)

| Lane | Result |
|------|--------|
| POS | Toast FAIL; Accept still enabled after Accepted; Complete→close PASS |
| Finance | PASS w/ missing client min $15 |
| Style | FAB FAIL; Wings step 2 FAIL; guest chrome PASS |
| NewCustomer | PARTIAL — snap-back + stale deliver-here |
| Driver | Zion FAIL; Admin blocked — zones OUT |
| Security | PASS; **staffSecretConfigured false** |
| CoS API | PASS |

Full detail: `/workspace/BUGFIX_DIAG_REPORT.md`.

---

## E) Apply + retest

```bash
cd /workspace/pepper-reef-monarch-hill   # or Build checkout
git apply /workspace/bugfix-combined.patch
# Set Grok Build secrets (above), publish SoT only
```

**Retest order**
1. Security summary → `staffSecretConfigured` + `diagnosticDeskAuth`  
2. Admin / Pass desk login (toggle ON)  
3. Style guest + Wings×10 + FAB @ ~390  
4. Checkout delivery min + address clear + Continue as guest  
5. POS Accept → Complete → toast  
6. Confirm `southendpizza.app` still 307 → Grok  

**Still must not:** card live · Neon cutover · bot scope expansion · zones seed · Pass in repo.

---

## F) Artifact index

| Path | Role |
|------|------|
| `/workspace/SOUTHEND_BUGFIX_COMPLETE.md` | **This file** — single complete drop |
| `/workspace/BUGFIX_BUILD_PASTE.md` | Build paste (must/must-not/acceptance) |
| `/workspace/BUGFIX_DIAG_REPORT.md` | Team lane PASS/FAIL |
| `/workspace/bugfix-combined.patch` | Unified diff (apply on Build checkout) |
| `/workspace/DIAG_ADMIN_ACCOUNT_BUILD_PASTE.md` | Admin/Pass + Security source paste |
| `/workspace/diag/*.md` | Raw lane diags |

*Compiled for Silvergoon after POS / Finance / Style / NewCustomer / Security / Driver / CoS double-check.*

---

## Team ADD backlog (confirmed in FINAL PATCH SYNC — include in this drop if patch doesn’t already cover)

### Finance ADD
1. Collected semantics — exclude `awaiting_payment` / unpaid card from Financials “Collected” + `payments.collected` (or split Outstanding)
2. Insights 400-order cap — SQL aggregates so All-time/Month aren’t silently truncated
3. Shop TZ for Today — America/New_York day boundaries for KPIs/series
4. Payments gate — Require card off while processor disabled; Card “not live”

### Style ADD
1. Mobile title bar scrunch (~390): short single-line title; icon Cart + account; hide POS guests; bar ≤64px
2. Menu editor: editable Extra Ranch / Extra Blue cheese price per 2 cups (guest modal live)

### NewCustomer ADD
1. Account-load timeout → Continue as guest without wiping guest form fields on remount
2. Stale cart + sticky kitchen notes across visits
3. Empty Gyro — defer OK / low priority
4. Ops: apex→Grok host confusion (keep 307)

### Security clarifying
- `staff_admin_login_enabled` / diag flag default **false** globally (already in A)

### Team CONFIRM log
- POS: CONFIRM · Style: CONFIRM+ADD · NewCustomer: FINAL FAIL (OTP missing + stale zone/geocode); core paths PASS · Driver: CONFIRM no code · Finance: CONFIRM+ADD · Security: CONFIRM+#8

---

## NewCustomer FINAL (2026-09-10 ~23:06 ET) — amend

**Overall: FAIL** (core pickup + zone accept/reject PASS)

| # | Check | Result |
|---|--------|--------|
| 1 | Pickup Small Cheese | PASS (stopped before Confirm) |
| 2 | In-zone English Creek | PASS ($3.50) |
| 3 | Out-of-zone Northfield | PASS |
| 4 | Zion 443/450 | PASS as Outside — Driver/Admin paint still needed |
| 5 | Email OTP | **MISSING** — guest + password only |

**ADD to bug-fix / follow-ups**
1. Stale “We deliver here” / Maps result after address edits until blur/recheck (strengthen clear-on-edit)
2. Northfield sometimes geocoded as Egg Harbor Township — geocode/label quirk
3. Chat requires sign-in (guest chat gated) — product decision / optional guest chat
4. Email OTP — ship `EMAIL_OTP_BUILD_PASTE.md` / Resend (separate or fold if this drop allows)

Helper #000020 not visible in guest UI (chat sign-in gated). QA-Finance not placed.
