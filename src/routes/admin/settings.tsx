import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
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
  payMethodLabel,
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
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const { toast, flashOk, flashFail } = useSaveFlash();

  useEffect(() => {
    void getAdminInsights()
      .then(setInsights)
      .catch(() => setInsights(EMPTY_INSIGHTS));
    void listCustomers()
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, []);

  function setMsg(s: string) {
    if (/could not|not save|failed/i.test(s)) flashFail(s);
    else flashOk(true);
  }

  const insightsView = insights ?? EMPTY_INSIGHTS;

  return (
    <div className="settings-page">
      <SaveToast toast={toast} />
      <header className="page-card">
        <p className="shop-brand-kicker">Admin</p>
        <h1>Customers</h1>
        <p className="ed-sub">Ledger, analytics, and the customer book. Grant admin or ban an account here.</p>
      </header>
      <AnalyticsPanel insights={insightsView} />
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
        <p className="ed-sub">
          Today, this week, and tips live here — the till mix, tax, and ticket history follow. Tips stay off the New
          Jersey sales-tax line.
        </p>
      </header>
      <div className="kpi-grid kpi-hero">
        <Kpi label="Today" value={formatUsd(insightsView.sales.today)} />
        <Kpi label="This week" value={formatUsd(insightsView.sales.week)} />
        <Kpi label="Tips" value={formatUsd(insightsView.financials.tips)} />
        <Kpi label="Collected" value={formatUsd(insightsView.financials.collected)} />
        <Kpi label="Outstanding" value={formatUsd(insightsView.financials.awaitingPayment)} />
      </div>
      <FinancialsPanel insights={insightsView} />
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

function FinancialsPanel({ insights }: { insights: AdminInsights }) {
  const f = insights.financials;
  const s = insights.sales;
  return (
    <>
      <div className="kpi-grid">
        <Kpi label="Food" value={formatUsd(f.food)} />
        <Kpi label="Tax collected" value={formatUsd(f.tax)} />
        <Kpi label="Discounts" value={formatUsd(f.discounts)} />
        <Kpi label="Delivery fees" value={formatUsd(f.deliveryFees)} />
      </div>
      <section className="page-card">
        <h2>Till mix</h2>
        <div className="mix-track" aria-hidden>
          <span className="mix-seg mix-food" style={{ flexGrow: Math.max(f.food, 0), flexBasis: 0 }} />
          <span className="mix-seg mix-tax" style={{ flexGrow: Math.max(f.tax, 0), flexBasis: 0 }} />
          <span className="mix-seg mix-fee" style={{ flexGrow: Math.max(f.deliveryFees, 0), flexBasis: 0 }} />
          <span className="mix-seg mix-disc" style={{ flexGrow: Math.max(f.discounts, 0), flexBasis: 0 }} />
        </div>
        <p className="mix-legend ed-sub">Tomato is food · cream is tax · muted is delivery fees · dark is discounts</p>
        <dl className="totals">
          <div>
            <dt>Food (before tax)</dt>
            <dd>{formatUsd(f.food)}</dd>
          </div>
          <div>
            <dt>Tips (not taxed)</dt>
            <dd>{formatUsd(f.tips)}</dd>
          </div>
          <div>
            <dt>Pickup</dt>
            <dd>{formatUsd(f.pickup)}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>{formatUsd(f.delivery)}</dd>
          </div>
          <div>
            <dt>Awaiting card</dt>
            <dd>{formatUsd(f.awaitingPayment)}</dd>
          </div>
          <div>
            <dt>Canceled tickets</dt>
            <dd>{s.canceled}</dd>
          </div>
          <div>
            <dt>Tickets counted</dt>
            <dd>{s.tickets}</dd>
          </div>
        </dl>
        <h3 className="settings-subhead">Payment mix</h3>
        {f.byPay.length === 0 ? (
          <p className="ed-empty">No payments yet.</p>
        ) : (
          <ul className="rank-list">
            {f.byPay.map((p) => (
              <li key={p.method}>
                <span>
                  {payMethodLabel(p.method)} <em>{p.count} tickets</em>
                </span>
                <strong>{formatUsd(p.total)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function SalesPanel({ insights, orders }: { insights: AdminInsights; orders: OrderView[] }) {
  const s = insights.sales;
  const recent = useMemo(() => orders.slice(0, 12), [orders]);
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
        {recent.length === 0 ? (
          <p className="ed-empty">No tickets yet.</p>
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
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td>#{formatTicketNo(o.ticketNo)}</td>
                    <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}</td>
                    <td>{o.pickupName || "Guest"}</td>
                    <td>{formatUsd(o.total)}</td>
                    <td>{o.status.replaceAll("_", " ")}</td>
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
