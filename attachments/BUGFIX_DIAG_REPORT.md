# BUGFIX DIAG REPORT — South End Pizza (team lanes)
**SoT:** `https://shale-mint-rocket-mountain.grok.me`  
**Compiled:** 2026-09-10 ~23:00 ET  
**Sources:** `/workspace/diag/*.md` + known blockers

## Lane summary

| Lane | Overall | Notes |
|------|---------|-------|
| POS | **FAIL** (toast + Accept) | Complete→close PASS; Completed toast FAIL; Accept still enabled after Accepted |
| Finance | **PASS** w/ bugs | Tax/tips/fees OK; client `validateCheckout` missing delivery min $15 |
| Style | **PASS** w/ bugs | Guest POS/phone/card PASS; FAB overlap FAIL; Wings qty steps by 2 not 10 |
| NewCustomer | **PARTIAL** | Review snap-back to Silver/account; stale “We deliver here” after OOZ pin |
| Driver / Zones | **FAIL / BLOCKED** | Zion 443/450 OUTSIDE; Admin session drop — **zones OUT of this code patch** |
| Security | **PASS** w/ notes | Bot LP + /admin gate PASS; **`staffSecretConfigured: false`** |
| CoS API | **PASS** | Apex 307→Grok; health/auth/scopes as expected |

## Per-file rollup

### `diag/pos.md` — FAIL items for patch
1. Completed toast missing after Complete → `Completed #XXXXXX · $XX.XX` (+ tip) — **MUST**
2. Disable/hide Accept once Accepted (client); server already idempotent — **MUST**
3. Complete closes popup + stay Open — already PASS (do not regress)

### `diag/finance.md` — PASS w/ bugs
1. `validateCheckout()` must gate delivery min $15 client-side (server already throws) — **MUST**
2. Historical tax=0 on old delivery ticket #1 — watch only, not this patch
3. No processor enable

### `diag/style.md` + `diag/style-wings-qty10.md`
1. FAB Call/Chat overlaps lower-right menu cards (~390) — **MUST**
2. Wings qty stepper step=10 min=10 (today steps by 2; don’t reuse extra-dips ×2) — **MUST**
3. POS hidden / phone / card notice / Review CTA — PASS

### `diag/newcustomer-partial.md` — PARTIAL
1. Review click snaps back to account/Silver — prefer Continue as guest — **MUST**
2. After address switch, clear stale “We deliver here” when new pin OOZ — **MUST**
3. Zion zone paint unfinished — **OUT of code** (Admin session)

### `diag/driver.md` — BLOCKED (not code)
1. Zion shop-parcel FAIL — Admin re-auth needed for Delivery tab — **not this patch**
2. Fees PASS (min 15 / 3.50 / +40)

### `diag/security.md` — PASS w/ blocker for desk
1. Bot least-privilege /admin auth / API 401/403 — PASS
2. **`staffSecretConfigured: false`** — desk Admin/Pass blocked until credential patch
3. trustedOrigins includes vercel.app; adminTotp: 1

### `diag/cos-api.md` — PASS
Apex 307, health, driver/style/finance scopes as expected. Guest `/menu` 404 N/A (menu on `/`).

## Known blockers (ops, not zones seed)
| Blocker | Impact | Patch? |
|---------|--------|--------|
| `staffSecretConfigured: false` | Admin/Pass desk login fails | **YES** — Admin/Pass + kill switch (this drop) |
| Zion FAIL pending Admin | Delivery map paint | **NO** — zones OUT; needs Admin session |
| Admin session Unauthorized mid-desk | POS Complete history / zones | Ops / session length — not Neon/auth redesign |

## Code patch scope (this drop)
In: POS toast+Accept, FAB, Wings×10, checkout min $15, guest snap-back + stale deliver-here, Admin/Pass Security constraints.  
**Out:** delivery_zones seed, Neon cutover, card enable, bot scope expansion, Admin password redesign beyond diag kill switch.
