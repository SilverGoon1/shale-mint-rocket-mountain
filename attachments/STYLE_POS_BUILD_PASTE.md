# Style + POS Build paste (next push)
**SoT:** `https://shale-mint-rocket-mountain.grok.me`  
**Date:** 2026-09-11  
**Do NOT:** Neon cutover · enable card capture · expand bot scopes · renumber tickets · force login for guest checkout · Better Auth redesign

---

## PART 1 — POS (desk)

### Already PASS — don’t regress
- Complete from ticket popup → close popup immediately + stay on Open (no Complete-tab hijack)
- Empty Open: title `You're caught up` · subcopy `No open tickets. New orders will show here.` · optional ghost `View completed` (not primary red)
- Complete click → `Completing…` / disable (no double-submit); on failure keep popup + inline error
- Counts update; ticket leaves Open / appears under Complete
- Status colors: Placed / Accepted (yellow) / Completed (green)

### MUST — Completed toast (still FAIL / not signed off)
1. On successful Complete, fire the **same** success-toast component as Accept (same placement, contrast, auto-dismiss 3–4s, non-blocking).
2. Copy: `Completed #000019 · $15.73` ; if tip>0: `Completed #000019 · $15.73 (tip $Y.YY)` ; green Completed accent.
3. No PII (no name/phone/email/address/processor/card last4/userId).
4. If toast helper is Accept-only, extend to `status === completed` — don’t invent a second toast system.
5. Must not cover Open queue / next Accept CTA.

### SHOULD — ticket readability (kitchen/CX)
1. Accept card / `GET /api/bot/v1/orders/recent` enrichment (nullable-safe):
   - `pickupName`, `pickupPhone`
   - `itemCount`, `itemSummary` or structured lines with **name + size + mods**
   - `notes` (exact text; empty = blank, never stale)
   - `promisedEta` / ETA window
   - `tip`, `tax`, `subtotal`; `discount` / `deliveryFee` when non-zero
   - payment method + paid/unpaid readiness; if processor off: **Card (not live)**
2. Wings mods must mirror exactly on ticket / Accept card / itemSummary:
   - Sauce: Hot | Mild | Dry | BBQ
   - Included dips: 2 Ranch | 2 Blue cheese | None
   - Extras in sets of 2 only
3. Finance money stack on Accept card: grand total, tip separate from tax, food subtotal, fees when non-zero.

### SHOULD — friction fixes
1. Double-accept: after Accept, remove from incoming modal; disable Accept; server idempotent (**409** if already accepted) with current status.
2. `profiles_pkey` / account-load race: atomic `INSERT … ON CONFLICT DO NOTHING` then SELECT; never surface raw duplicate-key; friendly UI only.
3. Stable FIFO queue; clarify waiting / “Keep ticket waiting” copy.

### Ops note
- `#000019` may still be Accepted on Grok Open awaiting Style toast visual — don’t cancel unless needed.
- Admin POS session drops (login wall) blocked Style watch — lengthen desk session / reduce re-auth churn if easy.

---

## PART 2 — Style (guest + menu)

### A) Wings MAKE IT YOURS
- Sauce required (single): Hot | Mild | Dry | BBQ
- Included dips required (single): 2 Ranch | 2 Blue cheese | None
- Extra dips optional in sets of 2 (Extra Ranch / Extra Blue cheese)
- Price: use **menu-editor live price** (not hardcode); prior assumption +$1.50 / 2 cups if unset
- Add to bag disabled until sauce + included dips chosen
- Cart / ticket / kitchen show sauce + dips + extras

### B) Guest UX (prior smoke FAILs — include if not already live)
1. Hide POS/Admin header chrome from non-staff storefront routes
2. Confirm: require Name + Phone for pickup; block Confirm and place if empty  
   Account-load fail → Continue as guest (primary) / Sign in (secondary)
3. Pay at pickup = sole interactive pay option; Card = muted **notice only** (not disabled radio)
4. FAB clearance ≥72px bottom-right on menu; Call+Chat off Checkout primary
5. Stale cart: Resume order | Start fresh (start fresh clears cart + kitchen notes)
6. Note placeholders lighter / example-only; clear notes when cart empty
7. Optional: MAKE IT YOURS → Customize your pizza; Confirm and place sole primary; Edit order secondary; no Card upsell

### C) Menu editor dips + Slice-style browse + mobile polish
1. Menu editor: editable Extra Ranch / Extra Blue cheese price (per 2 cups); guest modal uses live price
2. Category chrome: bold section title + short muted note; editable category description
3. Slice-style: one long page all items; sticky category rail scrolls to section + scroll-spy (not filtered-only routes)
4. Mobile title bar ≤640px:
   - Logo mark + single-line **“South End”** or **“South End Pizza”** (drop “III” on xs)
   - Icon-only Cart; account **icon** not “Silver” text
   - Hide POS for guests; hide Egg Harbor from sticky bar
   - Bar height **≤64px**; no scrunched 4-line wrap / overlap
5. Phone grid: min **2** item cards side-by-side (not one giant card); Wings single item stays half-width — don’t stretch full
6. Category pills: allow horizontal scroll without clipping mid-label (padding + scroll; full label on focus) — avoid “Side Ord…” / “Pizza Turn…” truncations that cut mid-word awkwardly

### D) Keep if regressed
Wings sauces/dips + prior guest UX from earlier Style pastes.

---

## Acceptance checklist (after publish)

### POS
- [ ] Complete → toast appears once with correct copy/chrome
- [ ] Popup closes; Open stays selected; empty Open OK
- [ ] Accept card shows name/phone/items+mods/notes/money
- [ ] Wings mods visible on ticket
- [ ] Double-accept / profiles_pkey don’t regress

### Style
- [ ] Guest: no POS header; phone required; card notice-only; FAB OK; resume/fresh
- [ ] Wings: can’t Add without sauce+included dips; extras priced from editor
- [ ] Mobile ≤640px: single-line title, ≤64px bar, 2-up grid, category rail scrollable
- [ ] Slice scroll-spy sticky rail works

### Retest sequence
1. Style guest + mobile smoke on Grok
2. NewCustomer: one Small Cheese pay-at-pickup on `grok.me`
3. POS: Accept API → wait Style READY on Admin POS → Complete → toast PASS/FAIL
4. CoS: confirm `southendpizza.app` still 307 → Grok (re-apply prebuilt redirect if a Vercel deploy wiped it)

---

## Related artifacts
- `/workspace/SOUTHEND_COMPLETE_UPDATE.md` — full status dump
- `/workspace/email-otp.patch` — Resend signup/reset OTP (separate if not in this push)
- `/workspace/STYLE_POS_BUILD_PASTE.md` — this file

*Compiled by Chief of Staff from Style + POS locked pastes for Silvergoon’s next Grok Build push.*
