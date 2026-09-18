# Workshop Build — Social off until broker secret
**Date:** 2026-09-18  
**Live target:** https://southendpizza.app/  
**Blueprint PR:** https://github.com/SilverGoon1/shale-mint-rocket-mountain/pull/4  
**Commit:** `5b6584d` on `fix/social-off-until-secret`  
**Scope:** Workshop only — one flag change

## Goal
Keep Google/X **off** on the shop login until real Grok Auth broker credentials exist (email-only for now). Production currently has `GROK_AUTH_CLIENT_ID` but no `GROK_AUTH_CLIENT_SECRET`, so the UI still offered social buttons while the auth server disabled federation without both (`productionBrokerReady`).

## MUST NOT
- Invent or paste broker secrets
- Remove or rewrite Vercel env vars
- Touch POS, delivery, Neon wiring, bots, or auth plugins beyond this flag
- Commit `.vercel/output`
- Change `allowPreviewOAuthFallback()` behavior (preview may still show social)

## Root cause
`socialSignInConfigured()` returned true when only a non-preview `GROK_AUTH_CLIENT_ID` was set. That diverged from auth-server readiness, which needs both ID and secret.

## Files to change (1)

### 1) `src/lib/prod-guard.server.ts`
Replace `socialSignInConfigured()` with:

```ts
export function socialSignInConfigured() {
  const id = (process.env.GROK_AUTH_CLIENT_ID ?? "").trim();
  const secret = (process.env.GROK_AUTH_CLIENT_SECRET ?? "").trim();
  if (id && id !== PREVIEW_CLIENT_ID && secret) return true;
  if (allowPreviewOAuthFallback()) return true;
  return false;
}
```

Production path: require **both** a non-preview client id **and** a non-empty `GROK_AUTH_CLIENT_SECRET`.  
Preview path: leave `allowPreviewOAuthFallback()` unchanged.

## Verify
1. Production (ID set, secret empty): login is email-only — no Google/X.
2. Preview / sandbox with preview fallback: social buttons still allowed.
3. When both non-preview ID and secret exist: Google/X return.
4. No env vars removed; no other surface changes.

## Ship notes
- Blueprint already on GitHub PR #4 (`5b6584d`). Workshop Apply / Export from this paste so Export does not wipe the flag.
