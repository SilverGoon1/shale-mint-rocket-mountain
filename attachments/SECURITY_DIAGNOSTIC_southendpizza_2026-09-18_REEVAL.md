# Security diagnostic RE-EVAL — southendpizza.app (defensive / read-only)

| Field | Value |
|-------|--------|
| Target | https://southendpizza.app |
| Vercel | southend/southendpizza (`prj_zSx7vdpMFAyxGh9So5EPSbH0RAZh`) |
| Blueprint | `/workspace/shale-mint-rocket-mountain` @ `75980a0` (`origin/main`) |
| Prior baseline | `/workspace/patches/SECURITY_DIAGNOSTIC_southendpizza_2026-09-18.md` @ `0626b5c` |
| When | 2026-09-18 ~04:08–04:12 UTC (≈ 12:08–12:12 AM ET / EDT) |
| Scope | Delta vs prior: `socialSignInConfigured` fix, live headers, Vercel env **names**, login social exposure, repo gates |
| Out of scope | Exploits, PoCs, fuzzing, credential stuffing, production writes, scraping customer data |

## Executive summary

| Result | Count |
|--------|------:|
| **PASS** (controls verified) | **16** |
| **WARN** (Med/Low/Info that need attention) | **10** |
| **FAIL** (Critical/High) | **0** |

**Overall: WARN** — prior High (ID-only social broker + UI/config drift) is **mitigated**. `socialSignInConfigured()` on `main` now requires `GROK_AUTH_CLIENT_ID` **and** `GROK_AUTH_CLIENT_SECRET`; Production deploy of `75980a0` is live; `getSocialSignIn` returns `configured: false`; Google/X UI is not rendered. `GROK_AUTH_CLIENT_SECRET` is still **absent** from Vercel Production (ops gap only if/when social is re-enabled). Remaining Med items unchanged: CSP `'unsafe-inline'`, `/sw.js` ACAO `*`, SW push URL not same-origin-allowlisted.

## Delta vs prior

| Status | Prior item | Evidence now |
|--------|------------|--------------|
| **Fixed** | **Med** — `socialSignInConfigured()` ID-only vs `productionBrokerReady` needing secret | `origin/main` `src/lib/prod-guard.server.ts` requires `id && secret` (commit `75980a0`). Same patch as PR branch tip `5b6584d`. |
| **Fixed (UX)** | Live login could advertise Google/X while broker incomplete | Live login chunk has **no** social-button markup (`SOCIAL_SIGNIN_ENABLED = false` in `src/routes/login.tsx`). Live `getSocialSignIn` → `configured: **false**` (seroval FALSE `t:2,s:3`). |
| **Mitigated / downgraded** | **High** — Production `GROK_AUTH_CLIENT_ID` without `GROK_AUTH_CLIENT_SECRET` | Secret **still missing** (`vercel env ls production`). Broker stays off (correct). No longer High: UI does not offer broken federation; email/password remains the path. Reclass → **Low/Info ops** until social is intentionally enabled. |
| **Still open** | **Med** CSP `script-src 'unsafe-inline'` (+ style) | Unchanged live + `vercel.json` / device-permissions scripts. |
| **Still open** | **Med** `/sw.js` `Access-Control-Allow-Origin: *` | Live still sends ACAO `*`; `Cache-Control: no-store` OK. Middleware deletes ACAO on `/sw.js` but header still present (static/CDN path wins). |
| **Still open** | **Med** SW `notificationclick` uses payload `url` without same-origin allowlist | `public/sw.js` unchanged (`navigate` / `openWindow` on `data.url`). |
| **Still open** | **Low** HSTS without `includeSubDomains` / `preload` | `max-age=63072000` only. |
| **Still open** | **Low** `www` returns 200 (no apex redirect) | `__Host-` cookies are host-only. |
| **Still open** | **Low** Unauth `/admin` SPA shell 200 + admin chunks | `SessionGate needAdmin` + server `requireAdmin` unchanged. |
| **Still open** | **Low** Admin Permissions-Policy on guest HTML shell | Unchanged. |
| **Still open** | **Low** `RESEND_*` typed Config not Secret | Unchanged in `vercel env ls`. |
| **Still open** | **Info** bot health public; no COOP/CORP; robots SPA 404 | Unchanged. |
| **New (Info)** | PR #4 vs main | PR [#4](https://github.com/SilverGoon1/shale-mint-rocket-mountain/pull/4) still **OPEN** (`fix/social-off-until-secret` @ `5b6584d`). Equivalent fix **already on `main`** as `75980a0` and deployed to Production (~04:03 UTC). Close or supersede PR to avoid duplicate merge. |
| **New (Info)** | Defense-in-depth kill switch | `SOCIAL_SIGNIN_ENABLED = false` in `src/routes/login.tsx` (since `4efe8e0`) — hard-hides social UI even if env later gains a secret until flipped. |

