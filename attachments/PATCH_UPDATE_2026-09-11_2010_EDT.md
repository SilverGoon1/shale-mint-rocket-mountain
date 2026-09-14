# PATCH UPDATE — 2026-09-11 8:10 PM EDT
**SoT:** `https://shale-mint-rocket-mountain.grok.me` only (not southendpizza.app / Vercel apex)  
**Compiled by:** Chief of Staff (Driver fold banked; Style · Finance · CoS)  
**Purpose:** Single Build paste for the next ship. Paste into Grok Build.  
**Supersedes draft adds on:** `PATCH_UPDATE_2026-09-11_1822_EDT.md` (keep its MUST; this file adds menu + delivery-fee + confirms)

---

## Ship order
1. Auth / SessionGate / bad-login CRITICAL  
2. Style Admin tabs @390 + Admin-mode dropdown + carousel/FAB  
3. Guest continuity (Review→guest, chat ticket Send)  
4. **Menu modifiers:** Tenders / Salads / Pasta shape + agile pricing  
5. **Optional delivery fee** (Admin toggle + price) — Finance YES  
6. Money / Insights / POS Completed toast (don’t regress locks)  
7. **PWA install name** (kill “Grok App”)  
8. Companion (capacity): Driver tab `/admin/driver` — `DRIVER_TAB_BUILD_PASTE.md`

---

## MUST

### Style — chrome / auth residuals
1. **Admin tab labels overlap @≤480 / ~390 — FAIL**  
   Paste: `/workspace/style-audit/STYLE_PATCH_ADMIN_TABS_390.md`  
   Screenshot: `/workspace/style-audit/admin-tabs-overlap-390.png`  
   ```css
   @media (max-width: 480px) {
     .menu-ops-tabs {
       display: flex;
       justify-content: flex-start;
       gap: 4px;
       overflow-x: auto;
       -webkit-overflow-scrolling: touch;
     }
     .menu-ops-tabs > [role="tab"] {
       flex: 0 0 auto;
       min-width: max-content;
       white-space: nowrap;
     }
   }
   ```
2. **Admin mode dropdown misaligned** — label wraps; toggle not vertically centered.  
   Paste: `/workspace/style-audit/STYLE_PATCH_DROPDOWN_ADMIN_MODE_ALIGN.md`
3. **Carousel arrows** flush **4–8px** from edge on ≤390.
4. **FAB clearance ≥72px** vs lower-right menu cards.
5. **CRITICAL — bad login** must show error and **never** land authenticated.  
   Paste: `/workspace/style-audit/STYLE_MUST_BAD_LOGIN_AUTH.md`
6. **One-step sign-out → true guest** (no desk-session hop).

### Style — menu (Silver / CoS / Finance LOCKED)
7. **Chicken tenders = Wings chrome**  
   - Required sauce: Hot / Mild / Dry / BBQ  
   - Required included dips: 2 Ranch / 2 Blue cheese / None  
   - Optional extra dips: **unitSize=2**, editable `unitPrice`  
   Paste: `/workspace/style-audit/STYLE_UPDATE_TENDERS_SALADS.md`
8. **Salads**  
   - Required included dressing (6): Light Italian, Caesar, Ranch, Blue cheese, Balsamic, Honey mustard  
   - Optional extra dressings: **unitSize=2** (Silver lock, same as dips), editable `unitPrice`
9. **Pasta shape** — required Penne | Spaghetti chips (`pasta_shape`, Δ~$0, editor-owned; Admin detaches where N/A e.g. Manicotti/Ravioli).  
   Paste: `/workspace/style-audit/STYLE_UPDATE_PASTA_SHAPE.md` (+ §E in tenders/salads doc)
10. **Agile pricing** — reusable modifier groups; **group-default unit price** (+ optional per-option override); **no hard-coded $** in UI; cart **price snapshot at add**; missing price → don’t invent $.  
    Paste: `/workspace/style-audit/STYLE_NOTE_ADMIN_PRICING_AGILE.md`  
    CoS fold: `/workspace/COS_FOLD_TENDERS_SALADS_PRICING.md`  
    Money: extras → **food subtotal** (taxable; **count toward delivery min**); tip never taxable.

### NewCustomer / guest
11. **Review order continuity** — signed-in must NOT force guest.
12. **Delivery zone** — `1600 Tilton Rd, Northfield, NJ 08225` must be **OUT** (guardrail; Erase paint = separate Admin GO).
13. **Chat** — after signed-in place, open ticket + Send unlock.
14. **Cook notes** stay null when blank.

### POS
15. **Completed success toast** on desk Complete (green `Completed #… · $…`).
16. **SessionGate sticky** — Open↔Complete + cold/reload; Delivery tab residual.

