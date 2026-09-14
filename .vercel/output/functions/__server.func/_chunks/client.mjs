import { r as __exportAll } from "../_runtime.mjs";
import { n as genericOAuthClient, t as createAuthClient } from "../_libs/better-auth+[...].mjs";
import { n as persist, r as create, t as createJSONStorage } from "../_libs/zustand.mjs";
//#region scripts/sign-out-plan.mjs
/**
* The sign-out sequence used by `src/lib/auth/client.ts`, kept here as a pure
* module so its effects can be unit-tested (`node --test` only covers
* `scripts/`), the same split `migration-plan.mjs` uses for the two appliers.
*
* The two environments authenticate differently, so they need different
* answers to "the server did not reply":
*
* - **Live preview** — a partitioned iframe. Google/X ride a bearer token in
*   `sessionStorage`; email/password (the shop Admin desk login) is a same-
*   origin cookie. Both need a server sign-out. The wait is still bounded so a
*   wedged request cannot strand the button — after the wait we always drop
*   the local token and redirect.
* - **Deployed** — the session rides an HttpOnly `__Host-` cookie that JS
*   cannot delete. ONLY a completed sign-out response clears it, and
*   `server.ts` enables `session.cookieCache` (maxAge 300), so `/get-session`
*   would keep answering from the cached cookie for minutes afterwards.
*   Redirecting on a timeout would show the visitor "signed out" while their
*   session is still live — so here we fail loudly instead of pretending.
*/
/**
* Live preview: aggressive, because the local clear is what signs the user out.
* The same-origin POST normally answers in tens of ms; lower would start
* abandoning slow-but-working sign-outs for no gain.
*/
var PREVIEW_SIGN_OUT_TIMEOUT_MS = 1500;
/**
* Deployed: generous, because only the server can end this session — but still
* bounded, so a wedged request reports failure the visitor can retry instead of
* spinning forever. A sign-out still unanswered at 10s is not going to land.
*/
var DEPLOYED_SIGN_OUT_TIMEOUT_MS = 1e4;
/**
* How long to wait for a sign-out in this environment. Every sign-out network
* call picks its bound here, so the preview/deployed split cannot drift apart
* between callers.
* @param {boolean} livePreview
* @returns {number}
*/
function signOutTimeoutMs(livePreview) {
	return livePreview ? PREVIEW_SIGN_OUT_TIMEOUT_MS : DEPLOYED_SIGN_OUT_TIMEOUT_MS;
}
/**
* Run `start()` but give up after `timeoutMs`, reporting which happened. Never
* rejects — callers decide what a failure means, and a `try/catch` around an
* `await` does nothing for a promise that never settles.
* @param {() => unknown} start
* @param {number} timeoutMs
* @returns {Promise<"ok" | "failed" | "timeout">}
*/
function settleWithin(start, timeoutMs) {
	return new Promise((resolve) => {
		const timer = setTimeout(() => resolve("timeout"), timeoutMs);
		/** @param {"ok" | "failed"} outcome */
		const done = (outcome) => {
			clearTimeout(timer);
			resolve(outcome);
		};
		try {
			Promise.resolve(start()).then(() => done("ok"), () => done("failed"));
		} catch {
			done("failed");
		}
	});
}
/**
* @typedef {object} SignOutSteps
* @property {boolean} livePreview Whether the app is the sandbox preview iframe.
* @property {boolean} hasBearer Whether a preview bearer token is stored.
* @property {() => unknown} requestSignOut Ask the server to end the session; must reject on a failed response.
* @property {() => void} clearToken Drop the stored bearer token.
* @property {() => void} redirect Leave the page.
* @property {number} [timeoutMs]
*/
/**
* End the session, then clear the local token and redirect.
*
* In the live preview those last two always run. When deployed they run only if
* the server confirmed, because nothing else can clear the cookie — a failed or
* timed-out sign-out throws rather than reporting a sign-out that did not
* happen.
* @param {SignOutSteps} steps
* @returns {Promise<void>}
*/
async function runSignOut({ livePreview, hasBearer, requestSignOut, clearToken, redirect, timeoutMs }) {
	if (livePreview) {
		await settleWithin(requestSignOut, timeoutMs ?? signOutTimeoutMs(livePreview));
		clearToken();
		redirect();
		return;
	}
	const outcome = await settleWithin(requestSignOut, timeoutMs ?? signOutTimeoutMs(livePreview));
	if (outcome !== "ok") throw new Error(outcome === "timeout" ? "Sign-out timed out — you are still signed in. Please try again." : "Sign-out failed — you are still signed in. Please try again.");
	clearToken();
	redirect();
}
/**
* @typedef {object} PreSignInSteps
* @property {boolean} livePreview Whether the app is the sandbox preview iframe.
* @property {boolean} hasBearer Whether a preview bearer token is stored.
* @property {() => unknown} requestSignOut Ask the server to end any prior session.
* @property {() => void} clearToken Drop the stored bearer token.
* @property {number} [timeoutMs]
*/
/**
* Drop any prior session before a new sign-in starts, so switching providers
* actually switches identity.
*
* Deliberately BEST EFFORT — unlike `runSignOut` this never throws. It also
* runs when there is no prior session at all, so treating a failure as fatal
* would block first-time sign-in on a transport hiccup, for a visitor with no
* session to protect. The subsequent OAuth flow issues a fresh session either
* way. Only the wait is bounded, and by the same per-environment rule as
* `runSignOut`: a deployed session dies server-side, so it gets the full
* window rather than the preview's aggressive one.
* @param {PreSignInSteps} steps
* @returns {Promise<void>}
*/
async function runPreSignInSignOut({ livePreview, hasBearer, requestSignOut, clearToken, timeoutMs }) {
	await settleWithin(requestSignOut, timeoutMs ?? signOutTimeoutMs(livePreview));
	clearToken();
}
//#endregion
//#region src/lib/cart-store.ts
function lineKey(line) {
	const tops = (line.toppings ?? []).map((t) => `${t.id}:${t.side}`).sort().join(",");
	const conds = (line.condiments ?? []).map((c) => `${c.id}:${c.qty}`).sort().join(",");
	return `${line.itemId}::${line.size ?? ""}::${line.halfItemId ?? ""}::${tops}::${conds}::${line.detail ?? ""}::${line.comment ?? ""}`;
}
var useCartStore = create()(persist((set) => ({
	lines: [],
	notes: "",
	bagOpen: false,
	openBag: () => set({ bagOpen: true }),
	closeBag: () => set({ bagOpen: false }),
	toggleBag: () => set((s) => ({ bagOpen: !s.bagOpen })),
	add: (line) => set((s) => {
		const key = lineKey(line);
		const qtyAdd = Math.max(1, line.qty ?? 1);
		if (s.lines.find((l) => l.key === key)) return { lines: s.lines.map((l) => l.key === key ? {
			...l,
			qty: l.qty + qtyAdd
		} : l) };
		return { lines: [...s.lines, {
			key,
			itemId: line.itemId,
			categoryId: line.categoryId,
			name: line.name,
			size: line.size,
			detail: line.detail,
			comment: line.comment,
			toppings: line.toppings,
			halfItemId: line.halfItemId,
			condiments: line.condiments,
			unitPrice: line.unitPrice,
			qty: qtyAdd
		}] };
	}),
	setQty: (key, qty) => set((s) => {
		const lines = qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => l.key === key ? {
			...l,
			qty
		} : l);
		return {
			lines,
			notes: lines.length ? s.notes : ""
		};
	}),
	remove: (key) => set((s) => {
		const lines = s.lines.filter((l) => l.key !== key);
		return {
			lines,
			notes: lines.length ? s.notes : ""
		};
	}),
	setNotes: (notes) => set({ notes }),
	clear: () => set({
		lines: [],
		notes: ""
	})
}), {
	name: "south-end-cart-v1",
	storage: createJSONStorage(() => {
		if (typeof window === "undefined") return {
			getItem: () => null,
			setItem: () => {},
			removeItem: () => {}
		};
		return localStorage;
	}),
	skipHydration: true,
	partialize: (s) => ({
		lines: s.lines.map((l) => ({
			...l,
			comment: void 0
		})),
		notes: s.lines.length ? s.notes : ""
	})
}));
if (typeof window !== "undefined") useCartStore.persist.rehydrate();
function wipeCart() {
	useCartStore.getState().clear();
	try {
		useCartStore.persist.clearStorage();
	} catch {}
	if (typeof window !== "undefined") try {
		window.localStorage.removeItem("south-end-cart-v1");
	} catch {}
}
function cartTotals(lines) {
	return {
		count: lines.reduce((n, l) => n + l.qty, 0),
		subtotal: Math.round(lines.reduce((n, l) => n + l.unitPrice * l.qty, 0) * 100) / 100
	};
}
//#endregion
//#region src/lib/auth/client.ts
var client_exports = /* @__PURE__ */ __exportAll({
	authClient: () => authClient,
	authEnabled: () => true,
	dropClientSession: () => dropClientSession,
	getBearerToken: () => getBearerToken,
	signIn: () => signIn,
	signOut: () => signOut
});
/**
* Better Auth client for this React SPA (browser-side).
*
* Talks to this app's OWN Better Auth at same-origin `/api/auth/*`. In the live
* preview the app is an embedded iframe with PARTITIONED cookies, so after a
* popup sign-in it can't read the session cookie — it authenticates with a
* bearer token instead (captured from the popup, see `signIn`). The `onRequest`
* hook attaches that token when present; when deployed (cookie auth) no token
* is stored, so nothing changes.
*
* To sign out call `signOut()` below, NOT `authClient.signOut()`: the raw call
* leaves the bearer token in place, and `onRequest` keeps re-attaching it, so
* the visitor stays signed in.
*/
var authClient = createAuthClient({
	plugins: [genericOAuthClient()],
	fetchOptions: { onRequest(ctx) {
		const token = getBearerToken();
		if (token) ctx.headers.set("Authorization", `Bearer ${token}`);
		return ctx;
	} }
});
var BEARER_KEY = "grok-auth.bearer-token";
/** The stored preview bearer token, or null. */
function getBearerToken() {
	if (typeof window === "undefined") return null;
	try {
		return window.sessionStorage.getItem(BEARER_KEY);
	} catch {
		return null;
	}
}
function setBearerToken(token) {
	if (typeof window === "undefined") return;
	try {
		if (token) window.sessionStorage.setItem(BEARER_KEY, token);
		else window.sessionStorage.removeItem(BEARER_KEY);
	} catch {}
}
/**
* The sandbox live preview runs this app inside an iframe on a `*.grok-sandbox.com`
* host, where a full-page redirect to the broker can't work — so sign-in uses a
* popup there and a normal redirect everywhere else.
*/
function inLivePreview() {
	return typeof window !== "undefined" && window.location.hostname.endsWith(".grok-sandbox.com");
}
/**
* Start sign-in with one upstream provider (`providerId` from `GROK_PROVIDERS`),
* federating through the Grok auth broker.
*
* - **Live preview** (`*.grok-sandbox.com` iframe): opens a POPUP to
*   `/auth/popup`, served by the template Vite plugin (see `vite.config.ts` +
*   `popup.server.ts`) — 302s to the broker/upstream login (no app chrome) and,
*   on return, posts the session bearer token back. We store it and refresh the
*   session; no top-level navigation of the iframe to the broker.
* - **Deployed** (and local non-iframe): a normal full-page redirect into the broker.
*
* Either way it clears any existing local session FIRST so switching providers
* actually switches identity.
*/
async function signIn(providerId, opts = {}) {
	const callbackURL = opts.callbackURL ?? "/";
	const errorCallbackURL = opts.errorCallbackURL ?? "/";
	const popup = inLivePreview() ? openSignInPopup(providerId) : null;
	await runPreSignInSignOut({
		livePreview: inLivePreview(),
		hasBearer: Boolean(getBearerToken()),
		requestSignOut: () => authClient.signOut(),
		clearToken: () => setBearerToken(null)
	});
	if (inLivePreview()) {
		if (!popup) throw new Error("Pop-up blocked — allow pop-ups for sign-in");
		const token = await waitForPopupToken(popup);
		if (!token) throw new Error("Sign-in was cancelled or failed");
		setBearerToken(token);
		try {
			await authClient.getSession();
		} catch {}
		if (typeof window !== "undefined") {
			const dest = new URL(callbackURL, window.location.origin);
			const here = window.location;
			if (dest.origin !== here.origin || dest.pathname !== here.pathname || dest.search !== here.search) window.location.href = callbackURL;
		}
		return;
	}
	const { data, error } = await authClient.signIn.oauth2({
		providerId,
		callbackURL,
		errorCallbackURL
	});
	if (error) throw new Error(error.message ?? "Sign-in failed");
	if (data?.url) window.location.href = data.url;
}
/**
* Open `/auth/popup` in a new window. Must run synchronously inside the click
* handler (no await before this). The path is served by the template Vite
* plugin (`authPopupPlugin` in vite.config.ts) — NOT by a React route.
*
* Opens the real URL directly (not about:blank → assign). From a cross-origin
* iframe the about:blank dance often fails on the first click and the window
* ends up showing the app shell.
*/
function openSignInPopup(providerId) {
	const url = `${window.location.origin}/auth/popup?providerId=${encodeURIComponent(providerId)}`;
	const name = `grok-signin-${Date.now()}`;
	return window.open(url, name, "popup,width=500,height=650");
}
/**
* Wait for the popup's completion page to postMessage the session bearer (or
* for the user to dismiss the popup).
*/
function waitForPopupToken(popup) {
	return new Promise((resolve) => {
		const origin = window.location.origin;
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
/**
* Sign out of THIS app's local session, clear the preview token, then redirect.
*
* Use this, never `authClient.signOut()` — see the note on `authClient`.
* Sequencing lives in `scripts/sign-out-plan.mjs` so it can be unit-tested.
*
* **Rejects when deployed if the server never confirms.** There the session is
* an HttpOnly cookie only the server can clear, so redirecting anyway would
* report a sign-out that did not happen. `<UserButton />` handles that for you;
* a hand-rolled control must catch it and let the visitor retry. In the live
* preview the local clear is sufficient, so it always resolves.
*/
async function signOut(redirectTo = "/") {
	await runSignOut({
		livePreview: inLivePreview(),
		hasBearer: Boolean(getBearerToken()),
		requestSignOut: async () => {
			const { error } = await authClient.signOut();
			if (error) throw new Error(error.message ?? "Sign-out failed");
		},
		clearToken: () => setBearerToken(null),
		redirect: () => {
			try {
				wipeCart();
			} catch {}
			window.location.href = redirectTo;
		}
	});
}
/** Drop a local session without leaving the page — used after a failed password. */
async function dropClientSession() {
	try {
		await authClient.signOut();
	} catch {}
	setBearerToken(null);
}
//#endregion
export { signIn as a, useCartStore as c, getBearerToken as i, wipeCart as l, client_exports as n, signOut as o, dropClientSession as r, cartTotals as s, authClient as t, runPreSignInSignOut as u };
