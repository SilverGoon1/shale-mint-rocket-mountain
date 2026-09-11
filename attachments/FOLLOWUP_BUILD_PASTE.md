# South End FOLLOW-UP Build (post-live retest)

**SoT:** `shale-mint-rocket-mountain.grok.me` / `southendpizza.app`  
**Context:** `NEXT_COMBINED_BUILD_PASTE.md` partially landed. Retest desks show several MUST PASSes; desk **account-load / SessionGate** still blocks Admin chrome, POS Completes, grant UI, Financials/Insights. Prefer shipping **account-load FIRST** in same deploy with Style UX fixes.  
**Out of scope:** Neon cutover, live card payments, Better Auth / staff secret changes, zone DB edits, weakening scopes

---

## Live PASS (do not redo)

- **Cook-note bleed** — #000026/#000027/#000028 clean; empty/new carts null; no Security bleed
- **Guest `/admin` → login** — lands Welcome back (fix: preserve `next=/admin`, not `next=/login`)
- **Zone badge invalidate** — “We deliver here” clears on out-of-zone address edit
- **Finance delivery-min client** — “Delivery minimum is $15.00”
- **Finance delivery tax includes fee** — #000030 tax $1.56 on $23.50 (food+fee)
- **Driver carousel** — PASS this run (Style + NewCustomer still FAIL → keep MUST, make robust)
- **Finance carousel** — PASS this run

---

## MUST still open (deduped)

1. **Desk account-load / SessionGate** — `/admin`, `/admin/pos`, `/admin/bots` pizza loader never clears → “Could not load your account” / timeout (POS, Security, Style, Driver FAIL). End hang; clear loader on fail/success; never `ALTER`/bcrypt/staff seed on every `getMe`; cached once-per-process `ensureAdminModeColumns`; SELECT `admin_mode*` try/catch → default false. **Ship first.**

2. **Preserve `next=/admin`** — Guest `/admin` redirect must keep `next=/admin` (not `next=/login` / `%2Flogin`). Post-login return to intended desk route.

3. **Grant roster + Admin mode toggle** — Once desk loads: Bot access Team/desk roster (list desk emails; grant/revoke `admin_mode_allowed`; soft max ~12; audit). Header **Admin mode** toggle only when allowed; persist `admin_mode`; OFF clears desk chrome. Server enforce `admin_mode_allowed && admin_mode` on `/admin/*` + desk serverFns. Temp Admin ON cannot grant others.

4. **Carousel hysteresis (robust)** — Style + NewCustomer still FAIL (chip flips before content / transient wrong section). Driver PASS this run — harden so all desks pass: majority-visible / IO + rootMargin + section scroll-margin; debounce; hysteresis; chip tap doesn’t leave old section mid-smooth-scroll ~800ms. Desktop + ~390 + ~1024×530. Rapid Salads↔Sides↔Wings↔Turnovers / Appetizers↔Salads / Sandwiches↔Clubs.

5. **FAB ≥72px clearance** — Call/Chat FABs must clear lower-right menu cards by ≥72px (Style FAIL — Call overlaps card).

6. **Login invalid copy + Email/Phone black-bar** — Bad password: username-aware copy (“Invalid username or password” / email+username); no Email/Phone ↔ Sign in/Create overlap/clip/black-bar collapse (desktop short viewport); prioritize toggle-row spacing when `formError` set. Cream-readable; mobile ~390 OK. Generic auth error only.

7. **Flush category section gaps** — Reduce large vertical gaps between category sections for continuous/flush scroll; keep readable breathing room (don’t crush into previous last card). Works with carousel scroll-spy/hysteresis. Mobile + desktop. (See `diag/patch-notes/Style_FOLLOWUP_ADD.md`.)

8. **Chat ticket linking / Send unlock** — Signed-in customer: list/link open tickets so Send unlocks; picker OK but “No ticket yet” when guest order not tied. Desk login must accept NewCustomer credentials (rejected this run). Do not require guest-session order for desk login.

9. **POS Complete toast + Accept disable** — Blocked until #1: green `Completed #XXXXXX · $XX.XX` (+ tip), 3–4s; close popup; stay on Open. **Disable Accept** once Accepted. Verify on live desk after account-load (#000024 held Accepted).

10. **Financials / Insights / Today TZ** — Blocked until Admin loads: Collected vs Outstanding (exclude `awaiting_payment`); Insights SQL aggregates (drop 400-order cap); KPI Today = `America/New_York`.

---

## NICE

- Friendlier delivery-min copy; post-hotfix Admin street-check / Driver map chrome
- Soft guest skip account load on checkout (“Continue as guest”)
- Ticket popup vs inbox — do not block inbox
- Guest chat without full account for pre-order help
- Grant Admin mode for POS desk; document `/admin/pos`
- Carousel damp for mild lag; arrow flush / sticky Search / pill-center
- Require-card gated; Card “not live” notice
- Mobile header scrunch (≤640px) polish if touched
- Optional getMe timing log
- Zion Admin 450+fees verify after account-load (Driver PARTIAL: 443 Inside before load died)

---

## MUST NOT / do not regress

- Weaken bot scopes; enable live card payments; Pass/staff secret in source; Auto-review to Silver
- Guests self-elevate / see Admin mode toggle; temp Admin granting others
- Default-allow all; soft-open `/admin` for guests
- ALTER/bcrypt on every `getMe`; contradict `ADMIN_MODE_PER_ACCOUNT` grant rules
- Zones editable outside Admin/DB
- Regress PASSes above: cook-note bleed; zone badge; delivery-min client; delivery tax+fee; Driver/Finance carousel; guest→login shell; Wings sauces/dips + qty×10; category titles only; Review sole red CTA; Zion 443/450 guest delivery; Complete→close+stay Open; Accept/API + `X-Bot-Id: pos`; `orders/recent` enrichment

---

## Acceptance checklist

- [ ] Cold desk load < few seconds; pizza loader clears; no SessionGate hang under 2–3 concurrent logins
- [ ] Guest `/admin` → `/login?next=/admin` (or equiv.); post-login lands Admin/desk
- [ ] Bot access Team/desk roster: grant + revoke + audit; soft max ~12
- [ ] `admin_mode_allowed` → Admin mode toggle; without → no toggle; OFF clears desk
- [ ] Server rejects `/admin` when not `admin_mode_allowed && admin_mode`
- [ ] Driver (after grant) reaches `/admin` + `/admin/bots` + `/admin/pos` without account-load error
- [ ] Carousel rapid adjacent chips + free-scroll — chip matches majority-visible (Style + NewCustomer + Driver; desktop + 390)
- [ ] FAB ≥72px clear of lower-right cards
- [ ] Bad login: clean copy; no Email/Phone black-bar / toggle overlap
- [ ] Category sections flush — no big empty bands; scroll-spy still stable
- [ ] Chat: NewCustomer desk login works; signed-in with open ticket can Send; picker/ticket# link
- [ ] POS Complete → green Completed toast; Accept disabled after Accepted
- [ ] Financials Collected excludes awaiting_payment; Insights not 400-capped; Today = America/New_York

---

*Post-live follow-up after NEXT_COMBINED partial land. Prefer MUST #1+#3+#4–7 in one deploy; #9–10 verify once Admin loads.*