### Finance — locks + NEW optional delivery fee
17. Client **delivery-min $15** on **food subtotal only** (incl. extras; **not** on fee).
18. **NEW — Optional delivery fee (Silver)**  
    - Admin: **Enable delivery fee** toggle + editable **price**  
    - **OFF:** `deliveryFee=0`; **omit Delivery line**; tax = food (−discount) only  
    - **ON:** show fee; **tax includes fee** (#000030)  
    - Client **and** server: `validateCheckout`, `placeOrder` computeTax, money stack  
    - Stack: **Food (incl. extras) → Discount → Delivery-if-nonzero → Tax → Tip → Total**  
    Spec: `/workspace/COS_ADD_DELIVERY_FEE_OPTIONAL.md` · Finance **YES**
19. **Collected** = paid only; **Outstanding** = unpaid open.
20. **Insights** SQL aggregates; KPI **Today** = `America/New_York`.
21. Tip never taxable.
22. **Card gated**; Dahlia `automatic_surcharge` **OFF** Phase 1.

### Security
23. Sticky **POS `/admin/pos`** account/Admin chrome consistency.
24. Reliable **sign-out / session clear**; guest `/admin` → `/login?next=/admin`.
25. Soft-max desk grant roster; finish `admin_mode_allowed` grants if missing.

### CoS / PWA
26. **PWA install name** still “Grok App” on live manifest — MUST ship.  
    Paste: `/workspace/PWA_NAME_FIX_BUILD_PASTE.md`  
    `name=South End Pizza`, `short_name=South End` via `site.json` → `renderWebManifest(..., grokOgIdentity.site)`.  
    After ship: uninstall old Chrome shortcut → reinstall. Verify `/__grok/manifest.webmanifest`.

### Driver
27. Soften Delivery SessionGate on `/admin/menu?tab=delivery`.
28. Guest address normalize/autocomplete before zone PIP.
29. Companion: **Driver tab** `/admin/driver` — `DRIVER_TAB_BUILD_PASTE.md`.

---

## NICE
- Friendlier delivery-min copy (“Add $X more for delivery”)
- Soft-open Admin Settings printer IP + test print — **buy HOLD**
- Admin mode toggle on POS header
- Bulk admin price-list view (after group-default prices ship)
- PWA `notifications=(self)` only if push in this ship
- `site.json` drop “III” when branding paste runs
- Clearer chat empty-ticket UX; ticket popup vs Admin nav
- Pizza loader / account-load polish

---

## HOLD / OUT
- Printer hardware buy  
- Completes greenlight / live Card / Stripe Element  
- Northfield Erase / zone Clear-all until explicit Admin GO  
- Neon cutover · Guest Bluetooth/camera · Weakening bot scopes  

---

## Do not regress (PASS bank)
- Guest carousel Salads→Side Orders→Wings→Turnovers (desktop + ~390)  
- Complete → close popup + stay on Open; Accept disabled after Accepted  
- Cook-note isolation · orders/recent enrichment  
- English Creek exact IN · Zion guest delivery when aligned  
- Card frozen / least-privilege bot scopes  
- Guest `/admin` → login `next=/admin`

---

## Acceptance (smoke after paste)
- [ ] Admin tabs @390: no overlap; horizontal scroll OK  
- [ ] Admin dropdown: centered toggle  
- [ ] Failed login: error only, stay logged out  
- [ ] Signed-in Review does not force guest  
- [ ] Tenders: sauce + included dip required; extras in 2s; editor price on chips  
- [ ] Salads: included dressing required; extras in 2s; editor price  
- [ ] Pasta: Penne/Spaghetti required where group attached; cart shows shape  
- [ ] Delivery fee OFF: no fee line; tax without fee; min $15 on food still  
- [ ] Delivery fee ON: fee line + tax includes fee; Admin price editable  
- [ ] POS Complete green toast  
- [ ] PWA install name = South End Pizza (reinstall shortcut)  
- [ ] Manifest curl ≠ “Grok App”

---

## Source refs
| File | Topic |
|------|--------|
| `/workspace/style-audit/STYLE_PATCH_ADMIN_TABS_390.md` | Tab overlap |
| `/workspace/style-audit/STYLE_PATCH_DROPDOWN_ADMIN_MODE_ALIGN.md` | Dropdown |
| `/workspace/style-audit/STYLE_MUST_BAD_LOGIN_AUTH.md` | Bad-login |
| `/workspace/style-audit/STYLE_UPDATE_TENDERS_SALADS.md` | Tenders/salads |
| `/workspace/style-audit/STYLE_UPDATE_PASTA_SHAPE.md` | Pasta shape |
| `/workspace/style-audit/STYLE_NOTE_ADMIN_PRICING_AGILE.md` | Pricing agility |
| `/workspace/COS_FOLD_TENDERS_SALADS_PRICING.md` | CoS+Finance menu fold |
| `/workspace/COS_ADD_DELIVERY_FEE_OPTIONAL.md` | Optional delivery fee |
| `/workspace/PWA_NAME_FIX_BUILD_PASTE.md` | Manifest name |
| `/workspace/DRIVER_TAB_BUILD_PASTE.md` | Driver desk |
| `/workspace/patches/PATCH_UPDATE_2026-09-11_1822_EDT.md` | Prior 6:22 PM baseline |

---

*End PATCH UPDATE — 2026-09-11 8:10 PM EDT*
