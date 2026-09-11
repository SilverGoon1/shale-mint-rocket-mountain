# South End next combined Build (system-test merge)

**SoT:** `shale-mint-rocket-mountain.grok.me` / `southendpizza.app`  
**Out of scope:** Neon cutover, live card payments, Better Auth / staff secret changes, zone DB edits, weakening scopes

## Sources
Desks: Driver · NewCustomer · Finance · Security · POS · Style  
Tickets: #000021 (Security) · #000022 (NewCustomer/POS) · #000023 (Driver) · #000024 (Style) · #000025 (Finance)  
Hotfixes: `HOTFIX_ACCOUNT_LOAD_TIMEOUT_BUILD_PASTE.md` · `HOTFIX_DESK_GRANT_ROSTER_BUILD_PASTE.md`  
Rollup: `diag/system-test/BUGS_ROLLUP.md` · POS eval: `diag/system-test/POS_EVAL.md`

---

## MUST (deduped)

1. **Account load / SessionGate timeout** — End "Could not load your account" / ~14s hang (guest + desks). Guest `/admin` → Navigate `/login` before `getMe`. Cached once-per-process `ensureAdminModeColumns` (outside invitee_bonus early-return). **Never** `ALTER TABLE` or bcrypt/staff seed on every `getMe`. SELECT `admin_mode*` try/catch → default false; ensure+retry once; never hang past timeout. Clear pizza loader when account load fails/succeeds (no stuck spinner).

2. **Desk grant UI + Admin mode toggle** — Bot access "Team / desk accounts" roster: list desk emails (masked/local-part); one-click grant/revoke `admin_mode_allowed`; soft max ~12; audit (`actor_id`, `target_id`, `at`). Header dropdown: **Admin mode** toggle only when `admin_mode_allowed`; persist `admin_mode`; OFF clears desk chrome. Server enforce every `/admin/*` + desk serverFns: `admin_mode_allowed && admin_mode` (Silver owner always-on OK). Temp Admin ON cannot grant others. Optional `auth.desk.grant` for Security/CoS only — not Style/POS/Driver.

3. **Category carousel hysteresis** — Chip/content desync FAIL (Driver/POS/Style): Salads↔Sides↔Wings↔Turnovers; Appetizers↔Salads; Sandwiches↔Clubs; desktop + ~390 + ~1024×530. Fix: majority-visible / IO threshold + rootMargin + section scroll-margin; debounce scroll-spy; hysteresis so prior chip does not stay while next heading dominates; chip tap does not leave old section mid-smooth-scroll ~800ms.

4. **FAB clearance** — Call/Chat FABs must clear lower-right menu cards by ≥72px (Style FAIL).

5. **POS Complete toast + Accept disable** — On Complete: reuse Accept toast helper — green `Completed #XXXXXX · $XX.XX` (+ tip if any), 3–4s; close popup; stay on Open. **Disable Accept** once status is Accepted (no double-accept). Desk `/admin/pos` must load reliably after #1 (POS eval: Completes held — desk UI blocked by account-load; money/Accept PASS via API).

