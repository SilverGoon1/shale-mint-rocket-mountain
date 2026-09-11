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
import { createFileRoute } from "@tanstack/react-router";
import { lineSummary, payStatusLabel } from "@/lib/ticket-line";
import { writeBotAudit, requestIp } from "@/lib/bot/audit.server";
import { agentHasScope, rateLimitBot, verifyBotBearer, type BotAgent } from "@/lib/bot/tokens.server";
import type { BotScope } from "@/lib/bot/scopes";
import { getSql, dbSource } from "@/lib/db";
import { isVercelProduction, PRODUCTION_AUTH_ORIGINS } from "@/lib/prod-guard.server";
import { diagnosticDeskAuthStatus } from "@/lib/staff-credential.server";
import { CARD_PROCESSOR_LIVE } from "@/lib/shop-types";

const KITCHEN_STATUSES = new Set(["accepted", "preparing", "ready", "out_for_delivery", "completed", "canceled"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function pathOf(request: Request) {
  try {
    return new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return "/";
  }
}

function routeKey(pathname: string) {
  return pathname.replace(/^\/api\/bot\/v1\/?/, "") || "health";
}

async function requireAgent(request: Request, scope?: BotScope): Promise<{ agent: BotAgent } | Response> {
  const agent = await verifyBotBearer(request);
  if (!agent) return json({ error: "unauthorized" }, 401);
  if (!rateLimitBot(agent.id)) return json({ error: "rate_limited" }, 429);
  if (scope && !agentHasScope(agent, scope)) return json({ error: "forbidden", scope }, 403);
  return { agent };
}

async function handle(request: Request) {
  const pathname = pathOf(request);
  const key = routeKey(pathname);
  const ip = requestIp(request);
  let agentId: string | null = null;
  let status = 200;
  const reply = (body: unknown, code = 200) => {
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
        cardProcessor: CARD_PROCESSOR_LIVE ? "live" : "disabled",
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
      let agents = { total: 0, enabled: 0 };
      let adminTotp = 0;
      try {
        const counts = await sql.query<{ n: number; enabled: number }>(
          `select count(*)::int as n, count(*) filter (where enabled)::int as enabled from bot_agents`,
        );
        agents = {
          total: Math.round(Number(counts[0]?.n) || 0),
          enabled: Math.round(Number(counts[0]?.enabled) || 0),
        };
      } catch {
        /* bot_agents may not exist yet */
      }
      try {
        const totp = await sql.query<{ n: number }>(
          `select count(*)::int as n from profiles where totp_enabled = true and role = 'admin'`,
        );
        adminTotp = Math.round(Number(totp[0]?.n) || 0);
      } catch {
        /* profiles.totp_enabled may not exist yet */
      }
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
        cardProcessor: CARD_PROCESSOR_LIVE ? "live" : "disabled",
        adminTotp,
        agents,
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
        env: isVercelProduction() ? "production" : "preview",
      });
    }

    if (request.method === "GET" && key === "auth/audit") {
      const gate = await requireAgent(request, "auth.audit.read");
      if (gate instanceof Response) {
        status = gate.status;
        return gate;
      }
      agentId = gate.agent.id;
      const sql = await getSql();
      const rows = await sql`
        select a.path, a.status, a.created_at, coalesce(b.name, '') as name
        from bot_audit a
        left join bot_agents b on b.id = a.agent_id
        order by a.created_at desc
        limit 25`;
      return reply({
        recent: rows.map((row) => ({
          path: String(row.path ?? ""),
          status: Number(row.status) || 0,
          name: String(row.name ?? ""),
          at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
        })),
      });
    }

    if (request.method === "GET" && key === "orders/recent") {
      const gate = await requireAgent(request, "orders.read");
      if (gate instanceof Response) {
        status = gate.status;
        return gate;
      }
      agentId = gate.agent.id;
      const sql = await getSql();
      const rows = await sql`
        select o.id, o.ticket_no, o.status, o.fulfillment, o.total, o.payment_method,
               o.created_at, o.scheduled_for, o.notes, o.tip, o.tax, o.subtotal, o.discount,
               o.delivery_fee, o.items, o.pickup_name,
               p.display_name, p.phone
        from orders o
        left join profiles p on p.user_id = o.user_id
        order by o.created_at desc
        limit 25`;
      return reply({
        orders: rows.map((row) => {
          const itemsRaw = row.items;
          let items: unknown[] = [];
          if (Array.isArray(itemsRaw)) items = itemsRaw;
          else if (typeof itemsRaw === "string") {
            try {
              const parsed = JSON.parse(itemsRaw);
              if (Array.isArray(parsed)) items = parsed;
            } catch {
              items = [];
            }
          }
          let itemCount = 0;
          const bits: string[] = [];
          for (const raw of items) {
            const it = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
            const qty = Math.max(1, Math.round(Number(it.qty) || 1));
            itemCount += qty;
            bits.push(lineSummary({
              qty,
              name: String(it.name ?? ""),
              size: String(it.size ?? ""),
              detail: String(it.detail ?? ""),
              comment: String(it.comment ?? ""),
            }));
          }
          const money = (v: unknown) => {
            if (v === null || v === undefined || v === "") return null;
            return String(v);
          };
          const tip = money(row.tip);
          const tax = money(row.tax);
          const subtotal = money(row.subtotal);
          const discountRaw = money(row.discount);
          const deliveryFeeRaw = money(row.delivery_fee);
          const notesRaw = row.notes;
          const notes =
            notesRaw === null || notesRaw === undefined
              ? null
              : String(notesRaw).trim() || null;
          const pickupName = String(row.pickup_name ?? "").trim() || null;
          const pickupPhone = String(row.phone ?? "").trim() || null;
          const customerName =
            pickupName ||
            String(row.display_name ?? "").trim() ||
            "Guest";
          const promisedEta = row.scheduled_for
            ? row.scheduled_for instanceof Date
              ? row.scheduled_for.toISOString()
              : String(row.scheduled_for)
            : null;
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
            deliveryFee: deliveryFeeRaw && Number(deliveryFeeRaw) > 0 ? deliveryFeeRaw : null,
          };
        }),
      });
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
        categories: cats.map((c) => ({ id: String(c.id), name: String(c.name ?? ""), kind: String(c.kind ?? "") })),
        items: items.map((it) => ({
          id: String(it.id),
          categoryId: String(it.category_id ?? ""),
          name: String(it.name ?? ""),
        })),
      });
    }

    if (request.method === "GET" && key === "payments") {
      const gate = await requireAgent(request, "payments.read");
      if (gate instanceof Response) {
        status = gate.status;
        return gate;
      }
      agentId = gate.agent.id;
      const sql = await getSql();
      const row = (
        await sql.query<{ n: number; collected: string; outstanding: string }>(
          `select count(*) filter (where status not in ('canceled', 'awaiting_payment'))::int as n,
                  coalesce(sum(total) filter (where status not in ('canceled', 'awaiting_payment')), 0)::text as collected,
                  coalesce(sum(total) filter (where status = 'awaiting_payment'), 0)::text as outstanding
           from orders`,
        )
      )[0];
      return reply({
        processor: CARD_PROCESSOR_LIVE ? "live" : "disabled",
        tickets: Math.round(Number(row?.n) || 0),
        collected: row?.collected ?? "0",
        outstanding: row?.outstanding ?? "0",
      });
    }

    if (request.method === "POST" && key === "orders/status") {
      const gate = await requireAgent(request, "orders.update_status");
      if (gate instanceof Response) {
        status = gate.status;
        return gate;
      }
      agentId = gate.agent.id;
      const body = (await request.json().catch(() => ({}))) as { id?: string; status?: string };
      const id = String(body.id ?? "").trim();
      const next = String(body.status ?? "").trim();
      if (!id) return reply({ error: "missing_id" }, 400);
      if (!KITCHEN_STATUSES.has(next)) return reply({ error: "invalid_status" }, 400);
      const sql = await getSql();
      const existing = await sql.query(
        `select id, ticket_no, status from orders where id = $1`,
        [id],
      );
      if (!existing[0]) return reply({ error: "not_found" }, 404);
      const current = String(existing[0].status ?? "");
      const pastAccepted = new Set(["accepted", "preparing", "ready", "out_for_delivery", "completed"]);
      const pastPreparing = new Set(["preparing", "ready", "out_for_delivery", "completed"]);
      // Idempotent accept/preparing: already there (or further) → 200 current state, no error spam.
      if (next === "accepted" && pastAccepted.has(current)) {
        return reply({
          ok: true,
          id: String(existing[0].id),
          ticketNo: Math.round(Number(existing[0].ticket_no) || 0),
          status: current,
        });
      }
      if (next === "preparing" && pastPreparing.has(current)) {
        return reply({
          ok: true,
          id: String(existing[0].id),
          ticketNo: Math.round(Number(existing[0].ticket_no) || 0),
          status: current,
        });
      }
      const updated = await sql.query(
        `update orders set status = $1, accepted_at = case when $1 in ('accepted','preparing') then coalesce(accepted_at, now()) else accepted_at end
         where id = $2 returning id, ticket_no, status`,
        [next, id],
      );
      if (!updated[0]) return reply({ error: "not_found" }, 404);
      return reply({
        ok: true,
        id: String(updated[0].id),
        ticketNo: Math.round(Number(updated[0].ticket_no) || 0),
        status: String(updated[0].status ?? next),
      });
    }

    return reply({ error: "not_found" }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    if (/Production requires DATABASE_URL/i.test(message)) return reply({ error: "neon_required" }, 503);
    console.error("[southend] bot api", err);
    return reply({ error: "server_error" }, 500);
  } finally {
    void writeBotAudit({ agentId, path: pathname, status, ip });
  }
}

export const Route = createFileRoute("/api/bot/v1/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
