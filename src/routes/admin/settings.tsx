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
import { deleteOrder, getAdminInsights, listAllOrders, listTaxExport, listCustomers, voidOrder } from "@/lib/shop-server";
import { downloadTaxXls, taxExportGlance } from "@/lib/completed-orders-xls";
import {
  formatUsd,
  formatTicketNo,
  payMethodLabel,
  type AdminInsights,
  type CustomerRecord,
  type OrderView,
} from "@/lib/shop-types";
import { nyYmd } from "@/lib/hours";

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

type PeriodId = "today" | "month" | "quarter" | "year" | "all" | "custom";

function lastDayYmd(year: number, month: number) {
  const last = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

function periodRange(id: PeriodId, customFrom: string, customTo: string) {
  const today = nyYmd();
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  if (id === "today") return { from: today, to: today };
  if (id === "month") return { from: `${year}-${String(month).padStart(2, "0")}-01`, to: lastDayYmd(year, month) };
  if (id === "quarter") {
    const start = Math.floor((month - 1) / 3) * 3 + 1;
    return { from: `${year}-${String(start).padStart(2, "0")}-01`, to: lastDayYmd(year, start + 2) };
  }
  if (id === "year") return { from: `${year}-01-01`, to: `${year}-12-31` };
  if (id === "all") return { from: "", to: "" };
  return { from: customFrom, to: customTo };
}

export function AdminFinancialsPage() {
  const [insights, setInsights] = useState<AdminInsights | null>(null);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportErr, setExportErr] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [voidingId, setVoidingId] = useState("");
  const [period, setPeriod] = useState<PeriodId>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [includeOpenPaid, setIncludeOpenPaid] = useState(true);
  const [includeVoids, setIncludeVoids] = useState(false);
  const [glance, setGlance] = useState({ taxable: 0, tax: 0, count: 0 });
  const [glanceTick, setGlanceTick] = useState(0);

  const range = periodRange(period, customFrom, customTo);

  function reload() {
    void getAdminInsights()
      .then(setInsights)
      .catch(() => setInsights(EMPTY_INSIGHTS));
    void listAllOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (period === "custom" && (!range.from || !range.to)) {
      setGlance({ taxable: 0, tax: 0, count: 0 });
      return;
    }
    void listTaxExport({
      data: {
        from: range.from || undefined,
        to: range.to || undefined,
        includeOpenPaid,
        includeVoids: false,
      },
    })
      .then((pack) => setGlance(taxExportGlance(pack.tickets)))
      .catch(() => setGlance({ taxable: 0, tax: 0, count: 0 }));
  }, [period, customFrom, customTo, includeOpenPaid, range.from, range.to, glanceTick]);

  async function exportTax() {
    setExportErr("");
    if (period === "custom" && (!range.from || !range.to)) {
      setExportErr("Pick a from and to date for a custom range.");
      return;
    }
    setExporting(true);
    try {
      const pack = await listTaxExport({
        data: {
          from: range.from || undefined,
          to: range.to || undefined,
          includeOpenPaid,
          includeVoids,
        },
      });
      if (!pack.tickets.length && !(includeVoids && pack.voids.length)) {
        setExportErr("No tickets in that range.");
        return;
      }
      downloadTaxXls({
        tickets: pack.tickets,
        voids: pack.voids,
        taxRate: pack.taxRate,
        taxId: pack.taxId,
        from: pack.from || range.from || "all",
        to: pack.to || range.to || nyYmd(),
        includeVoids,
      });
    } catch (err) {
      setExportErr(err instanceof Error ? err.message : "Could not export the tax spreadsheet.");
    } finally {
      setExporting(false);
    }
  }

  async function voidTicket(id: string, ticketNo: number) {
    const label = formatTicketNo(ticketNo);
    if (!window.confirm(`Void ticket #${label}? It stays in the books as a void and drops out of tax totals.`)) return;
    setVoidingId(id);
    setExportErr("");
    try {
      const res = await voidOrder({ data: { id } });
      setOrders((list) => list.map((o) => (o.id === id ? res.order : o)));
      setGlanceTick((n) => n + 1);
      void getAdminInsights()
        .then(setInsights)
        .catch(() => undefined);
    } catch (err) {
      setExportErr(err instanceof Error ? err.message : "Could not void that ticket.");
    } finally {
      setVoidingId("");
    }
  }

  async function removeTicket(id: string, ticketNo: number) {
    const label = formatTicketNo(ticketNo);
    const typed = window.prompt(`Type ${label} to permanently delete this ticket.`);
    if (typed == null) return;
    if (typed.trim() !== label) {
      setExportErr(`Delete canceled — type ${label} exactly.`);
      return;
    }
    setDeletingId(id);
    setExportErr("");
    try {
      await deleteOrder({ data: { id } });
      setOrders((list) => list.filter((o) => o.id !== id));
      setGlanceTick((n) => n + 1);
      void getAdminInsights()
        .then(setInsights)
        .catch(() => undefined);
    } catch (err) {
      setExportErr(err instanceof Error ? err.message : "Could not delete that ticket.");
    } finally {
      setDeletingId("");
    }
  }

  const insightsView = insights ?? EMPTY_INSIGHTS;
  const periodLabel = range.from && range.to ? `${range.from} to ${range.to}` : "all time";

  return (
    <div className="settings-page finance-page">
      <header className="page-card finance-head">
        <div>
          <p className="shop-brand-kicker">Admin</p>
          <h1>Financials</h1>
          <p className="ed-sub">Sales, NJ sales tax, and tickets. Void stays in the books. Export is a tax spreadsheet for your accountant.</p>
        </div>
        <div className="finance-export">
          <div className="seg" role="group" aria-label="Export period">
            {(
              [
                ["today", "Today"],
                ["month", "This month"],
                ["quarter", "This quarter"],
                ["year", "This year"],
                ["all", "All time"],
                ["custom", "Custom"],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" data-on={period === id} onClick={() => setPeriod(id)}>
                {label}
              </button>
            ))}
          </div>
          {period === "custom" ? (
            <div className="two-col">
              <label className="ed-field">
                <span>From</span>
                <input className="ed-input" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              </label>
              <label className="ed-field">
                <span>To</span>
                <input className="ed-input" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </label>
            </div>
          ) : null}
          <label className="pay-opt">
            <input type="checkbox" checked={includeOpenPaid} onChange={(e) => setIncludeOpenPaid(e.target.checked)} />
            Include completed and accepted/paid tickets
          </label>
          <label className="pay-opt">
            <input type="checkbox" checked={includeVoids} onChange={(e) => setIncludeVoids(e.target.checked)} />
            Include voids / canceled
          </label>
          <button type="button" className="btn-print" disabled={exporting} onClick={() => void exportTax()}>
            {exporting ? "Building spreadsheet…" : "Export tax spreadsheet"}
          </button>
          <p className="ed-sub">
            {periodLabel}: taxable sales {formatUsd(glance.taxable)} · tax collected {formatUsd(glance.tax)}
            {glance.count ? ` · ${glance.count} tickets` : ""}
          </p>
        </div>
      </header>
      {exportErr ? <p className="form-error">{exportErr}</p> : null}
      <SalesPanel
        insights={insightsView}
        orders={orders}
        deletingId={deletingId}
        voidingId={voidingId}
        onDelete={removeTicket}
        onVoid={voidTicket}
      />
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

function SalesPanel({
  insights,
  orders,
  deletingId,
  voidingId,
  onDelete,
  onVoid,
}: {
  insights: AdminInsights;
  orders: OrderView[];
  deletingId: string;
  voidingId: string;
  onDelete: (id: string, ticketNo: number) => void;
  onVoid: (id: string, ticketNo: number) => void;
}) {
  const s = insights.sales;
  const [ticketQuery, setTicketQuery] = useState("");
  const [visible, setVisible] = useState(50);
  const filtered = useMemo(() => {
    const q = ticketQuery.trim().replace(/^#/, "").replace(/\s/g, "");
    if (!q) return orders;
    const needle = q.toLowerCase();
    const compact = needle.replace(/^0+/, "") || "0";
    return orders.filter((o) => {
      const hay = ticketSearchHay(o).toLowerCase();
      return hay.includes(needle) || hay.includes(compact);
    });
  }, [orders, ticketQuery]);
  const tickets = ticketQuery.trim() ? filtered : filtered.slice(0, visible);

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
        <div className="kpi-grid">
          <Kpi label="Food" value={formatUsd(insights.financials.food)} />
          <Kpi label="Sales tax" value={formatUsd(insights.financials.tax)} />
          <Kpi label="Tips" value={formatUsd(insights.financials.tips)} />
          <Kpi label="Collected" value={formatUsd(insights.financials.collected)} />
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
                  <th>Food</th>
                  <th>Tax</th>
                  <th>Tip</th>
                  <th>Total</th>
                  <th>Pay</th>
                  <th>Status</th>
                  <th>Customer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((o) => (
                  <tr key={o.id}>
                    <td>#{formatTicketNo(o.ticketNo)}</td>
                    <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}</td>
                    <td>{o.pickupName || "Guest"}</td>
                    <td>{formatUsd(o.subtotal)}</td>
                    <td>{formatUsd(o.tax)}</td>
                    <td>{formatUsd(o.tip)}</td>
                    <td>{formatUsd(o.total)}</td>
                    <td>{payMethodLabel(o.paymentMethod)}</td>
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
                    <td className="ticket-actions">
                      {o.status !== "canceled" ? (
                        <button
                          type="button"
                          className="ed-btn ed-btn-quiet"
                          disabled={voidingId === o.id || deletingId === o.id}
                          onClick={() => onVoid(o.id, o.ticketNo)}
                        >
                          {voidingId === o.id ? "Voiding…" : "Void"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="ed-btn ed-btn-quiet ticket-del"
                        disabled={deletingId === o.id || voidingId === o.id}
                        onClick={() => onDelete(o.id, o.ticketNo)}
                      >
                        {deletingId === o.id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!ticketQuery.trim() && filtered.length > visible ? (
          <button type="button" className="ed-btn" onClick={() => setVisible((n) => n + 50)}>
            Show more
          </button>
        ) : null}
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
