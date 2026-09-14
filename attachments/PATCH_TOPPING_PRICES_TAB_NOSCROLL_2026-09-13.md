# STANDALONE PATCH — Per-topping prices tab + no-scroll customize
**When:** 2026-09-13 11:01 PM EDT  
**SoT:** `https://shale-mint-rocket-mountain.grok.me` only  
**From:** Chief of Staff for Silver  
**Paste into Grok Build** — standalone (not the Shop-details accordion paste).

---

## Silver ask
1. Customize pop-up: **no scrolling** required to pick toppings / complete the pie.
2. Toppings get **their own individual pricing** (not one shop-wide ladder for every topping).
3. Put that pricing UI in **its own tab** under Menu & Shop Details.
4. Seed every topping’s SM/MD/LG/XL from **current live defaults**.

---

## Live defaults (seed every topping)
| Size | Default $ |
|------|-----------|
| SM | **$2.25** |
| MD | **$3.25** |
| LG | **$4.25** |
| XL | **$5.25** |

Half side = half of that topping’s unit for the chosen size (same rule as today).  
List of toppings = current `PIZZA_TOPPINGS` (Extra cheese, Pepperoni, … Feta) unless Admin adds later.

---

## MUST

### A) Guest customize — no scroll to select
**File focus:** `pizza-customize.tsx` (+ related modal CSS)

Today the pizza modal scrolls (`max-height` + long topping list). Fix so a guest can choose size + toppings + Add **without scrolling the pop-up** on common phone (~390) and desktop.

Ways that pass (pick what fits):
1. **Tab / segment inside the modal:** e.g. **Size** · **Toppings** · **Notes** — each pane fits the viewport; sticky footer with live total + Add / Cancel always visible.
2. Or compact topping **grid/chips** that fit above a sticky Add bar (no page scroll inside the dialog).

Rules:
- Sticky footer: live total + **Add** / Cancel always on screen.
- Cook note can live on a Notes tab or a single compact field that doesn’t bury toppings.
- Half / whole / left / right controls stay usable.
- Do **not** drop toppings off the order — only change chrome/layout.
- Photo can shrink or hide on small screens if it forces scroll.

### B) Per-topping price model
**Today:** one shop ladder `toppingPriceSm/Md/Lg/Xl` charges every topping the same.

**Want:** each topping id has its own `{ SM, MD, LG, XL }` unit prices.

1. Persist a map (shop settings JSON or table), e.g. `toppingPricesById: Record<toppingId, { SM, MD, LG, XL }>`.
2. On boot / migrate: for every id in `PIZZA_TOPPINGS`, if missing, seed **$2.25 / $3.25 / $4.25 / $5.25**.
3. `toppingUnit` / `toppingCharge` / `pricePizzaBuild` read **that topping’s** row for the size (fallback to defaults if row missing).
4. Guest customize line (“Tap to add. $X whole · $Y half”) uses the **selected topping’s** price for the current size (or show per-row price on each topping chip).
5. Keep shop-wide ladder fields as **optional defaults / “Reset all to default”** source — or retire them once per-topping table exists. Prefer: shop-wide values = “default template” buttons, not the charge source.

### C) Own Admin tab — Menu & Shop Details
Add a dedicated Admin tab (name e.g. **Toppings** or **Topping prices**) beside Menu / Shop details:

- Table or cards: one row per topping — name + SM / MD / LG / XL number inputs.
- **Reset to defaults** (all or per row) → $2.25 / $3.25 / $4.25 / $5.25.
- Save with existing Save all / settings save path.
- @390: usable (horizontal scroll on table OK; no overlapping labels).
- Menu tab stays items; Shop details stays shop/accordion work — **don’t** bury the per-topping grid inside the long Menu item stream.

### D) Money / POS continuity
- Cart, POS lines, receipts, and bag detail still show topping names; totals use per-topping charges.
- Half toppings remain half price of that topping’s unit.
- Do not change pizza **menu** size prices (Cheese XL $20.95, etc.) — only topping add-ons.

---

## MUST NOT
- Change guest categories other than pizza customize chrome
- Soft Admin / weaken grants
- Require scroll on ~390 to reach Add after opening a pie
- Leave charge path on old single ladder after per-topping ships (unless ladder is explicitly only a default template)
- Regress Admin mode toggle removal or Pizza/Gourmet card desc hide

---

## Acceptance
- [ ] Open Cheese Pizza on phone (~390): pick size + ≥1 topping + Add **without** scrolling the dialog
- [ ] Sticky Add / total always visible in the pop-up
- [ ] Admin **Toppings** tab: every topping shows SM/MD/LG/XL editable; defaults $2.25/$3.25/$4.25/$5.25
- [ ] Change Pepperoni LG to a throwaway $ (e.g. 9.99) → only Pepperoni LG add-on uses it; Extra cheese still default; restore after test
- [ ] Half Pepperoni = half of Pepperoni’s unit for that size
- [ ] Save all persists; hard refresh keeps per-topping values
- [ ] POS / bag totals match customize Add total

## After publish
Style: customize no-scroll + Toppings tab chrome.  
Finance: spot money on two different topping prices.  
Report PASS/FAIL to CoS.
