import { o as __toESM } from "../_runtime.mjs";
import { Q as literal, at as union, et as number, it as string, tt as object } from "../_libs/@better-auth/core+[...].mjs";
import { r as hashPassword } from "../_libs/better-auth__utils.mjs";
import { C as require_jsx_runtime, S as useRouter, U as require_react, _ as createFileRoute, b as Navigate, d as HeadContent, f as useRouterState, h as Outlet, l as require_react_dom, m as createRouter, u as Scripts, v as createRootRoute, x as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as createServerFn, t as createMiddleware } from "../_libs/@tanstack/start-client-core+[...].mjs";
import { c as dbSource, i as isVercelProduction, l as getSql, o as GROK_PROVIDERS, r as PRODUCTION_AUTH_ORIGINS, t as auth } from "../index.mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
import { $ as ChevronLeft, A as MessageCircle, B as Flag, C as Plus, D as Paintbrush, E as PenLine, F as Layers, G as Copy, H as Eraser, I as ImagePlus, J as CircleHelp, K as CookingPot, L as Headset, M as MapPin, N as LogOut, O as Monitor, P as Link2, Q as ChevronRight, R as Ham, S as Printer, T as Phone, U as Drumstick, V as FlagOff, W as CupSoda, X as CircleAlert, Y as CircleCheck, Z as ChevronUp, _ as Scroll, a as Utensils, at as Ban, b as RotateCcw, c as TriangleAlert, d as Soup, et as ChevronDown, f as Snowflake, g as Search, h as Share, i as Volume2, it as Beef, j as Menu, k as Minus, l as Trash2, m as ShoppingBag, n as Wheat, nt as Bluetooth, o as UtensilsCrossed, ot as ArrowUp, p as Smartphone, q as Clock, r as VolumeX, rt as Bell, s as UserRound, t as X, tt as CakeSlice, u as Star, v as Sandwich, w as Pizza, x as RefreshCw, y as Salad, z as Flame } from "../_libs/lucide-react.mjs";
import { a as Bar, i as CartesianGrid, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as BarChart } from "../_libs/recharts+[...].mjs";
import "../_libs/leaflet.mjs";
import { a as signIn, c as useCartStore, i as getBearerToken, l as wipeCart, o as signOut, r as dropClientSession, s as cartTotals, t as authClient, u as runPreSignInSignOut } from "./client.mjs";
import { a as BOT_PRESETS, c as isBotRole, i as verifyBotBearer, l as scopesForPreset, n as rateLimitBot, o as BOT_ROLES, s as BOT_ROLE_LABELS, t as agentHasScope, u as scopesForRole } from "./tokens.server.mjs";
import { a as isStaffAdminAccount, i as STAFF_ADMIN_NAME, o as isStaffAdminUsername, r as STAFF_ADMIN_EMAIL, t as diagnosticDeskAuthStatus } from "./staff-credential.server.mjs";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
//#region src/lib/fetch-retry.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function isTransientFetchError(error) {
	if (!error) return false;
	const name = error instanceof Error ? error.name : "";
	const msg = error instanceof Error ? error.message : String(error);
	return name === "AbortError" || name === "TimeoutError" || /failed to fetch|networkerror|network request failed|load failed|fetch failed|aborted|econnreset|socket/i.test(msg);
}
async function retryTransient(fn, tries = 5, delayMs = 350) {
	let last;
	for (let i = 0; i < tries; i += 1) try {
		return await fn();
	} catch (error) {
		last = error;
		if (!isTransientFetchError(error) || i === tries - 1) throw error;
		await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
	}
	throw last;
}
//#endregion
//#region src/lib/error-component.tsx
var import_jsx_runtime = require_jsx_runtime();
var RETRY_N = "southend-fetch-retry-n";
var MAX_AUTO = 5;
function AppErrorComponent({ error }) {
	const transient = isTransientFetchError(error);
	(0, import_react.useEffect)(() => {
		if (!transient || typeof window === "undefined") return;
		let n = 0;
		try {
			n = Number(sessionStorage.getItem(RETRY_N) || 0);
		} catch {
			n = 0;
		}
		if (n >= MAX_AUTO) return;
		try {
			sessionStorage.setItem(RETRY_N, String(n + 1));
		} catch {}
		const delay = Math.min(5e3, 500 + n * 650);
		const t = window.setTimeout(() => window.location.reload(), delay);
		return () => window.clearTimeout(t);
	}, [transient]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "login-page",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "login-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "shop-brand-kicker",
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
						size: 28,
						strokeWidth: 2.2
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: transient ? "Reconnecting" : "Something went wrong" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: transient ? "The menu is coming back. This page will refresh in a moment." : error.message || "An unexpected error occurred. Try reloading the page."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-print",
					onClick: () => {
						try {
							sessionStorage.removeItem(RETRY_N);
						} catch {}
						window.location.reload();
					},
					children: "Try again"
				})
			]
		})
	});
}
//#endregion
//#region src/lib/auth/provider.tsx
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
//#endregion
//#region src/components/cart-hydrate.tsx
/** Rehydrate the persisted bag once for the whole shop shell. */
function CartHydrate() {
	(0, import_react.useEffect)(() => {
		useCartStore.persist.rehydrate();
	}, []);
	return null;
}
function useCartHydrated() {
	const [hydrated, setHydrated] = (0, import_react.useState)(() => typeof window === "undefined" ? false : useCartStore.persist.hasHydrated());
	(0, import_react.useEffect)(() => {
		if (useCartStore.persist.hasHydrated()) {
			setHydrated(true);
			return;
		}
		const unsub = useCartStore.persist.onFinishHydration(() => setHydrated(true));
		useCartStore.persist.rehydrate();
		return unsub;
	}, []);
	return hydrated;
}
//#endregion
//#region src/lib/preview-embedder-origin.ts
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
//#endregion
//#region src/lib/preview-host-bridge.ts
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
//#endregion
//#region src/components/preview-host-bridge.tsx
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function isTyping() {
	const el = document.activeElement;
	if (!el) return false;
	const tag = el.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	(0, import_react.useEffect)(() => {
		let timer = 0;
		let last = 0;
		let seenHidden = false;
		const revive = (e) => {
			if (document.hidden) {
				seenHidden = true;
				return;
			}
			if (isTyping()) return;
			if (document.querySelector("[role=\"dialog\"], .pizza-modal-root")) return;
			if (e?.type === "pageshow" && !e.persisted) return;
			if (e?.type === "visibilitychange" && !seenHidden) return;
			if (Date.now() - last < 1500) return;
			window.clearTimeout(timer);
			timer = window.setTimeout(() => {
				if (document.hidden || isTyping()) return;
				if (document.querySelector("[role=\"dialog\"], .pizza-modal-root")) return;
				last = Date.now();
				router.invalidate().catch((err) => {
					if (!isTransientFetchError(err)) return;
				});
			}, 280);
		};
		window.addEventListener("pageshow", revive);
		document.addEventListener("visibilitychange", revive);
		window.addEventListener("online", revive);
		return () => {
			window.clearTimeout(timer);
			window.removeEventListener("pageshow", revive);
			document.removeEventListener("visibilitychange", revive);
			window.removeEventListener("online", revive);
		};
	}, [router]);
	return null;
}
//#endregion
//#region src/lib/admin-nav.ts
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom(), 1);
/** Admin destinations. Menu & Shop Details is first. Settings stays last. POS lives in the account menu. */
var ADMIN_NAV = [
	{
		to: "/admin/menu",
		label: "Menu & Shop Details",
		pin: "start"
	},
	{
		to: "/admin/center",
		label: "Customer Center",
		pip: true
	},
	{
		to: "/admin/financials",
		label: "Financials"
	},
	{
		to: "/admin/bots",
		label: "Bot access"
	},
	{
		to: "/admin/patches",
		label: "Patches"
	},
	{
		to: "/board",
		label: "Wall menu"
	},
	{
		to: "/admin/background",
		label: "Settings",
		pin: "end"
	}
];
var SHOP_BACKDROP_EVENT = "southend-backdrop";
var SHOP_LOGO_EVENT = "southend-logo";
function emitShopBackdrop() {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new Event(SHOP_BACKDROP_EVENT));
}
function onShopBackdrop(fn) {
	if (typeof window === "undefined") return () => {};
	window.addEventListener(SHOP_BACKDROP_EVENT, fn);
	return () => window.removeEventListener(SHOP_BACKDROP_EVENT, fn);
}
function emitShopLogo() {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new Event(SHOP_LOGO_EVENT));
}
var DEFAULT_BACKDROP = "/buffalo-mark.webp";
var DEFAULT_LOGO = "/mark.jpg";
var DEFAULT_LOGO_SM = "/mark-sm.jpg";
//#endregion
//#region src/lib/auth/middleware.ts
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client.mjs").then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server.mjs");
	const { requireUserId } = await import("./verify.server.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
//#endregion
//#region src/data/menu.ts
var RESTAURANT = {
	name: "South End Pizza III",
	shortName: "South End Pizza 3",
	address: "443 Zion Rd",
	city: "Egg Harbor Township, NJ 08234",
	phone: "(609) 788-8512",
	phoneHref: "tel:+16097888512",
	hours: "Open Daily 11:00 AM – 8:00 PM",
	established: "2005"
};
var DEFAULT_FOOTER = "Ask about extra toppings, wing sauces, and dressing. Prices may change.";
function extras(...rows) {
	return rows.map(([name, price, extra], i) => ({
		id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "cond"}-${i + 1}`,
		name,
		price,
		extraPrice: extra ?? price,
		maxQty: "9"
	}));
}
var DIP_CUPS = extras(["Ranch", "0.75"], ["Blue cheese", "0.75"], ["BBQ", "0.75"], ["Honey mustard", "0.75"]);
var SALAD_DRESSING = extras(["Italian", "0"], ["Ranch", "0"], ["Blue cheese", "0"], ["Extra dressing", "0.75"]);
var MENU = [
	{
		id: "pizza",
		name: "Pizza",
		note: "12\" small · 14\" medium · 16\" large. Extra toppings $2.00 each.",
		kind: "pizza",
		items: [
			{
				name: "Cheese Pizza",
				description: "Classic cheese or create your own pizza",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "14.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "15.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "16.75"
					}
				]
			},
			{
				name: "Extra Cheese Pizza",
				description: "Classic cheese or create your own pizza",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "16.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "17.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "18.75"
					}
				]
			},
			{
				name: "Pepperoni Pizza",
				description: "Topped with classic cheese and pepperoni",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "16.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "17.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "18.75"
					}
				]
			},
			{
				name: "Sausage Pizza",
				description: "Topped with classic cheese and sausage",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "16.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "17.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "18.75"
					}
				]
			},
			{
				name: "Beef Pizza",
				description: "Topped with classic cheese and beef",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "16.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "17.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "18.75"
					}
				]
			},
			{
				name: "Ham Pizza",
				description: "Topped with classic cheese and ham",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "16.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "17.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "18.75"
					}
				]
			},
			{
				name: "Bacon Pizza",
				description: "Classic cheese and bacon",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "16.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "17.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "18.75"
					}
				]
			},
			{
				name: "Mushrooms Pizza",
				description: "Classic cheese and mushrooms",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "16.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "17.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "18.75"
					}
				]
			},
			{
				name: "Green Peppers Pizza",
				description: "Classic cheese and green peppers",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "16.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "17.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "18.75"
					}
				]
			},
			{
				name: "Olives Pizza",
				description: "Topped with classic cheese and olives",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "16.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "17.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "18.75"
					}
				]
			},
			{
				name: "Onions Pizza",
				description: "Topped with classic cheese and onions",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "16.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "17.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "18.75"
					}
				]
			},
			{
				name: "Spinach Pizza",
				description: "Topped with classic cheese and spinach",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "16.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "17.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "18.75"
					}
				]
			},
			{
				name: "Broccoli Pizza",
				description: "Topped with classic cheese and broccoli",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "16.75"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "17.75"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "18.75"
					}
				]
			}
		]
	},
	{
		id: "gourmet",
		name: "Gourmet Pizza",
		note: "12\" small · 14\" medium · 16\" large.",
		kind: "pizza",
		items: [
			{
				name: "White Combo Pizza",
				description: "Tomatoes, spinach, broccoli & ricotta cheese",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "20.00"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "22.00"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "24.00"
					}
				]
			},
			{
				name: "Richie's Special Pizza",
				description: "White pizza with tomatoes, garlic, oil & oregano",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "18.00"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "19.00"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "20.00"
					}
				]
			},
			{
				name: "Buffalo Chicken Pizza",
				description: "Chicken, hot or mild sauce & mozzarella",
				highlight: true,
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "19.00"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "21.00"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "23.00"
					}
				]
			},
			{
				name: "BBQ Chicken Pizza",
				description: "Chicken, BBQ sauce & mozzarella cheese",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "19.00"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "21.00"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "23.00"
					}
				]
			},
			{
				name: "Bonzano Italiano Pizza",
				description: "Cappicola, salami, pepperoni & provolone cheese",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "20.00"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "22.00"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "24.00"
					}
				]
			},
			{
				name: "Greek Pizza",
				description: "Feta, garlic, olives & spinach. Red or white",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "20.00"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "22.00"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "24.00"
					}
				]
			},
			{
				name: "Grilled Chicken Pizza",
				description: "Chicken, sauce & cheese",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "18.00"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "20.00"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "22.00"
					}
				]
			},
			{
				name: "Mexicana Pizza",
				description: "Tomatoes, onions, beef & jalapenos",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "20.00"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "22.00"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "24.00"
					}
				]
			},
			{
				name: "Hawaiian Pizza",
				description: "Ham & pineapple. White or red",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "20.00"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "22.00"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "24.00"
					}
				]
			},
			{
				name: "Veggie Pizza",
				description: "Mushrooms, broccoli, green peppers & onions",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "18.00"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "20.00"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "24.00"
					}
				]
			},
			{
				name: "Meat Lovers Pizza",
				description: "Sausage, pepperoni & bacon",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "20.00"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "22.00"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "24.00"
					}
				]
			},
			{
				name: "C.B.R. Pizza",
				description: "Chicken, bacon & Ranch",
				prices: [
					{
						label: "SM",
						inches: "12\"",
						price: "20.00"
					},
					{
						label: "MD",
						inches: "14\"",
						price: "22.00"
					},
					{
						label: "LG",
						inches: "16\"",
						price: "24.00"
					}
				]
			}
		]
	},
	{
		id: "appetizers",
		name: "Appetizers",
		kind: "split",
		items: [
			{
				name: "French Fries",
				description: "Deep fried till golden brown",
				prices: [{ price: "7.25" }]
			},
			{
				name: "Curly Fries",
				description: "Spiraled potatoes, deep fried and seasoned",
				prices: [{ price: "7.50" }]
			},
			{
				name: "Onion Rings",
				description: "Crispy onion slices deep-fried until golden-brown",
				prices: [{ price: "7.50" }]
			},
			{
				name: "Cheesy French Fries",
				description: "Melted cheese over our delicious fries",
				prices: [{ price: "8.50" }]
			},
			{
				name: "Mozzarella Sticks",
				description: "Deep fried cheese sticks. Served with sauce",
				prices: [{
					label: "5 pc",
					price: "8.50"
				}],
				condiments: extras(["Extra marinara", "0.75"])
			},
			{
				name: "Jalapeno Poppers",
				description: "Juicy jalapeno poppers breaded and filled with cheese and fried to golden perfection",
				prices: [{
					label: "5 pc",
					price: "9.75"
				}]
			},
			{
				name: "South End Style Fries",
				description: "Bacon, cheddar cheese & Mozzarella cheese",
				prices: [{ price: "12.75" }]
			},
			{
				name: "Chicken Fingers",
				description: "With french fries. Breaded and fried chicken strips",
				prices: [{ price: "14.95" }],
				condiments: DIP_CUPS
			},
			{
				name: "Buffalo Fries",
				prices: [{ price: "12.75" }]
			},
			{
				name: "Buffalo Chicken Tenders",
				description: "Tossed in hot sauce or Mild sauce",
				prices: [
					{
						label: "6 pc",
						price: "11.50"
					},
					{
						label: "12 pc",
						price: "16.50"
					},
					{
						label: "18 pc",
						price: "24.50"
					}
				],
				condiments: extras(["Ranch", "0.75"], ["Blue cheese", "0.75"], ["Extra sauce", "0.75"])
			},
			{
				name: "Pizza Bread",
				description: "Cheesy pizza bread",
				prices: [{
					label: "Half",
					price: "8.00"
				}]
			}
		]
	},
	{
		id: "salads",
		name: "Salads",
		kind: "single",
		items: [
			{
				name: "Antipasto Salad",
				description: "Genoa salami, capicola, provolone cheese, and ham. Served with lettuce, tomatoes, onions, cucumbers, green peppers, and black olives",
				prices: [{
					label: "LG",
					price: "14.95"
				}]
			},
			{
				name: "Chef Salad",
				description: "Crispy greens with sliced ham, turkey, cheese, tomato, cucumber, and hard-boiled egg",
				prices: [{
					label: "LG",
					price: "14.95"
				}]
			},
			{
				name: "Tuna Salad",
				description: "House salad with a big scoop of white tuna",
				prices: [{
					label: "LG",
					price: "14.95"
				}]
			},
			{
				name: "Caesar Salad",
				description: "Crisp romaine tossed with croutons, Caesar dressing, and grated cheese",
				prices: [{
					label: "LG",
					price: "10.00"
				}]
			},
			{
				name: "Grilled Chicken Caesar Salad",
				description: "Romaine lettuce, croutons, red onions & Romano cheese in Roma Caesar dressing",
				prices: [{
					label: "LG",
					price: "14.95"
				}]
			},
			{
				name: "Tossed Salad",
				description: "House salad with your choice of dressing",
				prices: [{
					label: "LG",
					price: "11.25"
				}],
				condiments: SALAD_DRESSING
			},
			{
				name: "Turkey & Cheese Salad",
				prices: [{
					label: "LG",
					price: "14.95"
				}]
			},
			{
				name: "Greek Salad",
				description: "Feta cheese, olives",
				prices: [{
					label: "LG",
					price: "14.95"
				}]
			},
			{
				name: "Blackened Chicken Caesar Salad",
				prices: [{
					label: "LG",
					price: "14.75"
				}]
			},
			{
				name: "Cajun Chicken Caesar Salad",
				prices: [{
					label: "LG",
					price: "14.75"
				}]
			},
			{
				name: "Chicken Tender Salad",
				prices: [{
					label: "LG",
					price: "14.95"
				}]
			}
		]
	},
	{
		id: "sides",
		name: "Side Orders",
		kind: "split",
		items: [
			{
				name: "Side of Meatballs",
				description: "Ground meat rolled into small spheres, prepared with bread crumbs, minced onion, eggs, butter, and seasoning",
				prices: [{ price: "9.00" }]
			},
			{
				name: "Garlic Bread",
				description: "Bread, topped with garlic & olive oil or butter, herb seasoning, baked to perfection",
				prices: [{
					label: "Half",
					price: "7.75"
				}]
			},
			{
				name: "Side of Sausage",
				description: "Italian sausage",
				prices: [{ price: "9.00" }]
			},
			{
				name: "Side of Pasta",
				prices: [{ price: "10.00" }]
			},
			{
				name: "Cheesy Garlic Bread",
				description: "French garlic bread with cheese",
				prices: [{
					label: "Half",
					price: "8.75"
				}]
			}
		]
	},
	{
		id: "wings",
		name: "Wings",
		note: "Tossed in Hot, Mild, Dry, or BBQ. Includes 2 Ranch, 2 Blue cheese, or none. Extra dips priced per 2 cups.",
		kind: "split",
		items: [{
			name: "Fresh Wings",
			description: "Deep-fried chicken wings with your choice of sauce",
			prices: [{
				label: "10 pc",
				price: "14.00"
			}],
			condiments: extras(["Extra Ranch", "1.50"], ["Extra Blue cheese", "1.50"])
		}, {
			name: "Chicken Nuggets with Fries",
			description: "Breaded & fried chicken strips. Served with fries",
			prices: [{
				label: "9 pc",
				price: "14.95"
			}]
		}]
	},
	{
		id: "turnovers",
		name: "Pizza Turnovers",
		kind: "single",
		items: [
			{
				name: "Stromboli",
				description: "Pepperoni, sausage & mozzarella cheese",
				prices: [{
					label: "LG",
					price: "18.50"
				}]
			},
			{
				name: "Steak Stromboli",
				description: "Steak & cheese",
				prices: [{
					label: "LG",
					price: "18.50"
				}]
			},
			{
				name: "Vegetable Stromboli",
				description: "Sweet peppers, mushrooms, broccoli, onions & cheese",
				prices: [{
					label: "LG",
					price: "19.50"
				}]
			},
			{
				name: "Calzone",
				description: "Ham, ricotta & mozzarella",
				prices: [{
					label: "LG",
					price: "18.50"
				}]
			},
			{
				name: "Spinach Calzone",
				description: "With ricotta and mozzarella cheese",
				prices: [{
					label: "LG",
					price: "18.50"
				}]
			},
			{
				name: "Chicken Steak Stromboli",
				prices: [{
					label: "LG",
					price: "18.50"
				}]
			},
			{
				name: "Panzarotti",
				description: "Sauce & cheese",
				prices: [{
					label: "LG",
					price: "15.50"
				}]
			}
		]
	},
	{
		id: "sandwiches",
		name: "Sandwiches",
		note: "White, wheat, rye, or Kaiser roll.",
		kind: "single",
		items: [
			{
				name: "Turkey & Cheese Sandwich",
				prices: [{ price: "11.00" }]
			},
			{
				name: "Ham & Cheese Sandwich",
				description: "Classic ham & cheese sandwich",
				prices: [{ price: "11.00" }]
			},
			{
				name: "Tuna & Cheese Sandwich",
				prices: [{ price: "11.00" }]
			},
			{
				name: "Chicken Breast Sandwich",
				description: "On a kaiser roll with roasted peppers & cheese",
				prices: [{ price: "11.00" }]
			}
		]
	},
	{
		id: "clubs",
		name: "Club Sandwiches",
		note: "Served with French fries & onion rings.",
		kind: "single",
		items: [
			{
				name: "Turkey Club Sandwich",
				description: "Cheese, bacon, lettuce, tomato & mayo on toasted bread",
				prices: [{ price: "14.50" }]
			},
			{
				name: "Ham & Cheese Club Sandwich",
				description: "Ham, cheese, bacon, lettuce, tomato & mayo on toasted bread",
				prices: [{ price: "14.50" }]
			},
			{
				name: "Tuna Club Sandwich",
				description: "Tuna, bacon & cheese, lettuce, tomato & mayo on toasted bread",
				prices: [{ price: "14.50" }]
			},
			{
				name: "BLT Club Sandwich",
				description: "Crisp bacon, lettuce, tomato, and mayonnaise",
				prices: [{ price: "14.50" }]
			}
		]
	},
	{
		id: "hot-subs",
		name: "Hot Subs",
		note: "Half or whole where listed.",
		kind: "split",
		items: [
			{
				name: "Veal Parmigiana Hot Sub",
				description: "Veal cutlets, tomato sauce, and parmesan cheese",
				prices: [{
					label: "Half",
					price: "12.95"
				}]
			},
			{
				name: "Chicken Parmigiana Hot Sub",
				description: "Chicken, parmesan and classic cheese",
				prices: [{
					label: "Half",
					price: "12.95"
				}]
			},
			{
				name: "Sausage Hot Sub",
				prices: [{
					label: "Half",
					price: "11.50"
				}, {
					label: "Whole",
					price: "17.00"
				}]
			},
			{
				name: "Sausage Parmigiana Hot Sub",
				description: "Topped with sausage and parmesan cheese",
				prices: [{
					label: "Half",
					price: "12.95"
				}]
			},
			{
				name: "Meatball Parmigiana Hot Sub",
				description: "Topped with homemade meatballs and cheese",
				prices: [{
					label: "Half",
					price: "12.95"
				}]
			},
			{
				name: "Eggplant Hot Sub",
				prices: [{
					label: "Half",
					price: "11.50"
				}, {
					label: "Whole",
					price: "17.50"
				}]
			},
			{
				name: "Eggplant Parmigiana Hot Sub",
				prices: [{
					label: "Half",
					price: "12.95"
				}]
			}
		]
	},
	{
		id: "cold-subs",
		name: "Cold Subs",
		note: "Lettuce, tomato, onion, oil & vinegar on request.",
		kind: "split",
		items: [
			{
				name: "Italian Cold Sub",
				description: "Ham, salami, capicola, onions, lettuce, tomato, cheese",
				prices: [{
					label: "Half",
					price: "13.95"
				}]
			},
			{
				name: "Ham & Cheese Cold Sub",
				description: "Topped with ham and classic cheese",
				prices: [{
					label: "Half",
					price: "11.50"
				}]
			},
			{
				name: "Salami & Cheese Cold Sub",
				prices: [{
					label: "Half",
					price: "11.50"
				}]
			},
			{
				name: "Turkey Cold Sub",
				description: "Topped with sliced turkey meat",
				prices: [{
					label: "Half",
					price: "11.00"
				}]
			},
			{
				name: "Turkey & Cheese Cold Sub",
				description: "Topped with turkey and classic cheese",
				prices: [{
					label: "Half",
					price: "12.95"
				}]
			},
			{
				name: "Tuna Cold Sub",
				description: "White meat. Delicious tuna fish salad, veggies in a satisfying sub",
				prices: [{
					label: "Half",
					price: "11.75"
				}]
			},
			{
				name: "Tuna & Cheese Cold Sub",
				description: "White meat. Delicious tuna fish salad, & cheese, veggies in a satisfying sub",
				prices: [{
					label: "Half",
					price: "12.95"
				}]
			}
		]
	},
	{
		id: "steak-subs",
		name: "Steak Subs",
		note: "Lettuce, tomato, mayo, onions & hot peppers on request.",
		kind: "split",
		items: [
			{
				name: "Buffalo Chicken Cheesesteak Sub",
				description: "Bleu cheese & mild or hot sauce",
				prices: [{
					label: "Half",
					price: "12.95"
				}]
			},
			{
				name: "Steak Sub",
				description: "Shaved steak",
				prices: [{
					label: "Half",
					price: "11.50"
				}]
			},
			{
				name: "Cheesesteak Sub",
				description: "Shredded steak topped with classic cheese",
				prices: [{
					label: "Half",
					price: "12.95"
				}]
			},
			{
				name: "Bacon Cheesesteak Sub",
				prices: [{
					label: "Half",
					price: "13.50"
				}]
			},
			{
				name: "Mushroom Steak Sub",
				prices: [{
					label: "Half",
					price: "13.50"
				}]
			},
			{
				name: "Mushroom Cheesesteak Sub",
				prices: [{
					label: "Half",
					price: "13.50"
				}]
			},
			{
				name: "Pepper Steak Sub",
				prices: [{
					label: "Half",
					price: "12.00"
				}, {
					label: "Whole",
					price: "18.00"
				}]
			},
			{
				name: "Pepper Cheesesteak Sub",
				prices: [{
					label: "Half",
					price: "12.50"
				}]
			},
			{
				name: "Pizza Steak Sub",
				prices: [{
					label: "Half",
					price: "12.95"
				}]
			},
			{
				name: "Pepperoni Cheesesteak Sub",
				prices: [{
					label: "Half",
					price: "13.95"
				}]
			},
			{
				name: "Chicken Cheesesteak Sub",
				prices: [{
					label: "Half",
					price: "12.95"
				}]
			},
			{
				name: "Chicken Steak Sub",
				prices: [{
					label: "Half",
					price: "11.50"
				}, {
					label: "Whole",
					price: "18.00"
				}]
			},
			{
				name: "Veggie Sub",
				prices: [{
					label: "Half",
					price: "13.00"
				}]
			}
		]
	},
	{
		id: "burgers",
		name: "Burgers",
		note: "Served with lettuce, tomato & onion.",
		kind: "single",
		items: [
			{
				name: "Hamburger",
				description: "Plain hamburger",
				prices: [{ price: "9.25" }]
			},
			{
				name: "Cheeseburger",
				prices: [{ price: "10.50" }]
			},
			{
				name: "Bacon Cheeseburger",
				description: "Delicious cheeseburger topped with fresh crispy bacon",
				prices: [{ price: "11.00" }]
			},
			{
				name: "Pizza Burger",
				description: "Beef, cheese, and red sauce",
				prices: [{ price: "11.00" }]
			},
			{
				name: "Double Cheeseburger",
				description: "Double patty with cheese",
				prices: [{ price: "15.00" }]
			},
			{
				name: "Western Burger",
				description: "Mushrooms, onions & BBQ sauce",
				prices: [{ price: "13.75" }]
			}
		]
	},
	{
		id: "wraps",
		name: "Wraps",
		note: "Served with chips where noted.",
		kind: "single",
		items: [
			{
				name: "Fresh Grilled Chicken Wrap",
				prices: [{ price: "12.00" }]
			},
			{
				name: "Ham Wrap",
				prices: [{ price: "10.00" }]
			},
			{
				name: "Turkey Wrap",
				description: "Turkey, lettuce, tomatoes and onions",
				prices: [{ price: "10.00" }]
			},
			{
				name: "Tuna Wrap",
				description: "Lettuce, tomatoes, onions, and melted cheese",
				prices: [{ price: "12.00" }]
			},
			{
				name: "California Cobb Wrap",
				description: "Mixed greens, cucumbers, black olives, boiled egg, diced chicken & bacon",
				prices: [{ price: "13.95" }]
			},
			{
				name: "Chicken Balsamic Wrap",
				description: "Mixed greens, red onions, roasted peppers, grilled chicken, fresh basil & Balsamic Vinaigrette",
				prices: [{ price: "13.95" }]
			},
			{
				name: "Black & Bleu Chicken Wrap",
				description: "Lettuce, bacon, Bleu cheese & blackened chicken",
				prices: [{ price: "13.95" }]
			},
			{
				name: "Chicken BLT Wrap",
				description: "Bacon, lettuce, tomato & grilled chicken, served with chips",
				prices: [{ price: "13.95" }]
			},
			{
				name: "Chicken Fajita Wrap",
				description: "Peppers, onions, Cajun spices, lime, salsa, lettuce & grilled chicken, served with chips",
				prices: [{ price: "13.95" }]
			}
		]
	},
	{
		id: "gyros",
		name: "Gyro Sandwiches",
		kind: "single",
		items: [{
			name: "Gyro Sandwich",
			description: "Juicy gyro meat with lettuce, onions, tomatoes, and tzatziki sauce",
			prices: [{ price: "11.50" }]
		}]
	},
	{
		id: "pasta",
		name: "Pasta Dishes",
		note: "Platters served with salad, bread & butter.",
		kind: "single",
		items: [
			{
				name: "Pasta with Tomato Sauce",
				description: "Pasta tossed in our homemade tomato sauce",
				prices: [{ price: "14.50" }]
			},
			{
				name: "Pasta with Meatballs",
				description: "Spaghetti topped in our homemade meatballs",
				prices: [{ price: "16.50" }]
			},
			{
				name: "Spaghetti",
				prices: [{ price: "15.50" }]
			},
			{
				name: "Pasta with Sausage",
				description: "Pasta topped with sausage",
				prices: [{ price: "16.50" }]
			},
			{
				name: "Ziti",
				prices: [{ price: "10.50" }]
			},
			{
				name: "Baked Ziti",
				description: "Ziti with mozzarella and tomato sauce baked to perfection in our oven",
				prices: [{ price: "16.50" }]
			},
			{
				name: "Spaghetti with Clams",
				prices: [{ price: "16.50" }]
			},
			{
				name: "Manicotti",
				description: "A large tube of fresh pasta stuffed with a blend of soft cheese",
				prices: [{ price: "16.50" }]
			},
			{
				name: "Cheese Ravioli",
				description: "Ravioli stuffed with classic cheese",
				prices: [{ price: "16.50" }]
			},
			{
				name: "Eggplant Parmigiana Pasta",
				description: "Topped with eggplant slices, parmesan cheese, and marinara sauce",
				prices: [{ price: "17.50" }]
			},
			{
				name: "Veal Parmigiana Pasta",
				prices: [{ price: "18.50" }]
			},
			{
				name: "Chicken Parmigiana Pasta",
				prices: [{ price: "18.50" }]
			}
		]
	},
	{
		id: "desserts",
		name: "Desserts",
		kind: "single",
		items: [
			{
				name: "New York Style Cheesecake",
				description: "Classic New York cheesecake with a creamy satiny texture",
				prices: [{ price: "6.95" }]
			},
			{
				name: "Chocolate Suicide Cake",
				prices: [{ price: "6.95" }]
			},
			{
				name: "Cannoli",
				description: "Delicious tube of fried dough, filled with a sweet, creamy ricotta filling",
				prices: [{ price: "6.95" }]
			}
		]
	},
	{
		id: "beverages",
		name: "Beverages",
		kind: "split",
		items: [
			{
				name: "Soda",
				prices: [{
					label: "20 oz",
					price: "4.75"
				}, {
					label: "2 Liter",
					price: "5.50"
				}]
			},
			{
				name: "Brisk Iced Tea",
				prices: [{
					label: "2 Liter",
					price: "5.50"
				}]
			},
			{
				name: "Pure Leaf Ice Tea",
				prices: [{
					label: "20 oz",
					price: "4.75"
				}]
			},
			{
				name: "Apple Juice",
				prices: [{
					label: "20 oz",
					price: "4.75"
				}]
			}
		]
	}
];
//#endregion
//#region src/lib/geo.ts
var ZONE_BOUNDS = {
	south: 39.32,
	north: 39.46,
	west: -74.73,
	east: -74.52
};
var CELL = .0032;
var MAP_CENTER = [39.3787, -74.6051];
function cellKey(lat, lng) {
	return `${Math.floor((lat - ZONE_BOUNDS.south) / CELL)},${Math.floor((lng - ZONE_BOUNDS.west) / CELL)}`;
}
function cellRect(key) {
	const [i, j] = key.split(",").map(Number);
	const south = ZONE_BOUNDS.south + i * CELL;
	const west = ZONE_BOUNDS.west + j * CELL;
	return {
		south,
		west,
		north: south + CELL,
		east: west + CELL
	};
}
function paintAround(lat, lng, radius) {
	const keys = [];
	for (let di = -radius; di <= radius; di += 1) for (let dj = -radius; dj <= radius; dj += 1) keys.push(cellKey(lat + di * CELL, lng + dj * CELL));
	return keys;
}
function cellSetHas(cells, lat, lng) {
	if (!cells.length) return false;
	return cells.includes(cellKey(lat, lng));
}
function googleMapsSearchUrl(query) {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
function googleMapsCoordUrl(lat, lng) {
	return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
//#endregion
//#region src/lib/phone.ts
function digitsOnly(value) {
	return value.replace(/\D/g, "");
}
function looksLikePhone(value) {
	const d = digitsOnly(value);
	return d.length === 10 || d.length === 11 && d.startsWith("1");
}
function toTenDigitPhone(value) {
	const d = digitsOnly(value);
	if (d.length === 11 && d.startsWith("1")) return d.slice(1);
	if (d.length === 10) return d;
	return "";
}
function formatPhone(value) {
	const d = toTenDigitPhone(value);
	if (d.length !== 10) return value;
	return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
/** Map an email, shop username, or US phone into the Better Auth email identifier. */
function identifierToEmail(raw) {
	const trimmed = raw.trim();
	const phone = toTenDigitPhone(trimmed);
	if (phone) return {
		email: `${phone}@phone.southend.pizza`,
		phone
	};
	if (isStaffAdminUsername(trimmed)) return {
		email: STAFF_ADMIN_EMAIL,
		phone: void 0
	};
	return {
		email: trimmed.toLowerCase(),
		phone: void 0
	};
}
/** Synthetic Better Auth emails for phone-number accounts — no real inbox. */
function isPhoneAuthEmail(email) {
	if (!email) return false;
	return /@phone\.southend\.pizza$/i.test(email.trim());
}
//#endregion
//#region src/lib/totp.ts
var ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(bytes) {
	let bits = "";
	for (const b of bytes) bits += b.toString(2).padStart(8, "0");
	let out = "";
	for (let i = 0; i < bits.length; i += 5) {
		const chunk = bits.slice(i, i + 5).padEnd(5, "0");
		out += ALPH[parseInt(chunk, 2)];
	}
	return out;
}
function base32Decode(secret) {
	const clean = secret.replace(/=+$/, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
	let bits = "";
	for (const ch of clean) {
		const idx = ALPH.indexOf(ch);
		if (idx < 0) continue;
		bits += idx.toString(2).padStart(5, "0");
	}
	const bytes = [];
	for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
	return Buffer.from(bytes);
}
function generateTotpSecret() {
	return base32Encode(randomBytes(20));
}
function totpCode(secret, at = Date.now()) {
	const key = base32Decode(secret);
	const counter = Math.floor(at / 1e3 / 30);
	const buf = Buffer.alloc(8);
	buf.writeUInt32BE(Math.floor(counter / 4294967296), 0);
	buf.writeUInt32BE(counter >>> 0, 4);
	const hmac = createHmac("sha1", key).update(buf).digest();
	const offset = hmac[hmac.length - 1] & 15;
	const bin = (hmac[offset] & 127) << 24 | (hmac[offset + 1] & 255) << 16 | (hmac[offset + 2] & 255) << 8 | hmac[offset + 3] & 255;
	return String(bin % 1e6).padStart(6, "0");
}
function verifyTotp(secret, code) {
	const c = code.replace(/\s/g, "");
	if (!/^\d{6}$/.test(c)) return false;
	const now = Date.now();
	for (const w of [
		-1,
		0,
		1
	]) if (totpCode(secret, now + w * 3e4) === c) return true;
	return false;
}
function totpUri(secret, account) {
	return `otpauth://totp/${encodeURIComponent(`SEP:${account}`)}?secret=${secret}&issuer=SEP&digits=6&period=30`;
}
//#endregion
//#region src/lib/shop-types.ts
var SEASON_EFFECTS = [
	{
		id: "none",
		label: "Off"
	},
	{
		id: "newyear",
		label: "New Year's"
	},
	{
		id: "christmas",
		label: "Christmas"
	},
	{
		id: "halloween",
		label: "Halloween"
	},
	{
		id: "july4",
		label: "4th of July"
	},
	{
		id: "valentines",
		label: "Valentine's Day"
	},
	{
		id: "stpatrick",
		label: "St. Patrick's Day"
	}
];
function sanitizeSeasonEffect(raw) {
	const s = String(raw ?? "none");
	return SEASON_EFFECTS.some((e) => e.id === s) ? s : "none";
}
var CARD_TEXT_SIZES = [
	{
		id: "sm",
		label: "Small"
	},
	{
		id: "md",
		label: "Medium"
	},
	{
		id: "lg",
		label: "Large"
	},
	{
		id: "xl",
		label: "XL"
	}
];
var CARD_SIZES = CARD_TEXT_SIZES;
var CARD_TEXT_COLORS = [
	{
		id: "ink",
		label: "Ink"
	},
	{
		id: "tomato",
		label: "Tomato"
	},
	{
		id: "tomato-dark",
		label: "Deep red"
	},
	{
		id: "muted",
		label: "Muted"
	},
	{
		id: "brass",
		label: "Brass"
	},
	{
		id: "forest",
		label: "Forest"
	}
];
var CARD_BG_COLORS = [
	{
		id: "paper",
		label: "Paper"
	},
	{
		id: "cream",
		label: "Cream"
	},
	{
		id: "wheat",
		label: "Wheat"
	}
];
var CARD_COLOR_HEX = {
	ink: "#1a1410",
	tomato: "#9a221c",
	"tomato-dark": "#6e1612",
	muted: "#6b5d52",
	brass: "#8a5a12",
	forest: "#2f4a38"
};
var CARD_BG_HEX = {
	paper: "#f4ead8",
	cream: "#fbf6ec",
	wheat: "#eadcc4"
};
function expandShortHex(s) {
	if (!/^#[0-9a-f]{3}$/.test(s)) return s;
	const r = s[1];
	const g = s[2];
	const b = s[3];
	return `#${r}${r}${g}${g}${b}${b}`;
}
function parseNamedOrHex(raw, named, fallback) {
	const s = String(raw ?? fallback).trim().toLowerCase();
	if (named.some((x) => x.id === s)) return s;
	if (/^#[0-9a-f]{6}$/.test(s)) return s;
	if (/^#[0-9a-f]{3}$/.test(s)) return expandShortHex(s);
	return fallback;
}
function sanitizeCardTextSize(raw) {
	const s = String(raw ?? "md");
	return CARD_TEXT_SIZES.some((x) => x.id === s) ? s : "md";
}
var sanitizeCardSize = sanitizeCardTextSize;
function sanitizeCardTextColor(raw) {
	return parseNamedOrHex(raw, CARD_TEXT_COLORS, "ink");
}
function sanitizeCardBg(raw) {
	return parseNamedOrHex(raw, CARD_BG_COLORS, "paper");
}
function cardColorKind(color) {
	const c = sanitizeCardTextColor(color);
	if (CARD_TEXT_COLORS.some((x) => x.id === c)) return c;
	return "custom";
}
function cardBgKind(color) {
	const c = sanitizeCardBg(color);
	if (CARD_BG_COLORS.some((x) => x.id === c)) return c;
	return "custom";
}
function cardColorHex(color) {
	const c = sanitizeCardTextColor(color);
	if (c.startsWith("#")) return c;
	return CARD_COLOR_HEX[c] ?? CARD_COLOR_HEX.ink;
}
function cardBgHex(color) {
	const c = sanitizeCardBg(color);
	if (c.startsWith("#")) return c;
	return CARD_BG_HEX[c] ?? CARD_BG_HEX.paper;
}
function relLum(hex) {
	const n = parseInt(hex.slice(1), 16);
	const ch = (v) => {
		const s = v / 255;
		return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4;
	};
	return .2126 * ch(n >> 16 & 255) + .7152 * ch(n >> 8 & 255) + .0722 * ch(n & 255);
}
function cardTextContrastOk(color, bg = "paper") {
	const a = relLum(cardColorHex(color));
	const b = relLum(cardBgHex(bg));
	return (Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 3;
}
function cardTypeStyle(color, descColor, priceColor, bg) {
	return {
		["--food-card-ink"]: cardColorHex(color),
		["--food-card-muted"]: cardColorHex(descColor || "muted"),
		["--food-card-price-ink"]: cardColorHex(priceColor || color),
		["--food-card-bg"]: cardBgHex(bg || "paper")
	};
}
function isActiveOrderStatus(status) {
	return status !== "completed" && status !== "canceled";
}
function formatTicketNo(n) {
	const v = Math.round(Number(n) || 0);
	return v > 0 ? String(v).padStart(6, "0") : "------";
}
var DEFAULT_RECEIPT_OPTIONS = {
	taxId: "",
	footer: "Thank you for dining with us. Keep this receipt for your records.",
	autoPrintOnAccept: true
};
function moneyNumber(value) {
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : 0;
}
function formatUsd(value) {
	return `$${value.toFixed(2)}`;
}
function payMethodLabel(method) {
	if (method === "pay_delivery") return "Cash";
	if (method === "pay_pickup") return "Pay at pickup";
	if (method === "pay_card") return "Card";
	return method.replaceAll("_", " ");
}
function computeTax(subtotal, discount, deliveryFee, taxRate) {
	const taxable = Math.max(0, subtotal - discount) + Math.max(0, deliveryFee);
	const rate = Math.max(0, taxRate) / 100;
	const tax = Math.round(taxable * rate * 100) / 100;
	return {
		taxable,
		tax,
		total: Math.round((taxable + tax) * 100) / 100
	};
}
function tipFromPercent(subtotal, discount, percent) {
	const food = Math.max(0, subtotal - discount);
	return Math.round(Math.max(0, percent) / 100 * food * 100) / 100;
}
function clampTip(value) {
	const n = Math.round(Math.max(0, moneyNumber(value)) * 100) / 100;
	return Math.min(n, 500);
}
function newPrinter(init) {
	return {
		id: `ptr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
		name: init?.name || "Receipt printer",
		bluetoothId: init?.bluetoothId || "",
		bluetoothName: init?.bluetoothName || "",
		lanHost: init?.lanHost || "",
		lanPort: init?.lanPort === 8043 ? 8043 : 8008,
		lanProtocol: init?.lanProtocol === "https" ? "https" : "http",
		enabled: init?.enabled ?? true,
		copies: init?.copies ?? 1,
		customerCopy: init?.customerCopy ?? true,
		storeCopy: init?.storeCopy ?? true,
		paper: init?.paper === "80mm" ? "80mm" : "58mm"
	};
}
function parsePrinters(raw) {
	let src = raw;
	if (typeof raw === "string") try {
		src = JSON.parse(raw);
	} catch {
		src = [];
	}
	if (!Array.isArray(src)) return [];
	return src.map((row) => {
		const r = row && typeof row === "object" ? row : {};
		return {
			id: String(r.id || `ptr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`),
			name: String(r.name || "Receipt printer"),
			bluetoothId: String(r.bluetoothId || ""),
			bluetoothName: String(r.bluetoothName || ""),
			lanHost: String(r.lanHost || "").trim(),
			lanPort: Number(r.lanPort) === 8043 ? 8043 : 8008,
			lanProtocol: r.lanProtocol === "https" || Number(r.lanPort) === 8043 ? "https" : "http",
			enabled: r.enabled !== false,
			copies: Math.max(1, Math.round(moneyNumber(r.copies) || 1)),
			customerCopy: r.customerCopy !== false,
			storeCopy: r.storeCopy !== false,
			paper: r.paper === "80mm" ? "80mm" : "58mm"
		};
	});
}
function parseReceiptOptions(raw) {
	let src = raw;
	if (typeof raw === "string") try {
		src = JSON.parse(raw);
	} catch {
		src = {};
	}
	const r = src && typeof src === "object" ? src : {};
	return {
		taxId: String(r.taxId ?? ""),
		footer: String(r.footer ?? DEFAULT_RECEIPT_OPTIONS.footer),
		autoPrintOnAccept: r.autoPrintOnAccept !== false
	};
}
//#endregion
//#region src/lib/condiments.ts
function nid$1(name, index) {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || `cond-${index + 1}`;
}
function condimentMax(raw) {
	const n = Math.round(Number(raw ?? 9));
	if (!Number.isFinite(n) || n < 1) return 9;
	return Math.min(9, n);
}
function sanitizeCondiments(raw) {
	if (!Array.isArray(raw)) return [];
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const row of raw.slice(0, 24)) {
		const rec = row && typeof row === "object" ? row : {};
		const name = String(rec.name ?? "").trim().slice(0, 40);
		if (!name) continue;
		let id = String(rec.id ?? "").trim().slice(0, 40) || nid$1(name, out.length);
		if (seen.has(id)) id = `${id}-${out.length + 1}`;
		seen.add(id);
		const price = moneyNumber(rec.price);
		const extraRaw = rec.extraPrice === void 0 || rec.extraPrice === "" ? price : moneyNumber(rec.extraPrice);
		out.push({
			id,
			name,
			price: price > 0 ? String(Math.round(price * 100) / 100) : "0",
			extraPrice: extraRaw > 0 ? String(Math.round(extraRaw * 100) / 100) : "0",
			maxQty: String(condimentMax(rec.maxQty))
		});
	}
	return out;
}
function condimentCharge(c, qty) {
	const cap = condimentMax(c.maxQty);
	const n = Math.max(0, Math.min(cap, Math.round(Number(qty) || 0)));
	if (n <= 0) return 0;
	const add = Math.max(0, moneyNumber(c.price));
	const extra = Math.max(0, moneyNumber(c.extraPrice || c.price));
	return Math.round((add + extra * Math.max(0, n - 1)) * 100) / 100;
}
function sanitizeCondimentPicks(raw, catalog) {
	const list = Array.isArray(raw) ? raw : [];
	const byId = new Map(catalog.map((c) => [c.id, c]));
	const picks = [];
	for (const row of list) {
		const rec = row && typeof row === "object" ? row : {};
		const c = byId.get(String(rec.id ?? ""));
		if (!c) continue;
		const cap = condimentMax(c.maxQty);
		const qty = Math.max(0, Math.min(cap, Math.round(moneyNumber(rec.qty))));
		if (qty <= 0) continue;
		picks.push({
			id: c.id,
			name: c.name,
			qty,
			charge: condimentCharge(c, qty)
		});
	}
	return picks;
}
function condimentTotal(picks) {
	return Math.round(picks.reduce((n, p) => n + p.charge, 0) * 100) / 100;
}
function condimentDetail(picks) {
	return picks.filter((p) => p.qty > 0).map((p) => p.qty > 1 ? `${p.name} ×${p.qty}` : p.name).join(", ");
}
function mergeItemDetail(...parts) {
	return parts.map((p) => String(p ?? "").trim()).filter(Boolean).join(" · ");
}
//#endregion
//#region src/lib/wings.ts
var WING_SAUCES = [
	"Hot",
	"Mild",
	"Dry",
	"BBQ"
];
var WING_INCLUDED_DIPS = [
	{
		id: "ranch",
		label: "2 Ranch"
	},
	{
		id: "blue",
		label: "2 Blue cheese"
	},
	{
		id: "none",
		label: "None"
	}
];
var WING_EXTRA_PRICE = 1.5;
function isWingsBuild(cat, item) {
	if (cat.id === "wings" && /wing/i.test(item.name)) return true;
	return /fresh wings|chicken wings/i.test(item.name);
}
function extraDipUnitPrice(condiments, which) {
	const n = moneyNumber((condiments ?? []).find((c) => {
		const id = String(c.id ?? "").toLowerCase();
		const name = String(c.name ?? "");
		if (which === "ranch") return id === "wing-extra-ranch" || /extra ranch/i.test(name);
		return id === "wing-extra-blue" || /extra blue/i.test(name);
	})?.price);
	return n > 0 ? n : WING_EXTRA_PRICE;
}
function extraDipCharge(cups, unit = WING_EXTRA_PRICE) {
	const n = Math.max(0, Math.round(Number(cups) || 0));
	const sets = Math.floor(n / 2);
	return Math.round(sets * unit * 100) / 100;
}
function snapExtraCups(n) {
	const raw = Math.max(0, Math.min(6, Math.round(Number(n) || 0)));
	return Math.floor(raw / 2) * 2;
}
function snapWingQty(n) {
	const raw = Math.max(10, Math.min(50, Math.round(Number(n) || 10)));
	return Math.round(raw / 10) * 10;
}
function parseWingQty(label) {
	const m = String(label ?? "").match(/(\d+)\s*pc/i);
	if (!m) return 0;
	return snapWingQty(Number(m[1]));
}
function wingQtyMultiplier(qty) {
	return snapWingQty(qty) / 10;
}
function wingBuildReady(sauce, dip) {
	return WING_SAUCES.includes(sauce) && WING_INCLUDED_DIPS.some((d) => d.id === dip);
}
function wingBuildPicks(input) {
	const extraRanch = snapExtraCups(input.extraRanch);
	const extraBlue = snapExtraCups(input.extraBlue);
	const ranchUnit = input.ranchUnit && input.ranchUnit > 0 ? input.ranchUnit : WING_EXTRA_PRICE;
	const blueUnit = input.blueUnit && input.blueUnit > 0 ? input.blueUnit : WING_EXTRA_PRICE;
	const condiments = [{
		id: `wing-sauce-${input.sauce.toLowerCase()}`,
		name: input.sauce,
		qty: 1,
		charge: 0
	}];
	const dipRow = WING_INCLUDED_DIPS.find((d) => d.id === input.dip);
	if (dipRow) condiments.push({
		id: `wing-dip-${dipRow.id}`,
		name: dipRow.label,
		qty: 1,
		charge: 0
	});
	if (extraRanch > 0) condiments.push({
		id: "wing-extra-ranch",
		name: "Extra Ranch",
		qty: extraRanch,
		charge: extraDipCharge(extraRanch, ranchUnit)
	});
	if (extraBlue > 0) condiments.push({
		id: "wing-extra-blue",
		name: "Extra Blue cheese",
		qty: extraBlue,
		charge: extraDipCharge(extraBlue, blueUnit)
	});
	const extras = extraDipCharge(extraRanch, ranchUnit) + extraDipCharge(extraBlue, blueUnit);
	return {
		condiments,
		detail: mergeItemDetail(input.sauce, dipRow?.label, extraRanch > 0 ? `Extra Ranch ×${extraRanch}` : "", extraBlue > 0 ? `Extra Blue cheese ×${extraBlue}` : ""),
		extras
	};
}
function sanitizeWingPicks(raw, condiments) {
	const list = Array.isArray(raw) ? raw : [];
	let sauce = "";
	let dip = "";
	let extraRanch = 0;
	let extraBlue = 0;
	for (const row of list) {
		const rec = row && typeof row === "object" ? row : {};
		const id = String(rec.id ?? "").toLowerCase();
		const name = String(rec.name ?? "").trim();
		const qty = Math.max(0, Math.round(Number(rec.qty) || 0));
		const sauceHit = WING_SAUCES.find((s) => id === `wing-sauce-${s.toLowerCase()}` || name.toLowerCase() === s.toLowerCase());
		if (sauceHit) {
			sauce = sauceHit;
			continue;
		}
		const dipHit = WING_INCLUDED_DIPS.find((d) => id === `wing-dip-${d.id}` || name.toLowerCase() === d.label.toLowerCase());
		if (dipHit) {
			dip = dipHit.id;
			continue;
		}
		if (id === "wing-extra-ranch" || /extra ranch/i.test(name)) extraRanch = snapExtraCups(qty || extraRanch);
		if (id === "wing-extra-blue" || /extra blue/i.test(name)) extraBlue = snapExtraCups(qty || extraBlue);
	}
	if (!wingBuildReady(sauce, dip)) return null;
	return wingBuildPicks({
		sauce,
		dip,
		extraRanch,
		extraBlue,
		ranchUnit: extraDipUnitPrice(condiments, "ranch"),
		blueUnit: extraDipUnitPrice(condiments, "blue")
	});
}
//#endregion
//#region src/lib/menu-store.ts
function nid(prefix) {
	return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}
function pizzaPrices(from) {
	const src = (from ?? []).map((p) => ({ ...p }));
	const byLabel = new Map(src.filter((p) => p.label).map((p) => [String(p.label), p]));
	const core = [
		byLabel.get("SM") ?? {
			label: "SM",
			inches: "12\"",
			price: ""
		},
		byLabel.get("MD") ?? {
			label: "MD",
			inches: "14\"",
			price: ""
		},
		byLabel.get("LG") ?? {
			label: "LG",
			inches: "16\"",
			price: ""
		}
	];
	const extras = src.filter((p) => p.label !== "SM" && p.label !== "MD" && p.label !== "LG");
	return [...core, ...extras];
}
function seedItem(item, cat, index) {
	return {
		...item,
		id: item.id ?? `${cat.id}-${index}`,
		prices: item.prices.map((p) => ({ ...p })),
		condiments: (item.condiments ?? []).map((c) => ({ ...c }))
	};
}
function seedMenu() {
	return {
		restaurant: { ...RESTAURANT },
		footer: DEFAULT_FOOTER,
		categories: MENU.map((cat) => ({
			...cat,
			items: cat.items.map((item, i) => seedItem(item, cat, i))
		}))
	};
}
function newItem(kind) {
	if (kind === "pizza") return {
		id: nid("item"),
		name: "New pizza",
		description: "",
		prices: pizzaPrices()
	};
	if (kind === "split") return {
		id: nid("item"),
		name: "New item",
		description: "",
		prices: [{
			label: "Half",
			price: ""
		}]
	};
	return {
		id: nid("item"),
		name: "New item",
		description: "",
		prices: [{ price: "" }]
	};
}
function mapCat(categories, catId, fn) {
	return categories.map((c) => c.id === catId ? fn(c) : c);
}
function mapItem(categories, catId, itemId, fn) {
	return mapCat(categories, catId, (c) => ({
		...c,
		items: c.items.map((it) => it.id === itemId ? fn(it) : it)
	}));
}
function moveIn(list, id, dir) {
	const i = list.findIndex((x) => x.id === id);
	const j = i + dir;
	if (i < 0 || j < 0 || j >= list.length) return list;
	const next = list.slice();
	const [row] = next.splice(i, 1);
	next.splice(j, 0, row);
	return next;
}
function toTel(phone) {
	const digits = phone.replace(/\D/g, "");
	if (digits.length === 10) return `tel:+1${digits}`;
	if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
	if (digits.length) return `tel:+${digits}`;
	return "";
}
function snapshot(s) {
	return JSON.stringify({
		restaurant: s.restaurant,
		footer: s.footer,
		categories: s.categories.map((c) => ({
			id: c.id,
			name: c.name,
			note: c.note ?? "",
			kind: c.kind,
			icon: c.icon ?? "",
			items: c.items.map((it) => ({
				name: it.name,
				description: it.description ?? "",
				highlight: Boolean(it.highlight),
				prices: it.prices,
				image: it.image ?? "",
				hideImage: Boolean(it.hideImage),
				condiments: it.condiments ?? []
			}))
		}))
	});
}
var DEFAULT = {
	...seedMenu(),
	cardTextSize: "md",
	cardTextColor: "ink",
	cardDescColor: "muted",
	cardPriceColor: "ink",
	cardSize: "md",
	cardBg: "paper",
	tagline: "",
	showMark: true
};
var DEFAULT_SNAP = snapshot(DEFAULT);
function isCustomMenu(s) {
	return snapshot(s) !== DEFAULT_SNAP;
}
var useMenuStore = create()(persist((set) => ({
	...DEFAULT,
	setRestaurant: (patch) => set((s) => {
		const restaurant = {
			...s.restaurant,
			...patch
		};
		if (patch.phone !== void 0) restaurant.phoneHref = toTel(patch.phone);
		return { restaurant };
	}),
	setFooter: (footer) => set({ footer }),
	setCardType: (patch) => set((s) => ({
		cardTextSize: patch.cardTextSize !== void 0 ? sanitizeCardTextSize(patch.cardTextSize) : s.cardTextSize,
		cardTextColor: patch.cardTextColor !== void 0 ? sanitizeCardTextColor(patch.cardTextColor) : s.cardTextColor,
		cardDescColor: patch.cardDescColor !== void 0 ? sanitizeCardTextColor(patch.cardDescColor) : s.cardDescColor,
		cardPriceColor: patch.cardPriceColor !== void 0 ? sanitizeCardTextColor(patch.cardPriceColor) : s.cardPriceColor,
		cardSize: patch.cardSize !== void 0 ? sanitizeCardSize(patch.cardSize) : s.cardSize,
		cardBg: patch.cardBg !== void 0 ? sanitizeCardBg(patch.cardBg) : s.cardBg
	})),
	setShopWeb: (patch) => set((s) => ({
		tagline: patch.tagline !== void 0 ? patch.tagline : s.tagline,
		showMark: patch.showMark !== void 0 ? patch.showMark : s.showMark
	})),
	patchCategory: (id, patch) => set((s) => ({ categories: mapCat(s.categories, id, (c) => ({
		...c,
		...patch
	})) })),
	setKind: (id, kind) => set((s) => ({ categories: mapCat(s.categories, id, (c) => ({
		...c,
		kind,
		items: kind === "pizza" ? c.items.map((it) => ({
			...it,
			prices: pizzaPrices(it.prices)
		})) : c.items
	})) })),
	addCategory: () => set((s) => ({ categories: [...s.categories, {
		id: nid("cat"),
		name: "New section",
		kind: "single",
		icon: "appetizers",
		items: []
	}] })),
	deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
	moveCategory: (id, dir) => set((s) => ({ categories: moveIn(s.categories, id, dir) })),
	patchItem: (catId, itemId, patch) => set((s) => ({ categories: mapItem(s.categories, catId, itemId, (it) => ({
		...it,
		...patch
	})) })),
	setPrices: (catId, itemId, prices) => set((s) => ({ categories: mapItem(s.categories, catId, itemId, (it) => ({
		...it,
		prices
	})) })),
	addItem: (catId) => set((s) => ({ categories: mapCat(s.categories, catId, (c) => ({
		...c,
		items: [...c.items, newItem(c.kind)]
	})) })),
	duplicateItem: (catId, itemId) => set((s) => ({ categories: mapCat(s.categories, catId, (c) => {
		const i = c.items.findIndex((it) => it.id === itemId);
		if (i < 0) return c;
		const src = c.items[i];
		const copy = {
			...src,
			id: nid("item"),
			name: src.name.endsWith(" copy") ? src.name : `${src.name} copy`,
			prices: src.prices.map((p) => ({ ...p })),
			condiments: (src.condiments ?? []).map((c) => ({
				...c,
				id: nid("cond")
			}))
		};
		const items = c.items.slice();
		items.splice(i + 1, 0, copy);
		return {
			...c,
			items
		};
	}) })),
	deleteItem: (catId, itemId) => set((s) => ({ categories: mapCat(s.categories, catId, (c) => ({
		...c,
		items: c.items.filter((it) => it.id !== itemId)
	})) })),
	moveItem: (catId, itemId, dir) => set((s) => ({ categories: mapCat(s.categories, catId, (c) => ({
		...c,
		items: moveIn(c.items, itemId, dir)
	})) })),
	moveItemTo: (fromCat, itemId, toCat) => set((s) => {
		if (fromCat === toCat) return s;
		const item = s.categories.find((c) => c.id === fromCat)?.items.find((it) => it.id === itemId);
		if (!item) return s;
		return { categories: s.categories.map((c) => {
			if (c.id === fromCat) return {
				...c,
				items: c.items.filter((it) => it.id !== itemId)
			};
			if (c.id === toCat) {
				const moved = c.kind === "pizza" ? {
					...item,
					prices: pizzaPrices(item.prices)
				} : {
					...item,
					prices: item.prices.map((p) => ({ ...p }))
				};
				return {
					...c,
					items: [...c.items, moved]
				};
			}
			return c;
		}) };
	}),
	reset: () => set(seedMenu()),
	replaceAll: (next) => set({
		restaurant: next.restaurant,
		footer: next.footer,
		categories: next.categories,
		...next.cardTextSize !== void 0 ? { cardTextSize: sanitizeCardTextSize(next.cardTextSize) } : {},
		...next.cardTextColor !== void 0 ? { cardTextColor: sanitizeCardTextColor(next.cardTextColor) } : {},
		...next.cardDescColor !== void 0 ? { cardDescColor: sanitizeCardTextColor(next.cardDescColor) } : {},
		...next.cardPriceColor !== void 0 ? { cardPriceColor: sanitizeCardTextColor(next.cardPriceColor) } : {},
		...next.cardSize !== void 0 ? { cardSize: sanitizeCardSize(next.cardSize) } : {},
		...next.cardBg !== void 0 ? { cardBg: sanitizeCardBg(next.cardBg) } : {},
		...next.tagline !== void 0 ? { tagline: next.tagline } : {},
		...next.showMark !== void 0 ? { showMark: next.showMark } : {}
	})
}), {
	name: "south-end-menu-v1",
	storage: createJSONStorage(() => {
		if (typeof window === "undefined") return {
			getItem: () => null,
			setItem: () => {},
			removeItem: () => {}
		};
		return localStorage;
	}),
	skipHydration: true,
	version: 1,
	partialize: (s) => ({
		restaurant: s.restaurant,
		footer: s.footer,
		categories: s.categories,
		cardTextSize: s.cardTextSize,
		cardTextColor: s.cardTextColor,
		cardDescColor: s.cardDescColor,
		cardPriceColor: s.cardPriceColor,
		cardSize: s.cardSize,
		cardBg: s.cardBg,
		tagline: s.tagline,
		showMark: s.showMark
	}),
	merge: (persisted, current) => {
		const p = persisted;
		if (!p || !Array.isArray(p.categories) || !p.restaurant) return current;
		return {
			...current,
			restaurant: {
				...current.restaurant,
				...p.restaurant
			},
			footer: typeof p.footer === "string" ? p.footer : current.footer,
			cardTextSize: sanitizeCardTextSize(p.cardTextSize ?? current.cardTextSize),
			cardTextColor: sanitizeCardTextColor(p.cardTextColor ?? current.cardTextColor),
			cardDescColor: sanitizeCardTextColor(p.cardDescColor ?? current.cardDescColor),
			cardPriceColor: sanitizeCardTextColor(p.cardPriceColor ?? current.cardPriceColor),
			cardSize: sanitizeCardSize(p.cardSize ?? current.cardSize),
			cardBg: sanitizeCardBg(p.cardBg ?? current.cardBg),
			tagline: typeof p.tagline === "string" ? p.tagline : current.tagline,
			showMark: typeof p.showMark === "boolean" ? p.showMark : current.showMark,
			categories: p.categories.map((cat) => ({
				...cat,
				items: (cat.items ?? []).map((it, i) => ({
					...it,
					id: it.id ?? `${cat.id}-${i}`,
					prices: Array.isArray(it.prices) ? it.prices.map((pr) => ({ ...pr })) : [{ price: "" }],
					condiments: Array.isArray(it.condiments) ? it.condiments.map((c) => ({ ...c })) : []
				}))
			}))
		};
	}
}));
//#endregion
//#region src/lib/hours.ts
var DAY_KEYS = [
	"sun",
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat"
];
var DAY_LABELS = {
	sun: "Sunday",
	mon: "Monday",
	tue: "Tuesday",
	wed: "Wednesday",
	thu: "Thursday",
	fri: "Friday",
	sat: "Saturday"
};
var DAY_SHORT = {
	sun: "Sun",
	mon: "Mon",
	tue: "Tue",
	wed: "Wed",
	thu: "Thu",
	fri: "Fri",
	sat: "Sat"
};
var OPEN_DAY = {
	closed: false,
	open: "11:00",
	close: "20:00"
};
var DEFAULT_WEEKLY_HOURS = {
	sun: { ...OPEN_DAY },
	mon: { ...OPEN_DAY },
	tue: { ...OPEN_DAY },
	wed: { ...OPEN_DAY },
	thu: { ...OPEN_DAY },
	fri: { ...OPEN_DAY },
	sat: { ...OPEN_DAY }
};
function cleanClock(value, fallback) {
	const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
	if (!m) return fallback;
	const h = Math.min(23, Math.max(0, Number(m[1])));
	const min = Math.min(59, Math.max(0, Number(m[2])));
	return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
function parseWeeklyHours(raw) {
	const src = typeof raw === "string" ? safeJson(raw) : raw && typeof raw === "object" ? raw : {};
	const next = { ...DEFAULT_WEEKLY_HOURS };
	for (const key of DAY_KEYS) {
		const d = src[key] ?? {};
		next[key] = {
			closed: Boolean(d.closed),
			open: cleanClock(String(d.open ?? OPEN_DAY.open), OPEN_DAY.open),
			close: cleanClock(String(d.close ?? OPEN_DAY.close), OPEN_DAY.close)
		};
	}
	return next;
}
function safeJson(raw) {
	try {
		return JSON.parse(raw);
	} catch {
		return {};
	}
}
function formatClock(hhmm) {
	const [hs, ms] = cleanClock(hhmm, "11:00").split(":");
	const h = Number(hs);
	const m = Number(ms);
	const am = h < 12;
	return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${am ? "AM" : "PM"}`;
}
function hoursSummary(hours) {
	const slot = (d) => d.closed ? "closed" : `${d.open}-${d.close}`;
	const all = DAY_KEYS.map((k) => hours[k] ?? DEFAULT_WEEKLY_HOURS[k]);
	if (all.every((d) => slot(d) === slot(all[0]))) {
		if (all[0].closed) return "Closed";
		return `Open Daily ${formatClock(all[0].open)} – ${formatClock(all[0].close)}`;
	}
	return DAY_KEYS.map((k) => {
		const d = hours[k];
		return d.closed ? `${DAY_SHORT[k]} closed` : `${DAY_SHORT[k]} ${formatClock(d.open)}–${formatClock(d.close)}`;
	}).join(" · ");
}
var WEEKDAY = {
	Sun: "sun",
	Mon: "mon",
	Tue: "tue",
	Wed: "wed",
	Thu: "thu",
	Fri: "fri",
	Sat: "sat"
};
function isOpenNow(hours, at = /* @__PURE__ */ new Date()) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/New_York",
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}).formatToParts(at);
	const wd = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
	const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
	const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
	const key = WEEKDAY[wd] ?? "mon";
	const day = hours[key] ?? DEFAULT_WEEKLY_HOURS[key];
	if (day.closed) return false;
	const now = hour * 60 + minute;
	const [oh, om] = day.open.split(":").map(Number);
	const [ch, cm] = day.close.split(":").map(Number);
	return now >= oh * 60 + om && now < ch * 60 + cm;
}
function etaMinutes(prep, delivery, fulfillment) {
	const p = Math.max(5, Math.round(prep || 25));
	return fulfillment === "delivery" ? p + Math.max(5, Math.round(delivery || 40)) : p;
}
/** First open kitchen slot at least `leadMinutes` from now, on a 15-minute grid. */
function nextOpenSlot(hours, leadMinutes = 15, from = /* @__PURE__ */ new Date()) {
	const start = new Date(from.getTime() + leadMinutes * 60 * 1e3);
	start.setSeconds(0, 0);
	const min = start.getMinutes();
	start.setMinutes(min + (15 - min % 15) % 15);
	for (let i = 0; i < 1344; i += 1) {
		const at = new Date(start.getTime() + i * 15 * 60 * 1e3);
		if (isOpenNow(hours, at)) return at;
	}
	return null;
}
function nyHm(at) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: NY,
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}).formatToParts(at);
	const h = parts.find((p) => p.type === "hour")?.value ?? "12";
	const m = parts.find((p) => p.type === "minute")?.value ?? "00";
	return `${h === "24" ? "00" : h.padStart(2, "0")}:${m}`;
}
var NY = "America/New_York";
function nyYmd(at = /* @__PURE__ */ new Date()) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: NY,
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(at);
}
function formatShopDay(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("en-US", {
		timeZone: NY,
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric"
	});
}
function formatShopWhen(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleString("en-US", {
		timeZone: NY,
		weekday: "short",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit"
	});
}
function formatShopClock(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleTimeString("en-US", {
		timeZone: NY,
		hour: "numeric",
		minute: "2-digit"
	});
}
function zoneParts(at) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: NY,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	}).formatToParts(at);
	const g = (t) => Number(parts.find((p) => p.type === t)?.value ?? 0);
	const hour = g("hour") === 24 ? 0 : g("hour");
	return {
		y: g("year"),
		m: g("month"),
		d: g("day"),
		h: hour,
		min: g("minute")
	};
}
/** Convert an Egg Harbor Township wall-clock date+time to a Date. */
function nyWallToDate(date, time) {
	const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
	const tm = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
	if (!dm || !tm) return null;
	const y = Number(dm[1]);
	const m = Number(dm[2]);
	const d = Number(dm[3]);
	const hh = Math.min(23, Math.max(0, Number(tm[1])));
	const mm = Math.min(59, Math.max(0, Number(tm[2])));
	const utcGuess = Date.UTC(y, m - 1, d, hh, mm);
	const got = zoneParts(new Date(utcGuess));
	const gotMs = Date.UTC(got.y, got.m - 1, got.d, got.h, got.min);
	const wantMs = Date.UTC(y, m - 1, d, hh, mm);
	const at = new Date(utcGuess + (wantMs - gotMs));
	return Number.isNaN(at.getTime()) ? null : at;
}
//#endregion
//#region src/lib/pizza.ts
var DEFAULT_TOPPING_PRICES = {
	SM: 1.5,
	MD: 1.75,
	LG: 2,
	XL: 2.5
};
var PIZZA_TOPPINGS = [
	{
		id: "xcheese",
		name: "Extra cheese"
	},
	{
		id: "pepperoni",
		name: "Pepperoni"
	},
	{
		id: "sausage",
		name: "Sausage"
	},
	{
		id: "beef",
		name: "Beef"
	},
	{
		id: "ham",
		name: "Ham"
	},
	{
		id: "bacon",
		name: "Bacon"
	},
	{
		id: "chicken",
		name: "Chicken"
	},
	{
		id: "mushrooms",
		name: "Mushrooms"
	},
	{
		id: "peppers",
		name: "Green peppers"
	},
	{
		id: "olives",
		name: "Olives"
	},
	{
		id: "onions",
		name: "Onions"
	},
	{
		id: "spinach",
		name: "Spinach"
	},
	{
		id: "broccoli",
		name: "Broccoli"
	},
	{
		id: "tomatoes",
		name: "Tomatoes"
	},
	{
		id: "garlic",
		name: "Garlic"
	},
	{
		id: "pineapple",
		name: "Pineapple"
	},
	{
		id: "jalapenos",
		name: "Jalapenos"
	},
	{
		id: "feta",
		name: "Feta"
	}
];
var TOPPING_BY_ID = new Map(PIZZA_TOPPINGS.map((t) => [t.id, t]));
function money2(n) {
	return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}
function isPizzaSize(label) {
	return label === "SM" || label === "MD" || label === "LG" || label === "XL";
}
function toppingName(id) {
	return TOPPING_BY_ID.get(id)?.name ?? id;
}
function sanitizeToppings(raw) {
	if (!Array.isArray(raw)) return [];
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const row of raw) {
		if (out.length >= 12) break;
		const rec = row && typeof row === "object" ? row : { id: row };
		const id = String(rec.id ?? "").trim();
		if (!id || !TOPPING_BY_ID.has(id) || seen.has(id)) continue;
		const side = rec.side === "left" || rec.side === "right" ? rec.side : "whole";
		seen.add(id);
		out.push({
			id,
			side
		});
	}
	return out;
}
function toppingPricesFrom(settings) {
	return {
		SM: money2(settings.toppingPriceSm || DEFAULT_TOPPING_PRICES.SM),
		MD: money2(settings.toppingPriceMd || DEFAULT_TOPPING_PRICES.MD),
		LG: money2(settings.toppingPriceLg || DEFAULT_TOPPING_PRICES.LG),
		XL: money2(settings.toppingPriceXl || DEFAULT_TOPPING_PRICES.XL)
	};
}
function toppingUnit(size, settings) {
	return toppingPricesFrom(settings)[isPizzaSize(size) ? size : "LG"];
}
function toppingCharge(size, side, settings) {
	const unit = toppingUnit(size, settings);
	return money2(side === "whole" ? unit : unit / 2);
}
function colPrice(col) {
	return money2(moneyNumber(col?.price));
}
function itemSizePrice(item, size, settings) {
	const want = size || item.prices[0]?.label || "";
	const exact = item.prices.find((p) => p.label === want);
	if (exact && colPrice(exact) > 0) return colPrice(exact);
	if (want === "XL") {
		const lg = item.prices.find((p) => p.label === "LG") ?? item.prices[item.prices.length - 1];
		if (lg && colPrice(lg) > 0 && settings.xlPriceAdd > 0) return money2(colPrice(lg) + Math.max(0, settings.xlPriceAdd));
	}
	return colPrice(pizzaSizesFor(item, settings).find((p) => colPrice(p) > 0) ?? item.prices[0]);
}
function pizzaSizesFor(item, _settings) {
	const priced = item.prices.filter((p) => String(p.price ?? "").trim() !== "");
	return priced.length ? priced : item.prices;
}
function pizzaNote(settings, items) {
	const t = toppingPricesFrom(settings);
	const bits = [];
	const seen = /* @__PURE__ */ new Set();
	for (const item of items ?? []) for (const p of pizzaSizesFor(item, settings)) {
		const key = `${p.label ?? ""}|${p.inches ?? ""}`;
		if (seen.has(key)) continue;
		seen.add(key);
		const name = [p.inches, p.label].filter(Boolean).join(" ");
		if (name) bits.push(name);
	}
	return `${bits.length ? bits.join(" · ") : `12" small · 14" medium · 16" large`}. Extra toppings ${[...seen].some((k) => k.startsWith("XL")) ? `${formatUsd(t.SM)} / ${formatUsd(t.MD)} / ${formatUsd(t.LG)} / ${formatUsd(t.XL)}` : `${formatUsd(t.SM)} / ${formatUsd(t.MD)} / ${formatUsd(t.LG)}`} by size. Half toppings are half price.`;
}
function applyPizzaSizing(categories, settings) {
	return categories.map((cat) => {
		if (cat.kind !== "pizza") return cat;
		return {
			...cat,
			note: pizzaNote(settings, cat.items),
			items: cat.items.map((item) => ({
				...item,
				prices: pizzaSizesFor(item, settings)
			}))
		};
	});
}
function shortPizzaName(name) {
	return name.replace(/ Pizza$/i, "").trim() || name;
}
function describeBuild(_itemName, _size, toppings, halfName) {
	const bits = [];
	if (halfName) bits.push(`half ${shortPizzaName(halfName)}`);
	const whole = toppings.filter((t) => t.side === "whole").map((t) => toppingName(t.id));
	const left = toppings.filter((t) => t.side === "left").map((t) => toppingName(t.id));
	const right = toppings.filter((t) => t.side === "right").map((t) => toppingName(t.id));
	if (whole.length) bits.push(`+ ${whole.join(", ")}`);
	if (left.length) bits.push(`left: ${left.join(", ")}`);
	if (right.length) bits.push(`right: ${right.join(", ")}`);
	return bits.join(" · ");
}
function pricePizzaBuild(opts) {
	const size = opts.size || "LG";
	const left = itemSizePrice(opts.item, size, opts.settings);
	const right = opts.other ? itemSizePrice(opts.other, size, opts.settings) : 0;
	const unitPrice = money2(money2(Math.max(left, right)) + opts.toppings.reduce((n, t) => n + toppingCharge(size, t.side, opts.settings), 0));
	const halfName = opts.other && opts.other.name !== opts.item.name ? opts.other.name : void 0;
	return {
		unitPrice,
		detail: describeBuild(opts.item.name, size, opts.toppings, halfName),
		name: halfName ? `${shortPizzaName(opts.item.name)} / ${shortPizzaName(halfName)} Pizza` : opts.item.name,
		halfName
	};
}
//#endregion
//#region src/lib/shop-server.ts
function num(v) {
	return moneyNumber(v);
}
function bool$1(v) {
	return v === true || v === "t" || v === "true";
}
async function seedIfEmpty(sql) {
	if ((await sql`select id from menu_categories limit 1`).length) return;
	const seeded = seedMenu();
	let i = 0;
	for (const cat of seeded.categories) {
		await sql.query(`insert into menu_categories (id, name, note, kind, icon, sort_order)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (id) do nothing`, [
			cat.id,
			cat.name,
			cat.note ?? "",
			cat.kind,
			cat.icon ?? cat.id,
			i
		]);
		let j = 0;
		for (const item of cat.items) {
			await sql.query(`insert into menu_items (id, category_id, name, description, prices, highlight, sort_order, condiments)
         values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8::jsonb)
         on conflict (id) do nothing`, [
				item.id,
				cat.id,
				item.name,
				item.description ?? "",
				JSON.stringify(item.prices),
				Boolean(item.highlight),
				j,
				JSON.stringify(sanitizeCondiments(item.condiments))
			]);
			j += 1;
		}
		i += 1;
	}
	await sql.query(`update shop_settings set restaurant = $1::jsonb, footer = $2 where id = 1`, [JSON.stringify(seeded.restaurant), seeded.footer]);
	const keys = /* @__PURE__ */ new Set();
	const [lat0, lng0] = MAP_CENTER;
	const span = CELL * 8;
	for (let lat = lat0 - span; lat <= lat0 + span; lat += CELL) for (let lng = lng0 - span; lng <= lng0 + span; lng += CELL) keys.add(cellKey(lat, lng));
	await sql.query(`update delivery_zones set cells = $1::jsonb, name = $2 where id = 1`, [JSON.stringify([...keys]), "Egg Harbor Township"]);
}
async function backfillSeedCondiments(sql) {
	if ((await sql`select id from menu_items where jsonb_typeof(condiments) = 'array' and jsonb_array_length(condiments) > 0 limit 1`).length) return;
	const seeded = seedMenu();
	for (const cat of seeded.categories) for (const item of cat.items) {
		const conds = sanitizeCondiments(item.condiments);
		if (!conds.length) continue;
		await sql.query(`update menu_items set condiments = $1::jsonb
         where name = $2 and category_id = $3
         and (condiments is null or condiments = '[]'::jsonb)`, [
			JSON.stringify(conds),
			item.name,
			cat.id
		]);
	}
	bustStorefrontCache();
}
async function ensureWingExtraCondiments(sql) {
	const rows = await sql.query(`select id, condiments from menu_items where lower(name) like '%wing%'`);
	for (const row of rows) {
		const list = sanitizeCondiments(row.condiments);
		let changed = false;
		if (!list.some((c) => c.id === "wing-extra-ranch" || /extra ranch/i.test(c.name))) {
			list.push({
				id: "wing-extra-ranch",
				name: "Extra Ranch",
				price: "1.50",
				extraPrice: "1.50",
				maxQty: "6"
			});
			changed = true;
		}
		if (!list.some((c) => c.id === "wing-extra-blue" || /extra blue/i.test(c.name))) {
			list.push({
				id: "wing-extra-blue",
				name: "Extra Blue cheese",
				price: "1.50",
				extraPrice: "1.50",
				maxQty: "6"
			});
			changed = true;
		}
		if (!changed) continue;
		await sql.query(`update menu_items set condiments = $1::jsonb where id = $2`, [JSON.stringify(list), String(row.id)]);
	}
}
async function seedDemoSalesIfEmpty(sql) {
	if (dbSource !== "pglite") return;
	if ((await sql`select id from orders limit 1`).length) return;
	for (const c of [
		{
			id: "demo-tony",
			name: "Tony Bianchi",
			points: 210,
			phone: "(609) 555-0142"
		},
		{
			id: "demo-lisa",
			name: "Lisa Park",
			points: 88,
			phone: "(609) 555-0198"
		},
		{
			id: "demo-devon",
			name: "Devon Hale",
			points: 132,
			phone: "(609) 555-0117"
		},
		{
			id: "demo-rita",
			name: "Rita Gomez",
			points: 54,
			phone: "(609) 555-0164"
		}
	]) await sql.query(`insert into profiles (user_id, role, display_name, points, phone) values ($1,'customer',$2,$3,$4)
       on conflict (user_id) do nothing`, [
		c.id,
		c.name,
		c.points,
		c.phone
	]);
	const tickets = [
		{
			id: "ord-demo-01",
			userId: "demo-tony",
			daysAgo: 0,
			hour: 12,
			fulfillment: "pickup",
			status: "placed",
			pay: "pay_pickup",
			items: [{
				itemId: "pep-lg",
				categoryId: "pizza",
				name: "Pepperoni Pizza",
				size: "LG",
				unitPrice: 18.75,
				qty: 1
			}, {
				itemId: "sticks",
				categoryId: "appetizers",
				name: "Mozzarella Sticks",
				size: "5 pc",
				unitPrice: 8.5,
				qty: 1
			}],
			notes: "Well done, extra ranch",
			tipPct: 15
		},
		{
			id: "ord-demo-02",
			userId: "demo-lisa",
			daysAgo: 0,
			hour: 17,
			fulfillment: "delivery",
			status: "out_for_delivery",
			pay: "pay_delivery",
			items: [{
				itemId: "buff-pizza",
				categoryId: "gourmet",
				name: "Buffalo Chicken Pizza",
				size: "MD",
				unitPrice: 20.75,
				qty: 1
			}],
			notes: "Leave at the side door. Bell is broken.",
			tipPct: 20
		},
		{
			id: "ord-demo-03",
			userId: "demo-devon",
			daysAgo: 1,
			hour: 13,
			fulfillment: "pickup",
			status: "completed",
			pay: "pay_pickup",
			items: [{
				itemId: "cheese-md",
				categoryId: "pizza",
				name: "Cheese Pizza",
				size: "MD",
				unitPrice: 15.75,
				qty: 1
			}, {
				itemId: "wings",
				categoryId: "wings",
				name: "Fresh Wings",
				size: "10 pc",
				unitPrice: 14,
				qty: 1
			}],
			notes: "No onions on the pie",
			tipPct: 10
		},
		{
			id: "ord-demo-04",
			userId: "demo-rita",
			daysAgo: 2,
			hour: 18,
			fulfillment: "delivery",
			status: "completed",
			pay: "pay_delivery",
			items: [{
				itemId: "steak",
				categoryId: "steak-subs",
				name: "Cheesesteak Sub",
				size: "Half",
				unitPrice: 12.95,
				qty: 2
			}, {
				itemId: "fries",
				categoryId: "sides",
				name: "Buffalo Fries",
				unitPrice: 12.75,
				qty: 1
			}],
			notes: "Extra napkins",
			tipPct: 15
		},
		{
			id: "ord-demo-05",
			userId: "demo-tony",
			daysAgo: 3,
			hour: 19,
			fulfillment: "pickup",
			status: "completed",
			pay: "pay_pickup",
			items: [{
				itemId: "sausage",
				categoryId: "pizza",
				name: "Sausage Pizza",
				size: "LG",
				unitPrice: 18.75,
				qty: 1
			}],
			discount: 5
		},
		{
			id: "ord-demo-06",
			userId: "demo-lisa",
			daysAgo: 4,
			hour: 12,
			fulfillment: "pickup",
			status: "completed",
			pay: "pay_pickup",
			items: [{
				itemId: "tenders",
				categoryId: "appetizers",
				name: "Buffalo Chicken Tenders",
				unitPrice: 14.95,
				qty: 1
			}, {
				itemId: "garlic",
				categoryId: "sides",
				name: "Garlic Bread",
				unitPrice: 5.5,
				qty: 1
			}]
		},
		{
			id: "ord-demo-07",
			userId: "demo-devon",
			daysAgo: 5,
			hour: 16,
			fulfillment: "delivery",
			status: "completed",
			pay: "pay_delivery",
			items: [{
				itemId: "pep-md",
				categoryId: "pizza",
				name: "Pepperoni Pizza",
				size: "MD",
				unitPrice: 17.75,
				qty: 2
			}]
		},
		{
			id: "ord-demo-08",
			userId: "demo-rita",
			daysAgo: 6,
			hour: 11,
			fulfillment: "pickup",
			status: "canceled",
			pay: "pay_pickup",
			items: [{
				itemId: "cheese-sm",
				categoryId: "pizza",
				name: "Cheese Pizza",
				size: "SM",
				unitPrice: 14.75,
				qty: 1
			}]
		},
		{
			id: "ord-demo-09",
			userId: "demo-tony",
			daysAgo: 7,
			hour: 18,
			fulfillment: "delivery",
			status: "completed",
			pay: "pay_card",
			items: [{
				itemId: "buff-sub",
				categoryId: "steak-subs",
				name: "Buffalo Chicken Cheesesteak Sub",
				size: "Half",
				unitPrice: 12.95,
				qty: 1
			}, {
				itemId: "sticks2",
				categoryId: "appetizers",
				name: "Mozzarella Sticks",
				size: "5 pc",
				unitPrice: 8.5,
				qty: 1
			}]
		},
		{
			id: "ord-demo-10",
			userId: "demo-lisa",
			daysAgo: 8,
			hour: 14,
			fulfillment: "pickup",
			status: "completed",
			pay: "pay_pickup",
			items: [{
				itemId: "stromboli",
				categoryId: "turnovers",
				name: "Stromboli",
				size: "LG",
				unitPrice: 18.5,
				qty: 1
			}]
		},
		{
			id: "ord-demo-11",
			userId: "demo-devon",
			daysAgo: 9,
			hour: 19,
			fulfillment: "pickup",
			status: "completed",
			pay: "pay_pickup",
			items: [{
				itemId: "cheese-lg",
				categoryId: "pizza",
				name: "Cheese Pizza",
				size: "LG",
				unitPrice: 16.75,
				qty: 1
			}, {
				itemId: "wings2",
				categoryId: "wings",
				name: "Fresh Wings",
				size: "10 pc",
				unitPrice: 14,
				qty: 1
			}]
		},
		{
			id: "ord-demo-12",
			userId: "demo-tony",
			daysAgo: 11,
			hour: 13,
			fulfillment: "delivery",
			status: "completed",
			pay: "pay_delivery",
			items: [{
				itemId: "buff-pizza2",
				categoryId: "gourmet",
				name: "Buffalo Chicken Pizza",
				size: "LG",
				unitPrice: 22.75,
				qty: 1
			}]
		},
		{
			id: "ord-demo-13",
			userId: "demo-rita",
			daysAgo: 12,
			hour: 17,
			fulfillment: "pickup",
			status: "completed",
			pay: "pay_pickup",
			items: [{
				itemId: "steak2",
				categoryId: "steak-subs",
				name: "Cheesesteak Sub",
				size: "Half",
				unitPrice: 12.95,
				qty: 1
			}, {
				itemId: "nuggets",
				categoryId: "wings",
				name: "Chicken Nuggets with Fries",
				size: "9 pc",
				unitPrice: 14.95,
				qty: 1
			}]
		},
		{
			id: "ord-demo-14",
			userId: "demo-lisa",
			daysAgo: 13,
			hour: 12,
			fulfillment: "pickup",
			status: "awaiting_payment",
			pay: "pay_card",
			items: [{
				itemId: "pep-sm",
				categoryId: "pizza",
				name: "Pepperoni Pizza",
				size: "SM",
				unitPrice: 16.75,
				qty: 1
			}]
		}
	];
	const taxRate = 6.625;
	const fee = 3.5;
	for (const t of tickets) {
		const subtotal = t.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
		const discount = t.discount ?? 0;
		const deliveryFee = t.fulfillment === "delivery" ? fee : 0;
		const { tax, total: preTip } = computeTax(subtotal, discount, deliveryFee, taxRate);
		const tip = t.tipPct ? Math.round(Math.max(0, subtotal - discount) * (t.tipPct / 100) * 100) / 100 : 0;
		const total = Math.round((preTip + tip) * 100) / 100;
		const created = /* @__PURE__ */ new Date();
		created.setDate(created.getDate() - t.daysAgo);
		created.setHours(t.hour, 18, 0, 0);
		await sql.query(`insert into orders (
        id, user_id, status, fulfillment, notes, address_line, city, zip,
        items, subtotal, discount, delivery_fee, tax, tip, total, points_earned, points_spent, payment_method, created_at
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,0,$17,$18
      ) on conflict (id) do nothing`, [
			t.id,
			t.userId,
			t.status,
			t.fulfillment,
			t.notes ?? "",
			t.fulfillment === "delivery" ? "12 English Creek Ave" : "",
			t.fulfillment === "delivery" ? "Egg Harbor Township" : "",
			t.fulfillment === "delivery" ? "08234" : "",
			JSON.stringify(t.items),
			subtotal.toFixed(2),
			discount.toFixed(2),
			deliveryFee.toFixed(2),
			tax.toFixed(2),
			tip.toFixed(2),
			total.toFixed(2),
			Math.round(Math.max(0, subtotal - discount)),
			t.pay,
			created.toISOString()
		]);
	}
}
var shopBoot = globalThis;
var profileLocks = /* @__PURE__ */ new Map();
async function ensureSettingsSchema(sql) {
	if (!shopBoot.__southendSchema__) shopBoot.__southendSchema__ = applySettingsSchema(sql).catch((err) => {
		shopBoot.__southendSchema__ = void 0;
		throw err;
	});
	return shopBoot.__southendSchema__;
}
async function applySettingsSchema(sql) {
	await sql.query(`create table if not exists order_status_audit (
    id text primary key,
    order_id text not null,
    from_status text not null default '',
    to_status text not null,
    actor_id text not null default '',
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists order_status_audit_order_idx on order_status_audit (order_id, created_at desc)`);
	await sql.query(`create table if not exists email_signup_codes (
    id text primary key,
    user_id text not null,
    email text not null,
    code_hash text not null,
    salt text not null,
    expires_at timestamptz not null,
    attempts integer not null default 0,
    consumed_at timestamptz,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists email_signup_codes_user_idx on email_signup_codes (user_id, created_at desc)`);
	await sql.query(`create index if not exists email_signup_codes_email_idx on email_signup_codes (email, created_at desc)`);
	const { ensureStaffAdminLoginColumns } = await import("./staff-credential.server.mjs").then((n) => n.n);
	try {
		await ensureStaffAdminLoginColumns(sql);
	} catch {}
	try {
		await ensureAdminModeColumns(sql);
	} catch {}
	try {
		await sql.query(`alter table profiles add column if not exists avatar_url text not null default ''`);
	} catch {}
	try {
		await ensurePushSchema(sql);
	} catch {}
	const cols = await sql.query(`select table_name, column_name from information_schema.columns
     where (table_name = 'shop_settings' and column_name = 'invitee_bonus')
        or (table_name = 'profiles' and column_name = 'address_line')`);
	const names = new Set(cols.map((r) => `${String(r.table_name)}.${String(r.column_name)}`));
	const hasInvitee = names.has("shop_settings.invitee_bonus");
	const hasAddress = names.has("profiles.address_line");
	if (hasInvitee && hasAddress) return;
	if (!hasAddress) {
		await sql.query(`alter table profiles add column if not exists address_line text not null default ''`);
		await sql.query(`alter table profiles add column if not exists city text not null default ''`);
		await sql.query(`alter table profiles add column if not exists zip text not null default ''`);
	}
	if (hasInvitee) return;
	await sql.query(`alter table shop_settings add column if not exists tax_rate numeric not null default 6.625`);
	await sql.query(`alter table shop_settings add column if not exists prep_minutes integer not null default 25`);
	await sql.query(`alter table shop_settings add column if not exists delivery_minutes integer not null default 40`);
	await sql.query(`alter table shop_settings add column if not exists weekly_hours jsonb not null default '{
  "sun":{"closed":false,"open":"11:00","close":"20:00"},
  "mon":{"closed":false,"open":"11:00","close":"20:00"},
  "tue":{"closed":false,"open":"11:00","close":"20:00"},
  "wed":{"closed":false,"open":"11:00","close":"20:00"},
  "thu":{"closed":false,"open":"11:00","close":"20:00"},
  "fri":{"closed":false,"open":"11:00","close":"20:00"},
  "sat":{"closed":false,"open":"11:00","close":"20:00"}
}'::jsonb`);
	await sql.query(`alter table shop_settings add column if not exists tagline text not null default 'Egg Harbor Township, New Jersey'`);
	await sql.query(`alter table shop_settings add column if not exists show_mark boolean not null default true`);
	await sql.query(`alter table orders add column if not exists tax numeric not null default 0`);
	await sql.query(`alter table shop_settings add column if not exists printers jsonb not null default '[]'::jsonb`);
	await sql.query(`alter table shop_settings add column if not exists receipt_options jsonb not null default '{}'::jsonb`);
	await sql.query(`alter table orders add column if not exists accepted_at timestamptz`);
	await sql.query(`alter table orders add column if not exists tip numeric not null default 0`);
	await sql.query(`create table if not exists chat_threads (
    id text primary key,
    user_id text not null,
    status text not null default 'open',
    last_message text not null default '',
    last_at timestamptz not null default now(),
    unread_admin integer not null default 0,
    unread_customer integer not null default 0,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists chat_threads_user_idx on chat_threads (user_id)`);
	await sql.query(`create index if not exists chat_threads_last_at_idx on chat_threads (last_at desc)`);
	await sql.query(`create table if not exists chat_messages (
    id text primary key,
    thread_id text not null references chat_threads(id) on delete cascade,
    sender_id text not null,
    sender_role text not null,
    body text not null,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists chat_messages_thread_idx on chat_messages (thread_id, created_at)`);
	await sql.query(`alter table chat_threads add column if not exists order_id text`);
	await sql.query(`create index if not exists chat_threads_order_idx on chat_threads (order_id)`);
	await sql.query(`alter table shop_settings add column if not exists xl_enabled boolean not null default false`);
	await sql.query(`alter table shop_settings add column if not exists xl_inches text not null default '18"'`);
	await sql.query(`alter table shop_settings add column if not exists xl_price_add numeric not null default 2`);
	await sql.query(`alter table shop_settings add column if not exists topping_price_sm numeric not null default 1.5`);
	await sql.query(`alter table shop_settings add column if not exists topping_price_md numeric not null default 1.75`);
	await sql.query(`alter table shop_settings add column if not exists topping_price_lg numeric not null default 2`);
	await sql.query(`alter table shop_settings add column if not exists topping_price_xl numeric not null default 2.5`);
	await sql.query(`alter table profiles add column if not exists banned boolean not null default false`);
	await sql.query(`alter table orders add column if not exists pickup_name text not null default ''`);
	await sql.query(`alter table shop_settings add column if not exists backdrop_data text not null default ''`);
	await sql.query(`alter table shop_settings add column if not exists logo_data text not null default ''`);
	await sql.query(`alter table orders add column if not exists scheduled_for timestamptz`);
	await sql.query(`alter table shop_settings add column if not exists notify_audio text not null default ''`);
	await sql.query(`create table if not exists password_reset_codes (
    id text primary key,
    user_id text not null,
    email text not null,
    code_hash text not null,
    salt text not null,
    expires_at timestamptz not null,
    attempts integer not null default 0,
    consumed_at timestamptz,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists password_reset_codes_user_idx on password_reset_codes (user_id, created_at desc)`);
	await sql.query(`alter table chat_threads add column if not exists staff_note text not null default ''`);
	await sql.query(`alter table chat_threads add column if not exists muted boolean not null default false`);
	await sql.query(`alter table chat_threads add column if not exists flagged boolean not null default false`);
	await sql.query(`alter table shop_settings add column if not exists season_effect text not null default 'none'`);
	await sql.query(`alter table orders add column if not exists ticket_no integer`);
	await ensureTicketNumbers(sql);
	try {
		await sql.query(`create unique index if not exists orders_ticket_no_uidx on orders (ticket_no)`);
	} catch {}
	await sql.query(`alter table menu_items add column if not exists image_data text not null default ''`);
	await sql.query(`alter table shop_settings add column if not exists card_text_size text not null default 'md'`);
	await sql.query(`alter table shop_settings add column if not exists card_text_color text not null default 'ink'`);
	await sql.query(`alter table menu_items add column if not exists condiments jsonb not null default '[]'::jsonb`);
	await sql.query(`alter table shop_settings add column if not exists guest_card_required boolean not null default false`);
	await sql.query(`alter table shop_settings add column if not exists admin_totp_required boolean not null default false`);
	await sql.query(`create table if not exists staff_desk_audit (
    id text primary key,
    user_id text not null default '',
    kind text not null,
    diagnostic boolean not null default false,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`alter table shop_settings add column if not exists card_desc_color text not null default 'muted'`);
	await sql.query(`alter table shop_settings add column if not exists card_price_color text not null default 'ink'`);
	await sql.query(`alter table shop_settings add column if not exists card_size text not null default 'md'`);
	await sql.query(`alter table shop_settings add column if not exists card_bg text not null default 'paper'`);
	await sql.query(`alter table menu_items add column if not exists hide_image boolean not null default false`);
	await sql.query(`alter table profiles add column if not exists referral_code text`);
	await sql.query(`alter table profiles add column if not exists referred_by text`);
	try {
		await sql.query(`create unique index if not exists profiles_referral_code_uidx on profiles (referral_code) where referral_code is not null and referral_code <> ''`);
	} catch {}
	await sql.query(`create index if not exists profiles_referred_by_idx on profiles (referred_by)`);
	await sql.query(`alter table shop_settings add column if not exists invite_bonus integer not null default 100`);
	await sql.query(`alter table shop_settings add column if not exists invitee_bonus integer not null default 50`);
	await sql.query(`create table if not exists rewards_ledger (
    id text primary key,
    user_id text not null,
    kind text not null,
    points integer not null,
    note text not null default '',
    order_id text,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists rewards_ledger_user_idx on rewards_ledger (user_id, created_at desc)`);
}
function isMissingAdminModeColumn(err) {
	const msg = err instanceof Error ? err.message : String(err);
	return /admin_mode|desk_grant/i.test(msg);
}
async function applyAdminModeColumns(sql) {
	for (const stmt of [
		`alter table profiles add column if not exists admin_mode boolean not null default false`,
		`alter table profiles add column if not exists admin_mode_allowed boolean not null default false`,
		`alter table profiles add column if not exists desk_grant boolean not null default false`
	]) try {
		await sql.query(stmt);
	} catch {}
	for (const stmt of [
		`alter table profiles alter column role set default 'customer'`,
		`alter table profiles alter column admin_mode set default false`,
		`alter table profiles alter column admin_mode_allowed set default false`
	]) try {
		await sql.query(stmt);
	} catch {}
	try {
		await sql.query(`update profiles set admin_mode_allowed = true, admin_mode = true, desk_grant = true where role = 'admin' and admin_mode_allowed is not true`);
	} catch {}
	try {
		await sql.query(`create table if not exists desk_grant_audit (
      id text primary key,
      actor_id text not null default '',
      target_id text not null default '',
      action text not null default '',
      created_at timestamptz not null default now()
    )`);
	} catch {}
}
async function ensureAdminModeColumns(sql) {
	if (!shopBoot.__adminModeCols__) shopBoot.__adminModeCols__ = applyAdminModeColumns(sql).catch((err) => {
		shopBoot.__adminModeCols__ = void 0;
		throw err;
	});
	return shopBoot.__adminModeCols__;
}
async function applyPushSchema(sql) {
	await sql.query(`create table if not exists push_subscriptions (
    endpoint text primary key,
    user_id text not null default '',
    p256dh text not null default '',
    auth text not null default '',
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id)`);
	try {
		await sql.query(`alter table shop_settings add column if not exists vapid_public text not null default ''`);
		await sql.query(`alter table shop_settings add column if not exists vapid_private text not null default ''`);
	} catch {}
}
async function ensurePushSchema(sql) {
	if (!shopBoot.__pushSchema__) shopBoot.__pushSchema__ = applyPushSchema(sql).catch((err) => {
		shopBoot.__pushSchema__ = void 0;
		throw err;
	});
	return shopBoot.__pushSchema__;
}
function deskOnFrom(row) {
	return bool$1(row?.admin_mode) && bool$1(row?.admin_mode_allowed);
}
async function ensureTicketNumbers(sql) {
	await sql.query(`
    with mx as (select coalesce(max(ticket_no), 0) as m from orders),
    numbered as (
      select id, (select m from mx) + row_number() over (order by created_at asc, id asc) as n
      from orders
      where ticket_no is null
    )
    update orders o set ticket_no = numbered.n from numbered where o.id = numbered.id
  `);
}
async function runShopPatches(sql) {
	await seedIfEmpty(sql);
	await backfillSeedCondiments(sql);
	await ensureWingExtraCondiments(sql);
	await seedDemoSalesIfEmpty(sql);
	if ((await sql.query(`select 1 from orders where ticket_no is null limit 1`)).length) await ensureTicketNumbers(sql);
	if (!(await sql.query(`select 1 from rewards_ledger limit 1`)).length) await backfillRewardsLedger(sql);
}
async function bootShop(sql) {
	await ensureSettingsSchema(sql);
	if (!shopBoot.__southendStaffAdmin__) shopBoot.__southendStaffAdmin__ = ensureStaffAdmin(sql).catch((err) => {
		shopBoot.__southendStaffAdmin__ = void 0;
		console.error("[southend] staff admin seed failed", err);
	});
	await shopBoot.__southendStaffAdmin__;
	if (!shopBoot.__southendBoot__) shopBoot.__southendBoot__ = runShopPatches(sql).catch((err) => {
		shopBoot.__southendBoot__ = void 0;
		console.error("[southend] shop boot failed", err);
	});
	if (shopBoot.__southendHasMenu__) return;
	if ((await sql.query(`select 1 from menu_categories limit 1`)).length) {
		shopBoot.__southendHasMenu__ = true;
		return;
	}
	await shopBoot.__southendBoot__;
	shopBoot.__southendHasMenu__ = (await sql.query(`select 1 from menu_categories limit 1`)).length > 0;
}
async function loadCategories(sql) {
	const cats = await sql`select id, name, note, kind, icon from menu_categories order by sort_order, name`;
	const items = await sql`select id, category_id, name, description, prices, highlight, image_data, condiments, hide_image from menu_items order by sort_order, name`;
	const byCat = /* @__PURE__ */ new Map();
	for (const it of items) {
		const catId = String(it.category_id ?? "");
		const list = byCat.get(catId) ?? [];
		const prices = Array.isArray(it.prices) ? it.prices : JSON.parse(String(it.prices || "[]"));
		list.push({
			id: String(it.id ?? ""),
			name: String(it.name ?? ""),
			description: it.description ? String(it.description) : void 0,
			prices,
			highlight: bool$1(it.highlight),
			image: it.image_data ? String(it.image_data) : void 0,
			hideImage: bool$1(it.hide_image),
			condiments: sanitizeCondiments(it.condiments)
		});
		byCat.set(catId, list);
	}
	return cats.map((c) => {
		const kind = c.kind === "split" || c.kind === "single" ? c.kind : "pizza";
		return {
			id: String(c.id ?? ""),
			name: String(c.name ?? ""),
			note: c.note ? String(c.note) : void 0,
			kind,
			icon: c.icon ? String(c.icon) : void 0,
			items: byCat.get(String(c.id ?? "")) ?? []
		};
	});
}
async function loadSettingsRow(sql) {
	return (await sql`select * from shop_settings where id = 1`)[0] ?? {};
}
function publicSettings(row, hasZones) {
	const weeklyHours = parseWeeklyHours(row.weekly_hours);
	return {
		vacationOn: bool$1(row.vacation_on),
		vacationMessage: String(row.vacation_message ?? ""),
		vacationUntil: String(row.vacation_until ?? ""),
		paymentPlaceholder: String(row.payment_placeholder ?? ""),
		guestCardRequired: false,
		adminTotpRequired: bool$1(row.admin_totp_required),
		pointsPerDollar: num(row.points_per_dollar) || 1,
		redeemRate: Math.max(1, Math.round(num(row.redeem_rate) || 100)),
		welcomeBonus: Math.round(num(row.welcome_bonus)),
		inviteBonus: Math.max(0, Math.round(num(row.invite_bonus) || 100)),
		inviteeBonus: Math.max(0, Math.round(num(row.invitee_bonus) || 50)),
		minOrderDelivery: num(row.min_order_delivery),
		deliveryFee: num(row.delivery_fee),
		hasZones,
		taxRate: row.tax_rate === void 0 || row.tax_rate === null || row.tax_rate === "" ? 6.625 : Math.max(0, num(row.tax_rate)),
		prepMinutes: Math.max(5, Math.round(num(row.prep_minutes) || 25)),
		deliveryMinutes: Math.max(5, Math.round(num(row.delivery_minutes) || 40)),
		tagline: String(row.tagline ?? "Egg Harbor Township, New Jersey"),
		showMark: row.show_mark === void 0 ? true : bool$1(row.show_mark),
		weeklyHours,
		openNow: isOpenNow(weeklyHours),
		hoursSummary: hoursSummary(weeklyHours),
		xlEnabled: bool$1(row.xl_enabled),
		xlInches: String(row.xl_inches || "18\""),
		xlPriceAdd: row.xl_price_add === void 0 || row.xl_price_add === null || row.xl_price_add === "" ? 2 : Math.max(0, num(row.xl_price_add)),
		toppingPriceSm: row.topping_price_sm === void 0 || row.topping_price_sm === null || row.topping_price_sm === "" ? DEFAULT_TOPPING_PRICES.SM : Math.max(0, num(row.topping_price_sm)),
		toppingPriceMd: row.topping_price_md === void 0 || row.topping_price_md === null || row.topping_price_md === "" ? DEFAULT_TOPPING_PRICES.MD : Math.max(0, num(row.topping_price_md)),
		toppingPriceLg: row.topping_price_lg === void 0 || row.topping_price_lg === null || row.topping_price_lg === "" ? DEFAULT_TOPPING_PRICES.LG : Math.max(0, num(row.topping_price_lg)),
		toppingPriceXl: row.topping_price_xl === void 0 || row.topping_price_xl === null || row.topping_price_xl === "" ? DEFAULT_TOPPING_PRICES.XL : Math.max(0, num(row.topping_price_xl)),
		backdropData: sanitizeBackdropData(row.backdrop_data),
		logoData: sanitizeBackdropData(row.logo_data),
		seasonEffect: sanitizeSeasonEffect(row.season_effect),
		cardTextSize: sanitizeCardTextSize(row.card_text_size),
		cardTextColor: sanitizeCardTextColor(row.card_text_color),
		cardDescColor: sanitizeCardTextColor(row.card_desc_color || "muted"),
		cardPriceColor: sanitizeCardTextColor(row.card_price_color || row.card_text_color || "ink"),
		cardSize: sanitizeCardSize(row.card_size),
		cardBg: sanitizeCardBg(row.card_bg || "paper")
	};
}
function sanitizeBackdropData(raw) {
	const s = String(raw ?? "");
	if (!s) return "";
	if (s.length > 36e4) return "";
	if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(s)) return "";
	return s;
}
function sanitizeNotifyAudio(raw) {
	const s = String(raw ?? "");
	if (!s) return "";
	if (s.length > 42e4) return "";
	if (!/^data:audio\/(wav|x-wav|mpeg|mp3|ogg|webm|mp4);base64,/i.test(s)) return "";
	return s;
}
function restaurantFrom(row) {
	const raw = row.restaurant;
	let parsed = raw;
	if (typeof raw === "string") try {
		parsed = JSON.parse(raw || "{}");
	} catch {
		parsed = {};
	}
	const r = parsed && typeof parsed === "object" ? parsed : {};
	const name = String(r.name || RESTAURANT.name);
	return {
		name,
		shortName: name,
		address: String(r.address || RESTAURANT.address),
		city: String(r.city || RESTAURANT.city),
		phone: String(r.phone || RESTAURANT.phone),
		phoneHref: String(r.phoneHref || RESTAURANT.phoneHref),
		hours: String(r.hours || RESTAURANT.hours),
		established: String(r.established || RESTAURANT.established)
	};
}
async function zoneCells(sql) {
	const cells = (await sql`select cells from delivery_zones where id = 1`)[0]?.cells;
	if (Array.isArray(cells)) return cells.map(String);
	if (typeof cells === "string") try {
		const parsed = JSON.parse(cells);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
	return [];
}
async function ledgerId(kind) {
	return `rew-${kind}-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
}
async function addLedger(sql, userId, kind, points, note, orderId, at) {
	if (!points) return;
	await sql.query(`insert into rewards_ledger (id, user_id, kind, points, note, order_id, created_at)
     values ($1,$2,$3,$4,$5,$6,$7)`, [
		await ledgerId(kind),
		userId,
		kind,
		points,
		note,
		orderId ?? null,
		at ?? /* @__PURE__ */ new Date()
	]);
}
function makeReferralCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let body = "";
	for (let i = 0; i < 5; i++) body += alphabet[randomInt(32)];
	return `SE3${body}`;
}
async function ensureReferralCode(sql, userId) {
	const row = await sql`select referral_code from profiles where user_id = ${userId}`;
	const existing = String(row[0]?.referral_code ?? "").trim();
	if (existing) return existing;
	for (let i = 0; i < 8; i++) {
		const code = makeReferralCode();
		try {
			await sql.query(`update profiles set referral_code = $1
         where user_id = $2 and (referral_code is null or referral_code = '')`, [code, userId]);
		} catch {
			continue;
		}
		const check = String((await sql`select referral_code from profiles where user_id = ${userId}`)[0]?.referral_code ?? "");
		if (check) return check;
	}
	return makeReferralCode();
}
async function backfillRewardsLedger(sql) {
	await sql.query(`
    insert into rewards_ledger (id, user_id, kind, points, note, order_id, created_at)
    select 'earn-' || id, user_id, 'earn', points_earned,
           'Order #' || coalesce(lpad(ticket_no::text, 6, '0'), '------'),
           id, created_at
    from orders
    where points_earned > 0
    on conflict (id) do nothing
  `);
	await sql.query(`
    insert into rewards_ledger (id, user_id, kind, points, note, order_id, created_at)
    select 'redeem-' || id, user_id, 'redeem', -points_spent,
           'Redeemed on order #' || coalesce(lpad(ticket_no::text, 6, '0'), '------'),
           id, created_at
    from orders
    where points_spent > 0
    on conflict (id) do nothing
  `);
	await sql.query(`
    insert into rewards_ledger (id, user_id, kind, points, note, created_at)
    select 'welcome-' || p.user_id, p.user_id, 'welcome',
           greatest(0, coalesce((select welcome_bonus from shop_settings where id = 1), 50)),
           'Welcome bonus', p.created_at
    from profiles p
    where not exists (select 1 from rewards_ledger r where r.user_id = p.user_id and r.kind = 'welcome')
    on conflict (id) do nothing
  `);
}
async function ensureStaffAdmin(sql) {
	const { applyStaffCredential, applyStaffTotpFromEnv } = await import("./staff-credential.server.mjs").then((n) => n.n);
	const userId = await applyStaffCredential(sql);
	await ensureProfile(sql, userId, STAFF_ADMIN_NAME);
	await ensureAdminModeColumns(sql);
	try {
		await sql`update profiles set admin_mode_allowed = true, display_name = ${STAFF_ADMIN_NAME} where user_id = ${userId}`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		await sql`update profiles set display_name = ${STAFF_ADMIN_NAME} where user_id = ${userId}`;
	}
	await applyStaffTotpFromEnv(sql, userId);
}
async function ensureProfile(sql, userId, displayName) {
	for (let spin = 0; spin < 4; spin += 1) {
		const inflight = profileLocks.get(userId);
		if (inflight) {
			await inflight.catch(() => void 0);
			if ((await sql`select user_id from profiles where user_id = ${userId} limit 1`).length) return;
			continue;
		}
		const run = ensureProfileRow(sql, userId, displayName).finally(() => {
			profileLocks.delete(userId);
		});
		profileLocks.set(userId, run);
		await run;
		return;
	}
	await ensureProfileRow(sql, userId, displayName);
}
async function ensureProfileRow(sql, userId, displayName) {
	if ((await sql`select user_id from profiles where user_id = ${userId} limit 1`).length) return;
	const settings = await loadSettingsRow(sql);
	const bonus = Math.round(num(settings.welcome_bonus));
	for (let i = 0; i < 6; i++) try {
		if (!(await sql.query(`insert into profiles (user_id, role, display_name, points, referral_code, admin_mode, admin_mode_allowed, desk_grant)
         values ($1,'customer',$2,$3,$4,false,false,false)
         on conflict (user_id) do nothing
         returning user_id`, [
			userId,
			displayName ?? "",
			bonus,
			makeReferralCode()
		])).length) return;
		if (bonus) await addLedger(sql, userId, "welcome", bonus, "Welcome bonus");
		return;
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err ?? "");
		if (/profiles_pkey|duplicate key|unique constraint/i.test(msg)) {
			if ((await sql`select user_id from profiles where user_id = ${userId} limit 1`).length) return;
			continue;
		}
		if (isMissingAdminModeColumn(err)) {
			await ensureAdminModeColumns(sql);
			continue;
		}
		if (i === 5) throw err;
	}
}
async function requireAdmin$1(sql, userId) {
	let on = false;
	try {
		const row = (await sql`select role, admin_mode, admin_mode_allowed from profiles where user_id = ${userId}`)[0];
		if (row && "admin_mode" in row) on = deskOnFrom(row);
		else on = row?.role === "admin";
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		on = (await sql`select role from profiles where user_id = ${userId}`)[0]?.role === "admin";
	}
	if (!on) {
		const err = /* @__PURE__ */ new Error("Forbidden");
		err.status = 403;
		throw err;
	}
}
async function actorCanGrantDesk(sql, userId) {
	let row;
	try {
		row = (await sql`select p.role, p.admin_mode, p.admin_mode_allowed, p.desk_grant, p.display_name, u.email, u.name as user_name
        from profiles p
        left join "user" u on u.id = p.user_id
        where p.user_id = ${userId}`)[0];
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		row = (await sql`select role, display_name from profiles where user_id = ${userId}`)[0];
	}
	if (!row) return false;
	if (row && "admin_mode" in row && !deskOnFrom(row)) return false;
	if (!("admin_mode" in row) && row.role !== "admin") return false;
	if (silverAccountMatch(String(row.email ?? ""), String(row.user_name ?? ""), String(row.display_name ?? ""))) return true;
	return bool$1(row.desk_grant);
}
async function requireDeskGrant(sql, userId) {
	await requireAdmin$1(sql, userId);
	if (await actorCanGrantDesk(sql, userId)) return;
	const err = /* @__PURE__ */ new Error("Only the shop owner can grant Admin mode.");
	err.status = 403;
	throw err;
}
async function profileDeskOn(sql, userId) {
	try {
		const row = (await sql`select admin_mode, admin_mode_allowed, role from profiles where user_id = ${userId}`)[0];
		if (row && "admin_mode" in row) return deskOnFrom(row);
		return row?.role === "admin";
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		return (await sql`select role from profiles where user_id = ${userId}`)[0]?.role === "admin";
	}
}
function silverAccountMatch(email, name, displayName) {
	const local = email.split("@")[0]?.trim().toLowerCase() ?? "";
	const labels = [name, displayName].map((s) => s.trim().toLowerCase());
	const handles = /* @__PURE__ */ new Set([
		"silver",
		"silvergoon",
		"silvergoonist"
	]);
	if (handles.has(local)) return true;
	if (labels.some((n) => handles.has(n))) return true;
	return `${email} ${name} ${displayName}`.toLowerCase().includes("silvergoon");
}
async function assertNotBanned(sql, userId) {
	if (bool$1((await sql`select banned from profiles where user_id = ${userId}`)[0]?.banned)) throw new Error("This account has been restricted. Call the shop if you need help.");
}
function parseOrderItems(raw) {
	let src = raw;
	if (typeof raw === "string") try {
		src = JSON.parse(raw);
	} catch {
		src = [];
	}
	if (!Array.isArray(src)) return [];
	return src.map((it) => {
		const row = it && typeof it === "object" ? it : {};
		return {
			itemId: String(row.itemId ?? ""),
			categoryId: String(row.categoryId ?? ""),
			name: String(row.name ?? ""),
			size: row.size ? String(row.size) : void 0,
			detail: row.detail ? String(row.detail) : void 0,
			comment: row.comment ? String(row.comment).slice(0, 160) : void 0,
			toppings: sanitizeToppings(row.toppings),
			halfItemId: row.halfItemId ? String(row.halfItemId) : void 0,
			condiments: Array.isArray(row.condiments) ? row.condiments.map((c) => {
				const rec = c && typeof c === "object" ? c : {};
				const qty = Math.max(0, Math.round(num(rec.qty)));
				if (qty <= 0) return null;
				return {
					id: String(rec.id ?? ""),
					name: String(rec.name ?? ""),
					qty,
					charge: Math.max(0, num(rec.charge))
				};
			}).filter((p) => p != null && Boolean(p.name)) : void 0,
			unitPrice: num(row.unitPrice),
			qty: Math.max(1, Math.round(num(row.qty)))
		};
	});
}
function toOrder(row) {
	return {
		id: String(row.id),
		ticketNo: Math.round(num(row.ticket_no)),
		userId: String(row.user_id),
		status: String(row.status),
		fulfillment: row.fulfillment === "delivery" ? "delivery" : "pickup",
		notes: String(row.notes ?? ""),
		addressLine: String(row.address_line ?? ""),
		city: String(row.city ?? ""),
		zip: String(row.zip ?? ""),
		items: parseOrderItems(row.items),
		subtotal: num(row.subtotal),
		discount: num(row.discount),
		deliveryFee: num(row.delivery_fee),
		tax: num(row.tax),
		tip: num(row.tip),
		total: num(row.total),
		pointsEarned: Math.round(num(row.points_earned)),
		pointsSpent: Math.round(num(row.points_spent)),
		paymentMethod: String(row.payment_method),
		pickupName: String(row.pickup_name ?? "").trim() || void 0,
		createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
		acceptedAt: row.accepted_at instanceof Date ? row.accepted_at.toISOString() : row.accepted_at ? String(row.accepted_at) : null,
		scheduledFor: row.scheduled_for instanceof Date ? row.scheduled_for.toISOString() : row.scheduled_for ? String(row.scheduled_for) : null
	};
}
var orderAuditReady = false;
async function writeOrderStatusAudit(sql, input) {
	if (input.fromStatus === input.toStatus) return;
	try {
		if (!orderAuditReady) {
			await sql.query(`create table if not exists order_status_audit (
        id text primary key,
        order_id text not null,
        from_status text not null default '',
        to_status text not null,
        actor_id text not null default '',
        created_at timestamptz not null default now()
      )`);
			await sql.query(`create index if not exists order_status_audit_order_idx on order_status_audit (order_id, created_at desc)`);
			orderAuditReady = true;
		}
		await sql.query(`insert into order_status_audit (id, order_id, from_status, to_status, actor_id) values ($1,$2,$3,$4,$5)`, [
			`osa-${randomBytes(8).toString("hex")}`,
			input.orderId,
			input.fromStatus,
			input.toStatus,
			input.actorId
		]);
	} catch (err) {
		console.error("[southend] order status audit", err);
	}
}
var storefrontCache = null;
var STOREFRONT_TTL_MS = 2500;
function bustStorefrontCache() {
	storefrontCache = null;
}
async function loadStorefront() {
	const sql = await getSql();
	await bootShop(sql);
	const cats = await loadCategories(sql);
	const row = await loadSettingsRow(sql);
	const settings = publicSettings(row, (await zoneCells(sql)).length > 0);
	return {
		restaurant: restaurantFrom(row),
		footer: String(row.footer || "Ask about extra toppings, wing sauces, and dressing. Prices may change."),
		categories: applyPizzaSizing(cats, settings),
		settings
	};
}
var getStorefront = createServerFn({ method: "GET" }).handler(async () => {
	if (storefrontCache && Date.now() - storefrontCache.at < STOREFRONT_TTL_MS) return storefrontCache.data;
	const data = await loadStorefront();
	storefrontCache = {
		at: Date.now(),
		data
	};
	return data;
});
var getShopContact = createServerFn({ method: "GET" }).handler(async () => {
	const sql = await getSql();
	await bootShop(sql);
	const restaurant = restaurantFrom(await loadSettingsRow(sql));
	return {
		name: restaurant.name,
		address: `${restaurant.address}, ${restaurant.city}`,
		phone: restaurant.phone,
		phoneHref: restaurant.phoneHref
	};
});
var getMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	let p;
	try {
		p = (await sql`select role, phone, display_name, points, totp_enabled, banned, created_at, referral_code, address_line, city, zip, admin_mode, admin_mode_allowed, desk_grant, avatar_url from profiles where user_id = ${context.userId} limit 1`)[0];
	} catch {
		try {
			p = (await sql`select role, phone, display_name, points, totp_enabled, banned, created_at, referral_code, address_line, city, zip, admin_mode, admin_mode_allowed, desk_grant from profiles where user_id = ${context.userId} limit 1`)[0];
		} catch {
			try {
				p = (await sql`select role, phone, display_name, points, totp_enabled, banned, created_at, referral_code from profiles where user_id = ${context.userId} limit 1`)[0];
			} catch {
				p = void 0;
			}
		}
	}
	if (!p) try {
		await sql.query(`insert into profiles (user_id, role, display_name, points) values ($1,'customer','',0) on conflict (user_id) do nothing`, [context.userId]);
		p = (await sql`select role, phone, display_name, points, totp_enabled, banned, created_at, referral_code from profiles where user_id = ${context.userId} limit 1`)[0];
	} catch {
		p = {
			role: "customer",
			points: 0
		};
	}
	let userRow;
	try {
		userRow = (await sql.query(`select email, name, "emailVerified" as verified from "user" where id = $1 limit 1`, [context.userId]))[0];
	} catch {
		userRow = void 0;
	}
	const hasModeCol = Boolean(p && "admin_mode" in p);
	const silver = silverAccountMatch(String(userRow?.email ?? ""), String(userRow?.name ?? ""), String(p?.display_name ?? ""));
	const adminModeAllowed = hasModeCol ? bool$1(p?.admin_mode_allowed) || silver : p?.role === "admin" || silver;
	const adminMode = hasModeCol ? bool$1(p?.admin_mode) && adminModeAllowed : Boolean(p?.role === "admin" || silver);
	const deskGrant = hasModeCol ? bool$1(p?.desk_grant) || silver : Boolean(p?.role === "admin" || silver);
	if (silver && hasModeCol && (!bool$1(p?.admin_mode_allowed) || !bool$1(p?.desk_grant))) sql`update profiles set role = 'admin', admin_mode = true, admin_mode_allowed = true, desk_grant = true where user_id = ${context.userId}`.catch(() => void 0);
	let unreadChats = 0;
	let adminInbox = 0;
	try {
		unreadChats = Math.round(num((await sql`select coalesce(sum(unread_customer), 0)::int as n from chat_threads where user_id = ${context.userId} and status <> 'solved'`)[0]?.n));
		if (adminMode) adminInbox = Math.round(num((await sql`select count(*)::int as n from chat_threads where unread_admin > 0 and status <> 'solved'`)[0]?.n));
	} catch {}
	return {
		userId: context.userId,
		role: adminMode && adminModeAllowed ? "admin" : "customer",
		phone: String(p?.phone ?? ""),
		displayName: String(p?.display_name ?? ""),
		addressLine: String(p?.address_line ?? ""),
		city: String(p?.city ?? ""),
		zip: String(p?.zip ?? ""),
		points: Math.round(num(p?.points)),
		totpEnabled: bool$1(p?.totp_enabled),
		adminExists: true,
		unreadChats,
		adminInbox,
		banned: bool$1(p?.banned),
		email: String(userRow?.email ?? ""),
		emailVerified: bool$1(userRow?.verified),
		referralCode: String(p?.referral_code ?? ""),
		inviteCount: 0,
		orderCount: 0,
		memberSince: p?.created_at ? String(p.created_at) : "",
		adminMode,
		adminModeAllowed,
		deskGrant,
		avatarUrl: String(p?.avatar_url ?? "")
	};
});
var getMyRewards = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const referralCode = await ensureReferralCode(sql, context.userId);
	const settings = await loadSettingsRow(sql);
	const profile = await sql`select points from profiles where user_id = ${context.userId}`;
	const rows = await sql`
    select id, kind, points, note, order_id, created_at
    from rewards_ledger
    where user_id = ${context.userId}
    order by created_at desc
    limit 80`;
	const invitedRows = await sql`
    select display_name, created_at from profiles
    where referred_by = ${context.userId}
    order by created_at desc
    limit 40`;
	const kinds = /* @__PURE__ */ new Set([
		"welcome",
		"earn",
		"redeem",
		"invite",
		"invitee",
		"adjust"
	]);
	const history = rows.map((r) => ({
		id: String(r.id),
		kind: kinds.has(String(r.kind)) ? String(r.kind) : "adjust",
		points: Math.round(num(r.points)),
		note: String(r.note ?? ""),
		orderId: r.order_id ? String(r.order_id) : void 0,
		createdAt: String(r.created_at ?? "")
	}));
	return {
		points: Math.round(num(profile[0]?.points)),
		referralCode,
		inviteCount: invitedRows.length,
		inviteBonus: Math.max(0, Math.round(num(settings.invite_bonus) || 100)),
		inviteeBonus: Math.max(0, Math.round(num(settings.invitee_bonus) || 50)),
		welcomeBonus: Math.round(num(settings.welcome_bonus)),
		pointsPerDollar: num(settings.points_per_dollar) || 1,
		redeemRate: Math.max(1, Math.round(num(settings.redeem_rate) || 100)),
		history,
		invited: invitedRows.map((r) => ({
			name: String(r.display_name || "Friend").trim() || "Friend",
			at: String(r.created_at ?? "")
		}))
	};
});
var claimReferral = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const code = String(data?.code ?? "").trim().toUpperCase();
	if (!/^[A-Z0-9]{4,16}$/.test(code)) throw new Error("That invite code is not valid.");
	const mine = await sql`select referral_code, referred_by from profiles where user_id = ${context.userId}`;
	if (String(mine[0]?.referred_by ?? "")) return {
		ok: true,
		already: true
	};
	if (String(mine[0]?.referral_code ?? "").toUpperCase() === code) throw new Error("You cannot use your own invite.");
	const inviter = await sql`select user_id, display_name from profiles where referral_code = ${code} limit 1`;
	if (!inviter[0]) throw new Error("That invite code is not valid.");
	const inviterId = String(inviter[0].user_id);
	if (inviterId === context.userId) throw new Error("You cannot use your own invite.");
	const settings = await loadSettingsRow(sql);
	const inviteBonus = Math.max(0, Math.round(num(settings.invite_bonus) || 100));
	const inviteeBonus = Math.max(0, Math.round(num(settings.invitee_bonus) || 50));
	await sql.query(`update profiles set referred_by = $1 where user_id = $2 and (referred_by is null or referred_by = '')`, [inviterId, context.userId]);
	const locked = await sql`select referred_by from profiles where user_id = ${context.userId}`;
	if (String(locked[0]?.referred_by ?? "") !== inviterId) return {
		ok: true,
		already: true
	};
	if (inviteeBonus) {
		await sql.query(`update profiles set points = points + $1 where user_id = $2`, [inviteeBonus, context.userId]);
		await addLedger(sql, context.userId, "invitee", inviteeBonus, "Joined with a friend's invite");
	}
	if (inviteBonus) {
		await sql.query(`update profiles set points = points + $1 where user_id = $2`, [inviteBonus, inviterId]);
		await addLedger(sql, inviterId, "invite", inviteBonus, `${String((await sql`select display_name from profiles where user_id = ${context.userId}`)[0]?.display_name || "A friend").trim() || "A friend"} joined from your invite`);
	}
	return {
		ok: true,
		already: false
	};
});
var updateProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId, data.displayName);
	if (data.displayName !== void 0) await sql`update profiles set display_name = ${data.displayName} where user_id = ${context.userId}`;
	if (data.phone !== void 0) await sql`update profiles set phone = ${data.phone} where user_id = ${context.userId}`;
	if (data.addressLine !== void 0) await sql`update profiles set address_line = ${String(data.addressLine ?? "").replace(/\s+/g, " ").trim().slice(0, 120)} where user_id = ${context.userId}`;
	if (data.city !== void 0) await sql`update profiles set city = ${String(data.city ?? "").replace(/\s+/g, " ").trim().slice(0, 60)} where user_id = ${context.userId}`;
	if (data.zip !== void 0) await sql`update profiles set zip = ${String(data.zip ?? "").toUpperCase().replace(/[^0-9A-Z-]/g, "").slice(0, 10)} where user_id = ${context.userId}`;
	return { ok: true };
});
var setMyAvatar = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	try {
		await sql.query(`alter table profiles add column if not exists avatar_url text not null default ''`);
	} catch {}
	await ensureProfile(sql, context.userId);
	const image = String(data?.image ?? "").trim();
	if (!image) {
		try {
			await sql`update profiles set avatar_url = '' where user_id = ${context.userId}`;
		} catch {}
		return { avatarUrl: "" };
	}
	if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(image)) throw new Error("Choose a JPG, PNG, or WebP photo.");
	if (image.length > 2e5) throw new Error("That photo is too large. Try a smaller crop.");
	try {
		await sql`update profiles set avatar_url = ${image} where user_id = ${context.userId}`;
	} catch {
		throw new Error("Could not save that photo yet. Try again.");
	}
	return { avatarUrl: image };
});
var claimAdmin = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureAdminModeColumns(sql);
	await ensureProfile(sql, context.userId);
	let taken = 0;
	try {
		taken = num((await sql`select count(*)::int as n from profiles where role = 'admin' or admin_mode_allowed is true`)[0]?.n);
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		taken = num((await sql`select count(*)::int as n from profiles where role = 'admin'`)[0]?.n);
	}
	if (taken > 0) throw new Error("A shop admin already exists.");
	try {
		await sql`update profiles set role = 'admin', admin_mode = true, admin_mode_allowed = true, desk_grant = true where user_id = ${context.userId}`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		await sql`update profiles set role = 'admin' where user_id = ${context.userId}`;
	}
	return { ok: true };
});
var setAdminMode = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await ensureAdminModeColumns(sql);
	const on = Boolean(data?.on);
	let row;
	try {
		row = (await sql`select role, admin_mode, admin_mode_allowed, display_name from profiles where user_id = ${context.userId}`)[0];
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		await ensureAdminModeColumns(sql);
		try {
			row = (await sql`select role, admin_mode, admin_mode_allowed, display_name from profiles where user_id = ${context.userId}`)[0];
		} catch {
			row = (await sql`select role, display_name from profiles where user_id = ${context.userId}`)[0];
		}
	}
	if (!row) throw new Error("Account not found.");
	const email = String((await sql.query(`select email, name from "user" where id = $1 limit 1`, [context.userId]))[0]?.email ?? "");
	const name = String((await sql.query(`select name from "user" where id = $1 limit 1`, [context.userId]))[0]?.name ?? "");
	if (!(bool$1(row.admin_mode_allowed) || row.role === "admin" || isStaffAdminAccount(context.userId, email) || silverAccountMatch(email, name, String(row.display_name ?? "")))) {
		const err = /* @__PURE__ */ new Error("Admin mode is not enabled for this account.");
		err.status = 403;
		throw err;
	}
	if (on) try {
		await sql`update profiles set role = 'admin', admin_mode = true, admin_mode_allowed = true where user_id = ${context.userId}`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		await ensureAdminModeColumns(sql);
		await sql`update profiles set role = 'admin', admin_mode = true, admin_mode_allowed = true where user_id = ${context.userId}`;
	}
	else try {
		await sql`update profiles set role = 'customer', admin_mode = false where user_id = ${context.userId}`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		await ensureAdminModeColumns(sql);
		await sql`update profiles set role = 'customer', admin_mode = false where user_id = ${context.userId}`;
	}
	const { writeStaffDeskAudit } = await import("./staff-credential.server.mjs").then((n) => n.n);
	await writeStaffDeskAudit(sql, {
		userId: context.userId,
		kind: on ? "mode-on" : "mode-off",
		diagnostic: false
	});
	return {
		ok: true,
		adminMode: on,
		adminModeAllowed: true,
		role: on ? "admin" : "customer"
	};
});
var getTwoFactorStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	let enabled = false;
	try {
		enabled = bool$1((await sql`select totp_enabled from profiles where user_id = ${context.userId} limit 1`)[0]?.totp_enabled);
	} catch {
		enabled = false;
	}
	if (!enabled) return {
		required: false,
		unlocked: true,
		enabled: false,
		enroll: false,
		locked: false
	};
	const exp = (await sql`select expires_at from two_factor_unlocks where user_id = ${context.userId}`)[0]?.expires_at;
	const unlocked = Boolean(exp && new Date(String(exp)).getTime() > Date.now());
	return {
		required: !unlocked,
		unlocked,
		enabled: true,
		enroll: false,
		locked: true
	};
});
var startTotpSetup = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	const existing = (await sql`select totp_secret, totp_enabled from profiles where user_id = ${context.userId}`)[0];
	if (existing?.totp_secret) {
		const secret = String(existing.totp_secret);
		return {
			secret,
			uri: totpUri(secret, context.userId)
		};
	}
	const minted = generateTotpSecret();
	const written = await sql.query(`update profiles set totp_secret = $1
       where user_id = $2 and (totp_secret is null or totp_secret = '')
       returning totp_secret`, [minted, context.userId]);
	const secret = String(written[0]?.totp_secret ?? (await sql`select totp_secret from profiles where user_id = ${context.userId}`)[0]?.totp_secret ?? "");
	if (!secret) throw new Error("Could not start authenticator setup.");
	return {
		secret,
		uri: totpUri(secret, context.userId)
	};
});
var confirmTotpSetup = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	const secret = String((await sql`select totp_secret from profiles where user_id = ${context.userId}`)[0]?.totp_secret ?? "");
	if (!secret || !verifyTotp(secret, String(data.code || ""))) throw new Error("That code did not match. Try again.");
	await sql`update profiles set totp_enabled = true where user_id = ${context.userId}`;
	await sql.query(`insert into two_factor_unlocks (user_id, expires_at) values ($1, now() + interval '12 hours')
       on conflict (user_id) do update set expires_at = now() + interval '12 hours'`, [context.userId]);
	return { ok: true };
});
var verifyTotpChallenge = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	const rows = await sql`
      select totp_secret, totp_enabled from profiles where user_id = ${context.userId}`;
	if (!bool$1(rows[0]?.totp_enabled) || !rows[0]?.totp_secret) throw new Error("Two-factor is not enabled.");
	if (!verifyTotp(String(rows[0].totp_secret), String(data.code || ""))) throw new Error("That code did not match.");
	await sql.query(`insert into two_factor_unlocks (user_id, expires_at) values ($1, now() + interval '12 hours')
       on conflict (user_id) do update set expires_at = now() + interval '12 hours'`, [context.userId]);
	return { ok: true };
});
var disableTotp = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	const email = String((await sql.query(`select email from "user" where id = $1 limit 1`, [context.userId]))[0]?.email ?? "");
	if (String((await sql`select role from profiles where user_id = ${context.userId}`)[0]?.role ?? "") === "admin" || isStaffAdminAccount(context.userId, email)) {
		if (bool$1((await loadSettingsRow(sql)).admin_totp_required)) throw new Error("Shop admin two-factor is required in Settings.");
	}
	const rows = await sql`select totp_secret from profiles where user_id = ${context.userId}`;
	if (!rows[0]?.totp_secret || !verifyTotp(String(rows[0].totp_secret), String(data.code || ""))) throw new Error("That code did not match.");
	await sql`update profiles set totp_enabled = false, totp_secret = null where user_id = ${context.userId}`;
	await sql`delete from two_factor_unlocks where user_id = ${context.userId}`;
	return { ok: true };
});
async function assertTwoFactor(sql, userId) {
	const profile = (await sql`select totp_enabled, role from profiles where user_id = ${userId}`)[0];
	const email = String((await sql.query(`select email from "user" where id = $1 limit 1`, [userId]))[0]?.email ?? "");
	const shopRequires = (profile?.role === "admin" || isStaffAdminAccount(userId, email)) && bool$1((await loadSettingsRow(sql)).admin_totp_required);
	if (!(bool$1(profile?.totp_enabled) || shopRequires)) return;
	if (!bool$1(profile?.totp_enabled)) throw new Error("Two-factor enrollment required.");
	const exp = (await sql`select expires_at from two_factor_unlocks where user_id = ${userId}`)[0]?.expires_at;
	if (!exp || new Date(String(exp)).getTime() <= Date.now()) throw new Error("Two-factor verification required.");
}
var checkDeliveryAddress = createServerFn({ method: "POST" }).validator((data) => ({ query: data.query.trim() })).handler(async ({ data }) => {
	if (!data.query) throw new Error("Enter a street address.");
	const cells = await zoneCells(await getSql());
	const q = /nj|new jersey|northfield|pleasantville|absecon|linwood|somers point|egg harbor/i.test(data.query) ? data.query : `${data.query}, Egg Harbor Township, NJ`;
	const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
	const res = await fetch(url, { headers: { "User-Agent": "SouthEndPizzaIII/1.0 (delivery-zone)" } });
	if (!res.ok) throw new Error("Address lookup is unavailable right now.");
	const hits = await res.json();
	if (!hits[0]) return {
		found: false,
		deliverable: false,
		label: ""
	};
	const lat = Number(hits[0].lat);
	const lng = Number(hits[0].lon);
	return {
		found: true,
		deliverable: cells.length > 0 && cellSetHas(cells, lat, lng),
		label: hits[0].display_name,
		lat,
		lng,
		mapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
	};
});
async function ensureGuestCustomer(sql, name, phone) {
	const pretty = formatPhone(phone);
	const existing = await sql`select user_id from profiles where phone = ${phone} or phone = ${pretty} limit 1`;
	if (existing[0]?.user_id) {
		const userId = String(existing[0].user_id);
		await assertNotBanned(sql, userId);
		await sql`update profiles set display_name = case when coalesce(display_name, '') = '' then ${name} else display_name end, phone = ${pretty} where user_id = ${userId}`;
		return userId;
	}
	const userId = `guest-${phone}`;
	const email = `${phone}@guest.southend.pizza`;
	const found = (await sql.query(`select id from "user" where email = $1 or id = $2 limit 1`, [email, userId]))[0];
	if (found?.id) {
		const id = String(found.id);
		await ensureProfile(sql, id, name);
		await sql`update profiles set phone = ${pretty}, display_name = case when coalesce(display_name, '') = '' then ${name} else display_name end where user_id = ${id}`;
		await assertNotBanned(sql, id);
		return id;
	}
	await sql.query(`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ($1,$2,$3,false,now(),now())`, [
		userId,
		name,
		email
	]);
	await ensureProfile(sql, userId, name);
	await sql`update profiles set phone = ${pretty}, display_name = ${name} where user_id = ${userId}`;
	return userId;
}
async function writePlacedOrder(sql, userId, data) {
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, userId);
	await assertNotBanned(sql, userId);
	const settings = await loadSettingsRow(sql);
	if (bool$1(settings.vacation_on)) throw new Error(String(settings.vacation_message || "The shop is closed for vacation."));
	if (!data.lines?.length) throw new Error("Your cart is empty.");
	if (data.fulfillment === "pickup" && data.paymentMethod === "pay_delivery") throw new Error("Choose pay at pickup.");
	if (data.fulfillment === "delivery" && data.paymentMethod === "pay_pickup") throw new Error("Choose cash.");
	if (String(data.paymentMethod) === "pay_card") throw new Error("Card payments are not live yet. Pay at pickup or with cash.");
	const pickupName = String(data.pickupName ?? "").trim().slice(0, 80);
	if (data.fulfillment === "pickup" && !pickupName) throw new Error("Enter the name for pickup.");
	const menuItems = await sql`select id, category_id, name, prices, condiments from menu_items`;
	const byId = new Map(menuItems.map((m) => [String(m.id), m]));
	const cats = await loadCategories(sql);
	const kindByCat = new Map(cats.map((c) => [c.id, c.kind]));
	const pub = publicSettings(settings, false);
	const priced = [];
	for (const line of data.lines) {
		const item = byId.get(String(line.itemId ?? ""));
		if (!item) throw new Error("A menu item is no longer available.");
		const prices = Array.isArray(item.prices) ? item.prices : JSON.parse(String(item.prices || "[]"));
		const wantSize = line.size ? String(line.size) : "";
		const col = wantSize && prices.find((p) => p.label === wantSize) || prices[0];
		const qty = Math.max(1, Math.min(20, Math.round(num(line.qty))));
		const kind = kindByCat.get(String(item.category_id ?? ""));
		const comment = String(line.comment ?? "").trim().slice(0, 160) || void 0;
		const catalogItem = {
			id: String(item.id ?? ""),
			name: String(item.name ?? ""),
			prices
		};
		const catMeta = cats.find((c) => c.id === String(item.category_id ?? ""));
		if (catMeta && isWingsBuild(catMeta, catalogItem)) {
			const catalog = sanitizeCondiments(item.condiments);
			const built = sanitizeWingPicks(line.condiments, catalog);
			if (!built) throw new Error("Pick a sauce and included dips for wings.");
			const pieceQty = parseWingQty(wantSize) || parseWingQty(col?.label) || 10;
			const baseCol = prices.find((p) => parseWingQty(p.label) === 10) ?? prices.find((p) => p.price) ?? col;
			const bags = pieceQty / 10;
			priced.push({
				itemId: String(item.id ?? ""),
				categoryId: String(item.category_id ?? ""),
				name: String(item.name ?? ""),
				size: `${pieceQty} pc`,
				detail: built.detail,
				comment,
				condiments: built.condiments,
				unitPrice: Math.round((num(baseCol?.price) * bags + built.extras) * 100) / 100,
				qty
			});
			continue;
		}
		const catalog = sanitizeCondiments(item.condiments);
		const condiments = sanitizeCondimentPicks(line.condiments, catalog);
		const extra = condimentTotal(condiments);
		const extrasDetail = condimentDetail(condiments);
		if (kind === "pizza") {
			const toppings = sanitizeToppings(line.toppings);
			const halfId = String(line.halfItemId ?? "");
			const otherRow = halfId && halfId !== String(item.id) ? byId.get(halfId) : void 0;
			let other = null;
			if (otherRow) {
				const otherPrices = Array.isArray(otherRow.prices) ? otherRow.prices : JSON.parse(String(otherRow.prices || "[]"));
				other = {
					name: String(otherRow.name ?? ""),
					prices: otherPrices
				};
			}
			const built = pricePizzaBuild({
				item: {
					name: String(item.name ?? ""),
					prices
				},
				other,
				size: wantSize || String(col?.label || "LG"),
				toppings,
				settings: pub
			});
			priced.push({
				itemId: String(item.id ?? ""),
				categoryId: String(item.category_id ?? ""),
				name: built.name,
				size: wantSize || (col?.label ? String(col.label) : void 0),
				detail: mergeItemDetail(built.detail, extrasDetail) || void 0,
				comment,
				toppings,
				halfItemId: halfId || void 0,
				condiments: condiments.length ? condiments : void 0,
				unitPrice: Math.round((built.unitPrice + extra) * 100) / 100,
				qty
			});
		} else priced.push({
			itemId: String(item.id ?? ""),
			categoryId: String(item.category_id ?? ""),
			name: String(item.name ?? ""),
			size: col?.label ? String(col.label) : wantSize || void 0,
			detail: extrasDetail || void 0,
			comment,
			condiments: condiments.length ? condiments : void 0,
			unitPrice: Math.round((num(col?.price) + extra) * 100) / 100,
			qty
		});
	}
	const subtotal = priced.reduce((s, l) => s + l.unitPrice * l.qty, 0);
	const profile = await sql`select points from profiles where user_id = ${userId}`;
	const points = Math.round(num(profile[0]?.points));
	const redeemRate = Math.max(1, Math.round(num(settings.redeem_rate) || 100));
	const want = Math.max(0, Math.round(num(data.redeemPoints)));
	const maxByPoints = Math.floor(points / redeemRate) * redeemRate;
	const maxBySub = Math.floor(subtotal * redeemRate);
	const spent = Math.min(want, maxByPoints, maxBySub);
	const discount = spent / redeemRate;
	const lat = data.lat;
	const lng = data.lng;
	const deliveryFee = data.fulfillment === "delivery" ? num(settings.delivery_fee) : 0;
	if (data.fulfillment === "delivery") {
		const min = num(settings.min_order_delivery);
		if (subtotal < min) throw new Error(`Delivery minimum is $${min.toFixed(2)}.`);
		const cells = await zoneCells(sql);
		if (!cells.length) throw new Error("Delivery zones are not set yet. Please choose pickup.");
		if (lat == null || lng == null) throw new Error("Check the delivery address first.");
		if (!cellSetHas(cells, Number(lat), Number(lng))) throw new Error("That address is outside our delivery zone.");
	}
	const weeklyHours = parseWeeklyHours(settings.weekly_hours);
	const scheduledDate = String(data.scheduledDate ?? "").trim();
	const scheduledTime = String(data.scheduledTime ?? "").trim();
	let scheduledAt = null;
	if (scheduledDate || scheduledTime) {
		if (!scheduledDate || !scheduledTime) throw new Error("Pick both a date and a time to schedule.");
		scheduledAt = nyWallToDate(scheduledDate, scheduledTime);
		if (!scheduledAt) throw new Error("Pick a valid pickup or delivery time.");
		const min = Date.now() + 9e5;
		const max = Date.now() + 12096e5;
		if (scheduledAt.getTime() < min) throw new Error("Pick a time at least 15 minutes from now.");
		if (scheduledAt.getTime() > max) throw new Error("Schedule within the next 14 days.");
		if (!isOpenNow(weeklyHours, scheduledAt)) throw new Error(`The kitchen is closed at that time. ${hoursSummary(weeklyHours)}`);
	} else if (!bool$1(settings.vacation_on) && !isOpenNow(weeklyHours)) throw new Error(`The kitchen is closed. ${hoursSummary(weeklyHours)}`);
	const { tax, total: preTip } = computeTax(subtotal, discount, deliveryFee, settings.tax_rate === void 0 || settings.tax_rate === null || settings.tax_rate === "" ? 6.625 : Math.max(0, num(settings.tax_rate)));
	const tip = clampTip(data.tip);
	const total = Math.round((preTip + tip) * 100) / 100;
	const earnRate = num(settings.points_per_dollar) || 1;
	const earned = Math.max(0, Math.round(Math.max(0, subtotal - discount) * earnRate));
	const id = `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
	const ticketNo = Math.max(1, Math.round(num((await sql`select coalesce(max(ticket_no), 0) + 1 as n from orders`)[0]?.n)));
	await sql.query(`insert into orders (
        id, ticket_no, user_id, status, fulfillment, notes, address_line, city, zip, lat, lng,
        items, subtotal, discount, delivery_fee, tax, tip, total, points_earned, points_spent, payment_method, pickup_name, scheduled_for
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
      )`, [
		id,
		ticketNo,
		userId,
		data.paymentMethod === "pay_card" ? "awaiting_payment" : "placed",
		data.fulfillment,
		data.notes?.slice(0, 500) ?? "",
		data.addressLine ?? "",
		data.city ?? "",
		data.zip ?? "",
		lat ?? null,
		lng ?? null,
		JSON.stringify(priced),
		subtotal.toFixed(2),
		discount.toFixed(2),
		deliveryFee.toFixed(2),
		tax.toFixed(2),
		tip.toFixed(2),
		total.toFixed(2),
		earned,
		spent,
		data.paymentMethod,
		data.fulfillment === "pickup" ? pickupName : "",
		scheduledAt
	]);
	await sql.query(`update profiles set points = points - $1 + $2 where user_id = $3`, [
		spent,
		earned,
		userId
	]);
	if (earned) await addLedger(sql, userId, "earn", earned, `Order #${String(ticketNo).padStart(6, "0")}`, id);
	if (spent) await addLedger(sql, userId, "redeem", -spent, `Redeemed on order #${String(ticketNo).padStart(6, "0")}`, id);
	return {
		id,
		ticketNo,
		total,
		earned,
		spent,
		status: data.paymentMethod === "pay_card" ? "awaiting_payment" : "placed"
	};
}
var placeOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await assertTwoFactor(sql, context.userId);
	return writePlacedOrder(sql, context.userId, data);
});
var placeGuestOrder = createServerFn({ method: "POST" }).validator((data) => data).handler(async ({ data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	const name = String(data.guestName ?? "").trim().slice(0, 80);
	const phone = toTenDigitPhone(String(data.guestPhone ?? ""));
	if (!name) throw new Error("Enter your name.");
	if (!phone) throw new Error("Enter a 10-digit US phone number.");
	const userId = await ensureGuestCustomer(sql, name, phone);
	const pickupName = String(data.pickupName ?? "").trim().slice(0, 80) || name;
	return writePlacedOrder(sql, userId, {
		...data,
		redeemPoints: 0,
		pickupName
	});
});
var listMyOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	const mine = await sql`select * from orders where user_id = ${context.userId} order by created_at desc limit 50`;
	if (mine.length) return mine.map(toOrder);
	let phone = "";
	try {
		phone = String((await sql`select phone from profiles where user_id = ${context.userId} limit 1`)[0]?.phone ?? "").replace(/\D/g, "");
	} catch {
		phone = "";
	}
	if (phone.length < 10) return [];
	return (await sql`select * from orders where user_id = ${`guest-${phone}`} order by created_at desc limit 50`).map(toOrder);
});
var saveShopMenu = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	await sql`delete from menu_items`;
	await sql`delete from menu_categories`;
	let i = 0;
	for (const cat of data.categories) {
		await sql.query(`insert into menu_categories (id, name, note, kind, icon, sort_order) values ($1,$2,$3,$4,$5,$6)`, [
			cat.id,
			cat.name,
			cat.note ?? "",
			cat.kind,
			cat.icon ?? cat.id,
			i
		]);
		let j = 0;
		for (const item of cat.items) {
			await sql.query(`insert into menu_items (id, category_id, name, description, prices, highlight, sort_order, image_data, condiments, hide_image)
           values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9::jsonb,$10)`, [
				item.id ?? `${cat.id}-${j}`,
				cat.id,
				item.name,
				item.description ?? "",
				JSON.stringify(item.prices),
				Boolean(item.highlight),
				j,
				typeof item.image === "string" && item.image.startsWith("data:image/") && item.image.length <= 42e4 ? item.image : "",
				JSON.stringify(sanitizeCondiments(item.condiments)),
				Boolean(item.hideImage)
			]);
			j += 1;
		}
		i += 1;
	}
	const restaurant = restaurantFrom({ restaurant: data.restaurant });
	await sql.query(`update shop_settings set restaurant = $1::jsonb, footer = $2 where id = 1`, [JSON.stringify(restaurant), data.footer]);
	bustStorefrontCache();
	return { ok: true };
});
var saveShopSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const sets = [];
	const params = [];
	const add = (col, val) => {
		if (val === void 0) return;
		params.push(val);
		sets.push(`${col} = $${params.length}`);
	};
	add("vacation_on", data.vacationOn);
	add("vacation_message", data.vacationMessage);
	add("vacation_until", data.vacationUntil);
	add("payment_placeholder", data.paymentPlaceholder);
	add("guest_card_required", false);
	add("admin_totp_required", data.adminTotpRequired);
	add("points_per_dollar", data.pointsPerDollar);
	add("redeem_rate", data.redeemRate === void 0 ? void 0 : Math.round(data.redeemRate));
	add("welcome_bonus", data.welcomeBonus === void 0 ? void 0 : Math.round(data.welcomeBonus));
	add("invite_bonus", data.inviteBonus === void 0 ? void 0 : Math.max(0, Math.round(data.inviteBonus)));
	add("invitee_bonus", data.inviteeBonus === void 0 ? void 0 : Math.max(0, Math.round(data.inviteeBonus)));
	add("min_order_delivery", data.minOrderDelivery);
	add("delivery_fee", data.deliveryFee);
	add("tax_rate", data.taxRate === void 0 ? void 0 : Math.max(0, Math.min(25, Number(data.taxRate))));
	add("prep_minutes", data.prepMinutes === void 0 ? void 0 : Math.max(5, Math.round(data.prepMinutes)));
	add("delivery_minutes", data.deliveryMinutes === void 0 ? void 0 : Math.max(5, Math.round(data.deliveryMinutes)));
	add("tagline", data.tagline);
	add("show_mark", data.showMark);
	add("xl_enabled", data.xlEnabled);
	add("xl_inches", data.xlInches === void 0 ? void 0 : String(data.xlInches).slice(0, 12));
	add("xl_price_add", data.xlPriceAdd === void 0 ? void 0 : Math.max(0, Math.min(40, Number(data.xlPriceAdd))));
	add("topping_price_sm", data.toppingPriceSm === void 0 ? void 0 : Math.max(0, Math.min(20, Number(data.toppingPriceSm))));
	add("topping_price_md", data.toppingPriceMd === void 0 ? void 0 : Math.max(0, Math.min(20, Number(data.toppingPriceMd))));
	add("topping_price_lg", data.toppingPriceLg === void 0 ? void 0 : Math.max(0, Math.min(20, Number(data.toppingPriceLg))));
	add("topping_price_xl", data.toppingPriceXl === void 0 ? void 0 : Math.max(0, Math.min(20, Number(data.toppingPriceXl))));
	if (data.backdropData !== void 0) {
		const raw = String(data.backdropData ?? "").trim();
		if (!raw) add("backdrop_data", "");
		else {
			const clean = sanitizeBackdropData(raw);
			if (!clean) throw new Error("Use a PNG, JPEG, WebP, or GIF under 300 KB.");
			add("backdrop_data", clean);
		}
	}
	if (data.logoData !== void 0) {
		const raw = String(data.logoData ?? "").trim();
		if (!raw) add("logo_data", "");
		else {
			const clean = sanitizeBackdropData(raw);
			if (!clean) throw new Error("Use a PNG, JPEG, WebP, or GIF under 300 KB.");
			add("logo_data", clean);
		}
	}
	if (data.notifyAudio !== void 0) {
		const raw = String(data.notifyAudio ?? "").trim();
		if (!raw) add("notify_audio", "");
		else {
			const clean = sanitizeNotifyAudio(raw);
			if (!clean) throw new Error("Use a WAV, MP3, or OGG under 300 KB.");
			add("notify_audio", clean);
		}
	}
	if (data.seasonEffect !== void 0) add("season_effect", sanitizeSeasonEffect(data.seasonEffect));
	if (data.cardTextSize !== void 0) add("card_text_size", sanitizeCardTextSize(data.cardTextSize));
	if (data.cardTextColor !== void 0) add("card_text_color", sanitizeCardTextColor(data.cardTextColor));
	if (data.cardDescColor !== void 0) add("card_desc_color", sanitizeCardTextColor(data.cardDescColor));
	if (data.cardPriceColor !== void 0) add("card_price_color", sanitizeCardTextColor(data.cardPriceColor));
	if (data.cardSize !== void 0) add("card_size", sanitizeCardSize(data.cardSize));
	if (data.cardBg !== void 0) add("card_bg", sanitizeCardBg(data.cardBg));
	if (data.printers) {
		params.push(JSON.stringify(parsePrinters(data.printers)));
		sets.push(`printers = $${params.length}::jsonb`);
	}
	if (data.receiptOptions) {
		params.push(JSON.stringify(parseReceiptOptions(data.receiptOptions)));
		sets.push(`receipt_options = $${params.length}::jsonb`);
	}
	if (data.weeklyHours) {
		const hours = parseWeeklyHours(data.weeklyHours);
		params.push(JSON.stringify(hours));
		sets.push(`weekly_hours = $${params.length}::jsonb`);
		const restaurant = restaurantFrom(await loadSettingsRow(sql));
		restaurant.hours = hoursSummary(hours);
		params.push(JSON.stringify(restaurant));
		sets.push(`restaurant = $${params.length}::jsonb`);
	}
	if (!sets.length) return { ok: true };
	await sql.query(`update shop_settings set ${sets.join(", ")} where id = 1`, params);
	bustStorefrontCache();
	return { ok: true };
});
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const on = Boolean(data?.on);
	const { applyStaffCredential, diagnosticDeskAuthStatus, writeStaffDeskAudit, ensureStaffAdminLoginColumns } = await import("./staff-credential.server.mjs").then((n) => n.n);
	await ensureStaffAdminLoginColumns(sql);
	try {
		await sql.query(`update shop_settings set staff_admin_login_enabled = $1, diagnostic_desk_auth = $1, staff_admin_login_touched = true where id = 1`, [on]);
	} catch {
		await ensureStaffAdminLoginColumns(sql);
		await sql.query(`update shop_settings set staff_admin_login_enabled = $1, diagnostic_desk_auth = $1, staff_admin_login_touched = true where id = 1`, [on]);
	}
	await applyStaffCredential(sql);
	const status = await diagnosticDeskAuthStatus(sql);
	await writeStaffDeskAudit(sql, {
		userId: context.userId,
		kind: on ? "toggle-on" : "toggle-off",
		diagnostic: status.diagnosticDeskAuth
	});
	return status;
});
var noteStaffDeskLogin = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	const { diagnosticDeskEnabled, writeStaffDeskAudit } = await import("./staff-credential.server.mjs").then((n) => n.n);
	if (!isStaffAdminAccount(context.userId)) return {
		ok: true,
		diagnostic: false
	};
	const diagnostic = await diagnosticDeskEnabled(sql);
	if (diagnostic) await writeStaffDeskAudit(sql, {
		userId: context.userId,
		kind: "login",
		diagnostic: true
	});
	return {
		ok: true,
		diagnostic
	};
});
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const restaurant = restaurantFrom({ restaurant: data.restaurant });
	await sql.query(`update shop_settings set restaurant = $1::jsonb, footer = $2, tagline = $3, show_mark = $4 where id = 1`, [
		JSON.stringify(restaurant),
		data.footer,
		data.tagline,
		data.showMark
	]);
	bustStorefrontCache();
	return { ok: true };
});
async function loadOrCreateVapid(sql) {
	await ensurePushSchema(sql);
	const row = (await sql`select vapid_public, vapid_private from shop_settings limit 1`)[0];
	if (row?.vapid_public && row?.vapid_private) return {
		publicKey: String(row.vapid_public),
		privateKey: String(row.vapid_private)
	};
	const keys = (await import("../_libs/web-push.mjs").then((n) => /* @__PURE__ */ __toESM(n.t(), 1))).generateVAPIDKeys();
	try {
		await sql`update shop_settings set vapid_public = ${keys.publicKey}, vapid_private = ${keys.privateKey}`;
	} catch {}
	return keys;
}
async function notifyOrderPush(sql, order, status) {
	await ensurePushSchema(sql);
	const userId = String(order.userId ?? "");
	if (!userId) return;
	const subs = await sql`select endpoint, p256dh, auth from push_subscriptions where user_id = ${userId}`;
	if (!subs.length) return;
	let keys;
	try {
		keys = await loadOrCreateVapid(sql);
	} catch {
		return;
	}
	const ticket = `#${String(order.ticketNo || 0).padStart(6, "0")}`;
	const body = status === "out_for_delivery" ? `Ticket ${ticket} is out for delivery.` : status === "accepted" ? `Ticket ${ticket} is in the kitchen.` : `Ticket ${ticket} is ready.`;
	const payload = JSON.stringify({
		title: "South End Pizza",
		body,
		url: "/account"
	});
	try {
		const webpush = await import("../_libs/web-push.mjs").then((n) => /* @__PURE__ */ __toESM(n.t(), 1));
		webpush.setVapidDetails("mailto:hello@southendpizza.app", keys.publicKey, keys.privateKey);
		await Promise.all(subs.map((row) => webpush.sendNotification({
			endpoint: String(row.endpoint),
			keys: {
				p256dh: String(row.p256dh),
				auth: String(row.auth)
			}
		}, payload).catch(async (err) => {
			if (err?.statusCode === 404 || err?.statusCode === 410) await sql`delete from push_subscriptions where endpoint = ${String(row.endpoint)}`;
		})));
	} catch {}
}
var getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
	const sql = await getSql();
	try {
		return { publicKey: (await loadOrCreateVapid(sql)).publicKey };
	} catch {
		return { publicKey: "" };
	}
});
var savePushSubscription = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensurePushSchema(sql);
	const endpoint = String(data?.subscription?.endpoint ?? "").trim();
	const p256dh = String(data?.subscription?.keys?.p256dh ?? "").trim();
	const auth = String(data?.subscription?.keys?.auth ?? "").trim();
	if (!endpoint || !p256dh || !auth) throw new Error("That device could not subscribe to alerts.");
	await sql.query(`insert into push_subscriptions (endpoint, user_id, p256dh, auth)
       values ($1, $2, $3, $4)
       on conflict (endpoint) do update set user_id = $2, p256dh = $3, auth = $4`, [
		endpoint,
		context.userId,
		p256dh,
		auth
	]);
	return { ok: true };
});
var getAdminShop = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await bootShop(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const row = await loadSettingsRow(sql);
	const cells = await zoneCells(sql);
	const categories = await loadCategories(sql);
	const desk = await (await import("./staff-credential.server.mjs").then((n) => n.n)).diagnosticDeskAuthStatus(sql);
	return {
		restaurant: restaurantFrom(row),
		footer: String(row.footer || "Ask about extra toppings, wing sauces, and dressing. Prices may change."),
		categories,
		settings: publicSettings(row, cells.length > 0),
		printers: parsePrinters(row.printers),
		receiptOptions: parseReceiptOptions(row.receipt_options),
		cells,
		notifyAudio: sanitizeNotifyAudio(row.notify_audio),
		diagnosticDeskAuth: desk.diagnosticDeskAuth,
		staffAdminLoginEnabled: desk.staffAdminLoginEnabled,
		staffSecretConfigured: desk.staffSecretConfigured,
		prodLikeHost: isVercelProduction()
	};
});
var saveDeliveryZone = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	await sql.query(`update delivery_zones set cells = $1::jsonb, name = $2, updated_at = now(), updated_by = $3 where id = 1`, [
		JSON.stringify(data.cells),
		data.name ?? "Delivery area",
		context.userId
	]);
	bustStorefrontCache();
	return {
		ok: true,
		count: data.cells.length
	};
});
var listAllOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	return (await sql`select * from orders order by created_at desc limit 200`).map(toOrder);
});
var updateOrderStatus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	if (!(/* @__PURE__ */ new Set([
		"placed",
		"accepted",
		"awaiting_payment",
		"preparing",
		"out_for_delivery",
		"ready",
		"completed",
		"canceled"
	])).has(data.status)) throw new Error("Invalid status.");
	const id = String(data?.id ?? "").trim();
	if (!id) throw new Error("Ticket is missing.");
	const next = String(data.status);
	const existing = await sql.query(`select * from orders where id = $1`, [id]);
	if (!existing[0]) throw new Error("Order not found.");
	const current = String(existing[0].status ?? "");
	if (next === "completed" && current === "completed") return {
		ok: true,
		order: toOrder(existing[0])
	};
	if (next === "preparing" || next === "accepted") await sql.query(`update orders set status = $1, accepted_at = coalesce(accepted_at, now()) where id = $2`, [next, id]);
	else await sql`update orders set status = ${next} where id = ${id}`;
	await writeOrderStatusAudit(sql, {
		orderId: id,
		fromStatus: current,
		toStatus: next,
		actorId: context.userId
	});
	const rows = await sql`select * from orders where id = ${id}`;
	const order = rows[0] ? toOrder(rows[0]) : null;
	if (order && (next === "ready" || next === "out_for_delivery" || next === "accepted")) notifyOrderPush(sql, order, next).catch(() => void 0);
	return {
		ok: true,
		order
	};
});
var acceptOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const id = String(data?.id ?? "").trim();
	if (!id) throw new Error("Ticket is missing.");
	const prior = await sql.query(`select status from orders where id = $1`, [id]);
	const taken = await sql.query(`update orders
     set status = 'accepted', accepted_at = coalesce(accepted_at, now())
     where id = $1 and status in ('placed', 'awaiting_payment')
     returning *`, [id]);
	if (taken[0]) {
		await writeOrderStatusAudit(sql, {
			orderId: id,
			fromStatus: String(prior[0]?.status ?? "placed"),
			toStatus: "accepted",
			actorId: context.userId
		});
		const order = toOrder(taken[0]);
		notifyOrderPush(sql, order, "accepted").catch(() => void 0);
		return order;
	}
	const rows = await sql`select * from orders where id = ${id}`;
	if (!rows[0]) throw new Error("Order not found.");
	const current = String(rows[0].status);
	if (current === "accepted" || current === "preparing" || current === "ready" || current === "out_for_delivery") return toOrder(rows[0]);
	throw new Error("That ticket cannot be accepted.");
});
var getAdminInsights = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await bootShop(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const paid = `status not in ('canceled', 'awaiting_payment')`;
	const nyStart = `((current_timestamp at time zone 'America/New_York')::date at time zone 'America/New_York')`;
	const totals = (await sql.query(`select
        coalesce(sum(total) filter (where ${paid}), 0)::text as collected,
        coalesce(sum(total) filter (where status = 'awaiting_payment'), 0)::text as outstanding,
        coalesce(sum(subtotal) filter (where ${paid}), 0)::text as food,
        coalesce(sum(tax) filter (where ${paid}), 0)::text as tax,
        coalesce(sum(discount) filter (where ${paid}), 0)::text as discounts,
        coalesce(sum(delivery_fee) filter (where ${paid}), 0)::text as fees,
        coalesce(sum(tip) filter (where ${paid}), 0)::text as tips,
        coalesce(sum(total) filter (where ${paid} and fulfillment = 'pickup'), 0)::text as pickup,
        coalesce(sum(total) filter (where ${paid} and fulfillment = 'delivery'), 0)::text as delivery,
        coalesce(sum(total) filter (where ${paid} and created_at >= ${nyStart}), 0)::text as today,
        coalesce(sum(total) filter (where ${paid} and created_at >= ${nyStart} - interval '7 days'), 0)::text as week,
        coalesce(sum(total) filter (where ${paid} and created_at >= ${nyStart} - interval '30 days'), 0)::text as month,
        count(*) filter (where ${paid})::int as tickets,
        count(*) filter (where status = 'canceled')::int as canceled
       from orders`))[0];
	const payRows = await sql.query(`select payment_method as method, coalesce(sum(total), 0)::text as total, count(*)::int as count
     from orders where ${paid} group by payment_method`);
	const spendRows = await sql.query(`select user_id, count(*)::int as orders, coalesce(sum(total), 0)::text as spend
     from orders where ${paid} group by user_id`);
	const itemRows = await sql.query(`select coalesce(item->>'name', 'Item') as name,
            coalesce(sum((item->>'qty')::numeric), 0)::text as qty,
            coalesce(sum((item->>'unitPrice')::numeric * (item->>'qty')::numeric), 0)::text as sales
     from orders, jsonb_array_elements(items) as item
     where ${paid}
     group by 1
     order by coalesce(sum((item->>'unitPrice')::numeric * (item->>'qty')::numeric), 0) desc
     limit 8`).catch(async () => []);
	const seriesRows = await sql.query(`select to_char(created_at at time zone 'America/New_York', 'YYYY-MM-DD') as day,
            coalesce(sum(total), 0)::text as total,
            count(*)::int as tickets
     from orders
     where ${paid} and created_at >= ${nyStart} - interval '13 days'
     group by 1`).catch(async () => []);
	const profiles = await sql`select user_id, display_name, points, totp_enabled, created_at from profiles`;
	const spendByUser = /* @__PURE__ */ new Map();
	for (const r of spendRows) spendByUser.set(String(r.user_id), {
		orders: Math.round(Number(r.orders) || 0),
		spend: num(r.spend)
	});
	const seriesMap = /* @__PURE__ */ new Map();
	const now = Date.now();
	for (let i = 13; i >= 0; i--) seriesMap.set(nyYmd(/* @__PURE__ */ new Date(now - i * 864e5)), {
		total: 0,
		tickets: 0
	});
	for (const r of seriesRows) {
		const row = seriesMap.get(String(r.day));
		if (!row) continue;
		row.total = num(r.total);
		row.tickets = Math.round(Number(r.tickets) || 0);
	}
	const weekAgo = Date.now() - 6048e5;
	const tickets = Math.round(Number(totals?.tickets) || 0);
	const collected = num(totals?.collected);
	return {
		customers: {
			total: profiles.length,
			new7d: profiles.filter((p) => new Date(String(p.created_at ?? "")).getTime() >= weekAgo).length,
			twoFactor: profiles.filter((p) => bool$1(p.totp_enabled)).length,
			avgPoints: profiles.length === 0 ? 0 : Math.round(profiles.reduce((acc, p) => acc + num(p.points), 0) / profiles.length),
			repeat: [...spendByUser.values()].filter((s) => s.orders > 1).length,
			top: profiles.map((p) => {
				const spent = spendByUser.get(String(p.user_id)) ?? {
					orders: 0,
					spend: 0
				};
				return {
					userId: String(p.user_id ?? ""),
					name: String(p.display_name || "Guest"),
					orders: spent.orders,
					spend: spent.spend,
					points: Math.round(num(p.points))
				};
			}).sort((a, b) => b.spend - a.spend).slice(0, 12)
		},
		sales: {
			today: num(totals?.today),
			week: num(totals?.week),
			month: num(totals?.month),
			allTime: collected,
			tickets,
			avgTicket: tickets ? collected / tickets : 0,
			canceled: Math.round(Number(totals?.canceled) || 0),
			series: [...seriesMap.entries()].map(([day, v]) => ({
				day,
				...v
			})),
			topItems: itemRows.map((r) => ({
				name: String(r.name),
				qty: num(r.qty),
				sales: num(r.sales)
			}))
		},
		financials: {
			food: num(totals?.food),
			tax: num(totals?.tax),
			discounts: num(totals?.discounts),
			deliveryFees: num(totals?.fees),
			tips: num(totals?.tips),
			collected,
			pickup: num(totals?.pickup),
			delivery: num(totals?.delivery),
			awaitingPayment: num(totals?.outstanding),
			byPay: payRows.map((r) => ({
				method: String(r.method),
				total: num(r.total),
				count: Math.round(Number(r.count) || 0)
			}))
		}
	};
});
function iso(value) {
	if (!value) return "";
	return value instanceof Date ? value.toISOString() : String(value);
}
function newId(prefix) {
	return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
function orderBriefFrom(row) {
	const id = String(row.linked_order_id ?? "");
	if (!id) return null;
	return {
		id,
		ticketNo: Math.round(num(row.order_ticket_no)),
		status: String(row.order_status ?? ""),
		fulfillment: row.order_fulfillment === "delivery" ? "delivery" : "pickup",
		total: num(row.order_total),
		notes: String(row.order_notes ?? ""),
		createdAt: iso(row.order_created),
		items: parseOrderItems(row.order_items).map((it) => ({
			name: it.name,
			size: it.size,
			qty: it.qty,
			detail: it.detail,
			comment: it.comment
		}))
	};
}
function toThread(row, customerName) {
	const order = orderBriefFrom(row);
	return {
		id: String(row.id),
		userId: String(row.user_id),
		customerName,
		customerPhone: String(row.customer_phone ?? row.phone ?? ""),
		status: String(row.status ?? "open"),
		lastMessage: String(row.last_message ?? ""),
		lastAt: iso(row.last_at),
		unreadAdmin: Math.round(num(row.unread_admin)),
		unreadCustomer: Math.round(num(row.unread_customer)),
		createdAt: iso(row.created_at),
		orderId: order?.id ?? (row.order_id ? String(row.order_id) : null),
		order,
		customerBanned: bool$1(row.banned ?? row.customer_banned),
		staffNote: String(row.staff_note ?? ""),
		muted: bool$1(row.muted),
		flagged: bool$1(row.flagged)
	};
}
function toMessage(row) {
	return {
		id: String(row.id),
		threadId: String(row.thread_id),
		senderId: String(row.sender_id),
		senderRole: row.sender_role === "admin" ? "admin" : "customer",
		body: String(row.body ?? ""),
		createdAt: iso(row.created_at)
	};
}
var listCustomers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	await ensureAdminModeColumns(sql);
	let profiles = [];
	try {
		profiles = await sql`
      select p.user_id, p.role, p.admin_mode, p.admin_mode_allowed, p.phone, p.display_name, p.points, p.totp_enabled, p.created_at, p.banned,
             u.email, u.name as user_name
      from profiles p
      left join "user" u on u.id = p.user_id
      order by p.created_at desc`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		profiles = await sql`
      select p.user_id, p.role, p.phone, p.display_name, p.points, p.totp_enabled, p.created_at, p.banned,
             u.email, u.name as user_name
      from profiles p
      left join "user" u on u.id = p.user_id
      order by p.created_at desc`;
	}
	const orders = await sql`
      select * from orders order by created_at desc limit 800`;
	const byUser = /* @__PURE__ */ new Map();
	for (const row of orders) {
		const o = toOrder(row);
		const list = byUser.get(o.userId) ?? [];
		if (list.length < 40) list.push(o);
		byUser.set(o.userId, list);
	}
	return profiles.map((p) => {
		const hist = byUser.get(String(p.user_id)) ?? [];
		const live = hist.filter((o) => o.status !== "canceled");
		return {
			userId: String(p.user_id ?? ""),
			displayName: String(p.display_name || p.user_name || "Guest").trim() || "Guest",
			phone: String(p.phone ?? ""),
			email: String(p.email ?? ""),
			role: p.role === "admin" || bool$1(p.admin_mode) ? "admin" : "customer",
			points: Math.round(num(p.points)),
			totpEnabled: bool$1(p.totp_enabled),
			createdAt: iso(p.created_at),
			orderCount: live.length,
			spend: live.reduce((acc, o) => acc + o.total, 0),
			lastOrderAt: hist[0]?.createdAt ?? null,
			banned: bool$1(p.banned),
			adminModeAllowed: bool$1(p.admin_mode_allowed) || p.role === "admin",
			orders: hist
		};
	});
});
var setAccountRole = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireDeskGrant(sql, context.userId);
	const userId = String(data.userId || "").trim();
	if (!userId) throw new Error("Choose an account.");
	if (data.role !== "admin" && data.role !== "customer") throw new Error("Invalid role.");
	await ensureAdminModeColumns(sql);
	let target = [];
	try {
		target = await sql`select role, admin_mode_allowed from profiles where user_id = ${userId}`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		await ensureAdminModeColumns(sql);
		try {
			target = await sql`select role, admin_mode_allowed from profiles where user_id = ${userId}`;
		} catch {
			target = await sql`select role from profiles where user_id = ${userId}`;
		}
	}
	if (!target[0]) throw new Error("Account not found.");
	if (data.role === "customer" && (target[0].role === "admin" || bool$1(target[0].admin_mode_allowed))) {
		let remaining = 1;
		try {
			remaining = num((await sql`select count(*)::int as n from profiles where role = 'admin' or admin_mode_allowed is true`)[0]?.n);
		} catch (err) {
			if (!isMissingAdminModeColumn(err)) throw err;
			remaining = num((await sql`select count(*)::int as n from profiles where role = 'admin'`)[0]?.n);
		}
		if (remaining <= 1) throw new Error("Keep at least one admin account.");
	}
	if (data.role === "admin") try {
		await sql`update profiles set admin_mode_allowed = true where user_id = ${userId}`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		await ensureAdminModeColumns(sql);
		await sql`update profiles set admin_mode_allowed = true where user_id = ${userId}`;
	}
	else try {
		await sql`update profiles set role = 'customer', admin_mode = false, admin_mode_allowed = false where user_id = ${userId}`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		await ensureAdminModeColumns(sql);
		await sql`update profiles set role = 'customer', admin_mode = false, admin_mode_allowed = false where user_id = ${userId}`;
	}
	return {
		ok: true,
		role: data.role,
		adminModeAllowed: data.role === "admin"
	};
});
var DESK_GRANT_MAX = 12;
function maskDeskEmail(email) {
	const trimmed = email.trim().toLowerCase();
	const at = trimmed.indexOf("@");
	const local = at > 0 ? trimmed.slice(0, at) : trimmed;
	const domain = at > 0 ? trimmed.slice(at + 1) : "";
	const masked = local ? `${local.slice(0, 1)}•••${domain ? `@${domain}` : ""}` : "—";
	return {
		emailLocal: local || "—",
		emailMasked: masked
	};
}
var listDeskAccounts = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await requireAdmin$1(sql, context.userId);
	let rows = [];
	try {
		rows = await sql`
      select p.user_id, p.display_name, p.admin_mode, p.admin_mode_allowed, u.email
      from profiles p
      left join "user" u on u.id = p.user_id
      where coalesce(u.email, '') <> ''
        and u.email not like '%@guest.southend.pizza'
        and p.user_id not like 'demo-%'
      order by p.admin_mode_allowed desc, p.created_at desc
      limit 80`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		rows = await sql`
      select p.user_id, p.display_name, u.email
      from profiles p
      left join "user" u on u.id = p.user_id
      where coalesce(u.email, '') <> ''
        and p.user_id not like 'demo-%'
      order by p.created_at desc
      limit 80`;
	}
	const accounts = rows.map((r) => {
		const { emailLocal, emailMasked } = maskDeskEmail(String(r.email ?? ""));
		return {
			userId: String(r.user_id ?? ""),
			emailLocal,
			emailMasked,
			displayName: String(r.display_name ?? "").trim() || emailLocal,
			adminModeAllowed: bool$1(r.admin_mode_allowed) || r.role === "admin",
			adminMode: bool$1(r.admin_mode)
		};
	});
	return {
		accounts,
		canGrant: await actorCanGrantDesk(sql, context.userId),
		granted: accounts.filter((a) => a.adminModeAllowed).length,
		max: DESK_GRANT_MAX
	};
});
var setDeskAllowed = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await requireDeskGrant(sql, context.userId);
	const userId = String(data.userId || "").trim();
	if (!userId) throw new Error("Choose an account.");
	if (userId === context.userId) throw new Error("You cannot change your own desk grant here.");
	await ensureAdminModeColumns(sql);
	const allowed = Boolean(data.allowed);
	if (allowed) {
		if (num((await sql`select count(*)::int as n from profiles where admin_mode_allowed is true`)[0]?.n) >= DESK_GRANT_MAX) throw new Error(`Desk roster is full (${DESK_GRANT_MAX}). Revoke someone first.`);
		await sql`update profiles set admin_mode_allowed = true where user_id = ${userId}`;
	} else await sql`update profiles set admin_mode_allowed = false, admin_mode = false, role = 'customer' where user_id = ${userId}`;
	try {
		await sql.query(`insert into desk_grant_audit (id, actor_id, target_id, action, created_at) values ($1,$2,$3,$4,now())`, [
			`dga-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
			context.userId,
			userId,
			allowed ? "grant" : "revoke"
		]);
	} catch {}
	return {
		ok: true,
		allowed
	};
});
var setAccountBanned = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const userId = String(data.userId || "").trim();
	if (!userId) throw new Error("Choose an account.");
	if (userId === context.userId) throw new Error("You cannot ban your own account.");
	const target = await sql`select role from profiles where user_id = ${userId}`;
	if (!target[0]) throw new Error("Account not found.");
	const banned = Boolean(data.banned);
	if (banned && target[0].role === "admin") {
		if (num((await sql`select count(*)::int as n from profiles where role = 'admin' and banned is not true`)[0]?.n) <= 1) throw new Error("Keep at least one admin account.");
	}
	await sql`update profiles set banned = ${banned} where user_id = ${userId}`;
	return {
		ok: true,
		banned
	};
});
var adjustCustomerPoints = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const userId = String(data.userId || "").trim();
	if (!userId) throw new Error("Choose an account.");
	const delta = Math.round(num(data.delta));
	if (!delta) throw new Error("Enter how many points to add or remove.");
	if (Math.abs(delta) > 1e5) throw new Error("That point change is too large.");
	if (!(await sql`select user_id from profiles where user_id = ${userId}`)[0]) throw new Error("Account not found.");
	await sql.query(`update profiles set points = greatest(0, points + $1) where user_id = $2`, [delta, userId]);
	await addLedger(sql, userId, "adjust", delta, delta > 0 ? `Shop added ${delta} points` : `Shop removed ${Math.abs(delta)} points`);
	const row = await sql`select points from profiles where user_id = ${userId}`;
	return {
		ok: true,
		points: Math.round(num(row[0]?.points))
	};
});
var deleteOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const id = String(data.id || "").trim();
	if (!id) throw new Error("Choose an order.");
	if (!(await sql`select id from orders where id = ${id}`)[0]) throw new Error("Order not found.");
	await sql`delete from orders where id = ${id}`;
	return {
		ok: true,
		id
	};
});
var RECOVER_FAIL = "We could not recover that account. Check the email or phone, and the name or phone on file.";
var OTP_TTL_MS = 6e4;
var OTP_MAX_ATTEMPTS = 5;
var OTP_HOUR_CAP = 8;
function hashOtp(salt, code) {
	return createHash("sha256").update(`southend-otp:${salt}:${code}`).digest();
}
function maskEmail(email) {
	const [user, domain] = email.split("@");
	if (!domain) return "***";
	return `${(user || "x").slice(0, 1)}***@${domain}`;
}
async function loadCredentialAccount(sql, userId) {
	return (await sql.query(`select id, "providerId" as provider from account where "userId" = $1`, [userId])).find((row) => String(row.provider) === "credential") ?? null;
}
var recoverPassword = createServerFn({ method: "POST" }).validator((data) => data).handler(async ({ data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	const identifier = String(data.identifier ?? "").trim();
	const proof = String(data.proof ?? "").trim();
	const password = String(data.password ?? "");
	if (password.length < 8) throw new Error("Use at least 8 characters for the new password.");
	if (password.length > 128) throw new Error("That password is too long.");
	if (!identifier || !proof) throw new Error(RECOVER_FAIL);
	const parsed = identifierToEmail(identifier);
	const email = parsed.email.toLowerCase();
	const user = (await sql.query(`select id, email from "user" where lower(email) = $1 limit 1`, [email]))[0];
	if (!user) throw new Error(RECOVER_FAIL);
	const userId = String(user.id);
	const profile = (await sql`select phone, display_name from profiles where user_id = ${userId}`)[0];
	const storedPhone = toTenDigitPhone(String(profile?.phone ?? parsed.phone ?? ""));
	const storedName = String(profile?.display_name ?? "").trim().toLowerCase();
	const proofPhone = toTenDigitPhone(proof);
	const proofName = proof.toLowerCase();
	const phoneOk = Boolean(proofPhone && storedPhone && proofPhone === storedPhone);
	const nameOk = Boolean(proofName.length >= 2 && storedName && proofName === storedName);
	if (!phoneOk && !nameOk) throw new Error(RECOVER_FAIL);
	const credential = (await sql.query(`select id, "providerId" as provider from account where "userId" = $1`, [userId])).find((row) => String(row.provider) === "credential");
	if (!credential) throw new Error("This account signs in with Google or X. Use that button on the sign-in page.");
	const hash = await hashPassword(password);
	await sql.query(`update account set password = $1, "updatedAt" = now() where id = $2 and "providerId" = 'credential'`, [hash, String(credential.id)]);
	return { ok: true };
});
var sendPasswordResetCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const users = await sql.query(`select id, email from "user" where id = $1 limit 1`, [context.userId]);
	const email = String(users[0]?.email ?? "").trim().toLowerCase();
	if (!email || !email.includes("@")) throw new Error("This account has no email on file.");
	if (!await loadCredentialAccount(sql, context.userId)) throw new Error("This account signs in with Google or X. Use that button on the sign-in page.");
	const recent = await sql.query(`select created_at from password_reset_codes where user_id = $1 and created_at > now() - interval '1 hour' order by created_at desc`, [context.userId]);
	if (recent.length >= OTP_HOUR_CAP) throw new Error("Too many reset emails. Try again in an hour.");
	const last = recent[0]?.created_at ? new Date(String(recent[0].created_at)).getTime() : 0;
	if (last && Date.now() - last < OTP_TTL_MS) throw new Error("A code is already on the way. Wait 60 seconds to send another.");
	await sql.query(`update password_reset_codes set consumed_at = now() where user_id = $1 and consumed_at is null`, [context.userId]);
	const code = String(randomInt(0, 1e6)).padStart(6, "0");
	const salt = randomBytes(16).toString("hex");
	const digest = hashOtp(salt, code).toString("hex");
	const id = `otp-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
	const expires = new Date(Date.now() + OTP_TTL_MS);
	await sql.query(`insert into password_reset_codes (id, user_id, email, code_hash, salt, expires_at) values ($1,$2,$3,$4,$5,$6)`, [
		id,
		context.userId,
		email,
		digest,
		salt,
		expires
	]);
	const { sendEmail } = await import("./resend.server.mjs");
	await sendEmail({
		to: email,
		subject: "Your South End Pizza reset code",
		text: `Your South End Pizza password reset code is ${code}. It expires in 60 seconds. If you did not ask for this, you can ignore this message.`,
		html: `<p style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#1a1410">Your South End Pizza password reset code is:</p>
<p style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:28px;letter-spacing:0.28em;font-weight:700;color:#1a1410">${code}</p>
<p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.45;color:#5c534c">It expires in 60 seconds. If you did not ask for this, you can ignore this message — your password stays the same.</p>`
	});
	return {
		sent: true,
		email: maskEmail(email),
		expiresIn: 60,
		previewCode: dbSource === "pglite" ? code : void 0
	};
});
var changeMyPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const password = String(data.password ?? "");
	const code = String(data.code ?? "").replace(/\D/g, "");
	if (password.length < 8) throw new Error("Use at least 8 characters for the new password.");
	if (password.length > 128) throw new Error("That password is too long.");
	if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code from your email.");
	const credential = await loadCredentialAccount(sql, context.userId);
	if (!credential) throw new Error("This account signs in with Google or X. Use that button on the sign-in page.");
	const row = (await sql.query(`select id, code_hash, salt, expires_at, attempts, consumed_at from password_reset_codes
     where user_id = $1 and consumed_at is null order by created_at desc limit 1`, [context.userId]))[0];
	if (!row) throw new Error("Send a new one-time code first.");
	if (new Date(String(row.expires_at)).getTime() < Date.now()) {
		await sql.query(`update password_reset_codes set consumed_at = now() where id = $1`, [String(row.id)]);
		throw new Error("That code expired. Send a new one.");
	}
	if (Math.round(num(row.attempts)) >= OTP_MAX_ATTEMPTS) {
		await sql.query(`update password_reset_codes set consumed_at = now() where id = $1`, [String(row.id)]);
		throw new Error("Too many tries. Send a new code.");
	}
	const expected = Buffer.from(String(row.code_hash), "hex");
	const got = hashOtp(String(row.salt), code);
	if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
		await sql.query(`update password_reset_codes set attempts = attempts + 1 where id = $1`, [String(row.id)]);
		throw new Error("That code does not match. Try again.");
	}
	const hash = await hashPassword(password);
	await sql.query(`update account set password = $1, "updatedAt" = now() where id = $2 and "providerId" = 'credential'`, [hash, String(credential.id)]);
	await sql.query(`update password_reset_codes set consumed_at = now() where user_id = $1 and consumed_at is null`, [context.userId]);
	return { ok: true };
});
var sendSignupEmailCode = createServerFn({ method: "POST" }).validator((data) => data).handler(async ({ data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	const email = String(data.email ?? "").trim().toLowerCase();
	if (!email || !email.includes("@")) throw new Error("Enter a valid email address.");
	if (isPhoneAuthEmail(email) || isStaffAdminAccount(void 0, email)) return {
		alreadyVerified: true,
		skipped: true,
		email: maskEmail(email),
		expiresIn: 0
	};
	const user = (await sql.query(`select id, email, "emailVerified" as verified from "user" where lower(email) = $1 limit 1`, [email]))[0];
	if (!user) throw new Error("We could not send a code for that email. Check the address and try again.");
	const userId = String(user.id);
	if (isStaffAdminAccount(userId, email)) return {
		alreadyVerified: true,
		skipped: true,
		email: maskEmail(email),
		expiresIn: 0
	};
	if (user.verified === true || user.verified === "t" || user.verified === "true") return {
		alreadyVerified: true,
		email: maskEmail(email),
		expiresIn: 0
	};
	if (!await loadCredentialAccount(sql, userId)) {
		await sql.query(`update "user" set "emailVerified" = true, "updatedAt" = now() where id = $1`, [userId]);
		return {
			alreadyVerified: true,
			email: maskEmail(email),
			expiresIn: 0
		};
	}
	const recent = await sql.query(`select created_at from email_signup_codes where user_id = $1 and created_at > now() - interval '1 hour' order by created_at desc`, [userId]);
	if (recent.length >= OTP_HOUR_CAP) throw new Error("Too many verification emails. Try again in an hour.");
	const last = recent[0]?.created_at ? new Date(String(recent[0].created_at)).getTime() : 0;
	if (last && Date.now() - last < OTP_TTL_MS) throw new Error("A code is already on the way. Wait 60 seconds to send another.");
	await sql.query(`update email_signup_codes set consumed_at = now() where user_id = $1 and consumed_at is null`, [userId]);
	const code = String(randomInt(0, 1e6)).padStart(6, "0");
	const salt = randomBytes(16).toString("hex");
	const digest = hashOtp(salt, code).toString("hex");
	const id = `esc-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
	const expires = new Date(Date.now() + OTP_TTL_MS);
	await sql.query(`insert into email_signup_codes (id, user_id, email, code_hash, salt, expires_at) values ($1,$2,$3,$4,$5,$6)`, [
		id,
		userId,
		email,
		digest,
		salt,
		expires
	]);
	const { sendEmail } = await import("./resend.server.mjs");
	await sendEmail({
		to: email,
		subject: "Your South End Pizza signup code",
		text: `Welcome to South End Pizza! Your verification code is ${code}. It expires in 60 seconds.`,
		html: `<p style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#1a1410">Welcome to South End Pizza — almost ready to order.</p>
<p style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#1a1410">Your verification code is:</p>
<p style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:28px;letter-spacing:0.28em;font-weight:700;color:#1a1410">${code}</p>
<p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.45;color:#5c534c">It expires in 60 seconds. If you did not create an account, you can ignore this message.</p>`
	});
	return {
		sent: true,
		alreadyVerified: false,
		email: maskEmail(email),
		expiresIn: 60,
		previewCode: dbSource === "pglite" ? code : void 0
	};
});
var verifySignupEmailCode = createServerFn({ method: "POST" }).validator((data) => data).handler(async ({ data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	const email = String(data.email ?? "").trim().toLowerCase();
	const code = String(data.code ?? "").replace(/\D/g, "");
	if (!email || !email.includes("@")) throw new Error("Enter a valid email address.");
	if (isPhoneAuthEmail(email) || isStaffAdminAccount(void 0, email)) return {
		ok: true,
		skipped: true
	};
	if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code from your email.");
	const user = (await sql.query(`select id, "emailVerified" as verified from "user" where lower(email) = $1 limit 1`, [email]))[0];
	if (!user) throw new Error("We could not verify that email. Try signing up again.");
	const userId = String(user.id);
	if (user.verified === true || user.verified === "t" || user.verified === "true") return {
		ok: true,
		alreadyVerified: true
	};
	const row = (await sql.query(`select id, code_hash, salt, expires_at, attempts, consumed_at from email_signup_codes
     where user_id = $1 and consumed_at is null order by created_at desc limit 1`, [userId]))[0];
	if (!row) throw new Error("Send a new one-time code first.");
	if (new Date(String(row.expires_at)).getTime() < Date.now()) {
		await sql.query(`update email_signup_codes set consumed_at = now() where id = $1`, [String(row.id)]);
		throw new Error("That code expired. Send a new one.");
	}
	if (Math.round(num(row.attempts)) >= OTP_MAX_ATTEMPTS) {
		await sql.query(`update email_signup_codes set consumed_at = now() where id = $1`, [String(row.id)]);
		throw new Error("Too many tries. Send a new code.");
	}
	const expected = Buffer.from(String(row.code_hash), "hex");
	const got = hashOtp(String(row.salt), code);
	if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
		await sql.query(`update email_signup_codes set attempts = attempts + 1 where id = $1`, [String(row.id)]);
		throw new Error("That code does not match. Try again.");
	}
	await sql.query(`update "user" set "emailVerified" = true, "updatedAt" = now() where id = $1`, [userId]);
	await sql.query(`update email_signup_codes set consumed_at = now() where user_id = $1 and consumed_at is null`, [userId]);
	return { ok: true };
});
var patchPosOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const id = String(data.id || "").trim();
	if (!id) throw new Error("Choose an order.");
	const rows = await sql`select * from orders where id = ${id}`;
	if (!rows[0]) throw new Error("Order not found.");
	const current = toOrder(rows[0]);
	if (current.status === "canceled") throw new Error("A canceled ticket cannot be edited.");
	const items = parseOrderItems(data.items).filter((it) => it.qty > 0 && it.name);
	if (!items.length) throw new Error("Keep at least one item on the ticket.");
	const settings = await loadSettingsRow(sql);
	const subtotal = Math.round(items.reduce((s, l) => s + l.unitPrice * l.qty, 0) * 100) / 100;
	const discount = current.discount;
	const deliveryFee = current.deliveryFee;
	const { tax, total: preTip } = computeTax(subtotal, discount, deliveryFee, settings.tax_rate === void 0 || settings.tax_rate === null || settings.tax_rate === "" ? 6.625 : Math.max(0, num(settings.tax_rate)));
	const tip = current.tip;
	const total = Math.round((preTip + tip) * 100) / 100;
	await sql.query(`update orders set items = $1::jsonb, subtotal = $2, tax = $3, total = $4 where id = $5`, [
		JSON.stringify(items),
		subtotal.toFixed(2),
		tax.toFixed(2),
		total.toFixed(2),
		id
	]);
	const next = (await sql`select * from orders where id = ${id}`)[0];
	return {
		ok: true,
		order: next ? toOrder(next) : null
	};
});
var listPosOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	return (await sql`
      select o.*, p.display_name, p.phone,
        ping.id as chat_thread_id,
        ping.unread_admin as chat_unread
      from orders o
      left join profiles p on p.user_id = o.user_id
      left join (
        select distinct on (order_id) id, order_id, unread_admin
        from chat_threads
        where order_id is not null
          and unread_admin > 0
          and status <> 'solved'
          and muted is not true
        order by order_id, last_at desc
      ) ping on ping.order_id = o.id
      order by o.created_at desc
      limit 120`).map((row) => {
		return {
			...toOrder(row),
			customerName: String(row.display_name || "").trim() || "Guest",
			customerPhone: String(row.phone || ""),
			chatUnread: Math.round(num(row.chat_unread)),
			chatThreadId: row.chat_thread_id ? String(row.chat_thread_id) : null
		};
	});
});
var listIncomingOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	return (await sql`
      select o.*, p.display_name, p.phone
      from orders o
      left join profiles p on p.user_id = o.user_id
      where o.status = 'placed'
      order by o.created_at asc, coalesce(o.ticket_no, 0) asc, o.id asc
      limit 40`).map((row) => {
		return {
			...toOrder(row),
			customerName: String(row.pickup_name || row.display_name || "").trim() || "Guest",
			customerPhone: String(row.phone || ""),
			chatUnread: 0,
			chatThreadId: null
		};
	});
});
var getAdminInboxCount = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const rows = await sql`
      select count(*)::int as n from chat_threads where unread_admin > 0 and status <> 'solved' and muted is not true`;
	return { unread: Math.round(num(rows[0]?.n)) };
});
var listAdminChats = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	return (await sql`
      select t.*, p.display_name, p.phone as customer_phone, p.banned,
        o.id as linked_order_id, o.ticket_no as order_ticket_no, o.status as order_status, o.fulfillment as order_fulfillment,
        o.total as order_total, o.notes as order_notes, o.created_at as order_created, o.items as order_items
      from chat_threads t
      left join profiles p on p.user_id = t.user_id
      left join orders o on o.id = t.order_id
      order by t.flagged desc, t.last_at desc
      limit 80`).map((row) => toThread(row, String(row.display_name || "").trim() || "Guest"));
});
var listMyChats = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	return (await sql`
      select t.*,
        o.id as linked_order_id, o.ticket_no as order_ticket_no, o.status as order_status, o.fulfillment as order_fulfillment,
        o.total as order_total, o.notes as order_notes, o.created_at as order_created, o.items as order_items
      from chat_threads t
      left join orders o on o.id = t.order_id
      where t.user_id = ${context.userId} and t.status <> 'solved'
      order by t.last_at desc
      limit 20`).map((row) => {
		return {
			...toThread(row, "You"),
			staffNote: "",
			muted: false,
			flagged: false
		};
	});
});
var loadChatMessages = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const threadId = String(data.threadId || "");
	const thread = await sql`select user_id, status from chat_threads where id = ${threadId}`;
	if (!thread[0]) throw new Error("Chat not found.");
	const isAdmin = await profileDeskOn(sql, context.userId);
	if (!isAdmin && thread[0].user_id !== context.userId) throw new Error("Forbidden");
	if (!isAdmin && String(thread[0].status) === "solved") return [];
	if (isAdmin) await sql`update chat_threads set unread_admin = 0 where id = ${threadId}`;
	else await sql`update chat_threads set unread_customer = 0 where id = ${threadId}`;
	return (await sql`
      select * from chat_messages where thread_id = ${threadId} order by created_at asc limit 200`).map(toMessage);
});
var startChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await assertNotBanned(sql, context.userId);
	const body = String(data.body || "").trim().slice(0, 1e3);
	if (!body) throw new Error("Write a message first.");
	let orderId = String(data.orderId || "").trim() || null;
	if (!orderId) throw new Error("Pick an active order first.");
	if (!(await sql`
        select id from orders where id = ${orderId} and user_id = ${context.userId}`)[0]) throw new Error("That ticket is not on this account.");
	const openRow = Boolean(data.forceNew) ? void 0 : (await sql`
      select id from chat_threads
      where user_id = ${context.userId} and status = 'open'
      order by last_at desc limit 1`)[0];
	let threadId = openRow?.id ? String(openRow.id) : "";
	const preview = body.slice(0, 140);
	if (!threadId) {
		threadId = newId("chat");
		await sql.query(`insert into chat_threads (id, user_id, status, last_message, last_at, unread_admin, unread_customer, order_id)
         values ($1,$2,'open',$3,now(),1,0,$4)`, [
			threadId,
			context.userId,
			preview,
			orderId
		]);
	} else await sql.query(`update chat_threads
         set last_message = $1, last_at = now(), unread_admin = unread_admin + 1, unread_customer = 0,
             status = 'open', order_id = coalesce($3, order_id)
         where id = $2`, [
		preview,
		threadId,
		orderId
	]);
	const msgId = newId("msg");
	await sql.query(`insert into chat_messages (id, thread_id, sender_id, sender_role, body) values ($1,$2,$3,'customer',$4)`, [
		msgId,
		threadId,
		context.userId,
		body
	]);
	return { threadId };
});
var sendChatMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const threadId = String(data.threadId || "");
	const body = String(data.body || "").trim().slice(0, 1e3);
	if (!body) throw new Error("Write a message first.");
	const thread = await sql`select user_id, status from chat_threads where id = ${threadId}`;
	if (!thread[0]) throw new Error("Chat not found.");
	const isAdmin = await profileDeskOn(sql, context.userId);
	if (!isAdmin && thread[0].user_id !== context.userId) throw new Error("Forbidden");
	if (!isAdmin) await assertNotBanned(sql, context.userId);
	if (!isAdmin && String(thread[0].status) === "solved") throw new Error("This chat has concluded. Start a new chat.");
	const role = isAdmin ? "admin" : "customer";
	const msgId = newId("msg");
	await sql.query(`insert into chat_messages (id, thread_id, sender_id, sender_role, body) values ($1,$2,$3,$4,$5)`, [
		msgId,
		threadId,
		context.userId,
		role,
		body
	]);
	if (isAdmin) await sql.query(`update chat_threads
         set last_message = $1, last_at = now(), unread_customer = unread_customer + 1, unread_admin = 0, status = 'open'
         where id = $2`, [body.slice(0, 140), threadId]);
	else await sql.query(`update chat_threads
         set last_message = $1, last_at = now(), unread_admin = unread_admin + 1, unread_customer = 0, status = 'open'
         where id = $2`, [body.slice(0, 140), threadId]);
	return {
		ok: true,
		id: msgId
	};
});
var setChatResolution = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const threadId = String(data.threadId || "");
	if (!(await sql`select id from chat_threads where id = ${threadId}`)[0]) throw new Error("Chat not found.");
	const status = data.solved ? "solved" : "open";
	if (data.solved) await sql.query(`update chat_threads
         set status = 'solved', unread_admin = 0, unread_customer = 0, last_at = now()
         where id = $1`, [threadId]);
	else await sql.query(`update chat_threads set status = $1, unread_admin = 0 where id = $2`, [status, threadId]);
	return {
		ok: true,
		status
	};
});
var attachChatOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const threadId = String(data.threadId || "");
	const orderId = String(data.orderId || "").trim();
	if (!threadId || !orderId) throw new Error("Choose a ticket.");
	const thread = await sql`select user_id from chat_threads where id = ${threadId}`;
	if (!thread[0]) throw new Error("Chat not found.");
	if (!((await sql`select role from profiles where user_id = ${context.userId}`)[0]?.role === "admin") && thread[0].user_id !== context.userId) throw new Error("Forbidden");
	if (!(await sql`select id from orders where id = ${orderId} and user_id = ${thread[0].user_id}`)[0]) throw new Error("That ticket is not on this account.");
	await sql`update chat_threads set order_id = ${orderId} where id = ${threadId}`;
	return {
		ok: true,
		orderId
	};
});
var startAdminChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const userId = String(data.userId || "").trim();
	if (!userId) throw new Error("Choose a customer.");
	if (!(await sql`select user_id from profiles where user_id = ${userId}`)[0]) throw new Error("Account not found.");
	const open = (await sql`
      select id from chat_threads where user_id = ${userId} and status <> 'solved' order by last_at desc limit 1`)[0];
	if (open?.id) return { threadId: String(open.id) };
	const any = (await sql`select id from chat_threads where user_id = ${userId} order by last_at desc limit 1`)[0];
	if (any?.id) return { threadId: String(any.id) };
	const threadId = newId("chat");
	await sql.query(`insert into chat_threads (id, user_id, status, last_message, last_at, unread_admin, unread_customer)
       values ($1,$2,'open',$3,now(),0,0)`, [
		threadId,
		userId,
		"Shop started a conversation"
	]);
	return { threadId };
});
var setChatStaffNote = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const threadId = String(data.threadId || "");
	if (!(await sql`select id from chat_threads where id = ${threadId}`)[0]) throw new Error("Chat not found.");
	const note = String(data.note ?? "").slice(0, 800);
	await sql`update chat_threads set staff_note = ${note} where id = ${threadId}`;
	return {
		ok: true,
		note
	};
});
var setChatMuted = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const threadId = String(data.threadId || "");
	if (!(await sql`select id from chat_threads where id = ${threadId}`)[0]) throw new Error("Chat not found.");
	const muted = Boolean(data.muted);
	await sql`update chat_threads set muted = ${muted} where id = ${threadId}`;
	return {
		ok: true,
		muted
	};
});
var setChatFlagged = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const threadId = String(data.threadId || "");
	if (!(await sql`select id from chat_threads where id = ${threadId}`)[0]) throw new Error("Chat not found.");
	const flagged = Boolean(data.flagged);
	await sql`update chat_threads set flagged = ${flagged} where id = ${threadId}`;
	return {
		ok: true,
		flagged
	};
});
var deleteChatMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const id = String(data.id || "").trim();
	const row = (await sql`select thread_id from chat_messages where id = ${id}`)[0];
	if (!row) throw new Error("Message not found.");
	const threadId = String(row.thread_id);
	await sql`delete from chat_messages where id = ${id}`;
	const last = (await sql`select body from chat_messages where thread_id = ${threadId} order by created_at desc limit 1`)[0];
	await sql.query(`update chat_threads set last_message = $1 where id = $2`, [String(last?.body ?? "").slice(0, 140), threadId]);
	return {
		ok: true,
		id
	};
});
var deleteChatThread = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin$1(sql, context.userId);
	const threadId = String(data.threadId || "").trim();
	if (!(await sql`select id from chat_threads where id = ${threadId}`)[0]) throw new Error("Chat not found.");
	await sql`delete from chat_messages where thread_id = ${threadId}`;
	await sql`delete from chat_threads where id = ${threadId}`;
	return {
		ok: true,
		threadId
	};
});
//#endregion
//#region src/components/shop-backdrop.tsx
function applyLogo(data) {
	if (typeof document === "undefined") return;
	const url = data || "";
	document.documentElement.dataset.shopLogo = url;
	const icon = document.querySelector("link[rel=\"icon\"]");
	if (icon) icon.href = url || "/favicon.svg";
	window.dispatchEvent(new Event(SHOP_LOGO_EVENT));
}
function ShopBackdrop() {
	const [src, setSrc] = (0, import_react.useState)(DEFAULT_BACKDROP);
	const [host, setHost] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const node = document.getElementById("shop-backdrop-host") ?? document.createElement("div");
		node.id = "shop-backdrop-host";
		node.className = "shop-backdrop-host";
		if (!node.parentNode) document.body.insertBefore(node, document.body.firstChild);
		setHost(node);
	}, []);
	(0, import_react.useEffect)(() => {
		const load = () => {
			getStorefront().then((d) => {
				setSrc(d.settings.backdropData || "/buffalo-mark.webp");
				applyLogo(d.settings.logoData || "");
			}).catch(() => {
				setSrc(DEFAULT_BACKDROP);
				applyLogo("");
			});
		};
		load();
		return onShopBackdrop(load);
	}, []);
	if (!host) return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "shop-backdrop-layer no-print",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src,
			alt: "",
			decoding: "async",
			fetchPriority: "low"
		})
	}), host);
}
//#endregion
//#region src/components/season-fx.tsx
var DOTS = Array.from({ length: 20 }, (_, i) => i);
function SeasonFx() {
	const [fx, setFx] = (0, import_react.useState)("none");
	(0, import_react.useEffect)(() => {
		const load = () => {
			getStorefront().then((d) => setFx(sanitizeSeasonEffect(d.settings.seasonEffect))).catch(() => setFx("none"));
		};
		load();
		return onShopBackdrop(load);
	}, []);
	if (fx === "none") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "season-fx no-print",
		"data-fx": fx,
		"aria-hidden": true,
		children: DOTS.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { "--i": i } }, i))
	});
}
//#endregion
//#region src/components/customer-chat.tsx
function OrderTicketCard({ order }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "order-ticket",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "shop-brand-kicker",
				children: "Linked ticket"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
				"#",
				formatTicketNo(order.ticketNo),
				" · ",
				order.fulfillment === "delivery" ? "Delivery" : "Pickup"
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
				order.status.replaceAll("_", " "),
				" · ",
				formatUsd(order.total),
				order.createdAt ? ` · placed ${formatShopWhen(order.createdAt)}` : ""
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: order.items.slice(0, 6).map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
				it.qty,
				"× ",
				it.name,
				it.size ? ` · ${it.size}` : "",
				it.detail ? ` · ${it.detail}` : "",
				it.comment ? ` · Cook: ${it.comment}` : ""
			] }, `${it.name}-${i}`)) }),
			order.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "order-ticket-notes",
				children: order.notes
			}) : null
		]
	});
}
function CustomerChat({ compact }) {
	const [threads, setThreads] = (0, import_react.useState)([]);
	const [orders, setOrders] = (0, import_react.useState)([]);
	const [active, setActive] = (0, import_react.useState)("");
	const [orderId, setOrderId] = (0, import_react.useState)("");
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [fresh, setFresh] = (0, import_react.useState)(false);
	const logRef = (0, import_react.useRef)(null);
	const freshStart = (0, import_react.useRef)(false);
	const hadMail = (0, import_react.useRef)(false);
	function beginFresh() {
		freshStart.current = true;
		setFresh(true);
		setActive("");
		setDraft("");
		setMessages([]);
		setError("");
		hadMail.current = false;
	}
	function refreshThreads() {
		return listMyChats().then((list) => {
			const live = list.filter((t) => t.status !== "solved");
			setThreads(live);
			setActive((cur) => {
				if (freshStart.current) return "";
				if (cur && live.some((t) => t.id === cur)) return cur;
				if (cur) {
					freshStart.current = true;
					setFresh(true);
					setMessages([]);
					return "";
				}
				return live.find((t) => t.unreadCustomer > 0)?.id || live[0]?.id || "";
			});
			return live;
		}).catch(() => setThreads([]));
	}
	(0, import_react.useEffect)(() => {
		refreshThreads();
		listMyOrders().then((list) => {
			const live = list.filter((o) => isActiveOrderStatus(o.status));
			setOrders(live);
			setOrderId((cur) => cur && live.some((o) => o.id === cur) ? cur : live[0]?.id ?? "");
		}).catch(() => setOrders([]));
		const t = window.setInterval(() => {
			if (!document.hidden) refreshThreads();
		}, 8e3);
		const onVis = () => {
			if (!document.hidden) refreshThreads();
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			window.clearInterval(t);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!active || freshStart.current) {
			if (!active) setMessages([]);
			return;
		}
		let live = true;
		hadMail.current = false;
		const pull = () => {
			if (freshStart.current) return;
			loadChatMessages({ data: { threadId: active } }).then((msgs) => {
				if (!live) return;
				if (msgs.length === 0 && hadMail.current) {
					beginFresh();
					return;
				}
				if (msgs.length > 0) hadMail.current = true;
				setMessages(msgs);
			}).catch(() => void 0);
		};
		pull();
		const onVis = () => {
			if (!document.hidden) pull();
		};
		const t = window.setInterval(() => {
			if (!document.hidden) pull();
		}, 8e3);
		document.addEventListener("visibilitychange", onVis);
		return () => {
			live = false;
			window.clearInterval(t);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, [active]);
	(0, import_react.useEffect)(() => {
		const el = logRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [messages]);
	const current = threads.find((t) => t.id === active);
	const blank = fresh || !active;
	const chosenTicket = current?.order?.id || orderId;
	const canSend = Boolean(draft.trim()) && !busy && Boolean(chosenTicket);
	function send(e) {
		e?.preventDefault();
		const body = draft.trim();
		if (!body) return;
		const startNew = !active || freshStart.current;
		const ticket = current?.order?.id || orderId;
		if (startNew && !ticket) {
			setError("Pick an active order first.");
			return;
		}
		setBusy(true);
		setError("");
		(startNew ? startChat({ data: {
			body,
			orderId: ticket,
			forceNew: true
		} }).then((r) => String(r.threadId)) : sendChatMessage({ data: {
			threadId: active,
			body
		} }).then(() => active)).then(async (id) => {
			freshStart.current = false;
			setFresh(false);
			setDraft("");
			setActive(id);
			await refreshThreads();
			const msgs = await loadChatMessages({ data: { threadId: id } });
			setMessages(msgs);
		}).catch((err) => {
			const msg = err instanceof Error ? err.message : "Could not send";
			if (/concluded/i.test(msg)) {
				freshStart.current = true;
				setFresh(true);
				setActive("");
				setMessages([]);
				setError("");
				hadMail.current = false;
			} else setError(msg);
		}).finally(() => setBusy(false));
	}
	function linkTicket() {
		if (!active || !orderId) return;
		setBusy(true);
		attachChatOrder({ data: {
			threadId: active,
			orderId
		} }).then(async () => {
			await refreshThreads();
		}).catch((err) => setError(err instanceof Error ? err.message : "Could not link ticket")).finally(() => setBusy(false));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "chat-box",
		"data-compact": compact ? "true" : "false",
		children: [
			blank || !current ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "About this order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					className: "ed-input",
					value: orderId,
					onChange: (e) => setOrderId(e.target.value),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "No ticket yet"
					}), orders.slice(0, 12).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: o.id,
						children: [
							"#",
							formatTicketNo(o.ticketNo),
							" · ",
							o.fulfillment,
							" · ",
							formatUsd(o.total),
							" · ",
							formatShopWhen(o.createdAt)
						]
					}, o.id))]
				})]
			}) : current.order ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderTicketCard, { order: current.order }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Link a ticket" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "ed-input",
						value: orderId,
						onChange: (e) => setOrderId(e.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "Choose ticket"
						}), orders.slice(0, 12).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: o.id,
							children: [
								"#",
								formatTicketNo(o.ticketNo),
								" · ",
								o.fulfillment,
								" · ",
								formatUsd(o.total),
								" · ",
								formatShopWhen(o.createdAt)
							]
						}, o.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-btn",
						disabled: busy || !orderId,
						onClick: linkTicket,
						children: "Link ticket"
					})
				]
			}),
			!fresh && threads.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Conversation" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					className: "ed-input",
					value: active,
					onChange: (e) => setActive(e.target.value),
					children: threads.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
						value: t.id,
						children: [t.unreadCustomer > 0 ? "New · " : "", t.lastMessage.slice(0, 36) || "Chat"]
					}, t.id))
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "chat-history",
				"aria-label": "Sent messages",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "chat-history-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "chat-log-kicker",
						children: "Sent messages"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "chat-history-hint",
						children: "What you and the shop already sent. This is not where you type."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "chat-log",
					"aria-live": "polite",
					ref: logRef,
					children: messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-empty",
						children: "Nothing sent yet. Write below to message the kitchen."
					}) : messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "chat-bubble",
						"data-role": m.senderRole,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [m.senderRole === "admin" ? "Shop replied" : "You sent", m.createdAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
							dateTime: m.createdAt,
							children: formatShopClock(m.createdAt)
						}) : null] }), m.body]
					}, m.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "chat-compose",
				"aria-label": "Write a new message",
				onSubmit: (e) => send(e),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "chat-compose-head",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, {
							size: 16,
							strokeWidth: 2.2,
							"aria-hidden": true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "chat-compose-kicker",
							children: "Type a new message here"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Your new message" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "ed-input ed-area chat-draft",
							rows: compact ? 2 : 3,
							maxLength: 1e3,
							value: draft,
							onChange: (e) => setDraft(e.target.value),
							placeholder: "Write your new message to the shop…",
							"aria-label": "Type a new message to the shop",
							onKeyDown: (e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									if (canSend) send();
								}
							}
						})]
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "form-error",
						children: error
					}) : null,
					orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-empty",
						children: "Place an order first, then chat about that ticket."
					}) : !chosenTicket ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-empty",
						children: "Pick an active order to send a message."
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "btn-print",
						disabled: !canSend,
						children: busy ? "Sending…" : "Send"
					})
				]
			})
		]
	});
}
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const raw = data?.user;
	return {
		user: (0, import_react.useMemo)(() => {
			if (!raw) return null;
			return {
				id: raw.id,
				displayName: raw.name ?? null,
				primaryEmail: raw.email ?? null,
				profileImageUrl: raw.image ?? null,
				isDevFallback: false
			};
		}, [
			raw?.id,
			raw?.name,
			raw?.email,
			raw?.image
		]),
		isPending
	};
}
//#endregion
//#region src/components/pizza-spinner.tsx
function PizzaSpinner({ size = "md", label = "Loading account" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: `pizza-spinner pizza-spinner-${size}`,
		role: "status",
		"aria-busy": "true",
		"aria-label": label,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 32 32",
			width: "100%",
			height: "100%",
			"aria-hidden": "true",
			focusable: "false",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "16",
					cy: "16",
					r: "15",
					fill: "#c47a2c"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "16",
					cy: "16",
					r: "12.2",
					fill: "#f4d27a"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "16",
					cy: "16",
					r: "11.1",
					fill: "#f7e3a1"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "11",
					cy: "12.2",
					r: "2.15",
					fill: "#b43228"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "18.6",
					cy: "10.6",
					r: "1.85",
					fill: "#9a221c"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "21.4",
					cy: "16.4",
					r: "2.05",
					fill: "#b43228"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "15.2",
					cy: "19.8",
					r: "1.7",
					fill: "#9a221c"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "10.4",
					cy: "18.6",
					r: "1.55",
					fill: "#c4473a"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "17.4",
					cy: "14.4",
					r: "1.35",
					fill: "#c4473a"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: label
		})]
	});
}
function AccountLoading({ compact, label = "Loading account" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: compact ? "account-loading account-loading-compact" : "account-loading",
		"aria-busy": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PizzaSpinner, {
			size: compact ? "sm" : "md",
			label
		}), compact ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: label })]
	});
}
//#endregion
//#region src/lib/auth/gates.tsx
/**
* Auth state components — plain wrappers around `useCurrentUserState()`.
*
* With auth on, visitors are signed out until they authenticate — in the sandbox
* live preview too, which does real sign-in. The shared dev user appears only
* when auth is disabled (`VITE_AUTH_ENABLED=false`, the shipped default).
* While the session is still resolving, gates that care about signed-out state
* render nothing so there's no signed-out flash on hard reload.
*/
/** Where `RedirectToSignIn` sends signed-out visitors. Create this route. */
var SIGN_IN_PATH = "/login";
/** Render children only when a user is present (real session, or the disabled-auth dev user). */
function SignedIn({ children }) {
	const { user } = useCurrentUserState();
	return user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children }) : null;
}
/**
* Render children only once we KNOW the visitor is signed out (`isPending` has
* cleared and there is no user). Hidden while the session is still loading.
*/
function SignedOut({ children }) {
	const { user, isPending } = useCurrentUserState();
	if (isPending || user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
/**
* Client-side redirect to the sign-in route (TanStack `<Navigate>` — NOT a full
* `window.location` reload). A hard navigation re-bootstraps the SPA and re-runs
* session loading, which feels like a second "Loading…" on /login.
*
* Guard routes by waiting out `isPending` first (see `use-current-user`), then
* render this.
*/
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to });
}
//#endregion
//#region src/lib/page-visible.ts
/** Run `fn` immediately and on an interval, skipping ticks while the tab is hidden. */
function onVisibleInterval(ms, fn) {
	if (typeof window === "undefined") return () => {};
	let timer = 0;
	const tick = () => {
		if (document.hidden) return;
		fn();
	};
	fn();
	timer = window.setInterval(tick, ms);
	const onVis = () => {
		if (!document.hidden) fn();
	};
	document.addEventListener("visibilitychange", onVis);
	return () => {
		window.clearInterval(timer);
		document.removeEventListener("visibilitychange", onVis);
	};
}
//#endregion
//#region src/components/support-dock.tsx
var HIDDEN = [
	/^\/admin/,
	/^\/board/,
	/^\/login/,
	/^\/verify-2fa/,
	/^\/auth/,
	/^\/help/,
	/^\/pair-printer/,
	/^\/checkout/
];
function prefersReducedMotion() {
	return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function isScrollable(el) {
	if (!(el instanceof HTMLElement)) return false;
	const style = window.getComputedStyle(el);
	if (!/(auto|scroll|overlay)/.test(style.overflowY)) return false;
	return el.scrollHeight > el.clientHeight + 2;
}
function scrollPageToTop() {
	const behavior = prefersReducedMotion() ? "auto" : "smooth";
	const header = document.getElementById("shop-top") ?? document.querySelector(".shop-header");
	const nodes = /* @__PURE__ */ new Set();
	let node = header instanceof HTMLElement ? header : document.body;
	while (node) {
		if (isScrollable(node)) nodes.add(node);
		node = node.parentElement;
	}
	if (document.scrollingElement instanceof HTMLElement) nodes.add(document.scrollingElement);
	nodes.add(document.documentElement);
	if (document.body) nodes.add(document.body);
	document.querySelectorAll(".app-root, .shop-shell, .shop-main, .store-layout").forEach((el) => {
		if (isScrollable(el) || el.scrollTop > 0) nodes.add(el);
	});
	const jump = (smooth) => {
		const how = smooth ? behavior : "auto";
		try {
			window.scrollTo({
				top: 0,
				left: 0,
				behavior: how
			});
		} catch {
			window.scrollTo(0, 0);
		}
		try {
			window.parent?.scrollTo?.({
				top: 0,
				left: 0,
				behavior: how
			});
		} catch {}
		for (const el of nodes) try {
			el.scrollTo({
				top: 0,
				left: 0,
				behavior: how
			});
		} catch {
			el.scrollTop = 0;
		}
		if (header instanceof HTMLElement) try {
			header.scrollIntoView({
				block: "start",
				inline: "nearest",
				behavior: how
			});
		} catch {}
	};
	jump(true);
	window.requestAnimationFrame(() => {
		if ((window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0) > 4) jump(false);
	});
	window.setTimeout(() => {
		if ((window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0) > 4) jump(false);
	}, 320);
}
function SupportDock() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { user, isPending } = useCurrentUserState();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [unread, setUnread] = (0, import_react.useState)(0);
	const [phone, setPhone] = (0, import_react.useState)(RESTAURANT.phone);
	const [phoneHref, setPhoneHref] = (0, import_react.useState)(RESTAURANT.phoneHref);
	const [titleVisible, setTitleVisible] = (0, import_react.useState)(true);
	const hide = HIDDEN.some((re) => re.test(pathname));
	(0, import_react.useEffect)(() => {
		const el = document.querySelector(".shop-header");
		if (!el) {
			setTitleVisible(false);
			return;
		}
		const io = new IntersectionObserver(([entry]) => setTitleVisible(Boolean(entry?.isIntersecting)), { threshold: 0 });
		io.observe(el);
		return () => io.disconnect();
	}, [pathname]);
	(0, import_react.useEffect)(() => {
		getShopContact().then((d) => {
			setPhone(d.phone);
			setPhoneHref(d.phoneHref);
		}).catch(() => void 0);
	}, []);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) {
			setUnread(0);
			return;
		}
		return onVisibleInterval(open ? 8e3 : 3e4, () => {
			getMe().then((p) => {
				setUnread(p.unreadChats);
			}).catch(() => void 0);
		});
	}, [
		isPending,
		user,
		open
	]);
	if (hide) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "support-dock no-print",
		children: [open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "dock-panel",
			"aria-label": "Chat with the shop",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "dock-panel-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "shop-brand-kicker",
						children: "South End Pizza III"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Chat" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-icon-btn",
						"aria-label": "Close chat",
						onClick: () => setOpen(false),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							size: 16,
							strokeWidth: 2.2
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SignedOut, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Sign in to message the shop. Calling does not need an account."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					search: { next: pathname },
					className: "btn-print",
					children: "Sign in to chat"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerChat, { compact: true }) })
			]
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "dock-fabs",
			children: [
				!titleVisible ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "dock-fab dock-top",
					"aria-label": "Back to top",
					onClick: scrollPageToTop,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
						size: 20,
						strokeWidth: 2.2
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Top" })]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					className: "dock-fab dock-call",
					href: phoneHref,
					"aria-label": `Call the shop at ${phone}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
						size: 20,
						strokeWidth: 2.2
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Call" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "dock-fab dock-chat",
					"aria-label": "Chat with the shop",
					"aria-expanded": open,
					onClick: () => setOpen((v) => !v),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
							size: 20,
							strokeWidth: 2.2
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Chat" }),
						unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
							className: "nav-pip",
							children: unread
						}) : null
					]
				})
			]
		})]
	});
}
//#endregion
//#region src/lib/push-client.ts
function urlBase64ToUint8Array(base64) {
	const pad = "=".repeat((4 - base64.length % 4) % 4);
	const raw = atob(base64.replace(/-/g, "+").replace(/_/g, "/") + pad);
	const out = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
	return out;
}
async function registerShopWorker() {
	if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
	try {
		return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
	} catch {
		return null;
	}
}
async function enableOrderAlerts() {
	if (typeof window === "undefined" || !("Notification" in window)) throw new Error("This browser cannot show order alerts.");
	const reg = await registerShopWorker();
	if (!reg) throw new Error("Could not install the shop app worker.");
	if (await Notification.requestPermission() !== "granted") throw new Error("Alerts were not allowed on this device.");
	let pushOn = false;
	try {
		const vapid = await getVapidPublicKey();
		const key = String(vapid?.publicKey ?? "");
		if (key && "pushManager" in reg) {
			await savePushSubscription({ data: { subscription: (await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(key)
			})).toJSON() } });
			pushOn = true;
		}
	} catch {}
	await reg.showNotification("South End Pizza", {
		body: pushOn ? "Order alerts are on. We’ll ping you when your food is ready." : "Alerts are on for this device. Keep the app installed to get Ready pings.",
		icon: "/icon-192.png"
	});
	return {
		ok: true,
		push: pushOn
	};
}
//#endregion
//#region src/components/order-alerts.tsx
/** Registers the shop service worker quietly. Permission is requested only from Enable alerts. */
function OrderAlerts() {
	(0, import_react.useEffect)(() => {
		registerShopWorker();
	}, []);
	return null;
}
function EnableAlertsButton({ compact }) {
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [msg, setMsg] = (0, import_react.useState)("");
	const [on, setOn] = (0, import_react.useState)(false);
	const [supported, setSupported] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		setSupported("Notification" in window);
	}, []);
	if (!supported) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: compact ? "alerts-cta alerts-cta-compact" : "alerts-cta",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: compact ? "ed-btn" : "btn-print",
			disabled: busy || on,
			onClick: () => {
				setBusy(true);
				setMsg("");
				enableOrderAlerts().then(() => {
					setOn(true);
					setMsg("Order alerts are on.");
				}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not enable alerts.")).finally(() => setBusy(false));
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
				size: 16,
				strokeWidth: 2.2
			}), busy ? "Allowing…" : on ? "Alerts on" : "Enable order alerts"]
		}), msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "ed-sub",
			children: msg
		}) : null]
	});
}
//#endregion
//#region src/styles.css?url
var styles_default = "/assets/styles-5TUlS9FF.css";
//#endregion
//#region src/routes/__root.tsx
var APP_NAME = "South End Pizza III";
var Route$29 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Order from South End Pizza III in Egg Harbor Township, NJ. Pizza, subs, wings, and more — pickup or delivery."
			},
			{
				name: "theme-color",
				content: "#fbf6ec"
			},
			{
				name: "apple-mobile-web-app-title",
				content: "South End"
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "default"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/icon-32.png"
			},
			{
				rel: "apple-touch-icon",
				href: "/icon-180.png"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "preload",
				href: "/mark.jpg",
				as: "image"
			},
			{
				rel: "preload",
				href: "/mark-sm.jpg",
				as: "image"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:wght@500;600;700&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		className: "antialiased",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				className: "skip-link",
				href: "#main",
				children: "Skip to content"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "app-root",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopBackdrop, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeasonFx, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartHydrate, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SupportDock, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderAlerts, {})
					] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
//#endregion
//#region src/components/brand-mark.tsx
var SMALL = /* @__PURE__ */ new Set(["stamp", "mast"]);
function BrandMark({ variant = "stamp", className = "" }) {
	const compact = SMALL.has(variant);
	const fallback = compact ? DEFAULT_LOGO_SM : DEFAULT_LOGO;
	const [src, setSrc] = (0, import_react.useState)(fallback);
	(0, import_react.useEffect)(() => {
		const sync = () => {
			const custom = document.documentElement.dataset.shopLogo || "";
			setSrc(custom || fallback);
		};
		sync();
		window.addEventListener(SHOP_LOGO_EVENT, sync);
		return () => window.removeEventListener(SHOP_LOGO_EVENT, sync);
	}, [fallback]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `brand-mark brand-mark-${variant} ${className}`.trim(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src,
			alt: "South End Pizza III — a chicken riding a buffalo",
			width: compact ? 192 : 800,
			height: compact ? 192 : 800,
			decoding: "async",
			fetchPriority: variant === "hero" || variant === "stamp" ? "high" : "low"
		})
	});
}
//#endregion
//#region src/lib/admin-inbox.ts
var ADMIN_INBOX_EVENT = "southend-admin-inbox";
function emitAdminInbox(count) {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new CustomEvent(ADMIN_INBOX_EVENT, { detail: Math.max(0, Math.round(count)) }));
}
function onAdminInbox(fn) {
	if (typeof window === "undefined") return () => {};
	const handler = (e) => {
		const n = e.detail;
		if (typeof n === "number" && Number.isFinite(n)) fn(n);
	};
	window.addEventListener(ADMIN_INBOX_EVENT, handler);
	return () => window.removeEventListener(ADMIN_INBOX_EVENT, handler);
}
//#endregion
//#region src/lib/referral.ts
var KEY = "se3-invite-code";
var CODE = /^[A-Z0-9]{4,16}$/;
function normalizeInviteCode(raw) {
	const s = String(raw ?? "").trim().toUpperCase();
	return CODE.test(s) ? s : "";
}
function captureReferral(raw) {
	if (typeof window === "undefined") return;
	let code = normalizeInviteCode(raw);
	if (!code) try {
		code = normalizeInviteCode(new URLSearchParams(window.location.search).get("ref"));
	} catch {
		code = "";
	}
	if (!code) return;
	try {
		window.localStorage.setItem(KEY, code);
	} catch {}
}
function peekReferral() {
	if (typeof window === "undefined") return "";
	try {
		return normalizeInviteCode(window.localStorage.getItem(KEY));
	} catch {
		return "";
	}
}
function clearReferral() {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(KEY);
	} catch {}
}
//#endregion
//#region src/components/shop-header.tsx
function accountLabel(profile, user) {
	const raw = String(profile?.displayName || user?.displayName || "").trim();
	if (raw) return raw;
	const email = String(profile?.email || user?.primaryEmail || "").trim();
	const at = email.indexOf("@");
	if (at > 0) return email.slice(0, at);
	return "You";
}
function AccountAvatar({ src, name, size = 40 }) {
	if (src) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		className: "account-avatar",
		src,
		alt: "",
		width: size,
		height: size
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "account-avatar account-avatar-fallback",
		style: {
			width: size,
			height: size
		},
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
			size: Math.round(size * .52),
			strokeWidth: 2.2
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: name
		})]
	});
}
function SignOutItem() {
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const [outMsg, setOutMsg] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		role: "menuitem",
		className: "account-menu-out",
		disabled: signingOut,
		onClick: () => {
			setSigningOut(true);
			setOutMsg("");
			signOut().catch((e) => {
				setSigningOut(false);
				setOutMsg(e instanceof Error ? e.message : "Could not sign out. Try again.");
			});
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {
			size: 16,
			strokeWidth: 2.2,
			"aria-hidden": true
		}), signingOut ? "Signing out…" : "Sign out"]
	}), outMsg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "ed-sub account-menu-out-msg",
		children: outMsg
	}) : null] });
}
function AccountMenu({ label, email, phone, points, avatarUrl, isAdmin, adminModeAllowed, adminUnread, unreadChats, adminExists, onAdminMode, togglingMode }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const wrapRef = (0, import_react.useRef)(null);
	const prettyPhone = phone ? formatPhone(phone) || phone : "";
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onDoc = (e) => {
			if (!wrapRef.current?.contains(e.target)) setOpen(false);
		};
		const onKey = (e) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		window.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDoc);
			window.removeEventListener("keydown", onKey);
		};
	}, [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "account-menu",
		ref: wrapRef,
		"data-open": open ? "true" : void 0,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "shop-nav-link shop-nav-avatar-btn",
			"aria-expanded": open,
			"aria-haspopup": "menu",
			"aria-label": `Account menu, ${label}`,
			onClick: () => setOpen((v) => !v),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountAvatar, {
				src: avatarUrl,
				name: label,
				size: 40
			}), adminUnread + unreadChats > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "nav-pip",
				children: adminUnread + unreadChats
			}) : null]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "account-menu-pop",
			role: "menu",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "account-menu-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountAvatar, {
						src: avatarUrl,
						name: label,
						size: 48
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "account-menu-card-copy",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: label }),
							isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "admin-mode-badge",
								children: "Admin"
							}) : null,
							email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: email }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								points,
								" pts",
								prettyPhone ? ` · ${prettyPhone}` : ""
							] })
						]
					})]
				}),
				isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/admin/pos",
					role: "menuitem",
					onClick: () => setOpen(false),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, {
						size: 16,
						strokeWidth: 2.2,
						"aria-hidden": true
					}), "POS"]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/account",
					role: "menuitem",
					onClick: () => setOpen(false),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
						size: 16,
						strokeWidth: 2.2,
						"aria-hidden": true
					}), "Your account"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/install",
					role: "menuitem",
					className: "account-menu-app",
					onClick: () => setOpen(false),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/icon-180.png",
						alt: "",
						width: 20,
						height: 20,
						className: "account-menu-app-icon"
					}), "Download App"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/help",
					role: "menuitem",
					onClick: () => setOpen(false),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, {
							size: 16,
							strokeWidth: 2.2,
							"aria-hidden": true
						}),
						"Help",
						unreadChats > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "nav-pip",
							children: unreadChats
						}) : null
					]
				}),
				isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/admin/menu",
					search: {},
					role: "menuitem",
					onClick: () => setOpen(false),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Monitor, {
							size: 16,
							strokeWidth: 2.2,
							"aria-hidden": true
						}),
						"Admin",
						adminUnread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "nav-pip",
							children: adminUnread
						}) : null
					]
				}) : null,
				!isAdmin && !adminExists ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/admin/menu",
					search: {},
					role: "menuitem",
					onClick: () => setOpen(false),
					children: "Shop admin"
				}) : null,
				adminModeAllowed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "account-menu-admin",
					onClick: (e) => e.stopPropagation(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Admin mode", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: isAdmin ? "Desk is on for this account" : "Enter the shop desk" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "toggle",
						type: "checkbox",
						role: "menuitemcheckbox",
						checked: isAdmin,
						disabled: togglingMode,
						onChange: (e) => onAdminMode(e.target.checked)
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignOutItem, {})
			]
		}) : null]
	});
}
function ShopHeader({ title, profile, onOpenCart }) {
	const { isPending, user } = useCurrentUserState();
	const [authReady, setAuthReady] = (0, import_react.useState)(false);
	const [adminUnread, setAdminUnread] = (0, import_react.useState)(profile?.adminInbox ?? 0);
	const [liveProfile, setLiveProfile] = (0, import_react.useState)(profile ?? null);
	const [modeBusy, setModeBusy] = (0, import_react.useState)(false);
	const lines = useCartStore((s) => s.lines);
	const bagOpen = useCartStore((s) => s.bagOpen);
	const { count } = cartTotals(lines);
	const isAdmin = liveProfile?.role === "admin" || Boolean(liveProfile?.adminMode);
	const headerRef = (0, import_react.useRef)(null);
	const avatarUrl = liveProfile?.avatarUrl || user?.profileImageUrl || "";
	(0, import_react.useEffect)(() => {
		setLiveProfile(profile ?? null);
	}, [profile]);
	(0, import_react.useEffect)(() => {
		setAuthReady(true);
		captureReferral();
	}, []);
	(0, import_react.useEffect)(() => {
		if (isPending || !user) return;
		const code = peekReferral();
		if (!code) return;
		claimReferral({ data: { code } }).then(() => clearReferral()).catch(() => clearReferral());
	}, [isPending, user]);
	(0, import_react.useEffect)(() => {
		setAdminUnread(liveProfile?.adminInbox ?? 0);
	}, [liveProfile?.adminInbox]);
	(0, import_react.useEffect)(() => {
		const el = headerRef.current;
		if (!el) return;
		const apply = () => {
			document.documentElement.style.setProperty("--shop-sticky-top", `${el.offsetHeight}px`);
		};
		apply();
		const ro = new ResizeObserver(apply);
		ro.observe(el);
		return () => ro.disconnect();
	}, [
		isAdmin,
		adminUnread,
		count,
		authReady,
		isPending,
		user,
		avatarUrl
	]);
	(0, import_react.useEffect)(() => {
		if (!isAdmin) return;
		const stopListen = onAdminInbox(setAdminUnread);
		const stopPoll = onVisibleInterval(1e4, () => {
			getAdminInboxCount().then((r) => setAdminUnread(r.unread)).catch(() => void 0);
		});
		return () => {
			stopListen();
			stopPoll();
		};
	}, [isAdmin]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "shop-header no-print",
		id: "shop-top",
		ref: headerRef,
		"data-staff": isAdmin ? "true" : void 0,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "shop-header-inner",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "shop-brand",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { variant: "stamp" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "shop-brand-text",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shop-brand-kicker",
							children: "Egg Harbor Township"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shop-brand-name",
							children: title ?? "South End Pizza III"
						})]
					})]
				}),
				authReady && !isPending && user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "shop-nav",
					"aria-label": "Shop",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountMenu, {
						label: accountLabel(liveProfile, user),
						email: liveProfile?.email || user.primaryEmail || "",
						phone: liveProfile?.phone || "",
						points: liveProfile?.points ?? 0,
						avatarUrl,
						isAdmin,
						adminModeAllowed: Boolean(liveProfile?.adminModeAllowed),
						adminUnread,
						unreadChats: liveProfile?.unreadChats ?? 0,
						adminExists: liveProfile?.adminExists ?? true,
						togglingMode: modeBusy,
						onAdminMode: (on) => {
							setModeBusy(true);
							setAdminMode({ data: { on } }).then((r) => {
								setLiveProfile((prev) => prev ? {
									...prev,
									adminMode: r.adminMode,
									adminModeAllowed: r.adminModeAllowed,
									role: r.role
								} : prev);
								if (!on && typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) window.location.assign("/");
							}).catch(() => void 0).finally(() => setModeBusy(false));
						}
					})
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "shop-header-actions",
					children: [
						!authReady || isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "header-account-wait",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PizzaSpinner, { size: "sm" })
						}) : null,
						authReady && !isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedOut, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/login",
							className: "btn-ghost",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
								size: 16,
								strokeWidth: 2.2
							}), "Sign in"]
						}) }) : null,
						onOpenCart ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn-print cart-btn",
							onClick: onOpenCart,
							"aria-expanded": bagOpen,
							"aria-haspopup": "dialog",
							"aria-controls": "bag",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, {
									size: 18,
									strokeWidth: 2.2
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "cart-btn-label",
									children: "Cart"
								}),
								count ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "cart-count",
									"aria-live": "polite",
									children: count
								}) : null
							]
						}) : null
					]
				})
			]
		})
	});
}
//#endregion
//#region src/components/cook-note-field.tsx
/** Uncontrolled so typing never remounts or steals focus from the cook note. */
function CookNoteField({ id, noteRef, placeholder }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ed-field pizza-modal-block pizza-cook-field",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
			htmlFor: id,
			children: "Note for the cook"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			id,
			ref: noteRef,
			className: "ed-input ed-area",
			rows: 2,
			maxLength: 160,
			defaultValue: "",
			placeholder,
			autoComplete: "off",
			autoCorrect: "on",
			spellCheck: true,
			enterKeyHint: "done",
			onPointerDown: (e) => e.stopPropagation(),
			onFocus: (e) => {
				const el = e.currentTarget;
				window.requestAnimationFrame(() => el.scrollIntoView({
					block: "center",
					inline: "nearest"
				}));
			}
		})]
	});
}
function cookNoteValue(ref) {
	return (ref.current?.value ?? "").trim().slice(0, 160);
}
//#endregion
//#region src/lib/dialog-lock.ts
/** Lock page scroll for a modal. Focus the panel once — never steal it back from inputs. */
function useDialogLock(onClose, panelRef) {
	const closeRef = (0, import_react.useRef)(onClose);
	closeRef.current = onClose;
	(0, import_react.useEffect)(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const root = panelRef.current;
		const active = document.activeElement;
		if (!active || !root?.contains(active)) root?.focus();
		const onKey = (e) => {
			if (e.key === "Escape") closeRef.current();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = prev;
			window.removeEventListener("keydown", onKey);
		};
	}, [panelRef]);
}
//#endregion
//#region src/components/item-confirm.tsx
function priceNum$3(p) {
	const n = Number(String(p).replace(/^\$/, ""));
	return Number.isFinite(n) ? n : 0;
}
function ItemConfirm({ item, categoryName, categoryId, onClose, onConfirm }) {
	const titleId = (0, import_react.useId)();
	const noteId = (0, import_react.useId)();
	const panelRef = (0, import_react.useRef)(null);
	const noteRef = (0, import_react.useRef)(null);
	const sizes = item.prices.filter((p) => p.price);
	const [size, setSize] = (0, import_react.useState)(sizes[0]?.label || "");
	const [qty, setQty] = (0, import_react.useState)({});
	const isWings = categoryId === "wings" || /wing/i.test(item.name) || /wing/i.test(categoryName);
	const pack = parseWingQty(sizes[0]?.label) || 10;
	const [pieceQty, setPieceQty] = (0, import_react.useState)(isWings ? pack : pack);
	const condiments = item.condiments ?? [];
	useDialogLock(onClose, panelRef);
	const chosen = sizes.find((p) => p.label === size) ?? sizes[0];
	const picks = condiments.map((c) => {
		const n = qty[c.id] ?? 0;
		if (n <= 0) return null;
		return {
			id: c.id,
			name: c.name,
			qty: n,
			charge: condimentCharge(c, n)
		};
	}).filter((p) => Boolean(p));
	const extras = condimentTotal(picks);
	const base = priceNum$3(chosen?.price ?? "0");
	const bags = pieceQty / Math.max(pack, 1);
	const unitPrice = isWings ? Math.round((base * bags + extras) * 100) / 100 : Math.round((base + extras) * 100) / 100;
	const detail = condimentDetail(picks);
	function confirm() {
		const note = cookNoteValue(noteRef);
		if (isWings) {
			onConfirm({
				size: `${pieceQty} pc`,
				unitPrice,
				detail: detail || void 0,
				comment: note || void 0,
				condiments: picks,
				qty: 1
			});
			return;
		}
		onConfirm({
			size: chosen?.label || size || void 0,
			unitPrice,
			detail: detail || void 0,
			comment: note || void 0,
			condiments: picks
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pizza-modal-root",
		role: "presentation",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "pizza-modal-scrim",
			"aria-label": "Close",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: panelRef,
			className: "pizza-modal size-add-modal",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": titleId,
			tabIndex: -1,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "pizza-modal-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "shop-brand-kicker",
							children: categoryName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: titleId,
							children: item.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: "Confirm this item, add extras, and leave a note for the cook."
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-icon-btn",
						"aria-label": "Close",
						onClick: onClose,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							size: 16,
							strokeWidth: 2.2
						})
					})]
				}),
				isWings ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "pizza-modal-block",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Quantity" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: "Wings sell in sets of 10 (min 10)."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "qty-step wings-qty-step",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": "Fewer wings",
									disabled: pieceQty <= pack,
									onClick: () => setPieceQty((n) => snapWingQty(n - pack)),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { size: 14 })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
									"aria-live": "polite",
									children: pieceQty
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": "More wings",
									onClick: () => setPieceQty((n) => snapWingQty(n + pack)),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 })
								})
							]
						})
					]
				}) : sizes.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "pizza-modal-block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Size" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-pick pizza-size-pick",
						role: "group",
						"aria-label": "Size",
						children: sizes.map((p) => {
							const lab = p.label || "Regular";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"data-on": (chosen?.label || "") === lab,
								onClick: () => setSize(lab),
								children: [lab, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatUsd(priceNum$3(p.price)) })]
							}, lab);
						})
					})]
				}) : null,
				condiments.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "pizza-modal-block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Condiments & extras" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "condiment-list",
						children: condiments.map((c) => {
							const cap = condimentMax(c.maxQty);
							const n = qty[c.id] ?? 0;
							const add = moneyNumber(c.price);
							const extra = moneyNumber(c.extraPrice || c.price);
							const step = /ranch|blue\s*cheese|dip/i.test(c.name) && isWings ? 2 : 1;
							const nextDown = Math.max(0, n - step);
							const nextUp = Math.min(cap, n + step);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: c.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
								add > 0 ? `${formatUsd(add)} to add` : "Included",
								extra > 0 ? ` · extra ${formatUsd(extra)}` : "",
								` · up to ${cap}`
							] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "qty-step",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": `Fewer ${c.name}`,
										disabled: n <= 0,
										onClick: () => setQty((cur) => ({
											...cur,
											[c.id]: nextDown
										})),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { size: 14 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: n }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": `More ${c.name}`,
										disabled: n >= cap,
										onClick: () => setQty((cur) => ({
											...cur,
											[c.id]: nextUp
										})),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 })
									})
								]
							})] }, c.id);
						})
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CookNoteField, {
					id: noteId,
					noteRef,
					placeholder: "e.g. no onions, sauce on the side"
				}, item.id || item.name),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "pizza-modal-foot",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pizza-modal-total",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "This item" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatUsd(unitPrice) })]
						}),
						detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: detail
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pizza-modal-actions",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ed-btn",
								onClick: onClose,
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn-print",
								onClick: confirm,
								children: "Add to bag"
							})]
						})
					]
				})
			]
		})]
	});
}
//#endregion
//#region src/data/item-photos.ts
var ROOT = "/food";
function src(key) {
	return `${ROOT}/${key}.webp`;
}
var CAT_FALLBACK = {
	pizza: "cheese-pizza",
	gourmet: "white-pizza",
	appetizers: "fries",
	salads: "tossed-salad",
	sides: "garlic-bread",
	wings: "wings",
	turnovers: "stromboli",
	sandwiches: "turkey-sandwich",
	clubs: "club",
	"hot-subs": "chicken-parm-sub",
	"cold-subs": "italian-sub",
	"steak-subs": "cheesesteak",
	burgers: "hamburger",
	wraps: "chicken-wrap",
	gyros: "gyro",
	pasta: "pasta-marinara",
	desserts: "cheesecake",
	beverages: "soda"
};
var RULES = [
	{
		key: "apple-juice",
		test: (h) => h.includes("apple juice")
	},
	{
		key: "iced-tea",
		test: (h) => h.includes("iced tea") || h.includes("ice tea") || h.includes("brisk") || h.includes("pure leaf")
	},
	{
		key: "soda",
		test: (h, c) => c === "beverages" || /\bsoda\b/.test(h)
	},
	{
		key: "cannoli",
		test: (h) => h.includes("cannoli")
	},
	{
		key: "chocolate-cake",
		test: (h) => h.includes("chocolate") && h.includes("cake")
	},
	{
		key: "cheesecake",
		test: (h) => h.includes("cheesecake")
	},
	{
		key: "panzarotti",
		test: (h) => h.includes("panzarotti")
	},
	{
		key: "calzone",
		test: (h) => h.includes("calzone")
	},
	{
		key: "stromboli",
		test: (h) => h.includes("stromboli")
	},
	{
		key: "gyro",
		test: (h) => h.includes("gyro")
	},
	{
		key: "fajita-wrap",
		test: (h) => h.includes("fajita")
	},
	{
		key: "chicken-wrap",
		test: (h, c) => c === "wraps" || h.includes("wrap")
	},
	{
		key: "spaghetti-clams",
		test: (h) => h.includes("clam")
	},
	{
		key: "manicotti",
		test: (h) => h.includes("manicotti")
	},
	{
		key: "ravioli",
		test: (h) => h.includes("ravioli")
	},
	{
		key: "baked-ziti",
		test: (h) => h.includes("baked ziti")
	},
	{
		key: "spaghetti-meatballs",
		test: (h) => h.includes("meatball") && (h.includes("pasta") || h.includes("spaghetti") || h.includes("ziti"))
	},
	{
		key: "chicken-parm-pasta",
		test: (h, c) => c === "pasta" && (h.includes("parmigiana") || h.includes("parm"))
	},
	{
		key: "pasta-marinara",
		test: (h, c) => c === "pasta" || h.includes("spaghetti") && !h.includes("sub")
	},
	{
		key: "double-cheeseburger",
		test: (h) => h.includes("double") && h.includes("burger")
	},
	{
		key: "bacon-cheeseburger",
		test: (h) => h.includes("bacon") && h.includes("burger")
	},
	{
		key: "cheeseburger",
		test: (h) => h.includes("cheeseburger") || h.includes("burger") && (h.includes("cheese") || h.includes("pizza burger") || h.includes("western"))
	},
	{
		key: "hamburger",
		test: (h) => h.includes("hamburger") || h.includes("burger")
	},
	{
		key: "pizza-steak",
		test: (h) => h.includes("pizza steak")
	},
	{
		key: "chicken-cheesesteak",
		test: (h) => h.includes("chicken") && (h.includes("cheesesteak") || h.includes("chicken steak") || h.includes("chicken cheesesteak"))
	},
	{
		key: "veggie-sub",
		test: (h, c) => h.includes("veggie sub") || c === "steak-subs" && h.includes("veggie")
	},
	{
		key: "cheesesteak",
		test: (h) => h.includes("cheesesteak") || h.includes("steak") && h.includes("sub")
	},
	{
		key: "italian-sub",
		test: (h) => h.includes("italian") && h.includes("sub")
	},
	{
		key: "meatball-sub",
		test: (h) => h.includes("meatball") && h.includes("sub")
	},
	{
		key: "sausage-sub",
		test: (h) => h.includes("sausage") && h.includes("sub")
	},
	{
		key: "eggplant-sub",
		test: (h) => h.includes("eggplant") && (h.includes("sub") || h.includes("hot"))
	},
	{
		key: "chicken-parm-sub",
		test: (h, c) => c === "hot-subs"
	},
	{
		key: "turkey-sandwich",
		test: (h, c) => h.includes("turkey") && (c === "cold-subs" || h.includes("sub"))
	},
	{
		key: "tuna-sandwich",
		test: (h, c) => h.includes("tuna") && (c === "cold-subs" || h.includes("sub"))
	},
	{
		key: "ham-sandwich",
		test: (h, c) => (h.includes("ham") || h.includes("salami")) && (c === "cold-subs" || h.includes("sub"))
	},
	{
		key: "blt",
		test: (h) => /\bblt\b/.test(h)
	},
	{
		key: "club",
		test: (h, c) => c === "clubs" || h.includes("club")
	},
	{
		key: "chicken-sandwich",
		test: (h, c) => c === "sandwiches" && h.includes("chicken")
	},
	{
		key: "tuna-sandwich",
		test: (h, c) => (c === "sandwiches" || h.includes("sandwich")) && h.includes("tuna")
	},
	{
		key: "ham-sandwich",
		test: (h, c) => (c === "sandwiches" || h.includes("sandwich")) && h.includes("ham")
	},
	{
		key: "turkey-sandwich",
		test: (h, c) => c === "sandwiches" || h.includes("sandwich")
	},
	{
		key: "nuggets",
		test: (h) => h.includes("nugget")
	},
	{
		key: "wings",
		test: (h) => h.includes("wing")
	},
	{
		key: "buffalo-tenders",
		test: (h) => h.includes("buffalo") && (h.includes("tender") || h.includes("finger"))
	},
	{
		key: "tenders",
		test: (h) => (h.includes("tender") || h.includes("finger")) && !h.includes("salad")
	},
	{
		key: "pizza-bread",
		test: (h) => h.includes("pizza bread")
	},
	{
		key: "poppers",
		test: (h) => h.includes("popper")
	},
	{
		key: "mozz-sticks",
		test: (h) => h.includes("mozzarella stick")
	},
	{
		key: "loaded-fries",
		test: (h) => h.includes("south end") && h.includes("fries") || h.includes("buffalo fries")
	},
	{
		key: "cheese-fries",
		test: (h) => h.includes("cheesy") && h.includes("fries")
	},
	{
		key: "curly-fries",
		test: (h) => h.includes("curly")
	},
	{
		key: "onion-rings",
		test: (h) => h.includes("onion ring")
	},
	{
		key: "fries",
		test: (h) => h.includes("fries") || h.includes("french fry")
	},
	{
		key: "cheesy-garlic-bread",
		test: (h) => h.includes("cheesy garlic") || h.includes("garlic bread") && h.includes("cheese")
	},
	{
		key: "garlic-bread",
		test: (h) => h.includes("garlic bread")
	},
	{
		key: "sausage-link",
		test: (h, c) => c === "sides" && h.includes("sausage")
	},
	{
		key: "meatballs",
		test: (h, c) => c === "sides" && h.includes("meatball")
	},
	{
		key: "pasta-marinara",
		test: (h, c) => c === "sides" && h.includes("pasta")
	},
	{
		key: "antipasto",
		test: (h) => h.includes("antipasto")
	},
	{
		key: "greek-salad",
		test: (h) => h.includes("greek") && h.includes("salad")
	},
	{
		key: "chicken-caesar",
		test: (h) => h.includes("salad") && (h.includes("chicken") || h.includes("blackened") || h.includes("cajun") || h.includes("tender"))
	},
	{
		key: "caesar-salad",
		test: (h) => h.includes("caesar")
	},
	{
		key: "tuna-salad",
		test: (h) => h.includes("tuna") && h.includes("salad")
	},
	{
		key: "chef-salad",
		test: (h) => h.includes("chef") || h.includes("turkey") && h.includes("salad")
	},
	{
		key: "tossed-salad",
		test: (h, c) => c === "salads" || h.includes("salad")
	},
	{
		key: "cbr-pizza",
		test: (h) => h.includes("c.b.r") || /\bcbr\b/.test(h) || h.includes("ranch") && h.includes("pizza")
	},
	{
		key: "buffalo-chicken-pizza",
		test: (h) => h.includes("buffalo") && h.includes("pizza")
	},
	{
		key: "bbq-chicken-pizza",
		test: (h) => h.includes("bbq") && h.includes("pizza")
	},
	{
		key: "hawaiian-pizza",
		test: (h) => h.includes("hawaiian") || h.includes("pineapple")
	},
	{
		key: "mexicana-pizza",
		test: (h) => h.includes("mexicana") || h.includes("jalapeno") && h.includes("pizza")
	},
	{
		key: "greek-pizza",
		test: (h) => h.includes("greek") && h.includes("pizza")
	},
	{
		key: "white-pizza",
		test: (h) => h.includes("white") && h.includes("pizza") || h.includes("richie")
	},
	{
		key: "italian-pizza",
		test: (h) => h.includes("bonzano") || h.includes("capicola") && h.includes("pizza")
	},
	{
		key: "meat-lovers-pizza",
		test: (h) => h.includes("meat lover")
	},
	{
		key: "veggie-pizza",
		test: (h) => h.includes("veggie pizza")
	},
	{
		key: "chicken-pizza",
		test: (h) => h.includes("chicken") && h.includes("pizza")
	},
	{
		key: "pepperoni-pizza",
		test: (h) => h.includes("pepperoni") && h.includes("pizza")
	},
	{
		key: "sausage-pizza",
		test: (h) => h.includes("sausage") && h.includes("pizza")
	},
	{
		key: "beef-pizza",
		test: (h) => h.includes("beef") && h.includes("pizza")
	},
	{
		key: "ham-pizza",
		test: (h) => h.includes("ham") && h.includes("pizza")
	},
	{
		key: "bacon-pizza",
		test: (h) => h.includes("bacon") && h.includes("pizza")
	},
	{
		key: "mushroom-pizza",
		test: (h) => h.includes("mushroom") && h.includes("pizza")
	},
	{
		key: "peppers-pizza",
		test: (h) => h.includes("green pepper") || h.includes("pepper") && h.includes("pizza") && !h.includes("pepperoni")
	},
	{
		key: "olive-pizza",
		test: (h) => h.includes("olive") && h.includes("pizza")
	},
	{
		key: "onion-pizza",
		test: (h) => h.includes("onion") && h.includes("pizza")
	},
	{
		key: "spinach-pizza",
		test: (h) => h.includes("spinach") && h.includes("pizza")
	},
	{
		key: "broccoli-pizza",
		test: (h) => h.includes("broccoli") && h.includes("pizza")
	},
	{
		key: "cheese-pizza",
		test: (h, c) => c === "pizza" || c === "gourmet" || h.includes("pizza")
	}
];
function haystack(item, catId) {
	return `${item.name} ${item.description ?? ""} ${catId ?? ""}`.toLowerCase();
}
function placeholderPhoto(item, catId) {
	const h = haystack(item, catId);
	const cat = (catId ?? "").toLowerCase();
	for (const rule of RULES) if (rule.test(h, cat)) return src(rule.key);
	return src(CAT_FALLBACK[cat] ?? "cheese-pizza");
}
function itemPhoto(item, catId) {
	const custom = String(item.image ?? "").trim();
	if (custom) return custom;
	return placeholderPhoto(item, catId);
}
//#endregion
//#region src/components/pizza-customize.tsx
function PizzaCustomize({ item, categoryId, settings, initialSize, onClose, onConfirm }) {
	const titleId = (0, import_react.useId)();
	const noteId = (0, import_react.useId)();
	const panelRef = (0, import_react.useRef)(null);
	const noteRef = (0, import_react.useRef)(null);
	const first = item.prices[0];
	const [size, setSize] = (0, import_react.useState)(initialSize || first?.label || "LG");
	const [picks, setPicks] = (0, import_react.useState)({});
	const [condQty, setCondQty] = (0, import_react.useState)({});
	const condiments = item.condiments ?? [];
	const photo = item.hideImage ? "" : itemPhoto(item, categoryId);
	useDialogLock(onClose, panelRef);
	const toppings = Object.entries(picks).filter(([, side]) => side && side !== "off").map(([id, side]) => ({
		id,
		side
	}));
	const priced = pricePizzaBuild({
		item,
		other: null,
		size,
		toppings,
		settings
	});
	const condPicks = condiments.map((c) => {
		const n = condQty[c.id] ?? 0;
		if (n <= 0) return null;
		return {
			id: c.id,
			name: c.name,
			qty: n,
			charge: condimentCharge(c, n)
		};
	}).filter((p) => Boolean(p));
	const extras = condimentTotal(condPicks);
	const unitPrice = Math.round((priced.unitPrice + extras) * 100) / 100;
	const extraDetail = mergeItemDetail(priced.detail, condimentDetail(condPicks));
	const chosen = item.prices.find((p) => p.label === size) ?? first;
	const toppingEach = toppingUnit(size, settings);
	function setTopping(id, side) {
		setPicks((cur) => ({
			...cur,
			[id]: side
		}));
	}
	function toggleTopping(id) {
		setPicks((cur) => {
			const side = cur[id] ?? "off";
			return {
				...cur,
				[id]: side === "off" ? "whole" : "off"
			};
		});
	}
	function confirm() {
		const note = cookNoteValue(noteRef);
		onConfirm({
			size: chosen?.label || size,
			unitPrice,
			name: priced.name,
			detail: extraDetail,
			toppings,
			comment: note || void 0,
			condiments: condPicks
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pizza-modal-root",
		role: "presentation",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "pizza-modal-scrim",
			"aria-label": "Close",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: panelRef,
			className: "pizza-modal pizza-build",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": titleId,
			tabIndex: -1,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "pizza-modal-head pizza-item-head",
					children: [
						photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							className: "pizza-item-thumb",
							src: photo,
							alt: "",
							decoding: "async"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pizza-item-copy",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "shop-brand-kicker",
									children: "Customize your pizza"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									id: titleId,
									children: item.name
								}),
								item.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "pizza-item-desc",
									children: item.description
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ed-icon-btn",
							"aria-label": "Close",
							onClick: onClose,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								size: 16,
								strokeWidth: 2.2
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "pizza-modal-block pizza-block-tight",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Size" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-pick pizza-size-pick",
						role: "group",
						"aria-label": "Pizza size",
						children: item.prices.map((p) => {
							const lab = p.label || "Regular";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"data-on": size === lab,
								onClick: () => setSize(lab),
								children: [
									lab,
									p.inches ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: p.inches }) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatUsd(colPrice(p)) })
								]
							}, lab);
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "pizza-modal-block pizza-block-tight",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Extra toppings" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "ed-sub topping-hint",
							children: [
								"Tap to add. ",
								formatUsd(toppingEach),
								" whole · ",
								formatUsd(toppingCharge(size, "left", settings)),
								" half."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "topping-grid",
							children: PIZZA_TOPPINGS.map((t) => {
								const side = picks[t.id] ?? "off";
								const on = side !== "off";
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "topping-chip",
									"data-on": on || void 0,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "topping-chip-main",
										"aria-pressed": on,
										onClick: () => toggleTopping(t.id),
										children: t.name
									}), on ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "topping-half",
										role: "group",
										"aria-label": `${t.name} side`,
										children: [
											"left",
											"whole",
											"right"
										].map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"data-on": side === opt,
											onClick: () => setTopping(t.id, opt),
											children: opt === "whole" ? "Whole" : opt === "left" ? "L" : "R"
										}, opt))
									}) : null]
								}, t.id);
							})
						})
					]
				}),
				condiments.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "pizza-modal-block pizza-block-tight",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Condiments & extras" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "condiment-list",
						children: condiments.map((c) => {
							const cap = condimentMax(c.maxQty);
							const n = condQty[c.id] ?? 0;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: c.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
								moneyNumber(c.price) > 0 ? `${formatUsd(moneyNumber(c.price))} to add` : "Included",
								moneyNumber(c.extraPrice || c.price) > 0 ? ` · extra ${formatUsd(moneyNumber(c.extraPrice || c.price))}` : "",
								` · up to ${cap}`
							] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "qty-step",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": `Fewer ${c.name}`,
										disabled: n <= 0,
										onClick: () => setCondQty((cur) => ({
											...cur,
											[c.id]: Math.max(0, n - 1)
										})),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { size: 14 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: n }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": `More ${c.name}`,
										disabled: n >= cap,
										onClick: () => setCondQty((cur) => ({
											...cur,
											[c.id]: Math.min(cap, n + 1)
										})),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 })
									})
								]
							})] }, c.id);
						})
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CookNoteField, {
					id: noteId,
					noteRef,
					placeholder: "e.g. well done, light sauce, cut in squares"
				}, item.id || item.name),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "pizza-modal-foot",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pizza-modal-total",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "This pie" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatUsd(unitPrice) })]
						}),
						extraDetail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: extraDetail
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pizza-modal-actions",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ed-btn",
								onClick: onClose,
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn-print",
								onClick: confirm,
								children: "Add to bag"
							})]
						})
					]
				})
			]
		})]
	});
}
//#endregion
//#region src/components/wings-customize.tsx
function priceNum$2(p) {
	const n = Number(String(p).replace(/^\$/, ""));
	return Number.isFinite(n) ? n : 0;
}
function WingsCustomize({ item, categoryId, onClose, onConfirm }) {
	const titleId = (0, import_react.useId)();
	const noteId = (0, import_react.useId)();
	const panelRef = (0, import_react.useRef)(null);
	const noteRef = (0, import_react.useRef)(null);
	const sizes = item.prices.filter((p) => p.price);
	const [size, setSize] = (0, import_react.useState)(sizes[0]?.label || "");
	const [pieceQty, setPieceQty] = (0, import_react.useState)(10);
	const [sauce, setSauce] = (0, import_react.useState)("");
	const [dip, setDip] = (0, import_react.useState)("");
	const [extraRanch, setExtraRanch] = (0, import_react.useState)(0);
	const [extraBlue, setExtraBlue] = (0, import_react.useState)(0);
	const photo = item.hideImage ? "" : itemPhoto(item, categoryId);
	useDialogLock(onClose, panelRef);
	const chosen = sizes.find((p) => p.label === size) ?? sizes[0];
	const ranchUnit = extraDipUnitPrice(item.condiments, "ranch");
	const blueUnit = extraDipUnitPrice(item.condiments, "blue");
	const extras = extraDipCharge(extraRanch, ranchUnit) + extraDipCharge(extraBlue, blueUnit);
	const unitPrice = Math.round((priceNum$2(chosen?.price ?? "0") * wingQtyMultiplier(pieceQty) + extras) * 100) / 100;
	const ready = wingBuildReady(sauce, dip);
	const preview = ready ? wingBuildPicks({
		sauce,
		dip,
		extraRanch,
		extraBlue,
		ranchUnit,
		blueUnit
	}) : null;
	function bumpExtra(which, dir) {
		const next = snapExtraCups((which === "ranch" ? extraRanch : extraBlue) + dir * 2);
		if (which === "ranch") setExtraRanch(next);
		else setExtraBlue(next);
	}
	function confirm() {
		if (!preview) return;
		const note = cookNoteValue(noteRef);
		onConfirm({
			size: `${pieceQty} pc`,
			unitPrice,
			detail: preview.detail,
			comment: note || void 0,
			condiments: preview.condiments
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pizza-modal-root",
		role: "presentation",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "pizza-modal-scrim",
			"aria-label": "Close",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: panelRef,
			className: "pizza-modal pizza-build",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": titleId,
			tabIndex: -1,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "pizza-modal-head pizza-item-head",
					children: [
						photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							className: "pizza-item-thumb",
							src: photo,
							alt: "",
							decoding: "async"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pizza-item-copy",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "shop-brand-kicker",
									children: "Make it yours"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									id: titleId,
									children: item.name
								}),
								item.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "pizza-item-desc",
									children: item.description
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ed-icon-btn",
							"aria-label": "Close",
							onClick: onClose,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								size: 16,
								strokeWidth: 2.2
							})
						})
					]
				}),
				sizes.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "pizza-modal-block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Size" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-pick pizza-size-pick",
						role: "group",
						"aria-label": "Size",
						children: sizes.map((p) => {
							const lab = p.label || "Regular";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"data-on": (chosen?.label || "") === lab,
								onClick: () => setSize(lab),
								children: [lab, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatUsd(priceNum$2(p.price)) })]
							}, lab);
						})
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "pizza-modal-block pizza-block-tight",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Pieces" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "ed-sub",
							children: [
								"Sold in tens. Minimum ",
								10,
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "condiment-list",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [pieceQty, " pc"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
								formatUsd(priceNum$2(chosen?.price ?? "0")),
								" per ",
								10
							] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "qty-step",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": "Fewer wings",
										disabled: pieceQty <= 10,
										onClick: () => setPieceQty((n) => snapWingQty(n - 10)),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { size: 14 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: pieceQty }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": "More wings",
										disabled: pieceQty >= 50,
										onClick: () => setPieceQty((n) => snapWingQty(n + 10)),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 })
									})
								]
							})] })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "pizza-modal-block",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Sauce" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: "Required. Pick one."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "size-pick pizza-size-pick",
							role: "radiogroup",
							"aria-label": "Wing sauce",
							children: WING_SAUCES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"data-on": sauce === s,
								onClick: () => setSauce(s),
								children: s
							}, s))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "pizza-modal-block",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Included dips" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: "Required. Two cups, or none."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "size-pick pizza-size-pick",
							role: "radiogroup",
							"aria-label": "Included dips",
							children: WING_INCLUDED_DIPS.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"data-on": dip === d.id,
								onClick: () => setDip(d.id),
								children: d.label
							}, d.id))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "pizza-modal-block pizza-block-tight",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Extra dips" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "ed-sub",
							children: [
								"Optional. Sold in sets of ",
								2,
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "condiment-list",
							children: [[
								"ranch",
								"Extra Ranch",
								extraRanch,
								ranchUnit
							], [
								"blue",
								"Extra Blue cheese",
								extraBlue,
								blueUnit
							]].map(([id, label, n, unit]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
								formatUsd(unit),
								" per ",
								2,
								" cups · up to ",
								6
							] })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "qty-step",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": `Fewer ${label}`,
										disabled: n <= 0,
										onClick: () => bumpExtra(id, -1),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { size: 14 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: n }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": `More ${label}`,
										disabled: n >= 6,
										onClick: () => bumpExtra(id, 1),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 })
									})
								]
							})] }, id))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CookNoteField, {
					id: noteId,
					noteRef,
					placeholder: "e.g. extra crispy, sauce on the side"
				}, item.id || item.name),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "pizza-modal-foot",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pizza-modal-total",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "This order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatUsd(unitPrice) })]
						}),
						preview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: preview.detail
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: "Pick a sauce and included dips to add this to your bag."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pizza-modal-actions",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ed-btn",
								onClick: onClose,
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn-print",
								disabled: !ready,
								onClick: confirm,
								children: "Add to bag"
							})]
						})
					]
				})
			]
		})]
	});
}
//#endregion
//#region src/components/stale-cart.tsx
var ACK = "southend-cart-ack";
function alreadyAcked() {
	try {
		return sessionStorage.getItem(ACK) === "1";
	} catch {
		return true;
	}
}
function ack() {
	try {
		sessionStorage.setItem(ACK, "1");
	} catch {}
}
function StaleCartPrompt() {
	const hydrated = useCartHydrated();
	const lines = useCartStore((s) => s.lines);
	const [ask, setAsk] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		if (alreadyAcked()) return;
		if (useCartStore.getState().lines.length > 0) {
			setAsk(true);
			return;
		}
		ack();
	}, [hydrated]);
	if (!ask || !lines.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stale-cart",
		role: "dialog",
		"aria-labelledby": "stale-cart-title",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			id: "stale-cart-title",
			children: "Resume your order?"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "ed-sub",
			children: "You still have items in your bag from last time."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "stale-cart-actions",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-ghost",
				onClick: () => {
					ack();
					setAsk(false);
				},
				children: "Resume order"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "ed-btn ed-btn-quiet",
				onClick: () => {
					wipeCart();
					ack();
					setAsk(false);
				},
				children: "Start fresh"
			})]
		})]
	});
}
//#endregion
//#region src/data/icons.ts
var CATEGORY_ICONS = {
	pizza: Pizza,
	gourmet: Flame,
	appetizers: Utensils,
	salads: Salad,
	sides: Soup,
	wings: Drumstick,
	turnovers: Layers,
	sandwiches: Sandwich,
	clubs: Layers,
	"hot-subs": Ham,
	"cold-subs": Snowflake,
	"steak-subs": Beef,
	burgers: UtensilsCrossed,
	wraps: Scroll,
	gyros: Wheat,
	pasta: CookingPot,
	desserts: CakeSlice,
	beverages: CupSoda
};
var ICON_CHOICES = [
	{
		id: "pizza",
		label: "Pizza"
	},
	{
		id: "gourmet",
		label: "Flame"
	},
	{
		id: "appetizers",
		label: "Utensils"
	},
	{
		id: "salads",
		label: "Salad"
	},
	{
		id: "sides",
		label: "Soup"
	},
	{
		id: "wings",
		label: "Wings"
	},
	{
		id: "turnovers",
		label: "Layers"
	},
	{
		id: "sandwiches",
		label: "Sandwich"
	},
	{
		id: "hot-subs",
		label: "Ham"
	},
	{
		id: "cold-subs",
		label: "Snowflake"
	},
	{
		id: "steak-subs",
		label: "Steak"
	},
	{
		id: "burgers",
		label: "Burger"
	},
	{
		id: "wraps",
		label: "Wrap"
	},
	{
		id: "gyros",
		label: "Gyro"
	},
	{
		id: "pasta",
		label: "Pasta"
	},
	{
		id: "desserts",
		label: "Dessert"
	},
	{
		id: "beverages",
		label: "Drink"
	}
];
function iconFor(id) {
	return CATEGORY_ICONS[id] ?? Pizza;
}
//#endregion
//#region src/components/storefront.tsx
function priceNum$1(p) {
	const n = Number(String(p).replace(/^\$/, ""));
	return Number.isFinite(n) ? n : 0;
}
function rankMenu(categories, query) {
	const needle = query.trim().toLowerCase();
	if (!needle) return [];
	const hits = [];
	for (const cat of categories) for (const item of cat.items) {
		const name = item.name.toLowerCase();
		const desc = (item.description ?? "").toLowerCase();
		const catName = cat.name.toLowerCase();
		let score = 0;
		if (name === needle) score = 100;
		else if (name.startsWith(needle)) score = 80;
		else if (name.split(/\s+/).some((w) => w.startsWith(needle))) score = 70;
		else if (name.includes(needle)) score = 60;
		else if (desc.includes(needle)) score = 40;
		else if (catName.includes(needle)) score = 20;
		if (score) hits.push({
			cat,
			item,
			score
		});
	}
	hits.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
	return hits.slice(0, 8);
}
var CatalogItem = (0, import_react.memo)(function CatalogItem({ cat, item, hit, onOpen }) {
	const first = item.prices[0];
	const pizza = cat.kind === "pizza";
	const itemKey = item.id ?? item.name;
	const photo = item.hideImage ? "" : itemPhoto(item, cat.id);
	const price = pizza ? `from ${formatUsd(priceNum$1(item.prices[0]?.price ?? "0"))}` : formatUsd(priceNum$1(first?.price ?? "0"));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "food-card",
		"data-fav": item.highlight ? "true" : void 0,
		"data-hit": hit || void 0,
		"data-has-photo": photo ? "true" : void 0,
		"data-text-only": photo ? void 0 : "true",
		id: `item-${itemKey}`,
		onClick: onOpen,
		"aria-label": `${item.name}, ${price}`,
		children: [photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "food-card-photo",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: photo,
				alt: "",
				decoding: "async",
				loading: "lazy"
			})
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "food-card-copy",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "food-card-name",
					children: [item.name, item.highlight ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
						className: "fav-tag",
						children: "House favorite"
					}) : null]
				}),
				item.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "food-card-desc",
					children: item.description
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "food-price",
					children: price
				})
			]
		})]
	});
});
function CartPop({ count, subtotal, vacationOn, onClose }) {
	const titleId = (0, import_react.useId)();
	const panelRef = (0, import_react.useRef)(null);
	const lines = useCartStore((s) => s.lines);
	const setQty = useCartStore((s) => s.setQty);
	const notes = useCartStore((s) => s.notes);
	const setNotes = useCartStore((s) => s.setNotes);
	useDialogLock(onClose, panelRef);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pizza-modal-root cart-pop-root",
		role: "presentation",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "pizza-modal-scrim",
			"aria-label": "Close cart",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: panelRef,
			id: "bag",
			className: "pizza-modal cart-pop",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": titleId,
			tabIndex: -1,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "pizza-modal-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "shop-brand-kicker",
						children: "Bag"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: titleId,
						children: "Your order"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-icon-btn",
						"aria-label": "Close cart",
						onClick: onClose,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							size: 16,
							strokeWidth: 2.2
						})
					})]
				}),
				lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-empty",
					children: "Add pies, subs, and sides. Pickup or delivery at checkout."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "cart-lines",
					children: lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: l.name }),
						l.size ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "cart-size",
							children: l.size
						}) : null,
						l.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "cart-size",
							children: l.detail
						}) : null,
						l.comment ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "cook-note",
							children: l.comment
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "cart-line-price",
							children: formatUsd(l.unitPrice * l.qty)
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "qty-step",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": `Fewer ${l.name}`,
								onClick: () => setQty(l.key, l.qty - 1),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { size: 14 })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: l.qty }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": `More ${l.name}`,
								onClick: () => setQty(l.key, l.qty + 1),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 })
							})
						]
					})] }, l.key))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field cart-notes",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Order notes" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						className: "ed-input ed-area",
						rows: 3,
						maxLength: 500,
						placeholder: "e.g. extra napkins, gate code",
						value: notes,
						onChange: (e) => setNotes(e.target.value),
						suppressHydrationWarning: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "cart-total",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						count,
						" item",
						count === 1 ? "" : "s"
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatUsd(subtotal) })]
				}),
				vacationOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-empty",
					children: "Ordering is paused until the shop reopens."
				}) : count === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-print cart-check",
					disabled: true,
					children: "Add items to check out"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/checkout",
					className: "btn-print cart-check",
					onClick: onClose,
					children: "Checkout"
				})
			]
		})]
	});
}
function Storefront({ restaurant, categories, settings }) {
	const [active, setActive] = (0, import_react.useState)(categories[0]?.id ?? "");
	const [custom, setCustom] = (0, import_react.useState)(null);
	const [confirm, setConfirm] = (0, import_react.useState)(null);
	const [wings, setWings] = (0, import_react.useState)(null);
	const [query, setQuery] = (0, import_react.useState)("");
	const [searchOpen, setSearchOpen] = (0, import_react.useState)(false);
	const [hitId, setHitId] = (0, import_react.useState)("");
	const railRef = (0, import_react.useRef)(null);
	const searchWrapRef = (0, import_react.useRef)(null);
	const searchSlotRef = (0, import_react.useRef)(null);
	const searchInputRef = (0, import_react.useRef)(null);
	const add = useCartStore((s) => s.add);
	const bagOpen = useCartStore((s) => s.bagOpen);
	const closeBag = useCartStore((s) => s.closeBag);
	const lines = useCartStore((s) => s.lines);
	const { count, subtotal } = cartTotals(lines);
	const suggestions = (0, import_react.useMemo)(() => rankMenu(categories, query), [categories, query]);
	const pickupAt = `${restaurant.address}, ${restaurant.city}`;
	const spyLock = (0, import_react.useRef)(false);
	const spyGen = (0, import_react.useRef)(0);
	function railBehavior() {
		if (typeof window === "undefined") return "smooth";
		return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
	}
	function centerActivePill(id, smooth = false) {
		const rail = railRef.current;
		if (!rail) return;
		const btn = rail.querySelector(`[data-cat="${CSS.escape(id)}"]`);
		if (!btn) return;
		const railRect = rail.getBoundingClientRect();
		const btnRect = btn.getBoundingClientRect();
		const sticky = rail.querySelector(".cat-search-slot");
		const leftPad = sticky ? sticky.getBoundingClientRect().width : 0;
		const target = railRect.left + leftPad + Math.max(1, railRect.width - leftPad) / 2;
		const current = btnRect.left + btnRect.width / 2;
		const left = Math.max(0, rail.scrollLeft + (current - target));
		const behavior = smooth && railBehavior() === "smooth" ? "smooth" : "auto";
		try {
			rail.scrollTo({
				left,
				behavior
			});
		} catch {
			rail.scrollLeft = left;
		}
	}
	function pulseArrow(btn) {
		btn.classList.remove("is-pulse");
		btn.offsetWidth;
		btn.classList.add("is-pulse");
		window.setTimeout(() => btn.classList.remove("is-pulse"), 220);
	}
	function pickCategory(id) {
		const stacked = spyLock.current;
		setActive(id);
		const gen = ++spyGen.current;
		spyLock.current = true;
		centerActivePill(id, !stacked);
		window.setTimeout(() => {
			if (gen !== spyGen.current) return;
			const panel = document.getElementById(`menu-${id}`);
			const wrap = document.querySelector(".cat-search-wrap");
			if (!panel) {
				spyLock.current = false;
				return;
			}
			const offset = wrap instanceof HTMLElement ? wrap.getBoundingClientRect().height + 10 : 88;
			const y = window.scrollY + panel.getBoundingClientRect().top - offset;
			const how = stacked || railBehavior() === "auto" ? "auto" : "smooth";
			try {
				window.scrollTo({
					top: Math.max(0, y),
					behavior: how
				});
			} catch {
				window.scrollTo(0, Math.max(0, y));
			}
			const unlock = () => {
				if (gen !== spyGen.current) return;
				spyLock.current = false;
			};
			const onEnd = () => {
				window.removeEventListener("scrollend", onEnd);
				unlock();
			};
			window.addEventListener("scrollend", onEnd);
			window.setTimeout(() => {
				window.removeEventListener("scrollend", onEnd);
				unlock();
			}, 1100);
		}, 10);
	}
	function openItem(cat, item) {
		if (cat.kind === "pizza") {
			setCustom({
				cat,
				item,
				size: item.prices[0]?.label || ""
			});
			return;
		}
		if (isWingsBuild(cat, item)) {
			setWings({
				cat,
				item
			});
			return;
		}
		setConfirm({
			cat,
			item
		});
	}
	function skipCategories(dir) {
		const n = categories.length;
		if (!n) return;
		const next = (Math.max(0, categories.findIndex((c) => c.id === active)) + dir + n) % n;
		if (categories[next]) pickCategory(categories[next].id);
	}
	function jumpTo(hit) {
		setActive(hit.cat.id);
		setHitId(hit.item.id ?? hit.item.name);
		setSearchOpen(false);
		setQuery("");
		pickCategory(hit.cat.id);
		window.setTimeout(() => openItem(hit.cat, hit.item), 80);
	}
	(0, import_react.useEffect)(() => {
		if (!bagOpen) return;
		const kick = window.setTimeout(() => {
			document.querySelectorAll(".cart-pop .cart-check").forEach((el) => {
				el.classList.remove("is-glow");
				window.requestAnimationFrame(() => el.classList.add("is-glow"));
			});
		}, 40);
		const clear = window.setTimeout(() => {
			document.querySelectorAll(".cart-pop .cart-check").forEach((el) => el.classList.remove("is-glow"));
		}, 1240);
		return () => {
			window.clearTimeout(kick);
			window.clearTimeout(clear);
		};
	}, [bagOpen]);
	(0, import_react.useEffect)(() => {
		if (!searchOpen) return;
		const onDown = (e) => {
			const wrap = searchWrapRef.current;
			if (wrap && !wrap.contains(e.target)) setSearchOpen(false);
		};
		document.addEventListener("pointerdown", onDown);
		return () => document.removeEventListener("pointerdown", onDown);
	}, [searchOpen]);
	(0, import_react.useEffect)(() => {
		if (searchOpen && query.trim()) return;
		const sections = Array.from(document.querySelectorAll(".cat-panel[data-cat]"));
		if (!sections.length) return;
		let tick = null;
		const spyLine = () => {
			const wrap = document.querySelector(".cat-search-wrap");
			return wrap instanceof HTMLElement ? wrap.getBoundingClientRect().bottom + 10 : 96;
		};
		const pickVisible = () => {
			if (spyLock.current) return;
			const line = spyLine();
			let crossed = null;
			for (const s of sections) if (s.getBoundingClientRect().top - line <= 8) crossed = s;
			else break;
			const id = crossed?.dataset.cat;
			if (!id) return;
			setActive((prev) => {
				if (prev === id) return prev;
				const prevEl = sections.find((s) => s.dataset.cat === prev);
				if (prevEl) {
					const top = prevEl.getBoundingClientRect().top;
					const bottom = prevEl.getBoundingClientRect().bottom;
					if (top < line - 12 && bottom > line + 80) return prev;
				}
				const prevIdx = sections.findIndex((s) => s.dataset.cat === prev);
				const nextIdx = sections.findIndex((s) => s.dataset.cat === id);
				if (prevIdx >= 0 && Math.abs(nextIdx - prevIdx) > 1) {
					const neighbor = sections[prevIdx + Math.sign(nextIdx - prevIdx)];
					const nTop = neighbor?.getBoundingClientRect().top ?? 0;
					if (neighbor && nTop - line < 48) return neighbor.dataset.cat ?? id;
				}
				return id;
			});
		};
		const onScroll = () => {
			if (tick != null) window.cancelAnimationFrame(tick);
			tick = window.requestAnimationFrame(pickVisible);
		};
		pickVisible();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			if (tick != null) window.cancelAnimationFrame(tick);
			window.removeEventListener("scroll", onScroll);
		};
	}, [
		categories,
		searchOpen,
		query
	]);
	(0, import_react.useEffect)(() => {
		if (!active || searchOpen) return;
		if (spyLock.current) return;
		centerActivePill(active, false);
	}, [active, searchOpen]);
	(0, import_react.useEffect)(() => {
		if (!searchOpen) return;
		const rail = railRef.current;
		if (rail) try {
			rail.scrollTo({
				left: 0,
				behavior: railBehavior()
			});
		} catch {
			rail.scrollLeft = 0;
		}
		window.setTimeout(() => searchInputRef.current?.focus(), 20);
	}, [searchOpen]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "store-layout",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaleCartPrompt, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "store-main",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "shop-hero",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "shop-hero-copy",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "sr-only",
									children: restaurant.name
								}),
								settings.tagline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "shop-hero-tag",
									children: settings.tagline
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "shop-hero-hours",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
											size: 14,
											strokeWidth: 2.2
										}),
										settings.hoursSummary || restaurant.hours,
										settings.openNow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "open-pip",
											children: "Open"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "closed-pip",
											children: "Closed"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
									size: 14,
									strokeWidth: 2.2
								}), pickupAt] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
									size: 14,
									strokeWidth: 2.2
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: restaurant.phoneHref,
									children: restaurant.phone
								})] })
							]
						})
					}),
					settings.vacationOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "vac-banner",
						role: "status",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Closed for vacation" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: settings.vacationMessage }),
							settings.vacationUntil ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Back ", settings.vacationUntil] }) : null
						]
					}) : !settings.openNow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "vac-banner",
						role: "status",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Kitchen is closed" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["You can still browse. ", settings.hoursSummary] })]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "cat-search-wrap",
						ref: searchWrapRef,
						"data-search-open": searchOpen ? "true" : void 0,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "cat-sorter",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "cat-skip",
									"aria-label": "Previous category",
									onClick: (e) => {
										pulseArrow(e.currentTarget);
										skipCategories(-1);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {
										size: 20,
										strokeWidth: 2.4
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
									className: "cat-rail",
									"aria-label": "Menu categories",
									ref: railRef,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "cat-search-slot",
										ref: searchSlotRef,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "cat-search cat-search-icon",
											"aria-label": searchOpen ? "Close menu search" : "Search the menu",
											"aria-expanded": searchOpen,
											onClick: () => {
												setSearchOpen((open) => {
													if (open) setQuery("");
													return !open;
												});
											},
											children: searchOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
												size: 18,
												strokeWidth: 2.2,
												"aria-hidden": true
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
												size: 18,
												strokeWidth: 2.2,
												"aria-hidden": true
											})
										})
									}), categories.map((cat) => {
										const Icon = iconFor(cat.icon ?? cat.id);
										const on = active === cat.id;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											"data-on": on,
											"data-cat": cat.id,
											"aria-current": on ? "true" : void 0,
											onClick: () => {
												setSearchOpen(false);
												pickCategory(cat.id);
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
												size: 16,
												strokeWidth: 2.2
											}), cat.name]
										}, cat.id);
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "cat-skip",
									"aria-label": "Next category",
									onClick: (e) => {
										pulseArrow(e.currentTarget);
										skipCategories(1);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
										size: 20,
										strokeWidth: 2.4
									})
								})
							]
						}), searchOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "cat-suggest",
							role: "listbox",
							"aria-label": "Menu suggestions",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "cat-search-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
									size: 16,
									strokeWidth: 2.2,
									"aria-hidden": true
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: searchInputRef,
									value: query,
									onChange: (e) => setQuery(e.target.value),
									onKeyDown: (e) => {
										if (e.key === "Escape") {
											setSearchOpen(false);
											setQuery("");
										}
										if (e.key === "Enter" && suggestions[0]) {
											e.preventDefault();
											jumpTo(suggestions[0]);
										}
									},
									"aria-label": "Search the menu",
									autoComplete: "off",
									enterKeyHint: "search"
								})]
							}), query.trim() ? suggestions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "cat-suggest-empty",
								children: [
									"No matches for “",
									query.trim(),
									"”."
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "cat-suggest-list",
								children: suggestions.map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onMouseDown: (e) => e.preventDefault(),
									onClick: () => jumpTo(hit),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: hit.item.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: hit.cat.name })]
								}) }, `${hit.cat.id}-${hit.item.id ?? hit.item.name}`))
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "cat-suggest-empty",
								children: "Type a dish name."
							})]
						}) : null]
					}),
					categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "cat-panel",
						id: `menu-${cat.id}`,
						"data-cat": cat.id,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
							className: "cat-panel-head",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: cat.name })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "food-grid",
							"data-count": cat.items.length,
							"data-card-size": settings.cardTextSize,
							"data-card-fit": settings.cardSize,
							style: cardTypeStyle(settings.cardTextColor, settings.cardDescColor, settings.cardPriceColor, settings.cardBg),
							children: cat.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatalogItem, {
								cat,
								item,
								hit: hitId === (item.id ?? item.name),
								onOpen: () => openItem(cat, item)
							}, item.id ?? item.name))
						})]
					}, cat.id))
				]
			}),
			bagOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartPop, {
				count,
				subtotal,
				vacationOn: settings.vacationOn,
				onClose: closeBag
			}) : null,
			count > 0 && !settings.vacationOn && !bagOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mobile-bag",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/checkout",
					className: "btn-print cart-check",
					children: [
						"Checkout · ",
						count,
						" · ",
						formatUsd(subtotal)
					]
				})
			}) : null,
			custom ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PizzaCustomize, {
				item: custom.item,
				categoryId: custom.cat.id,
				settings,
				initialSize: custom.size,
				onClose: () => setCustom(null),
				onConfirm: (result) => {
					add({
						itemId: custom.item.id ?? custom.item.name,
						categoryId: custom.cat.id,
						name: result.name,
						size: result.size,
						detail: result.detail || void 0,
						comment: result.comment,
						toppings: result.toppings,
						condiments: result.condiments,
						unitPrice: result.unitPrice
					});
					setCustom(null);
				}
			}) : null,
			confirm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemConfirm, {
				item: confirm.item,
				categoryName: confirm.cat.name,
				categoryId: confirm.cat.id,
				onClose: () => setConfirm(null),
				onConfirm: (result) => {
					add({
						itemId: confirm.item.id ?? confirm.item.name,
						categoryId: confirm.cat.id,
						name: confirm.item.name,
						size: result.size,
						detail: result.detail,
						comment: result.comment,
						condiments: result.condiments,
						unitPrice: result.unitPrice,
						qty: result.qty
					});
					setConfirm(null);
				}
			}) : null,
			wings ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WingsCustomize, {
				item: wings.item,
				categoryId: wings.cat.id,
				onClose: () => setWings(null),
				onConfirm: (result) => {
					add({
						itemId: wings.item.id ?? wings.item.name,
						categoryId: wings.cat.id,
						name: wings.item.name,
						size: result.size,
						detail: result.detail,
						comment: result.comment,
						condiments: result.condiments,
						unitPrice: result.unitPrice
					});
					setWings(null);
				}
			}) : null
		]
	});
}
//#endregion
//#region src/routes/index.tsx
var Route$28 = createFileRoute("/")({
	loader: () => retryTransient(() => getStorefront()),
	staleTime: 3e4,
	pendingMs: 8e3,
	pendingComponent: HomePending,
	component: Home
});
function HomePending() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "shop-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "shop-main",
			id: "main",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "store-layout",
				"aria-busy": "true",
				"aria-label": "Loading the menu",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "store-main",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hero-skel" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "cat-rail",
							children: Array.from({ length: 8 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "skel-chip" }, i))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "food-grid",
							children: Array.from({ length: 6 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "skel-card" }, i))
						})
					]
				})
			})
		})]
	});
}
function Home() {
	const data = Route$28.useLoaderData();
	const { user, isPending } = useCurrentUserState();
	const [profile, setProfile] = (0, import_react.useState)(null);
	const toggleBag = useCartStore((s) => s.toggleBag);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) {
			setProfile(null);
			return;
		}
		retryTransient(() => getMe()).then(setProfile).catch(() => setProfile(null));
	}, [isPending, user]);
	(0, import_react.useEffect)(() => {
		try {
			sessionStorage.removeItem("southend-fetch-retry-n");
		} catch {}
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "shop-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopHeader, {
			profile,
			onOpenCart: toggleBag
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "shop-main",
			id: "main",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Storefront, {
				restaurant: data.restaurant,
				categories: data.categories,
				settings: data.settings,
				profile
			})
		})]
	});
}
//#endregion
//#region src/lib/qr.ts
/** Byte-mode QR (versions 1–6, ECC M) as a module matrix and SVG path. */
var EXP = /* @__PURE__ */ new Uint8Array(256);
var LOG = /* @__PURE__ */ new Uint8Array(256);
(() => {
	let x = 1;
	for (let i = 0; i < 255; i++) {
		EXP[i] = x;
		LOG[x] = i;
		x <<= 1;
		if (x & 256) x ^= 285;
	}
})();
function mul(a, b) {
	if (!a || !b) return 0;
	return EXP[(LOG[a] + LOG[b]) % 255];
}
var DATA_CW = [
	0,
	16,
	28,
	44,
	64,
	86,
	108
];
var BLOCKS_M = [
	[],
	[[
		1,
		16,
		10
	]],
	[[
		1,
		28,
		16
	]],
	[[
		1,
		44,
		26
	]],
	[[
		2,
		32,
		18
	]],
	[[
		2,
		43,
		24
	]],
	[[
		4,
		27,
		16
	]]
];
function rsGenerator(nsym) {
	let poly = [1];
	for (let i = 0; i < nsym; i++) {
		const next = new Array(poly.length + 1).fill(0);
		for (let j = 0; j < poly.length; j++) {
			next[j] ^= poly[j];
			next[j + 1] ^= mul(poly[j], EXP[i]);
		}
		poly = next;
	}
	return poly;
}
function rsEncode(data, nsym) {
	const gen = rsGenerator(nsym);
	const ecc = new Array(nsym).fill(0);
	for (const b of data) {
		const factor = b ^ ecc[0];
		ecc.shift();
		ecc.push(0);
		if (!factor) continue;
		for (let i = 0; i < nsym; i++) ecc[i] ^= mul(gen[i + 1], factor);
	}
	return ecc;
}
function bitLen(n) {
	let d = 0;
	while (n) {
		d += 1;
		n >>>= 1;
	}
	return d;
}
function bchTypeInfo(data) {
	let d = data << 10;
	while (bitLen(d) - 11 >= 0) d ^= 1335 << bitLen(d) - 11;
	return (data << 10 | d) ^ 21522;
}
function setFinder(grid, x0, y0) {
	for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) {
		const xx = x0 + x;
		const yy = y0 + y;
		if (yy < 0 || xx < 0 || yy >= grid.length || xx >= grid.length) continue;
		const on = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (x === 0 || x === 6 || y === 0 || y === 6 || x >= 2 && x <= 4 && y >= 2 && y <= 4);
		grid[yy][xx] = on ? 1 : 0;
	}
}
function setAlignment(grid, cx, cy) {
	for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
		const on = x === -2 || x === 2 || y === -2 || y === 2 || x === 0 && y === 0;
		grid[cy + y][cx + x] = on ? 1 : 0;
	}
}
function isMasked(mask, x, y) {
	switch (mask) {
		case 0: return (x + y) % 2 === 0;
		case 1: return y % 2 === 0;
		case 2: return x % 3 === 0;
		case 3: return (x + y) % 3 === 0;
		case 4: return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
		case 5: return x * y % 2 + x * y % 3 === 0;
		case 6: return (x * y % 2 + x * y % 3) % 2 === 0;
		default: return ((x + y) % 2 + x * y % 3) % 2 === 0;
	}
}
function penalty(grid) {
	const n = grid.length;
	let s = 0;
	for (let y = 0; y < n; y++) {
		let run = 1;
		for (let x = 1; x <= n; x++) if (x < n && grid[y][x] === grid[y][x - 1]) run += 1;
		else {
			if (run >= 5) s += run - 2;
			run = 1;
		}
	}
	for (let x = 0; x < n; x++) {
		let run = 1;
		for (let y = 1; y <= n; y++) if (y < n && grid[y][x] === grid[y - 1][x]) run += 1;
		else {
			if (run >= 5) s += run - 2;
			run = 1;
		}
	}
	for (let y = 0; y < n - 1; y++) for (let x = 0; x < n - 1; x++) {
		const v = grid[y][x];
		if (v === grid[y][x + 1] && v === grid[y + 1][x] && v === grid[y + 1][x + 1]) s += 3;
	}
	const finder = [
		1,
		0,
		1,
		1,
		1,
		0,
		1,
		0,
		0,
		0,
		0
	];
	const match = (get) => {
		for (let i = 0; i <= n - 11; i++) {
			let ok = true;
			for (let k = 0; k < 11; k++) if (get(i + k) !== finder[k] && get(i + k) !== finder[10 - k]) {
				ok = false;
				break;
			}
			if (ok) s += 40;
		}
	};
	for (let y = 0; y < n; y++) match((i) => grid[y][i]);
	for (let x = 0; x < n; x++) match((i) => grid[i][x]);
	let dark = 0;
	for (const row of grid) for (const c of row) if (c) dark += 1;
	s += Math.abs(dark * 100 / (n * n) - 50) / 5 * 10;
	return s;
}
function bytesOf(text) {
	return Array.from(new TextEncoder().encode(text));
}
function chooseVersion(len) {
	for (let v = 1; v <= 6; v++) if (len <= DATA_CW[v] - 2) return v;
	throw new Error("Invite link is too long for a QR code.");
}
function buildCodewords(text, version) {
	const data = bytesOf(text);
	const bits = [];
	const push = (val, n) => {
		for (let i = n - 1; i >= 0; i--) bits.push(val >> i & 1);
	};
	push(4, 4);
	push(data.length, 8);
	for (const b of data) push(b, 8);
	const remain = DATA_CW[version] * 8 - bits.length;
	push(0, Math.min(4, Math.max(0, remain)));
	while (bits.length % 8) bits.push(0);
	const bytes = [];
	for (let i = 0; i < bits.length; i += 8) {
		let b = 0;
		for (let k = 0; k < 8; k++) b = b << 1 | bits[i + k];
		bytes.push(b);
	}
	const pads = [236, 17];
	let p = 0;
	while (bytes.length < DATA_CW[version]) {
		bytes.push(pads[p % 2]);
		p += 1;
	}
	return bytes;
}
function interleave(bytes, version) {
	const groups = BLOCKS_M[version];
	const blocks = [];
	let offset = 0;
	for (const [count, dataLen, ecLen] of groups) for (let i = 0; i < count; i++) {
		const data = bytes.slice(offset, offset + dataLen);
		offset += dataLen;
		blocks.push({
			data,
			ecc: rsEncode(data, ecLen)
		});
	}
	const out = [];
	const maxData = Math.max(...blocks.map((b) => b.data.length));
	for (let i = 0; i < maxData; i++) for (const b of blocks) if (i < b.data.length) out.push(b.data[i]);
	const maxEcc = Math.max(...blocks.map((b) => b.ecc.length));
	for (let i = 0; i < maxEcc; i++) for (const b of blocks) if (i < b.ecc.length) out.push(b.ecc[i]);
	return out;
}
function reservedGrid(size, version) {
	const grid = Array.from({ length: size }, () => Array(size).fill(null));
	setFinder(grid, 0, 0);
	setFinder(grid, size - 7, 0);
	setFinder(grid, 0, size - 7);
	for (let i = 8; i < size - 8; i++) {
		grid[6][i] = i % 2 === 0 ? 1 : 0;
		grid[i][6] = i % 2 === 0 ? 1 : 0;
	}
	if (version >= 2) {
		const pos = [
			18,
			22,
			26,
			30,
			34
		][version - 2];
		setAlignment(grid, pos, pos);
	}
	grid[size - 8][8] = 1;
	for (let i = 0; i < 9; i++) {
		if (grid[8][i] === null) grid[8][i] = 0;
		if (grid[i][8] === null) grid[i][8] = 0;
	}
	for (let i = 0; i < 8; i++) {
		if (grid[8][size - 1 - i] === null) grid[8][size - 1 - i] = 0;
		if (grid[size - 1 - i][8] === null) grid[size - 1 - i][8] = 0;
	}
	return grid;
}
function placeData(grid, codewords, mask) {
	const size = grid.length;
	const bits = [];
	for (const b of codewords) for (let i = 7; i >= 0; i--) bits.push(b >> i & 1);
	let bi = 0;
	let dir = -1;
	let y = size - 1;
	for (let x = size - 1; x > 0; x -= 2) {
		if (x === 6) x -= 1;
		for (;;) {
			for (const dx of [0, -1]) {
				const xx = x + dx;
				if (grid[y][xx] !== null) continue;
				const bit = bi < bits.length ? bits[bi] : 0;
				bi += 1;
				grid[y][xx] = bit ^ (isMasked(mask, xx, y) ? 1 : 0);
			}
			y += dir;
			if (y < 0 || y >= size) {
				y -= dir;
				dir = -dir;
				break;
			}
		}
	}
}
function applyFormat(grid, mask) {
	const size = grid.length;
	const bits = bchTypeInfo(0 | mask);
	const pos = [
		[8, 0],
		[8, 1],
		[8, 2],
		[8, 3],
		[8, 4],
		[8, 5],
		[8, 7],
		[8, 8],
		[7, 8],
		[5, 8],
		[4, 8],
		[3, 8],
		[2, 8],
		[1, 8],
		[0, 8]
	];
	const pos2 = [
		[size - 1, 8],
		[size - 2, 8],
		[size - 3, 8],
		[size - 4, 8],
		[size - 5, 8],
		[size - 6, 8],
		[size - 7, 8],
		[8, size - 8],
		[8, size - 7],
		[8, size - 6],
		[8, size - 5],
		[8, size - 4],
		[8, size - 3],
		[8, size - 2],
		[8, size - 1]
	];
	for (let i = 0; i < 15; i++) {
		const bit = bits >> i & 1;
		grid[pos[i][1]][pos[i][0]] = bit;
		grid[pos2[i][1]][pos2[i][0]] = bit;
	}
}
function qrMatrix(text) {
	const version = chooseVersion(bytesOf(text).length);
	const size = 21 + 4 * (version - 1);
	const codewords = interleave(buildCodewords(text, version), version);
	let best = null;
	let bestScore = Infinity;
	for (let mask = 0; mask < 8; mask++) {
		const grid = reservedGrid(size, version);
		placeData(grid, codewords, mask);
		applyFormat(grid, mask);
		const filled = grid.map((row) => row.map((c) => c ? 1 : 0));
		const score = penalty(filled);
		if (score < bestScore) {
			bestScore = score;
			best = filled;
		}
	}
	return best ?? [];
}
function qrPath(text, quiet = 4) {
	const matrix = qrMatrix(text);
	const n = matrix.length;
	const parts = [];
	for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (matrix[y][x]) parts.push(`M${x + quiet} ${y + quiet}h1v1h-1z`);
	return {
		d: parts.join(""),
		dim: n + quiet * 2
	};
}
//#endregion
//#region src/components/invite-qr.tsx
function InviteQr({ value, label }) {
	const drawn = (0, import_react.useMemo)(() => {
		try {
			return qrPath(value);
		} catch {
			return null;
		}
	}, [value]);
	if (!drawn) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "ed-sub",
		children: "QR could not be drawn for this link. Use the secret key below in your authenticator app."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "invite-qr",
		viewBox: `0 0 ${drawn.dim} ${drawn.dim}`,
		role: "img",
		"aria-label": label,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			width: drawn.dim,
			height: drawn.dim,
			fill: "var(--color-cream)"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: drawn.d,
			fill: "var(--color-ink)"
		})]
	});
}
//#endregion
//#region src/components/guards.tsx
function accountLoadMessage(err) {
	const raw = err instanceof Error ? err.message : "";
	const lower = raw.toLowerCase();
	if (lower.includes("profiles_pkey") || lower.includes("duplicate key") || lower.includes("unique constraint")) return "The shop is still opening your staff account. Tap Try again.";
	if (isTransientFetchError(err)) return "The shop did not answer. Tap Try again.";
	return raw.trim() || "Could not load your staff account.";
}
function withTimeout(work, ms) {
	return new Promise((resolve, reject) => {
		const t = window.setTimeout(() => reject(/* @__PURE__ */ new Error("Account is taking too long. Tap Try again.")), ms);
		work.then((v) => {
			window.clearTimeout(t);
			resolve(v);
		}, (e) => {
			window.clearTimeout(t);
			reject(e);
		});
	});
}
var SKIP_2FA = {
	required: false,
	unlocked: true,
	enabled: false,
	enroll: false,
	locked: false
};
async function loadStaffAccount() {
	const profile = await withTimeout(getMe(), 6e3);
	if (!profile.totpEnabled) return [profile, SKIP_2FA];
	try {
		return [profile, await withTimeout(getTwoFactorStatus(), 2500)];
	} catch {
		return [profile, SKIP_2FA];
	}
}
function SessionGate({ children, needAdmin, fallback, softGuest, onContinueAsGuest }) {
	const { user, isPending } = useCurrentUserState();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [twoFactor, setTwoFactor] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [claiming, setClaiming] = (0, import_react.useState)(false);
	const [retry, setRetry] = (0, import_react.useState)(0);
	const [authWaited, setAuthWaited] = (0, import_react.useState)(false);
	const userId = user?.id ?? "";
	const heldAdmin = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!isPending) {
			setAuthWaited(false);
			return;
		}
		const ms = needAdmin ? 2500 : 8e3;
		const t = window.setTimeout(() => setAuthWaited(true), ms);
		return () => window.clearTimeout(t);
	}, [isPending, needAdmin]);
	(0, import_react.useEffect)(() => {
		if (isPending || !userId) return;
		let live = true;
		const timeout = window.setTimeout(() => {
			if (!live) return;
			if (needAdmin && heldAdmin.current && heldAdmin.current.userId === userId) return;
			setError("Account is taking too long. Tap Try again.");
		}, 9e3);
		loadStaffAccount().then(([p, t]) => {
			if (!live) return;
			window.clearTimeout(timeout);
			if (p.adminMode || p.adminModeAllowed) heldAdmin.current = p;
			setError("");
			setProfile(p);
			setTwoFactor(t);
		}).catch((e) => {
			if (!live) return;
			window.clearTimeout(timeout);
			if (needAdmin && heldAdmin.current && heldAdmin.current.userId === userId) {
				setProfile(heldAdmin.current);
				setError("");
				return;
			}
			setProfile(null);
			setTwoFactor(null);
			setError(accountLoadMessage(e));
		});
		return () => {
			live = false;
			window.clearTimeout(timeout);
		};
	}, [
		isPending,
		userId,
		retry,
		needAdmin
	]);
	if (isPending && !(needAdmin && authWaited && !user)) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLoading, {});
	if (!user) {
		const next = needAdmin && (!pathname.startsWith("/admin") || pathname.startsWith("/login")) ? "/admin" : pathname.startsWith("/") && !pathname.startsWith("//") && !pathname.startsWith("/login") ? pathname : needAdmin ? "/admin" : "/";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
			to: "/login",
			search: { next }
		});
	}
	if (error) {
		const retry = () => {
			setError("");
			setProfile(null);
			setTwoFactor(null);
			setRetry((n) => n + 1);
		};
		if (fallback) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: fallback({
			error,
			retry
		}) });
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "page-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Could not load your account" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: error }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: softGuest ? "Nothing was lost. Continue as guest to finish checkout, or try loading the account again." : "Nothing was lost. Tap Try again to open the shop desk."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "confirm-actions",
					children: [softGuest && onContinueAsGuest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-print",
						onClick: onContinueAsGuest,
						children: "Continue as guest"
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: softGuest ? "ed-btn" : "btn-print",
						onClick: retry,
						children: "Try again"
					})]
				})
			]
		});
	}
	if (!profile || !twoFactor) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLoading, {});
	if (profile.banned) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Account restricted" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This account has been restricted. Call the shop if you need help." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "btn-ghost",
				children: "Back to menu"
			})
		]
	});
	if (twoFactor.enroll) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Set up two-factor" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Settings requires an authenticator app before the desk can open." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/enroll-2fa",
				search: { next: pathname },
				className: "btn-print",
				children: "Enroll authenticator"
			})
		]
	});
	if (twoFactor.required) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Two-factor check" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Enter the code from your authenticator app to continue." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/verify-2fa",
				search: { next: pathname },
				className: "btn-print",
				children: "Verify"
			})
		]
	});
	if (needAdmin && !(profile.adminMode && profile.adminModeAllowed) && profile.role !== "admin") {
		if (!profile.adminExists) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "page-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Set up shop admin" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No administrator exists yet. Claim this account as the shop admin to manage delivery zones, rewards, vacation mode, and the live menu." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn-print",
					disabled: claiming,
					onClick: () => {
						setClaiming(true);
						claimAdmin().then(() => getMe().then(setProfile)).catch((e) => setError(e instanceof Error ? e.message : "Could not claim admin")).finally(() => setClaiming(false));
					},
					children: claiming ? "Saving…" : "Make this the admin account"
				})
			]
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "page-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Staff only" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This area is for the shop administrator." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "btn-ghost",
					children: "Back to menu"
				})
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: children({
		profile,
		twoFactor
	}) });
}
//#endregion
//#region src/lib/image-file.ts
var TYPES = [
	"image/webp",
	"image/jpeg",
	"image/png"
];
async function fileToDataImage(file, opts) {
	if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
	const probe = await createImageBitmap(file);
	const scale = Math.min(1, opts.maxEdge / Math.max(probe.width, probe.height));
	const w = Math.max(1, Math.round(probe.width * scale));
	const h = Math.max(1, Math.round(probe.height * scale));
	probe.close();
	let bmp;
	try {
		bmp = await createImageBitmap(file, {
			resizeWidth: w,
			resizeHeight: h,
			resizeQuality: "high"
		});
	} catch {
		bmp = await createImageBitmap(file);
	}
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bmp.close();
		throw new Error("Could not read that image.");
	}
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.clearRect(0, 0, w, h);
	ctx.drawImage(bmp, 0, 0, w, h);
	bmp.close();
	const cap = opts.maxChars ?? 35e4;
	const startQ = opts.quality ?? .9;
	let best = "";
	for (const type of TYPES) {
		let q = startQ;
		for (let i = 0; i < 6; i += 1) {
			const url = canvas.toDataURL(type, q);
			if (!best || url.length < best.length) best = url;
			if (url.length <= cap) return url;
			q -= .08;
		}
	}
	if (best && best.length <= cap + 7e4) return best;
	throw new Error("That image is too large. Try a smaller photo.");
}
//#endregion
//#region src/components/order-trays.tsx
function groupOrdersByDay(orders) {
	const map = /* @__PURE__ */ new Map();
	for (const o of orders) {
		const key = o.createdAt ? nyYmd(new Date(o.createdAt)) : "unknown";
		const list = map.get(key) ?? [];
		list.push(o);
		map.set(key, list);
	}
	return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([key, list]) => ({
		key,
		label: key === "unknown" ? "Unknown date" : formatShopDay(list[0]?.createdAt ?? ""),
		orders: list
	}));
}
function OrderDateTrays({ orders, empty = "No tickets yet.", children }) {
	const groups = (0, import_react.useMemo)(() => groupOrdersByDay(orders), [orders]);
	const [open, setOpen] = (0, import_react.useState)(() => /* @__PURE__ */ new Set());
	if (groups.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "ed-empty",
		children: empty
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "order-trays",
		children: groups.map((g) => {
			const shown = open.has(g.key);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "order-tray",
				"data-open": shown,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "order-tray-head",
					"aria-expanded": shown,
					onClick: () => setOpen((cur) => {
						if (cur.has(g.key)) return /* @__PURE__ */ new Set();
						return /* @__PURE__ */ new Set([g.key]);
					}),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: g.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
						g.orders.length,
						" ticket",
						g.orders.length === 1 ? "" : "s"
					] })] }), shown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, {
						size: 16,
						strokeWidth: 2.2
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
						size: 16,
						strokeWidth: 2.2
					})]
				}), shown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "order-tray-list",
					children: g.orders.map((o) => children(o))
				}) : null]
			}, g.key);
		})
	});
}
//#endregion
//#region src/routes/account.tsx
var TABS$2 = [
	"summary",
	"details",
	"security",
	"rewards"
];
function asTab(raw) {
	const s = String(raw ?? "summary");
	return TABS$2.includes(s) ? s : "summary";
}
var Route$27 = createFileRoute("/account")({
	validateSearch: (search) => {
		const tab = asTab(search.tab);
		return tab === "summary" ? {} : { tab };
	},
	component: AccountPage
});
function AccountPage() {
	const { tab } = Route$27.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "shop-shell",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionGate, { children: ({ profile, twoFactor }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopHeader, { profile }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "shop-main account-main",
			id: "main",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountBody, {
				profile,
				totpLocked: twoFactor.locked,
				tab: asTab(tab)
			})
		})] }) })
	});
}
function AccountBody({ profile, totpLocked, tab }) {
	const navigate = useNavigate();
	const add = useCartStore((s) => s.add);
	const setNotes = useCartStore((s) => s.setNotes);
	const [phone, setPhone] = (0, import_react.useState)(profile.phone);
	const [name, setName] = (0, import_react.useState)(profile.displayName);
	const [address, setAddress] = (0, import_react.useState)(profile.addressLine);
	const [city, setCity] = (0, import_react.useState)(profile.city);
	const [zip, setZip] = (0, import_react.useState)(profile.zip);
	const [orders, setOrders] = (0, import_react.useState)([]);
	const [rewards, setRewards] = (0, import_react.useState)(null);
	const [msg, setMsg] = (0, import_react.useState)("");
	const [secret, setSecret] = (0, import_react.useState)("");
	const [uri, setUri] = (0, import_react.useState)("");
	const [code, setCode] = (0, import_react.useState)("");
	const [totpOn, setTotpOn] = (0, import_react.useState)(profile.totpEnabled);
	const email = profile.email;
	const [newPass, setNewPass] = (0, import_react.useState)("");
	const [confirmPass, setConfirmPass] = (0, import_react.useState)("");
	const [passBusy, setPassBusy] = (0, import_react.useState)(false);
	const [otp, setOtp] = (0, import_react.useState)("");
	const [otpSent, setOtpSent] = (0, import_react.useState)("");
	const [previewCode, setPreviewCode] = (0, import_react.useState)("");
	const [otpLeft, setOtpLeft] = (0, import_react.useState)(0);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [avatarUrl, setAvatarUrl] = (0, import_react.useState)(profile.avatarUrl || "");
	const [photoBusy, setPhotoBusy] = (0, import_react.useState)(false);
	const [photoErr, setPhotoErr] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		listMyOrders().then(setOrders).catch(() => setOrders([]));
		getMyRewards().then(setRewards).catch(() => setRewards(null));
	}, []);
	(0, import_react.useEffect)(() => {
		if (otpLeft <= 0) return;
		const t = window.setInterval(() => setOtpLeft((n) => Math.max(0, n - 1)), 1e3);
		return () => window.clearInterval(t);
	}, [otpLeft]);
	const inviteUrl = (0, import_react.useMemo)(() => {
		const code = rewards?.referralCode || profile.referralCode;
		if (typeof window === "undefined" || !code) return "";
		return `${window.location.origin}/login?ref=${encodeURIComponent(code)}`;
	}, [rewards?.referralCode, profile.referralCode]);
	function go(next) {
		navigate({
			to: "/account",
			search: next === "summary" ? {} : { tab: next }
		});
	}
	const who = name.trim() || profile.displayName || "there";
	const points = rewards?.points ?? profile.points;
	const recent = orders.slice(0, 3);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "page-card account-hero",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "shop-brand-kicker",
				children: "Your account"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "account-hero-who",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountAvatar, {
					src: avatarUrl,
					name: who,
					size: 72
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: ["Hello, ", who] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "ed-sub",
						children: [email || "Signed in", phone ? ` · ${formatPhone(phone) || phone}` : ""]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "points-chip",
						children: [points, " reward points"]
					})
				] })]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "account-tabs",
			role: "tablist",
			"aria-label": "Account",
			children: [
				["summary", "Summary"],
				["details", "Details"],
				["security", "Security"],
				["rewards", "Rewards"]
			].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				role: "tab",
				"aria-selected": tab === id,
				"data-on": tab === id,
				onClick: () => go(id),
				children: label
			}, id))
		}),
		tab === "summary" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Account summary" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kpi-grid account-kpis",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "kpi",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Points" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: points })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "kpi",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Orders" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: profile.orderCount || orders.length })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "kpi",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Friends invited" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: rewards?.inviteCount ?? profile.inviteCount })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "kpi",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Security" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: totpOn ? "2FA on" : "2FA off" })]
							})
						]
					}),
					profile.memberSince ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "ed-sub",
						children: ["Member since ", formatShopWhen(profile.memberSince)]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Recent orders" }), recent.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "account-recent",
					children: recent.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "account-order",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["#", formatTicketNo(o.ticketNo)] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "order-meta",
							children: [
								formatShopWhen(o.createdAt),
								" · ",
								o.fulfillment,
								" · ",
								o.status
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatUsd(o.total) })]
					}, o.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "No orders yet. Your tickets will land here."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Order history" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderDateTrays, {
					orders,
					empty: "No orders yet.",
					children: (o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "account-order",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["#", formatTicketNo(o.ticketNo)] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "order-meta",
								children: [
									formatShopWhen(o.createdAt),
									" · ",
									o.fulfillment,
									" · ",
									o.status,
									o.tax ? ` · tax ${formatUsd(o.tax)}` : ""
								]
							}),
							o.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "ed-sub",
								children: ["Note: ", o.notes]
							}) : null,
							o.pickupName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "ed-sub",
								children: ["Pickup for ", o.pickupName]
							}) : null,
							o.scheduledFor ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "ed-sub",
								children: ["Scheduled ", formatShopWhen(o.scheduledFor)]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: o.items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
								it.qty,
								"× ",
								it.name,
								it.size ? ` (${it.size})` : "",
								it.detail ? ` — ${it.detail}` : "",
								it.comment ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "cook-note",
									children: it.comment
								}) : null
							] }, i)) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ed-btn",
								onClick: () => {
									for (const it of o.items) add({
										itemId: it.itemId,
										categoryId: it.categoryId,
										name: it.name,
										size: it.size,
										detail: it.detail,
										comment: it.comment,
										toppings: it.toppings,
										halfItemId: it.halfItemId,
										unitPrice: it.unitPrice,
										qty: it.qty
									});
									if (o.notes) setNotes(o.notes);
									navigate({ to: "/" });
								},
								children: "Reorder"
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatUsd(o.total) })]
					}, o.id)
				})]
			})
		] }) : null,
		tab === "details" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "page-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Account details" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "The name on tickets, the phone the shop texts, and the address used for delivery."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ed-shop",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "account-icon-edit",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountAvatar, {
								src: avatarUrl,
								name: who,
								size: 72
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ed-field",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Account icon" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "ed-sub",
									children: "This picture shows in the title bar. Square photos work best."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "account-icon-actions",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "ed-btn ed-btn-quiet ed-photo-pick",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
												size: 14,
												strokeWidth: 2.2
											}),
											avatarUrl ? "Replace photo" : "Upload photo",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "file",
												accept: "image/png,image/jpeg,image/webp",
												disabled: photoBusy,
												onChange: (e) => {
													const file = e.target.files?.[0];
													e.target.value = "";
													if (!file) return;
													setPhotoBusy(true);
													setPhotoErr("");
													fileToDataImage(file, {
														maxEdge: 384,
														maxChars: 12e4,
														quality: .84
													}).then((url) => setMyAvatar({ data: { image: url } }).then((r) => setAvatarUrl(r.avatarUrl))).catch((err) => setPhotoErr(err instanceof Error ? err.message : "Could not save that photo")).finally(() => setPhotoBusy(false));
												}
											})
										]
									}), avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "ed-btn ed-btn-quiet",
										disabled: photoBusy,
										onClick: () => {
											setPhotoBusy(true);
											setPhotoErr("");
											setMyAvatar({ data: { image: "" } }).then((r) => setAvatarUrl(r.avatarUrl)).catch((err) => setPhotoErr(err instanceof Error ? err.message : "Could not remove that photo")).finally(() => setPhotoBusy(false));
										},
										children: "Remove"
									}) : null]
								}),
								photoBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "ed-empty",
									children: "Saving photo…"
								}) : null,
								photoErr ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "form-error",
									children: photoErr
								}) : null
							] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								value: name,
								onChange: (e) => setName(e.target.value),
								autoComplete: "name"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								value: phone,
								onChange: (e) => setPhone(e.target.value),
								inputMode: "tel",
								autoComplete: "tel"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								type: "email",
								value: email,
								readOnly: true,
								autoComplete: "email"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Street address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								value: address,
								onChange: (e) => setAddress(e.target.value),
								autoComplete: "street-address",
								placeholder: "123 Main St"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "account-cityzip",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "City" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: city,
									onChange: (e) => setCity(e.target.value),
									autoComplete: "address-level2",
									placeholder: "Egg Harbor Township"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ZIP" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: zip,
									onChange: (e) => setZip(e.target.value),
									autoComplete: "postal-code",
									inputMode: "numeric",
									placeholder: "08234"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ed-btn",
							onClick: () => {
								updateProfile({ data: {
									phone,
									displayName: name,
									addressLine: address,
									city,
									zip
								} }).then(() => setMsg("Saved.")).catch((e) => setMsg(e instanceof Error ? e.message : "Could not save"));
							},
							children: "Save profile"
						}),
						msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: msg
						}) : null
					]
				})
			]
		}) : null,
		tab === "security" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "page-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Reset password" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "We email a 60-second one-time code to the address on this account. Enter that code, then choose a new password. Google and X logins keep using those buttons."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "login-form",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Email on this account" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								type: "email",
								value: email,
								readOnly: true,
								autoComplete: "email"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ed-btn",
							disabled: passBusy || otpLeft > 0,
							onClick: () => {
								setPassBusy(true);
								setMsg("");
								sendPasswordResetCode().then((r) => {
									setOtpSent(r.email);
									setPreviewCode(r.previewCode || "");
									setOtpLeft(r.expiresIn);
									setOtp("");
									setMsg(`Code sent to ${r.email}. It expires in 60 seconds.`);
								}).catch((err) => setMsg(err instanceof Error ? err.message : "Could not send the code")).finally(() => setPassBusy(false));
							},
							children: otpLeft > 0 ? `Send again in ${otpLeft}s` : "Send one-time code"
						}),
						otpSent ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mail-slip",
							role: "status",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "slip-kind",
									children: ["Inbox · ", otpSent]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Your South End Pizza III reset code" }),
								previewCode && otpLeft > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "otp-code",
									children: previewCode
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "ed-sub",
									children: otpLeft > 0 ? `Enter the 6-digit code. ${otpLeft}s left.` : "That code expired. Send a new one."
								}),
								previewCode && otpLeft > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "ed-sub",
									children: [
										"This shop preview shows the message here. It expires in ",
										otpLeft,
										"s."
									]
								}) : null
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "login-form",
							onSubmit: (e) => {
								e.preventDefault();
								if (newPass !== confirmPass) {
									setMsg("The new passwords do not match.");
									return;
								}
								setPassBusy(true);
								setMsg("");
								changeMyPassword({ data: {
									code: otp,
									password: newPass
								} }).then(() => {
									setNewPass("");
									setConfirmPass("");
									setOtp("");
									setPreviewCode("");
									setOtpLeft(0);
									setMsg("Password updated. Use it the next time you sign in.");
								}).catch((err) => setMsg(err instanceof Error ? err.message : "Could not update password")).finally(() => setPassBusy(false));
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "ed-field",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "One-time code" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "ed-input",
										inputMode: "numeric",
										autoComplete: "one-time-code",
										value: otp,
										onChange: (e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)),
										maxLength: 6,
										required: true,
										placeholder: "6 digits"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "ed-field",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "New password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "ed-input",
										type: "password",
										value: newPass,
										onChange: (e) => setNewPass(e.target.value),
										autoComplete: "new-password",
										minLength: 8,
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "ed-field",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Confirm password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "ed-input",
										type: "password",
										value: confirmPass,
										onChange: (e) => setConfirmPass(e.target.value),
										autoComplete: "new-password",
										minLength: 8,
										required: true
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "btn-print",
									disabled: passBusy || otp.length !== 6,
									children: passBusy ? "Saving…" : "Set new password"
								})
							]
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "page-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Two-factor authentication" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Protect the account with an authenticator app (Google Authenticator, Authy, 1Password). This is app-based 2FA — not SMS."
				}),
				totpOn ? totpLocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Settings requires shop admin two-factor. Turn that off under Admin → Settings if you want to drop the authenticator, or rotate it by enrolling a new key after a verified session."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "login-form",
					onSubmit: (e) => {
						e.preventDefault();
						disableTotp({ data: { code } }).then(() => {
							setTotpOn(false);
							setCode("");
							setMsg("Two-factor turned off.");
						}).catch((err) => setMsg(err instanceof Error ? err.message : "Could not disable"));
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Code to turn off" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "ed-input",
							value: code,
							onChange: (e) => setCode(e.target.value)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "ed-btn",
						children: "Turn off 2FA"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "login-form",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-btn",
						onClick: () => {
							startTotpSetup().then((r) => {
								setSecret(r.secret);
								setUri(r.uri);
							});
						},
						children: "Set up authenticator"
					}), secret ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "ed-sub",
							children: ["Add this key in your app, then enter a code to confirm. ", formatPhone(phone)]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "totp-secret",
							children: secret
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub break-all",
							children: uri
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Confirm code" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								value: code,
								onChange: (e) => setCode(e.target.value)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn-print",
							onClick: () => {
								confirmTotpSetup({ data: { code } }).then(() => {
									setTotpOn(true);
									setSecret("");
									setMsg("Two-factor is on.");
								}).catch((err) => setMsg(err instanceof Error ? err.message : "Could not enable"));
							},
							children: "Confirm 2FA"
						})
					] }) : null]
				}),
				msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: msg
				}) : null
			]
		})] }) : null,
		tab === "rewards" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RewardsTab, {
			rewards,
			inviteUrl,
			copied,
			onCopied: () => {
				setCopied(true);
				window.setTimeout(() => setCopied(false), 1600);
			}
		}) : null
	] });
}
function kindLabel(kind) {
	if (kind === "welcome") return "Welcome";
	if (kind === "earn") return "Earned";
	if (kind === "redeem") return "Redeemed";
	if (kind === "invite") return "Invite bonus";
	if (kind === "invitee") return "Friend invite";
	return "Adjustment";
}
function RewardsTab({ rewards, inviteUrl, copied, onCopied }) {
	if (!rewards) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "page-skel",
		children: "Loading rewards…"
	});
	const earn = Math.round(20 * (rewards.pointsPerDollar || 0));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "page-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Rewards program" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "ed-sub",
					children: [
						"Earn ",
						rewards.pointsPerDollar,
						" point",
						rewards.pointsPerDollar === 1 ? "" : "s",
						" per dollar on food. ",
						rewards.redeemRate,
						" ",
						"points = $1 off at checkout."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rewards-preview",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "points-chip",
							children: [rewards.points, " pts in wallet"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "points-chip",
							children: [earn, " pts on a $20 pie"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "points-chip",
							children: [rewards.welcomeBonus, " welcome pts"]
						})
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "page-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Invite friends" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "ed-sub",
					children: [
						"Share your link or QR. A friend who creates an account gets ",
						rewards.inviteeBonus,
						" extra points. You get",
						" ",
						rewards.inviteBonus,
						" points when they join."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Your invite link" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						value: inviteUrl,
						readOnly: true
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "account-quick",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "ed-btn",
						onClick: () => {
							if (!inviteUrl) return;
							navigator.clipboard.writeText(inviteUrl).then(onCopied).catch(() => void 0);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {
							size: 16,
							strokeWidth: 2.2
						}), copied ? "Copied" : "Copy link"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						className: "ed-btn",
						href: inviteUrl || "#",
						onClick: (e) => !inviteUrl && e.preventDefault(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, {
							size: 16,
							strokeWidth: 2.2
						}), "Open link"]
					})]
				}),
				inviteUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "invite-qr-wrap",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InviteQr, {
						value: inviteUrl,
						label: "Invite QR code"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "ed-sub",
						children: [
							"Code ",
							rewards.referralCode,
							". ",
							rewards.inviteCount,
							" friend",
							rewards.inviteCount === 1 ? "" : "s",
							" joined."
						]
					})]
				}) : null,
				rewards.invited.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "invite-friends",
					children: rewards.invited.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: row.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.at ? formatShopWhen(row.at) : "" })] }, `${row.at}-${i}`))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "No friends have joined with your code yet."
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "page-card",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Rewards history" }), rewards.history.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "rewards-log",
				children: rewards.history.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: kindLabel(row.kind) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "order-meta",
					children: [row.createdAt ? formatShopWhen(row.createdAt) : "", row.note ? ` · ${row.note}` : ""]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
					"data-neg": row.points < 0 ? "true" : void 0,
					children: [row.points > 0 ? "+" : "", row.points]
				})] }, row.id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "No points movement yet. Place an order or invite a friend."
			})]
		})
	] });
}
//#endregion
//#region src/components/admin-drawer.tsx
function AdminDrawer() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [open, setOpen] = (0, import_react.useState)(false);
	const [unread, setUnread] = (0, import_react.useState)(0);
	const [outMsg, setOutMsg] = (0, import_react.useState)("");
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setOpen(false);
	}, [pathname]);
	(0, import_react.useEffect)(() => {
		const pull = () => {
			getAdminInboxCount().then((r) => setUnread(r.unread)).catch(() => void 0);
		};
		pull();
		const stopListen = onAdminInbox(setUnread);
		const stopPoll = onVisibleInterval(12e3, pull);
		return () => {
			stopListen();
			stopPoll();
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "admin-top-cluster",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "admin-drawer-toggle",
				"aria-expanded": open,
				"aria-controls": "admin-drawer",
				onClick: () => setOpen((v) => !v),
				children: [
					open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						size: 18,
						strokeWidth: 2.2
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
						size: 18,
						strokeWidth: 2.2
					}),
					open ? "Close" : "Menu",
					!open && unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "nav-pip",
						children: unread
					}) : null
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				id: "admin-top-extra",
				className: "admin-top-extra"
			})]
		}),
		open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "admin-drawer-scrim",
			"aria-label": "Close admin menu",
			onClick: () => setOpen(false)
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			id: "admin-drawer",
			className: "admin-drawer",
			"data-open": open,
			"aria-label": "Admin",
			"aria-hidden": !open,
			inert: !open ? true : void 0,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "shop-nav-link",
					"data-on": pathname === "/",
					children: "Main menu"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "shop-brand-kicker",
					children: "Admin"
				}),
				[...ADMIN_NAV].sort((a, b) => {
					const rank = (item) => item.pin === "start" ? 0 : item.pin === "end" ? 2 : 1;
					const d = rank(a) - rank(b);
					if (d) return d;
					return a.label.localeCompare(b.label, "en");
				}).map((item) => {
					const on = item.exact ? pathname === item.to || pathname === `${item.to}/` : pathname === item.to || pathname.startsWith(`${item.to}/`);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: item.to,
						className: "shop-nav-link",
						"data-on": on,
						activeOptions: item.exact ? { exact: true } : void 0,
						children: [item.label, item.pip && unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "nav-pip",
							children: unread
						}) : null]
					}, item.to);
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "shop-nav-link admin-drawer-logout",
					disabled: signingOut,
					onClick: () => {
						setOutMsg("");
						setSigningOut(true);
						signOut("/").catch((e) => {
							setSigningOut(false);
							setOutMsg(e instanceof Error ? e.message : "Could not sign out");
						});
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {
						size: 16,
						strokeWidth: 2.2
					}), signingOut ? "Signing out…" : "Log out"]
				}),
				outMsg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: outMsg
				}) : null
			]
		})
	] });
}
//#endregion
//#region src/lib/ticket-line.ts
function lineSummary(it) {
	const bits = [`${Math.max(1, Math.round(Number(it.qty) || 1))}× ${String(it.name ?? "").trim() || "Item"}`];
	const size = String(it.size ?? "").trim();
	const detail = String(it.detail ?? "").trim();
	const comment = String(it.comment ?? "").trim();
	if (size) bits.push(size);
	if (detail) bits.push(detail);
	if (comment) bits.push(`Cook: ${comment}`);
	return bits.join(" · ");
}
function payStatusLabel(method, status) {
	if (method === "pay_card") return "Card (not live)";
	const label = payMethodLabel(method);
	if (status === "awaiting_payment") return `${label} · unpaid`;
	return label;
}
//#endregion
//#region src/lib/pos-toast.ts
var POS_TOAST_MS = 3500;
function formatCompletedToast(opts) {
	const tip = Number(opts.tip) || 0;
	const num = typeof opts.ticketNo === "number" ? opts.ticketNo : Number(opts.ticketNo) || 0;
	return {
		tone: "completed",
		title: "Completed",
		text: `Completed #${opts.formatTicketNo(num)} · ${opts.formatUsd(opts.total)}${tip > 0 ? ` (tip ${opts.formatUsd(tip)})` : ""}`
	};
}
function formatAcceptedToast(opts) {
	const num = typeof opts.ticketNo === "number" ? opts.ticketNo : Number(opts.ticketNo) || 0;
	return {
		tone: "accepted",
		title: "Accepted",
		text: `Ticket #${opts.formatTicketNo(num)} accepted — sent to the kitchen.`
	};
}
//#endregion
//#region src/components/pos-staff-toast.tsx
/** Same chrome as Accept — portaled to body so POS tabs cannot cover it. */
function PosStaffToast({ toast }) {
	if (!toast || typeof document === "undefined") return null;
	return (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "save-toast pos-accept-toast",
		"data-ok": "true",
		"data-kind": toast.tone,
		"data-tone": toast.tone,
		role: "status",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: toast.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: toast.text })]
	}), document.body);
}
//#endregion
//#region src/components/incoming-order-queue.tsx
var DEFAULT_ALARM = "/order-alarm.wav";
var SNOOZE_KEY = "southend-order-snooze";
var POS_ACCEPTED_EVENT = "southend-pos-accepted";
function loadSnooze() {
	try {
		const raw = sessionStorage.getItem(SNOOZE_KEY);
		const list = raw ? JSON.parse(raw) : [];
		return new Set(Array.isArray(list) ? list : []);
	} catch {
		return /* @__PURE__ */ new Set();
	}
}
function saveSnooze(ids) {
	try {
		sessionStorage.setItem(SNOOZE_KEY, JSON.stringify([...ids]));
	} catch {}
}
function fifoIncoming(list) {
	return [...list].sort((a, b) => {
		const ta = Date.parse(a.createdAt) || 0;
		const tb = Date.parse(b.createdAt) || 0;
		if (ta !== tb) return ta - tb;
		return (a.ticketNo || 0) - (b.ticketNo || 0) || a.id.localeCompare(b.id);
	});
}
function emitPosAccepted(order) {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new CustomEvent(POS_ACCEPTED_EVENT, { detail: order }));
}
function IncomingOrderQueue() {
	const [queue, setQueue] = (0, import_react.useState)([]);
	const [currentId, setCurrentId] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [src, setSrc] = (0, import_react.useState)(DEFAULT_ALARM);
	const [toast, setToast] = (0, import_react.useState)(null);
	const seen = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const snoozed = (0, import_react.useRef)(loadSnooze());
	const taken = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const primed = (0, import_react.useRef)(false);
	const audioRef = (0, import_react.useRef)(null);
	const mutedRef = (0, import_react.useRef)(muted);
	(0, import_react.useEffect)(() => {
		mutedRef.current = muted;
	}, [muted]);
	(0, import_react.useEffect)(() => {
		getAdminShop().then((d) => setSrc(d.notifyAudio || DEFAULT_ALARM)).catch(() => void 0);
	}, []);
	(0, import_react.useEffect)(() => {
		const el = new Audio(src);
		el.preload = "auto";
		audioRef.current = el;
		return () => {
			el.pause();
			audioRef.current = null;
		};
	}, [src]);
	(0, import_react.useEffect)(() => {
		if (!toast) return;
		const t = window.setTimeout(() => setToast(null), POS_TOAST_MS);
		return () => window.clearTimeout(t);
	}, [toast]);
	function ring() {
		if (mutedRef.current) return;
		const el = audioRef.current;
		if (!el) return;
		el.currentTime = 0;
		el.play().catch(() => void 0);
	}
	function applyIncoming(list) {
		const live = fifoIncoming(list.filter((t) => (t.status === "placed" || t.status === "awaiting_payment") && !snoozed.current.has(t.id) && !taken.current.has(t.id)));
		setQueue(live);
		setCurrentId((cur) => {
			if (cur && live.some((t) => t.id === cur)) return cur;
			return live[0]?.id ?? "";
		});
		const fresh = live.filter((t) => !seen.current.has(t.id));
		for (const t of live) seen.current.add(t.id);
		if (fresh.length) ring();
		else if (!primed.current && live.length) ring();
		primed.current = true;
	}
	(0, import_react.useEffect)(() => {
		return onVisibleInterval(4e3, () => {
			listIncomingOrders().then(applyIncoming).catch(() => void 0);
		});
	}, [src]);
	(0, import_react.useEffect)(() => {
		if (!queue.length || muted) return;
		const t = window.setInterval(() => ring(), 1e4);
		return () => window.clearInterval(t);
	}, [
		queue.length,
		muted,
		src
	]);
	const current = queue.find((t) => t.id === currentId) ?? queue[0];
	const place = current ? queue.findIndex((t) => t.id === current.id) + 1 : 0;
	function take() {
		if (!current || busy || taken.current.has(current.id)) return;
		const ticket = current;
		taken.current.add(ticket.id);
		setBusy(true);
		setError("");
		const remaining = queue.filter((t) => t.id !== ticket.id);
		setQueue(remaining);
		setCurrentId(remaining[0]?.id ?? "");
		acceptOrder({ data: { id: ticket.id } }).then((order) => {
			const accepted = {
				...ticket,
				...order,
				status: "accepted",
				customerName: ticket.customerName,
				customerPhone: ticket.customerPhone,
				chatUnread: ticket.chatUnread,
				chatThreadId: ticket.chatThreadId
			};
			emitPosAccepted(accepted);
			setToast(formatAcceptedToast({
				ticketNo: accepted.ticketNo,
				formatTicketNo
			}));
		}).catch((e) => {
			const msg = e instanceof Error ? e.message : "Could not accept";
			if (/already|accepted|preparing|ready|cannot be accepted/i.test(msg)) {
				taken.current.add(ticket.id);
				emitPosAccepted({
					...ticket,
					status: "accepted"
				});
				setToast(formatAcceptedToast({
					ticketNo: ticket.ticketNo,
					formatTicketNo
				}));
				return;
			}
			taken.current.delete(ticket.id);
			setError(msg);
			setQueue((list) => {
				if (list.some((t) => t.id === ticket.id)) return list;
				return fifoIncoming([ticket, ...list]);
			});
			setCurrentId(ticket.id);
		}).finally(() => setBusy(false));
	}
	const toastEl = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PosStaffToast, { toast });
	if (!current) return toastEl;
	const where = current.fulfillment === "delivery" ? `${current.addressLine}${current.city ? `, ${current.city}` : ""} ${current.zip}`.trim() : current.pickupName ? `Pickup for ${current.pickupName}` : "Pickup at the counter";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [toastEl, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "order-alert-scrim",
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "order-alert-title",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "order-alert",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "order-alert-head",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "shop-brand-kicker",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
								size: 14,
								strokeWidth: 2.4
							}), " Incoming · oldest first"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							id: "order-alert-title",
							children: ["Ticket #", formatTicketNo(current.ticketNo)]
						}),
						queue.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", {
							className: "order-alert-q",
							children: [
								queue.length,
								" tickets waiting for the kitchen · showing ",
								place,
								" of ",
								queue.length,
								", oldest first"
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
							className: "order-alert-q",
							children: "Oldest ticket waiting for the kitchen"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ed-icon-btn",
							"aria-label": muted ? "Unmute alarm" : "Mute alarm",
							onClick: () => {
								mutedRef.current = !mutedRef.current;
								setMuted(mutedRef.current);
								audioRef.current?.pause();
							},
							children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, {
								size: 16,
								strokeWidth: 2.2
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {
								size: 16,
								strokeWidth: 2.2
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "order-alert-who",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: current.pickupName || current.customerName }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						current.fulfillment === "delivery" ? "Delivery" : "Pickup",
						" · ",
						formatUsd(current.total)
					] })]
				}),
				current.customerPhone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: current.customerPhone
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "ed-sub",
					children: [
						"Placed ",
						formatShopWhen(current.createdAt),
						current.scheduledFor ? ` · promised ${formatShopWhen(current.scheduledFor)}` : " · as soon as ready"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: where
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: payStatusLabel(current.paymentMethod, current.status)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "cart-lines",
					children: current.items.slice(0, 8).map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lineSummary(it) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatUsd(it.unitPrice * it.qty) })] }, `${it.itemId}-${i}`))
				}),
				current.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "pos-notes",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Notes" }),
						" ",
						current.notes
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "totals",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Food" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(current.subtotal) })] }),
						current.discount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Rewards" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: ["−", formatUsd(current.discount)] })] }) : null,
						current.deliveryFee ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Delivery" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(current.deliveryFee) })] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Tax" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(current.tax) })] }),
						current.tip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Tip" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(current.tip) })] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "totals-grand",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(current.total) })]
						})
					]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "form-error",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "confirm-actions",
					children: [current.status === "accepted" || current.status === "preparing" || current.status === "ready" || taken.current.has(current.id) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-print",
						disabled: true,
						children: "Accepted"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-print",
						disabled: busy,
						onClick: take,
						children: busy ? "Accepting…" : "Accept order"
					}), queue.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-btn",
						disabled: busy,
						onClick: () => {
							const i = queue.findIndex((t) => t.id === current.id);
							const next = queue[(i + 1 + queue.length) % queue.length];
							if (next) setCurrentId(next.id);
						},
						children: "Show next oldest"
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Accept sends this ticket to the kitchen and cannot be tapped twice. Other waiting tickets stay in this pop-up, oldest first."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "order-alert-hide",
					"aria-label": "Hide incoming pop-ups for now. Tickets stay on the Open board.",
					onClick: () => {
						for (const t of queue) snoozed.current.add(t.id);
						saveSnooze(snoozed.current);
						setQueue([]);
						setCurrentId("");
						audioRef.current?.pause();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						size: 14,
						strokeWidth: 2.4
					}), " Hide pop-ups — tickets stay on Open"]
				})
			]
		})
	})] });
}
//#endregion
//#region src/routes/admin.tsx
var Route$26 = createFileRoute("/admin")({ component: AdminLayout });
function AdminLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const posMode = pathname === "/admin/pos" || pathname.startsWith("/admin/pos/");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "shop-shell",
		"data-pos": posMode || void 0,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionGate, {
			needAdmin: true,
			children: ({ profile }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopHeader, { profile }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "admin-layout",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminDrawer, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
						className: "admin-main",
						id: "main",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IncomingOrderQueue, {})
			] })
		})
	});
}
//#endregion
//#region src/components/menu-board.tsx
var LETTER_GROUPS = [[
	"pizza",
	"gourmet",
	"appetizers",
	"salads",
	"sides",
	"wings"
], [
	"turnovers",
	"sandwiches",
	"clubs",
	"hot-subs",
	"cold-subs",
	"steak-subs",
	"burgers",
	"wraps",
	"gyros",
	"pasta",
	"desserts",
	"beverages"
]];
var WIDE_GROUPS = [
	[
		"pizza",
		"gourmet",
		"turnovers",
		"pasta"
	],
	[
		"appetizers",
		"salads",
		"sides",
		"wings",
		"sandwiches",
		"clubs",
		"desserts",
		"beverages"
	],
	[
		"hot-subs",
		"cold-subs",
		"steak-subs",
		"burgers",
		"wraps",
		"gyros"
	]
];
function money(price) {
	const t = price.trim().replace(/^\$/, "");
	if (!t) return "—";
	const n = Number(t);
	if (Number.isFinite(n)) return `$${n.toFixed(2)}`;
	return `$${t}`;
}
function displayName(item, cat) {
	let n = item.name;
	if (cat.id === "pizza" || cat.id === "gourmet") n = n.replace(/ Pizza$/, "");
	if (cat.id === "hot-subs") n = n.replace(/ Hot Sub$/, "");
	if (cat.id === "cold-subs") n = n.replace(/ Cold Sub$/, "");
	if (cat.id === "sandwiches") n = n.replace(/ Sandwich$/, "");
	if (cat.id === "clubs") n = n.replace(/ Sandwich$/, "");
	if (cat.id === "wraps") n = n.replace(/ Wrap$/, "");
	if (cat.id === "steak-subs") n = n.replace(/ Sub$/, "");
	if (cat.id === "gyros") n = n.replace(/ Sandwich$/, "");
	return n || "Untitled";
}
function usefulPrices(prices) {
	if (prices.length === 1 && prices[0].label === "LG") return [{
		...prices[0],
		label: void 0
	}];
	return prices;
}
function pizzaHasXl(item) {
	return item.prices.some((p) => p.label === "XL" && p.price);
}
function SizeLegend({ xl, xlInches }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "size-legend",
		"aria-label": "Pizza sizes",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "size-pip",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "size-disc size-disc-sm",
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
				}), "SM 12\""]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "size-pip",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "size-disc size-disc-md",
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
				}), "MD 14\""]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "size-pip",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "size-disc size-disc-lg",
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
				}), "LG 16\""]
			}),
			xl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "size-pip",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "size-disc size-disc-xl",
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {})
					}),
					"XL ",
					xlInches
				]
			}) : null
		]
	});
}
function PizzaRow({ item, cat, showDesc, xl }) {
	const cols = (xl ? [
		"SM",
		"MD",
		"LG",
		"XL"
	] : [
		"SM",
		"MD",
		"LG"
	]).map((lab) => item.prices.find((p) => p.label === lab));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "item-row",
		"data-kind": "pizza",
		"data-xl": xl ? "true" : void 0,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "bullet",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "item-copy",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "item-name",
					"data-fav": item.highlight ? "true" : void 0,
					children: [displayName(item, cat), item.highlight ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "fav-tag",
						children: "House favorite"
					}) : null]
				}), showDesc && item.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "item-desc",
					children: [item.description, "."]
				}) : null]
			}),
			cols.map((col, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "price",
				"data-size": col?.label,
				children: col ? money(col.price) : "—"
			}, i))
		]
	});
}
function ItemRow({ item, cat, showDesc }) {
	const prices = usefulPrices(item.prices);
	const multi = prices.length > 1 || Boolean(prices[0]?.label);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "item-row",
		"data-kind": multi ? "split" : "single",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "bullet",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "item-copy",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "item-name",
					children: displayName(item, cat)
				}), showDesc && item.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "item-desc",
					children: [item.description, "."]
				}) : null]
			}),
			multi ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "split-prices",
				children: prices.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pair",
					children: [p.label ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "lbl",
						children: p.label
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "price",
						children: money(p.price)
					})]
				}, i))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lead-price",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "dots",
					"aria-hidden": true
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "price",
					children: money(prices[0]?.price ?? "")
				})]
			})
		]
	});
}
function Section({ cat, showDesc }) {
	const Icon = CATEGORY_ICONS[cat.icon ?? cat.id] ?? Pizza;
	const pizza = cat.kind === "pizza";
	const xl = pizza && cat.items.some(pizzaHasXl);
	const xlInches = cat.items.flatMap((it) => it.prices).find((p) => p.label === "XL")?.inches || "18\"";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "menu-section",
		id: cat.id,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "section-head",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "section-icon",
					"aria-hidden": true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { strokeWidth: 2.2 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "section-title",
					children: cat.name || "Untitled"
				})]
			}),
			cat.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "section-note",
				children: cat.note
			}) : null,
			pizza ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pizza-cols",
				"data-xl": xl ? "true" : void 0,
				"aria-hidden": true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["SM", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inches",
						children: "12\""
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["MD", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inches",
						children: "14\""
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["LG", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inches",
						children: "16\""
					})] }),
					xl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["XL", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inches",
						children: xlInches
					})] }) : null
				]
			}) : null,
			cat.items.map((item, i) => pizza ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PizzaRow, {
				item,
				cat,
				showDesc,
				xl
			}, item.id ?? `${item.name}-${i}`) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemRow, {
				item,
				cat,
				showDesc
			}, item.id ?? `${item.name}-${i}`))
		]
	});
}
function layoutColumns(paper, cats) {
	const presets = paper === "letter" ? LETTER_GROUPS : WIDE_GROUPS;
	const byId = new Map(cats.map((c) => [c.id, c]));
	const used = /* @__PURE__ */ new Set();
	const cols = presets.map((group) => {
		const col = [];
		for (const id of group) {
			const c = byId.get(id);
			if (c) {
				col.push(c);
				used.add(id);
			}
		}
		return col;
	});
	for (const c of cats) if (!used.has(c.id)) cols[cols.length - 1].push(c);
	return cols.filter((col) => col.length > 0);
}
function MenuBoard({ paper, showDesc, showMark = true }) {
	const restaurant = useMenuStore((s) => s.restaurant);
	const footer = useMenuStore((s) => s.footer);
	const categories = useMenuStore((s) => s.categories);
	const page = paper === "letter" ? "letter portrait" : paper === "poster" ? "18in 24in landscape" : "11in 17in landscape";
	const groups = layoutColumns(paper, categories);
	const xl = categories.some((c) => c.kind === "pizza" && c.items.some(pizzaHasXl));
	const xlInches = categories.flatMap((c) => c.items).flatMap((it) => it.prices).find((p) => p.label === "XL")?.inches || "18\"";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "paper",
		"data-paper": paper,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `@media print { @page { size: ${page}; margin: 0.38in; } }` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "masthead",
				children: [
					showMark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { variant: "mast" }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mast-kicker",
						children: ["Egg Harbor Township · Est. ", restaurant.established]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mast-name",
						children: restaurant.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mast-meta",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: restaurant.address }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: restaurant.city }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: restaurant.phoneHref,
								children: restaurant.phone
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: restaurant.hours })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SizeLegend, {
						xl,
						xlInches
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "menu-columns",
				children: groups.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "menu-col",
					children: col.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
						cat,
						showDesc
					}, cat.id))
				}, col.map((c) => c.id).join("-")))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "board-foot",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: footer }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Wall menu · ", restaurant.name] })]
			})
		]
	});
}
function CategoryJump() {
	const categories = useMenuStore((s) => s.categories);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "jump-nav no-print",
		"aria-label": "Menu sections",
		children: categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
			href: `#${cat.id}`,
			children: cat.name || "Untitled"
		}, cat.id))
	});
}
//#endregion
//#region src/routes/board.tsx
var Route$25 = createFileRoute("/board")({ component: BoardPage });
function BoardPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionGate, {
		needAdmin: true,
		children: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardInner, {})
	});
}
function BoardInner() {
	const [paper, setPaper] = (0, import_react.useState)("tabloid");
	const [showDesc, setShowDesc] = (0, import_react.useState)(false);
	const [showMark, setShowMark] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		useMenuStore.persist.rehydrate();
		getStorefront().then((data) => {
			setShowMark(data.settings.showMark);
			useMenuStore.getState().replaceAll({
				restaurant: data.restaurant,
				footer: data.footer,
				categories: data.categories.map((c) => ({
					...c,
					items: c.items.map((it, i) => ({
						...it,
						id: it.id ?? `${c.id}-${i}`
					}))
				}))
			});
		});
	}, []);
	(0, import_react.useEffect)(() => {
		document.documentElement.dataset.paper = paper;
		return () => {
			delete document.documentElement.dataset.paper;
		};
	}, [paper]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "studio-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "studio-toolbar no-print",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "toolbar-title",
					children: "South End Pizza III · Wall Menu"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "toolbar-actions",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "btn-ghost",
						children: "Customer menu"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn-print",
						onClick: () => window.print(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {
							size: 16,
							strokeWidth: 2.2
						}), "Print / Save PDF"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "toolbar-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "seg",
						role: "group",
						"aria-label": "Paper size",
						children: [
							["letter", "Letter"],
							["tabloid", "Tabloid 11×17"],
							["poster", "Poster 18×24"]
						].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": paper === id,
							onClick: () => setPaper(id),
							children: label
						}, id))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "seg",
						role: "group",
						"aria-label": "Descriptions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": showDesc,
							onClick: () => setShowDesc(true),
							children: "Full"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": !showDesc,
							onClick: () => setShowDesc(false),
							children: "Compact"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "toolbar-hint",
					children: "Print this board and post it on the wall. Turn on background graphics so the cream paper and red headers come through."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryJump, {})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "preview-wrap",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuBoard, {
				paper,
				showDesc,
				showMark
			})
		})]
	});
}
//#endregion
//#region src/routes/checkout.tsx
var Route$24 = createFileRoute("/checkout")({
	loader: () => retryTransient(() => getStorefront()),
	staleTime: 3e4,
	pendingMs: 8e3,
	pendingComponent: CheckoutPending,
	component: CheckoutPage
});
function CheckoutPending() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "shop-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "shop-main",
			id: "main",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "page-skel",
				children: "Loading checkout…"
			})
		})]
	});
}
var GUEST_CHECKOUT_KEY = "southend-checkout-guest";
function readGuestCheckout() {
	try {
		return sessionStorage.getItem(GUEST_CHECKOUT_KEY) === "1";
	} catch {
		return false;
	}
}
function writeGuestCheckout() {
	try {
		sessionStorage.setItem(GUEST_CHECKOUT_KEY, "1");
	} catch {}
}
function CheckoutPage() {
	const data = Route$24.useLoaderData();
	const { user, isPending } = useCurrentUserState();
	const [guestAnyway, setGuestAnyway] = (0, import_react.useState)(readGuestCheckout);
	function stayGuest() {
		writeGuestCheckout();
		setGuestAnyway(true);
	}
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "shop-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "shop-main",
			id: "main",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLoading, {})
		})]
	});
	if (user && !guestAnyway) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "shop-shell",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionGate, {
			softGuest: true,
			onContinueAsGuest: stayGuest,
			fallback: ({ error }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "shop-main",
				id: "main",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "page-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Could not load your account" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: error }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: "You can still place a pickup order as a guest."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "confirm-actions",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn-print",
								onClick: stayGuest,
								children: "Continue as guest"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/login",
								search: { next: "/checkout" },
								className: "ed-btn",
								children: "Sign in"
							})]
						})
					]
				})
			}),
			children: ({ profile }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopHeader, { profile }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "shop-main",
				id: "main",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckoutForm, {
					profile,
					restaurant: data.restaurant,
					settings: data.settings,
					onLockGuest: stayGuest
				})
			})] })
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "shop-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "shop-main",
			id: "main",
			children: [user && guestAnyway ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "ed-sub",
				style: { marginBottom: "0.75rem" },
				children: [
					"Checking out as a guest.",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-btn ed-btn-quiet",
						onClick: () => {
							try {
								sessionStorage.removeItem(GUEST_CHECKOUT_KEY);
							} catch {}
							setGuestAnyway(false);
						},
						children: "Use signed-in account"
					})
				]
			}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckoutForm, {
				profile: null,
				restaurant: data.restaurant,
				settings: data.settings,
				onLockGuest: stayGuest
			})]
		})]
	});
}
function CheckoutForm({ profile, restaurant, settings: loadedSettings, onLockGuest }) {
	const hydrated = useCartHydrated();
	const lines = useCartStore((s) => s.lines);
	const notes = useCartStore((s) => s.notes);
	const setNotes = useCartStore((s) => s.setNotes);
	const setQty = useCartStore((s) => s.setQty);
	const remove = useCartStore((s) => s.remove);
	const clear = useCartStore((s) => s.clear);
	const { subtotal } = cartTotals(lines);
	const settings = loadedSettings;
	const [fulfillment, setFulfillment] = (0, import_react.useState)("pickup");
	const [address, setAddress] = (0, import_react.useState)(profile?.addressLine || "");
	const [city, setCity] = (0, import_react.useState)(profile?.city || "Egg Harbor Township");
	const [zip, setZip] = (0, import_react.useState)(profile?.zip || "08234");
	const [geo, setGeo] = (0, import_react.useState)(null);
	const [redeem, setRedeem] = (0, import_react.useState)(0);
	const [pay, setPay] = (0, import_react.useState)("pay_pickup");
	const [tipMode, setTipMode] = (0, import_react.useState)("none");
	const [customTip, setCustomTip] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [placed, setPlaced] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [step, setStep] = (0, import_react.useState)("form");
	const [pickupName, setPickupName] = (0, import_react.useState)(profile?.displayName || "");
	const [guestName, setGuestName] = (0, import_react.useState)(profile?.displayName || "");
	const [guestPhone, setGuestPhone] = (0, import_react.useState)(profile?.phone || "");
	const [pickupPhone, setPickupPhone] = (0, import_react.useState)(profile?.phone || "");
	const guest = !profile;
	const guestMustCard = false;
	const [whenMode, setWhenMode] = (0, import_react.useState)(loadedSettings.openNow ? "asap" : "schedule");
	const [schedDate, setSchedDate] = (0, import_react.useState)("");
	const [schedTime, setSchedTime] = (0, import_react.useState)("");
	const pickupAt = `${restaurant.address}, ${restaurant.city}`;
	const dateBounds = (0, import_react.useMemo)(() => {
		return {
			min: nyYmd(),
			max: nyYmd(new Date(Date.now() + 12096e5))
		};
	}, []);
	(0, import_react.useEffect)(() => {
		setPay(fulfillment === "delivery" ? "pay_delivery" : "pay_pickup");
	}, [fulfillment, guestMustCard]);
	(0, import_react.useEffect)(() => {
		if (!settings.openNow) setWhenMode("schedule");
	}, [settings.openNow]);
	(0, import_react.useEffect)(() => {
		if (whenMode !== "schedule") return;
		if (schedDate && schedTime) return;
		const slot = nextOpenSlot(settings.weeklyHours);
		if (slot) {
			setSchedDate(nyYmd(slot));
			setSchedTime(nyHm(slot));
		} else {
			setSchedDate(dateBounds.min);
			setSchedTime("12:00");
		}
	}, [
		whenMode,
		schedDate,
		schedTime,
		dateBounds.min,
		settings.weeklyHours
	]);
	const eta = etaMinutes(settings.prepMinutes, settings.deliveryMinutes, fulfillment);
	const scheduledAt = whenMode === "schedule" && schedDate && schedTime ? nyWallToDate(schedDate, schedTime) : null;
	const scheduledOpen = scheduledAt ? isOpenNow(settings.weeklyHours, scheduledAt) : true;
	const whenLabel = whenMode === "schedule" && scheduledAt ? `Scheduled ${formatShopWhen(scheduledAt.toISOString())}` : `About ${eta} minutes`;
	if (!hydrated) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "page-skel",
		children: "Loading your bag…"
	});
	if (lines.length === 0 && !placed) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Cart is empty" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "Add something from the menu, then come back to check out."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "btn-print",
				children: "Browse the menu"
			})
		]
	});
	if (placed) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "shop-brand-kicker",
				children: "South End Pizza III"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Order received" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Ticket #",
				formatTicketNo(placed.ticketNo),
				" · ",
				formatUsd(placed.total),
				" · ",
				placed.status.replaceAll("_", " ")
			] }),
			placed.status === "awaiting_payment" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: settings.paymentPlaceholder
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "ed-sub",
				children: [
					guest ? "The kitchen has the ticket. Save this number — guest orders are not on an account." : "The kitchen has the ticket. Track it under Account",
					fulfillment === "pickup" ? ` · pickup at ${pickupAt}` : "",
					whenMode === "schedule" && scheduledAt ? ` · ${whenLabel}.` : guest ? "" : "."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "confirm-actions",
				children: [guest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					search: { next: "/account" },
					className: "btn-print",
					children: "Create an account"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EnableAlertsButton, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/account",
					className: "ed-btn",
					children: "View history"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "ed-btn",
					children: "Back to the menu"
				})]
			})
		]
	});
	if (settings.vacationOn) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Closed for vacation" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: settings.vacationMessage }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "btn-ghost",
				children: "Back"
			})
		]
	});
	const redeemRate = settings.redeemRate;
	const points = profile?.points ?? 0;
	const maxRedeem = Math.min(Math.floor(points / redeemRate) * redeemRate, Math.floor(subtotal * redeemRate));
	const discount = redeem / redeemRate;
	const deliveryFee = fulfillment === "delivery" ? settings.deliveryFee : 0;
	const { tax, total: preTip } = computeTax(subtotal, discount, deliveryFee, settings.taxRate);
	const tip = tipMode === "custom" ? clampTip(Number(customTip) || 0) : tipMode === "none" ? 0 : tipFromPercent(subtotal, discount, tipMode);
	const total = Math.round((preTip + tip) * 100) / 100;
	function validateCheckout() {
		if (fulfillment === "delivery") {
			if (!settings.hasZones) {
				setError("Delivery zones are not set yet. Please choose pickup.");
				return false;
			}
			if (!geo?.deliverable) {
				setError("Check a deliverable address first.");
				return false;
			}
			if (subtotal < settings.minOrderDelivery) {
				setError(`Delivery minimum is ${formatUsd(settings.minOrderDelivery)}.`);
				return false;
			}
		}
		if (fulfillment === "pickup") {
			const name = pickupName.trim() || guestName.trim();
			const phone = (pickupPhone || guestPhone).replace(/\D/g, "");
			if (!name) {
				setError("Enter the name for pickup.");
				return false;
			}
			if (phone.length < 10) {
				setError("Enter a 10-digit US phone number.");
				return false;
			}
		}
		if (whenMode === "schedule") {
			if (!scheduledAt) {
				setError("Pick a date and time for pickup or delivery.");
				return false;
			}
			if (scheduledAt.getTime() < Date.now() + 9e5) {
				setError("Pick a time at least 15 minutes from now.");
				return false;
			}
			if (!scheduledOpen) {
				setError(`The kitchen is closed at that time. ${settings.hoursSummary}`);
				return false;
			}
		} else if (!settings.openNow) {
			setError("The kitchen is closed. Schedule a later pickup or delivery.");
			return false;
		}
		return true;
	}
	function submitOrder() {
		const name = pickupName.trim() || guestName.trim();
		const phone = (pickupPhone || guestPhone).replace(/\D/g, "");
		if (fulfillment === "pickup") {
			if (!name) {
				setError("Enter the name for pickup.");
				return;
			}
			if (phone.length < 10) {
				setError("Enter a 10-digit US phone number.");
				return;
			}
		} else if (guest) {
			if (!guestName.trim()) {
				setError("Enter your name.");
				return;
			}
			if (guestPhone.replace(/\D/g, "").length < 10) {
				setError("Enter a 10-digit US phone number.");
				return;
			}
		}
		if (pay === "pay_card" && true) {
			setError("Card payments are not live yet. Pay at pickup or with cash.");
			return;
		}
		setBusy(true);
		setError("");
		const payload = {
			fulfillment,
			notes,
			addressLine: address,
			city,
			zip,
			lat: geo?.lat,
			lng: geo?.lng,
			lines: lines.map((l) => ({
				itemId: l.itemId,
				categoryId: l.categoryId,
				size: l.size,
				qty: l.qty,
				toppings: l.toppings,
				halfItemId: l.halfItemId,
				comment: l.comment,
				condiments: l.condiments
			})),
			redeemPoints: guest ? 0 : redeem,
			paymentMethod: pay,
			tip,
			pickupName: fulfillment === "pickup" ? name : "",
			scheduledDate: whenMode === "schedule" ? schedDate : "",
			scheduledTime: whenMode === "schedule" ? schedTime : "",
			guestName: guestName.trim() || name,
			guestPhone: guestPhone || pickupPhone
		};
		(guest ? placeGuestOrder({ data: payload }) : placeOrder({ data: payload })).then((r) => {
			clear();
			setPlaced({
				id: r.id,
				ticketNo: r.ticketNo,
				total: r.total,
				status: r.status
			});
		}).catch((err) => setError(err instanceof Error ? err.message : "Could not place the order")).finally(() => setBusy(false));
	}
	function payLabel() {
		if (pay === "pay_pickup") return "Pay at pickup";
		if (pay === "pay_delivery") return "Cash";
		return "Card coming soon";
	}
	if (step === "review") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "confirm-page",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "page-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "shop-brand-kicker",
					children: "Review before placing"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Confirm your order" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Check every line. Nothing goes to the kitchen until you confirm."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "order-ticket",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "shop-brand-kicker",
							children: fulfillment === "delivery" ? "Deliver to" : "Pickup"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: fulfillment === "delivery" ? `${address}, ${city} ${zip}` : pickupAt }),
						fulfillment === "pickup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Name for pickup" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								value: pickupName,
								onChange: (e) => setPickupName(e.target.value),
								required: true,
								autoComplete: "name"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								value: pickupPhone || guestPhone,
								onChange: (e) => {
									setPickupPhone(e.target.value);
									if (guest) setGuestPhone(e.target.value);
								},
								required: true,
								autoComplete: "tel",
								inputMode: "tel",
								placeholder: "e.g. (609) 555-0100"
							})]
						})] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
							whenLabel,
							" · ",
							payLabel(),
							geo?.deliverable && fulfillment === "delivery" ? " · In the painted zone" : ""
						] }),
						geo?.mapsUrl && fulfillment === "delivery" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: geo.mapsUrl,
								target: "_blank",
								rel: "noreferrer",
								children: "Open in Google Maps"
							})
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "cart-lines",
					children: lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						l.qty,
						"× ",
						l.name,
						l.size ? ` · ${l.size}` : "",
						l.detail ? ` · ${l.detail}` : "",
						l.comment ? ` · Cook: ${l.comment}` : ""
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "bag-line-tools",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatUsd(l.unitPrice * l.qty) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "bag-remove",
							"aria-label": `Remove ${l.name}`,
							onClick: () => remove(l.key),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
								size: 15,
								strokeWidth: 2.2
							})
						})]
					})] }, l.key))
				}),
				notes.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "pos-notes",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Kitchen notes" }), notes]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "totals",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Subtotal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(subtotal) })] }),
						discount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Rewards" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: ["−", formatUsd(discount)] })] }) : null,
						deliveryFee ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Delivery" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(deliveryFee) })] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", { children: [
							"Tax (",
							settings.taxRate,
							"%)"
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(tax) })] }),
						tip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Tip" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(tip) })] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "totals-grand",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(total) })]
						})
					]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "form-error",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "confirm-actions",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-print checkout-primary",
						disabled: busy || fulfillment === "pickup" && (!(pickupName.trim() || guestName.trim()) || (pickupPhone || guestPhone).replace(/\D/g, "").length < 10),
						onClick: submitOrder,
						children: busy ? "Placing…" : "Confirm and place"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-btn",
						disabled: busy,
						onClick: () => setStep("form"),
						children: "Edit order"
					})]
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "check-grid",
		onSubmit: (e) => {
			e.preventDefault();
			if (!validateCheckout()) return;
			setError("");
			onLockGuest?.();
			setStep("review");
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaleCartPrompt, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Checkout" }),
					guest ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "guest-banner",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "ed-sub",
								children: [
									"Checking out as a guest. We only need a name and phone for the ticket.",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/login",
										search: { next: "/checkout" },
										children: "Sign in"
									}),
									" ",
									"to use reward points and track orders."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Your name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: guestName,
									onChange: (e) => {
										setGuestName(e.target.value);
										if (!pickupName || pickupName === guestName) setPickupName(e.target.value);
									},
									autoComplete: "name",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: guestPhone,
									onChange: (e) => setGuestPhone(e.target.value),
									autoComplete: "tel",
									inputMode: "tel",
									placeholder: "(609) 555-0100",
									required: true
								})]
							})
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "seg",
						role: "group",
						"aria-label": "Fulfillment",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": fulfillment === "pickup",
							onClick: () => setFulfillment("pickup"),
							children: "Pickup"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": fulfillment === "delivery",
							onClick: () => setFulfillment("delivery"),
							disabled: !settings.hasZones,
							children: "Delivery"
						})]
					}),
					fulfillment === "pickup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "ed-sub",
						children: [
							"Pickup at ",
							pickupAt,
							". Pay when you arrive."
						]
					}) : null,
					fulfillment === "pickup" && !guest ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "two-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Name for pickup" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								value: pickupName,
								onChange: (e) => setPickupName(e.target.value),
								autoComplete: "name",
								required: true
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								value: pickupPhone,
								onChange: (e) => setPickupPhone(e.target.value),
								autoComplete: "tel",
								inputMode: "tel",
								placeholder: "e.g. (609) 555-0100",
								required: true
							})]
						})]
					}) : null,
					!settings.openNow ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "ed-sub",
						children: [
							"The kitchen is closed right now. ",
							settings.hoursSummary,
							" You can still schedule a later pickup or delivery."
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
						className: "tip-box",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "When" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ed-sub",
								children: "Times are Eastern, for Egg Harbor Township. Scheduled orders need 15 minutes of notice."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "seg",
								role: "group",
								"aria-label": "When to fulfill",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"data-on": whenMode === "asap",
									disabled: !settings.openNow,
									onClick: () => setWhenMode("asap"),
									children: "As soon as ready"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"data-on": whenMode === "schedule",
									onClick: () => setWhenMode("schedule"),
									children: "Schedule"
								})]
							}),
							whenMode === "schedule" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "two-col sched-fields",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "ed-field",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "ed-input",
										type: "date",
										min: dateBounds.min,
										max: dateBounds.max,
										value: schedDate,
										onChange: (e) => setSchedDate(e.target.value),
										required: true
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "ed-field",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Time" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "ed-input",
										type: "time",
										step: 900,
										value: schedTime,
										onChange: (e) => setSchedTime(e.target.value),
										required: true
									})]
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "ed-sub",
								children: [
									"About ",
									eta,
									" minutes for ",
									fulfillment === "delivery" ? "delivery" : "pickup",
									"."
								]
							})
						]
					}),
					!settings.hasZones ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Delivery is off until the shop paints a zone on the admin map."
					}) : null,
					fulfillment === "delivery" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ed-shop",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "ed-sub",
								children: [
									"Delivery minimum ",
									formatUsd(settings.minOrderDelivery),
									". Fee ",
									formatUsd(settings.deliveryFee),
									". We check the painted zone after you look up the address."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Street" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: address,
									onChange: (e) => {
										setAddress(e.target.value);
										setGeo(null);
									},
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "City" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: city,
									onChange: (e) => {
										setCity(e.target.value);
										setGeo(null);
									}
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ZIP" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: zip,
									onChange: (e) => {
										setZip(e.target.value);
										setGeo(null);
									}
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ed-btn",
								onClick: () => {
									checkDeliveryAddress({ data: { query: `${address}, ${city} ${zip}` } }).then((r) => {
										if (!r.found || r.lat == null || r.lng == null) {
											setGeo(null);
											setError("We could not find that address.");
											return;
										}
										setGeo({
											lat: r.lat,
											lng: r.lng,
											label: r.label,
											deliverable: r.deliverable,
											mapsUrl: r.mapsUrl
										});
										setError(r.deliverable ? "" : "That pin is outside the delivery zone.");
									});
								},
								children: "Check delivery zone"
							}),
							geo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "ed-sub",
								children: [
									geo.deliverable ? "We deliver here." : "Outside the zone.",
									" ",
									geo.label,
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: geo.mapsUrl || googleMapsCoordUrl(geo.lat, geo.lng),
										target: "_blank",
										rel: "noreferrer",
										children: "Google Maps"
									})
								]
							}) : null
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Notes for the kitchen" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "ed-input ed-area",
							rows: 3,
							maxLength: 500,
							value: notes,
							onChange: (e) => setNotes(e.target.value),
							placeholder: "e.g. extra napkins, doorbell is broken",
							suppressHydrationWarning: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
						className: "tip-box",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Tip" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ed-sub",
								children: "Quick percents are on food after rewards. Tips are not taxed in New Jersey."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "tip-chips",
								role: "group",
								"aria-label": "Tip percent",
								children: [
									["none", "No tip"],
									[10, "10%"],
									[15, "15%"],
									[20, "20%"],
									["custom", "Custom"]
								].map(([mode, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"data-on": tipMode === mode,
									onClick: () => setTipMode(mode),
									children: [label, typeof mode === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: formatUsd(tipFromPercent(subtotal, discount, mode)) }) : null]
								}, String(mode)))
							}),
							tipMode === "custom" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Custom tip" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									inputMode: "decimal",
									value: customTip,
									onChange: (e) => setCustomTip(e.target.value.replace(/[^\d.]/g, "")),
									placeholder: "0.00"
								})]
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
						className: "pay-box",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Payment" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ed-sub",
								children: fulfillment === "pickup" ? "Pay at pickup when you arrive." : "Pay the driver with cash."
							}),
							fulfillment === "pickup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "pay-opt",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "radio",
									name: "pay",
									checked: pay === "pay_pickup",
									onChange: () => setPay("pay_pickup")
								}), "Pay at pickup"]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "pay-opt",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "radio",
									name: "pay",
									checked: pay === "pay_delivery",
									onChange: () => setPay("pay_delivery")
								}), "Cash"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ed-sub pay-card-note",
								children: "Card coming soon. Pay at pickup or with cash today."
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Bag" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "cart-lines",
						children: lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: l.name }),
							l.size ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "cart-size",
								children: l.size
							}) : null,
							l.detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "cart-size",
								children: l.detail
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "cart-line-price",
								children: formatUsd(l.unitPrice * l.qty)
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bag-line-tools",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "qty-step",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": `Fewer ${l.name}`,
										onClick: () => setQty(l.key, l.qty - 1),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { size: 14 })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: l.qty }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": `More ${l.name}`,
										onClick: () => setQty(l.key, l.qty + 1),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 })
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "bag-remove",
								"aria-label": `Remove ${l.name}`,
								onClick: () => remove(l.key),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									size: 16,
									strokeWidth: 2.2
								})
							})]
						})] }, l.key))
					}),
					guest ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"Redeem points (",
							points,
							" available, ",
							redeemRate,
							" pts = $1)"
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "ed-input",
							type: "number",
							min: 0,
							step: redeemRate,
							max: maxRedeem,
							value: redeem,
							onChange: (e) => setRedeem(Math.max(0, Math.min(maxRedeem, Number(e.target.value) || 0)))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "totals",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Subtotal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(subtotal) })] }),
							discount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Rewards" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: ["−", formatUsd(discount)] })] }) : null,
							deliveryFee ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Delivery" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(deliveryFee) })] }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", { children: [
								"Tax (",
								settings.taxRate,
								"%)"
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(tax) })] }),
							tip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Tip" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(tip) })] }) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "totals-grand",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(total) })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: whenMode === "schedule" ? whenLabel : `About ${eta} minutes for ${fulfillment === "delivery" ? "delivery" : "pickup"}.`
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "form-error",
						children: error
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "btn-print checkout-primary",
						disabled: busy,
						children: "Review order"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/routes/enroll-2fa.tsx
function safeNext$2(raw) {
	if (typeof raw !== "string") return void 0;
	if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) return void 0;
	return raw;
}
var Route$23 = createFileRoute("/enroll-2fa")({
	validateSearch: (search) => {
		const next = safeNext$2(search.next);
		return next ? { next } : {};
	},
	component: Enroll2fa
});
/** Survives remount storms — one in-flight setup per tab, shared across Enroll2fa mounts. */
var setupCache = {
	userId: null,
	promise: null
};
function loadTotpSetup(userId) {
	if (setupCache.userId === userId && setupCache.promise) return setupCache.promise;
	setupCache.userId = userId;
	setupCache.promise = startTotpSetup().then((r) => ({
		secret: r.secret,
		uri: r.uri
	})).catch((err) => {
		if (setupCache.userId === userId) {
			setupCache.userId = null;
			setupCache.promise = null;
		}
		throw err;
	});
	return setupCache.promise;
}
function Enroll2fa() {
	const { user, isPending } = useCurrentUserState();
	const { next } = Route$23.useSearch();
	const [secret, setSecret] = (0, import_react.useState)("");
	const [uri, setUri] = (0, import_react.useState)("");
	const [code, setCode] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [done, setDone] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!user?.id) return;
		let live = true;
		loadTotpSetup(user.id).then((r) => {
			if (!live) return;
			setSecret(r.secret);
			setUri(r.uri);
		}).catch((err) => {
			if (!live) return;
			setError(err instanceof Error ? err.message : "Could not start setup");
		});
		return () => {
			live = false;
		};
	}, [user?.id]);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLoading, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (done) {
		const dest = next || "/admin/pos";
		window.location.replace(dest);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLoading, { label: "Loading account" });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "login-page",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "login-card",
			onSubmit: (e) => {
				e.preventDefault();
				setBusy(true);
				setError("");
				confirmTotpSetup({ data: { code } }).then(() => setDone(true)).catch((err) => setError(err instanceof Error ? err.message : "Could not confirm")).finally(() => setBusy(false));
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "shop-brand-kicker",
					children: "Shop desk"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Set up two-factor" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Scan with an authenticator app (Google Authenticator, Authy, 1Password), or type the key, then enter a 6-digit code to confirm."
				}),
				uri ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InviteQr, {
					value: uri,
					label: "Authenticator QR code"
				}) : null,
				secret ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
					className: "totp-secret",
					children: secret
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Preparing a key…"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Confirm code" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						inputMode: "numeric",
						autoComplete: "one-time-code",
						value: code,
						onChange: (e) => setCode(e.target.value),
						required: true
					})]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "form-error",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "btn-print",
					disabled: busy || !secret,
					children: busy ? "Saving…" : "Confirm and continue"
				})
			]
		})
	});
}
//#endregion
//#region src/routes/help.tsx
var Route$22 = createFileRoute("/help")({
	loader: () => getShopContact(),
	component: HelpPage
});
function HelpPage() {
	const contact = Route$22.useLoaderData();
	const { user, isPending } = useCurrentUserState();
	const [profile, setProfile] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) {
			setProfile(null);
			return;
		}
		getMe().then(setProfile).catch(() => setProfile(null));
	}, [isPending, user]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "shop-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopHeader, { profile }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "shop-main help-main",
			id: "main",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "page-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Customer service" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Call the shop, or use the chat bubble in the corner. The crew sees the request on the messaging center."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "help-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "page-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
							size: 18,
							strokeWidth: 2.2
						}), " Call the shop"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "ed-sub",
							children: [
								contact.name,
								" · ",
								contact.address,
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "btn-print",
							href: contact.phoneHref,
							children: contact.phone
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "page-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Headset, {
							size: 18,
							strokeWidth: 2.2
						}), " Chat with the shop"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SignedOut, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: "Sign in to send a chat. The crew sees it with your latest ticket."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							search: { next: "/help" },
							className: "btn-print",
							children: "Sign in to chat"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedIn, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerChat, {}) })
					]
				})]
			})]
		})]
	});
}
//#endregion
//#region src/routes/install.tsx
var Route$21 = createFileRoute("/install")({
	head: () => ({ meta: [{ title: "Download App" }] }),
	component: InstallPage
});
function detectIos() {
	if (typeof navigator === "undefined") return false;
	const ua = navigator.userAgent || "";
	return /iPad|iPhone|iPod/.test(ua) || /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}
function detectStandalone() {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches || Boolean(navigator.standalone);
}
function InstallPage() {
	const { user, isPending } = useCurrentUserState();
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [promptEvent, setPromptEvent] = (0, import_react.useState)(null);
	const [ios, setIos] = (0, import_react.useState)(false);
	const [standalone, setStandalone] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [done, setDone] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		if (!user) {
			setProfile(null);
			return;
		}
		getMe().then(setProfile).catch(() => setProfile(null));
	}, [isPending, user]);
	(0, import_react.useEffect)(() => {
		setIos(detectIos());
		setStandalone(detectStandalone());
		const onPrompt = (e) => {
			e.preventDefault();
			setPromptEvent(e);
		};
		window.addEventListener("beforeinstallprompt", onPrompt);
		return () => window.removeEventListener("beforeinstallprompt", onPrompt);
	}, []);
	async function install() {
		if (!promptEvent) return;
		setBusy(true);
		try {
			await promptEvent.prompt();
			const choice = await promptEvent.userChoice;
			setDone(choice.outcome === "accepted");
			setPromptEvent(null);
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "shop-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopHeader, { profile }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "shop-main install-main",
			id: "main",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "page-card install-hero",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							className: "install-icon",
							src: "/icon-512.png",
							width: 180,
							height: 180,
							alt: "South End Pizza"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "shop-brand-kicker",
							children: "Egg Harbor Township"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "South End Pizza" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: "Put the shop on your home screen. Same menu, same account — opens like an app named South End."
						}),
						standalone || done ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "points-chip",
							children: "South End is on this device"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EnableAlertsButton, {})] }) : promptEvent ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn-print",
							disabled: busy,
							onClick: () => void install(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, {
								size: 18,
								strokeWidth: 2.2
							}), busy ? "Installing…" : "Add South End"]
						}) : ios ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "install-cta",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share, {
								size: 16,
								strokeWidth: 2.2,
								"aria-hidden": true
							}), "Tap Share, then Add to Home Screen"]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "install-cta",
							children: "Use your browser menu to install or add to the home screen."
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "page-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "iPhone & iPad" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "install-steps",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Open this page in Safari." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Tap the Share button." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Choose Add to Home Screen, then Add." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Look for the buffalo mark named South End." })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "page-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Android" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "install-steps",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Open this page in Chrome." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Tap the browser menu." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Choose Install app or Add to Home screen." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Confirm South End Pizza." })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "page-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Order alerts" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: "After you install, tap Enable order alerts so we can ping you when a ticket is ready. iPhone needs Add to Home Screen first."
						}),
						ios && !standalone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: "Add South End to the Home Screen, open it from the icon, then enable alerts."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EnableAlertsButton, { compact: true })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub install-back",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						children: "Back to the menu"
					})
				})
			]
		})]
	});
}
//#endregion
//#region src/lib/login-social.ts
var BEARER_KEY = "grok-auth.bearer-token";
function friendlyAuthError(err, hint) {
	const lower = (err instanceof Error ? err.message : "Sign-in failed.").toLowerCase();
	if (lower.includes("invalid origin")) return "This shop address is not on the sign-in list. Open the published shop link and try again.";
	if (lower.includes("pop-up") || lower.includes("popup")) return "Allow pop-ups for this shop, then try Google or X again.";
	if (lower.includes("cancelled") || lower.includes("canceled") || lower.includes("did not finish")) return "Sign-in did not finish. Try again.";
	if (lower.includes("invalid") || lower.includes("credential") || lower.includes("unauthorized") || lower.includes("password") || lower.includes("not found") || lower.includes("user")) return hint?.username ? "Invalid username or password." : "Invalid email, username, or password.";
	return "Invalid email, username, or password.";
}
function inSandboxPreview() {
	return typeof window !== "undefined" && window.location.hostname.endsWith(".grok-sandbox.com");
}
function pageIsFramed() {
	if (typeof window === "undefined") return false;
	try {
		return window.self !== window.top;
	} catch {
		return true;
	}
}
function waitForPopupToken(popup, origin) {
	return new Promise((resolve) => {
		let settled = false;
		let closeTimer;
		const settle = (token) => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve(token);
		};
		const onMessage = (event) => {
			if (event.origin !== origin) return;
			const data = event.data;
			if (!data || data.source !== "grok-auth-popup") return;
			settle(data.token ?? null);
		};
		const pollTimer = window.setInterval(() => {
			if (!popup.closed) return;
			window.clearInterval(pollTimer);
			closeTimer = window.setTimeout(() => settle(null), 400);
		}, 300);
		function cleanup() {
			window.clearInterval(pollTimer);
			if (closeTimer !== void 0) window.clearTimeout(closeTimer);
			window.removeEventListener("message", onMessage);
		}
		window.addEventListener("message", onMessage);
	});
}
async function signInWithAuthPopup(providerId) {
	const origin = window.location.origin;
	const popup = window.open(`${origin}/auth/popup?providerId=${encodeURIComponent(providerId)}`, `southend-signin-${Date.now()}`, "popup,width=500,height=650");
	await runPreSignInSignOut({
		livePreview: true,
		hasBearer: Boolean(getBearerToken()),
		requestSignOut: () => authClient.signOut(),
		clearToken: () => {
			try {
				window.sessionStorage.removeItem(BEARER_KEY);
			} catch {}
		}
	});
	if (!popup) throw new Error("Pop-up blocked — allow pop-ups for Google and X sign-in.");
	const token = await waitForPopupToken(popup, origin);
	if (!token) throw new Error("Sign-in was cancelled or did not finish.");
	try {
		window.sessionStorage.setItem(BEARER_KEY, token);
	} catch {}
	try {
		await authClient.getSession();
	} catch {}
}
/**
* Google / X sign-in. The sandbox preview already popups from `signIn()`.
* A GitHub live build inside an iframe is not that host, so Google/X block a
* full-page redirect — open `/auth/popup` ourselves in that case.
*/
async function startSocialSignIn(providerId, opts) {
	if (pageIsFramed() && !inSandboxPreview()) {
		await signInWithAuthPopup(providerId);
		return;
	}
	await signIn(providerId, opts);
}
//#endregion
//#region src/routes/login.tsx
function safeNext$1(raw) {
	if (typeof raw !== "string") return void 0;
	if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) return void 0;
	if (raw === "/") return void 0;
	return raw;
}
var Route$20 = createFileRoute("/login")({
	validateSearch: (search) => {
		const next = safeNext$1(search.next);
		const ref = typeof search.ref === "string" ? search.ref.trim().toUpperCase() : "";
		const error = typeof search.error === "string" ? search.error.trim() : "";
		const out = {};
		if (next) out.next = next;
		if (/^[A-Z0-9]{4,16}$/.test(ref)) out.ref = ref;
		if (error) out.error = error.slice(0, 180);
		return out;
	},
	component: Login
});
function GoogleMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		width: "18",
		height: "18",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			fill: "currentColor",
			d: "M21.35 11.1h-9.18v2.96h5.27c-.23 1.37-1.55 4.02-5.27 4.02A6.13 6.13 0 1 1 12.17 5.9c1.75 0 2.93.75 3.6 1.4l2.45-2.36C16.8 3.54 14.7 2.6 12.17 2.6A9.4 9.4 0 1 0 21.57 12c0-.6-.06-.9-.22-.9Z"
		})
	});
}
function XMark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 24 24",
		width: "16",
		height: "16",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			fill: "currentColor",
			d: "M14.1 10.35 21.2 2h-1.68l-6.16 7.24L8.44 2H2.5l7.45 10.86L2.5 22h1.68l6.52-7.66L15.56 22H21.5l-7.4-11.65Zm-2.3 2.71-.76-1.08-6.02-8.6h2.59l4.86 6.95.76 1.08 6.32 9.04h-2.59l-5.16-7.39Z"
		})
	});
}
function providerMark(label) {
	if (label === "X") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(XMark, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoogleMark, {});
}
function needsEmailOtp(_email) {
	return false;
}
function Login() {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const { next, ref, error: searchError } = Route$20.useSearch();
	const [mode, setMode] = (0, import_react.useState)("email");
	const [tab, setTab] = (0, import_react.useState)("in");
	const [identifier, setIdentifier] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [password2, setPassword2] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(searchError ? friendlyAuthError(new Error(searchError)) : "");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [showMark, setShowMark] = (0, import_react.useState)(true);
	const [verifyStep, setVerifyStep] = (0, import_react.useState)(null);
	const [signupOtp, setSignupOtp] = (0, import_react.useState)("");
	const [otpLeft, setOtpLeft] = (0, import_react.useState)(0);
	const [gatePending, setGatePending] = (0, import_react.useState)(false);
	const closeTo = next || "/";
	(0, import_react.useEffect)(() => {
		captureReferral(ref);
	}, [ref]);
	(0, import_react.useEffect)(() => {
		getStorefront().then((d) => setShowMark(d.settings.showMark)).catch(() => setShowMark(true));
	}, []);
	(0, import_react.useEffect)(() => {
		if (!user || verifyStep || !needsEmailOtp("")) {
			setGatePending(false);
			return;
		}
		let cancelled = false;
		setGatePending(true);
		(async () => {
			try {
				const me = await getMe();
				if (cancelled) return;
				const email = String(me.email ?? "").trim().toLowerCase();
				if (!email || !needsEmailOtp(email) || me.emailVerified) return;
				const sent = await sendSignupEmailCode({ data: { email } });
				if (cancelled) return;
				if (sent.alreadyVerified) return;
				setVerifyStep({
					email,
					masked: sent.email,
					previewCode: sent.previewCode
				});
				setSignupOtp("");
				setOtpLeft(sent.expiresIn || 60);
			} catch {} finally {
				if (!cancelled) setGatePending(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [user, verifyStep]);
	(0, import_react.useEffect)(() => {
		if (otpLeft <= 0) return;
		const t = window.setInterval(() => setOtpLeft((n) => Math.max(0, n - 1)), 1e3);
		return () => window.clearInterval(t);
	}, [otpLeft]);
	if ((isPending || gatePending) && !busy && !verifyStep && !error) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "login-page",
		"data-popup": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: closeTo,
			className: "login-scrim",
			"aria-label": "Close sign-in"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "login-card login-dialog",
			role: "status",
			"aria-busy": "true",
			"aria-labelledby": "login-title",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PizzaSpinner, { size: "md" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					id: "login-title",
					children: "Loading account"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Connecting you to the shop…"
				})
			]
		})]
	});
	if (user && !busy && !verifyStep && !gatePending && !error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: closeTo,
		replace: true
	});
	async function beginEmailVerify(email) {
		if (!needsEmailOtp(email)) return true;
		const sent = await sendSignupEmailCode({ data: { email } });
		if (sent.alreadyVerified) return true;
		setVerifyStep({
			email,
			masked: sent.email,
			previewCode: sent.previewCode
		});
		setSignupOtp("");
		setOtpLeft(sent.expiresIn || 60);
		return false;
	}
	async function submit(e) {
		e.preventDefault();
		setError("");
		setBusy(true);
		const parsed = identifierToEmail(identifier);
		if (mode === "phone" && !parsed.phone) {
			setBusy(false);
			setError("Enter a 10-digit US phone number.");
			return;
		}
		if (mode === "email" && !parsed.email.includes("@")) {
			setBusy(false);
			setError("Enter a valid email or the shop username.");
			return;
		}
		if (tab === "up" && password.length < 8) {
			setBusy(false);
			setError("Password needs at least 8 characters.");
			return;
		}
		if (tab === "up" && password !== password2) {
			setBusy(false);
			setError("Password and confirm password do not match.");
			return;
		}
		try {
			if (tab === "up") {
				const { error: err } = await authClient.signUp.email({
					email: parsed.email,
					password,
					name: name || (parsed.phone ? parsed.phone : parsed.email.split("@")[0])
				});
				if (err) throw new Error(err.message || "Could not create the account.");
				if (parsed.phone || name) updateProfile({ data: {
					phone: parsed.phone ?? "",
					displayName: name
				} }).catch(() => void 0);
				const invite = peekReferral();
				if (invite) claimReferral({ data: { code: invite } }).catch(() => void 0);
				if (needsEmailOtp(parsed.email)) {
					if (!await beginEmailVerify(parsed.email)) {
						setBusy(false);
						return;
					}
				}
			} else {
				const { data, error: err } = await authClient.signIn.email({
					email: parsed.email,
					password
				});
				if (err || !data?.user) throw new Error(err?.message || "Invalid email, username, or password.");
				if (isStaffAdminAccount(void 0, parsed.email) || isStaffAdminUsername(identifier)) noteStaffDeskLogin().catch(() => void 0);
				if (needsEmailOtp(parsed.email)) {
					if (!await beginEmailVerify(parsed.email)) {
						setBusy(false);
						return;
					}
				}
			}
			navigate({
				to: closeTo,
				replace: true
			});
		} catch (err) {
			const username = mode === "email" && !identifier.includes("@");
			setError(friendlyAuthError(err, { username }));
			setBusy(false);
			dropClientSession();
		}
	}
	async function submitVerify(e) {
		e.preventDefault();
		if (!verifyStep) return;
		setError("");
		setBusy(true);
		try {
			await verifySignupEmailCode({ data: {
				email: verifyStep.email,
				code: signupOtp
			} });
			setVerifyStep(null);
			navigate({
				to: closeTo,
				replace: true
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not verify that code.");
			setBusy(false);
		}
	}
	async function resendVerify() {
		if (!verifyStep || otpLeft > 0) return;
		setError("");
		setBusy(true);
		try {
			const sent = await sendSignupEmailCode({ data: { email: verifyStep.email } });
			if (sent.alreadyVerified) {
				setVerifyStep(null);
				navigate({
					to: closeTo,
					replace: true
				});
				return;
			}
			setVerifyStep({
				email: verifyStep.email,
				masked: sent.email,
				previewCode: sent.previewCode
			});
			setSignupOtp("");
			setOtpLeft(sent.expiresIn || 60);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not send another code.");
		} finally {
			setBusy(false);
		}
	}
	async function social(providerId) {
		setError("");
		setBusy(true);
		try {
			await startSocialSignIn(providerId, {
				callbackURL: next || "/",
				errorCallbackURL: "/login"
			});
			navigate({
				to: closeTo,
				replace: true
			});
		} catch (err) {
			setError(friendlyAuthError(err));
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "login-page",
		"data-popup": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: closeTo,
			className: "login-scrim",
			"aria-label": "Close sign-in"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "login-card login-dialog",
			"data-error": error ? "true" : void 0,
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "login-title",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: closeTo,
					className: "login-close",
					"aria-label": "Back to the menu",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						size: 18,
						strokeWidth: 2.4,
						"aria-hidden": true
					})
				}),
				showMark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { variant: "login" }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "shop-brand-kicker",
					children: "South End Pizza III"
				}),
				verifyStep ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						id: "login-title",
						children: "Check your inbox"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "ed-sub",
						children: [
							"We sent a 6-digit code to ",
							verifyStep.masked,
							". Enter it below to finish setting up your South End Pizza account."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "login-form",
						onSubmit: (e) => void submitVerify(e),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mail-slip",
								role: "status",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "slip-kind",
										children: ["Inbox · ", verifyStep.masked]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Your South End Pizza signup code" }),
									verifyStep.previewCode && otpLeft > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "otp-code",
										children: verifyStep.previewCode
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "ed-sub",
										children: otpLeft > 0 ? `Enter the 6-digit code. ${otpLeft}s left.` : "That code expired. Send a new one."
									}),
									verifyStep.previewCode && otpLeft > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "ed-sub",
										children: [
											"This shop preview shows the message here. It expires in ",
											otpLeft,
											"s."
										]
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "One-time code" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									inputMode: "numeric",
									autoComplete: "one-time-code",
									value: signupOtp,
									onChange: (e) => setSignupOtp(e.target.value.replace(/\D/g, "").slice(0, 6)),
									placeholder: "6-digit code",
									minLength: 6,
									maxLength: 6,
									required: true
								})]
							}),
							error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "form-error",
								children: error
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "btn-print",
								disabled: busy || signupOtp.length !== 6,
								children: busy ? "Please wait…" : "Verify & continue"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ed-btn ed-btn-quiet",
								disabled: busy || otpLeft > 0,
								onClick: () => void resendVerify(),
								children: otpLeft > 0 ? `Send again in ${otpLeft}s` : "Send a new code"
							})
						]
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						id: "login-title",
						children: tab === "up" ? "Create account" : "Welcome back"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: next === "/checkout" ? "Sign in to place your order, or check out as a guest. Your cart stays on this device." : "Email, the shop username, or a US phone number. Google and X work too."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "seg",
						role: "group",
						"aria-label": "Identifier type",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": mode === "email",
							onClick: () => setMode("email"),
							children: "Email"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": mode === "phone",
							onClick: () => setMode("phone"),
							children: "Phone"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "seg",
						role: "group",
						"aria-label": "Create or sign in",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": tab === "in",
							onClick: () => setTab("in"),
							children: "Sign in"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": tab === "up",
							onClick: () => setTab("up"),
							children: "Create account"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "login-form",
						onSubmit: (e) => void submit(e),
						children: [
							tab === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: name,
									onChange: (e) => setName(e.target.value),
									autoComplete: "name"
								})]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: mode === "phone" ? "Phone" : "Email or username" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: identifier,
									onChange: (e) => setIdentifier(e.target.value),
									autoComplete: mode === "phone" ? "tel" : "username",
									inputMode: mode === "phone" ? "tel" : "email",
									placeholder: mode === "phone" ? "(609) 555-0100" : "you@email.com or username",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									type: "password",
									value: password,
									onChange: (e) => setPassword(e.target.value),
									autoComplete: tab === "up" ? "new-password" : "current-password",
									placeholder: "Password",
									minLength: isStaffAdminUsername(identifier) ? 4 : 8,
									required: true
								})]
							}),
							tab === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Confirm password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									type: "password",
									value: password2,
									onChange: (e) => setPassword2(e.target.value),
									autoComplete: "new-password",
									minLength: 8,
									required: true
								})]
							}) : null,
							error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "form-error",
								children: error
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "btn-print",
								disabled: busy,
								children: busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "login-busy",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PizzaSpinner, { size: "sm" }), "Loading account"]
								}) : tab === "up" ? "Create account" : "Sign in"
							}),
							tab === "in" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/recover",
								className: "login-back",
								children: "Forgot password?"
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "login-split",
						children: "or continue with"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "login-socials",
						children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "login-social",
							disabled: busy,
							onClick: () => void social(p.providerId),
							children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PizzaSpinner, { size: "sm" }) : providerMark(p.label), p.label]
						}, p.providerId))
					}),
					next === "/checkout" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/checkout",
						className: "login-back",
						children: "Checkout as a guest"
					}) : null
				] })
			]
		})]
	});
}
//#endregion
//#region src/lib/receipt.ts
var PAPER_COLS = {
	"58mm": 32,
	"80mm": 48
};
function paperCols(paper = "58mm") {
	return PAPER_COLS[paper] ?? 32;
}
function pad(left, right, width) {
	const gap = Math.max(1, width - left.length - right.length);
	return `${left}${" ".repeat(gap)}${right}`;
}
function wrap(text, width) {
	const words = String(text || "").split(/\s+/).filter(Boolean);
	const lines = [];
	let cur = "";
	for (const w of words) {
		if (!cur) {
			cur = w.slice(0, width);
			continue;
		}
		if ((cur + " " + w).length <= width) cur += " " + w;
		else {
			lines.push(cur);
			cur = w.slice(0, width);
		}
	}
	if (cur) lines.push(cur);
	return lines;
}
function rule(width, ch = "-") {
	return ch.repeat(width);
}
function payLabel(method) {
	if (method === "pay_pickup") return "Pay at pickup";
	if (method === "pay_delivery") return "Cash";
	if (method === "pay_card") return "Card";
	return method.replaceAll("_", " ");
}
function buildReceiptText(opts) {
	const width = paperCols(opts.paper);
	const r = opts.restaurant;
	const o = opts.order;
	const when = new Date(o.createdAt);
	const lines = [];
	const center = (s) => {
		const t = s.slice(0, width);
		const padL = Math.max(0, Math.floor((width - t.length) / 2));
		return " ".repeat(padL) + t;
	};
	lines.push(center(r.name.toUpperCase()));
	for (const row of wrap(r.address, width)) lines.push(center(row));
	for (const row of wrap(r.city, width)) lines.push(center(row));
	lines.push(center(r.phone));
	if (opts.receipt.taxId.trim()) lines.push(center(`NJ Tax ID ${opts.receipt.taxId.trim()}`));
	lines.push(rule(width));
	lines.push(center(opts.kind === "store" ? "*** STORE COPY ***" : "*** CUSTOMER COPY ***"));
	lines.push(rule(width));
	if (o.notes.trim()) {
		lines.push("NOTES");
		lines.push(...wrap(o.notes, width));
		lines.push(rule(width));
	}
	lines.push(pad("Ticket", formatTicketNo(o.ticketNo), width));
	lines.push(pad("Date", when.toLocaleDateString(), width));
	lines.push(pad("Time", when.toLocaleTimeString([], {
		hour: "numeric",
		minute: "2-digit"
	}), width));
	lines.push(pad("Type", o.fulfillment === "delivery" ? "Delivery" : "Pickup", width));
	if (o.scheduledFor) {
		const whenAt = new Date(o.scheduledFor);
		lines.push(pad("When", whenAt.toLocaleString([], {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit"
		}), width));
	}
	if (o.fulfillment === "pickup" && o.pickupName) lines.push(pad("Name", o.pickupName, width));
	lines.push(pad("Status", o.status.replaceAll("_", " "), width));
	lines.push(rule(width));
	for (const it of o.items) {
		const name = `${it.qty} ${it.name}${it.size ? ` ${it.size}` : ""}`;
		const price = formatUsd(it.unitPrice * it.qty);
		const chunks = wrap(name, Math.max(10, width - price.length - 1));
		lines.push(pad(chunks[0] ?? name, price, width));
		for (const extra of chunks.slice(1)) lines.push(extra);
		if (it.detail) for (const extra of wrap(it.detail, width - 2)) lines.push(`  ${extra}`);
		if (it.comment) {
			if (opts.kind === "store") {
				lines.push("  *** COOK NOTE ***");
				for (const extra of wrap(it.comment.toUpperCase(), width - 2)) lines.push(`  ${extra}`);
			} else for (const extra of wrap(`Cook: ${it.comment}`, width - 2)) lines.push(`  ${extra}`);
		}
		if (it.qty > 1) lines.push(`  ${formatUsd(it.unitPrice)} each`);
	}
	lines.push(rule(width));
	lines.push(pad("Subtotal", formatUsd(o.subtotal), width));
	if (o.discount) lines.push(pad("Discounts", `-${formatUsd(o.discount)}`, width));
	if (o.deliveryFee) lines.push(pad("Delivery", formatUsd(o.deliveryFee), width));
	lines.push(pad(`NJ sales tax ${opts.taxRate}%`, formatUsd(o.tax), width));
	if (o.tip) lines.push(pad("Tip", formatUsd(o.tip), width));
	lines.push(pad("TOTAL", formatUsd(o.total), width));
	lines.push(rule(width));
	lines.push(pad("Tender", payLabel(o.paymentMethod), width));
	if (o.pointsEarned) lines.push(pad("Points earned", String(o.pointsEarned), width));
	if (o.pointsSpent) lines.push(pad("Points redeemed", String(o.pointsSpent), width));
	if (opts.kind === "store") {
		if (o.fulfillment === "delivery" && o.addressLine) {
			lines.push(rule(width));
			lines.push("Deliver to");
			lines.push(...wrap(`${o.addressLine}, ${o.city} ${o.zip}`.trim(), width));
		}
		lines.push(rule(width));
		lines.push(center("Not a customer receipt"));
	} else {
		if (o.fulfillment === "pickup") lines.push(...wrap("Pickup at 443 Zion Rd, Egg Harbor Township.", width));
		lines.push(rule(width));
		const footer = opts.receipt.footer.trim() || "Thank you. Keep this receipt.";
		for (const row of wrap(footer, width)) lines.push(center(row));
		lines.push(center("Sales tax separately stated"));
	}
	lines.push("");
	return lines.join("\n");
}
function sampleOrder() {
	return {
		id: "ord-sample-001",
		ticketNo: 1,
		userId: "sample",
		status: "preparing",
		fulfillment: "pickup",
		notes: "Well done, extra ranch",
		addressLine: "",
		city: "",
		zip: "",
		items: [{
			itemId: "pep",
			categoryId: "pizza",
			name: "Pepperoni Pizza",
			size: "LG",
			unitPrice: 18.75,
			qty: 1
		}, {
			itemId: "sticks",
			categoryId: "appetizers",
			name: "Mozzarella Sticks",
			size: "5 pc",
			unitPrice: 8.5,
			qty: 1
		}],
		subtotal: 27.25,
		discount: 0,
		deliveryFee: 0,
		tax: 1.81,
		tip: 4.09,
		total: 33.15,
		pointsEarned: 27,
		pointsSpent: 0,
		paymentMethod: "pay_pickup",
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
function ascii(text) {
	return text.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "?");
}
function textToEscPos(text) {
	const init = [27, 64];
	const left = [
		27,
		97,
		0
	];
	const body = Array.from(new TextEncoder().encode(ascii(text).replaceAll("\n", "\r\n")));
	const feed = [
		10,
		10,
		10,
		10
	];
	const cut = [
		29,
		86,
		65,
		16
	];
	return Uint8Array.from([
		...init,
		...left,
		...body,
		...feed,
		...cut
	]);
}
function jobsForPrinters(printers, kinds) {
	const jobs = [];
	for (const printer of printers) {
		if (!printer.enabled) continue;
		const copies = Math.max(1, Math.min(5, Math.round(printer.copies || 1)));
		const want = [];
		if (printer.customerCopy && kinds.includes("customer")) want.push("customer");
		if (printer.storeCopy && kinds.includes("store")) want.push("store");
		for (let i = 0; i < copies; i++) for (const kind of want) jobs.push({
			printer,
			kind
		});
	}
	return jobs;
}
//#endregion
//#region src/lib/lan-printer.ts
function escapeXml(value) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}
function eposEnvelope(body) {
	return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      <text>${escapeXml(body).replaceAll("\n", "&#10;")}</text>
      <feed line="3"/>
      <cut type="feed"/>
    </epos-print>
  </s:Body>
</s:Envelope>`;
}
function lanPrinterUrl(printer) {
	const host = String(printer.lanHost ?? "").trim();
	if (!host) return "";
	const proto = printer.lanProtocol === "https" ? "https" : "http";
	return `${proto}://${host}:${printer.lanPort === 8043 || proto === "https" ? 8043 : 8008}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`;
}
async function printLanReceipt(printer, body) {
	const url = lanPrinterUrl(printer);
	if (!url) throw new Error("Enter the printer IP on the shop Wi-Fi.");
	const res = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "text/xml; charset=utf-8" },
		body: eposEnvelope(body)
	});
	if (!res.ok) throw new Error(`Printer answered ${res.status}. Check the IP and that this tablet is on shop Wi-Fi.`);
}
async function testLanPrint(printer) {
	await printLanReceipt(printer, [
		"SOUTH END PIZZA III",
		"443 Zion Rd",
		"",
		"Test print from the shop tablet",
		(/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "America/New_York" }),
		"",
		"If you can read this, LAN ePOS is working."
	].join("\n"));
}
//#endregion
//#region src/lib/bluetooth-printer.ts
var NUS = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
var NUS_RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
var ISSC = "49535343-fe7d-4ae5-8fa9-9fafd205e455";
var ISSC_RX = "49535343-8841-43f4-a8d4-ecbe34729bb3";
var ISSC_TX = "49535343-aca3-481c-91ec-d85e28a60318";
var FFE0 = "0000ffe0-0000-1000-8000-00805f9b34fb";
var FFE1 = "0000ffe1-0000-1000-8000-00805f9b34fb";
var FF00 = "0000ff00-0000-1000-8000-00805f9b34fb";
var FF02 = "0000ff02-0000-1000-8000-00805f9b34fb";
var AE30 = "0000ae30-0000-1000-8000-00805f9b34fb";
var FEASY = "e7810a71-73ae-499d-8c15-faa9aef0c3f2";
var PRINT_SVC = "000018f0-0000-1000-8000-00805f9b34fb";
var PRINT_DATA = "00002af1-0000-1000-8000-00805f9b34fb";
var FFF0 = "0000fff0-0000-1000-8000-00805f9b34fb";
var FFF1 = "0000fff1-0000-1000-8000-00805f9b34fb";
var OPTIONAL_SERVICES = [
	NUS,
	ISSC,
	FFE0,
	FF00,
	AE30,
	FEASY,
	PRINT_SVC,
	FFF0,
	"0000ff10-0000-1000-8000-00805f9b34fb"
];
var WRITE_CHARS = [
	NUS_RX,
	ISSC_RX,
	ISSC_TX,
	FFE1,
	FF02,
	PRINT_DATA,
	FFF1
];
var PRINTER_PAIR_CHANNEL = "southend-printer-pair";
var PRINTER_PAIR_PATH = "/pair-printer";
var PRINT_JOB_KEY = "southend-print-job";
var live = /* @__PURE__ */ new Map();
function framed() {
	if (typeof window === "undefined") return false;
	try {
		return window.self !== window.top;
	} catch {
		return true;
	}
}
function policyAllowsBluetooth() {
	if (typeof document === "undefined") return false;
	const doc = document;
	try {
		if (doc.permissionsPolicy?.allowsFeature) return doc.permissionsPolicy.allowsFeature("bluetooth");
		if (doc.featurePolicy?.allowsFeature) return doc.featurePolicy.allowsFeature("bluetooth");
	} catch {}
	return false;
}
function bluetoothSupported() {
	if (typeof navigator === "undefined") return false;
	if (navigator.bluetooth) return true;
	return /Chrome|Edg|Chromium|CriOS/i.test(navigator.userAgent);
}
/** True when this document can call requestDevice without opening another window. */
function canPairInThisFrame() {
	if (!(typeof navigator !== "undefined" ? navigator.bluetooth : void 0)) return false;
	if (!framed()) return true;
	return policyAllowsBluetooth();
}
async function bluetoothReady() {
	const bt = typeof navigator !== "undefined" ? navigator.bluetooth : void 0;
	if (!bt) return framed() ? "blocked" : "unavailable";
	if (framed() && !policyAllowsBluetooth()) return "blocked";
	try {
		if (await bt.getAvailability?.() === false) return "adapter-off";
	} catch {}
	return "ready";
}
async function bluetoothDiagnose() {
	const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
	const chrome = /Chrome|Edg|Chromium|CriOS/i.test(ua);
	const safari = /Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua);
	const ios = /iPhone|iPad|iPod/i.test(ua);
	const bt = typeof navigator !== "undefined" ? navigator.bluetooth : void 0;
	let knownDevices = 0;
	try {
		knownDevices = bt?.getDevices ? (await bt.getDevices()).length : 0;
	} catch {
		knownDevices = 0;
	}
	return {
		chrome,
		safari,
		ios,
		framed: framed(),
		api: Boolean(bt),
		policy: policyAllowsBluetooth(),
		ready: await bluetoothReady(),
		knownDevices,
		canPairHere: canPairInThisFrame()
	};
}
async function pingPrinter(bluetoothId) {
	const device = await deviceFor(bluetoothId);
	if (!device?.gatt) throw new Error("Printer is not paired on this tablet. Tap Pair Bluetooth on that printer card.");
	if (!(await device.gatt.connect()).connected) throw new Error("The printer did not stay connected. Wake it, then tap Check connection.");
	return {
		name: device.name || "Printer",
		connected: true
	};
}
function remember(device) {
	live.set(device.id, device);
	return {
		bluetoothId: device.id,
		bluetoothName: device.name || "Bluetooth printer"
	};
}
async function requestPair(bt) {
	let device;
	try {
		device = await bt.requestDevice({
			acceptAllDevices: true,
			optionalServices: OPTIONAL_SERVICES
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : "";
		if (!/filter|acceptAllDevices|TypeError/i.test(String(err)) && !/must provide/i.test(msg)) throw err;
		device = await bt.requestDevice({
			filters: [
				{ namePrefix: "Printer" },
				{ namePrefix: "POS" },
				{ namePrefix: "MTP" },
				{ namePrefix: "MPT" },
				{ namePrefix: "RPP" },
				{ namePrefix: "XP-" },
				{ namePrefix: "Blue" },
				{ namePrefix: "BT" },
				{ namePrefix: "Inner" },
				{ namePrefix: "Gooj" },
				{ namePrefix: "Star" },
				{ namePrefix: "TM-" },
				{ namePrefix: "TSP" },
				{ services: [NUS] },
				{ services: [ISSC] },
				{ services: [PRINT_SVC] }
			],
			optionalServices: OPTIONAL_SERVICES
		});
	}
	const paired = remember(device);
	try {
		if (device.gatt) await device.gatt.connect();
	} catch {}
	return paired;
}
function openTopLevel(path) {
	const url = `${window.location.origin}${path}`;
	const name = "southend-printer-pair";
	let popup = null;
	try {
		popup = window.open(url, name);
	} catch {
		popup = null;
	}
	if (popup) return popup;
	try {
		popup = window.open(url, name, "popup=yes,width=440,height=640");
	} catch {
		popup = null;
	}
	if (popup) return popup;
	const a = document.createElement("a");
	a.href = url;
	a.target = name;
	a.rel = "opener";
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
	a.remove();
	return null;
}
function pairViaTopLevelWindow() {
	return new Promise((resolve, reject) => {
		const popup = openTopLevel(PRINTER_PAIR_PATH);
		let settled = false;
		const finish = (ok, error) => {
			if (settled) return;
			settled = true;
			window.removeEventListener("message", onMessage);
			window.clearInterval(watch);
			window.clearTimeout(timer);
			try {
				ch.close();
			} catch {}
			if (ok) resolve(ok);
			else reject(new Error(error || "Pairing window closed before a printer was chosen."));
		};
		const onPayload = (data) => {
			const d = data && typeof data === "object" ? data : null;
			if (!d || d.type !== "paired") return;
			const bluetoothId = String(d.bluetoothId || "");
			const bluetoothName = String(d.bluetoothName || "Bluetooth printer");
			if (!bluetoothId) return;
			finish({
				bluetoothId,
				bluetoothName
			});
			try {
				popup?.close();
			} catch {}
		};
		const onMessage = (ev) => {
			if (ev.origin !== window.location.origin) return;
			onPayload(ev.data);
		};
		const ch = new BroadcastChannel(PRINTER_PAIR_CHANNEL);
		ch.addEventListener("message", (ev) => onPayload(ev.data));
		window.addEventListener("message", onMessage);
		const watch = window.setInterval(() => {
			if (popup && popup.closed) finish(null, "Pairing window closed before a printer was chosen.");
		}, 400);
		const timer = window.setTimeout(() => {
			finish(null, "Pairing timed out. Tap Pair Bluetooth printer and choose the printer again.");
		}, 12e4);
	});
}
async function pairBluetoothPrinter() {
	const bt = typeof navigator !== "undefined" ? navigator.bluetooth : void 0;
	if (!canPairInThisFrame()) {
		if (typeof window === "undefined") throw new Error("Bluetooth is not available in this browser. Use Chrome or Edge on the shop tablet.");
		return pairViaTopLevelWindow();
	}
	if (!bt) throw new Error("Bluetooth is not available in this browser. Use Chrome or Edge on the shop tablet.");
	return requestPair(bt);
}
/** Used by the top-level pairing page. */
async function pairBluetoothPrinterHere() {
	const bt = navigator.bluetooth;
	if (!bt) throw new Error("Bluetooth is not available in this browser. Use Chrome or Edge on the shop tablet.");
	return requestPair(bt);
}
function publishPairedPrinter(paired) {
	const payload = {
		type: "paired",
		...paired
	};
	try {
		const ch = new BroadcastChannel(PRINTER_PAIR_CHANNEL);
		ch.postMessage(payload);
		ch.close();
	} catch {}
	try {
		window.opener?.postMessage(payload, window.location.origin);
	} catch {}
}
function subscribePairedPrinter(onPaired) {
	if (typeof window === "undefined") return () => {};
	const onPayload = (data) => {
		const d = data && typeof data === "object" ? data : null;
		if (!d || d.type !== "paired") return;
		const bluetoothId = String(d.bluetoothId || "");
		if (!bluetoothId) return;
		onPaired({
			bluetoothId,
			bluetoothName: String(d.bluetoothName || "Bluetooth printer")
		});
	};
	const onMessage = (ev) => {
		if (ev.origin !== window.location.origin) return;
		onPayload(ev.data);
	};
	let ch = null;
	try {
		ch = new BroadcastChannel(PRINTER_PAIR_CHANNEL);
		ch.addEventListener("message", (ev) => onPayload(ev.data));
	} catch {
		ch = null;
	}
	window.addEventListener("message", onMessage);
	return () => {
		window.removeEventListener("message", onMessage);
		try {
			ch?.close();
		} catch {}
	};
}
function uint8ToB64(bytes) {
	let s = "";
	const chunk = 32768;
	for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
	return btoa(s);
}
function b64ToUint8(s) {
	const bin = atob(s);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
	return out;
}
function stashPrintJob(bluetoothId, bytes) {
	const job = {
		bluetoothId,
		b64: uint8ToB64(bytes),
		ts: Date.now()
	};
	try {
		localStorage.setItem(PRINT_JOB_KEY, JSON.stringify(job));
	} catch {}
	return job;
}
function takePrintJob() {
	try {
		const raw = localStorage.getItem(PRINT_JOB_KEY);
		if (!raw) return null;
		localStorage.removeItem(PRINT_JOB_KEY);
		const job = JSON.parse(raw);
		if (!job?.bluetoothId || !job.b64) return null;
		if (Date.now() - Number(job.ts || 0) > 6e4) return null;
		return job;
	} catch {
		return null;
	}
}
function bytesFromPrintJob(job) {
	return b64ToUint8(job.b64);
}
function publishPrintResult(ok, error) {
	const payload = ok ? { type: "printed" } : {
		type: "print-error",
		error: error || "Bluetooth print failed"
	};
	try {
		const ch = new BroadcastChannel(PRINTER_PAIR_CHANNEL);
		ch.postMessage(payload);
		ch.close();
	} catch {}
	try {
		window.opener?.postMessage(payload, window.location.origin);
	} catch {}
}
function notifyPrintResult(ok, error) {
	publishPrintResult(ok, error);
}
async function deviceFor(id) {
	const cached = live.get(id);
	if (cached) return cached;
	const bt = navigator.bluetooth;
	if (!bt?.getDevices) return null;
	const found = (await bt.getDevices()).find((d) => d.id === id) ?? null;
	if (found) live.set(id, found);
	return found;
}
async function writableChar(server) {
	const tryService = async (uuid, charUuid) => {
		try {
			const svc = await server.getPrimaryService(uuid);
			if (charUuid) return await svc.getCharacteristic(charUuid);
			const w = (await svc.getCharacteristics()).find((c) => c.properties.writeWithoutResponse || c.properties.write);
			if (w) return w;
		} catch {
			return null;
		}
		return null;
	};
	for (const uuid of OPTIONAL_SERVICES) {
		for (const charUuid of WRITE_CHARS) {
			const hit = await tryService(uuid, charUuid);
			if (hit) return hit;
		}
		const any = await tryService(uuid);
		if (any) return any;
	}
	const services = await server.getPrimaryServices();
	for (const svc of services) {
		const w = (await svc.getCharacteristics()).find((c) => c.properties.writeWithoutResponse || c.properties.write);
		if (w) return w;
	}
	throw new Error("That printer did not expose a writable Bluetooth characteristic.");
}
async function writeChunks(char, bytes) {
	const size = 20;
	for (let i = 0; i < bytes.length; i += size) {
		const chunk = bytes.slice(i, i + size);
		if (char.writeValueWithoutResponse) await char.writeValueWithoutResponse(chunk);
		else await char.writeValue(chunk);
		await new Promise((r) => setTimeout(r, 20));
	}
}
async function printEscPosHere(bluetoothId, bytes) {
	const device = await deviceFor(bluetoothId);
	if (!device?.gatt) throw new Error("Printer is not paired on this device.");
	await writeChunks(await writableChar(await device.gatt.connect()), bytes);
}
function printViaTopLevelWindow(bluetoothId, bytes) {
	stashPrintJob(bluetoothId, bytes);
	const popup = openTopLevel(`${PRINTER_PAIR_PATH}?print=1`);
	return new Promise((resolve, reject) => {
		let settled = false;
		const finish = (ok, error) => {
			if (settled) return;
			settled = true;
			window.removeEventListener("message", onMessage);
			window.clearInterval(watch);
			window.clearTimeout(timer);
			try {
				ch.close();
			} catch {}
			if (ok) resolve();
			else reject(new Error(error || "Print window closed before the ticket was sent."));
		};
		const onPayload = (data) => {
			const d = data && typeof data === "object" ? data : null;
			if (!d) return;
			if (d.type === "printed") finish(true);
			if (d.type === "print-error") finish(false, String(d.error || "Bluetooth print failed"));
		};
		const onMessage = (ev) => {
			if (ev.origin !== window.location.origin) return;
			onPayload(ev.data);
		};
		const ch = new BroadcastChannel(PRINTER_PAIR_CHANNEL);
		ch.addEventListener("message", (ev) => onPayload(ev.data));
		window.addEventListener("message", onMessage);
		const watch = window.setInterval(() => {
			if (popup && popup.closed) finish(false, "Print window closed before the ticket was sent.");
		}, 400);
		const timer = window.setTimeout(() => {
			finish(false, "Print timed out. Tap Test print again with the printer on.");
		}, 45e3);
	});
}
async function printEscPos(bluetoothId, bytes) {
	const bt = typeof navigator !== "undefined" ? navigator.bluetooth : void 0;
	if (bt && (!framed() || policyAllowsBluetooth())) try {
		await printEscPosHere(bluetoothId, bytes);
		return;
	} catch (err) {
		if (!framed()) throw err;
	}
	if (framed() && typeof window !== "undefined") {
		await printViaTopLevelWindow(bluetoothId, bytes);
		return;
	}
	if (!bt) throw new Error("Bluetooth is not available in this browser. Use Chrome or Edge on the shop tablet.");
	throw new Error("Printer is not paired on this device.");
}
function openFallbackWindow(slips) {
	const html = `<!doctype html><html><head><title>Receipts</title>
<style>
  @page { size: 80mm auto; margin: 6mm; }
  body { background: #fbf6ec; color: #1a1410; font: 13px/1.35 ui-monospace, Menlo, Consolas, monospace; margin: 0; }
  .slip { width: 72mm; margin: 12px auto; white-space: pre; background: #fff; padding: 10px 12px; border: 1px dashed #c9b79a; }
  .kind { letter-spacing: .12em; text-transform: uppercase; font-size: 11px; color: #9a221c; }
  @media print { body { background: #fff; } .slip { border: 0; page-break-after: always; } }
</style></head><body>
${slips.map((s) => `<section class="slip"><div class="kind">${escapeHtml(s.title)}</div><pre>${escapeHtml(s.body)}</pre></section>`).join("")}
<script>window.onload=function(){setTimeout(function(){window.print()},150)}<\/script>
</body></html>`;
	const w = window.open("", "receipts", "width=420,height=720");
	if (!w) throw new Error("Allow pop-ups to print a paper copy.");
	w.document.write(html);
	w.document.close();
}
function escapeHtml(s) {
	return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
async function printOrderReceipts(opts) {
	const kinds = opts.kinds ?? ["customer", "store"];
	const jobs = jobsForPrinters(opts.printers, kinds);
	if (!jobs.length) throw new Error("No enabled printers with a customer or store copy selected.");
	const slips = [];
	const errors = [];
	for (const job of jobs) {
		const body = buildReceiptText({
			order: opts.order,
			restaurant: opts.restaurant,
			receipt: opts.receipt,
			kind: job.kind,
			taxRate: opts.taxRate,
			paper: job.printer.paper
		});
		const title = `${job.printer.name} · ${job.kind === "store" ? "Store copy" : "Customer copy"}`;
		if (job.printer.lanHost) try {
			await printLanReceipt(job.printer, body);
			continue;
		} catch (e) {
			errors.push(`${job.printer.name}: ${e instanceof Error ? e.message : "LAN print failed"}`);
		}
		if (job.printer.bluetoothId) try {
			await printEscPos(job.printer.bluetoothId, textToEscPos(body));
			continue;
		} catch (e) {
			errors.push(`${job.printer.name}: ${e instanceof Error ? e.message : "Bluetooth print failed"}`);
		}
		slips.push({
			title,
			body
		});
	}
	if (slips.length && opts.fallback !== false) openFallbackWindow(slips);
	if (errors.length && !slips.length) throw new Error(errors.join(" "));
	return {
		printed: jobs.length,
		fallback: slips.length,
		errors
	};
}
//#endregion
//#region src/routes/pair-printer.tsx
var Route$19 = createFileRoute("/pair-printer")({ component: PairPrinterPage });
function PairPrinterPage() {
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [msg, setMsg] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("");
	const [printing, setPrinting] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		bluetoothReady().then((ready) => {
			if (ready === "ready") setStatus("Bluetooth is on for this shop. Tap pair and pick the printer.");
			else if (ready === "adapter-off") setStatus("Turn Bluetooth on on this tablet, then tap pair.");
			else if (ready === "blocked") setStatus("This window must stay on top. If the chooser does not appear, open this page in Chrome or Edge.");
			else setStatus("Use Chrome or Edge on the shop tablet to connect a Bluetooth printer.");
		});
		if (!(new URLSearchParams(window.location.search).get("print") === "1")) return;
		const job = takePrintJob();
		if (!job) {
			setMsg("No ticket waiting. Close this window and print again from the shop.");
			return;
		}
		sendTicket(job);
	}, []);
	function sendTicket(job) {
		setPrinting(true);
		setBusy(true);
		return printEscPos(job.bluetoothId, bytesFromPrintJob(job)).then(() => {
			notifyPrintResult(true);
			setMsg("Ticket sent to the printer. You can close this window.");
			window.setTimeout(() => {
				try {
					window.close();
				} catch {}
			}, 700);
		}).catch((e) => {
			stashPrintJob(job.bluetoothId, bytesFromPrintJob(job));
			const error = e instanceof Error ? e.message : "Bluetooth print failed";
			setMsg(`${error} Pair the printer below, then the ticket will send.`);
			setPrinting(false);
		}).finally(() => setBusy(false));
	}
	function pair() {
		setBusy(true);
		setMsg("");
		pairBluetoothPrinterHere().then(async (paired) => {
			publishPairedPrinter(paired);
			const job = takePrintJob();
			if (job) try {
				await printEscPos(paired.bluetoothId, bytesFromPrintJob(job));
				notifyPrintResult(true);
				setMsg(`Paired ${paired.bluetoothName} and sent the ticket.`);
			} catch (e) {
				notifyPrintResult(false, e instanceof Error ? e.message : "Bluetooth print failed");
				setMsg(`Paired ${paired.bluetoothName}, but the ticket did not send. ${e instanceof Error ? e.message : "Try test print from Printer setup."}`);
				return;
			}
			else setMsg(`Paired ${paired.bluetoothName}. You can close this window.`);
			window.setTimeout(() => {
				try {
					window.close();
				} catch {}
			}, 800);
		}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not pair the printer.")).finally(() => setBusy(false));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "shop-shell pair-shell",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "login-page",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "login-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { variant: "login" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "shop-brand-kicker",
						children: "Printer pairing"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: printing ? "Sending ticket" : "Connect the printer" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: status
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "btn-print",
						onClick: pair,
						disabled: busy,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bluetooth, {
							size: 16,
							strokeWidth: 2.2
						}), busy ? "Waiting for printer…" : "Pair Bluetooth printer"]
					}),
					msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: msg
					}) : null
				]
			})
		})
	});
}
//#endregion
//#region src/routes/recover.tsx
var Route$18 = createFileRoute("/recover")({ component: Recover });
function Recover() {
	const [identifier, setIdentifier] = (0, import_react.useState)("");
	const [proof, setProof] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [done, setDone] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function submit(e) {
		e.preventDefault();
		setError("");
		if (password !== confirm) {
			setError("The new passwords do not match.");
			return;
		}
		if (password.length < 8) {
			setError("Use at least 8 characters for the new password.");
			return;
		}
		setBusy(true);
		try {
			await recoverPassword({ data: {
				identifier,
				proof,
				password
			} });
			setDone(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not recover the account.");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "login-page",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "login-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { variant: "login" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "shop-brand-kicker",
					children: "South End Pizza III"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Recover password" }),
				done ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Password updated. Sign in with the new one."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					className: "btn-print",
					children: "Sign in"
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Enter the email or phone on the account, then the phone or name saved on the profile. Google and X accounts sign in with those buttons — they do not use a shop password."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "login-form",
						onSubmit: (e) => void submit(e),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Email or phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: identifier,
									onChange: (e) => setIdentifier(e.target.value),
									autoComplete: "username",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Phone or name on file" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: proof,
									onChange: (e) => setProof(e.target.value),
									autoComplete: "tel",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "New password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									type: "password",
									value: password,
									onChange: (e) => setPassword(e.target.value),
									autoComplete: "new-password",
									minLength: 8,
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Confirm password" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									type: "password",
									value: confirm,
									onChange: (e) => setConfirm(e.target.value),
									autoComplete: "new-password",
									minLength: 8,
									required: true
								})]
							}),
							error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "form-error",
								children: error
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "btn-print",
								disabled: busy,
								children: busy ? "Saving…" : "Set new password"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						className: "login-back",
						children: "Back to sign in"
					})
				] })
			]
		})
	});
}
//#endregion
//#region src/routes/verify-2fa.tsx
function safeNext(raw) {
	if (typeof raw !== "string") return void 0;
	if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) return void 0;
	return raw;
}
var Route$17 = createFileRoute("/verify-2fa")({
	validateSearch: (search) => {
		const next = safeNext(search.next);
		return next ? { next } : {};
	},
	component: Verify2fa
});
function Verify2fa() {
	const { user, isPending } = useCurrentUserState();
	const { next } = Route$17.useSearch();
	const [code, setCode] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [done, setDone] = (0, import_react.useState)(false);
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLoading, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RedirectToSignIn, {});
	if (done) {
		if (next) {
			window.location.replace(next);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountLoading, { label: "Loading account" });
		}
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "login-page",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "login-card",
			onSubmit: (e) => {
				e.preventDefault();
				setBusy(true);
				setError("");
				verifyTotpChallenge({ data: { code } }).then(() => setDone(true)).catch((err) => setError(err instanceof Error ? err.message : "Could not verify")).finally(() => setBusy(false));
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Two-factor code" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Open your authenticator app and enter the 6-digit code."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Code" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						inputMode: "numeric",
						autoComplete: "one-time-code",
						value: code,
						onChange: (e) => setCode(e.target.value),
						required: true
					})]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "form-error",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "btn-print",
					disabled: busy,
					children: busy ? "Checking…" : "Verify"
				})
			]
		})
	});
}
//#endregion
//#region src/routes/admin/index.tsx
var Route$16 = createFileRoute("/admin/")({ component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/admin/menu" }) });
//#endregion
//#region src/routes/admin/background.tsx
var Route$15 = createFileRoute("/admin/background")({ component: AdminBackground });
function AdminBackground() {
	const [backdrop, setBackdrop] = (0, import_react.useState)("");
	const [backdropPreview, setBackdropPreview] = (0, import_react.useState)("");
	const [logo, setLogo] = (0, import_react.useState)("");
	const [logoPreview, setLogoPreview] = (0, import_react.useState)("");
	const [notify, setNotify] = (0, import_react.useState)("");
	const [season, setSeason] = (0, import_react.useState)("none");
	const [adminTotpRequired, setAdminTotpRequired] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [msg, setMsg] = (0, import_react.useState)("");
	const [previewAspect, setPreviewAspect] = (0, import_react.useState)("16 / 9");
	(0, import_react.useEffect)(() => {
		getAdminShop().then((d) => {
			setBackdrop(d.settings.backdropData || "");
			setBackdropPreview(d.settings.backdropData || "/buffalo-mark.webp");
			setLogo(d.settings.logoData || "");
			setLogoPreview(d.settings.logoData || "/mark.jpg");
			setNotify(d.notifyAudio || "");
			setSeason(sanitizeSeasonEffect(d.settings.seasonEffect));
			setAdminTotpRequired(Boolean(d.settings.adminTotpRequired));
		}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not load"));
	}, []);
	(0, import_react.useEffect)(() => {
		const apply = () => {
			const w = Math.max(1, window.innerWidth);
			const h = Math.max(1, window.innerHeight);
			setPreviewAspect(`${w} / ${h}`);
		};
		apply();
		window.addEventListener("resize", apply);
		return () => window.removeEventListener("resize", apply);
	}, []);
	function applyBackdrop(data) {
		setBusy(true);
		setMsg("");
		saveShopSettings({ data: { backdropData: data } }).then(() => {
			setBackdrop(data);
			setBackdropPreview(data || "/buffalo-mark.webp");
			emitShopBackdrop();
			setMsg(data ? "Backdrop saved. It covers the screen at this window’s shape." : "Restored the buffalo-and-chicken mark.");
		}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not save")).finally(() => setBusy(false));
	}
	function applyLogo(data) {
		setBusy(true);
		setMsg("");
		saveShopSettings({ data: { logoData: data } }).then(() => {
			setLogo(data);
			setLogoPreview(data || "/mark.jpg");
			emitShopBackdrop();
			emitShopLogo();
			setMsg(data ? "Shop icon saved. Header, login, and the tab icon use it." : "Restored the original shop icon.");
		}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not save")).finally(() => setBusy(false));
	}
	function applySeason(next) {
		setBusy(true);
		setMsg("");
		saveShopSettings({ data: { seasonEffect: next } }).then(() => {
			setSeason(next);
			emitShopBackdrop();
			setMsg(next === "none" ? "Seasonal effects are off." : "Seasonal effect is on across the shop.");
		}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not save")).finally(() => setBusy(false));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "settings-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "shop-brand-kicker",
						children: "Admin"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Settings" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Swap the website icon, the full-page backdrop, seasonal effects, and the incoming-order alarm. Desk authenticator for Admin is optional here."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Desk security" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Off by default. When this is on, Admin must enroll an authenticator app before POS and the rest of the desk open. Personal 2FA on Account still works either way."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "pay-opt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: adminTotpRequired,
							disabled: busy,
							onChange: (e) => {
								const next = e.target.checked;
								setBusy(true);
								setMsg("");
								saveShopSettings({ data: { adminTotpRequired: next } }).then(() => {
									setAdminTotpRequired(next);
									setMsg(next ? "Admin must use an authenticator before the desk opens." : "Admin authenticator is optional.");
								}).catch((err) => {
									setMsg(err instanceof Error ? err.message : "Could not save");
								}).finally(() => setBusy(false));
							}
						}), "Require authenticator for Admin"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Website icon" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "This is the stamp customers see next to the shop name."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "logo-preview",
						children: logoPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: logoPreview,
							alt: "Shop icon preview"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrandMark, { variant: "settings" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Icon file" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "ed-input",
							type: "file",
							accept: "image/png,image/jpeg,image/webp,image/gif",
							disabled: busy,
							onChange: (e) => {
								const file = e.target.files?.[0];
								e.target.value = "";
								if (!file) return;
								setBusy(true);
								setMsg("");
								fileToDataImage(file, {
									maxEdge: 320,
									maxChars: 12e4,
									quality: .86
								}).then((url) => {
									setLogoPreview(url);
									applyLogo(url);
								}).catch((err) => {
									setMsg(err instanceof Error ? err.message : "Could not read that image");
									setBusy(false);
								});
							}
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "confirm-actions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ed-btn",
							disabled: busy || !logo,
							onClick: () => applyLogo(""),
							children: "Restore original icon"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Page backdrop" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Covers the whole window. The photo keeps its own shape; the shop scales it to this screen with cover, so nothing is cropped at upload."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "backdrop-preview",
						style: { aspectRatio: previewAspect },
						children: backdropPreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: backdropPreview,
							alt: "Shop background preview"
						}) : null
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Backdrop file" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "ed-input",
							type: "file",
							accept: "image/png,image/jpeg,image/webp,image/gif",
							disabled: busy,
							onChange: (e) => {
								const file = e.target.files?.[0];
								e.target.value = "";
								if (!file) return;
								setBusy(true);
								setMsg("");
								fileToDataImage(file, {
									maxEdge: 1920,
									maxChars: 28e4,
									quality: .84
								}).then((url) => {
									setBackdropPreview(url);
									applyBackdrop(url);
								}).catch((err) => {
									setMsg(err instanceof Error ? err.message : "Could not read that image");
									setBusy(false);
								});
							}
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "confirm-actions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ed-btn",
							disabled: busy || !backdrop,
							onClick: () => applyBackdrop(""),
							children: "Restore buffalo mark"
						})
					}),
					msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: msg
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Seasonal effects" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Quiet motion for holidays. Off by default. Respects reduced-motion, and never covers buttons or text contrast."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Occasion" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: "ed-input",
							value: season,
							disabled: busy,
							onChange: (e) => applySeason(sanitizeSeasonEffect(e.target.value)),
							children: SEASON_EFFECTS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: opt.id,
								children: opt.label
							}, opt.id))
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Incoming-order alarm" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Plays when a new ticket lands, including a queue of several at once. Default is a two-tone alarm-clock ring."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
						className: "notify-audio",
						controls: true,
						src: notify || "/order-alarm.wav",
						preload: "none",
						children: "Alarm preview"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Alarm file" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "ed-input",
							type: "file",
							accept: "audio/wav,audio/mpeg,audio/mp3,audio/ogg,audio/webm",
							disabled: busy,
							onChange: (e) => {
								const file = e.target.files?.[0];
								e.target.value = "";
								if (!file) return;
								if (file.size > 28e4) {
									setMsg("Keep the alarm under 280 KB.");
									return;
								}
								setBusy(true);
								setMsg("");
								const reader = new FileReader();
								reader.onload = () => {
									const url = String(reader.result || "");
									saveShopSettings({ data: { notifyAudio: url } }).then(() => {
										setNotify(url);
										setMsg("Incoming-order alarm saved.");
									}).catch((err) => setMsg(err instanceof Error ? err.message : "Could not save")).finally(() => setBusy(false));
								};
								reader.onerror = () => {
									setMsg("Could not read that audio file.");
									setBusy(false);
								};
								reader.readAsDataURL(file);
							}
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "confirm-actions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ed-btn",
							disabled: busy || !notify,
							onClick: () => {
								setBusy(true);
								setMsg("");
								saveShopSettings({ data: { notifyAudio: "" } }).then(() => {
									setNotify("");
									setMsg("Restored the default alarm-clock ring.");
								}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not save")).finally(() => setBusy(false));
							},
							children: "Restore default alarm"
						})
					})
				]
			})
		]
	});
}
//#endregion
//#region src/lib/bot/bot-admin.ts
function bool(v) {
	return v === true || v === "t" || v === "true";
}
async function requireAdmin(userId) {
	const sql = await getSql();
	let on = false;
	try {
		const row = (await sql`select role, admin_mode, admin_mode_allowed from profiles where user_id = ${userId}`)[0];
		on = bool(row?.admin_mode) && bool(row?.admin_mode_allowed);
	} catch {
		on = (await sql`select role from profiles where user_id = ${userId}`)[0]?.role === "admin";
	}
	if (!on) {
		const err = /* @__PURE__ */ new Error("Forbidden");
		err.status = 403;
		throw err;
	}
	if (bool((await sql`select totp_enabled from profiles where user_id = ${userId}`)[0]?.totp_enabled)) {
		const exp = (await sql`select expires_at from two_factor_unlocks where user_id = ${userId}`)[0]?.expires_at;
		if (!exp || new Date(String(exp)).getTime() <= Date.now()) throw new Error("Two-factor verification required.");
	}
}
function asAgent(row) {
	const scopes = Array.isArray(row.scopes) ? row.scopes.map((s) => String(s)) : [];
	return {
		id: String(row.id),
		name: String(row.name ?? ""),
		role: isBotRole(String(row.role ?? "")) ? String(row.role) : "ops_read",
		scopes,
		enabled: bool(row.enabled),
		createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
		lastUsedAt: row.last_used_at ? row.last_used_at instanceof Date ? row.last_used_at.toISOString() : String(row.last_used_at) : null,
		expiresAt: row.expires_at ? row.expires_at instanceof Date ? row.expires_at.toISOString() : String(row.expires_at) : null
	};
}
var listBotAgents = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	await requireAdmin(context.userId);
	return (await (await getSql())`select id, name, role, scopes, enabled, created_at, last_used_at, expires_at
      from bot_agents order by name`).map((row) => asAgent(row));
});
var listBotAudit = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	await requireAdmin(context.userId);
	return (await (await getSql())`
      select a.id, a.agent_id, coalesce(b.name, '') as name, a.path, a.status, a.ip, a.created_at
      from bot_audit a
      left join bot_agents b on b.id = a.agent_id
      order by a.created_at desc
      limit 40`).map((row) => ({
		id: String(row.id),
		agentId: String(row.agent_id ?? ""),
		name: String(row.name ?? ""),
		path: String(row.path ?? ""),
		status: Number(row.status) || 0,
		ip: String(row.ip ?? ""),
		createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? "")
	}));
});
var createBotAgent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { hashBotToken, mintBotToken } = await import("./tokens.server.mjs").then((n) => n.r);
	const preset = BOT_PRESETS.find((p) => p.name === String(data.preset ?? "").trim());
	const roleRaw = preset?.role ?? String(data.role ?? "").trim();
	if (!isBotRole(roleRaw)) throw new Error("Pick a valid bot role.");
	const name = (preset?.name ?? String(data.name ?? "").trim().toLowerCase()).replace(/[^a-z0-9-]/g, "");
	if (name.length < 2 || name.length > 40) throw new Error("Bot name must be 2–40 letters, numbers, or dashes.");
	const scopes = preset ? scopesForPreset(preset) : scopesForRole(roleRaw);
	const token = mintBotToken();
	const id = `bot-${randomBytes(8).toString("hex")}`;
	const sql = await getSql();
	if ((await sql.query(`select id from bot_agents where name = $1 limit 1`, [name]))[0]) throw new Error("A bot with that name already exists. Rotate its token instead.");
	await sql.query(`insert into bot_agents (id, name, role, token_hash, scopes, enabled, created_by)
       values ($1,$2,$3,$4,$5::text[], true, $6)`, [
		id,
		name,
		roleRaw,
		hashBotToken(token),
		scopes,
		context.userId
	]);
	return {
		agent: asAgent((await sql`select id, name, role, scopes, enabled, created_at, last_used_at, expires_at from bot_agents where id = ${id}`)[0] ?? {
			id,
			name,
			role: roleRaw,
			scopes,
			enabled: true
		}),
		token
	};
});
var rotateBotAgent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { hashBotToken, mintBotToken } = await import("./tokens.server.mjs").then((n) => n.r);
	const id = String(data.id ?? "").trim();
	if (!id) throw new Error("Bot is missing.");
	const token = mintBotToken();
	const updated = await (await getSql()).query(`update bot_agents set token_hash = $1, enabled = true, last_used_at = null where id = $2 returning id, name, role, scopes, enabled, created_at, last_used_at, expires_at`, [hashBotToken(token), id]);
	if (!updated[0]) throw new Error("Bot not found.");
	return {
		agent: asAgent(updated[0]),
		token
	};
});
var revokeBotAgent = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(async ({ context, data }) => {
	await requireAdmin(context.userId);
	const { hashBotToken, mintBotToken } = await import("./tokens.server.mjs").then((n) => n.r);
	const id = String(data.id ?? "").trim();
	if (!id) throw new Error("Bot is missing.");
	await (await getSql()).query(`update bot_agents set enabled = false, token_hash = $1 where id = $2`, [hashBotToken(mintBotToken()), id]);
	return { ok: true };
});
//#endregion
//#region src/routes/admin/bots.tsx
var Route$14 = createFileRoute("/admin/bots")({ component: AdminBots });
function AdminBots() {
	const [agents, setAgents] = (0, import_react.useState)([]);
	const [audit, setAudit] = (0, import_react.useState)([]);
	const [mode, setMode] = (0, import_react.useState)("preset");
	const [preset, setPreset] = (0, import_react.useState)(BOT_PRESETS[0]?.name ?? "security-guard");
	const [customName, setCustomName] = (0, import_react.useState)("");
	const [customRole, setCustomRole] = (0, import_react.useState)("ops_read");
	const [busy, setBusy] = (0, import_react.useState)("");
	const [msg, setMsg] = (0, import_react.useState)("");
	const [issued, setIssued] = (0, import_react.useState)(null);
	const [desk, setDesk] = (0, import_react.useState)({
		accounts: [],
		canGrant: false,
		granted: 0,
		max: 12
	});
	function reload() {
		listBotAgents().then(setAgents).catch((e) => setMsg(e instanceof Error ? e.message : "Could not load bots"));
		listBotAudit().then(setAudit).catch(() => setAudit([]));
		listDeskAccounts().then(setDesk).catch(() => void 0);
	}
	(0, import_react.useEffect)(() => {
		reload();
	}, []);
	function copyToken(token) {
		navigator.clipboard.writeText(token).then(() => setMsg("Token copied. Store it as a bot secret — it will not be shown again."));
	}
	function onCreated(r) {
		setIssued({
			name: r.agent.name,
			token: r.token
		});
		setAgents((list) => [...list.filter((a) => a.id !== r.agent.id), r.agent].sort((a, b) => a.name.localeCompare(b.name)));
	}
	function createPreset() {
		setBusy("create");
		setMsg("");
		createBotAgent({ data: { preset } }).then(onCreated).catch((e) => setMsg(e instanceof Error ? e.message : "Could not create bot")).finally(() => setBusy(""));
	}
	function createCustom() {
		setBusy("create");
		setMsg("");
		createBotAgent({ data: {
			name: customName.trim().toLowerCase(),
			role: customRole
		} }).then((r) => {
			onCreated(r);
			setCustomName("");
		}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not create bot")).finally(() => setBusy(""));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "settings-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "shop-brand-kicker",
						children: "Admin"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Bot access" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Each bot gets its own token and the least scopes it needs. Bots never sign in as Admin. The raw token is shown once — copy it into the bot’s secret store, then treat it like a password. Use a preset for known desk roles, or Custom to mint any future agent by name and role."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Create an agent" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "seg",
						role: "tablist",
						"aria-label": "Create mode",
						style: { marginBottom: 12 },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "seg-btn",
							"data-on": mode === "preset" ? "true" : "false",
							onClick: () => setMode("preset"),
							children: "Preset"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "seg-btn",
							"data-on": mode === "custom" ? "true" : "false",
							onClick: () => setMode("custom"),
							children: "Custom"
						})]
					}),
					mode === "preset" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "two-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Preset" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "ed-input",
								value: preset,
								onChange: (e) => setPreset(e.target.value),
								children: BOT_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: p.name,
									children: p.label
								}, p.name))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Issue" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn-print",
								disabled: Boolean(busy),
								onClick: createPreset,
								children: busy === "create" ? "Creating…" : "Create token"
							})]
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "two-col",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Name" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "ed-input",
										value: customName,
										placeholder: "style",
										autoComplete: "off",
										onChange: (e) => setCustomName(e.target.value)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ed-sub",
										children: "2–40 chars: letters, numbers, dashes"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Role" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									className: "ed-input",
									value: customRole,
									onChange: (e) => setCustomRole(e.target.value),
									children: BOT_ROLES.map((role) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: role,
										children: BOT_ROLE_LABELS[role]
									}, role))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Issue" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn-print",
									disabled: Boolean(busy) || customName.trim().length < 2,
									onClick: createCustom,
									children: busy === "create" ? "Creating…" : "Create token"
								})]
							})
						]
					}),
					issued ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bot-token-box",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "ed-sub",
								children: [
									"Token for ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: issued.name }),
									" — copy now. Closing this page hides it."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
								className: "totp-secret",
								children: issued.token
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "ed-btn",
								onClick: () => copyToken(issued.token),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 16 }), "Copy token"]
							})
						]
					}) : null,
					msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: msg
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Team / desk accounts" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "ed-sub",
						children: [
							"Each bot uses its own email and password. Silver grants Admin mode here (soft max ",
							desk.max,
							"). Then that person turns ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Admin mode" }),
							" on from the header name menu. Desk path is",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "/admin/pos" }),
							". Temp Admin cannot grant others."
						]
					}),
					desk.accounts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-empty",
						children: "No signed-up accounts yet."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "table-wrap",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "plain-table",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Account" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Allowed" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
							] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: desk.accounts.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: row.emailLocal }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "bot-agent-state",
										children: row.emailMasked
									}),
									row.displayName && row.displayName !== row.emailLocal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "bot-agent-state",
										children: row.displayName
									}) : null
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.adminModeAllowed ? row.adminMode ? "On" : "Granted" : "—" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: desk.canGrant ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: row.adminModeAllowed ? "ed-btn ed-btn-danger" : "ed-btn",
									disabled: Boolean(busy),
									onClick: () => {
										setBusy(row.userId);
										setMsg("");
										setDeskAllowed({ data: {
											userId: row.userId,
											allowed: !row.adminModeAllowed
										} }).then(() => reload()).catch((e) => setMsg(e instanceof Error ? e.message : "Could not update desk grant")).finally(() => setBusy(""));
									},
									children: row.adminModeAllowed ? "Revoke" : "Grant"
								}) : null })
							] }, row.userId)) })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "ed-sub",
						children: [
							desk.granted,
							"/",
							desk.max,
							" granted",
							desk.canGrant ? "" : " · Ask Silver to grant your account, then use Admin mode in the header."
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Agents" }), agents.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-empty",
					children: "No bots yet. Create a Security Guard or POS token to start."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "table-wrap",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "plain-table",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Name" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Role" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Scopes" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Last used" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: agents.map((agent) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: agent.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "bot-agent-state",
								children: agent.enabled ? "Active" : "Revoked"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: agent.role.replaceAll("_", " ") }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: agent.scopes.join(", ") || "—" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: agent.lastUsedAt ? formatShopWhen(agent.lastUsedAt) : "Never" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "order-actions",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ed-btn",
									disabled: Boolean(busy),
									onClick: () => {
										setBusy(agent.id);
										setMsg("");
										rotateBotAgent({ data: { id: agent.id } }).then((r) => {
											setIssued({
												name: r.agent.name,
												token: r.token
											});
											setAgents((list) => list.map((a) => a.id === r.agent.id ? r.agent : a));
										}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not rotate")).finally(() => setBusy(""));
									},
									children: "Rotate"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ed-btn ed-btn-danger",
									disabled: Boolean(busy) || !agent.enabled,
									onClick: () => {
										setBusy(agent.id);
										setMsg("");
										revokeBotAgent({ data: { id: agent.id } }).then(() => {
											setAgents((list) => list.map((a) => a.id === agent.id ? {
												...a,
												enabled: false
											} : a));
											if (issued?.name === agent.name) setIssued(null);
										}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not revoke")).finally(() => setBusy(""));
									},
									children: "Revoke"
								})]
							}) })
						] }, agent.id)) })]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Recent bot calls" }), audit.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-empty",
					children: "No bot traffic yet."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "table-wrap",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "plain-table",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "When" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Bot" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Path" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" })
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: audit.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatShopWhen(row.createdAt) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.name || "—" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.path }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: row.status })
						] }, row.id)) })]
					})
				})]
			})
		]
	});
}
//#endregion
//#region src/components/customers-panel.tsx
function CustomersPanel({ customers, setCustomers, onMsg, onMessage, focusId }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const [openId, setOpenId] = (0, import_react.useState)(focusId ?? "");
	const [busyId, setBusyId] = (0, import_react.useState)("");
	const [pointDelta, setPointDelta] = (0, import_react.useState)("10");
	(0, import_react.useEffect)(() => {
		if (!focusId) return;
		setOpenId(focusId);
		const t = window.setTimeout(() => {
			document.getElementById(`cust-${focusId}`)?.scrollIntoView({
				block: "nearest",
				behavior: "smooth"
			});
		}, 50);
		return () => window.clearTimeout(t);
	}, [focusId]);
	const filtered = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		if (!q) return customers;
		return customers.filter((c) => [
			c.displayName,
			c.phone,
			c.email,
			c.userId,
			c.role
		].join(" ").toLowerCase().includes(q));
	}, [customers, query]);
	function toggleAdmin(c, on) {
		setBusyId(c.userId);
		setAccountRole({ data: {
			userId: c.userId,
			role: on ? "admin" : "customer"
		} }).then(() => {
			setCustomers(customers.map((row) => row.userId === c.userId ? {
				...row,
				role: on ? "admin" : "customer",
				adminModeAllowed: on
			} : row));
			onMsg(on ? `${c.displayName} can turn on Admin mode.` : `${c.displayName} is a customer account.`);
		}).catch((e) => onMsg(e instanceof Error ? e.message : "Could not update admin authority")).finally(() => setBusyId(""));
	}
	function changePoints(c, sign) {
		const amount = Math.round(Number(pointDelta) || 0);
		if (!amount) {
			onMsg("Enter how many points to add or remove.");
			return;
		}
		setBusyId(c.userId);
		adjustCustomerPoints({ data: {
			userId: c.userId,
			delta: sign * amount
		} }).then((r) => {
			setCustomers(customers.map((row) => row.userId === c.userId ? {
				...row,
				points: r.points
			} : row));
			onMsg(sign > 0 ? `Added ${amount} points. ${c.displayName} now has ${r.points}.` : `Removed ${amount} points. ${c.displayName} now has ${r.points}.`);
		}).catch((e) => onMsg(e instanceof Error ? e.message : "Could not update points")).finally(() => setBusyId(""));
	}
	function toggleBan(c, on) {
		setBusyId(c.userId);
		setAccountBanned({ data: {
			userId: c.userId,
			banned: on
		} }).then(() => {
			setCustomers(customers.map((row) => row.userId === c.userId ? {
				...row,
				banned: on
			} : row));
			onMsg(on ? `${c.displayName} is banned.` : `${c.displayName} can order again.`);
		}).catch((e) => onMsg(e instanceof Error ? e.message : "Could not update ban")).finally(() => setBusyId(""));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Customer database" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "Names, phones, order history, and rewards. Turn on admin authority when someone should run the shop."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Search" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "ed-input",
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Name, phone, or email"
				})]
			}),
			filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-empty",
				children: "No customers match."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "cust-list",
				children: filtered.map((c) => {
					const open = openId === c.userId;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "cust-card",
						"data-open": open,
						id: `cust-${c.userId}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "cust-head",
							"aria-expanded": open,
							onClick: () => setOpenId(open ? "" : c.userId),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "cust-who",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: c.displayName }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
									c.banned ? "Banned · " : "",
									c.phone || "No phone",
									c.email ? ` · ${c.email}` : ""
								] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "cust-meta",
								children: [
									c.orderCount,
									" orders · ",
									formatUsd(c.spend),
									" · ",
									c.points,
									" pts"
								]
							})]
						}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "cust-body",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
									className: "cust-facts",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Joined" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—" })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Last order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleString() : "None" })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "2FA" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: c.totpEnabled ? "On" : "Off" })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Role" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: c.role })] })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "points-adjust",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "ed-field",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
											"Reward points (",
											c.points,
											")"
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "ed-input",
											inputMode: "numeric",
											value: pointDelta,
											onChange: (e) => setPointDelta(e.target.value.replace(/[^\d]/g, "").slice(0, 6)),
											"aria-label": "Points to add or remove"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "points-adjust-actions",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "ed-btn",
											disabled: busyId === c.userId,
											onClick: () => changePoints(c, 1),
											children: "Add points"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "ed-btn",
											disabled: busyId === c.userId,
											onClick: () => changePoints(c, -1),
											children: "Remove points"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "pay-opt",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: Boolean(c.adminModeAllowed),
										disabled: busyId === c.userId,
										onChange: (e) => toggleAdmin(c, e.target.checked)
									}), "Allow Admin mode on this account"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "pay-opt",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: c.banned,
										disabled: busyId === c.userId,
										onChange: (e) => toggleBan(c, e.target.checked)
									}), "Ban this account"]
								}),
								onMessage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ed-btn",
									disabled: busyId === c.userId,
									onClick: () => onMessage(c),
									children: "Open in messages"
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "settings-subhead",
									children: "Order history"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderDateTrays, {
									orders: c.orders,
									children: (o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"#",
										formatTicketNo(o.ticketNo),
										" · ",
										formatShopWhen(o.createdAt),
										" · ",
										o.fulfillment,
										o.notes ? ` · ${o.notes}` : ""
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
										formatUsd(o.total),
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: o.status.replaceAll("_", " ") })
									] })] }, o.id)
								})
							]
						}) : null]
					}, c.userId);
				})
			})
		]
	});
}
//#endregion
//#region src/components/payment-processor.tsx
function PaymentProcessorPanel() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card pay-soon",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "soon-banner",
				children: "Under construction"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Payment processor" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "Card capture is frozen. These fields are the shop inputs for a future processor — nothing is charged and nothing is saved until Stripe, Square, or another processor is connected."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
				className: "pay-soon-fields",
				disabled: true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
						className: "sr-only",
						children: "Processor fields, not yet active"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "two-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Processor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "ed-input",
								defaultValue: "stripe",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "stripe",
										children: "Stripe"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "square",
										children: "Square"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "clover",
										children: "Clover"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "paypal",
										children: "PayPal"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "authorize",
										children: "Authorize.net"
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Environment" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "ed-input",
								defaultValue: "sandbox",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "sandbox",
									children: "Sandbox"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "live",
									children: "Live"
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Merchant ID" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "ed-input",
							placeholder: "acct_ or location ID",
							readOnly: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Publishable / public key" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "ed-input",
							placeholder: "pk_…",
							readOnly: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Secret key" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "ed-input",
							type: "password",
							placeholder: "sk_…",
							readOnly: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Webhook signing secret" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "ed-input",
							type: "password",
							placeholder: "whsec_…",
							readOnly: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "two-col",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Statement descriptor" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								defaultValue: "SOUTH END PIZZA",
								readOnly: true
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Currency" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								className: "ed-input",
								defaultValue: "usd",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "usd",
									children: "USD"
								})
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "pay-opt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							disabled: true
						}), "Card present (tablet / terminal)"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "pay-opt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							disabled: true
						}), "Online checkout"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "pay-opt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							disabled: true
						}), "Tips on the receipt"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-print",
				disabled: true,
				children: "Save processor"
			})
		]
	});
}
//#endregion
//#region src/components/shop-ops-panels.tsx
function HoursPanel({ settings, setSettings }) {
	function patchDay(key, next) {
		setSettings({
			...settings,
			weeklyHours: {
				...settings.weeklyHours,
				[key]: {
					...settings.weeklyHours[key],
					...next
				}
			}
		});
	}
	const etaPickup = etaMinutes(settings.prepMinutes, settings.deliveryMinutes, "pickup");
	const etaDelivery = etaMinutes(settings.prepMinutes, settings.deliveryMinutes, "delivery");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Time management" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "Kitchen hours use America/New_York. Checkout blocks new tickets when the shop is closed (vacation still overrides this)."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "points-chip",
				children: settings.openNow ? "Kitchen is open" : "Kitchen is closed"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hours-grid",
				children: DAY_KEYS.map((key) => {
					const day = settings.weeklyHours[key];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hours-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: DAY_LABELS[key] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "pay-opt",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: day.closed,
									onChange: (e) => patchDay(key, { closed: e.target.checked })
								}), "Closed"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								type: "time",
								value: day.open,
								disabled: day.closed,
								onChange: (e) => patchDay(key, { open: e.target.value })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								type: "time",
								value: day.close,
								disabled: day.closed,
								onChange: (e) => patchDay(key, { close: e.target.value })
							})
						]
					}, key);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "two-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Kitchen prep (minutes)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						type: "number",
						min: 5,
						value: settings.prepMinutes,
						onChange: (e) => setSettings({
							...settings,
							prepMinutes: Number(e.target.value)
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delivery travel (minutes)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						type: "number",
						min: 5,
						value: settings.deliveryMinutes,
						onChange: (e) => setSettings({
							...settings,
							deliveryMinutes: Number(e.target.value)
						})
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "ed-sub",
				children: [
					"Shown at checkout: pickup about ",
					etaPickup,
					" min · delivery about ",
					etaDelivery,
					" min."
				]
			})
		]
	});
}
function VacationPanel({ settings, setSettings }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Vacation" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "Vacation pauses new tickets. The shop stays browsable; checkout is closed."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "pay-opt",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: settings.vacationOn,
					onChange: (e) => setSettings({
						...settings,
						vacationOn: e.target.checked
					})
				}), "Vacation mode — shop closed for orders"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Vacation message" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					className: "ed-input ed-area",
					rows: 3,
					value: settings.vacationMessage,
					onChange: (e) => setSettings({
						...settings,
						vacationMessage: e.target.value
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Back date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "ed-input",
					value: settings.vacationUntil,
					onChange: (e) => setSettings({
						...settings,
						vacationUntil: e.target.value
					}),
					placeholder: "Monday, Sept 14"
				})]
			})
		]
	});
}
function PaymentsPanel({ settings, setSettings }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Payments" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "This copy shows at checkout until a card processor is wired in."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Payment note at checkout" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					className: "ed-input ed-area",
					rows: 3,
					value: settings.paymentPlaceholder,
					onChange: (e) => setSettings({
						...settings,
						paymentPlaceholder: e.target.value
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "pay-opt pay-disabled",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: false,
					disabled: true
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Require card payment for guests", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Card is not live yet. Guests pay at pickup or with cash." })] })]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentProcessorPanel, {})] });
}
function TaxPanel({ settings, setSettings }) {
	const sampleFood = 20;
	const sampleFee = settings.deliveryFee;
	const { tax, total } = computeTax(sampleFood, 0, sampleFee, settings.taxRate);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Tax rate" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "Applied at checkout on food after rewards, plus the delivery fee. Pickup has no delivery fee. New Jersey prepared-food default is 6.625%. Tips are collected after tax and are not taxed."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sales tax percent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "ed-input",
					type: "number",
					step: "0.001",
					min: 0,
					max: 25,
					value: settings.taxRate,
					onChange: (e) => setSettings({
						...settings,
						taxRate: Number(e.target.value)
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "ed-sub",
				children: [
					"A ",
					formatUsd(sampleFood),
					" pie plus a ",
					formatUsd(sampleFee),
					" delivery fee adds ",
					formatUsd(tax),
					" tax (",
					settings.taxRate || 0,
					"%). Checkout would collect ",
					formatUsd(total),
					"."
				]
			})
		]
	});
}
function ToppingPricePanel({ settings, setSettings }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Extra topping prices" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "Used when a guest adds toppings on a pizza. Half-and-half toppings charge half. Offer XL on a pie by typing an XL price on that item — no separate toggle."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "topping-price-grid",
				children: [
					["toppingPriceSm", "Small"],
					["toppingPriceMd", "Medium"],
					["toppingPriceLg", "Large"],
					["toppingPriceXl", "Extra large"]
				].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						type: "number",
						step: "0.25",
						min: 0,
						max: 20,
						value: settings[key],
						onChange: (e) => setSettings({
							...settings,
							[key]: Number(e.target.value)
						})
					})]
				}, key))
			})
		]
	});
}
function DeliveryPanel({ settings, setSettings }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Delivery settings" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "Checkout only allows delivery inside the painted map below. Addresses outside it stay pickup-only."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "two-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Minimum order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						type: "number",
						step: "0.01",
						min: 0,
						value: settings.minOrderDelivery,
						onChange: (e) => setSettings({
							...settings,
							minOrderDelivery: Number(e.target.value)
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delivery fee" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						type: "number",
						step: "0.01",
						min: 0,
						value: settings.deliveryFee,
						onChange: (e) => setSettings({
							...settings,
							deliveryFee: Number(e.target.value)
						})
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Travel time added at checkout (minutes)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "ed-input",
					type: "number",
					min: 5,
					value: settings.deliveryMinutes,
					onChange: (e) => setSettings({
						...settings,
						deliveryMinutes: Number(e.target.value)
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: settings.hasZones ? "A delivery zone is painted. Addresses outside it stay pickup-only." : "No zone painted yet — customers can only choose pickup."
			})
		]
	});
}
function RewardsPanel({ settings, setSettings }) {
	const earn = Math.round(20 * (settings.pointsPerDollar || 0));
	const dollar = settings.redeemRate > 0 ? 1 : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Points program" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "Points accrue on paid food totals (minus delivery). Guests do not earn or redeem — that stays on signed-in accounts. Customers redeem at checkout."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rewards-preview",
				"aria-hidden": true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "points-chip",
						children: [earn, " pts on a $20 pie"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "points-chip",
						children: [
							settings.redeemRate || 0,
							" pts = ",
							formatUsd(dollar)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "points-chip",
						children: [settings.welcomeBonus || 0, " welcome pts"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "points-chip",
						children: [settings.inviteBonus || 0, " for inviting"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "points-chip",
						children: [settings.inviteeBonus || 0, " for joining with a code"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "two-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Points per dollar spent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						type: "number",
						step: "0.1",
						min: 0,
						value: settings.pointsPerDollar,
						onChange: (e) => setSettings({
							...settings,
							pointsPerDollar: Number(e.target.value)
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Points needed for $1 off" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						type: "number",
						min: 1,
						value: settings.redeemRate,
						onChange: (e) => setSettings({
							...settings,
							redeemRate: Number(e.target.value)
						})
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Welcome bonus for new accounts" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "ed-input",
					type: "number",
					min: 0,
					value: settings.welcomeBonus,
					onChange: (e) => setSettings({
						...settings,
						welcomeBonus: Number(e.target.value)
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "two-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Points you get when a friend joins" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						type: "number",
						min: 0,
						value: settings.inviteBonus,
						onChange: (e) => setSettings({
							...settings,
							inviteBonus: Number(e.target.value)
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Extra points the friend gets" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						type: "number",
						min: 0,
						value: settings.inviteeBonus,
						onChange: (e) => setSettings({
							...settings,
							inviteeBonus: Number(e.target.value)
						})
					})]
				})]
			})
		]
	});
}
//#endregion
//#region src/components/save-toast.tsx
function useSaveFlash() {
	const [toast, setToast] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!toast) return;
		const t = window.setTimeout(() => setToast(null), 2400);
		return () => window.clearTimeout(t);
	}, [toast]);
	function flashOk(changed = true) {
		setToast({
			ok: true,
			text: changed ? "Settings saved." : "No changes to save."
		});
	}
	function flashFail(message) {
		setToast({
			ok: false,
			text: message?.trim() || "Settings were not saved."
		});
	}
	return {
		toast,
		flashOk,
		flashFail,
		dismiss: () => setToast(null)
	};
}
function SaveToast({ toast }) {
	if (!toast) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "save-toast",
		"data-ok": toast.ok ? "true" : "false",
		role: "status",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: toast.ok ? "Saved" : "Not saved" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: toast.text })]
	});
}
//#endregion
//#region src/routes/admin/settings.tsx
var Route$13 = createFileRoute("/admin/settings")({
	validateSearch: (search) => {
		const tab = typeof search.tab === "string" ? search.tab : void 0;
		return tab ? { tab } : {};
	},
	component: AdminSettingsGate
});
function AdminSettingsGate() {
	const { tab } = Route$13.useSearch();
	if (tab === "customers") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/admin/center",
		search: { tab: "customers" }
	});
	if (tab === "financials") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/admin/financials" });
	if (tab === "rewards") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/admin/center",
		search: { tab: "rewards" }
	});
	if (tab === "printers") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
		to: "/admin/menu",
		search: { tab: "printers" }
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/admin/background" });
}
var EMPTY_INSIGHTS = {
	customers: {
		total: 0,
		new7d: 0,
		twoFactor: 0,
		avgPoints: 0,
		repeat: 0,
		top: []
	},
	sales: {
		today: 0,
		week: 0,
		month: 0,
		allTime: 0,
		tickets: 0,
		avgTicket: 0,
		canceled: 0,
		series: [],
		topItems: []
	},
	financials: {
		food: 0,
		tax: 0,
		discounts: 0,
		deliveryFees: 0,
		tips: 0,
		collected: 0,
		pickup: 0,
		delivery: 0,
		awaitingPayment: 0,
		byPay: []
	}
};
function AdminFinancialsPage() {
	const [insights, setInsights] = (0, import_react.useState)(null);
	const [orders, setOrders] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		getAdminInsights().then(setInsights).catch(() => setInsights(EMPTY_INSIGHTS));
		listAllOrders().then(setOrders).catch(() => setOrders([]));
	}, []);
	const insightsView = insights ?? EMPTY_INSIGHTS;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "settings-page finance-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "shop-brand-kicker",
						children: "Admin"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Financials" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Today, this week, and tips live here — the till mix, tax, and ticket history follow. Tips stay off the New Jersey sales-tax line."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "kpi-grid kpi-hero",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Today",
						value: formatUsd(insightsView.sales.today)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "This week",
						value: formatUsd(insightsView.sales.week)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Tips",
						value: formatUsd(insightsView.financials.tips)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Collected",
						value: formatUsd(insightsView.financials.collected)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Outstanding",
						value: formatUsd(insightsView.financials.awaitingPayment)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinancialsPanel, { insights: insightsView }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SalesPanel, {
				insights: insightsView,
				orders
			})
		]
	});
}
function AnalyticsPanel({ insights }) {
	const c = insights.customers;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Customer analytics" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Customers",
						value: String(c.total)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "New (7d)",
						value: String(c.new7d)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Repeat",
						value: String(c.repeat)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Avg points",
						value: String(c.avgPoints)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "ed-sub",
				children: [c.twoFactor, " accounts have two-factor on."]
			}),
			c.top.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "settings-subhead",
				children: "Top guests"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "rank-list",
				children: c.top.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					row.name,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
						row.orders,
						" orders · ",
						row.points,
						" pts"
					] })
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatUsd(row.spend) })] }, row.userId))
			})] }) : null
		]
	});
}
function FinancialsPanel({ insights }) {
	const f = insights.financials;
	const s = insights.sales;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "kpi-grid",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
				label: "Food",
				value: formatUsd(f.food)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
				label: "Tax collected",
				value: formatUsd(f.tax)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
				label: "Discounts",
				value: formatUsd(f.discounts)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
				label: "Delivery fees",
				value: formatUsd(f.deliveryFees)
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Till mix" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mix-track",
				"aria-hidden": true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mix-seg mix-food",
						style: {
							flexGrow: Math.max(f.food, 0),
							flexBasis: 0
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mix-seg mix-tax",
						style: {
							flexGrow: Math.max(f.tax, 0),
							flexBasis: 0
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mix-seg mix-fee",
						style: {
							flexGrow: Math.max(f.deliveryFees, 0),
							flexBasis: 0
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mix-seg mix-disc",
						style: {
							flexGrow: Math.max(f.discounts, 0),
							flexBasis: 0
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mix-legend ed-sub",
				children: "Tomato is food · cream is tax · muted is delivery fees · dark is discounts"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "totals",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Food (before tax)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(f.food) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Tips (not taxed)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(f.tips) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Pickup" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(f.pickup) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Delivery" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(f.delivery) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Awaiting card" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(f.awaitingPayment) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Canceled tickets" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: s.canceled })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Tickets counted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: s.tickets })] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "settings-subhead",
				children: "Payment mix"
			}),
			f.byPay.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-empty",
				children: "No payments yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "rank-list",
				children: f.byPay.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					payMethodLabel(p.method),
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [p.count, " tickets"] })
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatUsd(p.total) })] }, p.method))
			})
		]
	})] });
}
function SalesPanel({ insights, orders }) {
	const s = insights.sales;
	const recent = (0, import_react.useMemo)(() => orders.slice(0, 12), [orders]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Sales" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Month",
						value: formatUsd(s.month)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "All time",
						value: formatUsd(s.allTime)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Avg ticket",
						value: formatUsd(s.avgTicket)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
						label: "Tickets",
						value: String(s.tickets)
					})
				]
			}),
			s.series.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "chart-frame",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
						data: s.series,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								strokeDasharray: "3 3",
								stroke: "var(--color-studio-line)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "day",
								tick: {
									fill: "var(--color-studio-muted)",
									fontSize: 11
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { tick: {
								fill: "var(--color-studio-muted)",
								fontSize: 11
							} }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "total",
								fill: "var(--color-tomato)",
								radius: 4
							})
						]
					})
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-empty",
				children: "No sales yet."
			}),
			s.topItems.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "settings-subhead",
				children: "Top items"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "rank-list",
				children: s.topItems.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					it.name,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [it.qty, " sold"] })
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatUsd(it.sales) })] }, it.name))
			})] }) : null
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "page-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Recent tickets" }), recent.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "ed-empty",
			children: "No tickets yet."
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "table-wrap",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "plain-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Ticket" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "When" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Name" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Total" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: recent.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: ["#", formatTicketNo(o.ticketNo)] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: o.createdAt ? new Date(o.createdAt).toLocaleString() : "—" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: o.pickupName || "Guest" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatUsd(o.total) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: o.status.replaceAll("_", " ") })
				] }, o.id)) })]
			})
		})]
	})] });
}
function Kpi({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "kpi",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: value })]
	});
}
//#endregion
//#region src/components/customer-center.tsx
var ORDER_STATUSES = [
	"placed",
	"accepted",
	"awaiting_payment",
	"preparing",
	"ready",
	"out_for_delivery",
	"completed",
	"canceled"
];
function CustomerCenter({ tab, thread, customer }) {
	const navigate = useNavigate();
	function go(next) {
		navigate({
			to: "/admin/center",
			search: {
				tab: next.tab ?? tab,
				thread: next.thread,
				customer: next.customer
			}
		});
	}
	const [unread, setUnread] = (0, import_react.useState)(0);
	const [orderCount, setOrderCount] = (0, import_react.useState)(0);
	const [custCount, setCustCount] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		getAdminInboxCount().then((r) => setUnread(r.unread)).catch(() => void 0);
		listAllOrders().then((list) => setOrderCount(list.filter((o) => o.status !== "canceled" && o.status !== "completed").length)).catch(() => void 0);
		listCustomers().then((list) => setCustCount(list.length)).catch(() => void 0);
	}, [tab]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "center-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "page-card center-head",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "shop-brand-kicker",
						children: "Admin"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Customer Center" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Messages, tickets, the customer book, and rewards in one place."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "seg center-tabs",
					role: "tablist",
					"aria-label": "Customer Center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "tab",
							"aria-selected": tab === "messages",
							"data-on": tab === "messages",
							onClick: () => go({ tab: "messages" }),
							children: ["Messages", unread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: unread }) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "tab",
							"aria-selected": tab === "orders",
							"data-on": tab === "orders",
							onClick: () => go({ tab: "orders" }),
							children: ["Orders", orderCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: orderCount }) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							role: "tab",
							"aria-selected": tab === "customers",
							"data-on": tab === "customers",
							onClick: () => go({ tab: "customers" }),
							children: ["Customers", custCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: custCount }) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							"aria-selected": tab === "rewards",
							"data-on": tab === "rewards",
							onClick: () => go({ tab: "rewards" }),
							children: "Rewards"
						})
					]
				})]
			}),
			tab === "messages" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CenterMessages, {
				wantedThread: thread,
				wantedCustomer: customer,
				onOpenOrder: () => go({ tab: "orders" }),
				onOpenCustomer: (id) => go({
					tab: "customers",
					customer: id
				}),
				onThread: (id) => go({
					tab: "messages",
					thread: id
				})
			}) : null,
			tab === "orders" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CenterOrders, { onMessage: (userId) => go({
				tab: "messages",
				customer: userId
			}) }) : null,
			tab === "customers" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CenterCustomers, {
				focusId: customer,
				onMessage: (id, threadId) => go({
					tab: "messages",
					customer: id,
					thread: threadId
				})
			}) : null,
			tab === "rewards" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CenterRewards, {}) : null
		]
	});
}
function CenterMessages({ wantedThread, wantedCustomer, onOpenOrder, onOpenCustomer, onThread }) {
	const [threads, setThreads] = (0, import_react.useState)([]);
	const [active, setActive] = (0, import_react.useState)(wantedThread ?? "");
	const [filter, setFilter] = (0, import_react.useState)("open");
	const [query, setQuery] = (0, import_react.useState)("");
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [orders, setOrders] = (0, import_react.useState)([]);
	const [customers, setCustomers] = (0, import_react.useState)([]);
	const [linkOrderId, setLinkOrderId] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [pane, setPane] = (0, import_react.useState)("list");
	const logRef = (0, import_react.useRef)(null);
	function loadInbox() {
		return listAdminChats().then((list) => {
			setThreads(list);
			return list;
		}).catch((e) => {
			setError(e instanceof Error ? e.message : "Could not load chats");
			return [];
		});
	}
	(0, import_react.useEffect)(() => {
		loadInbox().then((list) => {
			const want = wantedThread && list.find((t) => t.id === wantedThread) || wantedCustomer && list.find((t) => t.userId === wantedCustomer && t.status !== "solved") || wantedCustomer && list.find((t) => t.userId === wantedCustomer) || list.find((t) => t.status !== "solved" && !t.muted) || list[0];
			if (want) {
				setActive(want.id);
				if (wantedThread || wantedCustomer) setPane("thread");
			}
		});
		listAllOrders().then(setOrders).catch(() => setOrders([]));
		listCustomers().then(setCustomers).catch(() => setCustomers([]));
		const t = window.setInterval(() => {
			loadInbox();
			getAdminInboxCount().then((r) => emitAdminInbox(r.unread)).catch(() => void 0);
		}, 8e3);
		return () => window.clearInterval(t);
	}, [wantedThread, wantedCustomer]);
	(0, import_react.useEffect)(() => {
		if (!active) {
			setMessages([]);
			return;
		}
		const current = threads.find((t) => t.id === active);
		setNote(current?.staffNote ?? "");
		loadChatMessages({ data: { threadId: active } }).then(async (msgs) => {
			setMessages(msgs);
			const waiting = (await loadInbox()).filter((t) => t.unreadAdmin > 0 && t.status !== "solved" && !t.muted).length;
			emitAdminInbox(waiting);
		}).catch(() => setMessages([]));
		const t = window.setInterval(() => {
			loadChatMessages({ data: { threadId: active } }).then(setMessages).catch(() => void 0);
		}, 6e3);
		return () => window.clearInterval(t);
	}, [active]);
	(0, import_react.useEffect)(() => {
		const el = logRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages]);
	const visible = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return threads.filter((t) => {
			if (filter === "open" && t.status === "solved") return false;
			if (filter === "solved" && t.status !== "solved") return false;
			if (filter === "unread" && !(t.unreadAdmin > 0 && t.status !== "solved")) return false;
			if (filter === "flagged" && !t.flagged) return false;
			if (wantedCustomer && filter === "open" && t.userId === wantedCustomer) return true;
			if (!q) return true;
			return [
				t.customerName,
				t.customerPhone,
				t.lastMessage,
				t.order?.id,
				formatTicketNo(t.order?.ticketNo),
				t.staffNote
			].join(" ").toLowerCase().includes(q);
		});
	}, [
		threads,
		filter,
		query,
		wantedCustomer
	]);
	const current = threads.find((t) => t.id === active);
	const profile = customers.find((c) => c.userId === current?.userId);
	const theirOrders = orders.filter((o) => o.userId === current?.userId && o.status !== "canceled").slice(0, 8);
	function pick(id) {
		setActive(id);
		setPane("thread");
		onThread(id);
	}
	function send(body = draft) {
		const text = body.trim();
		if (!active || !text) return;
		setBusy(true);
		setError("");
		sendChatMessage({ data: {
			threadId: active,
			body: text
		} }).then(async () => {
			setDraft("");
			setMessages(await loadChatMessages({ data: { threadId: active } }));
			await loadInbox();
		}).catch((err) => setError(err instanceof Error ? err.message : "Could not send")).finally(() => setBusy(false));
	}
	function onSubmit(e) {
		e.preventDefault();
		send();
	}
	function resolve(solved) {
		if (!active) return;
		setBusy(true);
		setChatResolution({ data: {
			threadId: active,
			solved
		} }).then(async () => {
			const list = await loadInbox();
			if (solved) {
				const nextOpen = list.find((t) => t.status !== "solved") ?? list[0];
				if (nextOpen) pick(nextOpen.id);
			}
		}).catch((err) => setError(err instanceof Error ? err.message : "Could not update")).finally(() => setBusy(false));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "center-stage",
		"data-pane": pane,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "center-inbox page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Find a conversation" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "cat-search",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
								size: 16,
								strokeWidth: 2.2,
								"aria-hidden": true
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: query,
								onChange: (e) => setQuery(e.target.value),
								placeholder: "Name, phone, ticket",
								"aria-label": "Search conversations"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "seg center-filters",
						role: "group",
						"aria-label": "Filter chats",
						children: [
							"open",
							"unread",
							"flagged",
							"solved",
							"all"
						].map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": filter === id,
							onClick: () => setFilter(id),
							children: id[0].toUpperCase() + id.slice(1)
						}, id))
					}),
					visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-empty",
						children: threads.length === 0 ? "No chats yet." : "Nothing in this filter."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "service-inbox",
						children: visible.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "service-item",
							"data-on": active === t.id,
							onClick: () => pick(t.id),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
									t.customerName,
									t.flagged ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "center-chip",
										children: "Flagged"
									}) : null,
									t.muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "center-chip",
										children: "Muted"
									}) : null,
									t.customerBanned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "center-chip",
										"data-tone": "warn",
										children: "Banned"
									}) : null,
									t.unreadAdmin > 0 && t.status !== "solved" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "nav-pip",
										children: t.unreadAdmin
									}) : null
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: t.lastMessage || "New chat request" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									t.status === "solved" ? "Solved · " : "",
									t.order ? `${t.order.fulfillment === "delivery" ? "Delivery" : "Pickup"} · ${formatUsd(t.order.total)} · ` : "",
									t.lastAt ? formatShopWhen(t.lastAt) : ""
								] })
							]
						}) }, t.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "page-card service-thread center-thread",
				children: !current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-empty",
					children: "Pick a conversation, or message a customer from the book."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "msg-thread-head",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "center-back",
								onClick: () => setPane("list"),
								children: "Inbox"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: current.customerName }),
							current.customerPhone && looksLikePhone(current.customerPhone) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ed-sub",
								children: formatPhone(current.customerPhone)
							}) : null
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "msg-resolve",
							children: current.status === "solved" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ed-btn",
								disabled: busy,
								onClick: () => resolve(false),
								children: "Reopen"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn-print",
								disabled: busy,
								onClick: () => resolve(true),
								children: "Mark solved"
							})
						})]
					}),
					current.order ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderTicketCard, { order: current.order }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "link-ticket",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-empty",
							children: "No ticket on this chat."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Link a ticket" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "ed-input",
									value: linkOrderId,
									onChange: (e) => setLinkOrderId(e.target.value),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "Choose ticket"
									}), theirOrders.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
										value: o.id,
										children: [
											"#",
											formatTicketNo(o.ticketNo),
											" · ",
											o.fulfillment,
											" · ",
											formatUsd(o.total),
											" · ",
											formatShopWhen(o.createdAt)
										]
									}, o.id))]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ed-btn",
									disabled: busy || !linkOrderId,
									onClick: () => {
										setBusy(true);
										attachChatOrder({ data: {
											threadId: current.id,
											orderId: linkOrderId
										} }).then(async () => {
											await loadInbox();
											setLinkOrderId("");
										}).catch((err) => setError(err instanceof Error ? err.message : "Could not link")).finally(() => setBusy(false));
									},
									children: "Link ticket"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "chat-history",
						"aria-label": "Conversation",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "chat-history-head",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "chat-log-kicker",
								children: "Sent messages"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "chat-history-hint",
								children: "What the customer and the shop already sent."
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "chat-log",
							ref: logRef,
							"aria-live": "polite",
							children: messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ed-empty",
								children: "No messages yet. Send the first line from the shop."
							}) : messages.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "chat-bubble",
								"data-role": m.senderRole,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									m.senderRole === "admin" ? "Shop" : current.customerName,
									m.createdAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
										dateTime: m.createdAt,
										children: formatShopClock(m.createdAt)
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "chat-del",
										"aria-label": "Delete message",
										onClick: () => {
											if (!window.confirm("Remove this message?")) return;
											deleteChatMessage({ data: { id: m.id } }).then(async () => setMessages(await loadChatMessages({ data: { threadId: current.id } }))).catch((err) => setError(err instanceof Error ? err.message : "Could not delete"));
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
											size: 12,
											strokeWidth: 2.2
										})
									})
								] }), m.body]
							}, m.id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "chat-compose",
						"aria-label": "Write a reply",
						onSubmit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "chat-compose-head",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "chat-compose-kicker",
									children: "Type a reply here"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Your new message" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									className: "ed-input ed-area chat-draft",
									rows: 3,
									maxLength: 1e3,
									value: draft,
									onChange: (e) => setDraft(e.target.value),
									disabled: current.status === "solved",
									placeholder: "Write a new reply to the customer…",
									onKeyDown: (e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											send();
										}
									}
								})]
							}),
							error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "form-error",
								children: error
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "btn-print",
								disabled: busy || current.status === "solved",
								children: busy ? "Sending…" : "Send reply"
							})
						]
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "page-card center-context",
				children: !current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-empty",
					children: "Customer tools show up when a thread is open."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "shop-brand-kicker",
						children: "Moderate"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: current.customerName }),
					profile ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "ed-sub",
						children: [
							profile.orderCount,
							" orders · ",
							formatUsd(profile.spend),
							" · ",
							profile.points,
							" pts",
							profile.banned ? " · Banned" : ""
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "center-tools",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "ed-btn",
								disabled: busy,
								onClick: () => {
									setChatFlagged({ data: {
										threadId: current.id,
										flagged: !current.flagged
									} }).then(() => loadInbox()).catch((err) => setError(err instanceof Error ? err.message : "Could not flag"));
								},
								children: [current.flagged ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlagOff, {
									size: 14,
									strokeWidth: 2.2
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, {
									size: 14,
									strokeWidth: 2.2
								}), current.flagged ? "Clear flag" : "Flag follow-up"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "ed-btn",
								disabled: busy,
								onClick: () => {
									setChatMuted({ data: {
										threadId: current.id,
										muted: !current.muted
									} }).then(() => loadInbox()).catch((err) => setError(err instanceof Error ? err.message : "Could not mute"));
								},
								children: [current.muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {
									size: 14,
									strokeWidth: 2.2
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, {
									size: 14,
									strokeWidth: 2.2
								}), current.muted ? "Unmute pip" : "Mute pip"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "ed-btn",
								disabled: busy || !current.userId,
								onClick: () => {
									const on = !current.customerBanned;
									if (on && !window.confirm(`Ban ${current.customerName}? They will not be able to order or chat.`)) return;
									setAccountBanned({ data: {
										userId: current.userId,
										banned: on
									} }).then(() => loadInbox()).catch((err) => setError(err instanceof Error ? err.message : "Could not ban"));
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, {
									size: 14,
									strokeWidth: 2.2
								}), current.customerBanned ? "Lift ban" : "Ban account"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "ed-btn ed-btn-danger",
								disabled: busy,
								onClick: () => {
									if (!window.confirm("Delete this entire conversation?")) return;
									deleteChatThread({ data: { threadId: current.id } }).then(async () => {
										const list = await loadInbox();
										setActive(list[0]?.id ?? "");
										setPane("list");
									}).catch((err) => setError(err instanceof Error ? err.message : "Could not delete"));
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
									size: 14,
									strokeWidth: 2.2
								}), "Delete chat"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Staff note (not shown to the customer)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "ed-input ed-area",
							rows: 3,
							maxLength: 800,
							value: note,
							onChange: (e) => setNote(e.target.value),
							onBlur: () => {
								if (note === (current.staffNote ?? "")) return;
								setChatStaffNote({ data: {
									threadId: current.id,
									note
								} }).then(() => loadInbox()).catch((err) => setError(err instanceof Error ? err.message : "Could not save note"));
							}
						})]
					}),
					current.order ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/admin/pos",
						search: { ticket: current.order.id },
						className: "ed-btn",
						children: "Open ticket on POS"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-btn",
						onClick: () => onOpenCustomer(current.userId),
						children: "Open in the book"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-btn",
						onClick: () => onOpenOrder(),
						children: "View tickets"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "settings-subhead",
						children: "Tickets"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderDateTrays, {
						orders: theirOrders,
						empty: "No tickets on this account.",
						children: (o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							"#",
							formatTicketNo(o.ticketNo),
							" · ",
							formatShopWhen(o.createdAt),
							" · ",
							o.fulfillment,
							o.scheduledFor ? ` · ${formatShopWhen(o.scheduledFor)}` : ""
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
							formatUsd(o.total),
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: o.status.replaceAll("_", " ") })
						] })] }, o.id)
					})
				] })
			})
		]
	});
}
function CenterOrders({ onMessage }) {
	const [orders, setOrders] = (0, import_react.useState)([]);
	const [query, setQuery] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("live");
	const [printers, setPrinters] = (0, import_react.useState)([]);
	const [receipt, setReceipt] = (0, import_react.useState)(DEFAULT_RECEIPT_OPTIONS);
	const [restaurant, setRestaurant] = (0, import_react.useState)(RESTAURANT);
	const [taxRate, setTaxRate] = (0, import_react.useState)(6.625);
	const [autoPrint, setAutoPrint] = (0, import_react.useState)(true);
	const [msg, setMsg] = (0, import_react.useState)("");
	const [busyId, setBusyId] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		listAllOrders().then(setOrders);
		getAdminShop().then((d) => {
			setPrinters(d.printers);
			setReceipt(d.receiptOptions);
			setRestaurant(d.restaurant);
			setTaxRate(d.settings.taxRate);
			setAutoPrint(d.receiptOptions.autoPrintOnAccept);
		});
	}, []);
	const visible = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return orders.filter((o) => {
			if (status === "live" && (o.status === "completed" || o.status === "canceled")) return false;
			if (status !== "live" && status !== "all" && o.status !== status) return false;
			if (!q) return true;
			return [
				formatTicketNo(o.ticketNo),
				o.id,
				o.fulfillment,
				o.pickupName,
				o.addressLine,
				o.notes,
				o.paymentMethod,
				o.status
			].join(" ").toLowerCase().includes(q);
		});
	}, [
		orders,
		query,
		status
	]);
	async function runPrint(order) {
		if (!printers.some((p) => p.enabled && (p.customerCopy || p.storeCopy))) throw new Error("Add a printer under Settings first.");
		await printOrderReceipts({
			order,
			restaurant,
			receipt,
			printers,
			taxRate,
			fallback: true
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "center-orders",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "page-card",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "center-toolbar",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Find a ticket" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "cat-search",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
							size: 16,
							strokeWidth: 2.2,
							"aria-hidden": true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: query,
							onChange: (e) => setQuery(e.target.value),
							placeholder: "Name, ticket, notes"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Status" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						className: "ed-input",
						value: status,
						onChange: (e) => setStatus(e.target.value),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "live",
								children: "Open tickets"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "all",
								children: "All"
							}),
							ORDER_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: s,
								children: s.replaceAll("_", " ")
							}, s))
						]
					})]
				})]
			}), msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: msg
			}) : null]
		}), visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "page-card",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-empty",
				children: "No tickets match."
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "center-order-grid",
			children: visible.map((o) => {
				const canAccept = o.status === "placed" || o.status === "awaiting_payment";
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "page-card center-order-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["#", formatTicketNo(o.ticketNo)] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "pos-st",
							"data-tone": o.status === "completed" ? "completed" : o.status === "placed" ? "placed" : "accepted",
							children: o.status.replaceAll("_", " ")
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "order-meta",
							children: [
								formatShopWhen(o.createdAt),
								" · ",
								o.fulfillment,
								" · ",
								payMethodLabel(o.paymentMethod),
								o.scheduledFor ? ` · ${formatShopWhen(o.scheduledFor)}` : ""
							]
						}),
						o.pickupName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "ed-sub",
							children: ["Pickup for ", o.pickupName]
						}) : null,
						o.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "ed-sub",
							children: ["Note: ", o.notes]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: o.items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
							it.qty,
							"× ",
							it.name,
							it.size ? ` (${it.size})` : ""
						] }, i)) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "center-order-total",
							children: formatUsd(o.total)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "order-actions",
							children: [
								canAccept ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn-print",
									disabled: busyId === o.id,
									onClick: () => {
										setBusyId(o.id);
										acceptOrder({ data: { id: o.id } }).then(async (next) => {
											setOrders((list) => list.map((x) => x.id === next.id ? next : x));
											if (autoPrint) try {
												await runPrint(next);
												setMsg(`Accepted #${formatTicketNo(next.ticketNo)}. Receipts sent.`);
											} catch (e) {
												setMsg(e instanceof Error ? `Accepted, but print failed: ${e.message}` : "Accepted.");
											}
											else setMsg(`Accepted #${formatTicketNo(next.ticketNo)}.`);
										}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not accept")).finally(() => setBusyId(""));
									},
									children: busyId === o.id ? "Accepting…" : "Accept"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ed-btn",
									disabled: busyId === o.id || o.status === "canceled",
									onClick: () => {
										setBusyId(o.id);
										runPrint(o).then(() => setMsg(`Reprinted #${formatTicketNo(o.ticketNo)}.`)).catch((e) => setMsg(e instanceof Error ? e.message : "Could not print")).finally(() => setBusyId(""));
									},
									children: "Reprint"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									className: "ed-input",
									value: o.status,
									onChange: (e) => {
										const next = e.target.value;
										updateOrderStatus({ data: {
											id: o.id,
											status: next
										} }).then((r) => setOrders((list) => list.map((x) => x.id === o.id ? r.order ?? {
											...x,
											status: next
										} : x)));
									},
									children: ORDER_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: s,
										children: s.replaceAll("_", " ")
									}, s))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "ed-btn",
									onClick: () => onMessage(o.userId),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
										size: 14,
										strokeWidth: 2.2
									}), "Message"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "ed-btn ed-btn-danger",
									disabled: busyId === o.id,
									onClick: () => {
										if (!window.confirm(`Remove ticket #${formatTicketNo(o.ticketNo)}?`)) return;
										setBusyId(o.id);
										deleteOrder({ data: { id: o.id } }).then(() => {
											setOrders((list) => list.filter((x) => x.id !== o.id));
											setMsg(`Removed #${formatTicketNo(o.ticketNo)}.`);
										}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not remove")).finally(() => setBusyId(""));
									},
									children: "Remove"
								})
							]
						})
					]
				}, o.id);
			})
		})]
	});
}
function CenterCustomers({ focusId, onMessage }) {
	const [insights, setInsights] = (0, import_react.useState)(null);
	const [customers, setCustomers] = (0, import_react.useState)([]);
	const [msg, setMsg] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		getAdminInsights().then(setInsights).catch(() => setInsights(null));
		listCustomers().then(setCustomers).catch(() => setCustomers([]));
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "center-customers",
		children: [
			msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: msg
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalyticsPanel, { insights: insights ?? EMPTY_INSIGHTS }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomersPanel, {
				customers,
				setCustomers,
				onMsg: setMsg,
				focusId,
				onMessage: (c) => {
					startAdminChat({ data: { userId: c.userId } }).then((r) => onMessage(c.userId, r.threadId)).catch(() => onMessage(c.userId));
				}
			}),
			focusId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "sr-only",
				children: ["Focused customer ", focusId]
			}) : null
		]
	});
}
function CenterRewards() {
	const [settings, setSettings] = (0, import_react.useState)(null);
	const [customers, setCustomers] = (0, import_react.useState)([]);
	const [insights, setInsights] = (0, import_react.useState)(null);
	const [msg, setMsg] = (0, import_react.useState)("");
	const { toast, flashOk, flashFail } = useSaveFlash();
	(0, import_react.useEffect)(() => {
		getAdminShop().then((d) => setSettings(d.settings)).catch(() => void 0);
		listCustomers().then(setCustomers).catch(() => setCustomers([]));
		getAdminInsights().then(setInsights).catch(() => setInsights(null));
	}, []);
	const view = insights ?? EMPTY_INSIGHTS;
	const holding = customers.reduce((n, c) => n + (c.points || 0), 0);
	function saveProgram() {
		if (!settings) return;
		saveShopSettings({ data: {
			pointsPerDollar: settings.pointsPerDollar,
			redeemRate: settings.redeemRate,
			welcomeBonus: settings.welcomeBonus,
			inviteBonus: settings.inviteBonus,
			inviteeBonus: settings.inviteeBonus
		} }).then(() => {
			setMsg("Rewards program is live.");
			flashOk(true);
		}).catch((e) => {
			const text = e instanceof Error ? e.message : "Could not save rewards";
			setMsg(text);
			flashFail(text);
		});
	}
	if (!settings) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "page-skel",
		children: "Loading rewards…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "center-rewards",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveToast, { toast }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "shop-brand-kicker",
						children: "Rewards"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Points program" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Earn and redeem live here. Guests do not earn points — signed-in accounts do. Adjust a wallet in the book below."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "kpi-grid",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kpi rewards-bubble",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Points in wallets" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: holding })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kpi rewards-bubble",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Average wallet" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: view.customers.avgPoints })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kpi rewards-bubble",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Welcome bonus" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: settings.welcomeBonus })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "kpi rewards-bubble",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Redeem rate" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [settings.redeemRate, " / $1"] })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RewardsPanel, {
				settings,
				setSettings
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-print",
				onClick: saveProgram,
				children: "Save rewards program"
			}),
			msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: msg
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomersPanel, {
				customers,
				setCustomers,
				onMsg: setMsg
			})
		]
	});
}
//#endregion
//#region src/routes/admin/center.tsx
var TABS$1 = /* @__PURE__ */ new Set([
	"messages",
	"orders",
	"customers",
	"rewards"
]);
var Route$12 = createFileRoute("/admin/center")({
	validateSearch: (search) => {
		const tab = typeof search.tab === "string" && TABS$1.has(search.tab) ? search.tab : void 0;
		const thread = typeof search.thread === "string" && search.thread.trim() ? search.thread.trim() : void 0;
		const customer = typeof search.customer === "string" && search.customer.trim() ? search.customer.trim() : void 0;
		return {
			...tab ? { tab } : {},
			...thread ? { thread } : {},
			...customer ? { customer } : {}
		};
	},
	component: AdminCenter
});
function AdminCenter() {
	const { tab, thread, customer } = Route$12.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerCenter, {
		tab: tab ?? "messages",
		thread,
		customer
	});
}
//#endregion
//#region src/routes/admin/customers.tsx
var Route$11 = createFileRoute("/admin/customers")({ component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
	to: "/admin/center",
	search: { tab: "customers" }
}) });
//#endregion
//#region src/routes/admin/financials.tsx
var Route$10 = createFileRoute("/admin/financials")({ component: AdminFinancialsPage });
//#endregion
//#region src/components/menu-editor.tsx
var KINDS = [
	{
		id: "pizza",
		label: "Pizza SM/MD/LG"
	},
	{
		id: "split",
		label: "Split prices"
	},
	{
		id: "single",
		label: "Single price"
	}
];
function MenuEditor() {
	const restaurant = useMenuStore((s) => s.restaurant);
	const footer = useMenuStore((s) => s.footer);
	const categories = useMenuStore((s) => s.categories);
	const setRestaurant = useMenuStore((s) => s.setRestaurant);
	const setFooter = useMenuStore((s) => s.setFooter);
	const addCategory = useMenuStore((s) => s.addCategory);
	const reset = useMenuStore((s) => s.reset);
	const [query, setQuery] = (0, import_react.useState)("");
	const [shopOpen, setShopOpen] = (0, import_react.useState)(false);
	const [openCats, setOpenCats] = (0, import_react.useState)(() => /* @__PURE__ */ new Set());
	const custom = isCustomMenu({
		restaurant,
		footer,
		categories
	});
	const q = query.trim().toLowerCase();
	const visible = (0, import_react.useMemo)(() => {
		if (!q) return categories;
		return categories.map((cat) => ({
			...cat,
			items: cat.items.filter((it) => {
				return `${it.name} ${it.description ?? ""} ${cat.name}`.toLowerCase().includes(q);
			})
		})).filter((cat) => cat.items.length > 0 || cat.name.toLowerCase().includes(q));
	}, [categories, q]);
	(0, import_react.useEffect)(() => {
		if (!q) return;
		setOpenCats(new Set(visible.map((c) => c.id)));
	}, [q, visible]);
	function toggleCat(id) {
		setShopOpen(false);
		setOpenCats((prev) => {
			if (prev.has(id) && prev.size === 1) return /* @__PURE__ */ new Set();
			return /* @__PURE__ */ new Set([id]);
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "editor-panel no-print",
		"aria-label": "Menu editor",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ed-head",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "ed-title",
					children: "Edit menu"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Changes update the wall board and save on this device. Print uses the edited prices."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "ed-btn ed-btn-quiet",
					disabled: !custom,
					onClick: () => {
						if (window.confirm("Restore the original South End Pizza III menu and shop details?")) {
							reset();
							setOpenCats(/* @__PURE__ */ new Set());
							setShopOpen(false);
						}
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
						size: 14,
						strokeWidth: 2.2
					}), "Restore original"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-search",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
					size: 16,
					strokeWidth: 2.2,
					"aria-hidden": true
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "search",
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Search items…",
					"aria-label": "Search menu items"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "ed-block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "ed-block-toggle",
					"aria-expanded": shopOpen,
					onClick: () => {
						setShopOpen((v) => !v);
						setOpenCats(/* @__PURE__ */ new Set());
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Shop details" }), shopOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 16 })]
				}), shopOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ed-shop",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Address",
							value: restaurant.address,
							onChange: (v) => setRestaurant({ address: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "City",
							value: restaurant.city,
							onChange: (v) => setRestaurant({ city: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Phone",
							value: restaurant.phone,
							onChange: (v) => setRestaurant({ phone: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Hours",
							value: restaurant.hours,
							onChange: (v) => setRestaurant({ hours: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Established",
							value: restaurant.established,
							onChange: (v) => setRestaurant({ established: v })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopWebFields, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Footer note" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								className: "ed-input ed-area",
								rows: 2,
								value: footer,
								onChange: (e) => setFooter(e.target.value)
							})]
						})
					]
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ed-cat-list",
				children: [visible.map((cat, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryCard, {
					cat,
					open: openCats.has(cat.id),
					onToggle: () => toggleCat(cat.id),
					isFirst: index === 0 && !q,
					isLast: index === visible.length - 1 && !q,
					allCats: categories,
					querying: Boolean(q)
				}, cat.id)), visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-empty",
					children: "No items match that search."
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "ed-btn ed-btn-add",
				onClick: addCategory,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
					size: 16,
					strokeWidth: 2.2
				}), "Add section"]
			})
		]
	});
}
function ShopWebFields() {
	const tagline = useMenuStore((s) => s.tagline);
	const showMark = useMenuStore((s) => s.showMark);
	const setShopWeb = useMenuStore((s) => s.setShopWeb);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
		label: "Tagline",
		value: tagline,
		onChange: (v) => setShopWeb({ tagline: v })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "pay-opt",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "checkbox",
			checked: showMark,
			onChange: (e) => setShopWeb({ showMark: e.target.checked })
		}), "Show the buffalo mark on login and the wall menu"]
	})] });
}
function Field({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "ed-field",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			className: "ed-input",
			value,
			onChange: (e) => onChange(e.target.value)
		})]
	});
}
function WingExtraPrices({ cat }) {
	const patchItem = useMenuStore((s) => s.patchItem);
	const wing = cat.items.find((it) => /wing/i.test(it.name));
	if (!wing) return null;
	const wingId = wing.id;
	const conds = wing.condiments ?? [];
	function unit(which) {
		return conds.find((c) => which === "ranch" ? /extra ranch/i.test(c.name) || c.id === "wing-extra-ranch" : /extra blue/i.test(c.name) || c.id === "wing-extra-blue")?.price ?? "1.50";
	}
	function setUnit(which, price) {
		const id = which === "ranch" ? "wing-extra-ranch" : "wing-extra-blue";
		const name = which === "ranch" ? "Extra Ranch" : "Extra Blue cheese";
		const next = [...conds];
		const i = next.findIndex((c) => c.id === id || (which === "ranch" ? /extra ranch/i.test(c.name) : /extra blue/i.test(c.name)));
		const row = {
			id,
			name,
			price,
			extraPrice: price,
			maxQty: "6"
		};
		if (i >= 0) next[i] = {
			...next[i],
			...row
		};
		else next.push(row);
		patchItem(cat.id, wingId, { condiments: next });
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ed-field",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Extra dips (per 2 cups)" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "Guest wing builder uses these live prices. Included Ranch / Blue cheese / None stay free."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "two-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Extra Ranch" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input ed-price",
						inputMode: "decimal",
						value: unit("ranch"),
						onChange: (e) => setUnit("ranch", e.target.value)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Extra Blue cheese" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input ed-price",
						inputMode: "decimal",
						value: unit("blue"),
						onChange: (e) => setUnit("blue", e.target.value)
					})]
				})]
			})
		]
	});
}
function CategoryCard({ cat, open, onToggle, isFirst, isLast, allCats, querying }) {
	const patchCategory = useMenuStore((s) => s.patchCategory);
	const setKind = useMenuStore((s) => s.setKind);
	const addItem = useMenuStore((s) => s.addItem);
	const deleteCategory = useMenuStore((s) => s.deleteCategory);
	const moveCategory = useMenuStore((s) => s.moveCategory);
	const [confirmDel, setConfirmDel] = (0, import_react.useState)(false);
	const Icon = iconFor(cat.icon ?? cat.id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "ed-cat",
		"data-open": open ? "true" : "false",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ed-cat-bar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "ed-cat-toggle",
				"aria-expanded": open,
				onClick: onToggle,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ed-cat-ico",
						"aria-hidden": true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { strokeWidth: 2.2 })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ed-cat-name",
						children: cat.name || "Untitled section"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ed-cat-count",
						children: cat.items.length
					}),
					open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { size: 16 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 16 })
				]
			}), !querying ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ed-icon-btns",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
					label: "Move section up",
					disabled: isFirst,
					onClick: () => moveCategory(cat.id, -1),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { size: 15 })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
					label: "Move section down",
					disabled: isLast,
					onClick: () => moveCategory(cat.id, 1),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 15 })
				})]
			}) : null]
		}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ed-cat-body",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Section name",
					value: cat.name,
					onChange: (v) => patchCategory(cat.id, { name: v })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Section description",
					value: cat.note ?? "",
					onChange: (v) => patchCategory(cat.id, { note: v })
				}),
				cat.id === "wings" || cat.items.some((it) => /wing/i.test(it.name)) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WingExtraPrices, { cat }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Icon" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "ed-input",
						value: cat.icon ?? cat.id,
						onChange: (e) => patchCategory(cat.id, { icon: e.target.value }),
						children: ICON_CHOICES.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: opt.id,
							children: opt.label
						}, opt.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Price layout" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "seg ed-kind",
						role: "group",
						"aria-label": "Price layout",
						children: KINDS.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": cat.kind === k.id,
							onClick: () => setKind(cat.id, k.id),
							children: k.label
						}, k.id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ed-items",
					children: [cat.items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemCard, {
						cat,
						item,
						isFirst: i === 0,
						isLast: i === cat.items.length - 1,
						allCats
					}, item.id)), cat.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-empty",
						children: "No items in this section yet."
					}) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ed-cat-actions",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "ed-btn",
						onClick: () => addItem(cat.id),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							size: 15,
							strokeWidth: 2.2
						}), "Add item"]
					}), confirmDel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-btn ed-btn-danger",
						onClick: () => deleteCategory(cat.id),
						children: "Confirm delete section"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "ed-btn ed-btn-quiet",
						onClick: () => setConfirmDel(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 15 }), "Delete section"]
					})]
				})
			]
		}) : null]
	});
}
function ItemCard({ cat, item, isFirst, isLast, allCats }) {
	const patchItem = useMenuStore((s) => s.patchItem);
	const setPrices = useMenuStore((s) => s.setPrices);
	const deleteItem = useMenuStore((s) => s.deleteItem);
	const duplicateItem = useMenuStore((s) => s.duplicateItem);
	const moveItem = useMenuStore((s) => s.moveItem);
	const moveItemTo = useMenuStore((s) => s.moveItemTo);
	const [confirmDel, setConfirmDel] = (0, import_react.useState)(false);
	const [photoBusy, setPhotoBusy] = (0, import_react.useState)(false);
	const [photoErr, setPhotoErr] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "ed-item",
		"data-fav": item.highlight ? "true" : void 0,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Item" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "ed-input",
					value: item.name,
					onChange: (e) => patchItem(cat.id, item.id, { name: e.target.value })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Description" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "ed-input",
					value: item.description ?? "",
					onChange: (e) => patchItem(cat.id, item.id, { description: e.target.value })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ed-field",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Photo" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "toggle-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "toggle",
							type: "checkbox",
							role: "switch",
							checked: !item.hideImage,
							"aria-checked": !item.hideImage,
							onChange: (e) => patchItem(cat.id, item.id, { hideImage: !e.target.checked })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Show photo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Off shrinks the card to name, description, and price." })] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: "ed-item-photo",
						src: itemPhoto(item, cat.id),
						alt: "",
						"data-off": item.hideImage ? "true" : void 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-btn ed-btn-quiet ed-photo-pick",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
								size: 14,
								strokeWidth: 2.2
							}),
							item.image ? "Replace photo" : "Upload photo",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "file",
								accept: "image/png,image/jpeg,image/webp",
								disabled: photoBusy,
								onChange: (e) => {
									const file = e.target.files?.[0];
									e.target.value = "";
									if (!file) return;
									setPhotoBusy(true);
									setPhotoErr("");
									fileToDataImage(file, {
										maxEdge: 1600,
										maxChars: 35e4,
										quality: .92
									}).then((url) => {
										patchItem(cat.id, item.id, { image: url });
									}).catch((err) => {
										setPhotoErr(err instanceof Error ? err.message : "Could not read that photo");
									}).finally(() => setPhotoBusy(false));
								}
							})
						]
					}),
					item.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-btn ed-btn-quiet",
						onClick: () => patchItem(cat.id, item.id, { image: "" }),
						children: "Remove photo"
					}) : null,
					photoBusy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-empty",
						children: "Compressing photo…"
					}) : null,
					photoErr ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "form-error",
						children: photoErr
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PriceFields, {
				kind: cat.kind,
				prices: item.prices,
				onChange: (prices) => setPrices(cat.id, item.id, prices)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CondimentFields, {
				condiments: item.condiments ?? [],
				onChange: (condiments) => patchItem(cat.id, item.id, { condiments })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ed-item-tools",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "ed-star",
					"data-on": item.highlight ? "true" : void 0,
					"aria-pressed": Boolean(item.highlight),
					onClick: () => patchItem(cat.id, item.id, { highlight: !item.highlight }),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
						size: 14,
						strokeWidth: 2.2,
						fill: item.highlight ? "currentColor" : "none"
					}), "House favorite"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ed-icon-btns",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "Move up",
							disabled: isFirst,
							onClick: () => moveItem(cat.id, item.id, -1),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { size: 15 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "Move down",
							disabled: isLast,
							onClick: () => moveItem(cat.id, item.id, 1),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { size: 15 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "Duplicate",
							onClick: () => duplicateItem(cat.id, item.id),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { size: 14 })
						}),
						confirmDel ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ed-icon-btn ed-btn-danger",
							onClick: () => deleteItem(cat.id, item.id),
							children: "Delete"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "Delete item",
							onClick: () => setConfirmDel(true),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
						})
					]
				})]
			}),
			allCats.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ed-field ed-move",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Move to" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					className: "ed-input",
					value: cat.id,
					onChange: (e) => {
						if (e.target.value !== cat.id) moveItemTo(cat.id, item.id, e.target.value);
					},
					children: allCats.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: c.id,
						children: c.name || "Untitled section"
					}, c.id))
				})]
			}) : null
		]
	});
}
function CondimentFields({ condiments, onChange }) {
	const rows = condiments;
	function patch(i, patch) {
		onChange(rows.map((r, idx) => idx === i ? {
			...r,
			...patch
		} : r));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ed-field",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Condiments & extras" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-empty",
				children: "Guests can add these in the confirm popup. Qty is the most they can add. Extra is the price after the first."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "ed-condiments",
				children: rows.map((c, i) => {
					const cap = condimentMax(c.maxQty);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ed-condiment-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: c.name,
									onChange: (e) => patch(i, { name: e.target.value })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Qty" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "qty-step",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-label": `Fewer ${c.name || "condiment"}`,
											disabled: cap <= 1,
											onClick: () => patch(i, { maxQty: String(Math.max(1, cap - 1)) }),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { size: 14 })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "ed-input ed-qty",
											inputMode: "numeric",
											"aria-label": `${c.name || "Condiment"} quantity cap`,
											value: c.maxQty ?? String(cap),
											onChange: (e) => {
												const n = Math.max(1, Math.min(9, Math.round(Number(e.target.value.replace(/[^\d]/g, "")) || 1)));
												patch(i, { maxQty: String(n) });
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-label": `More ${c.name || "condiment"}`,
											disabled: cap >= 9,
											onClick: () => patch(i, { maxQty: String(Math.min(9, cap + 1)) }),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 })
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Add $" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input ed-price",
									inputMode: "decimal",
									value: c.price,
									onChange: (e) => patch(i, { price: e.target.value })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Extra $" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input ed-price",
									inputMode: "decimal",
									value: c.extraPrice,
									onChange: (e) => patch(i, { extraPrice: e.target.value })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
								label: "Remove condiment",
								onClick: () => onChange(rows.filter((_, idx) => idx !== i)),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
							})
						]
					}, c.id || i);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "ed-btn ed-btn-quiet",
				onClick: () => onChange([...rows, {
					id: `cond-${Math.random().toString(36).slice(2, 8)}`,
					name: "",
					price: "0.75",
					extraPrice: "0.75",
					maxQty: "9"
				}]),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
					size: 14,
					strokeWidth: 2.2
				}), "Add condiment"]
			})
		]
	});
}
function PriceFields({ kind, prices, onChange }) {
	if (kind === "pizza") {
		const rows = prices.length ? prices : [{
			label: "SM",
			inches: "12\"",
			price: ""
		}];
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ed-prices",
			"data-kind": "pizza",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Type a price to offer that size. Leave it blank to hide it. Add XL or any custom size here — no extra toggle."
				}),
				rows.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ed-price-row",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Size" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								value: p.label ?? "",
								onChange: (e) => {
									onChange(rows.map((r, idx) => idx === i ? {
										...r,
										label: e.target.value
									} : r));
								},
								placeholder: "SM"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Inches" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								value: p.inches ?? "",
								onChange: (e) => {
									onChange(rows.map((r, idx) => idx === i ? {
										...r,
										inches: e.target.value
									} : r));
								},
								placeholder: "12\""
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Price" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input ed-price",
								inputMode: "decimal",
								value: p.price,
								onChange: (e) => {
									onChange(rows.map((r, idx) => idx === i ? {
										...r,
										price: e.target.value
									} : r));
								},
								placeholder: "0.00"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
							label: "Remove size",
							disabled: rows.length <= 1,
							onClick: () => onChange(rows.filter((_, idx) => idx !== i)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
						})
					]
				}, i)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "ed-btn ed-btn-quiet",
					onClick: () => {
						const hasXl = rows.some((r) => (r.label ?? "").toUpperCase() === "XL");
						onChange([...rows, hasXl ? {
							label: "",
							inches: "",
							price: ""
						} : {
							label: "XL",
							inches: "18\"",
							price: ""
						}]);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), "Add size"]
				})
			]
		});
	}
	const rows = prices.length ? prices : [{ price: "" }];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ed-prices",
		"data-kind": kind,
		children: [rows.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "ed-price-row",
			children: [
				kind === "split" || p.label ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Label" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						value: p.label ?? "",
						onChange: (e) => {
							onChange(rows.map((r, idx) => idx === i ? {
								...r,
								label: e.target.value
							} : r));
						}
					})]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Price" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input ed-price",
						inputMode: "decimal",
						value: p.price,
						onChange: (e) => {
							onChange(rows.map((r, idx) => idx === i ? {
								...r,
								price: e.target.value
							} : r));
						}
					})]
				}),
				kind === "split" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
					label: "Remove price",
					disabled: rows.length <= 1,
					onClick: () => onChange(rows.filter((_, idx) => idx !== i)),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 })
				}) : null
			]
		}, i)), kind === "split" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "ed-btn ed-btn-quiet",
			onClick: () => onChange([...rows, {
				label: "",
				price: ""
			}]),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), "Add size"]
		}) : null]
	});
}
function IconBtn({ label, onClick, disabled, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "ed-icon-btn",
		"aria-label": label,
		title: label,
		disabled,
		onClick,
		children
	});
}
//#endregion
//#region src/components/card-editor.tsx
function ColorRow({ label, value, onChange, swatches, toHex, kindOf, contrastOk = true }) {
	const kind = kindOf(value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ed-field",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "ed-color-row",
				children: [swatches.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "ed-color-swatch",
					"data-swatch": opt.id,
					"data-on": kind === opt.id,
					"aria-pressed": kind === opt.id,
					"aria-label": `${opt.label} for ${label.toLowerCase()}`,
					onClick: () => onChange(opt.id)
				}, opt.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-color-custom",
					"data-on": kind === "custom" || void 0,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Custom" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "color",
						value: toHex(value),
						"aria-label": `Custom ${label.toLowerCase()} color`,
						onChange: (e) => onChange(e.target.value)
					})]
				})]
			}),
			!contrastOk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-empty",
				children: "Hard to read on this card paper — pick a darker ink or a lighter background."
			}) : null
		]
	});
}
function SizeRow({ label, value, options, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "ed-field",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "seg ed-kind",
			role: "group",
			"aria-label": label,
			children: options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"data-on": value === opt.id,
				onClick: () => onChange(opt.id),
				children: opt.label
			}, opt.id))
		})]
	});
}
var PREVIEWS = [{
	name: "Cheese Pizza",
	desc: "Sauce, mozzarella",
	price: "from $14.00"
}, {
	name: "Spinach, Broccoli & Extra Cheese Pizza",
	desc: "House favorite with roasted garlic and a long line of toppings",
	price: "from $18.75"
}];
function CardEditor() {
	const cardSize = useMenuStore((s) => s.cardSize);
	const cardTextSize = useMenuStore((s) => s.cardTextSize);
	const cardTextColor = useMenuStore((s) => s.cardTextColor);
	const cardDescColor = useMenuStore((s) => s.cardDescColor);
	const cardPriceColor = useMenuStore((s) => s.cardPriceColor);
	const cardBg = useMenuStore((s) => s.cardBg);
	const setCardType = useMenuStore((s) => s.setCardType);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "card-editor-page",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "page-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Card Editor" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Size the menu tiles, paint the paper, and set name, description, and price inks. Preview updates as you tap."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ed-card-type",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SizeRow, {
							label: "Card size",
							value: cardSize,
							options: CARD_SIZES,
							onChange: (id) => setCardType({ cardSize: id })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SizeRow, {
							label: "Text size",
							value: cardTextSize,
							options: CARD_TEXT_SIZES,
							onChange: (id) => setCardType({ cardTextSize: id })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, {
							label: "Background",
							value: cardBg,
							onChange: (v) => setCardType({ cardBg: v }),
							swatches: CARD_BG_COLORS,
							toHex: cardBgHex,
							kindOf: cardBgKind
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, {
							label: "Name",
							value: cardTextColor,
							onChange: (v) => setCardType({ cardTextColor: v }),
							swatches: CARD_TEXT_COLORS,
							toHex: cardColorHex,
							kindOf: cardColorKind,
							contrastOk: cardTextContrastOk(cardTextColor, cardBg)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, {
							label: "Description",
							value: cardDescColor,
							onChange: (v) => setCardType({ cardDescColor: v }),
							swatches: CARD_TEXT_COLORS,
							toHex: cardColorHex,
							kindOf: cardColorKind,
							contrastOk: cardTextContrastOk(cardDescColor, cardBg)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ColorRow, {
							label: "Price",
							value: cardPriceColor,
							onChange: (v) => setCardType({ cardPriceColor: v }),
							swatches: CARD_TEXT_COLORS,
							toHex: cardColorHex,
							kindOf: cardColorKind,
							contrastOk: cardTextContrastOk(cardPriceColor, cardBg)
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "page-card",
			"aria-label": "Card preview",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Preview" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "Long names wrap and clip. Type never stacks over the photo or the price."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "food-grid ed-card-preview-grid",
					"data-card-size": cardTextSize,
					"data-card-fit": cardSize,
					style: cardTypeStyle(cardTextColor, cardDescColor, cardPriceColor, cardBg),
					children: PREVIEWS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "food-card",
						"aria-hidden": true,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "food-card-photo",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "food-card-photo-empty",
								children: "Aa"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "food-card-copy",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "food-card-name",
									children: item.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "food-card-desc",
									children: item.desc
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "food-price",
									children: item.price
								})
							]
						})]
					}, item.name))
				})
			]
		})]
	});
}
//#endregion
//#region src/components/printer-setup.tsx
var STEPS = [
	{
		title: "Stay on shop Wi-Fi",
		body: "The Epson talks over the shop network (HTTP 8008 or HTTPS 8043). Enter the printer IP from this tablet, then Test print. Hardware buy is still on hold — save the IP when the printer is on the counter."
	},
	{
		title: "HTTPS tablets may need the printer certificate",
		body: "This shop is HTTPS. A browser can block HTTP 8008 as mixed content. Prefer the printer’s HTTPS 8043 once its certificate is trusted on this tablet."
	},
	{
		title: "Bluetooth is a fallback only",
		body: "Chrome or Edge on Android or Windows can pair a spare BLE printer. Safari and iPhone cannot. Completes never wait on a print failure."
	},
	{
		title: "Test print, then accept an order",
		body: "Tap Test print. If a paper preview opens instead, the tablet is not talking to the printer yet. Auto-print on accept uses the same path and still never blocks Completes."
	}
];
function hintFor(msg, diag) {
	const d = diag;
	if (d?.ios || d?.safari) return "This tablet’s browser cannot pair a Bluetooth printer. Open the shop in Chrome or Edge on Android or Windows.";
	if (d?.ready === "adapter-off") return "Turn Bluetooth on in this tablet’s settings, then tap Diagnose.";
	if (d?.ready === "unavailable") return "This browser has no Bluetooth printer API. Open the shop in Chrome or Edge.";
	if (d?.ready === "blocked") return "Pairing opens a top window so the tablet chooser can appear. Keep that window in front.";
	if (/cancel/i.test(msg)) return "The chooser was closed. Tap Pair again and pick the thermal printer.";
	if (/not paired/i.test(msg)) return "This tablet forgot the printer. Tap Pair Bluetooth on that printer card.";
	if (/characteristic/i.test(msg)) return "Connected, but the printer did not expose a print channel. Re-pair while it is awake and in range.";
	if (/pop-?up/i.test(msg)) return "Allow pop-ups for this shop, then tap Test print or Pair again.";
	if (/timed out/i.test(msg)) return "The printer slept or walked away. Wake it, stay close, then try again.";
	if (/not available/i.test(msg)) return "Use Chrome or Edge on the shop tablet — not the phone preview.";
	return "";
}
function PrinterSetup({ printers, setPrinters, receipt, setReceipt, restaurant, taxRate, onSave, saving }) {
	const [busyId, setBusyId] = (0, import_react.useState)("");
	const [pairMsg, setPairMsg] = (0, import_react.useState)("");
	const [btState, setBtState] = (0, import_react.useState)("");
	const [diag, setDiag] = (0, import_react.useState)(null);
	const [helpOpen, setHelpOpen] = (0, import_react.useState)(false);
	const printersRef = (0, import_react.useRef)(printers);
	printersRef.current = printers;
	const pendingRef = (0, import_react.useRef)(void 0);
	const sample = (0, import_react.useMemo)(() => sampleOrder(), []);
	const customerPreview = buildReceiptText({
		order: sample,
		restaurant,
		receipt,
		kind: "customer",
		taxRate,
		paper: "58mm"
	});
	const storePreview = buildReceiptText({
		order: sample,
		restaurant,
		receipt,
		kind: "store",
		taxRate,
		paper: "58mm"
	});
	const bt = bluetoothSupported();
	const hint = hintFor(pairMsg, diag);
	function runDiagnose() {
		bluetoothDiagnose().then((d) => {
			setDiag(d);
			setBtState(d.ready);
			if (d.ios || d.safari) setPairMsg("This browser cannot pair a Bluetooth printer. Use Chrome or Edge on the shop tablet.");
			else if (d.ready === "adapter-off") setPairMsg("Bluetooth is off on this tablet.");
			else if (d.ready === "unavailable") setPairMsg("Bluetooth printing is not available in this browser.");
			else if (d.ready === "blocked") setPairMsg("Pairing will open a top window so the tablet chooser can appear.");
			else setPairMsg(d.knownDevices ? `Bluetooth is ready. This tablet already knows ${d.knownDevices} printer${d.knownDevices === 1 ? "" : "s"}.` : "Bluetooth is ready. Tap Pair and pick the thermal printer.");
		}).catch((e) => setPairMsg(e instanceof Error ? e.message : "Could not diagnose Bluetooth."));
	}
	(0, import_react.useEffect)(() => {
		bluetoothReady().then(setBtState);
		bluetoothDiagnose().then(setDiag);
	}, []);
	function applyPaired(paired, existing) {
		const list = printersRef.current;
		let next = list;
		if (existing) next = list.map((p) => p.id === existing.id ? {
			...p,
			bluetoothId: paired.bluetoothId,
			bluetoothName: paired.bluetoothName,
			name: p.name === "Receipt printer" ? paired.bluetoothName : p.name
		} : p);
		else if (list.some((p) => p.bluetoothId === paired.bluetoothId)) next = list.map((p) => p.bluetoothId === paired.bluetoothId ? {
			...p,
			bluetoothName: paired.bluetoothName
		} : p);
		else next = [...list, newPrinter({
			name: paired.bluetoothName,
			bluetoothId: paired.bluetoothId,
			bluetoothName: paired.bluetoothName
		})];
		printersRef.current = next;
		setPrinters(next);
		setPairMsg(`Paired ${paired.bluetoothName}. Save to keep it on this shop.`);
	}
	(0, import_react.useEffect)(() => {
		return subscribePairedPrinter((paired) => {
			applyPaired(paired, pendingRef.current);
			setBusyId("");
		});
	}, [setPrinters]);
	function patch(id, next) {
		setPrinters(printers.map((p) => p.id === id ? {
			...p,
			...next
		} : p));
	}
	async function pair(existing) {
		setPairMsg("");
		setBusyId(existing?.id || "new");
		pendingRef.current = existing;
		try {
			applyPaired(await pairBluetoothPrinter(), existing);
		} catch (e) {
			setPairMsg(e instanceof Error ? e.message : "Could not pair the printer.");
			setHelpOpen(true);
		} finally {
			setBusyId("");
			pendingRef.current = void 0;
		}
	}
	async function testPrint(printer) {
		setBusyId(printer.id);
		setPairMsg("");
		try {
			if (printer.lanHost) {
				await testLanPrint(printer);
				setPairMsg(`Sent a LAN test slip to ${printer.name} at ${printer.lanHost}.`);
				return;
			}
			const result = await printOrderReceipts({
				order: sample,
				restaurant,
				receipt,
				printers: [printer],
				taxRate,
				fallback: true
			});
			setPairMsg(result.fallback ? `Opened a paper preview for ${printer.name}. Set a LAN IP or pair Bluetooth to send it to the thermal printer.` : `Sent a test ticket to ${printer.name}.`);
			if (result.fallback) setHelpOpen(true);
		} catch (e) {
			setPairMsg(e instanceof Error ? e.message : "Test print failed.");
			setHelpOpen(true);
		} finally {
			setBusyId("");
		}
	}
	async function checkConnection(printer) {
		if (!printer.bluetoothId) {
			setPairMsg("This printer is not paired on this tablet yet. Tap Pair Bluetooth.");
			setHelpOpen(true);
			return;
		}
		setBusyId(printer.id);
		setPairMsg("");
		try {
			const r = await pingPrinter(printer.bluetoothId);
			setPairMsg(`Connected to ${r.name}. Try a test print next.`);
		} catch (e) {
			setPairMsg(e instanceof Error ? e.message : "Could not reach the printer.");
			setHelpOpen(true);
		} finally {
			setBusyId("");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "printer-setup",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Printer setup" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Primary path is Wi-Fi / LAN (Epson ePOS, port 8008 or HTTPS 8043). Enter the printer IP from this shop tablet on the shop network, then Test print. Bluetooth is a fallback for Chrome/Android only — iPhone cannot print over Bluetooth from the browser."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: btState === "adapter-off" ? "Turn Bluetooth on on this tablet, then tap Pair." : btState === "unavailable" ? "Chrome or Edge on the shop tablet is required to reach the printer." : btState === "blocked" ? "Bluetooth is allowed on this shop. Pairing opens in its own window so the tablet chooser can appear." : "Bluetooth is allowed on this shop. Tap Pair, pick the thermal printer, then save. Chrome or Edge on the shop tablet is required."
					}),
					diag ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "bt-diag",
						"aria-label": "Bluetooth status",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								"data-ok": diag.chrome && !diag.ios && !diag.safari,
								children: [diag.chrome && !diag.ios && !diag.safari ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 14 }), diag.ios || diag.safari ? "Need Chrome or Edge" : "Chrome or Edge"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								"data-ok": diag.ready === "ready" || diag.ready === "blocked",
								children: [diag.ready === "adapter-off" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 14 }), diag.ready === "adapter-off" ? "Bluetooth off" : diag.ready === "unavailable" ? "No Bluetooth API" : "Bluetooth on"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								"data-ok": diag.canPairHere,
								children: [diag.canPairHere ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { size: 14 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, { size: 14 }), diag.canPairHere ? "Can pair here" : "Pairs in a top window"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								"data-ok": diag.knownDevices > 0,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { size: 14 }),
									diag.knownDevices,
									" remembered"
								]
							})
						]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "printer-actions",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "ed-btn",
							onClick: runDiagnose,
							disabled: Boolean(busyId),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
								size: 16,
								strokeWidth: 2.2
							}), "Diagnose"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "ed-btn",
							onClick: () => setHelpOpen((v) => !v),
							"aria-expanded": helpOpen,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleHelp, {
								size: 16,
								strokeWidth: 2.2
							}), helpOpen ? "Hide troubleshooting" : "Troubleshooting"]
						})]
					}),
					helpOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "printer-help",
						children: STEPS.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: step.title }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: step.body })] }, step.title))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "NJ sales tax ID (printed on receipts)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "ed-input",
							value: receipt.taxId,
							onChange: (e) => setReceipt({
								...receipt,
								taxId: e.target.value
							}),
							placeholder: "Certificate of Authority number"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "ed-field",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Customer-copy footer" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "ed-input ed-area",
							rows: 2,
							value: receipt.footer,
							onChange: (e) => setReceipt({
								...receipt,
								footer: e.target.value
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "pay-opt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: receipt.autoPrintOnAccept,
							onChange: (e) => setReceipt({
								...receipt,
								autoPrintOnAccept: e.target.checked
							})
						}), "Print automatically when an order is accepted"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "printer-actions",
						children: [bt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn-print",
							onClick: () => void pair(),
							disabled: Boolean(busyId),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bluetooth, {
								size: 16,
								strokeWidth: 2.2
							}), busyId === "new" ? "Waiting for printer…" : "Pair Bluetooth fallback"]
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "ed-btn",
							onClick: () => setPrinters([...printers, newPrinter({ name: `Printer ${printers.length + 1}` })]),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								size: 16,
								strokeWidth: 2.2
							}), "Add printer"]
						})]
					}),
					pairMsg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: pairMsg
					}) : null,
					hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub printer-hint",
						children: hint
					}) : null,
					!bt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "If the chooser does not appear, pairing opens in its own window."
					}) : null
				]
			}),
			printers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "page-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-empty",
					children: "No printers yet. Add one and enter the Epson IP, or pair Bluetooth as a fallback."
				})
			}) : printers.map((printer) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card printer-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "printer-card-head",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, {
								size: 18,
								strokeWidth: 2.2
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Printer name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "ed-input",
									value: printer.name,
									onChange: (e) => patch(printer.id, { name: e.target.value })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ed-btn ed-btn-danger",
								onClick: () => setPrinters(printers.filter((p) => p.id !== printer.id)),
								"aria-label": `Remove ${printer.name}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 16 })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "ed-sub",
						children: [printer.lanHost ? `LAN: ${printer.lanProtocol}://${printer.lanHost}:${printer.lanPort}` : "No LAN IP yet — add it for the shop Wi-Fi printer.", printer.bluetoothId ? ` · Bluetooth fallback: ${printer.bluetoothName || printer.bluetoothId}` : bt ? " · Bluetooth fallback not paired." : ""]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "account-cityzip",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Printer IP (shop Wi-Fi)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								className: "ed-input",
								value: printer.lanHost,
								onChange: (e) => patch(printer.id, { lanHost: e.target.value }),
								placeholder: "192.168.1.50",
								inputMode: "decimal",
								autoComplete: "off"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Protocol" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "ed-input",
								value: printer.lanProtocol === "https" ? "https" : "http",
								onChange: (e) => {
									const https = e.target.value === "https";
									patch(printer.id, {
										lanProtocol: https ? "https" : "http",
										lanPort: https ? 8043 : 8008
									});
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "http",
									children: "HTTP · 8008"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "https",
									children: "HTTPS · 8043"
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Test print from this tablet on shop Wi-Fi. Completes never wait on a print failure. Hardware buy is still on hold — save the IP whenever the Epson is on the counter."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "pay-opt",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: printer.enabled,
							onChange: (e) => patch(printer.id, { enabled: e.target.checked })
						}), "Enabled"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "printer-copies",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "pay-opt",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: printer.customerCopy,
									onChange: (e) => patch(printer.id, { customerCopy: e.target.checked })
								}), "Customer copy"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "pay-opt",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: printer.storeCopy,
									onChange: (e) => patch(printer.id, { storeCopy: e.target.checked })
								}), "Store copy"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Copies of each" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									className: "ed-input",
									value: printer.copies,
									onChange: (e) => patch(printer.id, { copies: Number(e.target.value) }),
									children: [
										1,
										2,
										3,
										4,
										5
									].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: n,
										children: n
									}, n))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "ed-field",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Paper" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									className: "ed-input",
									value: printer.paper,
									onChange: (e) => patch(printer.id, { paper: e.target.value }),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "58mm",
										children: "58 mm"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "80mm",
										children: "80 mm"
									})]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "printer-actions",
						children: [
							bt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "ed-btn",
								disabled: Boolean(busyId),
								onClick: () => void pair(printer),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bluetooth, {
									size: 16,
									strokeWidth: 2.2
								}), printer.bluetoothId ? "Re-pair Bluetooth fallback" : "Pair Bluetooth fallback"]
							}) : null,
							bt && printer.bluetoothId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ed-btn",
								disabled: Boolean(busyId),
								onClick: () => void checkConnection(printer),
								children: "Check Bluetooth"
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ed-btn",
								disabled: Boolean(busyId) || busyId === printer.id,
								onClick: () => void testPrint(printer),
								children: "Test print"
							})
						]
					})
				]
			}, printer.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "receipt-previews",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "slip",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "slip-kind",
						children: "Customer copy"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { children: customerPreview })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "slip",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "slip-kind",
						children: "Store copy"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { children: storePreview })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn-print",
				disabled: saving,
				onClick: onSave,
				children: saving ? "Saving…" : "Save printer setup"
			})
		]
	});
}
//#endregion
//#region src/components/zone-map.tsx
function ZoneMap({ cells, onChange }) {
	const host = (0, import_react.useRef)(null);
	const mapRef = (0, import_react.useRef)(null);
	const layerRef = (0, import_react.useRef)(null);
	const cellsRef = (0, import_react.useRef)(new Set(cells));
	const modeRef = (0, import_react.useRef)("paint");
	const drawing = (0, import_react.useRef)(false);
	const [mode, setMode] = (0, import_react.useState)("paint");
	const [brush, setBrush] = (0, import_react.useState)(1);
	const [query, setQuery] = (0, import_react.useState)("");
	const [lookup, setLookup] = (0, import_react.useState)("");
	const brushRef = (0, import_react.useRef)(1);
	(0, import_react.useEffect)(() => {
		cellsRef.current = new Set(cells);
		const layer = layerRef.current;
		if (layer && mapRef.current) import("../_libs/leaflet.mjs").then((n) => /* @__PURE__ */ __toESM(n.t(), 1)).then((mod) => drawCells(mod, layer, cellsRef.current, tomatoColor()));
	}, [cells]);
	(0, import_react.useEffect)(() => {
		modeRef.current = mode;
	}, [mode]);
	(0, import_react.useEffect)(() => {
		brushRef.current = brush;
	}, [brush]);
	(0, import_react.useEffect)(() => {
		if (!host.current || mapRef.current) return;
		let dead = false;
		import("../_libs/leaflet.mjs").then((n) => /* @__PURE__ */ __toESM(n.t(), 1)).then((L) => {
			if (dead || !host.current) return;
			const map = L.map(host.current, { zoomControl: true }).setView(MAP_CENTER, 12);
			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				attribution: "&copy; OpenStreetMap",
				maxZoom: 18
			}).addTo(map);
			const layer = L.layerGroup().addTo(map);
			mapRef.current = map;
			layerRef.current = layer;
			drawCells(L, layer, cellsRef.current, tomatoColor());
			const apply = (lat, lng) => {
				const keys = paintAround(lat, lng, brushRef.current);
				const set = cellsRef.current;
				let changed = false;
				for (const k of keys) if (modeRef.current === "paint") {
					if (!set.has(k)) {
						set.add(k);
						changed = true;
					}
				} else if (set.delete(k)) changed = true;
				if (changed) {
					drawCells(L, layer, set, tomatoColor());
					onChange([...set]);
				}
			};
			map.on("mousedown", (e) => {
				drawing.current = true;
				map.dragging.disable();
				apply(e.latlng.lat, e.latlng.lng);
			});
			map.on("click", (e) => {
				apply(e.latlng.lat, e.latlng.lng);
			});
			map.on("mousemove", (e) => {
				if (!drawing.current) return;
				apply(e.latlng.lat, e.latlng.lng);
			});
			const stop = () => {
				drawing.current = false;
				map.dragging.enable();
			};
			map.on("mouseup", stop);
			map.on("mouseout", stop);
		});
		return () => {
			dead = true;
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, []);
	async function lookupAddress() {
		setLookup("Looking up…");
		try {
			const r = await checkDeliveryAddress({ data: { query } });
			if (!r.found) {
				setLookup("No match. Try a street name in Egg Harbor Township.");
				return;
			}
			setLookup(r.deliverable ? `Inside the painted zone — ${r.label}` : `Outside the painted zone — ${r.label}`);
			if (r.lat != null && r.lng != null) mapRef.current?.setView([r.lat, r.lng], 16);
		} catch (e) {
			setLookup(e instanceof Error ? e.message : "Lookup failed");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "zone-wrap",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "zone-tools",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "seg",
						role: "group",
						"aria-label": "Paint mode",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"data-on": mode === "paint",
							onClick: () => setMode("paint"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Paintbrush, { size: 14 }), "Paint"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							"data-on": mode === "erase",
							onClick: () => setMode("erase"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eraser, { size: 14 }), "Erase"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "seg",
						role: "group",
						"aria-label": "Brush size",
						children: [
							0,
							1,
							2
						].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-on": brush === n,
							onClick: () => setBrush(n),
							children: n === 0 ? "Fine" : n === 1 ? "Medium" : "Wide"
						}, n))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "ed-btn ed-btn-quiet",
						onClick: () => {
							cellsRef.current = /* @__PURE__ */ new Set();
							if (layerRef.current) layerRef.current.clearLayers();
							onChange([]);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 }), "Clear"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "zone-count",
						children: [cells.length, " blocks covered"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: host,
				className: "zone-map",
				role: "application",
				"aria-label": "Delivery zone map"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "zone-lookup",
				onSubmit: (e) => {
					e.preventDefault();
					lookupAddress();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "ed-input",
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Check a street in Egg Harbor Township"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "ed-btn",
						children: "Check"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "ed-btn ed-btn-quiet",
						href: googleMapsSearchUrl(query || "Egg Harbor Township NJ"),
						target: "_blank",
						rel: "noreferrer",
						children: "Google Maps"
					})
				]
			}),
			lookup ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "zone-lookup-msg",
				children: lookup
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "ed-sub",
				children: "Drag to paint streets you deliver. Checkout only accepts addresses inside the red blocks. Open Google Maps to confirm a street, then paint it here."
			})
		]
	});
}
function tomatoColor() {
	if (typeof window === "undefined") return "currentColor";
	return getComputedStyle(document.documentElement).getPropertyValue("--color-tomato").trim() || "currentColor";
}
function drawCells(L, layer, cells, color) {
	layer.clearLayers();
	for (const key of cells) {
		const r = cellRect(key);
		L.rectangle([[r.south, r.west], [r.north, r.east]], {
			color,
			weight: 1,
			fillColor: color,
			fillOpacity: .35
		}).addTo(layer);
	}
}
//#endregion
//#region src/routes/admin/menu.tsx
var TABS = [
	"menu",
	"cards",
	"hours",
	"payments",
	"tax",
	"delivery",
	"printers"
];
var Route$9 = createFileRoute("/admin/menu")({
	validateSearch: (search) => {
		const raw = typeof search.tab === "string" ? search.tab : void 0;
		const tab = raw === "vacation" ? "hours" : raw;
		const ok = tab && TABS.includes(tab) ? tab : void 0;
		return ok ? { tab: ok } : {};
	},
	component: AdminMenu
});
function AdminMenu() {
	const { tab: wanted } = Route$9.useSearch();
	const tab = wanted ?? "menu";
	const [msg, setMsg] = (0, import_react.useState)("");
	const [settings, setSettings] = (0, import_react.useState)(null);
	const [printers, setPrinters] = (0, import_react.useState)([]);
	const [receipt, setReceipt] = (0, import_react.useState)(DEFAULT_RECEIPT_OPTIONS);
	const [printerStamp, setPrinterStamp] = (0, import_react.useState)("");
	const [cells, setCells] = (0, import_react.useState)([]);
	const [restaurant, setRestaurant] = (0, import_react.useState)(null);
	const { toast, flashOk, flashFail } = useSaveFlash();
	const navigate = Route$9.useNavigate();
	(0, import_react.useEffect)(() => {
		useMenuStore.persist.rehydrate();
		getAdminShop().then((d) => {
			useMenuStore.getState().replaceAll({
				restaurant: d.restaurant,
				footer: d.footer,
				categories: d.categories,
				cardTextSize: d.settings.cardTextSize,
				cardTextColor: d.settings.cardTextColor,
				cardDescColor: d.settings.cardDescColor,
				cardPriceColor: d.settings.cardPriceColor,
				cardSize: d.settings.cardSize,
				cardBg: d.settings.cardBg,
				tagline: d.settings.tagline,
				showMark: d.settings.showMark
			});
			setSettings(d.settings);
			setRestaurant(d.restaurant);
			setPrinters(d.printers);
			setReceipt(d.receiptOptions);
			setPrinterStamp(JSON.stringify({
				printers: d.printers,
				receipt: d.receiptOptions
			}));
			setCells(d.cells);
		});
	}, []);
	function go(next) {
		navigate({
			to: "/admin/menu",
			search: next === "menu" ? {} : { tab: next }
		});
	}
	function saveOps(data, ok = "Saved.") {
		saveShopSettings({ data }).then(() => {
			setMsg(ok);
			flashOk(true);
		}).catch((e) => {
			const text = e instanceof Error ? e.message : "Could not save";
			setMsg(text);
			flashFail(text);
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "menu-ops-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveToast, { toast }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "page-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Menu & shop details" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "Menu, cards, hours, payments, tax, delivery, and printers — each tab saves on its own."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "seg center-tabs menu-ops-tabs",
						role: "tablist",
						"aria-label": "Menu and shop details",
						children: [
							["menu", "Menu"],
							["cards", "Card Editor"],
							["hours", "Hours"],
							["payments", "Payments"],
							["tax", "Tax"],
							["delivery", "Delivery"],
							["printers", "Printers"]
						].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							"aria-selected": tab === id,
							"data-on": tab === id,
							onClick: () => go(id),
							children: label
						}, id))
					})
				]
			}),
			tab === "menu" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "admin-menu-grid",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "page-card",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn-print",
							onClick: () => {
								const snap = useMenuStore.getState();
								const nextRestaurant = {
									...snap.restaurant,
									shortName: snap.restaurant.name
								};
								Promise.all([saveShopMenu({ data: {
									restaurant: nextRestaurant,
									footer: snap.footer,
									categories: snap.categories
								} }), saveShopSettings({ data: {
									tagline: snap.tagline,
									showMark: snap.showMark,
									toppingPriceSm: settings?.toppingPriceSm,
									toppingPriceMd: settings?.toppingPriceMd,
									toppingPriceLg: settings?.toppingPriceLg,
									toppingPriceXl: settings?.toppingPriceXl
								} })]).then(() => {
									setRestaurant(nextRestaurant);
									setMsg("Prices and shop details are live.");
									flashOk(true);
								}).catch((e) => setMsg(e instanceof Error ? e.message : "Could not save"));
							},
							children: "Save all"
						}), msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "ed-sub",
							children: msg
						}) : null]
					}),
					settings ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToppingPricePanel, {
						settings,
						setSettings
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuEditor, {})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "preview-wrap",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MenuBoard, {
						paper: "letter",
						showDesc: false
					})
				})]
			}) : null,
			tab !== "menu" && tab !== "cards" && !settings ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "page-skel",
				children: "Loading…"
			}) : null,
			tab === "cards" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardEditor, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-print",
						onClick: () => {
							const snap = useMenuStore.getState();
							saveOps({
								cardTextSize: snap.cardTextSize,
								cardTextColor: snap.cardTextColor,
								cardDescColor: snap.cardDescColor,
								cardPriceColor: snap.cardPriceColor,
								cardSize: snap.cardSize,
								cardBg: snap.cardBg
							}, "Card style is live.");
						},
						children: "Save cards"
					}),
					msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: msg
					}) : null
				]
			}) : null,
			tab === "hours" && settings ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HoursPanel, {
						settings,
						setSettings
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VacationPanel, {
						settings,
						setSettings
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-print",
						onClick: () => saveOps({
							weeklyHours: settings.weeklyHours,
							prepMinutes: settings.prepMinutes,
							deliveryMinutes: settings.deliveryMinutes,
							vacationOn: settings.vacationOn,
							vacationMessage: settings.vacationMessage,
							vacationUntil: settings.vacationUntil
						}, "Hours and vacation are live."),
						children: "Save hours"
					}),
					msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: msg
					}) : null
				]
			}) : null,
			tab === "payments" && settings ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentsPanel, {
						settings,
						setSettings
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-print",
						onClick: () => saveOps({
							paymentPlaceholder: settings.paymentPlaceholder,
							guestCardRequired: settings.guestCardRequired
						}, "Payment settings are live."),
						children: "Save payments"
					}),
					msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: msg
					}) : null
				]
			}) : null,
			tab === "tax" && settings ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaxPanel, {
						settings,
						setSettings
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-print",
						onClick: () => saveOps({ taxRate: settings.taxRate }, "Tax rate is live."),
						children: "Save tax"
					}),
					msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: msg
					}) : null
				]
			}) : null,
			tab === "delivery" && settings ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeliveryPanel, {
						settings,
						setSettings
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "page-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Delivery zone" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "ed-sub",
								children: "Paint the blocks you cover. Customer checkout geocodes the address and only allows delivery inside the painted area. Use the search to confirm a street, then paint it."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoneMap, {
								cells,
								onChange: setCells
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-print",
						onClick: () => {
							Promise.all([saveShopSettings({ data: {
								minOrderDelivery: settings.minOrderDelivery,
								deliveryFee: settings.deliveryFee,
								deliveryMinutes: settings.deliveryMinutes
							} }), saveDeliveryZone({ data: { cells } })]).then(([, zone]) => {
								setSettings({
									...settings,
									hasZones: cells.length > 0
								});
								setMsg(`Delivery settings are live. Saved ${zone.count} blocks.`);
								flashOk(true);
							}).catch((e) => {
								const text = e instanceof Error ? e.message : "Could not save";
								setMsg(text);
								flashFail(text);
							});
						},
						children: "Save delivery"
					}),
					msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: msg
					}) : null
				]
			}) : null,
			tab === "printers" && settings && restaurant ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "settings-page",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrinterSetup, {
					printers,
					setPrinters,
					receipt,
					setReceipt,
					restaurant,
					taxRate: settings.taxRate,
					onSave: () => {
						const stamp = JSON.stringify({
							printers,
							receipt
						});
						if (stamp === printerStamp) {
							flashOk(false);
							return;
						}
						saveShopSettings({ data: {
							printers,
							receiptOptions: receipt
						} }).then(() => {
							setPrinterStamp(stamp);
							flashOk(true);
							setMsg("Printer setup is live.");
						}).catch((e) => flashFail(e instanceof Error ? e.message : "Printers were not saved."));
					}
				}), msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: msg
				}) : null]
			}) : null
		]
	});
}
//#endregion
//#region src/routes/admin/messages.tsx
var Route$8 = createFileRoute("/admin/messages")({ component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
	to: "/admin/center",
	search: { tab: "messages" }
}) });
//#endregion
//#region src/routes/admin/orders.tsx
var Route$7 = createFileRoute("/admin/orders")({ component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
	to: "/admin/center",
	search: { tab: "orders" }
}) });
//#endregion
//#region src/data/patches.ts
var PATCHES = [
	{
		id: "2026-09-11-app-transition",
		date: "September 11, 2026",
		title: "South End on the home screen, order alerts, LAN print",
		added: [
			"Add to Home Screen is named South End Pizza — cream theme, full icon set, not Grok App.",
			"After checkout or install, Enable order alerts for Ready / out-for-delivery pings. iPhone needs the home-screen icon first.",
			"Printer settings take a shop Wi-Fi IP and Test print over Epson ePOS. Bluetooth is a labeled fallback and hides where the browser cannot pair. Completes never wait on print."
		]
	},
	{
		id: "2026-09-11-update-auth-isolation-continuity",
		date: "September 11, 2026",
		title: "Wrong password stays on sign-in",
		added: ["A bad password stays on the sign-in card with a clear error and never opens a desk. Signed-in checkout keeps the account through Review. Call and Chat sit above the last menu cards, category arrows hug the phone edge, and POS shows the account menu."]
	},
	{
		id: "2026-09-11-followup-account-load",
		date: "September 11, 2026",
		title: "Desk account load no longer hangs",
		added: ["Admin pages load from a fast account read — no schema work on the way in. Guest /admin returns to the desk after sign-in. Category chips follow the section on screen, and Call/Chat sit clear of the last menu cards."]
	},
	{
		id: "2026-09-11-admin-mode-per-account",
		date: "September 11, 2026",
		title: "Admin mode per account",
		added: ["Each teammate uses their own login. Allowed accounts turn Admin mode on from the name menu. Guests cannot. Shared diagnostic desk login is no longer the path."]
	},
	{
		id: "2026-09-11-category-carousel",
		date: "September 11, 2026",
		title: "Category rail sticks, centers, and pulses",
		added: ["Phone arrows sit flush on the category rail. Search stays with the sticky pills. The active category slides to the middle as you browse, and the arrows pulse when you tap them."]
	},
	{
		id: "2026-09-11-staff-admin-login-column",
		date: "September 11, 2026",
		title: "Desk login toggle no longer 500s",
		added: ["Bot access Diagnostic Admin login writes a real column on first load. Security summary stays 200 even if the column was missing. The toggle still starts off."]
	},
	{
		id: "2026-09-11-category-headers",
		date: "September 11, 2026",
		title: "Bigger category names, no section blurbs",
		added: ["Menu sections are the category name only — larger and heavier. The extra line under Wings, Pizza, and the rest is gone. Item cards still show their own copy."]
	},
	{
		id: "2026-09-11-pizza-account-loader",
		date: "September 11, 2026",
		title: "Pepperoni pizza while your account connects",
		added: ["Sign-in and the header chip spin a pepperoni pie while the shop is connecting your account. It clears as soon as you are in."]
	},
	{
		id: "2026-09-11-bugfix-desk-wings-pos",
		date: "September 11, 2026",
		title: "Diagnostic desk, wing tens, checkout and POS polish",
		added: [
			"Diagnostic Admin login is a Bot access toggle plus a host flag. Off clears the desk password. Bots stay as they are.",
			"Complete still toasts on the Open board. Accept turns off after a ticket is Accepted. Wings sell in tens. Guest checkout no longer jumps to a leftover account.",
			"Financials Collected skips unpaid card tickets. Today uses New Jersey time. Kitchen notes stay on the device until you place the order."
		]
	},
	{
		id: "2026-09-11-slice-browse-wings-price",
		date: "September 11, 2026",
		title: "Slice-style menu, live wing dips, tighter phone bar",
		added: [
			"The menu is one long page. Sticky category pills scroll you to each section and follow as you browse.",
			"Wing extra Ranch / Blue cheese prices come from the menu editor (per 2 cups). Accept cards and bot tickets show sauce, dips, notes, and the money stack.",
			"On a phone the title bar is a single line — South End Pizza, icon cart, no POS for guests — and the grid stays two cards wide."
		]
	},
	{
		id: "2026-09-11-complete-toast-wings-guest",
		date: "September 11, 2026",
		title: "Completed toast, wings builder, guest checkout",
		added: [
			"Complete uses the same staff toast as Accept — ticket, total, and tip only — below the POS tabs.",
			"Fresh Wings require sauce and included dips. Extra dips sell in 2-cup sets at $1.50.",
			"Guests never see POS. Pickup needs name and phone. Card is a notice. Resume or start fresh on a leftover bag."
		]
	},
	{
		id: "2026-09-10-email-otp-resend",
		date: "September 10, 2026",
		title: "Email signup codes via Resend",
		added: ["Email create-account and unverified sign-in ask for a 6-digit inbox code. Phone, Google, X, and the desk Admin skip it.", "Password reset actually emails the code when Resend is configured. Preview still shows the code on screen."]
	},
	{
		id: "2026-09-10-pos-complete-stay-open",
		date: "September 10, 2026",
		title: "Complete closes the ticket and stays on Open",
		added: ["Marking a ticket Completed saves, closes the popup, and keeps the Open tab — no jump to history.", "Staff toast is ticket number, total, and tip only. Last ticket completed shows You're caught up."]
	},
	{
		id: "2026-09-10-style-custom-bots",
		date: "September 10, 2026",
		title: "Style bot + custom bot minting",
		added: ["Admin → Bot access includes a Style preset (menu/health read) and a New Customer preset.", "Custom mode lets you mint any future bot by name and role without another code drop."]
	},
	{
		id: "2026-09-10-admin-totp-toggle",
		date: "September 10, 2026",
		title: "Admin authenticator is optional",
		added: ["Admin can open the desk without an authenticator. Require it anytime under Admin → Settings → Desk security."]
	},
	{
		id: "2026-09-10-security-bot-access",
		date: "September 10, 2026",
		title: "Desk security and bot access",
		added: [
			"Shop Admin password lives only in host secrets now.",
			"Live card capture is frozen — checkout is cash or pay at pickup until a real processor is wired.",
			"Bots get their own tokens under Admin → Bot access, with least-privilege scopes and a one-time copy."
		]
	},
	{
		id: "2026-09-10-pos-accept-queue",
		date: "September 10, 2026",
		title: "POS accept queue is staff-safe",
		added: ["Incoming tickets line up oldest first, Accept can only fire once, and the board shows a ticket number confirmation.", "Staff account load no longer dies on a duplicate profile row."]
	},
	{
		id: "2026-09-10-admin-sign-out",
		date: "September 10, 2026",
		title: "Admin can sign out",
		added: ["Signing out of the Admin desk login now ends the shop session instead of leaving you signed in."]
	},
	{
		id: "2026-09-10-login-popup-origin",
		date: "September 10, 2026",
		title: "A ticket-style sign-in card",
		added: ["Sign in is a shop ticket over the menu, with Google and X marked clearly.", "Admin, Google, and X work on the published GitHub live shop, not only this preview."]
	},
	{
		id: "2026-09-10-staff-admin",
		date: "September 10, 2026",
		title: "Shop admin sign-in",
		added: ["Sign in with username Admin to open POS, the menu editor, and the rest of the shop desk."]
	},
	{
		id: "2026-09-10-guest-header-align",
		date: "September 10, 2026",
		title: "A cleaner guest title bar",
		added: ["Help and Download App stay in the signed-in name menu, not on the guest title bar.", "The buffalo mark is the same height as Sign in and Cart, on one line."]
	},
	{
		id: "2026-09-10-southend-app-address",
		date: "September 10, 2026",
		title: "SouthEnd app, saved address, and a cleaner pizza builder",
		added: [
			"Account details now stores a delivery street, city, and ZIP, and checkout fills them in.",
			"Summary dropped the extra jump buttons — the tabs already cover details, security, and rewards.",
			"Make it yours shows the pie photo and description. Extra toppings are tap chips; half sides only appear once a topping is on.",
			"Menu photos fill the card edge to edge. Category arrows wrap from the last chip back to the first.",
			"Download App in the name menu installs the shop app with the buffalo mark.",
			"Sign-in goes straight to the menu instead of waiting on shop setup, so the live app no longer hangs after login."
		]
	},
	{
		id: "2026-09-10-account-tabs-invites",
		date: "September 10, 2026",
		title: "Account tabs, invites, and a larger title mark",
		added: [
			"Help and Sign out sit in the name menu. POS and Cart match the larger title mark.",
			"Your account opens on a summary, with tabs for details, security, and rewards.",
			"Rewards shows point history and a friend invite with a copyable link and QR code."
		]
	},
	{
		id: "2026-09-10-header-photo-off",
		date: "September 10, 2026",
		title: "Name in the title bar, photos optional",
		added: ["Your name in the title bar opens Account. Admins get a dropdown for Account and Admin.", "Menu photos can be turned off per item so the card shrinks to text."]
	},
	{
		id: "2026-09-10-item-photos",
		date: "September 10, 2026",
		title: "Menu item photos",
		added: ["Every menu card now shows a food photo that matches the item name and description.", "Shop-uploaded photos still replace the placeholder. Remove photo to go back to the match."]
	},
	{
		id: "2026-09-10-search-scroll",
		date: "September 10, 2026",
		title: "Search in the category row",
		added: ["Order is off the customer title bar. The shop mark still opens the menu.", "Search is a short chip that scrolls with Pizza, Gourmet, and the rest, and grows when you tap it."]
	},
	{
		id: "2026-09-10-card-editor",
		date: "September 10, 2026",
		title: "Card Editor tab",
		added: [
			"Card Editor is its own tab in Menu & Shop Details.",
			"Cards can change size and paper color. Name, description, and price still have their own inks.",
			"Large type no longer spills over the photo or stacks on the price."
		]
	},
	{
		id: "2026-09-10-cart-pop-card-ink",
		date: "September 10, 2026",
		title: "Cart popup, Top on scroll, and card ink",
		added: [
			"Cart in the title bar opens Your order as a popup. Checkout still glows.",
			"The Top button sits with Call and Chat only after the title bar scrolls off the screen.",
			"Shop details can color menu card names, descriptions, and prices separately, with more inks."
		]
	},
	{
		id: "2026-09-10-admin-cart-dock",
		date: "September 10, 2026",
		title: "Admin home, checkout glow, and back to top",
		added: [
			"Admin in the title bar always opens Menu & Shop Details on the Menu tab.",
			"The admin menu lists Menu & Shop Details first, then Customer Center.",
			"Cart in the title bar pulses Checkout. The sticky bar says Checkout, and a Top button sits with Call and Chat."
		]
	},
	{
		id: "2026-09-10-pos-popup-hours",
		date: "September 10, 2026",
		title: "POS ticket popup, hours, and Admin home",
		added: [
			"POS opens a ticket popup with status, items, reprint, and profile — no inline dropdown.",
			"Vacation lives on the Hours tab in Menu & Shop Details.",
			"Admin in the title bar opens Menu & Shop Details. Desk is out of the admin menu."
		]
	},
	{
		id: "2026-09-10-search-guest-card",
		date: "September 10, 2026",
		title: "Carousel search, guest card, quieter home",
		added: [
			"Menu search sits in the category carousel. Picking a result opens that item’s confirm popup.",
			"Payments can require card for guest checkout. Signed-in customers still pay at pickup or cash.",
			"The buffalo mark stays in the title bar and is off the main menu page."
		]
	},
	{
		id: "2026-09-10-menu-ops-home",
		date: "September 10, 2026",
		title: "Sizes, printers, and zones in Menu & Shop Details",
		added: [
			"Pizza sizes are typed on each item in Menu & Shop Details. XL is offered when you enter an XL price — no settings toggle.",
			"Printer setup moved into a Printers tab, with Diagnose, Check connection, and a troubleshooting list.",
			"Delivery zones paint on the Delivery tab next to fee and minimum.",
			"Background is now Settings and sits at the bottom of the admin menu."
		]
	},
	{
		id: "2026-09-09-guest-points-chat",
		date: "September 9, 2026",
		title: "Guest checkout, rewards hub, and shop tabs",
		added: [
			"Menu & Shop Details condiments have a quantity cap guests can add (1–9).",
			"Cook notes stay focused while typing — the comment field no longer deselects.",
			"New accounts require a password and a matching confirm password.",
			"Checkout works as a guest with a name and phone, or sign in as usual.",
			"Rewards live in Customer center, with earn/redeem preview chips and wallet tools.",
			"Website edit tools left Settings. Tagline and buffalo mark sit in Shop details.",
			"Hours, vacation, payments, tax, and delivery are their own tabs in Menu & Shop Details.",
			"Menu search no longer flickers after a hit — suggestions sit in a stable slot.",
			"Chat splits sent messages from the pad where you type a new one.",
			"Item photos show the full picture instead of a tight crop, with a sharper upload."
		]
	},
	{
		id: "2026-09-09-condiments-confirm",
		date: "September 9, 2026",
		title: "Condiments, item notes, and steadier return",
		added: [
			"Menu & Shop Details can attach condiments to any item, with an add price and an extra price.",
			"Choosing an item opens a confirm popup: size, condiments, extra portions, and a cook note.",
			"Coming back to the shop retries a dropped connection instead of showing Failed to fetch.",
			"POS tickets, menu editor sections, and order-history trays start closed. Opening one closes the others."
		]
	},
	{
		id: "2026-09-08-card-type",
		date: "September 8, 2026",
		title: "Menu card text size and color",
		added: [
			"Menu & Shop Details can set the text size and color for every customer menu card.",
			"Small, Medium, Large, and Extra large, plus ink, tomato, deep red, or a custom color.",
			"Save all writes card type with prices and shop details. A live preview sits in Shop details."
		]
	},
	{
		id: "2026-09-08-photo-cards",
		date: "September 8, 2026",
		title: "Photo cards, flush tabs, and a steadier backdrop",
		added: [
			"Category tabs pin flush to the top of the screen after the title bar scrolls away.",
			"The page keeps a stable scrollbar gutter so short menu sections no longer shove the layout.",
			"Menu & Shop Details can attach a photo to each item. Save all writes those photos to the live menu.",
			"Item cards are the button: photo in the top 75%, name and price in the lower 25%.",
			"Closing a chat no longer posts “this chat has concluded.” The customer window just opens a fresh thread.",
			"POS Open and Complete sit beside the Menu drawer on phone and desktop.",
			"The shop backdrop covers the visitor’s window, keeps the original photo shape, and no longer drifts when scrolling or resizing."
		]
	},
	{
		id: "2026-09-08-ticket-desk",
		date: "September 8, 2026",
		title: "Ticket numbers, POS desk, and tighter admin chrome",
		added: [
			"Tickets now use a 6-digit number, starting at 000001.",
			"Customer chat says Send, and it stays off until an active order is picked.",
			"POS splits Open and Complete next to the admin menu, drops the description card, and adds a Profile button beside Reprint.",
			"Menu & Shop Details save is Save all. Shop name stays in the title bar, not in shop details.",
			"Category tabs stick under the header as a solid bar while you scroll.",
			"Customer order history groups by date in expandable trays.",
			"Admin accounts no longer see Order and Help in the title bar."
		]
	},
	{
		id: "2026-09-08-desk-polish",
		date: "September 8, 2026",
		title: "POS chat pings, full backdrop, seasonal effects",
		added: [
			"Admin chat no longer shows canned reply chips.",
			"If a guest chats about a live ticket, that row on POS lights up with a message notice.",
			"Customer chat only lists active tickets in About this order — completed and canceled stay off the list.",
			"Admin drawer now says Menu & Shop Details. Short name is gone; one save writes prices and shop details together.",
			"Shop backdrop fills the whole screen, faded so the menu stays readable.",
			"Background tab can turn on quiet holiday effects: New Year's, Christmas, Halloween, 4th of July, Valentine's, and St. Patrick's."
		]
	},
	{
		id: "2026-09-08-customer-center",
		date: "September 8, 2026",
		title: "Customer center, cash, and chat tools",
		added: [
			"Delivery checkout says Cash instead of pay the driver.",
			"Messages, orders, and the customer book live in one Customer center.",
			"Admin chat can flag, mute the pip, ban, delete a line or the whole thread, and keep a staff note.",
			"Quick replies, timestamps, and Enter-to-send on shop chats.",
			"Old Messages, Orders, and Customers links open the same hub.",
			"When the shop marks a chat complete, the customer window goes blank instead of jumping back to an older thread. Start a new chat stays on a fresh conversation."
		]
	},
	{
		id: "2026-09-08-checkout-ops",
		date: "September 8, 2026",
		title: "Checkout, scheduled orders, and the kitchen queue",
		added: [
			"Remove items from the bag on checkout, or step the quantity down.",
			"Category skip buttons move one section at a time, with a clear background.",
			"Customer service order picker shows the date and time the ticket was placed.",
			"Reset password emails a 60-second one-time code before a new password can be set.",
			"Schedule pickup or delivery for a later date during checkout.",
			"Call and Chat stay pinned in the bottom-right corner on the storefront.",
			"Today, this week, and tips moved into a rebuilt Financials page.",
			"POS ticket search is a floating button. Incoming orders pop with an alarm and a queue, and the alarm file is on Background."
		]
	},
	{
		id: "2026-09-08-pos-drawer",
		date: "September 8, 2026",
		title: "POS station, drawer, and account password",
		added: [
			"Category rail skip buttons jump two sections left or right.",
			"Admin drawer covers the title bar so Menu stays on top.",
			"Reward points stay on Your account — not the header or storefront.",
			"Customers can set a new password on Your account with the email on file.",
			"Background tab uploads the website icon as well as the faded backdrop.",
			"POS uses Placed, Accepted (yellow), and Completed (green). Add or remove lines, search the menu, and reprint. The title bar hides in POS.",
			"Admin drawer starts with Main menu and ends with Log out."
		]
	},
	{
		id: "2026-09-08-admin",
		date: "September 8, 2026",
		title: "Admin drawer, POS in the title bar, custom backdrop",
		added: [
			"POS sits in the title bar for admin accounts, on every shop page.",
			"Customers, financials, and shop settings are their own admin pages — no more nested settings tabs.",
			"Admin categories live in a retractable drawer, closed by default, listed A–Z.",
			"Background page to upload a custom faded shop mark, or restore the buffalo-and-chicken icon."
		]
	},
	{
		id: "2026-09-08",
		date: "September 8, 2026",
		title: "Search, recovery, and kitchen notes",
		added: [
			"Backdrop is the buffalo-and-chicken icon, smaller and higher on the screen, with the shop-name engraving removed.",
			"Forgot password on sign-in. Recover with the email or phone on the account plus the phone or name on file.",
			"Reorder from account history, including kitchen notes and cook comments.",
			"Storefront and header stay a readable width on large screens instead of stretching edge to edge.",
			"Search cell before Pizza, with suggestions ranked by name, description, then category.",
			"Pickup orders require a name at confirmation.",
			"Admins can remove a ticket from the system and ban an account.",
			"Marking a chat completed tells the customer it has concluded and starts them on a fresh thread.",
			"Cook comments under each item, printed large on the store copy under that line.",
			"Half-and-half split-this-pie toggle taken off the pizza builder."
		]
	},
	{
		id: "2026-09-07",
		date: "September 7, 2026",
		title: "Pizza builder, extra large, and shop notices",
		added: [
			"Customize popup on every pizza — extra toppings, half-and-half, and a live price.",
			"Topping charges follow pizza size (small through extra large). Half toppings are half price.",
			"Admin toggle to offer extra large pies, with a price field you set yourself (added on top of large).",
			"Admin message pip moved to the Admin tab. Opening a thread marks it read and drops the count.",
			"This Patches tab, listing what landed in the shop.",
			"Stationary faded buffalo-and-chicken backdrop with the white studio background removed."
		]
	},
	{
		id: "2026-09-06",
		date: "September 6, 2026",
		title: "Store flow, tips, and customer book",
		added: [
			"Pay first, kitchen accepts on the tablet, then the receipt prints.",
			"Sign-in with email, Google, or X. Phone maps to a shop account. App TOTP for 2FA.",
			"Tips at 10%, 15%, 20%, or a custom amount. New Jersey tips stay off the sales-tax line.",
			"Customer notes print in a NOTES block under the receipt header.",
			"Customer database in Settings, with order history and the option to grant admin.",
			"Help chat for customers, plus a call-the-shop line. POS lists tickets in time order."
		]
	},
	{
		id: "2026-09-05",
		date: "September 5, 2026",
		title: "Shop desk and wall menu",
		added: [
			"Live storefront for pickup and painted delivery zones.",
			"Admin menu editor and printable wall menu.",
			"Settings for tax, hours, delivery, website copy, financials, and rewards.",
			"Bluetooth printer setup with customer and store copies.",
			"Payment processor panel (under construction)."
		]
	}
];
//#endregion
//#region src/routes/admin/patches.tsx
var Route$6 = createFileRoute("/admin/patches")({ component: AdminPatches });
function AdminPatches() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "patches-page",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "page-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "shop-brand-kicker",
					children: "Admin"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Patches" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: "What landed in the shop, newest first. This is the running log of features we added."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "patch-list",
			children: PATCHES.map((patch) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "page-card patch-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "shop-brand-kicker",
						children: patch.date
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: patch.title }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: patch.added.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: line }, line)) })
				]
			}, patch.id))
		})]
	});
}
//#endregion
//#region src/routes/admin/pos.tsx
var Route$5 = createFileRoute("/admin/pos")({
	validateSearch: (search) => {
		const ticket = typeof search.ticket === "string" ? search.ticket : void 0;
		return ticket ? { ticket } : {};
	},
	component: AdminPos
});
var POS_STATUSES = [
	{
		id: "placed",
		label: "Placed"
	},
	{
		id: "accepted",
		label: "Accepted"
	},
	{
		id: "completed",
		label: "Completed"
	}
];
function posBucket(status) {
	if (status === "completed") return "completed";
	if (status === "placed" || status === "awaiting_payment" || status === "canceled") return "placed";
	return "accepted";
}
function posStamp(status) {
	if (status === "awaiting_payment") return {
		tone: "unpaid",
		label: "unpaid"
	};
	if (status === "canceled") return {
		tone: "placed",
		label: "canceled"
	};
	const bucket = posBucket(status);
	return {
		tone: bucket,
		label: bucket
	};
}
function priceNum(p) {
	const n = Number(String(p).replace(/^\$/, ""));
	return Number.isFinite(n) ? n : 0;
}
function ticketWhere(t) {
	return t.fulfillment === "delivery" ? `${t.addressLine}${t.city ? `, ${t.city}` : ""} ${t.zip}`.trim() : "Pickup at 443 Zion Rd";
}
function PosTicketDialog({ ticket, itemQuery, menuHits, busyId, statusBusy, statusError, onClose, onQuery, onStatus, onSaveItems, onReprint }) {
	const titleId = (0, import_react.useId)();
	const panelRef = (0, import_react.useRef)(null);
	const bucket = posBucket(ticket.status);
	const where = ticketWhere(ticket);
	useDialogLock(onClose, panelRef);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pizza-modal-root pos-ticket-root",
		role: "presentation",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "pizza-modal-scrim",
			"aria-label": "Close ticket",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: panelRef,
			className: "pizza-modal pos-ticket-pop",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": titleId,
			tabIndex: -1,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "pizza-modal-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "shop-brand-kicker",
							children: ["Ticket #", formatTicketNo(ticket.ticketNo)]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: titleId,
							children: ticket.customerName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "ed-sub",
							children: [
								ticket.fulfillment === "delivery" ? "Delivery" : ticket.pickupName ? `Pickup · ${ticket.pickupName}` : "Pickup",
								ticket.scheduledFor ? ` · ${formatShopWhen(ticket.scheduledFor)}` : "",
								ticket.customerPhone ? ` · ${ticket.customerPhone}` : ""
							]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-icon-btn",
						"aria-label": "Close ticket",
						onClick: onClose,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							size: 16,
							strokeWidth: 2.2
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
					className: "pos-quick-status",
					role: "group",
					"aria-label": "Ticket status",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Status" }), POS_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-on": bucket === s.id,
						"data-tone": s.id,
						disabled: Boolean(statusBusy) || s.id === "accepted" && (bucket === "accepted" || bucket === "completed") || s.id === bucket && s.id !== "completed",
						onClick: () => onStatus(s.id),
						children: s.id === "completed" && statusBusy === "completed" ? "Completing…" : s.label
					}, s.id))]
				}),
				statusError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "form-error",
					children: statusError
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "cart-lines pos-edit-lines",
					children: ticket.items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						it.name,
						it.size ? ` · ${it.size}` : "",
						it.detail ? ` · ${it.detail}` : "",
						it.comment ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "cook-note",
							children: it.comment
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
							className: "cart-line-price",
							children: formatUsd(it.unitPrice * it.qty)
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "qty-step",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Remove one",
								disabled: ticket.items.length === 1 && it.qty <= 1,
								onClick: () => {
									onSaveItems(ticket.items.map((row, idx) => idx === i ? {
										...row,
										qty: row.qty - 1
									} : row).filter((row) => row.qty > 0));
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
									size: 16,
									strokeWidth: 2.4
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: it.qty }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Add one",
								onClick: () => {
									onSaveItems(ticket.items.map((row, idx) => idx === i ? {
										...row,
										qty: row.qty + 1
									} : row));
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
									size: 16,
									strokeWidth: 2.4
								})
							})
						]
					})] }, `${it.itemId}-${i}`))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "ed-field pos-item-search",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Add an item" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "cat-search",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
							size: 16,
							strokeWidth: 2.2,
							"aria-hidden": true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: itemQuery,
							onChange: (e) => onQuery(e.target.value),
							placeholder: "Search the menu",
							"aria-label": "Search menu items to add",
							autoComplete: "off"
						})]
					})]
				}),
				itemQuery.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "cat-suggest pos-item-hits",
					role: "listbox",
					"aria-label": "Menu items",
					children: menuHits.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "cat-suggest-empty",
						children: [
							"No matches for “",
							itemQuery.trim(),
							"”."
						]
					}) : menuHits.map((hit) => {
						const first = hit.item.prices[0];
						const unit = priceNum(first?.price ?? "0");
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								const add = {
									itemId: hit.item.id ?? hit.item.name,
									categoryId: hit.cat.id,
									name: hit.item.name,
									size: first?.label,
									unitPrice: unit,
									qty: 1
								};
								const existing = ticket.items.findIndex((row) => row.itemId === add.itemId && row.size === add.size && !row.detail && !row.comment);
								onSaveItems(existing >= 0 ? ticket.items.map((row, idx) => idx === existing ? {
									...row,
									qty: row.qty + 1
								} : row) : [...ticket.items, add]);
								onQuery("");
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: hit.item.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
								hit.cat.name,
								first?.label ? ` · ${first.label}` : "",
								" · ",
								formatUsd(unit)
							] })]
						}) }, `${hit.cat.id}-${hit.item.id ?? hit.item.name}`);
					})
				}) : null,
				ticket.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "pos-notes",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Notes" }),
						" ",
						ticket.notes
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "totals",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Subtotal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(ticket.subtotal) })] }),
						ticket.discount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Rewards" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: ["−", formatUsd(ticket.discount)] })] }) : null,
						ticket.deliveryFee ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Delivery" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(ticket.deliveryFee) })] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Tax" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(ticket.tax) })] }),
						ticket.tip ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Tip" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(ticket.tip) })] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "totals-grand",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatUsd(ticket.total) })]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "order-actions pos-ticket-actions",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ed-btn",
							disabled: busyId === ticket.id,
							onClick: onReprint,
							children: busyId === ticket.id ? "Printing…" : "Reprint"
						}),
						ticket.userId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/admin/center",
							search: {
								tab: "customers",
								customer: ticket.userId
							},
							className: "ed-btn",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
								size: 15,
								strokeWidth: 2.2
							}), "Profile"]
						}) : null,
						ticket.chatThreadId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/admin/center",
							search: {
								tab: "messages",
								thread: ticket.chatThreadId
							},
							className: "ed-btn",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
									size: 15,
									strokeWidth: 2.2
								}),
								"Chat",
								ticket.chatUnread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "nav-pip",
									children: ticket.chatUnread > 9 ? "9+" : ticket.chatUnread
								}) : null
							]
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-sub",
					children: ticket.fulfillment === "delivery" ? `Deliver to ${where}` : "Customer pickup at the counter."
				})
			]
		})]
	});
}
function AdminPos() {
	const { ticket } = Route$5.useSearch();
	const [tickets, setTickets] = (0, import_react.useState)([]);
	const [openId, setOpenId] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [query, setQuery] = (0, import_react.useState)(ticket ?? "");
	const [finderOpen, setFinderOpen] = (0, import_react.useState)(false);
	const [itemQuery, setItemQuery] = (0, import_react.useState)("");
	const [categories, setCategories] = (0, import_react.useState)([]);
	const [printers, setPrinters] = (0, import_react.useState)([]);
	const [receipt, setReceipt] = (0, import_react.useState)(DEFAULT_RECEIPT_OPTIONS);
	const [restaurant, setRestaurant] = (0, import_react.useState)(RESTAURANT);
	const [taxRate, setTaxRate] = (0, import_react.useState)(6.625);
	const [busyId, setBusyId] = (0, import_react.useState)("");
	const [statusBusy, setStatusBusy] = (0, import_react.useState)("");
	const [dialogError, setDialogError] = (0, import_react.useState)("");
	const [desk, setDesk] = (0, import_react.useState)("open");
	const [completeToast, setCompleteToast] = (0, import_react.useState)(null);
	const [chromeHost, setChromeHost] = (0, import_react.useState)(null);
	const seenChat = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const primedChat = (0, import_react.useRef)(false);
	const heldAccepted = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const closedByStaff = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	const statusBusyRef = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (!completeToast) return;
		const t = window.setTimeout(() => setCompleteToast(null), POS_TOAST_MS);
		return () => window.clearTimeout(t);
	}, [completeToast]);
	(0, import_react.useEffect)(() => {
		const onAccepted = (event) => {
			const order = event.detail;
			if (!order?.id) return;
			heldAccepted.current.add(order.id);
			setTickets((list) => list.map((t) => t.id === order.id ? {
				...t,
				...order,
				status: "accepted"
			} : t));
		};
		window.addEventListener(POS_ACCEPTED_EVENT, onAccepted);
		return () => window.removeEventListener(POS_ACCEPTED_EVENT, onAccepted);
	}, []);
	(0, import_react.useEffect)(() => {
		setChromeHost(document.getElementById("admin-top-extra"));
	}, []);
	(0, import_react.useEffect)(() => {
		return onVisibleInterval(6e3, () => {
			listPosOrders().then((list) => {
				const next = list.map((t) => {
					if (!heldAccepted.current.has(t.id)) return t;
					if (t.status === "placed" || t.status === "awaiting_payment") return {
						...t,
						status: "accepted"
					};
					heldAccepted.current.delete(t.id);
					return t;
				});
				setTickets(next);
				const pinged = list.filter((t) => t.chatUnread > 0 && t.chatThreadId);
				let prefer = "";
				if (!primedChat.current) {
					for (const t of pinged) if (t.chatThreadId) seenChat.current.add(t.chatThreadId);
					primedChat.current = true;
				} else {
					const fresh = pinged.filter((t) => t.chatThreadId && !seenChat.current.has(t.chatThreadId));
					for (const t of pinged) if (t.chatThreadId) seenChat.current.add(t.chatThreadId);
					if (fresh[0]) prefer = fresh[0].id;
				}
				setOpenId((cur) => {
					if (prefer && !closedByStaff.current.has(prefer)) return prefer;
					if (ticket && !closedByStaff.current.has(ticket) && list.some((t) => t.id === ticket)) return ticket;
					if (cur && list.some((t) => t.id === cur)) return cur;
					return "";
				});
				if (ticket) setQuery(ticket);
			}).catch((e) => {
				if (isTransientFetchError(e)) return;
				setError(e instanceof Error ? e.message : "Could not load POS");
			});
		});
	}, [ticket]);
	(0, import_react.useEffect)(() => {
		getAdminShop().then((d) => {
			setCategories(d.categories);
			setPrinters(d.printers);
			setReceipt(d.receiptOptions);
			setRestaurant(d.restaurant);
			setTaxRate(d.settings.taxRate);
		}).catch(() => void 0);
	}, []);
	function mergeTicket(id, patch) {
		setTickets((list) => list.map((t) => t.id === id ? {
			...t,
			...patch
		} : t));
	}
	function setStatus(id, status) {
		if (statusBusyRef.current) return;
		statusBusyRef.current = true;
		setError("");
		setDialogError("");
		setStatusBusy(status);
		const prior = tickets.find((t) => t.id === id);
		updateOrderStatus({ data: {
			id,
			status
		} }).then((r) => {
			if (!r.order) return;
			mergeTicket(id, r.order);
			if (status !== "completed") return;
			const wasComplete = posBucket(prior?.status ?? "") === "completed";
			closedByStaff.current.add(id);
			setOpenId("");
			setItemQuery("");
			if (!wasComplete) {
				setDesk("open");
				setCompleteToast(formatCompletedToast({
					ticketNo: r.order.ticketNo || prior?.ticketNo || 0,
					total: r.order.total || prior?.total || 0,
					tip: r.order.tip || prior?.tip,
					formatTicketNo,
					formatUsd
				}));
			}
		}).catch((e) => {
			const msg = e instanceof Error ? e.message : "Could not update";
			if (status === "completed") setDialogError(msg);
			else setError(msg);
		}).finally(() => {
			statusBusyRef.current = false;
			setStatusBusy("");
		});
	}
	function saveItems(id, items) {
		setError("");
		patchPosOrder({ data: {
			id,
			items
		} }).then((r) => {
			if (!r.order) return;
			mergeTicket(id, r.order);
		}).catch((e) => setError(e instanceof Error ? e.message : "Could not update items"));
	}
	function reprint(order) {
		setBusyId(order.id);
		setError("");
		printOrderReceipts({
			order,
			restaurant,
			receipt,
			printers,
			taxRate,
			fallback: true
		}).then(() => setError("")).catch((e) => setError(e instanceof Error ? e.message : "Could not print")).finally(() => setBusyId(""));
	}
	const visible = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		if (!q) return tickets;
		return tickets.filter((t) => [
			formatTicketNo(t.ticketNo),
			t.id,
			t.customerName,
			t.customerPhone,
			t.status,
			t.fulfillment,
			t.addressLine,
			t.notes
		].join(" ").toLowerCase().includes(q));
	}, [tickets, query]);
	const menuHits = (0, import_react.useMemo)(() => {
		const needle = itemQuery.trim().toLowerCase();
		if (!needle) return [];
		const hits = [];
		for (const cat of categories) for (const item of cat.items) {
			const name = item.name.toLowerCase();
			const desc = (item.description ?? "").toLowerCase();
			let score = 0;
			if (name === needle) score = 100;
			else if (name.startsWith(needle)) score = 80;
			else if (name.includes(needle)) score = 60;
			else if (desc.includes(needle)) score = 40;
			else if (cat.name.toLowerCase().includes(needle)) score = 20;
			if (score) hits.push({
				cat,
				item,
				score
			});
		}
		hits.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
		return hits.slice(0, 8);
	}, [categories, itemQuery]);
	const openTickets = (0, import_react.useMemo)(() => {
		return [...visible.filter((t) => posBucket(t.status) !== "completed")].sort((a, b) => {
			const ap = a.status === "placed" || a.status === "awaiting_payment" ? 0 : 1;
			const bp = b.status === "placed" || b.status === "awaiting_payment" ? 0 : 1;
			if (ap !== bp) return ap - bp;
			const ta = Date.parse(a.createdAt) || 0;
			const tb = Date.parse(b.createdAt) || 0;
			if (ta !== tb) return ta - tb;
			return (a.ticketNo || 0) - (b.ticketNo || 0) || a.id.localeCompare(b.id);
		});
	}, [visible]);
	const doneTickets = (0, import_react.useMemo)(() => visible.filter((t) => posBucket(t.status) === "completed"), [visible]);
	const shown = desk === "done" ? doneTickets : openTickets;
	const openTicket = tickets.find((t) => t.id === openId) ?? null;
	const deskTabs = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "seg pos-desk-tabs",
		role: "tablist",
		"aria-label": "Ticket desk",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			role: "tab",
			"aria-selected": desk === "open",
			"data-on": desk === "open",
			onClick: () => {
				setDesk("open");
				setOpenId("");
				setItemQuery("");
			},
			children: ["Open", openTickets.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
				className: "pos-tab-n",
				children: openTickets.length
			}) : null]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			role: "tab",
			"aria-selected": desk === "done",
			"data-on": desk === "done",
			onClick: () => {
				setDesk("done");
				setOpenId("");
				setItemQuery("");
			},
			children: ["Complete", doneTickets.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
				className: "pos-tab-n",
				children: doneTickets.length
			}) : null]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pos-page",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PosStaffToast, { toast: completeToast }),
			chromeHost ? (0, import_react_dom.createPortal)(deskTabs, chromeHost) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pos-chrome",
				children: deskTabs
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "form-error",
				children: error
			}) : null,
			shown.length === 0 ? desk === "open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "page-card pos-empty-open",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "You're caught up" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ed-sub",
						children: "No open tickets. New orders will show here."
					}),
					doneTickets.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "ed-btn",
						onClick: () => {
							setDesk("done");
							setOpenId("");
							setItemQuery("");
						},
						children: "View completed"
					}) : null
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "page-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ed-empty",
					children: "No completed tickets."
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "pos-list",
				children: shown.map((t) => {
					const open = openId === t.id;
					const bucket = posBucket(t.status);
					const stamp = posStamp(t.status);
					const where = ticketWhere(t);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "pos-row",
						"data-open": open,
						"data-status": bucket,
						"data-chat": t.chatUnread > 0 ? "true" : void 0,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "pos-summary",
							"aria-haspopup": "dialog",
							"aria-expanded": open,
							onClick: () => {
								setOpenId(t.id);
								setItemQuery("");
								setDialogError("");
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "pos-when",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: ["#", formatTicketNo(t.ticketNo)] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
										new Date(t.createdAt).toLocaleTimeString([], {
											hour: "numeric",
											minute: "2-digit"
										}),
										" · ",
										new Date(t.createdAt).toLocaleDateString()
									] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "pos-who",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: t.customerName }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
										t.fulfillment === "delivery" ? "Delivery" : t.pickupName ? `Pickup · ${t.pickupName}` : "Pickup",
										" · ",
										where,
										t.scheduledFor ? ` · ${formatShopWhen(t.scheduledFor)}` : ""
									] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "pos-amt",
									children: formatUsd(t.total)
								}),
								t.chatUnread > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "pos-chat-badge",
									title: "Customer messaged about this order",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
										size: 15,
										strokeWidth: 2.2
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "nav-pip",
										children: t.chatUnread > 9 ? "9+" : t.chatUnread
									})]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "pos-st",
									"data-tone": stamp.tone,
									children: stamp.label
								})
							]
						}), t.chatUnread > 0 && t.chatThreadId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/admin/center",
							search: {
								tab: "messages",
								thread: t.chatThreadId
							},
							className: "pos-chat-ping",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, {
								size: 15,
								strokeWidth: 2.2
							}), "Customer messaged about this order"]
						}) : null]
					}, t.id);
				})
			}),
			openTicket ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PosTicketDialog, {
				ticket: openTicket,
				itemQuery,
				menuHits,
				busyId,
				statusBusy,
				statusError: dialogError,
				onClose: () => {
					setOpenId("");
					setItemQuery("");
					setDialogError("");
				},
				onQuery: setItemQuery,
				onStatus: (status) => setStatus(openTicket.id, status),
				onSaveItems: (items) => saveItems(openTicket.id, items),
				onReprint: () => reprint(openTicket)
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "pos-search-fab",
				"aria-label": "Find a ticket",
				"aria-expanded": finderOpen,
				onClick: () => setFinderOpen(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
					size: 18,
					strokeWidth: 2.2
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Find a ticket" })]
			}),
			finderOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pos-search-scrim",
				role: "dialog",
				"aria-modal": "true",
				"aria-labelledby": "pos-find-title",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "pos-search-pop",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "dock-panel-head",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "shop-brand-kicker",
								children: "POS"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								id: "pos-find-title",
								children: "Find a ticket"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ed-icon-btn",
								"aria-label": "Close search",
								onClick: () => setFinderOpen(false),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
									size: 16,
									strokeWidth: 2.2
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "ed-field",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Name, ticket, phone" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "cat-search",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
									size: 16,
									strokeWidth: 2.2,
									"aria-hidden": true
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									autoFocus: true,
									value: query,
									onChange: (e) => setQuery(e.target.value),
									placeholder: "Search tickets",
									"aria-label": "Search tickets"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "pos-search-hits",
							children: visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
								className: "ed-empty",
								children: "No tickets match."
							}) : visible.slice(0, 12).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									setDesk(posBucket(t.status) === "completed" ? "done" : "open");
									setOpenId(t.id);
									setFinderOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: t.customerName }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("em", { children: [
									"#",
									formatTicketNo(t.ticketNo),
									" · ",
									formatUsd(t.total),
									" · ",
									posStamp(t.status).label,
									t.scheduledFor ? ` · ${formatShopWhen(t.scheduledFor)}` : ""
								] })]
							}) }, t.id))
						})
					]
				})
			}) : null
		]
	});
}
//#endregion
//#region src/routes/admin/rewards.tsx
var Route$4 = createFileRoute("/admin/rewards")({ component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
	to: "/admin/center",
	search: { tab: "rewards" }
}) });
//#endregion
//#region src/routes/admin/service.tsx
var Route$3 = createFileRoute("/admin/service")({ component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
	to: "/admin/center",
	search: { tab: "messages" }
}) });
//#endregion
//#region src/routes/admin/zones.tsx
var Route$2 = createFileRoute("/admin/zones")({ component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, {
	to: "/admin/menu",
	search: { tab: "delivery" }
}) });
//#endregion
//#region src/routes/api/auth/$.ts
var Route$1 = createFileRoute("/api/auth/$")({ server: { handlers: {
	GET: ({ request }) => auth.handler(request),
	POST: ({ request }) => auth.handler(request)
} } });
//#endregion
//#region src/lib/bot/audit.server.ts
async function writeBotAudit(input) {
	try {
		await (await getSql()).query(`insert into bot_audit (id, agent_id, path, status, ip) values ($1,$2,$3,$4,$5)`, [
			`aud-${randomBytes(10).toString("hex")}`,
			input.agentId ?? null,
			input.path.slice(0, 240),
			input.status,
			input.ip.slice(0, 80)
		]);
	} catch (err) {
		console.error("[southend] bot audit write failed", err);
	}
}
function requestIp(request) {
	const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
	if (forwarded) return forwarded;
	return request.headers.get("x-real-ip")?.trim() || "";
}
//#endregion
//#region src/routes/api/bot/v1/$.ts
/**
* Bot API v1 — South End Pizza
*
* Changelog (POS quality-up):
* - GET /orders/recent: adds itemCount, itemSummary, customerName, notes, tip
*   (nullable-safe). Joins profiles for display name; items come from orders.items jsonb.
*   Existing fields (id, ticketNo, status, fulfillment, total, paymentMethod,
*   createdAt, scheduledFor) are unchanged.
* - POST /orders/status: accepting/preparing is idempotent — if the ticket is
*   already accepted, preparing, or further along the kitchen path, returns 200
*   with the current state (no error spam). Other transitions still update normally.
*
* Scope: build-only. No Neon cutover, auth/BETTER_AUTH, card processor, or bot scope changes.
*/
var KITCHEN_STATUSES = /* @__PURE__ */ new Set([
	"accepted",
	"preparing",
	"ready",
	"out_for_delivery",
	"completed",
	"canceled"
]);
function json(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store"
		}
	});
}
function pathOf(request) {
	try {
		return new URL(request.url).pathname.replace(/\/+$/, "") || "/";
	} catch {
		return "/";
	}
}
function routeKey(pathname) {
	return pathname.replace(/^\/api\/bot\/v1\/?/, "") || "health";
}
async function requireAgent(request, scope) {
	const agent = await verifyBotBearer(request);
	if (!agent) return json({ error: "unauthorized" }, 401);
	if (!rateLimitBot(agent.id)) return json({ error: "rate_limited" }, 429);
	if (scope && !agentHasScope(agent, scope)) return json({
		error: "forbidden",
		scope
	}, 403);
	return { agent };
}
async function handle(request) {
	const pathname = pathOf(request);
	const key = routeKey(pathname);
	const ip = requestIp(request);
	let agentId = null;
	let status = 200;
	const reply = (body, code = 200) => {
		status = code;
		return json(body, code);
	};
	try {
		if (request.method === "GET" && (key === "health" || key === "")) {
			const authed = request.headers.get("authorization") ? await verifyBotBearer(request) : null;
			agentId = authed?.id ?? null;
			return reply({
				ok: true,
				service: "southend-bot",
				auth: authed ? authed.name : "optional",
				cardProcessor: "disabled"
			});
		}
		if (request.method === "GET" && key === "security/summary") {
			const gate = await requireAgent(request, "security.summary");
			if (gate instanceof Response) {
				status = gate.status;
				return gate;
			}
			agentId = gate.agent.id;
			const sql = await getSql();
			let agents = {
				total: 0,
				enabled: 0
			};
			let adminTotp = 0;
			try {
				const counts = await sql.query(`select count(*)::int as n, count(*) filter (where enabled)::int as enabled from bot_agents`);
				agents = {
					total: Math.round(Number(counts[0]?.n) || 0),
					enabled: Math.round(Number(counts[0]?.enabled) || 0)
				};
			} catch {}
			try {
				const totp = await sql.query(`select count(*)::int as n from profiles where totp_enabled = true and role = 'admin'`);
				adminTotp = Math.round(Number(totp[0]?.n) || 0);
			} catch {}
			const desk = await diagnosticDeskAuthStatus(sql);
			return reply({
				db: dbSource,
				production: isVercelProduction(),
				neon: dbSource === "neon",
				staffSecretConfigured: desk.staffSecretConfigured,
				diagnosticDeskAuth: desk.diagnosticDeskAuth,
				staffAdminLoginEnabled: desk.staffAdminLoginEnabled,
				envDeskLoginEnabled: desk.envDeskLoginEnabled,
				staffDeskLoginEnabled: desk.staffDeskLoginEnabled,
				trustedOrigins: isVercelProduction() ? PRODUCTION_AUTH_ORIGINS : "preview-dynamic",
				cardProcessor: "disabled",
				adminTotp,
				agents
			});
		}
		if (request.method === "GET" && key === "deploy/status") {
			const gate = await requireAgent(request, "deploy.status.read");
			if (gate instanceof Response) {
				status = gate.status;
				return gate;
			}
			agentId = gate.agent.id;
			return reply({
				production: isVercelProduction(),
				db: dbSource,
				env: isVercelProduction() ? "production" : "preview"
			});
		}
		if (request.method === "GET" && key === "auth/audit") {
			const gate = await requireAgent(request, "auth.audit.read");
			if (gate instanceof Response) {
				status = gate.status;
				return gate;
			}
			agentId = gate.agent.id;
			return reply({ recent: (await (await getSql())`
        select a.path, a.status, a.created_at, coalesce(b.name, '') as name
        from bot_audit a
        left join bot_agents b on b.id = a.agent_id
        order by a.created_at desc
        limit 25`).map((row) => ({
				path: String(row.path ?? ""),
				status: Number(row.status) || 0,
				name: String(row.name ?? ""),
				at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? "")
			})) });
		}
		if (request.method === "GET" && key === "orders/recent") {
			const gate = await requireAgent(request, "orders.read");
			if (gate instanceof Response) {
				status = gate.status;
				return gate;
			}
			agentId = gate.agent.id;
			return reply({ orders: (await (await getSql())`
        select o.id, o.ticket_no, o.status, o.fulfillment, o.total, o.payment_method,
               o.created_at, o.scheduled_for, o.notes, o.tip, o.tax, o.subtotal, o.discount,
               o.delivery_fee, o.items, o.pickup_name,
               p.display_name, p.phone
        from orders o
        left join profiles p on p.user_id = o.user_id
        order by o.created_at desc
        limit 25`).map((row) => {
				const itemsRaw = row.items;
				let items = [];
				if (Array.isArray(itemsRaw)) items = itemsRaw;
				else if (typeof itemsRaw === "string") try {
					const parsed = JSON.parse(itemsRaw);
					if (Array.isArray(parsed)) items = parsed;
				} catch {
					items = [];
				}
				let itemCount = 0;
				const bits = [];
				for (const raw of items) {
					const it = raw && typeof raw === "object" ? raw : {};
					const qty = Math.max(1, Math.round(Number(it.qty) || 1));
					itemCount += qty;
					bits.push(lineSummary({
						qty,
						name: String(it.name ?? ""),
						size: String(it.size ?? ""),
						detail: String(it.detail ?? ""),
						comment: String(it.comment ?? "")
					}));
				}
				const money = (v) => {
					if (v === null || v === void 0 || v === "") return null;
					return String(v);
				};
				const tip = money(row.tip);
				const tax = money(row.tax);
				const subtotal = money(row.subtotal);
				const discountRaw = money(row.discount);
				const deliveryFeeRaw = money(row.delivery_fee);
				const notesRaw = row.notes;
				const notes = notesRaw === null || notesRaw === void 0 ? null : String(notesRaw).trim() || null;
				const pickupName = String(row.pickup_name ?? "").trim() || null;
				const pickupPhone = String(row.phone ?? "").trim() || null;
				const customerName = pickupName || String(row.display_name ?? "").trim() || "Guest";
				const promisedEta = row.scheduled_for ? row.scheduled_for instanceof Date ? row.scheduled_for.toISOString() : String(row.scheduled_for) : null;
				const paymentMethod = String(row.payment_method ?? "");
				const status = String(row.status ?? "");
				return {
					id: String(row.id),
					ticketNo: Math.round(Number(row.ticket_no) || 0),
					status,
					fulfillment: String(row.fulfillment ?? ""),
					total: String(row.total ?? "0"),
					paymentMethod,
					paymentLabel: payStatusLabel(paymentMethod, status),
					createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
					scheduledFor: promisedEta,
					promisedEta,
					itemCount,
					itemSummary: bits.slice(0, 6).join(", ") + (bits.length > 6 ? "…" : ""),
					customerName,
					pickupName,
					pickupPhone,
					notes,
					tip,
					tax,
					subtotal,
					discount: discountRaw && Number(discountRaw) > 0 ? discountRaw : null,
					deliveryFee: deliveryFeeRaw && Number(deliveryFeeRaw) > 0 ? deliveryFeeRaw : null
				};
			}) });
		}
		if (request.method === "GET" && key === "menu") {
			const gate = await requireAgent(request, "menu.read");
			if (gate instanceof Response) {
				status = gate.status;
				return gate;
			}
			agentId = gate.agent.id;
			const sql = await getSql();
			const cats = await sql`select id, name, kind from menu_categories order by sort_order, name`;
			const items = await sql`select id, category_id, name, prices from menu_items order by sort_order, name`;
			return reply({
				categories: cats.map((c) => ({
					id: String(c.id),
					name: String(c.name ?? ""),
					kind: String(c.kind ?? "")
				})),
				items: items.map((it) => ({
					id: String(it.id),
					categoryId: String(it.category_id ?? ""),
					name: String(it.name ?? "")
				}))
			});
		}
		if (request.method === "GET" && key === "payments") {
			const gate = await requireAgent(request, "payments.read");
			if (gate instanceof Response) {
				status = gate.status;
				return gate;
			}
			agentId = gate.agent.id;
			const row = (await (await getSql()).query(`select count(*) filter (where status not in ('canceled', 'awaiting_payment'))::int as n,
                  coalesce(sum(total) filter (where status not in ('canceled', 'awaiting_payment')), 0)::text as collected,
                  coalesce(sum(total) filter (where status = 'awaiting_payment'), 0)::text as outstanding
           from orders`))[0];
			return reply({
				processor: "disabled",
				tickets: Math.round(Number(row?.n) || 0),
				collected: row?.collected ?? "0",
				outstanding: row?.outstanding ?? "0"
			});
		}
		if (request.method === "POST" && key === "orders/status") {
			const gate = await requireAgent(request, "orders.update_status");
			if (gate instanceof Response) {
				status = gate.status;
				return gate;
			}
			agentId = gate.agent.id;
			const body = await request.json().catch(() => ({}));
			const id = String(body.id ?? "").trim();
			const next = String(body.status ?? "").trim();
			if (!id) return reply({ error: "missing_id" }, 400);
			if (!KITCHEN_STATUSES.has(next)) return reply({ error: "invalid_status" }, 400);
			const sql = await getSql();
			const existing = await sql.query(`select id, ticket_no, status from orders where id = $1`, [id]);
			if (!existing[0]) return reply({ error: "not_found" }, 404);
			const current = String(existing[0].status ?? "");
			const pastAccepted = /* @__PURE__ */ new Set([
				"accepted",
				"preparing",
				"ready",
				"out_for_delivery",
				"completed"
			]);
			const pastPreparing = /* @__PURE__ */ new Set([
				"preparing",
				"ready",
				"out_for_delivery",
				"completed"
			]);
			if (next === "accepted" && pastAccepted.has(current)) return reply({
				ok: true,
				id: String(existing[0].id),
				ticketNo: Math.round(Number(existing[0].ticket_no) || 0),
				status: current
			});
			if (next === "preparing" && pastPreparing.has(current)) return reply({
				ok: true,
				id: String(existing[0].id),
				ticketNo: Math.round(Number(existing[0].ticket_no) || 0),
				status: current
			});
			const updated = await sql.query(`update orders set status = $1, accepted_at = case when $1 in ('accepted','preparing') then coalesce(accepted_at, now()) else accepted_at end
         where id = $2 returning id, ticket_no, status`, [next, id]);
			if (!updated[0]) return reply({ error: "not_found" }, 404);
			return reply({
				ok: true,
				id: String(updated[0].id),
				ticketNo: Math.round(Number(updated[0].ticket_no) || 0),
				status: String(updated[0].status ?? next)
			});
		}
		return reply({ error: "not_found" }, 404);
	} catch (err) {
		const message = err instanceof Error ? err.message : "error";
		if (/Production requires DATABASE_URL/i.test(message)) return reply({ error: "neon_required" }, 503);
		console.error("[southend] bot api", err);
		return reply({ error: "server_error" }, 500);
	} finally {
		writeBotAudit({
			agentId,
			path: pathname,
			status,
			ip
		});
	}
}
var Route = createFileRoute("/api/bot/v1/$")({ server: { handlers: {
	GET: ({ request }) => handle(request),
	POST: ({ request }) => handle(request)
} } });
//#endregion
//#region src/routeTree.gen.ts
var IndexRoute = Route$28.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$29
});
var AccountRoute = Route$27.update({
	id: "/account",
	path: "/account",
	getParentRoute: () => Route$29
});
var AdminRoute = Route$26.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => Route$29
});
var BoardRoute = Route$25.update({
	id: "/board",
	path: "/board",
	getParentRoute: () => Route$29
});
var CheckoutRoute = Route$24.update({
	id: "/checkout",
	path: "/checkout",
	getParentRoute: () => Route$29
});
var Enroll2faRoute = Route$23.update({
	id: "/enroll-2fa",
	path: "/enroll-2fa",
	getParentRoute: () => Route$29
});
var HelpRoute = Route$22.update({
	id: "/help",
	path: "/help",
	getParentRoute: () => Route$29
});
var InstallRoute = Route$21.update({
	id: "/install",
	path: "/install",
	getParentRoute: () => Route$29
});
var LoginRoute = Route$20.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$29
});
var PairPrinterRoute = Route$19.update({
	id: "/pair-printer",
	path: "/pair-printer",
	getParentRoute: () => Route$29
});
var RecoverRoute = Route$18.update({
	id: "/recover",
	path: "/recover",
	getParentRoute: () => Route$29
});
var Verify2faRoute = Route$17.update({
	id: "/verify-2fa",
	path: "/verify-2fa",
	getParentRoute: () => Route$29
});
var AdminIndexRoute = Route$16.update({
	id: "/",
	path: "/",
	getParentRoute: () => AdminRoute
});
var AdminBackgroundRoute = Route$15.update({
	id: "/background",
	path: "/background",
	getParentRoute: () => AdminRoute
});
var AdminBotsRoute = Route$14.update({
	id: "/bots",
	path: "/bots",
	getParentRoute: () => AdminRoute
});
var AdminCenterRoute = Route$12.update({
	id: "/center",
	path: "/center",
	getParentRoute: () => AdminRoute
});
var AdminCustomersRoute = Route$11.update({
	id: "/customers",
	path: "/customers",
	getParentRoute: () => AdminRoute
});
var AdminFinancialsRoute = Route$10.update({
	id: "/financials",
	path: "/financials",
	getParentRoute: () => AdminRoute
});
var AdminMenuRoute = Route$9.update({
	id: "/menu",
	path: "/menu",
	getParentRoute: () => AdminRoute
});
var AdminMessagesRoute = Route$8.update({
	id: "/messages",
	path: "/messages",
	getParentRoute: () => AdminRoute
});
var AdminOrdersRoute = Route$7.update({
	id: "/orders",
	path: "/orders",
	getParentRoute: () => AdminRoute
});
var AdminPatchesRoute = Route$6.update({
	id: "/patches",
	path: "/patches",
	getParentRoute: () => AdminRoute
});
var AdminPosRoute = Route$5.update({
	id: "/pos",
	path: "/pos",
	getParentRoute: () => AdminRoute
});
var AdminRewardsRoute = Route$4.update({
	id: "/rewards",
	path: "/rewards",
	getParentRoute: () => AdminRoute
});
var AdminServiceRoute = Route$3.update({
	id: "/service",
	path: "/service",
	getParentRoute: () => AdminRoute
});
var AdminSettingsRoute = Route$13.update({
	id: "/settings",
	path: "/settings",
	getParentRoute: () => AdminRoute
});
var AdminZonesRoute = Route$2.update({
	id: "/zones",
	path: "/zones",
	getParentRoute: () => AdminRoute
});
var ApiAuthSplatRoute = Route$1.update({
	id: "/api/auth/$",
	path: "/api/auth/$",
	getParentRoute: () => Route$29
});
var ApiBotV1SplatRoute = Route.update({
	id: "/api/bot/v1/$",
	path: "/api/bot/v1/$",
	getParentRoute: () => Route$29
});
var AdminRouteChildren = {
	AdminBackgroundRoute,
	AdminBotsRoute,
	AdminCenterRoute,
	AdminCustomersRoute,
	AdminFinancialsRoute,
	AdminMenuRoute,
	AdminMessagesRoute,
	AdminOrdersRoute,
	AdminPatchesRoute,
	AdminPosRoute,
	AdminRewardsRoute,
	AdminServiceRoute,
	AdminSettingsRoute,
	AdminZonesRoute,
	AdminIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	AccountRoute,
	AdminRoute: AdminRoute._addFileChildren(AdminRouteChildren),
	BoardRoute,
	CheckoutRoute,
	Enroll2faRoute,
	HelpRoute,
	InstallRoute,
	LoginRoute,
	PairPrinterRoute,
	RecoverRoute,
	Verify2faRoute,
	ApiAuthSplatRoute,
	ApiBotV1SplatRoute
};
var routeTree = Route$29._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent,
		defaultPreload: false,
		defaultPreloadStaleTime: 3e4
	});
}
//#endregion
export { getRouter };
