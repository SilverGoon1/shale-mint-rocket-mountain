/**
 * Production runtime checks. Preview and local `vite preview` are not
 * `VERCEL_ENV=production`, so they keep the PGLite fallback.
 */
export function isVercelProduction() {
  return (process.env.VERCEL_ENV ?? "").trim() === "production";
}

export function requireNeonInProduction() {
  const url = (process.env.DATABASE_URL ?? "").trim();
  if (isVercelProduction() && !url) {
    throw new Error("Production requires DATABASE_URL (Neon). Auth and orders are refused.");
  }
}

export const PRODUCTION_AUTH_ORIGINS = [
  "https://southendpizza.app",
  "https://www.southendpizza.app",
  "https://southendpizza.vercel.app",
] as const;

const PREVIEW_CLIENT_ID = "grok_preview";

function looksLikeShopHost(raw: string) {
  return /southendpizza\.app|southendpizza\.vercel\.app/i.test(raw);
}

/** Preview OAuth client is only valid on grok-sandbox / local — never apex/www/Vercel production. */
export function allowPreviewOAuthFallback() {
  if (isVercelProduction()) return false;
  if (looksLikeShopHost(process.env.BETTER_AUTH_URL ?? "")) return false;
  if (looksLikeShopHost(process.env.VERCEL_URL ?? "")) return false;
  if (looksLikeShopHost(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "")) return false;
  if (looksLikeShopHost(process.env.VITE_PUBLIC_HOSTNAME ?? "")) return false;
  return true;
}

export function socialSignInConfigured() {
  const id = (process.env.GROK_AUTH_CLIENT_ID ?? "").trim();
  if (id && id !== PREVIEW_CLIENT_ID) return true;
  if (allowPreviewOAuthFallback()) return true;
  return false;
}
