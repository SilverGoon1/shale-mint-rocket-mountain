import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { grokPwaPlugin } from "./scripts/grok-pwa-plugin.mjs";
// @ts-expect-error JS plugin alongside the TS vite config
import { appEnvPlugin } from "./scripts/app-env-plugin.mjs";
// @ts-expect-error JS plugin alongside the TS vite config
import { applyDevicePermissionHeaders, ADMIN_DEVICE_HEADERS, DEVICE_HEADERS } from "./scripts/device-permissions.mjs";
import { isMigrationFile } from "./scripts/migration-plan.mjs";

/** The files `src/lib/db.ts` globs — same directory, same non-recursive scope. */
function hasGlobbedMigrations(root: string): boolean {
  try {
    return readdirSync(join(root, "migrations")).some(isMigrationFile);
  } catch {
    return false;
  }
}

function devicePermissionsPlugin(): Plugin {
  const stamp = (req: unknown, res: { setHeader: (k: string, v: string) => void }, next: () => void) => {
    applyDevicePermissionHeaders((key: string, value: string) => res.setHeader(key, value));
    next();
  };
  return {
    name: "app-builder:device-permissions",
    configureServer(server) {
      server.middlewares.use(stamp);
    },
    configurePreviewServer(server) {
      server.middlewares.use(stamp);
    },
  };
}

/**
 * Finish PGLite bootstrap during dev-server setup (before traffic). Vite awaits
 * async `configureServer` hooks. Production: `src/lib/db` kicks `ensureDbReady`
 * on import.
 *
 * Vite awaiting the hook puts this on time-to-first-render, so an app with no
 * migrations — no schema to apply — skips it entirely rather than paying for a
 * PGLite instance it never queries.
 */
function pgliteBootstrapPlugin(): Plugin {
  return {
    name: "app-builder:pglite-bootstrap",
    apply: "serve",
    async configureServer(server) {
      if (!hasGlobbedMigrations(server.config.root)) return;
      try {
        const mod = (await server.ssrLoadModule("/src/lib/db.ts")) as {
          ensureDbReady?: () => Promise<void>;
        };
        if (typeof mod.ensureDbReady === "function") {
          await mod.ensureDbReady();
        }
      } catch (err) {
        console.error("[app-builder] DB bootstrap failed:", err);
        throw err;
      }
    },
  };
}

/**
 * Live-preview OAuth popup — handled HERE so the agent never has to create a
 * `/auth/popup` route (and cannot break it by scaffolding a React page that
 * paints the full app shell in the popup).
 *
 * `signIn` (client.ts) opens `/auth/popup?providerId=…` in a top-level window.
 * This middleware runs before TanStack Start, calls `handleAuthPopupRequest`,
 * and returns the 302 / completion HTML. Deployed apps do not use the popup
 * (full-page OAuth redirect), so `apply: "serve"` is enough.
 */
