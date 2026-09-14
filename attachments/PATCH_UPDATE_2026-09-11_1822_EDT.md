# PATCH UPDATE — 2026-09-11 6:22 PM EDT
**SoT:** `https://shale-mint-rocket-mountain.grok.me` only (not southendpizza.app / Vercel apex)  
**Compiled by:** Driver (team poll: Style · CoS · NewCustomer · POS · Finance · Security)  
**Purpose:** Single Build paste for the next ship. Paste into Grok Build.

---

## Ship order
1. Auth / SessionGate / bad-login CRITICAL  
2. Style small-screen Admin tabs + dropdown + carousel/FAB  
3. Guest continuity (Review→guest, chat ticket Send)  
4. Money / Insights / POS Completed toast (don’t regress finance locks)  
5. PWA install name fix  
6. Companion (separate or same deploy if capacity): Driver tab `/admin/driver` ship-first — see `DRIVER_TAB_BUILD_PASTE.md`

---

## MUST

### Style
1. **Admin tab labels overlap @≤480 / ~390 — FAIL**  
   Payments→Tax ~5.1px; Delivery→Printers ~0.9px; Card Editor wraps; Printers past rail.  
   Screenshot: `/workspace/style-audit/admin-tabs-overlap-390.png`  
   Paste: `/workspace/style-audit/STYLE_PATCH_ADMIN_TABS_390.md`
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
   (Adjust selector to real Admin tablist class if needed.) NICE: 8–12px tab padding + scroll affordance.

2. **Admin mode dropdown misaligned** — label wraps; toggle not vertically centered.  
   Paste: `/workspace/style-audit/STYLE_PATCH_DROPDOWN_ADMIN_MODE_ALIGN.md` (flex + `align-items: center`).

3. **Carousel arrows** flush **4–8px** from edge on ≤390 (today ~16–22px).

4. **FAB clearance ≥72px** vs lower-right menu cards (today ~16px).

5. **CRITICAL — bad login** must show error and **never** land authenticated.  
   Paste: `/workspace/style-audit/STYLE_MUST_BAD_LOGIN_AUTH.md`  
   Prefer specific invalid-login copy (not only generic “Invalid email or password.”).

6. **One-step sign-out → true guest** (no desk-session hop).

### NewCustomer / guest
7. **Review order continuity** — signed-in checkout must NOT force guest / “Could not load your account” → Continue as guest (blocks tickets + chat).

8. **Delivery zone** — `1600 Tilton Rd, Northfield, NJ 08225` must be **OUT** (false-IN since ~1058; Z11). *Erase paint requires Admin GO — ops follow-up if not in this code paste.* Prefer guardrail: Z11/Northfield never auto-include.

9. **Chat** — after signed-in place, order picker lists open ticket + **Send unlock** (not “No ticket yet” when session drops to guest).

10. **Cook notes** stay null when blank (don’t regress bleed fix).

