# PATCH UPDATE — 2026-09-13 10:20 AM EDT
**SoT:** `https://shale-mint-rocket-mountain.grok.me` only  
**Compiled by:** Chief of Staff for Silver  
**Paste into Grok Build**

Folds open MUSTs from post-push site eval + Style chrome FAILs + prior hotfix lanes still open.

---

## Live locks (do not regress)
| Lock | Value |
|------|--------|
| Topping add-on SM / MD / LG / XL | **$2.25 / $3.25 / $4.25 / $5.25** |
| XL Cheese menu | **$20.95** |
| XL one-topping menu | **$23.95** |
| Extra Ranch / Extra Blue / Extra dressing | **$0.75** |
| Delivery minimum | **$5** (Silver intentional — was $15) |
| Delivery fee | **$4** (optional admin toggle still On) |
| Soft-max | **document-overage** (Silver skipped hard-enforce) |

---

## Ship order
1. **SessionGate grant = access** + remove Admin mode toggle (Security + Style — ship together)
2. Style chrome: email ellipsis + Admin button/tab overlap
3. Pizza blurb auto-update (guest + Admin + ladder XL)
4. POS Accept toast + Unauthorized hard-stop
5. Ranch/Blue extras apply to Add total (Finance still FAIL historically)
6. Find-by-label (Style MISSING — NICE if capacity)

---

## MUST

### A) SessionGate + remove Admin mode toggle
**Refs:** `STYLE_PATCH_REMOVE_ADMIN_MODE_TOGGLE.md` · Security fold in that paste · `STYLE_CHROME_BUILD_FOLD_2026-09-13.md`

**Live today:** `needAdmin` needs `(adminMode && adminModeAllowed) || role === "admin"`. Grant alone is **not** enough.

1. Pass `needAdmin` / desk chrome on **`adminModeAllowed` OR `role === "admin"`**.
2. Drop dependence on per-session client `adminMode` toggle.
3. **Remove** Admin mode switch from account / name dropdown (and POS account menu) — remove, don’t disable.
4. Guests / non-granted still blocked. **MUST NOT** soften Card gate, bot scopes, or grant roster.

Ship gate change **with** toggle removal — otherwise granted desks lock out of `/admin`.

### B) Account dropdown email overflow
**Ref:** `STYLE_PATCH_EMAIL_DROPDOWN_OVERFLOW.md`

- Long email: ellipsis inside menu panel; never paints past dropdown edge.
- Same shared component on POS Settings dropdown.
- Survives Admin toggle removal. Prefer single-line ellipsis (not multi-line shove).

### C) Menu & Shop Details button / tab overlap
**Ref:** `STYLE_PATCH_ADMIN_MENU_BUTTON_OVERLAP.md` · prior `STYLE_PATCH_ADMIN_TABS_390.md`

- @≤390 Admin tabs: no overlapping labels (scroll OK).
- Action buttons (Save all, Fill XL, shared extras, etc.): label fully inside button; no text-on-text.
- Guest storefront unchanged.

### D) Pizza blurb auto-update
**Refs:** `HOTFIX_BLURB_ACCEPT_TOAST_2026-09-12_1652_EDT.md` §A · `Style_PATCH_SMOKE.md`