function authPopupPlugin(): Plugin {
  return {
    name: "app-builder:auth-popup",
    apply: "serve",
    configureServer(server) {
      // Register immediately (not in a returned post-hook) so we run BEFORE
      // TanStack Start / the SPA HTML fallback. A model-authored
      // `src/routes/auth/popup.tsx` React page must never win this path.
      server.middlewares.use(async (req, res, next) => {
        try {
          const rawUrl = req.url ?? "";
          const pathOnly = rawUrl.split("?", 1)[0] ?? "";
          if (pathOnly !== "/auth/popup") {
            next();
            return;
          }
          if ((req.method ?? "GET").toUpperCase() !== "GET") {
            res.statusCode = 405;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("Method Not Allowed");
            return;
          }

          const host = String(
            req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:8080",
          )
            .split(",")[0]
            .trim();
          const hostName = host.replace(/:\d+$/, "");
          const publicHttps =
            /(^|\.)grok-sandbox\.com$/i.test(hostName) ||
            /(^|\.)southendpizza\.app$/i.test(hostName) ||
            /(^|\.)vercel\.app$/i.test(hostName);
          const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "")
            .split(",")[0]
            .trim();
          const proto = publicHttps
            ? "https"
            : forwardedProto ||
              ((req.socket as { encrypted?: boolean } | undefined)?.encrypted ? "https" : "http");
          const requestHeaders = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            if (Array.isArray(value)) {
              for (const v of value) requestHeaders.append(key, v);
            } else {
              requestHeaders.set(key, value);
            }
          }
          // Public preview/shop hosts must advertise https so Google/X get a
          // registered redirect URI, not http://localhost.
          requestHeaders.set("host", host);
          requestHeaders.set("x-forwarded-host", host);
          requestHeaders.set("x-forwarded-proto", proto);

          const request = new Request(`${proto}://${host}${rawUrl}`, {
            method: "GET",
            headers: requestHeaders,
          });

          const mod = (await server.ssrLoadModule("/src/lib/auth/popup.server.ts")) as {
            handleAuthPopupRequest: (req: Request) => Promise<Response>;
          };
          const response = await mod.handleAuthPopupRequest(request);

          res.statusCode = response.status;
          // Preserve multiple Set-Cookie headers (OAuth state + session).
          const setCookies =
            typeof response.headers.getSetCookie === "function"
              ? response.headers.getSetCookie()
              : [];
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "set-cookie") return;
            res.setHeader(key, value);
          });
          for (const cookie of setCookies) {
            res.appendHeader("set-cookie", cookie);
          }
          const body = Buffer.from(await response.arrayBuffer());
          res.end(body);
        } catch (err) {
          console.error("[app-builder] /auth/popup handler failed:", err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("auth popup failed");
          }
        }
      });
    },
  };
}

function shopVersionPlugin(): Plugin {
  const builtAt = new Date().toISOString();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "";
  const body = `${JSON.stringify({ builtAt, sha })}\n`;
  const writePublic = (root: string) => {
    try {
      mkdirSync(join(root, "public"), { recursive: true });
      writeFileSync(join(root, "public", "version.json"), body);
    } catch {
      /* version.json is a hint; the banner can fall back to ETag */
    }
  };
  return {
    name: "southend-version",
    config() {
      return {
        define: {
          "import.meta.env.VITE_BUILD_ID": JSON.stringify(sha || builtAt),
        },
      };
    },
    buildStart() {
      writePublic(process.cwd());
    },
    configureServer(server) {
      writePublic(server.config.root);
      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0];
        if (pathOnly !== "/version.json") {
          next();
          return;
        }
        res.statusCode = 200;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.setHeader("cache-control", "no-store");
        res.end(body);
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "version.json", source: body });
    },
  };
}

// `0.0.0.0:8080` is the live-preview contract — don't change host/port.
// The dev server starts once `src/router.tsx` and `src/routes/` exist — see
// AGENTS.md § "First scaffold".
export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    headers: ADMIN_DEVICE_HEADERS,
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
    headers: ADMIN_DEVICE_HEADERS,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    devicePermissionsPlugin(),
    pgliteBootstrapPlugin(),
    // Before tanstackStart so /auth/popup never falls through to the SPA.
    authPopupPlugin(),
    // Dev-only /__app-env, read by scripts/check-auth-invariant.mjs.
    appEnvPlugin(),
    // PWA head + ?install=1 tutorial page; runs before Start/Nitro.
    grokPwaPlugin(),
    shopVersionPlugin(),
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel",
            // Auto-registers server/middleware/* (the PWA install page +
            // manifest + head-tag middleware). Nitro v3 defaults serverDir to
            // false, so removing this silently unwires /?install=1 on deploys.
            serverDir: "./server",
            routeRules: {
              "/**": { headers: DEVICE_HEADERS },
              "/admin": { headers: ADMIN_DEVICE_HEADERS },
              "/admin/**": { headers: ADMIN_DEVICE_HEADERS },
              "/pair-printer": { headers: ADMIN_DEVICE_HEADERS },
              "/_serverFn": { headers: DEVICE_HEADERS },
              "/_serverFn/**": { headers: DEVICE_HEADERS },
              "/sw.js": {
                headers: {
                  "cache-control": "no-store",
                  "cross-origin-resource-policy": "same-origin",
                },
              },
              "/version.json": { headers: { ...DEVICE_HEADERS, "cache-control": "no-store" } },
            },
          }),
        ]
      : []),
    viteReact(),
  ],
}));
