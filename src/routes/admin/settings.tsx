import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CustomersPanel } from "@/components/customers-panel";
import { SaveToast, useSaveFlash } from "@/components/save-toast";
import { getAdminInsights, listAllOrders, listCustomers } from "@/lib/shop-server";
import {
  formatUsd,
  formatTicketNo,
  type AdminInsights,
  type CustomerRecord,
  type OrderView,
} from "@/lib/shop-types";

export const Route = createFileRoute("/admin/settings")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => {
    const tab = typeof search.tab === "string" ? search.tab : undefined;
    return tab ? { tab } : {};
  },
  component: AdminSettingsGate,
});

function AdminSettingsGate() {
  const { tab } = Route.useSearch();
  if (tab === "customers") return <Navigate to="/admin/center" search={{ tab: "customers" }} />;
  if (tab === "financials") return <Navigate to="/admin/financials" />;
  if (tab === "rewards") return <Navigate to="/admin/center" search={{ tab: "rewards" }} />;
  if (tab === "printers") return <Navigate to="/admin/menu" search={{ tab: "printers" }} />;
  return <Navigate to="/admin/background" />;
}

export const EMPTY_INSIGHTS: AdminInsights = {
  customers: { total: 0, new7d: 0, twoFactor: 0, avgPoints: 0, repeat: 0, top: [] },
  sales: {
    today: 0,
    week: 0,
    month: 0,
    allTime: 0,
    tickets: 0,
    avgTicket: 0,
    canceled: 0,
    series: [],
    topItems: [],
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
    byPay: [],
  },
};

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const { toast, flashOk, flashFail } = useSaveFlash();

  useEffect(() => {
    void listCustomers()
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, []);

  function setMsg(s: string) {
    if (/could not|not save|failed/i.test(s)) flashFail(s);
    else flashOk(true);
  }

  return (
    <div className="settings-page">
      <SaveToast toast={toast} />
      <header className="page-card">
        <p className="shop-brand-kicker">Admin</p>
        <h1>Customers</h1>
        <p className="ed-sub">The customer book. Grant admin or ban an account here.</p>
      </header>
      <CustomersPanel customers={customers} setCustomers={setCustomers} onMsg={setMsg} />
    </div>
  );
}

export function AdminFinancialsPage() {
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [orders, setOrders] = useState<OrderView[]>([]);

  useEffect(() => {
    void getAdminInsights()
      .then(setInsights)
      .catch(() => setInsights(EMPTY_INSIGHTS));
    void listAllOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  const insightsView = insights ?? EMPTY_INSIGHTS;

  return (
    <div className="settings-page finance-page">
      <header className="page-card">
        <p className="shop-brand-kicker">Admin</p>
        <h1>Financials</h1>
        <p className="ed-sub">Sales and recent tickets.</p>
      </header>
      <SalesPanel insights={insightsView} orders={orders} />
    </div>
  );
}

export function AnalyticsPanel({ insights }: { insights: AdminInsights }) {
  const c = insights.customers;
  return (
    <section className="page-card">
      <h2>Customer analytics</h2>
      <div className="kpi-grid">
        <Kpi label="Customers" value={String(c.total)} />
        <Kpi label="New (7d)" value={String(c.new7d)} />
        <Kpi label="Repeat" value={String(c.repeat)} />
        <Kpi label="Avg points" value={String(c.avgPoints)} />
      </div>
      <p className="ed-sub">{c.twoFactor} accounts have two-factor on.</p>
      {c.top.length ? (
        <>
          <h3 className="settings-subhead">Top guests</h3>
          <ul className="rank-list">
            {c.top.map((row) => (
              <li key={row.userId}>
                <span>
                  {row.name}{" "}
                  <em>
                    {row.orders} orders · {row.points} pts
                  </em>
                </span>
                <strong>{formatUsd(row.spend)}</strong>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function ticketSearchHay(o: OrderView) {
  const no = formatTicketNo(o.ticketNo);
  const n = String(Math.round(Number(o.ticketNo) || 0));
  return `${no} ${n} ${no.replace(/^0+/, "") || "0"}`;
}

function SalesPanel({ insights, orders }: { insights: AdminInsights; orders: OrderView[] }) {
  const s = insights.sales;
  const [ticketQuery, setTicketQuery] = useState("");
  const tickets = useMemo(() => {
    const q = ticketQuery.trim().replace(/^#/, "").replace(/\s/g, "");
    if (!q) return orders.slice(0, 20);
    const needle = q.toLowerCase();
    const compact = needle.replace(/^0+/, "") || "0";
    return orders.filter((o) => {
      const hay = ticketSearchHay(o).toLowerCase();
      return hay.includes(needle) || hay.includes(compact);
    });
  }, [orders, ticketQuery]);

  return (
    <>
      <section className="page-card">
        <h2>Sales</h2>
        <div className="kpi-grid">
          <Kpi label="Month" value={formatUsd(s.month)} />
          <Kpi label="All time" value={formatUsd(s.allTime)} />
          <Kpi label="Avg ticket" value={formatUsd(s.avgTicket)} />
          <Kpi label="Tickets" value={String(s.tickets)} />
        </div>
        {s.series.length ? (
          <div className="chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-studio-line)" />
                <XAxis dataKey="day" tick={{ fill: "var(--color-studio-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--color-studio-muted)", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--color-tomato)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="ed-empty">No sales yet.</p>
        )}
        {s.topItems.length ? (
          <>
            <h3 className="settings-subhead">Top items</h3>
            <ul className="rank-list">
              {s.topItems.map((it) => (
                <li key={it.name}>
                  <span>
                    {it.name} <em>{it.qty} sold</em>
                  </span>
                  <strong>{formatUsd(it.sales)}</strong>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
      <section className="page-card">
        <h2>Recent tickets</h2>
        <label className="ed-field">
          <span>Search ticket number</span>
          <input
            className="ed-input"
            value={ticketQuery}
            onChange={(e) => setTicketQuery(e.target.value)}
            placeholder="e.g. 42 or 000042"
            inputMode="numeric"
            autoComplete="off"
            aria-label="Search ticket number"
          />
        </label>
        {tickets.length === 0 ? (
          <p className="ed-empty">{ticketQuery.trim() ? "No tickets match that number." : "No tickets yet."}</p>
        ) : (
          <div className="table-wrap">
            <table className="plain-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>When</th>
                  <th>Name</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Customer</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((o) => (
                  <tr key={o.id}>
                    <td>#{formatTicketNo(o.ticketNo)}</td>
                    <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}</td>
                    <td>{o.pickupName || "Guest"}</td>
                    <td>{formatUsd(o.total)}</td>
                    <td>{o.status.replaceAll("_", " ")}</td>
                    <td>
                      {o.userId ? (
                        <Link to="/admin/center" search={{ tab: "customers", customer: o.userId }} className="ed-btn">
                          Profile
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