### POS
11. **Completed success toast** on desk Complete — dual FAIL (#000037): ticket moves / popup closes / stay-on-Open PASS, but no green `Completed #… · $…` toast. Reuse Accept toast helper.

12. **SessionGate sticky** — survive Open↔Complete + cold/reload; Delivery tab load especially flaky historically (menu recovered; Delivery residual).

### Finance (keep / don’t regress + finish when Admin loads)
13. Client **delivery-min $15** in `validateCheckout`.  
14. **Delivery tax includes fee** (food+fee).  
15. **Collected** = paid only; **Outstanding** = unpaid open.  
16. **Insights** SQL aggregates (drop 400-order cap); KPI **Today** = `America/New_York`.  
17. Tip never taxable; money stack: Subtotal → Discount → Delivery → Tax → Tip → Total.  
18. **Card stays gated** until Stripe hosted_page webhooks + Paid-from-server + full-refund stub + CoS/Silver GO; Dahlia `automatic_surcharge` OFF Phase 1.

### Security
19. Sticky **POS `/admin/pos`** account/Admin chrome consistency.  
20. Reliable **sign-out / session clear**; guest `/admin` → `/login?next=/admin` (not `next=/login`).  
21. Soft-max enforcement on desk grant roster (saw over-cap).  
22. Finish CoS+NC `admin_mode_allowed` if still missing when grant Task cleared.

### CoS / PWA
23. **PWA install name** still “Grok App” — use `site.json` title via `renderWebManifest`.  
    Paste: `/workspace/PWA_NAME_FIX_BUILD_PASTE.md`  
    `name=South End Pizza`, `short_name=South End`. After ship: uninstall old shortcut → reinstall.

### Driver (ops / companion)
24. Soften Delivery SessionGate so `/admin/menu?tab=delivery` reloads don’t “Could not load your account”.  
25. Guest address **normalize/autocomplete** to full municipality before zone PIP (short English Creek strings false-OUT).  
26. Companion feature (same or next deploy): **Driver tab** `/admin/driver` ship-first — `DRIVER_TAB_BUILD_PASTE.md` (New|Out|Delivered; stop cards; Start/Mark delivered; Call/Navigate; Paid chip; Delivery zones stay on Delivery tab).

---

## NICE
- Friendlier delivery-min copy (“Add $X more for delivery”)
- Soft-open Admin Settings: printer IP + test print (Epson TM-m30III LAN ePOS 8008/8043) — **buy HOLD**
- Admin mode toggle on POS header (`STYLE_NOTE_POS_ADMIN_TOGGLE.md`)
- Clearer chat empty-ticket UX
- PWA `notifications=(self)` header only if push already in this ship
- `site.json` title drop “III” if branding included
- Document Incognito seeded desk session for QA
- Ticket popup must not obscure Admin nav
- Prefer scoped `auth.desk.grant` bot API vs UI-only grants
- Pizza loader / account-load polish

---

## HOLD / OUT (do not put in this paste)
- Printer hardware buy  
- Completes greenlight / live Card / Stripe Element  
- Northfield Erase / zone Clear-all until explicit Admin GO  
- Neon cutover  
- Guest Bluetooth / camera  
- Weakening bot scopes  

---

## Do not regress (PASS bank)
- Guest carousel Salads→Side Orders→Wings→Turnovers (desktop + ~390) recent PASS streak  
- Complete → close popup + stay on Open; Accept disabled after Accepted  
- Cook-note isolation  
- orders/recent enrichment  
- English Creek exact `1000 English Creek Ave, Egg Harbor Township, NJ 08234` IN  
- Zion 443/450 guest delivery when Admin/guest aligned  
- Card frozen / least-privilege bot scopes  
- Guest `/admin` → login with `next=/admin`

---

## Acceptance (smoke after paste)
- [ ] Admin tabs @390: no overlapping labels; horizontal scroll OK  
- [ ] Admin dropdown: single-line label + centered toggle  
- [ ] Failed login: error only, stay logged out  
- [ ] Signed-in Review does not force guest  
- [ ] POS Complete shows green Completed toast  
- [ ] PWA install name = South End Pizza (reinstall shortcut)  
- [ ] Delivery tab load/reload does not sticky-fail SessionGate  
- [ ] Tilton/Northfield OUT (code guard and/or paint after Admin GO)

---

## Source refs (on box)
| File | Topic |
|------|--------|
| `/workspace/style-audit/STYLE_PATCH_ADMIN_TABS_390.md` | Tab overlap CSS |
| `/workspace/style-audit/STYLE_PATCH_DROPDOWN_ADMIN_MODE_ALIGN.md` | Dropdown align |
| `/workspace/style-audit/STYLE_MUST_BAD_LOGIN_AUTH.md` | Bad-login CRITICAL |
| `/workspace/PWA_NAME_FIX_BUILD_PASTE.md` | Manifest name |
| `/workspace/DRIVER_TAB_BUILD_PASTE.md` | Driver desk companion |
| `/workspace/UPDATE_BUILD_PASTE.md` | Prior CoS update paste |
| `/workspace/patches/_draft_inputs.md` | Raw team poll notes |

---

*End PATCH UPDATE — 2026-09-11 6:22 PM EDT*
