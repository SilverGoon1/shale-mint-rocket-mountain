# Workshop Build — Reinvent Board tab (4× Letter wall menu)
**Date:** 2026-09-17  
**Live target:** southendpizza.app Admin → Menu & Shop Details → **Board**  
**Scope:** Workshop only (do not require a Blueprint PR for this pass)

## Goal
Reinvent the wall **Board** print so it is built for **four 8½×11 sheets**, with:
1. **Large, readable type** that fills letter pages (not a tiny scaled-down tabloid).
2. **Dotted leaders** from each item **name → price** (classic menu underline dots).
3. **Column / sheet divides that never intersect menu items** (rules sit in gutters; sections and rows stay whole).

## MUST NOT
- Touch guest storefront cart, auth, Neon, POS tickets, delivery zones, bots
- Commit `.vercel/output`
- Bring back sheet corner labels / 1–2–3–4 marks (`sheet-mark` stays `display: none`)
- Slice a category heading or item across a page break or through a column rule

## Current baseline (keep structure, reinvent presentation)
- Board UI: `src/components/board-studio.tsx` (embedded in Admin Board tab)
- Layout: `src/components/menu-board.tsx` — `letter4p` / `letter4l`, `packLetterPages`, `BoardFace`, `ItemRow` / `PizzaRow` / `BeverageRow`
- Styles: `src/styles.css` — `.paper`, `.menu-columns`, `.menu-col` (today uses `border-right`), `.lead-price` / `.dots` (dots only on single-price rows), `.letter-pack` / `.letter-sheet`

## Product defaults (Board tab)
1. When Admin opens **Board**, default paper to **`letter4p`** (4 × Letter portrait). Keep Letter / Tabloid / Poster available, but Board is letter-pack first.
2. Default **Compact** (descriptions off) for wall print; Full remains optional.
3. Default print scale **125%** for letter pack (clamp still 90–160). Screen preview should match “large enough to read on the wall after print.”
4. Helper copy: “Four letter pages. Names use dotted leaders to prices. Category blocks stay whole — cuts and column rules never slice an item.”

## 1) Dotted leaders — every row
### Markup (`menu-board.tsx`)
**Single price (`ItemRow`):** keep / strengthen `.lead-price` with `.dots` between name block and price.

**Multi / split (`ItemRow` multi, `BeverageRow`):** wrap so the **name** sits left, a **flex `.dots` leader** grows in the middle, then `.split-prices` on the right (same baseline as the name). Do not put the leader through the size labels — leader ends before the price cluster.

**Pizza (`PizzaRow`):** name + optional fav tag on the left; **one `.dots` leader** flexing to the price grid; SM/MD/LG/(XL) prices stay in the existing pizza columns on the right. Leader must not run under/through the price numerals.

Sketch for non-pizza single:

```tsx
<div className="item-row" data-kind="single">
  <span className="bullet" aria-hidden />
  <div className="item-copy">…name / desc…</div>
  <div className="lead-price">
    <span className="dots" aria-hidden />
    <span className="price">$</span>
  </div>
</div>
```

Sketch for split / pizza name→prices:

```tsx
<div className="item-row" data-kind="split"> {/* or pizza */}
  <span className="bullet" aria-hidden />
  <div className="item-copy">…</div>
  <span className="dots" aria-hidden />
  <div className="split-prices">…</div> {/* or pizza price cells */}
</div>
```

### CSS
```css
.item-row {
  display: grid;
  align-items: baseline;
  column-gap: 0.35rem;
  /* existing template vars OK — ensure .dots is in the track between copy and prices */
}
.dots {
  border-bottom: 1px dotted var(--color-rule);
  opacity: 0.75;
  flex: 1 1 auto;
  min-width: 0.75rem;
  align-self: end;
  transform: translateY(-0.22rem);
  pointer-events: none;
}
.lead-price {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  min-width: 3.4rem;
  width: 100%;
}
/* Pizza / split: dots as grid/flex child between .item-copy and prices */
.item-row[data-kind="pizza"] .dots,
.item-row[data-kind="split"] .dots {
  grid-column: auto;
  min-width: 1rem;
}
```
Leaders must render on **screen and print** (`print-color-adjust: exact` already on `.paper`).

## 2) Dividers must not intersect items
### Column rules
Replace `.menu-col { border-right: 1px solid … }` with **gutter-only rules**:

```css
.menu-columns {
  display: grid;
  grid-template-columns: repeat(var(--paper-cols), minmax(0, 1fr));
  gap: 0 1.25rem; /* clear air between columns */
  align-items: start;
}
.menu-col {
  border-right: 0 !important; /* remove intersecting border */
  padding-right: 0;
  min-width: 0;
  position: relative;
}
/* Rule centered in the gap — never overlaps item ink */
.menu-col:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  right: calc(-0.625rem); /* half of 1.25rem gap */
  width: 0;
  border-right: 1px solid var(--color-rule);
  pointer-events: none;
}
```
Keep section heads’ tomato underline; that is not a column divide.

### Page / sheet divides (4 × Letter)
- Keep `packLetterPages` so **whole categories** stay on a sheet (existing `LETTER4P_PAGES` / `LETTER4L_PAGES`).
- Enforce:
```css
.menu-section,
.item-row,
.section-head,
.pizza-cols {
  break-inside: avoid;
  page-break-inside: avoid;
}
```
- Print: each `.letter-sheet` = one letter page (`width: 8.5in; height: 11in` portrait, or landscape swap). `break-after: page` between sheets; last sheet no forced blank.
- Do **not** use a single board clipped into four quads (no overlapping shift transforms that slice mid-item). Each sheet is its own `BoardFace` with that page’s categories (already the model — keep it; remove any leftover clip/shift path if still referenced).

### Masthead
- Sheet 1 only: full masthead (brand, address, phone, hours, size legend).
- Sheets 2–4: compact running header only (shop name + phone, one line) so items get more vertical room — **large menu**, not repeated giant mast.

## 3) Large enough for 4 × letter
On `.paper[data-pack="letter4p"]` and `.paper[data-pack="letter4l"]` (or `.letter-sheet .paper`):

```css
.letter-sheet .paper {
  --paper-cols: 2; /* portrait */
  --type-name: 0.95rem;
  --type-desc: 0.72rem;
  --type-price: 0.95rem;
  --type-cat: 1.05rem;
  --pip: 0.45rem;
  --price-col: 3.75rem;
  padding: 0.55in 0.5in 0.45in;
}
.letter-pack[data-orient="landscape"] .letter-sheet .paper {
  --paper-cols: 3;
  --type-name: 0.9rem;
  --type-price: 0.9rem;
  --type-cat: 1rem;
  padding: 0.4in 0.45in 0.35in;
}
```
Tune so each sheet’s content fills most of the printable area without overflow clipping mid-row. If a page overflows at 125%, prefer **rebalancing `LETTER4*_PAGES`** (move a whole category to another sheet) over shrinking type below ~0.85rem names.

Suggested page balance (adjust if live menu counts change):
- **P1:** pizza, gourmet (+ mast)
- **P2:** appetizers, salads, sides, wings
- **P3:** turnovers, sandwiches, clubs, hot-subs, cold-subs
- **P4:** steak-subs, burgers, wraps, gyros, pasta, desserts, beverages

## 4) Board studio UX polish
- `board-studio.tsx`: embedded Board defaults `paper="letter4p"`, `printScale` default **125** when unset.
- Print button stays **Print / Save PDF**; remind in subcopy to enable background graphics.
- Category jump: hide on letter pack (already) — OK.

## Files to touch
1. `src/components/menu-board.tsx` — dotted leaders on all row kinds; optional compact mast on sheets 2–4; keep letter pack paging  
2. `src/components/board-studio.tsx` — Board defaults (letter4p, 125%)  
3. `src/styles.css` — large letter-pack type, gutter column rules, leader CSS, print sheet sizing, break-inside avoid  

## Smoke after Build + Export
1. Admin → Board → **4 × Letter** portrait → preview shows 4 sheets, large type  
2. Every item shows **dots from name to price** (pizza: name …… SM MD LG XL)  
3. Column rule sits in the **gap**; no price/name ink crossed by the rule  
4. Print / Save PDF → 4 letter pages; no mid-item cut; no sheet number marks  
5. Landscape pack still works (3 columns, gutters clean)  
6. Guest menu / checkout unchanged  

## After Workshop Build
Export → Storefront must run a **real** `npm run build` (not prebuilt `.vercel/output`).

**Status:** Workshop-only Build paste — implement in Grok Workshop, then Export.
