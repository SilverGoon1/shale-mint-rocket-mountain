import { hashPassword } from "@better-auth/utils/password";
import { randomBytes } from "node:crypto";
import { isVercelProduction } from "@/lib/prod-guard.server";
import {
  STAFF_ADMIN_EMAIL,
  STAFF_ADMIN_ID,
  STAFF_ADMIN_NAME,
} from "@/lib/staff-admin";
import type { Sql } from "@/lib/db";

function env(key: string) {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
}

function bool(v: unknown) {
  return v === true || v === "t" || v === "true";
}

function isMissingStaffAdminColumn(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return /staff_admin_login_enabled|staff_admin_login_touched|diagnostic_desk_auth/i.test(msg);
}

/** Always-safe ALTERs — also runs when applySettingsSchema early-returns. */
export async function ensureStaffAdminLoginColumns(sql: Sql) {
  await sql.query(
    `alter table shop_settings add column if not exists staff_admin_login_enabled boolean not null default false`,
  );
  await sql.query(
    `alter table shop_settings add column if not exists staff_admin_login_touched boolean not null default false`,
  );
  await sql.query(`alter table shop_settings add column if not exists diagnostic_desk_auth boolean`);
}

export async function staffAdminLoginColumn(sql: Sql) {
  try {
    const row = (
      await sql.query(
        `select staff_admin_login_enabled, diagnostic_desk_auth from shop_settings where id = 1`,
      )
    )[0];
    return bool(row?.staff_admin_login_enabled) || bool(row?.diagnostic_desk_auth);
  } catch (err) {
    if (isMissingStaffAdminColumn(err)) return false;
    throw err;
  }
}

/** Desk login is on if the Bot access toggle is on or the host env flag is on. */
export async function diagnosticDeskEnabled(sql: Sql) {
  return (await staffAdminLoginColumn(sql)) || envDeskLoginEnabled();
}

/** Never 500s. Missing column → diagnosticDeskAuth false; secret flag stays honest. */
export async function diagnosticDeskAuthStatus(sql: Sql) {
  const secret = staffSecretConfigured();
  try {
    await ensureStaffAdminLoginColumns(sql);
    const enabled = await diagnosticDeskEnabled(sql);
    return {
      diagnosticDeskAuth: enabled,
      staffAdminLoginEnabled: enabled,
      envDeskLoginEnabled: envDeskLoginEnabled(),
      staffSecretConfigured: secret,
      staffDeskLoginEnabled: enabled && secret,
    };
  } catch {
    return {
      diagnosticDeskAuth: false,
      staffAdminLoginEnabled: false,
      envDeskLoginEnabled: envDeskLoginEnabled(),
      staffSecretConfigured: secret,
      staffDeskLoginEnabled: false,
    };
  }
}

function envFlag(key: string) {
  const v = env(key)?.toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

/** Env secret is present. Does not mean the desk login is currently enabled. */
export function staffSecretConfigured() {
  return Boolean(env("STAFF_ADMIN_PASSWORD_HASH") || env("STAFF_ADMIN_PASSWORD"));
}

/** Host kill switch. ON only for explicit Grok QA. */
export function envDeskLoginEnabled() {
  return envFlag("STAFF_ADMIN_LOGIN_ENABLED");
}

/**
 * Hash from env only. Short secrets are accepted only on the diagnostic
 * non-prod desk path. Production still requires 12+ characters or a precomputed hash.
 */
async function resolveStaffPasswordHash(diagnosticOn: boolean) {
  const existing = env("STAFF_ADMIN_PASSWORD_HASH");
  if (existing && existing.includes(":")) return existing;
  const password = env("STAFF_ADMIN_PASSWORD");
  if (!password) return null;
  if (!diagnosticOn) return null;
  if (password.length >= 12) return hashPassword(password);
  if (!isVercelProduction()) return hashPassword(password);
  return null;
}

export async function writeStaffDeskAudit(
  sql: Sql,
  input: { userId?: string; kind: "login" | "toggle-on" | "toggle-off" | "mode-on" | "mode-off"; diagnostic: boolean },
) {
  try {
    await sql.query(
      `create table if not exists staff_desk_audit (
        id text primary key,
        user_id text not null default '',
        kind text not null,
        diagnostic boolean not null default false,
        created_at timestamptz not null default now()
      )`,
    );
    await sql.query(
      `insert into staff_desk_audit (id, user_id, kind, diagnostic) values ($1,$2,$3,$4)`,
      [`sda-${randomBytes(8).toString("hex")}`, input.userId ?? "", input.kind, input.diagnostic],
    );
  } catch {
    /* audit must not block the desk */
  }
}

/**
 * Seed the desk user row, then set (or wipe) the credential from env only.
 * Never reads a password from source. Missing env or diagnostic OFF disables
 * desk password login so a previously leaked hash cannot keep working.
 */
export async function applyStaffCredential(sql: Sql) {
  const found = (
    await sql.query(`select id from "user" where id = $1 or lower(email) = $2 limit 1`, [
      STAFF_ADMIN_ID,
      STAFF_ADMIN_EMAIL,
    ])
  )[0];
  const userId = found?.id ? String(found.id) : STAFF_ADMIN_ID;
  if (!found) {
    await sql.query(
      `insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ($1,$2,$3,true,now(),now())`,
      [userId, STAFF_ADMIN_NAME, STAFF_ADMIN_EMAIL],
    );
  } else {
    await sql.query(`update "user" set name = $1, email = $2, "emailVerified" = true, "updatedAt" = now() where id = $3`, [
      STAFF_ADMIN_NAME,
      STAFF_ADMIN_EMAIL,
      userId,
    ]);
  }

  const diagnosticOn = await diagnosticDeskEnabled(sql);
  const hash = await resolveStaffPasswordHash(diagnosticOn);
  if (!hash) {
    await sql.query(`delete from account where "userId" = $1 and "providerId" = 'credential'`, [userId]);
    if (isVercelProduction()) {
      console.error(
        "[southend] staff desk login disabled — set STAFF_ADMIN_PASSWORD_HASH (preferred) or STAFF_ADMIN_PASSWORD in host secrets, and turn on Diagnostic Admin login.",
      );
    }
    return userId;
  }

  const cred = (
    await sql.query(`select id from account where "userId" = $1 and "providerId" = 'credential' limit 1`, [userId])
  )[0];
  if (cred?.id) {
    await sql.query(`update account set password = $1, "updatedAt" = now() where id = $2 and "providerId" = 'credential'`, [
      hash,
      String(cred.id),
    ]);
  } else {
    await sql.query(
      `insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       values ($1,$2,'credential',$3,$4,now(),now())`,
      [`account-${userId}`, userId, userId, hash],
    );
  }
  return userId;
}

export async function applyStaffTotpFromEnv(sql: Sql, userId: string) {
  const totp = env("STAFF_ADMIN_TOTP_SECRET");
  if (totp && totp.length >= 16) {
    await sql.query(`update profiles set totp_secret = $1, totp_enabled = true where user_id = $2`, [totp, userId]);
  }
}
