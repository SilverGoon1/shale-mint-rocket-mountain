/**
 * Self-hosted Better Auth for THIS app (server-only).
 *
 * Pre-wired for live preview + deploy — do not rewrite this file. To enable
 * local email/password, flip the flag in `./email-password` only (see auth skill).
 *
 * The app runs its own Better Auth at `/api/auth/*`, so the session cookie stays
 * on this app's own origin. Sign-in federates to the shared **Grok auth broker**
 * (`GROK_AUTH_ISSUER`) via the `genericOAuth` plugin — the broker brokers the
 * upstream sign-in methods (Google, X, …) and holds their shared secrets; this
 * app only holds its own client id/secret and names the upstream it wants via
 * each provider's `idp` hint.
 *
 * Tri-mode:
 *   - Deployed: the deployer injects a per-app `GROK_AUTH_*` + `BETTER_AUTH_URL`
 *     + `DATABASE_URL`, so real federated auth is persisted in Postgres.
 *   - Sandbox live preview: no injection -> falls back to the shared **preview
 *     client** (`./preview`) and derives the preview's `https://*.grok-sandbox.com`
 *     origin from the request, so real sign-in works (no demo users). Sessions
 *     and identities persist in the embedded PGLite DB (same DB as app data);
 *     the process restart wipes both. Live-preview iframe clients use a bearer
 *     token (partitioned cookies) — see `client.ts`.
 *   - Off (`VITE_AUTH_ENABLED=false`, the shipped default): no providers;
 *     `requireUserId` resolves a dev user with no database configured, and
 *     throws fail-closed once `DATABASE_URL` is set (see `verify.server.ts`).
 *
 * NEVER import this from client code — it pulls in `pg` + the preview secret +
 * server-only Better Auth internals. The client uses `@/lib/auth/client`;
 * components read the user via `@/lib/auth/use-current-user`; server functions get
 * a verified id via `@/lib/auth/middleware`.
 */
import { betterAuth } from "better-auth";
import { bearer, genericOAuth } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { ensureDbReady, getPglite } from "../db";
import { emailAndPasswordEnabled } from "./email-password";
import { GATE_PROVIDER_ID, gateIdentitySessions } from "./gate-session.server";
import { GROK_PROVIDERS } from "./providers";
import { pgliteDialect } from "./pglite-dialect";
import {
  GROK_ISSUER_DEFAULT,
  PREVIEW_ALLOWED_HOSTS,
  PREVIEW_CLIENT_ID,
  PREVIEW_CLIENT_SECRET,
} from "./preview";
import { PRODUCTION_AUTH_ORIGINS, allowPreviewOAuthFallback } from "../prod-guard.server";

// Kick (and share) PGLite bootstrap as soon as the auth server module loads.
void ensureDbReady();

/**
 * Preview secret must outlive module reloads: PGLite (and its session rows) is
 * stored on `globalThis`, so an HMR re-eval of this file must NOT mint a new
 * signing secret or every existing session becomes invalid mid-dev. Process
 * restart clears both the secret and PGLite together.
 */
const globalAuthRef = globalThis as typeof globalThis & {
  __grokAuthPreviewSecret__?: string;
};
function previewAuthSecret(): string {
  globalAuthRef.__grokAuthPreviewSecret__ ??= randomBytes(32).toString("hex");
  return globalAuthRef.__grokAuthPreviewSecret__;
}

/** Read an env var, treating empty/whitespace as unset. */
const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

// Explicit off-switch. The deployer sets `VITE_AUTH_ENABLED=true` when it
// provisions auth; set it to "false" to force auth off everywhere (dev user).
const authDisabled = env("VITE_AUTH_ENABLED") === "false";

// Broker federation creds: the deployer injects a per-app client when deployed.
// Preview falls back to the shared grok_preview client (*.grok-sandbox.com only).
// Production apex/www/Vercel must NOT use grok_preview — X/Google would get Invalid redirect URI.
const grokIssuer = env("GROK_AUTH_ISSUER") ?? GROK_ISSUER_DEFAULT;
const injectedClientId = env("GROK_AUTH_CLIENT_ID");
const injectedClientSecret = env("GROK_AUTH_CLIENT_SECRET");
const previewOAuthOk = allowPreviewOAuthFallback();
const productionBrokerReady = Boolean(
  injectedClientId && injectedClientId !== PREVIEW_CLIENT_ID && injectedClientSecret,
);
const grokClientId = productionBrokerReady
  ? injectedClientId
  : previewOAuthOk
    ? (injectedClientId ?? PREVIEW_CLIENT_ID)
    : undefined;
const grokClientSecret = productionBrokerReady
  ? injectedClientSecret
  : previewOAuthOk
    ? (injectedClientSecret ?? PREVIEW_CLIENT_SECRET)
    : undefined;

if (!previewOAuthOk && !productionBrokerReady) {
  console.error(
    "[auth] GROK_AUTH_CLIENT_ID missing or preview on this shop — Google/X disabled. Use email.",
  );
}

/** True when federated sign-in is active (real auth is enforced). */
export const authConfigured =
  !authDisabled && Boolean(grokClientId && grokClientSecret);

const explicitBaseURL = env("BETTER_AUTH_URL");
const previewAllowedHosts: string[] = [...PREVIEW_ALLOWED_HOSTS];
const LOCAL_DEV_ORIGINS: string[] = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://[::1]:8080",
];

