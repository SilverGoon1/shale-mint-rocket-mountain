import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Minus, Plus, Search, UserRound, X } from "lucide-react";
import { printOrderReceipts } from "@/lib/bluetooth-printer";
import { useDialogLock } from "@/lib/dialog-lock";
import { deleteOrder, getAdminShop, listPosOrders, patchPosOrder, updateOrderStatus } from "@/lib/shop-server";
import { formatShopWhen } from "@/lib/hours";
import { isTransientFetchError, isUnauthorizedError } from "@/lib/fetch-retry";
import { onVisibleInterval } from "@/lib/page-visible";
import {
  formatTicketNo,
  formatUsd,
  type OrderItem,
  type PosTicket,
  type PrinterProfile,
  type ReceiptOptions,
  DEFAULT_RECEIPT_OPTIONS,
} from "@/lib/shop-types";
import type { MenuCategory, MenuItem, RestaurantInfo } from "@/data/menu";
import { RESTAURANT } from "@/data/menu";
import { POS_ACCEPTED_EVENT } from "@/components/incoming-order-queue";
import { PosStaffToast, type PosStaffToastState } from "@/components/pos-staff-toast";
import { formatAcceptedToast, formatCompletedToast, POS_TOAST_MS } from "@/lib/pos-toast";

export const Route = createFileRoute("/admin/pos")({
  validateSearch: (search: Record<string, unknown>): { ticket?: string } => {
    const ticket = typeof search.ticket === "string" ? search.ticket : undefined;
    return ticket ? { ticket } : {};
  },
  component: AdminPos,
});

const POS_STATUSES = [
  { id: "placed", label: "Placed" },
  { id: "accepted", label: "Accepted" },
  { id: "completed", label: "Completed" },
] as const;

type PosBucket = (typeof POS_STATUSES)[number]["id"];

function posBucket(status: string): PosBucket {
  if (status === "completed") return "completed";
  if (status === "placed" || status === "awaiting_payment" || status === "canceled") return "placed";
  return "accepted";
}

function posStamp(status: string) {
  if (status === "awaiting_payment") return { tone: "unpaid", label: "unpaid" };
  if (status === "canceled") return { tone: "placed", label: "canceled" };
  const bucket = posBucket(status);
  return { tone: bucket, label: bucket };
}

function priceNum(p: string) {
  const n = Number(String(p).replace(/^\$/, ""));
  return Number.isFinite(n) ? n : 0;
}

function ticketWhere(t: PosTicket) {
  return t.fulfillment === "delivery"
    ? `${t.addressLine}${t.city ? `, ${t.city}` : ""} ${t.zip}`.trim()
    : "Pickup at 443 Zion Rd";
}

