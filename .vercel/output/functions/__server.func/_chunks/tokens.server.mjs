import { r as __exportAll } from "../_runtime.mjs";
import { a as requireNeonInProduction, l as getSql } from "../index.mjs";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
//#region src/lib/bot/scopes.ts
var BOT_ROLES = [
	"security_read",
	"ops_read",
	"menu_write",
	"orders_read",
	"admin_write"
];
var BOT_SCOPES = [
	"health.read",
	"auth.audit.read",
	"security.summary",
	"deploy.status.read",
	"orders.read",
	"orders.update_status",
	"menu.read",
	"menu.write",
	"payments.read"
];
var ROLE_SCOPES = {
	security_read: [
		"health.read",
		"auth.audit.read",
		"security.summary",
		"deploy.status.read"
	],
	ops_read: [
		"health.read",
		"orders.read",
		"menu.read"
	],
	menu_write: [
		"health.read",
		"menu.read",
		"menu.write"
	],
	orders_read: [
		"health.read",
		"orders.read",
		"orders.update_status"
	],
	admin_write: [
		"health.read",
		"auth.audit.read",
		"security.summary",
		"orders.read",
		"menu.read"
	]
};
var BOT_ROLE_LABELS = {
	security_read: "Security read",
	ops_read: "Ops read",
	menu_write: "Menu write",
	orders_read: "Orders read",
	admin_write: "Admin write"
};
var BOT_PRESETS = [
	{
		name: "security-guard",
		role: "security_read",
		label: "Security Guard"
	},
	{
		name: "chief-of-staff",
		role: "ops_read",
		label: "Chief of Staff"
	},
	{
		name: "finance",
		role: "orders_read",
		label: "Finance",
		scopes: ["orders.read", "payments.read"]
	},
	{
		name: "pos",
		role: "orders_read",
		label: "POS Employee"
	},
	{
		name: "style",
		role: "ops_read",
		label: "Style",
		scopes: ["health.read", "menu.read"]
	},
	{
		name: "new-customer",
		role: "ops_read",
		label: "New Customer",
		scopes: [
			"health.read",
			"menu.read",
			"orders.read"
		]
	}
];
function isBotScope(raw) {
	return BOT_SCOPES.includes(raw);
}
function isBotRole(raw) {
	return BOT_ROLES.includes(raw);
}
function scopesForPreset(preset) {
	if (preset.scopes?.length) return [...preset.scopes];
	return [...ROLE_SCOPES[preset.role]];
}
function scopesForRole(role) {
	return [...ROLE_SCOPES[role]];
}
//#endregion
//#region src/lib/bot/tokens.server.ts
var tokens_server_exports = /* @__PURE__ */ __exportAll({
	BOT_TOKEN_PREFIX: () => BOT_TOKEN_PREFIX,
	agentHasScope: () => agentHasScope,
	hashBotToken: () => hashBotToken,
	hashesEqual: () => hashesEqual,
	mintBotToken: () => mintBotToken,
	parseBearer: () => parseBearer,
	rateLimitBot: () => rateLimitBot,
	verifyBotBearer: () => verifyBotBearer
});
var BOT_TOKEN_PREFIX = "sep_live_";
function pepper() {
	return process.env.BOT_TOKEN_PEPPER?.trim() ?? "";
}
function mintBotToken() {
	return `${BOT_TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}
function hashBotToken(token) {
	return createHash("sha256").update(`${pepper()}${token}`).digest("hex");
}
function hashesEqual(a, b) {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	if (left.length !== right.length) return false;
	return timingSafeEqual(left, right);
}
function parseBearer(request) {
	return (request.headers.get("authorization") ?? "").match(/^Bearer\s+(\S+)/i)?.[1] ?? "";
}
function parseScopes(raw) {
	return (Array.isArray(raw) ? raw.map((s) => String(s)) : []).filter(isBotScope);
}
function agentHasScope(agent, scope) {
	return agent.scopes.includes(scope);
}
var rateRef = globalThis;
function rateHits() {
	rateRef.__southendBotRate__ ??= /* @__PURE__ */ new Map();
	return rateRef.__southendBotRate__;
}
function rateLimitBot(agentId, limit = 60, windowMs = 6e4) {
	const now = Date.now();
	const hits = rateHits();
	const prev = (hits.get(agentId) ?? []).filter((t) => now - t < windowMs);
	if (prev.length >= limit) return false;
	prev.push(now);
	hits.set(agentId, prev);
	return true;
}
async function verifyBotBearer(request) {
	requireNeonInProduction();
	const token = parseBearer(request);
	if (!token.startsWith("sep_live_") || token.length < 25) return null;
	const digest = hashBotToken(token);
	const sql = await getSql();
	const row = (await sql.query(`select id, name, role, scopes, enabled, expires_at, token_hash
     from bot_agents
     where token_hash = $1
     limit 1`, [digest]))[0];
	if (!row?.id) return null;
	if (!hashesEqual(String(row.token_hash ?? ""), digest)) return null;
	if (row.enabled !== true && row.enabled !== "t" && row.enabled !== "true") return null;
	const expires = row.expires_at ? new Date(String(row.expires_at)).getTime() : 0;
	if (expires && expires <= Date.now()) return null;
	const name = String(row.name ?? "");
	const hinted = (request.headers.get("x-bot-id") ?? "").trim();
	if (hinted && hinted !== name) return null;
	const role = String(row.role ?? "");
	if (!isBotRole(role)) return null;
	const agent = {
		id: String(row.id),
		name,
		role,
		scopes: parseScopes(row.scopes),
		enabled: true,
		expiresAt: row.expires_at ? String(row.expires_at) : null
	};
	await sql.query(`update bot_agents set last_used_at = now() where id = $1`, [agent.id]);
	return agent;
}
//#endregion
export { BOT_PRESETS as a, isBotRole as c, verifyBotBearer as i, scopesForPreset as l, rateLimitBot as n, BOT_ROLES as o, tokens_server_exports as r, BOT_ROLE_LABELS as s, agentHasScope as t, scopesForRole as u };