1. `pizzaNote` always includes full ladder SM/MD/LG/**XL** from settings (never drop XL).
2. Guest Pizza + Gourmet headers **paint** the blurb (SSR + client) — payload already has it; DOM was h2-only.
3. Admin Note / “Pizza blurb (live)” track ladder — no stale `$2.00 each`; write live note on Save.
4. Seed `menu.ts`: kill `$2.00 each` default.
5. `/board` section-note already PASS — keep.

### E) POS Accept toast + Unauthorized hard-stop
**Refs:** hotfix §B · `POS_SITE_EVAL_0913.md` · `Security_NOTE_UNAUTHORIZED_0913.md`

1. Desk Status → **Accept** calls `setPosToast(formatAcceptedToast(...))` same path as Complete toast (Complete already PASS).
2. Incoming Accept also surfaces on POS page toast (`POS_ACCEPTED_EVENT` → `setPosToast`).
3. **Unauthorized hard-stop:** if session unauthorized / desk identity invalid, freeze Accept + desk mutations and force re-login — do **not** leave Accept clickable under a red Unauthorized banner.
4. No silent auto-accept without an actor (confirm Accept only from explicit Accept click / acceptOrder).
5. Do not regress: Complete toast, accept_disable, sticky.

### F) Ranch / Blue extras apply $
**Ref:** `STYLE_PATCH_EXTRAS_DIP_PRICE_PROP.md` · Finance money smoke FAIL (chip $0.75 visible; Add delta not proven)

- Extra Ranch / Extra Blue / Extra dressing: chip shows `$0.75` **and** bumps Add / food subtotal when selected.
- unitSize=2 where locked; shared extras write still OK.
- Prove Add delta before closing dialog.

### G) NICE (same paste if capacity)
- Find & set by option label (Style MISSING on bulk UX)
- Cookie / session isolate between desk smokes (multi-agent shared SoT browser) — product note; Security WATCH

---

## HOLD / OUT
- Soft-max hard enforce (Silver skipped — keep document-overage)
- Continuity (prior PASS — CS 0913 report still pending)
- Printer buy · live Card · Northfield Erase · Guest Bluetooth
- Vault / Command Center naming (paused)

---

## Eval board (partial — 2026-09-13)
| Desk | Result |
|------|--------|
| Driver | **PASS** (min $5 lock approved) |
| Security | **PASS** API; Unauthorized/desk-flip **WATCH** |
| POS | Complete/sticky/disable **PASS**; Accept toast **FAIL** (clean retest was in flight) |
| Style / Finance / CS | Full 0913 reports still pending; Style filed chrome FAILs above |

---

## Acceptance
- [ ] Granted desk opens `/admin/*` with **no** Admin mode toggle
- [ ] Non-granted / guest: no Admin chrome
- [ ] Long email ellipsis in account dropdown (@390 + desktop)
- [ ] Admin Menu tabs/actions: no overlapping labels @390
- [ ] Guest Pizza + Gourmet blurb shows `$2.25 / $3.25 / $4.25 / $5.25`
- [ ] Admin Note + ladder live caption include XL `$5.25` (no `$2.00 each`)
- [ ] Fresh PLACED → desk Accept → visible Accept toast ~3–4s
- [ ] Incoming Accept → same toast
- [ ] Unauthorized → Accept frozen / re-login required
- [ ] Extra Ranch selected → Add total +$0.75 (prove delta)
- [ ] Delivery min still **$5** / fee **$4**
- [ ] Complete toast still PASS

## After publish
Style / POS / Finance / Security / CS / Driver: hard-refresh SoT re-smoke their lanes; report PASS/FAIL to CoS.

---

## ADDENDUM — 2026-09-13 ~10:23 AM EDT (desk evals landed)

### Eval updates
| Desk | Result |
|------|--------|
| Finance | **PARTIAL** — DELIVERY_MIN PASS ($5/$4); TOPPING PASS; STACK PASS; **RANCH_BLUE FAIL/INCOMPLETE** (re-smoke after ship). File: `Finance_0913_EVAL.md` |
| Style | Customize ladder **PASS**; Extras Ranch Add bump **PASS** this Style run; email overflow **FAIL**; blurb/Admin Note/board/overlap incomplete. File: `Style_SITE_EVAL.md` |
| POS / Security | Standing by post-ship (unchanged) |

Note: Style proved Ranch `$14→$14.75`; Finance still wants post-ship re-prove. Keep §F MUST until Finance PASS.

### H) Wall `/board` print-scale overlap + Beverages (NEW)
**Ref:** `STYLE_PATCH_WALL_MENU_OVERLAP_BEVERAGES.md`

1. At print scales 110/125/150%: board text/columns must **not** overlap (reflow — not bare transform clip).
2. Beverages on `/board` only: **size + price** lines — no long desc/photos. Guest `/` Beverages unchanged.

Ship with wall print-scale work (after or with §C chrome if capacity).
