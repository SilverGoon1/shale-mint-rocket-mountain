# PATCH UPDATE — 2026-09-12 3:28 PM EDT
**SoT:** `https://shale-mint-rocket-mountain.grok.me` only  
**Compiled by:** Chief of Staff for Silver  
**Purpose:** Paste into Grok Build. Style is PAUSED waiting on this update.

---

## Ship order
1. Admin pricing bulk UX (Style wish list MUST)
2. Wall Menu print scale (`/board`)
3. Dip/dressing extras $ propagation (still FAIL live)
4. Signed-in Review continuity (Customer Support FAIL — do not drop)
5. Soft-max 14/12 enforce (Security WATCH)

---

## Live price locks (already in Admin — do not regress)
| Lock | Value |
|------|--------|
| Topping add-on SM / MD / LG / XL | **$2.25 / $3.25 / $4.25 / $5.25** |
| XL Cheese menu | **$20.95** |
| XL one-topping menu | **$23.95** |
| Extra Ranch / Extra Blue cheese | **$0.75** |
| Extra dressing | **$0.75** |
| Included salad Ranch/Blue | **$0** |

Pizza section blurb still says “Extra toppings $2.00 each” — **fix via blurb auto-update** below.

---

## MUST

### A) Admin pricing bulk UX
**Refs:** `STYLE_NOTE_ADMIN_PRICING_BULK_UX.md` · `STYLE_NOTE_ADMIN_PRICING_AGILE.md`

1. **Topping ladder screen** — one Admin panel for SM/MD/LG/XL shop topping add-on $ + live preview.
2. **Pizza blurb auto-update** — “Extra toppings …” copy tracks ladder (no stale $2.00).
3. **Bulk XL fill by cohort** — Cheese / One-topping / Gourmet; Gourmet XL blank until set (blank ≠ $0).
4. **Shared extras unitPrice** — one Extra Ranch / Extra Blue (and Extra dressing when same) → Wings + Tenders + Buffalo (+ salads).
5. **Find & set by option label** — e.g. all “Extra Ranch” → $0.75.

NICE (same paste if capacity): wall/PDF sync · Slice CSV import · diff before Save all.

### B) Wall Menu print scale
**Refs:** `PATCH_UPDATE_FOLD_WALL_MENU_PRINT_SCALE_2026-09-12.md` · `WALL_MENU_PRINT_SCALE_BUILD.md` · `STYLE_PATCH_WALL_MENU_PRINT_SCALE.md`

- `/board` Admin **Print scale** presets **100 / 110 / 125 / 150%** (optional 90–160% slider)
- Persist (`wallMenuPrintScale`); bump CSS type vars for `@media print` / Save PDF
- Stacks with Letter · Tabloid · Poster; guest `/` unchanged

### C) Dip / dressing extras show $
**Ref:** `STYLE_PATCH_EXTRAS_DIP_PRICE_PROP.md`

- Extra dips/dressings must show editor `unitPrice` on chips and bump Add total (same as toppings)
- unitSize=2 for dip/dressing extras where locked; → food subtotal

### D) Signed-in checkout continuity
- Review must **not** force guest / wipe desk identity (CustomerSupport_SITE_DIAG FAIL)
- Chat Send unlocks when signed-in ticket exists

### E) Soft-max desk grants
- Enforce soft-max (live **14/12** over — Security WATCH)

---

## HOLD / OUT
- Printer buy · Completes greenlight · live Card · Northfield Erase  
- Guest Bluetooth  

---

## Acceptance
- [ ] Topping ladder editable in one Admin panel; blurb matches live $
- [ ] Bulk XL fill works for Cheese + one-topping cohorts
- [ ] One edit sets Extra Ranch $0.75 everywhere
- [ ] `/board` Print scale 125% → larger PDF than 100%
- [ ] Extra Ranch chip shows $0.75; Add total increases
- [ ] Signed-in Review stays signed-in
- [ ] Soft-max blocks over-cap grants

---

## Source refs
| File | Topic |
|------|--------|
| `/workspace/style-audit/STYLE_NOTE_ADMIN_PRICING_BULK_UX.md` | Bulk pricing UX |
| `/workspace/style-audit/STYLE_NOTE_ADMIN_PRICING_AGILE.md` | Modifier schema |
| `/workspace/patches/PATCH_UPDATE_FOLD_WALL_MENU_PRINT_SCALE_2026-09-12.md` | Print scale fold |
| `/workspace/style-audit/STYLE_PATCH_EXTRAS_DIP_PRICE_PROP.md` | Extras $ prop |
| `/workspace/diag/site/CustomerSupport_SITE_DIAG.md` | Continuity FAIL |
| `/workspace/diag/site/Security_SITE_DIAG.md` | Soft-max WATCH |

---

*End PATCH UPDATE — 2026-09-12 3:28 PM EDT*
