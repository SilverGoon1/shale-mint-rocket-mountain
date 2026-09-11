# South End Pizza — Complete update (2026-09-10 / 11)

**Audience:** Silvergoon (Build paste + ops status)  
**Live test SoT (current):** Grok Build `https://shale-mint-rocket-mountain.grok.me`  
**Official domain:** `https://southendpizza.app` → **307** → Grok Build (restored 2026-09-11 after a Vercel auto-deploy briefly served Neon/apex HTML directly)

> Warning: a normal GitHub → Vercel production deploy can wipe the Grok 307 again. Prefer testing on `grok.me` directly, or re-apply the prebuilt redirect after apex deploys.

---

## 1) What’s live / working now

### Hosts
| Host | Role |
|------|------|
| `shale-mint-rocket-mountain.grok.me` | **Test SoT** — shop UI + bot API + Admin POS |
| `southendpizza.app` | Redirects to Grok (when prebuilt redirect is in place) |
| Vercel/Neon (`southend/southendpizza`) | Parallel DB; had Neon `#000001` during the brief SoT flip — not current test DB |

### Bot API (Grok)
- Base: `https://shale-mint-rocket-mountain.grok.me/api/bot/v1`
- Hit **grok.me directly** (apex 307 can strip `Authorization`)
- Active Grok bots minted earlier: `security-guard`, `chief-of-staff`, `finance`, `pos`, `style`
- Style scopes: `health.read`, `menu.read` only (no `orders.read` by design)
- Custom bot create UI exists (Preset \| Custom) after Style/custom-bots paste

### POS Complete→close (Grok backtest)
Tickets used: `#000017`, `#000018` (NewCustomer QA, Small Cheese ~$15.73 pay-at-pickup)

| Check | Result |
|-------|--------|
| Popup closes on Complete | **PASS** |
| Stay on Open tab (no auto-jump to Complete) | **PASS** |
| Counts update; empty Open “You’re caught up” | **PASS** |
| Completing… disables (no double-submit) | **PASS** |
| Success toast `Completed # · $` | **FAIL** (none observed; Style amend needed) |
| Complete-tab history verify | **BLOCKED** once (Admin session Unauthorized); later Admin session restored |

**Stand-down:** No more toast QA tickets until Completed-toast amend ships.

### Style guest smoke (Grok) — guest UX paste **not** landed
| Check | Result |
|-------|--------|
| Hide POS header for guests | **FAIL** |
| Menu→Cart CTAs | **PASS** |
| FAB clearance | **Partial** (Call clips menu) |
| Pay at pickup | **PASS** selected |
| Card notice-only (not disabled radio) | **FAIL** |
| Confirm name + phone | **FAIL** (name-only) |
| Resume \| Start fresh | **FAIL** missing |
| Site crash/blank | **PASS** |

### Email (Resend) — code ready, Build env still needed
- Vercel Marketplace Resend provisioned on `southend/southendpizza`
- Env on Vercel Production/Preview: `RESEND_API_KEY`, `RESEND_EMAIL_DOMAIN`
- Patch artifacts: `/workspace/email-otp.patch`, `/workspace/EMAIL_OTP_BUILD_PASTE.md`
- Adds: shared mailer, signup 6-digit OTP, password-reset OTP actually emails
- **Still need:** paste into Grok Build + same env vars on Build

### Customer app presets (team consensus — not built yet)
1. In-app order status + opt-in Web Push (Accepted / Ready / ETA)
2. Saved defaults / reorder
3. Light PWA promote after successful order ( `/install` already exists)
4. Opt-in transactional SMS fallback (after push)
5. One-shot delivery geo later (when zones exist)

**Hard no:** background location, marketing in order channel, required PWA/push to order, guest Bluetooth/camera

---

## 2) PENDING BUILD PASTE (ship this next)

Paste into **Grok Build SoT** only. Do not enable card processor, change Neon cutover, expand bot scopes accidentally, or renumber tickets.

---

### PART A — Completed toast amend (POS + Style) — **required**

Reuse Accept toast component/helper for Complete:

- Copy: `Completed #0000XX · $XX.XX`  
  if tip > 0: `Completed #0000XX · $XX.XX (tip $Y.YY)`
- Green Completed accent; auto-dismiss 3–4s; non-blocking (must not cover Open queue / next Accept)
- No PII in toast (no name/phone/address/card)
- Keep existing PASS behavior: close popup, stay on Open, empty Open copy, disable during Completing…