## Findings table (current)

| Sev | Area | Evidence | Recommendation |
|-----|------|----------|----------------|
| **Low** | Auth / env | Production lists `GROK_AUTH_CLIENT_ID` (Secret) but **no** `GROK_AUTH_CLIENT_SECRET`. `productionBrokerReady` / `socialSignInConfigured` both false without it. | When enabling Google/X: add Production env **name** `GROK_AUTH_CLIENT_SECRET`, set `SOCIAL_SIGNIN_ENABLED` true, smoke social + email. Until then, orphan ID is unused but harmless. |
| **Med** | CSP | Live CSP: `script-src 'self' 'unsafe-inline' https://grok.com` (style also `unsafe-inline`). | Workshop: nonce/hash script CSP; keep grok.com allowlist explicit. |
| **Med** | PWA / SW | `GET /sw.js` → `Access-Control-Allow-Origin: *` despite middleware delete. | Strip ACAO via `vercel.json` headers on `/sw.js` or ensure edge middleware wraps the static SW response. |
| **Med** | PWA / push | `public/sw.js` trusts notification `data.url`. | Allowlist same-origin paths only before `navigate` / `openWindow`. |
| **Low** | HSTS | `max-age=63072000` only. | Add `includeSubDomains` when all subs are HTTPS; consider preload. |
| **Low** | Host | `https://www.southendpizza.app/` → 200 (no redirect). | 301 www → apex (or reverse). |
| **Low** | Admin gate (SPA) | Unauth `/admin` → 200 shell + admin JS. | Optional edge 302 without session cookie. |
| **Low** | Permissions-Policy | Looser PP on `/admin` for guests. | Optional: tighten for unauthenticated HTML. |
| **Low** | Secrets hygiene | `RESEND_API_KEY` / `RESEND_EMAIL_DOMAIN` = Config. | Reclassify as Secret. |
| **Info** | PR hygiene | PR #4 open; fix already on main/prod. | Close PR #4 or mark superseded by `75980a0`. |

## Live checks (re-run)

### Headers snapshot

| Path | Status | Notable |
|------|--------|---------|
| `/` | 200 | CSP, HSTS, XFO SAMEORIGIN, nosniff, Referrer-Policy, customer Permissions-Policy |
| `/login` | 200 | Same as `/` |
| `/account` | 200 | SPA shell |
| `/admin` | 200 | Looser Permissions-Policy (bluetooth/usb/serial/hid) |
| `/sw.js` | 200 | `Cache-Control: no-store`; **`Access-Control-Allow-Origin: *`** (still) |
| `http://` → `https://` | **308** | Good |
| `https://www.southendpizza.app/` | **200** | No apex redirect |

HSTS: `Strict-Transport-Security: max-age=63072000` (no `includeSubDomains` / `preload`).  
Cookies: no guest `Set-Cookie` on `/login`; session design remains `__Host-grok-auth.session_token` (+ related `__Host-grok-auth.*`) with `useSecureCookies: true` / `sameSite: "lax"` in repo.

