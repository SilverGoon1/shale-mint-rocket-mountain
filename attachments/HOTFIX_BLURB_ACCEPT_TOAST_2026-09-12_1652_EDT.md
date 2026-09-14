# HOTFIX — Pizza blurb + Accept toast
**When:** 2026-09-12 4:52 PM EDT  
**SoT:** `https://shale-mint-rocket-mountain.grok.me` only  
**From:** Chief of Staff  
**Paste into Grok Build** — two MUST FAILs, one ship.

| Lane | Owner smoke | Status |
|---|---|---|
| A) Pizza blurb auto-update | Style | FAIL |
| B) POS Accept toast | POS (`#000041`) | FAIL (Complete toast PASS) |

Supersedes standalone `HOTFIX_PIZZA_BLURB_2026-09-12_1636_EDT.md` (same blurb content, folded here).

---

# A) Pizza blurb auto-update

**Evidence:** `/workspace/diag/site/Style_PATCH_SMOKE.md` · `screens/patch_guest_pizza_no_blurb.png` · `screens/patch_pizza_section_description_stale.png`

## Fail (live)

| Surface | Live now | Want |
|---|---|---|
| Guest `/` Pizza (and Gourmet) header | `<h2>Pizza</h2>` only — **no** blurb | Live ladder under the h2 |
| Admin Pizza section Note | `… Extra toppings $2.00 each.` (stale seed) | Live ladder string |
| Ladder “Pizza blurb (live)” | drops **XL $5.25** | `$2.25 / $3.25 / $4.25 / $5.25` |
| `/board` `.section-note` | Already correct | Keep |

Price locks (do not regress): topping add-on **$2.25 / $3.25 / $4.25 / $5.25**.

## Root cause
1. `pizzaNote` / `applyPizzaSizing` already put the full XL blurb in storefront payload — guest `cat-panel-head` **does not paint it** (SSR is h2-only).
2. Admin `getAdminShop` returns raw DB note (no `applyPizzaSizing`) → seed `$2.00 each`.
3. Ladder live caption gates XL on item scan (`hasXl`) → drops XL even when `toppingPriceXl` is set.

## Must (code)

### A1) `pizzaNote` always includes full ladder — `src/lib/pizza.ts`
- Topping line **always** SM/MD/LG/**XL** from `toppingPricesFrom(settings)` (never hardcode $).
- Do **not** omit XL because items lack an XL column.
- Size preface: prefer item sizes (incl. XL inches); fallback e.g. `12" SM · 14" MD · 16" LG · 18" XL`.

### A2) Guest paints blurb — `src/components/storefront.tsx` (+ any live twin)
- Under every `kind === "pizza"` header (Pizza + Gourmet): render blurb.
- Prefer `cat.note` when it matches live `pizzaNote(settings, cat.items)`; else render `pizzaNote(...)`.
- Must show in **SSR + client** (fix render path, not only JSON).

### A3) Admin Note tracks ladder
- Live caption under Extra topping prices: **“Pizza blurb (live)”** = full XL `pizzaNote`.
- Pizza-kind section Note: read-only / auto-overwrite from `pizzaNote` on ladder change + Save — **not** editable stale `$2.00 each`.
- On Save: write live `pizzaNote` into `menu_categories.note` for every pizza-kind category.

### A4) Seed — `src/data/menu.ts`
- Kill default `Extra toppings $2.00 each.` (let `applyPizzaSizing` own it).

---

# B) POS Accept toast

**Evidence:** POS PATCH LIVE whirl on `#000041` — sticky PASS · accept_disable PASS · **complete_toast PASS** · **accept_toast FAIL** (no visible toast).

## Root cause (repo)
- Desk Complete already calls `setPosToast(formatCompletedToast(...))` in `src/routes/admin/pos.tsx` → `setStatus`.
- Desk **Accept** (status chip → `accepted`) updates the ticket but **never** calls `formatAcceptedToast` / `setPosToast`.
- Incoming-modal Accept toasts only inside `IncomingOrderQueue` local state; desk Accept path never hits that. Complete toast on the same POS page proves the toast chrome works — Accept just never fires it.

## Must (code)

### B1) Desk Accept fires the same toast chrome as Complete — `src/routes/admin/pos.tsx`
In `setStatus`, when the resulting order status is **accepted** (or requested `status === "accepted"` succeeds):

```ts
setPosToast(formatAcceptedToast({ ticketNo: r.order.ticketNo, formatTicketNo }));
```

Mirror Complete: non-blocking, `save-toast pos-accept-toast`, `POS_TOAST_MS` (~3.5s), use existing `formatAcceptedToast` from `@/lib/pos-toast`.

Also on idempotent “already accepted” success (if you treat it like already-completed): still show Accept toast once.

### B2) Incoming-modal Accept also lands on POS page toast
In the `POS_ACCEPTED_EVENT` listener on the POS page: besides sticky status merge, also:

```ts
setPosToast(formatAcceptedToast({ ticketNo: order.ticketNo, formatTicketNo }));
```

So Accept from the incoming alert shows the same visible toast even if the queue unmounts.

### B3) Do not regress
- Complete toast (`Completed #… · $…`) stays PASS
- Accept disable once Accepted stays PASS
- Sticky cold / tab stay PASS
- No silent auto-accept; toast only after a real Accept success

Copy target (existing helper): `Accepted` / `Ticket #000041 accepted — sent to the kitchen.`

---

# Must not
- Change locked ladder $ or XL Cheese / one-topping menu prices
- Bundle Continuity / soft-max / find-by-label / printer / Card
- Break `/board` note or Complete toast

---

# Acceptance

## Style (lane A) after publish
- [ ] Guest `/` Pizza + Gourmet headers show live blurb incl. **$5.25** (hard refresh)
- [ ] Admin Pizza Note ≠ `$2.00 each`; matches ladder
- [ ] Ladder “Pizza blurb (live)” includes **$2.25 / $3.25 / $4.25 / $5.25**
- [ ] `/board` section-note still full ladder

## POS (lane B) after publish
- [ ] Fresh **placed** ticket → desk Status **Accept** → visible Accept toast ~3–4s
- [ ] Incoming **Accept order** → same visible Accept toast
- [ ] Complete toast still shows on Complete
- [ ] Accept stays disabled after Accepted

## Out
Find-by-label · Continuity (already PASS) · soft-max · Card · printer