function PosTicketDialog({
  ticket,
  itemQuery,
  menuHits,
  busyId,
  statusBusy,
  statusError,
  authLost,
  onClose,
  onQuery,
  onStatus,
  onSaveItems,
  onReprint,
  onDelete,
}: {
  ticket: PosTicket;
  itemQuery: string;
  menuHits: { cat: MenuCategory; item: MenuItem }[];
  busyId: string;
  statusBusy: string;
  statusError: string;
  authLost?: boolean;
  onClose: () => void;
  onQuery: (q: string) => void;
  onStatus: (status: string) => void;
  onSaveItems: (items: OrderItem[]) => void;
  onReprint: () => void;
  onDelete?: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const bucket = posBucket(ticket.status);
  const where = ticketWhere(ticket);
  useDialogLock(onClose, panelRef);

  return (
    <div className="pizza-modal-root pos-ticket-root" role="presentation">
      <button type="button" className="pizza-modal-scrim" aria-label="Close ticket" onClick={onClose} />
      <div
        ref={panelRef}
        className="pizza-modal pos-ticket-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="pizza-modal-head">
          <div>
            <p className="shop-brand-kicker">Ticket #{formatTicketNo(ticket.ticketNo)}</p>
            <h2 id={titleId}>{ticket.customerName}</h2>
            <p className="ed-sub pos-ticket-where">
              {ticket.fulfillment === "delivery" ? "Delivery" : "Pickup"}
              {where ? ` — ${where}` : ""}
            </p>
            {ticket.scheduledFor || ticket.customerPhone ? (
              <p className="ed-sub">
                {ticket.scheduledFor ? formatShopWhen(ticket.scheduledFor) : ""}
                {ticket.scheduledFor && ticket.customerPhone ? " · " : ""}
                {ticket.customerPhone || ""}
              </p>
            ) : null}
          </div>
          <button type="button" className="ed-icon-btn" aria-label="Close ticket" onClick={onClose}>
            <X size={16} strokeWidth={2.2} />
          </button>
        </header>

        <fieldset className="pos-quick-status" role="group" aria-label="Ticket status">
          <legend>Status</legend>
          {POS_STATUSES.map((s) => (
            <button
              key={s.id}
              type="button"
              data-on={bucket === s.id}
              data-tone={s.id}
              disabled={
                Boolean(authLost) ||
                Boolean(statusBusy) ||
                (s.id === "accepted" && (bucket === "accepted" || bucket === "completed")) ||
                (s.id === bucket && s.id !== "completed")
              }
              onClick={() => onStatus(s.id)}
            >
              {s.id === "completed" && statusBusy === "completed" ? "Completing…" : s.label}
            </button>
          ))}
        </fieldset>
        {statusError ? <p className="form-error">{statusError}</p> : null}

        <section className="pos-ticket-items" aria-label="Order items">
          <ul className="cart-lines pos-edit-lines">
            {ticket.items.map((it, i) => (
              <li key={`${it.itemId}-${i}`}>
                <span>
                  {it.name}
                  {it.size ? ` · ${it.size}` : ""}
                  {it.detail ? ` · ${it.detail}` : ""}
                  {it.comment ? <span className="cook-note">{it.comment}</span> : null}
                  <em className="cart-line-price">{formatUsd(it.unitPrice * it.qty)}</em>
                </span>
                <span className="qty-step">
                  <button
                    type="button"
                    aria-label="Remove one"
                    disabled={ticket.items.length === 1 && it.qty <= 1}
                    onClick={() => {
                      const next = ticket.items
                        .map((row, idx) => (idx === i ? { ...row, qty: row.qty - 1 } : row))
                        .filter((row) => row.qty > 0);
                      onSaveItems(next);
                    }}
                  >
                    <Minus size={16} strokeWidth={2.4} />
                  </button>
                  <strong>{it.qty}</strong>
                  <button
                    type="button"
                    aria-label="Add one"
                    onClick={() => {
                      const next = ticket.items.map((row, idx) => (idx === i ? { ...row, qty: row.qty + 1 } : row));
                      onSaveItems(next);
                    }}
                  >
                    <Plus size={16} strokeWidth={2.4} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <label className="ed-field pos-item-search">
          <span>Add an item</span>
          <span className="cat-search">
            <Search size={16} strokeWidth={2.2} aria-hidden />
            <input
              value={itemQuery}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search the menu"
              aria-label="Search menu items to add"
              autoComplete="off"
            />
          </span>
        </label>
        {itemQuery.trim() ? (
          <ul className="cat-suggest pos-item-hits" role="listbox" aria-label="Menu items">
            {menuHits.length === 0 ? (
              <li className="cat-suggest-empty">No matches for “{itemQuery.trim()}”.</li>
            ) : (
              menuHits.map((hit) => {
                const first = hit.item.prices[0];
                const unit = priceNum(first?.price ?? "0");
                return (
                  <li key={`${hit.cat.id}-${hit.item.id ?? hit.item.name}`}>
                    <button
                      type="button"
                      onClick={() => {
                        const add: OrderItem = {
                          itemId: hit.item.id ?? hit.item.name,
                          categoryId: hit.cat.id,
                          name: hit.item.name,
                          size: first?.label,
                          unitPrice: unit,
                          qty: 1,
                        };
                        const existing = ticket.items.findIndex(
                          (row) =>
                            row.itemId === add.itemId && row.size === add.size && !row.detail && !row.comment,
                        );
                        const next =
                          existing >= 0
                            ? ticket.items.map((row, idx) => (idx === existing ? { ...row, qty: row.qty + 1 } : row))
                            : [...ticket.items, add];
                        onSaveItems(next);
                        onQuery("");
                      }}
                    >
                      <strong>{hit.item.name}</strong>
                      <em>
                        {hit.cat.name}
                        {first?.label ? ` · ${first.label}` : ""} · {formatUsd(unit)}
                      </em>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}

        {ticket.notes ? (
          <p className="pos-notes">
            <strong>Notes</strong> {ticket.notes}
          </p>
        ) : null}

        <dl className="totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatUsd(ticket.subtotal)}</dd>
          </div>
          {ticket.discount ? (
            <div>
              <dt>Rewards</dt>
              <dd>−{formatUsd(ticket.discount)}</dd>
            </div>
          ) : null}
          {ticket.deliveryFee ? (
            <div>
              <dt>Delivery</dt>
              <dd>{formatUsd(ticket.deliveryFee)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Tax</dt>
            <dd>{formatUsd(ticket.tax)}</dd>
          </div>
          {ticket.tip ? (
            <div>
              <dt>Tip</dt>
              <dd>{formatUsd(ticket.tip)}</dd>
            </div>
          ) : null}
          <div className="totals-grand">
            <dt>Total</dt>
            <dd>{formatUsd(ticket.total)}</dd>
          </div>
        </dl>

        <div className="order-actions pos-ticket-actions">
          <button type="button" className="ed-btn" disabled={busyId === ticket.id} onClick={onReprint}>
            {busyId === ticket.id ? "Printing…" : "Reprint"}
          </button>
          {ticket.userId ? (
            <Link to="/admin/center" search={{ tab: "customers", customer: ticket.userId }} className="ed-btn">
              <UserRound size={15} strokeWidth={2.2} />
              Profile
            </Link>
          ) : null}
          {ticket.chatThreadId ? (
            <Link to="/admin/center" search={{ tab: "messages", thread: ticket.chatThreadId }} className="ed-btn">
              <MessageCircle size={15} strokeWidth={2.2} />
              Chat
              {ticket.chatUnread > 0 ? <span className="nav-pip">{ticket.chatUnread > 9 ? "9+" : ticket.chatUnread}</span> : null}
            </Link>
          ) : null}
          {onDelete && posBucket(ticket.status) === "completed" ? (
            <button type="button" className="ed-btn ed-btn-quiet ticket-del" disabled={busyId === ticket.id} onClick={onDelete}>
              Delete ticket
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AdminPos() {
  const { ticket } = Route.useSearch();
  const [tickets, setTickets] = useState<PosTicket[]>([]);
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState(ticket ?? "");
  const [finderOpen, setFinderOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState("");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [printers, setPrinters] = useState<PrinterProfile[]>([]);
  const [receipt, setReceipt] = useState<ReceiptOptions>(DEFAULT_RECEIPT_OPTIONS);
  const [restaurant, setRestaurant] = useState<RestaurantInfo>(RESTAURANT);
  const [taxRate, setTaxRate] = useState(6.625);
  const [busyId, setBusyId] = useState("");
  const [statusBusy, setStatusBusy] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [desk, setDesk] = useState<"open" | "done">("open");
  const [posToast, setPosToast] = useState<PosStaffToastState | null>(null);
  const [authLost, setAuthLost] = useState(false);
  const [chromeHost, setChromeHost] = useState<Element | null>(null);
  const seenChat = useRef(new Set<string>());
  const primedChat = useRef(false);
  const heldAccepted = useRef(new Set<string>());
  const closedByStaff = useRef(new Set<string>());
  const statusBusyRef = useRef(false);

  useEffect(() => {
    if (!posToast) return;
    const t = window.setTimeout(() => setPosToast(null), POS_TOAST_MS);
    return () => window.clearTimeout(t);
  }, [posToast]);

  useEffect(() => {
    const onAccepted = (event: Event) => {
      const order = (event as CustomEvent<PosTicket>).detail;
      if (!order?.id) return;
      heldAccepted.current.add(order.id);
      setTickets((list) => list.map((t) => (t.id === order.id ? { ...t, ...order, status: "accepted" } : t)));
      setPosToast(formatAcceptedToast({ ticketNo: order.ticketNo, formatTicketNo }));
    };
    window.addEventListener(POS_ACCEPTED_EVENT, onAccepted);
    return () => window.removeEventListener(POS_ACCEPTED_EVENT, onAccepted);
  }, []);

  useEffect(() => {
    setChromeHost(document.getElementById("admin-top-extra"));
  }, []);

  useEffect(() => {
    return onVisibleInterval(6000, () => {
      void listPosOrders()
        .then((list) => {
          const next = list.map((t) => {
            if (!heldAccepted.current.has(t.id)) return t;
            if (t.status === "placed" || t.status === "awaiting_payment") return { ...t, status: "accepted" };
            heldAccepted.current.delete(t.id);
            return t;
          });
          setTickets(next);
          const pinged = list.filter((t) => t.chatUnread > 0 && t.chatThreadId);
          let prefer = "";
          if (!primedChat.current) {
            for (const t of pinged) if (t.chatThreadId) seenChat.current.add(t.chatThreadId);
            primedChat.current = true;
          } else {
            const fresh = pinged.filter((t) => t.chatThreadId && !seenChat.current.has(t.chatThreadId));
            for (const t of pinged) if (t.chatThreadId) seenChat.current.add(t.chatThreadId);
            if (fresh[0]) prefer = fresh[0].id;
          }
          setOpenId((cur) => {
            if (prefer && !closedByStaff.current.has(prefer)) return prefer;
            if (ticket && !closedByStaff.current.has(ticket) && list.some((t) => t.id === ticket)) return ticket;
            if (cur && list.some((t) => t.id === cur)) return cur;
            return "";
          });
          if (ticket) setQuery(ticket);
        })
        .catch((e) => {
          if (isTransientFetchError(e)) return;
          if (isUnauthorizedError(e)) {
            setAuthLost(true);
            setError("Your desk sign-in expired. Sign in again to Accept tickets.");
            return;
          }
          setError(e instanceof Error ? e.message : "Could not load POS");
        });
    });
  }, [ticket]);

  useEffect(() => {
    void getAdminShop()
      .then((d) => {
        setCategories(d.categories);
        setPrinters(d.printers);
        setReceipt(d.receiptOptions);
        setRestaurant(d.restaurant);
        setTaxRate(d.settings.taxRate);
      })
      .catch(() => undefined);
  }, []);

  function mergeTicket(id: string, patch: Partial<PosTicket>) {
    setTickets((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function lockIfUnauthorized(e: unknown, fallback: string, intoDialog = false) {
    if (isUnauthorizedError(e)) {
      setAuthLost(true);
      const text = "Your desk sign-in expired. Sign in again to Accept tickets.";
      if (intoDialog) setDialogError(text);
      else setError(text);
      return true;
    }
    const msg = e instanceof Error ? e.message : fallback;
    if (intoDialog) setDialogError(msg);
    else setError(msg);
    return false;
  }

  function setStatus(id: string, status: string) {
    if (authLost) return;
    if (statusBusyRef.current) return;
    statusBusyRef.current = true;
    setError("");
    setDialogError("");
    setStatusBusy(status);
    const prior = tickets.find((t) => t.id === id);
    void updateOrderStatus({ data: { id, status } })
      .then((r) => {
        if (!r.order) return;
        mergeTicket(id, r.order);
        const next = r.order.status || status;
        if (status === "completed" || next === "completed") {
          const wasComplete = posBucket(prior?.status ?? "") === "completed";
          closedByStaff.current.add(id);
          setOpenId("");
          setItemQuery("");
          if (!wasComplete) {
            setDesk("open");
            setPosToast(
              formatCompletedToast({
                ticketNo: r.order.ticketNo || prior?.ticketNo || 0,
                total: r.order.total || prior?.total || 0,
                tip: r.order.tip || prior?.tip,
                formatTicketNo,
                formatUsd,
              }),
            );
          }
          return;
        }
        if (status === "accepted" || next === "accepted") {
          setPosToast(
            formatAcceptedToast({
              ticketNo: r.order.ticketNo || prior?.ticketNo || 0,
              formatTicketNo,
            }),
          );
        }
      })
      .catch((e) => {
        if (lockIfUnauthorized(e, "Could not update", status === "completed")) return;
        const msg = e instanceof Error ? e.message : "Could not update";
        if (status === "completed") setDialogError(msg);
        else setError(msg);
      })
      .finally(() => {
        statusBusyRef.current = false;
        setStatusBusy("");
      });
  }

  function saveItems(id: string, items: OrderItem[]) {
    if (authLost) return;
    setError("");
    void patchPosOrder({ data: { id, items } })
      .then((r) => {
        if (!r.order) return;
        mergeTicket(id, r.order);
      })
      .catch((e) => {
        if (lockIfUnauthorized(e, "Could not update items")) return;
        setError(e instanceof Error ? e.message : "Could not update items");
      });
  }

  function reprint(order: PosTicket) {
    setBusyId(order.id);
    setError("");
    void printOrderReceipts({
      order,
      restaurant,
      receipt,
      printers,
      taxRate,
      fallback: true,
    })
      .then(() => setError(""))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not print"))
      .finally(() => setBusyId(""));
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) =>
      [formatTicketNo(t.ticketNo), t.id, t.customerName, t.customerPhone, t.status, t.fulfillment, t.addressLine, t.notes]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [tickets, query]);

  const menuHits = useMemo(() => {
    const needle = itemQuery.trim().toLowerCase();
    if (!needle) return [] as { cat: MenuCategory; item: MenuItem }[];
    const hits: { cat: MenuCategory; item: MenuItem; score: number }[] = [];
    for (const cat of categories) {
      for (const item of cat.items) {
        const name = item.name.toLowerCase();
        const desc = (item.description ?? "").toLowerCase();
        let score = 0;
        if (name === needle) score = 100;
        else if (name.startsWith(needle)) score = 80;
        else if (name.includes(needle)) score = 60;
        else if (desc.includes(needle)) score = 40;
        else if (cat.name.toLowerCase().includes(needle)) score = 20;
        if (score) hits.push({ cat, item, score });
      }
    }
    hits.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
    return hits.slice(0, 8);
  }, [categories, itemQuery]);

  const openTickets = useMemo(() => {
    const open = visible.filter((t) => posBucket(t.status) !== "completed");
    // Stable kitchen order: placed/awaiting first (oldest first), then accepted+ (oldest first).
    return [...open].sort((a, b) => {
      const ap = a.status === "placed" || a.status === "awaiting_payment" ? 0 : 1;
      const bp = b.status === "placed" || b.status === "awaiting_payment" ? 0 : 1;
      if (ap !== bp) return ap - bp;
      const ta = Date.parse(a.createdAt) || 0;
      const tb = Date.parse(b.createdAt) || 0;
      if (ta !== tb) return ta - tb;
      return (a.ticketNo || 0) - (b.ticketNo || 0) || a.id.localeCompare(b.id);
    });
  }, [visible]);
  const doneTickets = useMemo(() => visible.filter((t) => posBucket(t.status) === "completed"), [visible]);
  const shown = desk === "done" ? doneTickets : openTickets;
  const openTicket = tickets.find((t) => t.id === openId) ?? null;

  const deskTabs = (
    <div className="seg pos-desk-tabs" role="tablist" aria-label="Ticket desk">
      <button
        type="button"
        role="tab"
        aria-selected={desk === "open"}
        data-on={desk === "open"}
        onClick={() => {
          setDesk("open");
          setOpenId("");
          setItemQuery("");
        }}
      >
        Open
        {openTickets.length ? <em className="pos-tab-n">{openTickets.length}</em> : null}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={desk === "done"}
        data-on={desk === "done"}
        onClick={() => {
          setDesk("done");
          setOpenId("");
          setItemQuery("");
        }}
      >
        Complete
        {doneTickets.length ? <em className="pos-tab-n">{doneTickets.length}</em> : null}
      </button>
    </div>
  );

  return (
    <div className="pos-page">
      <PosStaffToast toast={posToast} />
      {chromeHost ? createPortal(deskTabs, chromeHost) : <div className="pos-chrome">{deskTabs}</div>}
      {authLost ? (
        <p className="form-error">
          Your desk sign-in expired.{" "}
          <Link to="/login" search={{ next: "/admin/pos" }}>
            Sign in again
          </Link>{" "}
          to Accept tickets.
        </p>
      ) : null}
      {error && !authLost ? <p className="form-error">{error}</p> : null}
      {shown.length === 0 ? (
        desk === "open" ? (
          <section className="page-card pos-empty-open">
            <h2>You're caught up</h2>
            <p className="ed-sub">No open tickets. New orders will show here.</p>
            {doneTickets.length ? (
              <button
                type="button"
                className="ed-btn"
                onClick={() => {
                  setDesk("done");
                  setOpenId("");
                  setItemQuery("");
                }}
              >
                View completed
              </button>
            ) : null}
          </section>
        ) : (
          <section className="page-card">
            <p className="ed-empty">No completed tickets.</p>
          </section>
        )
      ) : (
        <ol className="pos-list">
          {shown.map((t) => {
            const open = openId === t.id;
            const bucket = posBucket(t.status);
            const stamp = posStamp(t.status);
            const where = ticketWhere(t);
            return (
              <li key={t.id} className="pos-row" data-open={open} data-status={bucket} data-chat={t.chatUnread > 0 ? "true" : undefined}>
                <button
                  type="button"
                  className="pos-summary"
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  onClick={() => {
                    setOpenId(t.id);
                    setItemQuery("");
                    setDialogError("");
                  }}
                >
                  <span className="pos-when">
                    <strong>#{formatTicketNo(t.ticketNo)}</strong>
                    <em>
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      {" · "}
                      {new Date(t.createdAt).toLocaleDateString()}
                    </em>
                  </span>
                  <span className="pos-who">
                    <strong>{t.customerName}</strong>
                    <em>
                      {t.fulfillment === "delivery" ? "Delivery" : t.pickupName ? `Pickup · ${t.pickupName}` : "Pickup"} · {where}
                      {t.scheduledFor ? ` · ${formatShopWhen(t.scheduledFor)}` : ""}
                    </em>
                  </span>
                  <span className="pos-amt">{formatUsd(t.total)}</span>
                  {t.chatUnread > 0 ? (
                    <span className="pos-chat-badge" title="Customer messaged about this order">
                      <MessageCircle size={15} strokeWidth={2.2} />
                      <span className="nav-pip">{t.chatUnread > 9 ? "9+" : t.chatUnread}</span>
                    </span>
                  ) : null}
                  <span className="pos-st" data-tone={stamp.tone}>
                    {stamp.label}
                  </span>
                </button>
                {t.chatUnread > 0 && t.chatThreadId ? (
                  <Link
                    to="/admin/center"
                    search={{ tab: "messages", thread: t.chatThreadId }}
                    className="pos-chat-ping"
                  >
                    <MessageCircle size={15} strokeWidth={2.2} />
                    Customer messaged about this order
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
      {openTicket ? (
        <PosTicketDialog
          ticket={openTicket}
          itemQuery={itemQuery}
          menuHits={menuHits}
          busyId={busyId}
          statusBusy={statusBusy}
          statusError={dialogError}
          authLost={authLost}
          onClose={() => {
            setOpenId("");
            setItemQuery("");
            setDialogError("");
          }}
          onQuery={setItemQuery}
          onStatus={(status) => setStatus(openTicket.id, status)}
          onSaveItems={(items) => saveItems(openTicket.id, items)}
          onReprint={() => reprint(openTicket)}
          onDelete={() => {
            const t = openTicket;
            if (!window.confirm(`Delete ticket #${formatTicketNo(t.ticketNo)}? This cannot be undone.`)) return;
            void deleteOrder({ data: { id: t.id } })
              .then(() => {
                setTickets((list) => list.filter((row) => row.id !== t.id));
                setOpenId("");
                setItemQuery("");
              })
              .catch((e) => {
                if (lockIfUnauthorized(e, "Could not delete ticket", true)) return;
              });
          }}
        />
      ) : null}
      <button
        type="button"
        className="pos-search-fab"
        aria-label="Find a ticket"
        aria-expanded={finderOpen}
        onClick={() => setFinderOpen(true)}
      >
        <Search size={18} strokeWidth={2.2} />
        <span>Find a ticket</span>
      </button>
      {finderOpen ? (
        <div className="pos-search-scrim" role="dialog" aria-modal="true" aria-labelledby="pos-find-title">
          <section className="pos-search-pop">
            <header className="dock-panel-head">
              <div>
                <p className="shop-brand-kicker">POS</p>
                <h2 id="pos-find-title">Find a ticket</h2>
              </div>
              <button type="button" className="ed-icon-btn" aria-label="Close search" onClick={() => setFinderOpen(false)}>
                <X size={16} strokeWidth={2.2} />
              </button>
            </header>
            <label className="ed-field">
              <span>Name, ticket, phone</span>
              <span className="cat-search">
                <Search size={16} strokeWidth={2.2} aria-hidden />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tickets"
                  aria-label="Search tickets"
                />
              </span>
            </label>
            <ul className="pos-search-hits">
              {visible.length === 0 ? (
                <li className="ed-empty">No tickets match.</li>
              ) : (
                visible.slice(0, 12).map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setDesk(posBucket(t.status) === "completed" ? "done" : "open");
                        setOpenId(t.id);
                        setFinderOpen(false);
                      }}
                    >
                      <strong>{t.customerName}</strong>
                      <em>
                        #{formatTicketNo(t.ticketNo)} · {formatUsd(t.total)} · {posStamp(t.status).label}
                        {t.scheduledFor ? ` · ${formatShopWhen(t.scheduledFor)}` : ""}
                      </em>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