6. **Chat order picker / same-account ticket linking** — Signed-in customer: list open tickets for this account (or link by ticket #) so Send unlocks; "Place an order first" only when truly no attachable ticket. Do not require guest-session order for desk login. (Guest chat without full account = NICE.)

7. **Cook-note bleed** — Clear cook notes when cart empty; do not inherit across sessions/bots. POS eval MUST: #000022 + #000023 show cook `QA-Security-systest` while order notes null (bleed from Security). #000021 OK intentional; #000025 Finance intentional. Fix client cart/session note state so empty/new carts ship null cook notes.

8. **Stale deliver-here badge** — Invalidate zone badge on address change (before blur/recheck); avoid Northfield geocode-as-EHT false positive.

9. **Finance checkout / tax / Financials / Insights / TZ**
   - Client `validateCheckout` delivery-min $15 gate (mirror server; hard reject before address accept is OK — friendlier copy = NICE).
   - Watch delivery tickets tax=0; `placeOrder` `computeTax` includes `deliveryFee`.
   - Financials Collected / `payments.collected`: split Outstanding vs Collected; exclude `awaiting_payment`.
   - Insights: drop 400-order cap → SQL aggregates.
   - KPI Today timezone: `America/New_York`.

10. **Login invalid error + toggle spacing** — Bad password: no Email/Phone ↔ Sign in/Create overlap/clip/black bars (desktop short viewport); prioritize toggle-row spacing when `formError` set. Copy username-aware ("Invalid username or password" / email+username). Readable on cream; mobile ~390 OK. Generic auth error only.

---

## NICE

- Friendlier delivery-min copy; post-hotfix Admin street-check / Driver map chrome
- Soft guest skip account load on checkout ("Continue as guest")
- Ticket popup vs inbox (#000024) — do not block inbox
- Guest chat without full account for pre-order help
- Grant Admin mode for POS desk; document desk route `/admin/pos` (not `/employee` or `/order`)
- Carousel damp for mild NewCustomer/Security lag; arrow flush / sticky Search / pill-center (prior Style polish if time)
- Require-card gated; Card "not live" notice
- Mobile header scrunch (≤640px title bar) — not in Style final MUST; polish if touched
- Optional getMe timing log

---

## MUST NOT / do not regress

- Weaken bot scopes; enable live card payments; Pass/staff secret in source; Auto-review to Silver
- Guests self-elevate / see Admin mode toggle; temp Admin granting others
- Default-allow all; soft-open `/admin` for guests
- ALTER/bcrypt on every `getMe`; contradict `ADMIN_MODE_PER_ACCOUNT` grant rules
- Zones editable outside Admin/DB
- Regress: Complete→close popup + stay on Open; Accept/API + `X-Bot-Id: pos`; `orders/recent` enrichment; Zion 443/450 guest delivery; Review sole red CTA; Wings sauces/dips + qty×10; category titles only (no body under titles)

---

## Acceptance checklist

- [ ] Cold load after deploy < few seconds; no 14s SessionGate under 2–3 concurrent logins
- [ ] Guest `/admin` → `/login` (no account timeout hang); pizza loader clears
- [ ] Bot access Team/desk roster: grant + revoke + audit; soft max ~12
- [ ] `admin_mode_allowed` → Admin mode toggle in header; without → no toggle; OFF clears desk
- [ ] Server rejects `/admin` when not `admin_mode_allowed && admin_mode`
- [ ] Driver (after grant) reaches `/admin/bots` without account-load error
- [ ] Carousel: rapid adjacent chips + free-scroll up/down — chip matches majority-visible section (desktop + 390)
- [ ] FAB ≥72px clear of lower-right cards
- [ ] POS Complete → green Completed toast; Accept disabled after Accepted; `/admin/pos` loads
- [ ] Chat: signed-in account with open ticket can Send; order picker or ticket# link works
- [ ] Empty/new cart → cook notes null; no QA-Security-systest bleed on tickets like #000022/#000023
- [ ] Address edit out-of-zone → badge updates without waiting blur
- [ ] Delivery min mirrored client+server; delivery tax includes fee; Financials Collected excludes awaiting_payment; Insights not 400-capped; Today = America/New_York
- [ ] Bad login: clean error, no toggle overlap/black bars

---

## Already PASS this week (do not redo)

- Wings sauces/dips + qty ×10
- Category titles only (section headers clean)
- Review = sole red CTA
- Zion 443 / 450 guest delivery ($3.50 each)
- Connect menus / desk CONNECTED (Driver, Finance, Security, Style, POS site)
- Orders placed: #000021–#000025 smoke paths (tax 6.625% on Finance #000025 OK)
- Money PASS on #000021–#000025 — all Accepted (API); Completes blocked by account-load / desk UI (toast + double-accept UI not verified this run)
- POS Accept/API + Complete→close+stay Open + orders/recent enrichment
- FINANCE_UI checkout glance
- Chat OPEN shell (Send gated until ticket link — fixed by MUST #6)

---

*Merge of six desk patch notes + BUGS_ROLLUP + POS_EVAL + account-load + desk-grant hotfixes. Prefer shipping MUST #1+#2 in same deploy.*
