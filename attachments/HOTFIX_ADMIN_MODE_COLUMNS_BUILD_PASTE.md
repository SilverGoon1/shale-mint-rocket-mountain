# Hotfix — profiles.admin_mode_allowed / admin_mode columns
SoT: shale-mint-rocket-mountain.grok.me (preview + live)

## Problem
After Admin-mode paste: account creates, no dropdown Admin toggle, pepperoni loader hangs, then error:
`column p.admin_mode_allowed does not exist`

Preview vs live: **same failure** if both hit a DB that never got the columns. Preview does not invent schema. Only different if preview uses a different empty DB that still needs the same ensure.

## Must
1. On boot / ensureSchema / first profile load (and migration):
   ```sql
   alter table profiles add column if not exists admin_mode_allowed boolean not null default false;
   alter table profiles add column if not exists admin_mode boolean not null default false;
   alter table profiles add column if not exists desk_account boolean not null default false;
   ```
2. Any SELECT that joins `p.admin_mode_allowed` must run **after** ensure, or catch missing-column and treat as false (never 500 / error page).
3. SessionGate / getMe / account load: if columns missing, ensure then retry once — don’t trap user on pizza loader forever.
4. Dropdown Admin toggle only renders when `admin_mode_allowed` is true (default deny — new accounts still no toggle until Silver grants — that part is correct).

## After publish
1. Hard refresh / new session
2. Silver (role=admin) grants `admin_mode_allowed` for desk bots via Bot access roster / grant UI
3. Bot signs in → name dropdown shows Admin mode → ON → desk works

## Must not
- Default `admin_mode_allowed` true for all signups
- Leave ensure only in a one-shot migration that Grok never ran

## Acceptance
- [ ] No error page on account load
- [ ] Pizza loader clears
- [ ] New customer: still no Admin toggle (deny)
- [ ] Granted desk account: toggle visible; server enforces
