import { randomBytes } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import type { Sql } from "@/lib/db";

export class TooManyAttemptsError extends Error {
  readonly status = 429;
  constructor(message = "Too many attempts. Try again later.") {
    super(message);
    this.name = "TooManyAttemptsError";
  }
}

const memoryRef = globalThis as typeof globalThis & {
  __southendRateHits__?: Map<string, number[]>;
};

function memoryHits() {
  memoryRef.__southendRateHits__ ??= new Map();
  return memoryRef.__southendRateHits__;
}

export function requestIp(): string {
  const request = getRequest();
  if (!request) return "unknown";
  const h = request.headers;
  const raw =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("cf-connecting-ip")?.trim() ||
    "";
  return raw || "unknown";
}

async function ensureRateLimitSchema(sql: Sql) {
  await sql.query(
    `create table if not exists rate_events (
      id text primary key,
      k text not null,
      created_at timestamptz not null default now()
    )`,
  );
  await sql.query(`create index if not exists rate_events_k_created on rate_events (k, created_at)`);
}

function consumeMemory(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hits = memoryHits();
  const prev = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (prev.length >= limit) throw new TooManyAttemptsError();
  prev.push(now);
  hits.set(key, prev);
}

export async function consumeRateLimit(
  sql: Sql,
  key: string,
  limit: number,
  windowMs: number,
) {
  try {
    await ensureRateLimitSchema(sql);
    const since = new Date(Date.now() - windowMs).toISOString();
    const rows = await sql.query(`select count(*)::int as n from rate_events where k = $1 and created_at > $2`, [
      key,
      since,
    ]);
    if (Number(rows[0]?.n ?? 0) >= limit) throw new TooManyAttemptsError();
    await sql.query(`insert into rate_events (id, k, created_at) values ($1,$2,now())`, [
      `rl-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`,
      key,
    ]);
  } catch (err) {
    if (err instanceof TooManyAttemptsError) throw err;
    consumeMemory(key, limit, windowMs);
  }
}

/** Sign-in / password reset: 5 per 15 minutes, keyed by IP + email or phone. */
export async function consumeAuthAttempt(sql: Sql, identity: string) {
  const id = String(identity ?? "").trim().toLowerCase() || "unknown";
  await consumeRateLimit(sql, `auth:${requestIp()}:${id}`, 5, 15 * 60_000);
}

/** Placed tickets: 10 per 10 minutes per account. */
export async function consumeOrderAttempt(sql: Sql, accountId: string) {
  const id = String(accountId ?? "").trim() || "unknown";
  await consumeRateLimit(sql, `order:${id}`, 10, 10 * 60_000);
}

export function tooManyResponse() {
  return new Response(JSON.stringify({ message: "Too many attempts. Try again later.", code: "TOO_MANY_REQUESTS" }), {
    status: 429,
    headers: { "content-type": "application/json" },
  });
}