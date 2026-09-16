import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatShopDay, nyYmd } from "@/lib/hours";
import type { OrderView } from "@/lib/shop-types";

export function groupOrdersByDay(orders: OrderView[]) {
  const map = new Map<string, OrderView[]>();
  for (const o of orders) {
    const key = o.createdAt ? nyYmd(new Date(o.createdAt)) : "unknown";
    const list = map.get(key) ?? [];
    list.push(o);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, list]) => ({
      key,
      label: key === "unknown" ? "Unknown date" : formatShopDay(list[0]?.createdAt ?? ""),
      orders: list,
    }));
}

export function OrderDateTrays({
  orders,
  empty = "No tickets yet.",
  openTicket,
  children,
}: {
  orders: OrderView[];
  empty?: string;
  openTicket?: string | number;
  children: (order: OrderView) => ReactNode;
}) {
  const groups = useMemo(() => groupOrdersByDay(orders), [orders]);
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!groups.length) return;
    const want = String(openTicket ?? "").replace(/\D/g, "");
    let key = groups[0].key;
    if (want) {
      const hit = groups.find((g) =>
        g.orders.some((o) => String(o.ticketNo ?? "").replace(/\D/g, "") === want),
      );
      if (hit) key = hit.key;
    }
    setOpen(new Set([key]));
    const id = window.requestAnimationFrame(() => {
      if (!want) return;
      const el = document.querySelector(`[data-ticket="${want}"]`);
      if (el instanceof HTMLElement) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [groups, openTicket]);

  if (groups.length === 0) return <p className="ed-empty">{empty}</p>;

  return (
    <ul className="order-trays">
      {groups.map((g) => {
        const shown = open.has(g.key);
        return (
          <li key={g.key} className="order-tray" data-open={shown}>
            <button
              type="button"
              className="order-tray-head"
              aria-expanded={shown}
              onClick={() =>
                setOpen((cur) => {
                  if (cur.has(g.key)) return new Set();
                  return new Set([g.key]);
                })
              }
            >
              <span>
                <strong>{g.label}</strong>
                <em>
                  {g.orders.length} ticket{g.orders.length === 1 ? "" : "s"}
                </em>
              </span>
              {shown ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
            </button>
            {shown ? <ul className="order-tray-list">{g.orders.map((o) => children(o))}</ul> : null}
          </li>
        );
      })}
    </ul>
  );
}
