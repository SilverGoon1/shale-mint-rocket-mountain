# Hotfix — staff_admin_login_enabled column + summary 500
SoT: shale-mint-rocket-mountain.grok.me

## Problem
- Bot access “Diagnostic Admin login” toggle fails: `column "staff_admin_login_enabled" of relation "shop_settings" does not exist`
- `GET /api/bot/v1/security/summary` → 500 (queries same missing column)
- UI: “Host secret is not set.”

## Must
1. Ensure schema on boot / first Admin load (and in migration):
   ```sql
   alter table shop_settings add column if not exists staff_admin_login_enabled boolean not null default false;
   alter table shop_settings add column if not exists staff_admin_login_touched boolean not null default false;
   ```
2. `diagnosticDeskAuthStatus` / security summary: if column missing, catch and return `diagnosticDeskAuth:false`, `staffSecretConfigured` honest — **never 500**.
3. Toggle save uses ensure-columns-first, then update.
4. After column exists: default OFF (false) until explicitly enabled.

## Ops after publish (Silvergoon)
1. Grok Build host secrets: `STAFF_ADMIN_PASSWORD=Pass` (and optional `STAFF_ADMIN_LOGIN_ENABLED=true` only if code reads it)
2. Republish/restart if secrets need it
3. Admin → Bot access → turn **Diagnostic Admin login** ON
4. Verify Admin/Pass login + security/summary 200 with flags

## Must not
Enable card; weaken bots; seed Pass in source.

## Acceptance
- security/summary 200 with diagnosticDeskAuth + staffSecretConfigured
- Toggle ON persists; Admin/Pass works when secret set
