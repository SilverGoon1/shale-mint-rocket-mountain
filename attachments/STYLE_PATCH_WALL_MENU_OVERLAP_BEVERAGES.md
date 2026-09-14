# Style PATCH — Wall menu print-scale overlap + Beverages layout
**Author:** Style  
**When:** 2026-09-13  
**SoT:** https://shale-mint-rocket-mountain.grok.me  
**Route:** `/board` **only** — do not change guest storefront menu

**Silver:**
1. When print scale increases, wall menu text starts to overlap — fix.
2. Beverages on the wall menu should show **size + price only** (not full beverage presentation as on guest).

---

## MUST

### A) Print scale / text overlap
1. At print scales **110 / 125 / 150%** (and slider), board text/columns must not overlap.
2. Prefer reflow / tighter gaps / allow section scroll or multi-page print — **not** `transform: scale` that clips labels into neighbors without layout reflow.
3. If scale uses CSS transform, also increase layout box / line-height / column gap so glyphs don’t collide; or switch to root font-size scaling that reflows.
4. Screen preview at 100% can stay full-size; Print/PDF must be readable with no overlap at chosen scale.

### B) Beverages (wall only)
1. On `/board` Beverages section: each line = **size + price** only (e.g. `SM $X · MD $Y` or one row per size).
2. Omit long descriptions, photos, and guest-style card chrome on the wall board for beverages.
3. Guest `/` Beverages category **unchanged**.

## Acceptance
- [ ] `/board` at 125% and 150% print scale: no overlapping item names/prices
- [ ] Beverages wall: size + price only
- [ ] Guest menu beverages layout unchanged

## Fold
CoS → Build with wall print-scale work. Pair `STYLE_PATCH_WALL_MENU_PRINT_SCALE.md`.
