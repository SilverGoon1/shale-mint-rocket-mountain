# Replace Diagnostic Admin toggle → per-account Admin mode
SoT: shale-mint-rocket-mountain.grok.me

## Why
Shared `Admin` / `Pass` + Bot access “Diagnostic Admin login” is brittle on prod-flagged Grok (short Pass wiped; toggle/column friction). Email OTP/confirm not shipped yet, so bots can’t verify email to get desk access. Each bot needs its **own** login and a simple way to enter Admin mode.

## Must

### Remove
1. Remove Bot access **Diagnostic Admin login** kill-switch UI (and stop relying on shared desk `Admin`/`Pass` for team QA).
2. Do not require `STAFF_ADMIN_PASSWORD` / hash for teammate desk access going forward (Silver’s real staff account can remain separately if already present).

### Account dropdown — Admin mode
3. In the header **account / name dropdown**, add a toggle: **Admin mode** (or “Enter admin mode”).
4. When ON for that signed-in account → grant Admin desk access (`/admin/*`, POS, Delivery, Bot access, etc.) for **that user only**.
5. When OFF → normal customer/session behavior (no staff chrome flash).
6. Persist per-user (e.g. `profiles.admin_mode` boolean or role elevate flag) — not a global shop_settings kill switch.
7. Only accounts explicitly allowed (or all staff-flagged / bot-created accounts Silver enables) can turn Admin mode on — Security: don’t let random guests self-elevate. Prefer: accounts minted as “desk” / role admin, or Silver grants admin_mode_allowed.

### Each bot creates its own login
8. Because email confirmation is **not** established: allow desk bot accounts to sign up / sign in with email+password **without** blocking on email OTP / unverified gate (desk path only, or global until OTP ships).
9. Each bot (Style, POS, Driver, Finance, Security, NewCustomer, CoS) creates **their own** account (unique email/username + password they store privately) — no shared Admin/Pass.
10. Silver (or existing Admin) can mark those accounts as allowed for Admin mode, OR first account creation by Silver grants admin_mode_allowed.
11. Document in Bot access (or a short Admin → Team accounts note): “Each bot uses its own login; enable Admin mode from the name dropdown.”

### UX
12. Dropdown shows current name + Admin mode toggle + Sign out.
13. Admin mode ON: clear badge/indicator in header (e.g. “Admin”) so desk vs guest is obvious.
14. Mobile ~390 usable.

## Must not
- Re-introduce global Diagnostic Admin Pass as the primary path
- Enable card payments
- Weaken bot API scopes (separate from human login)
- Let unverified **guest customers** self-toggle into Admin
- Require Resend/email OTP before this ships (OTP stays a later paste)

## Security constraints
1. Admin mode toggle only for `admin_mode_allowed` (or role=admin) accounts — never open to all customers.
2. Audit when Admin mode is turned on/off (who, when).
3. Prefer password ≥8 for bot-created accounts (Better Auth signup floor).
4. Unverified-email bypass limited to accounts Silver marks for desk, or a `desk_account` flag — not every signup on the public net if avoidable. If temporary global bypass until OTP: document and time-box.

## Acceptance
- [ ] Diagnostic Admin toggle gone from Bot access
- [ ] Bot creates own email/password account, signs in without OTP wall
- [ ] Name dropdown → Admin mode ON → can open /admin/pos, /admin/bots, Delivery
- [ ] Admin mode OFF → cannot operate desk
- [ ] Guest customer cannot enable Admin mode
- [ ] Style/POS/Driver each use distinct logins

## Ops after publish
1. Silver signs in (existing account)
2. Each bot signs up their own account (or Silver mints)
3. Silver grants Admin mode allowed if needed
4. Bots toggle Admin mode ON from dropdown for desk work
