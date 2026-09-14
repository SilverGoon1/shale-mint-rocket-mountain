import { randomBytes } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { DESK_BOT_SOFT_MAX } from "@/lib/shop-types";
import { getSql } from "@/lib/db";
import {
  BOT_PRESETS,
  isBotRole,
  scopesForPreset,
  scopesForRole,
  type BotRole,
  type BotScope,
} from "@/lib/bot/scopes";

export type BotAgentView = {
  id: string;
  name: string;
  role: BotRole;
  scopes: BotScope[];
  enabled: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
};

export type BotAuditView = {
  id: string;
  agentId: string;
  name: string;
  path: string;
  status: number;
  ip: string;
  createdAt: string;
};

function bool(v: unknown) {
  return v === true || v === "t" || v === "true";
}

async function requireAdmin(userId: string) {
  const sql = await getSql();
  let on = false;
  try {
    const row = (await sql`select role, admin_mode, admin_mode_allowed from profiles where user_id = ${userId}`)[0] as
      | { role?: string; admin_mode?: unknown; admin_mode_allowed?: unknown }
      | undefined;
    on = bool(row?.admin_mode) && bool(row?.admin_mode_allowed);
  } catch {
    on = (await sql`select role from profiles where user_id = ${userId}`)[0]?.role === "admin";
  }
  if (!on) {
    const err = new Error("Forbidden") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
  const totpOn = bool((await sql`select totp_enabled from profiles where user_id = ${userId}`)[0]?.totp_enabled);
  if (totpOn) {
    const exp = (await sql`select expires_at from two_factor_unlocks where user_id = ${userId}`)[0]?.expires_at;
    if (!exp || new Date(String(exp)).getTime() <= Date.now()) throw new Error("Two-factor verification required.");
  }
}

function asAgent(row: Record<string, unknown>): BotAgentView {
  const scopes = Array.isArray(row.scopes) ? row.scopes.map((s) => String(s)) : [];
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    role: (isBotRole(String(row.role ?? "")) ? String(row.role) : "ops_read") as BotRole,
    scopes: scopes as BotScope[],
    enabled: bool(row.enabled),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
    lastUsedAt: row.last_used_at
      ? row.last_used_at instanceof Date
        ? row.last_used_at.toISOString()
        : String(row.last_used_at)
      : null,
    expiresAt: row.expires_at
      ? row.expires_at instanceof Date
        ? row.expires_at.toISOString()
        : String(row.expires_at)
      : null,
  };
}

export const listBotAgents = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql`select id, name, role, scopes, enabled, created_at, last_used_at, expires_at
      from bot_agents order by name`;
    return rows.map((row) => asAgent(row));
  });

export const listBotAudit = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql`
      select a.id, a.agent_id, coalesce(b.name, '') as name, a.path, a.status, a.ip, a.created_at
      from bot_audit a
      left join bot_agents b on b.id = a.agent_id
      order by a.created_at desc
      limit 40`;
    return rows.map(
      (row): BotAuditView => ({
        id: String(row.id),
        agentId: String(row.agent_id ?? ""),
        name: String(row.name ?? ""),
        path: String(row.path ?? ""),
        status: Number(row.status) || 0,
        ip: String(row.ip ?? ""),
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
      }),
    );
  });

export const createBotAgent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { preset?: string; name?: string; role?: string }) => data)
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const { hashBotToken, mintBotToken } = await import("@/lib/bot/tokens.server");
    const preset = BOT_PRESETS.find((p) => p.name === String(data.preset ?? "").trim());
    const roleRaw = preset?.role ?? String(data.role ?? "").trim();
    if (!isBotRole(roleRaw)) throw new Error("Pick a valid bot role.");
    const name = (preset?.name ?? String(data.name ?? "").trim().toLowerCase()).replace(/[^a-z0-9-]/g, "");
    if (name.length < 2 || name.length > 40) throw new Error("Bot name must be 2–40 letters, numbers, or dashes.");
    const scopes = preset ? scopesForPreset(preset) : scopesForRole(roleRaw);
    const token = mintBotToken();
    const id = `bot-${randomBytes(8).toString("hex")}`;
    const sql = await getSql();
    const clash = await sql.query(`select id from bot_agents where name = $1 limit 1`, [name]);
    if (clash[0]) throw new Error("A bot with that name already exists. Rotate its token instead.");
    const live = await sql`select count(*)::int as n from bot_agents where enabled is true`;
    const taken = Number(live[0]?.n || 0);
    if (taken >= DESK_BOT_SOFT_MAX) throw new Error("14 accounts, 12 extra bots. Existing grants stay.");
    await sql.query(
      `insert into bot_agents (id, name, role, token_hash, scopes, enabled, created_by)
       values ($1,$2,$3,$4,$5::text[], true, $6)`,
      [id, name, roleRaw, hashBotToken(token), scopes, context.userId],
    );
    const rows = await sql`select id, name, role, scopes, enabled, created_at, last_used_at, expires_at from bot_agents where id = ${id}`;
    return { agent: asAgent(rows[0] ?? { id, name, role: roleRaw, scopes, enabled: true }), token };
  });

export const rotateBotAgent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string }) => data)
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const { hashBotToken, mintBotToken } = await import("@/lib/bot/tokens.server");
    const id = String(data.id ?? "").trim();
    if (!id) throw new Error("Bot is missing.");
    const token = mintBotToken();
    const sql = await getSql();
    const updated = await sql.query(
      `update bot_agents set token_hash = $1, enabled = true, last_used_at = null where id = $2 returning id, name, role, scopes, enabled, created_at, last_used_at, expires_at`,
      [hashBotToken(token), id],
    );
    if (!updated[0]) throw new Error("Bot not found.");
    return { agent: asAgent(updated[0]), token };
  });

export const revokeBotAgent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string }) => data)
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const { hashBotToken, mintBotToken } = await import("@/lib/bot/tokens.server");
    const id = String(data.id ?? "").trim();
    if (!id) throw new Error("Bot is missing.");
    const sql = await getSql();
    // Replace the hash so a revoked token cannot authenticate even if enabled is ignored.
    await sql.query(`update bot_agents set enabled = false, token_hash = $1 where id = $2`, [
      hashBotToken(mintBotToken()),
      id,
    ]);
    return { ok: true };
  });
