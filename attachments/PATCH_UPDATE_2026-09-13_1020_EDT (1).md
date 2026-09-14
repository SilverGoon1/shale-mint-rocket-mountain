# PATCH UPDATE — 2026-09-13 10:52 PM EDT
**SoT:** `https://shale-mint-rocket-mountain.grok.me` only  
**Compiled by:** Chief of Staff for Silver  
**Paste into Grok Build**

**Scope:** Admin **Shop details accordions only.**  
Prior open MUSTs from earlier drafts of this file (SessionGate, blurb, Accept toast, email overflow, wall beverages, card desc, Admin toggle, Ranch/Blue, etc.) are **cleared from this paste** — Silver handled some live; rest parked outside this Build.

**Ref:** `STYLE_PATCH_ADMIN_SHOP_DETAILS_DROPDOWNS.md`

---

## Problem
Menu & Shop Details is one long scroll: menu items + Extra topping prices + Bulk XL fill + Shared extras + shop fields all on one surface.

---

## MUST

### 1) Move pricing bulk panels → Shop details
Relocate these Admin controls out of the Menu item stream into **Shop details**:

1. **Extra topping prices** (SM / MD / LG / XL ladder + live pizza blurb caption)
2. **Bulk XL fill** (Cheese / One-topping / Gourmet)
3. **Shared extras** (Extra Ranch / Extra Blue / Extra dressing)

Admin-only. **Save all** still persists them with shop + menu.

### 2) Shop details = nested accordions / dropdowns
Inside Shop details, use **collapsed-by-default** sections (prefer single-open accordion) with clear headers + chevron:

1. Extra topping prices  
2. Bulk XL fill  
3. Shared extras  
4. Shop identity / copy (tagline, mark, etc.)  
5. Every other shop-detail group already on the page — each its own section (no long flat list)

NICE: remember last-open section in `localStorage`.

### 3) Menu tab = items only
Categories + items + per-item modifiers. **Not** the three pricing bulk panels.

---

## MUST NOT
- Change guest storefront
- Change money math / locks (ladder $, XL cohorts, unitSize=2, delivery min `$5` / fee `$4`)
- Remove Save all
- Put pricing panels on `/board`
- Re-add Admin mode toggle (Silver removed it)
- Re-show Pizza/Gourmet card descriptions on guest main menu (Silver hid them)

---

## Acceptance
- [ ] Extra topping prices, Bulk XL fill, Shared extras live under Shop details
- [ ] Shop details split into named accordion/dropdown sections
- [ ] Opening one section doesn’t force scrolling past unrelated long blocks
- [ ] Menu item editing still works; Save all persists prices + shop details
- [ ] @390 Admin usable (no new button/label overlap)

## After publish
Style: hard-refresh SoT — confirm panels moved + accordions cut scroll. Report PASS/FAIL to CoS.