function extraDeployOrigins(): string[] {
  const origins: string[] = [];
  const addHost = (raw: string | undefined) => {
    if (!raw) return;
    const host = raw.replace(/^https?:\/\//, "").split("/")[0]?.trim();
    if (!host) return;
    origins.push(`https://${host}`);
  };
  addHost(env("VERCEL_PROJECT_PRODUCTION_URL"));
  addHost(env("VERCEL_URL"));
  addHost(env("VITE_PUBLIC_HOSTNAME"));
  return origins;
}

function isNodeProduction() {
  return (process.env.NODE_ENV ?? "").trim() === "production";
}

function productionTrustedOrigins(): string[] {
  const origins = new Set<string>(PRODUCTION_AUTH_ORIGINS);
  const addHost = (raw: string | undefined) => {
    if (!raw) return;
    const host = raw.replace(/^https?:\/\//, "").split("/")[0]?.trim();
    if (!host) return;
    origins.add(`https://${host}`);
  };
  addHost(env("VERCEL_PROJECT_PRODUCTION_URL"));
  addHost(env("VERCEL_URL"));
  addHost(env("BETTER_AUTH_URL"));
  return [...origins];
}

function originFromHost(hostHeader: string | null, protoHeader: string | null, fallbackProto: string): string | null {
  const host = hostHeader?.split(",")[0]?.trim();
  if (!host) return null;
  const proto = (protoHeader?.split(",")[0]?.trim() || fallbackProto).replace(/:$/, "");
  try {
    return new URL(`${proto}://${host}`).origin;
  } catch {
    return null;
  }
}

const staticTrustedOrigins: string[] = [
  ...(explicitBaseURL ? [explicitBaseURL] : []),
  ...previewAllowedHosts,
  ...previewAllowedHosts.flatMap((host) => [`https://${host}`, `http://${host}`]),
  ...LOCAL_DEV_ORIGINS,
  ...extraDeployOrigins(),
];

const baseURL = explicitBaseURL ?? {
  allowedHosts: [
    ...previewAllowedHosts,
    "localhost",
    "127.0.0.1",
    "[::1]",
    "*.vercel.app",
    "*.github.io",
    "southendpizza.app",
    "www.southendpizza.app",
    "*.southendpizza.app",
  ],
  protocol: "auto" as const,
  fallback: "https://southendpizza.app",
};

const trustedOrigins = async (request?: Request): Promise<string[]> => {
  const origins = new Set<string>(
    isNodeProduction() ? productionTrustedOrigins() : [...PRODUCTION_AUTH_ORIGINS, ...staticTrustedOrigins],
  );
  if (!isNodeProduction()) origins.add("https://grok.me");
  if (!request) return [...origins];
  const fallbackProto = request.url.startsWith("http://") ? "http" : "https";
  try {
    origins.add(new URL(request.url).origin);
  } catch {
    /* ignore malformed request URLs */
  }
  const forwarded = originFromHost(
    request.headers.get("x-forwarded-host"),
    request.headers.get("x-forwarded-proto"),
    fallbackProto,
  );
  const hostOrigin = originFromHost(
    request.headers.get("host"),
    request.headers.get("x-forwarded-proto"),
    fallbackProto,
  );
  if (forwarded) origins.add(forwarded);
  if (hostOrigin) origins.add(hostOrigin);
  return [...origins];
};

const databaseUrl = env("DATABASE_URL");

const issuerBase = grokIssuer.replace(/\/+$/, "");
const grokAuthorizationUrl = `${issuerBase}/api/auth/oauth2/authorize`;
const grokTokenUrl = `${issuerBase}/api/auth/oauth2/token`;
const grokUserInfoUrl = `${issuerBase}/api/auth/oauth2/userinfo`;

const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : { dialect: pgliteDialect(() => getPglite()), type: "postgres" as const };

export const SESSION_TOKEN_COOKIE = "__Host-grok-auth.session_token";

const grokOAuthPlugin = authConfigured
  ? genericOAuth({
      config: GROK_PROVIDERS.map(({ providerId, idp }) => ({
        providerId,
        clientId: grokClientId as string,
        clientSecret: grokClientSecret as string,
        authorizationUrl: grokAuthorizationUrl,
        tokenUrl: grokTokenUrl,
        userInfoUrl: grokUserInfoUrl,
        scopes: ["openid", "profile", "email"],
        authorizationUrlParams: { idp, prompt: "login" },
      })),
    })
  : null;

export const auth = betterAuth({
  baseURL,
  secret: env("BETTER_AUTH_SECRET") ?? previewAuthSecret(),
  database,
  trustedOrigins,
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: [
        ...GROK_PROVIDERS.map((p) => p.providerId),
        GATE_PROVIDER_ID,
      ],
      requireLocalEmailVerified: false,
    },
  },
  session: { cookieCache: { enabled: true, maxAge: 300 } },
  rateLimit: {
    enabled: true,
    window: 15 * 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 15 * 60, max: 5 },
      "/sign-up/email": { window: 15 * 60, max: 5 },
      "/forget-password": { window: 15 * 60, max: 5 },
      "/request-password-reset": { window: 15 * 60, max: 5 },
    },
  },
  ...(emailAndPasswordEnabled ? { emailAndPassword: { enabled: true } } : {}),
  advanced: {
    useSecureCookies: true,
    trustedProxyHeaders: true,
    defaultCookieAttributes: { secure: true, sameSite: "lax", path: "/" },
    cookies: {
      session_token: { name: SESSION_TOKEN_COOKIE },
      session_data: { name: "__Host-grok-auth.session_data" },
      account_data: { name: "__Host-grok-auth.account_data" },
      dont_remember: { name: "__Host-grok-auth.dont_remember" },
    },
  },
  plugins: [
    gateIdentitySessions(),
    ...(grokOAuthPlugin ? [grokOAuthPlugin] : []),
    bearer(),
    tanstackStartCookies(),
  ],
});

export function readSessionToken(): string | null {
  return getCookie(SESSION_TOKEN_COOKIE) ?? null;
}

export { GROK_PROVIDERS } from "./providers";