### Social configured (read-only)

- Live serverFn id: `6e0a480f01caa7f2bc3c8be6df8b2c7eac700922a5424cd60c52876de6e6d3c8` (`getSocialSignIn`).
- Request: `GET /_serverFn/<id>` with `x-tsr-serverFn: true`, `Origin: https://southendpizza.app`, `Sec-Fetch-Site: same-origin` (client protocol; no mutation).
- Decoded result: **`{ configured: false }`**.
- Login JS: social button markup absent (`SOCIAL_SIGNIN_ENABLED === false` dead-code eliminates Google/X buttons).

### Unauth probes (unchanged / good)

| Path | Status | Notes |
|------|--------|--------|
| `/api/auth/get-session` | 200 `null` | No guest session |
| `/api/auth/ok` | 200 `{"ok":true}` | Health |
| `/api/bot/v1/health` | 200 | Public minimal health; card processor disabled |
| `/api/bot/v1/security/summary` | **401** | Auth required |
| `/.env` | 404 | Good |

## Vercel Production env **names** only

Present (names): `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BOT_TOKEN_PEPPER`, `DATABASE_URL` (+ Neon/Postgres family), `GROK_AUTH_CLIENT_ID`, `RESEND_API_KEY`, `RESEND_EMAIL_DOMAIN`, `STAFF_ADMIN_PASSWORD`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`.

**Not listed:** `GROK_AUTH_CLIENT_SECRET`.

No values recorded in this report.

## Repo verification

| Check | Result |
|-------|--------|
| `git fetch`; `origin/main` | `75980a0` — *Hide Google and X on production until the broker secret exists* |
| PR #4 `5b6584d` | Same one-line `prod-guard.server.ts` change; **not** merged; **not** ancestor of main (parallel commit) |
| Production deploy | Vercel success for `75980a0` @ ~04:03 UTC; apex serving post-fix assets |
| `socialSignInConfigured()` | Requires non-preview ID **+** secret; else preview fallback only |
| `productionBrokerReady` (`src/lib/auth/server.ts`) | Still requires ID + secret; preview blocked on shop/production hosts |
| Admin gates | `SessionGate needAdmin`; shop-server / bot-admin `requireAdmin` + auth middleware |
| SW push URL | Still trusts payload URL (no allowlist) |
| CSP config | Still `'unsafe-inline'` in `vercel.json` / device-permissions |

## What’s already good (still)

1. HTTPS 308 + HSTS 2-year max-age.  
2. Baseline CSP / XFO / nosniff / Referrer-Policy / customer Permissions-Policy.  
3. `__Host-` session cookies; secure + lax; httpOnly defaults.  
4. Auth middleware same-site + `requireUserId` / `requireAdmin`.  
5. Bot tokens hashed+pepper; sensitive summary 401 unauth.  
6. SW: no HTML/API cache; `Cache-Control: no-store` on `/sw.js`.  
7. Preview OAuth blocked on production hosts.  
8. Email/password auth path enabled.  
9. **NEW:** social configured flag aligned with broker readiness.  
10. **NEW:** live social configured=false; Google/X not shown on `/login`.

## Suggested next hardening

1. Strip `Access-Control-Allow-Origin` from production `/sw.js` (verify after deploy).  
2. Same-origin allowlist for SW notification URLs.  
3. CSP Workshop — nonces/hashes for scripts.  
4. 301 www → apex; consider HSTS `includeSubDomains`.  
5. Optional: add `GROK_AUTH_CLIENT_SECRET` + flip `SOCIAL_SIGNIN_ENABLED` only when ready to offer Google/X.  
6. Close/supersede PR #4; reclassify Resend env as Secret; optional COOP on login.

## Method notes

- Tools: `curl` (headers + identity encoding), repo `git`/`gh`, `rg`, `vercel env ls` (names only), seroval decode of public `getSocialSignIn` GET.  
- No payloads, no auth bypass attempts, no production writes, no exploit/PoC content.