**Acceptance:** After Complete, toast visible once; Open stays selected; empty state if last ticket.

---

### PART B — Style update — Wings customize + guest UX

#### B1) Wings MAKE IT YOURS (priority)
- Sauce required (single): Hot | Mild | Dry | BBQ
- Included dips required (single): 2 Ranch | 2 Blue cheese | None
- Extra dips optional in sets of 2 only (Extra Ranch / Extra Blue cheese)
- Price assumption: **+$1.50 per 2 cups** (Silvergoon correct if wrong)
- Add to bag disabled until sauce + included dips chosen
- Cart / ticket / kitchen must show sauce + dips + extras

#### B2) Guest UX (still failing smoke)
1. Hide POS/Admin header chrome from non-staff storefront routes
2. Confirm: require **Name + Phone** for pickup; block Confirm and place if empty  
   If account load fails: Continue as guest (primary) / Sign in (secondary)
3. Pay at pickup = sole interactive pay option; **Card = muted notice only** (not a disabled radio)
4. FAB clearance ≥72px bottom-right on menu; Call+Chat off Checkout primary
5. Stale cart: **Resume order | Start fresh** (start fresh clears cart + kitchen notes)
6. Note placeholders lighter / example-only; clear notes when cart empty

#### B3) Optional polish
- MAKE IT YOURS → “Customize your pizza”; keep Add to bag primary
- Confirm: Confirm and place sole primary; Edit order secondary; no Card upsell

**Do NOT**
- Remove Pay at pickup / force card / require login for guest pickup
- Strip MAKE IT YOURS size/modifier persistence
- Renumber tickets / wipe carts on unrelated nav / change checkout host mid-flow
- Touch Neon cutover, Better Auth redesign, bot scope expansion, card processor live

**Acceptance (guest):** no POS for guests; phone required; card notice-only; FABs don’t cover CTAs; resume/fresh works; Wings can’t add without sauce+dips; no auto-submit

---

### PART C — Email OTP (if not already in this Build)

See also: `EMAIL_OTP_BUILD_PASTE.md` + `email-otp.patch`

**Env on Grok Build (match Vercel):**
- `RESEND_API_KEY` (required)
- `RESEND_EMAIL_DOMAIN` (e.g. `southendpizza.app`)
- `EMAIL_FROM` optional override

**Files:** `src/lib/email/resend.server.ts`, shop-server signup/reset OTP, `login.tsx` OTP step, migration `0026_email_signup_codes.sql`, `resend` npm dep

**Acceptance:** email signup shows Check your inbox OTP; password reset emails code; phone/Google/X skip email OTP

---

## 3) After publish — retest plan

1. Style: guest smoke checklist (POS hidden, phone, card notice, FAB, resume/fresh, Wings customize)
2. NewCustomer: one Small Cheese pay-at-pickup on **grok.me**
3. POS: Accept via API → wait Style ready on Admin POS → Complete → confirm toast PASS
4. CoS: confirm `southendpizza.app` still 307s to Grok (if not, restore prebuilt redirect)

**Stand-down until then:** NewCustomer / POS / Style idle on toast tickets.

---

## 4) Related artifacts on disk

| File | Contents |
|------|----------|
| `/workspace/SOUTHEND_COMPLETE_UPDATE.md` | This document |
| `/workspace/email-otp.patch` | Resend + signup/reset OTP diff |
| `/workspace/EMAIL_OTP_BUILD_PASTE.md` | Email OTP paste notes |
| `/workspace/COMBINED_POS_STYLE_BUILD.patch` | Earlier POS quality-up + Style/custom bots (may already be partially live) |
| `/workspace/style-bot-access.patch` | Style + New Customer presets + Custom mint UI |
| `/workspace/sep-pos-quality-up.patch` | POS accept queue / orders.recent enrich / profiles_pkey |

---

## 5) Open decisions for Silvergoon

1. Confirm Wings extra-dip price (+$1.50 / 2 cups OK?)
2. Keep Grok as long-term SoT via redirect, or cut customers fully to Vercel/Neon later?
3. Ship Parts A+B in one Build push, or toast-only first?
4. Paste email OTP (Part C) in same push or follow-up?
5. Mint Style a custom `ops_read` bot (orders.read) or keep desk-UI-only for kitchen watch?

---

*Compiled by Chief of Staff from POS, Style, NewCustomer, Finance, Security votes and live Grok backtests through 2026-09-11.*
