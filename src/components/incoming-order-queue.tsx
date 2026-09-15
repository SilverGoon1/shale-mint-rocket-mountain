import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Volume2, VolumeX } from "lucide-react";
import { acceptOrder, getAdminShop, listIncomingOrders } from "@/lib/shop-server";
import { formatShopWhen } from "@/lib/hours";
import { formatUsd, formatTicketNo, type PosTicket } from "@/lib/shop-types";
import { lineSummary } from "@/lib/ticket-line";
import { onVisibleInterval } from "@/lib/page-visible";
import { isUnauthorizedError } from "@/lib/fetch-retry";
import { PosStaffToast, type PosStaffToastState } from "@/components/pos-staff-toast";
import { formatAcceptedToast, POS_TOAST_MS } from "@/lib/pos-toast";

const DEFAULT_ALARM = "/order-alarm.wav";
const SNOOZE_KEY = "southend-order-snooze";
export const POS_ACCEPTED_EVENT = "southend-pos-accepted";
export const POS_COMPLETED_EVENT = "southend-pos-completed";

function loadSnooze() {
  try {
    const raw = sessionStorage.getItem(SNOOZE_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set<string>();
  }
}

function fifoIncoming(list: PosTicket[]) {
  return [...list].sort((a, b) => {
    const ta = Date.parse(a.createdAt) || 0;
    const tb = Date.parse(b.createdAt) || 0;
    if (ta !== tb) return ta - tb;
    return (a.ticketNo || 0) - (b.ticketNo || 0) || a.id.localeCompare(b.id);
  });
}

function emitPosAccepted(order: PosTicket) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(POS_ACCEPTED_EVENT, { detail: order }));
}

export function IncomingOrderQueue() {
  const [queue, setQueue] = useState<PosTicket[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [src, setSrc] = useState(DEFAULT_ALARM);
  const [toast, setToast] = useState<PosStaffToastState | null>(null);
  const [authLost, setAuthLost] = useState(false);
  const seen = useRef(new Set<string>());
  const snoozed = useRef(loadSnooze());
  const taken = useRef(new Set<string>());
  const primed = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    void getAdminShop()
      .then((d) => setSrc(d.notifyAudio || DEFAULT_ALARM))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const el = new Audio(src);
    el.preload = "auto";
    audioRef.current = el;
    return () => {
      el.pause();
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), POS_TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast]);

  function ring() {
    if (mutedRef.current) return;
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    void el.play().catch(() => undefined);
  }

  function applyIncoming(list: PosTicket[]) {
    // Only un-accepted tickets; skip anything already taken this session (kills double-accept flicker).
    const live = fifoIncoming(
      list.filter(
        (t) =>
          (t.status === "placed" || t.status === "awaiting_payment") &&
          !snoozed.current.has(t.id) &&
          !taken.current.has(t.id),
      ),
    );
    setQueue(live);
    setCurrentId((cur) => {
      if (cur && live.some((t) => t.id === cur)) return cur;
      return live[0]?.id ?? "";
    });
    const fresh = live.filter((t) => !seen.current.has(t.id));
    for (const t of live) seen.current.add(t.id);
    if (fresh.length) ring();
    else if (!primed.current && live.length) ring();
    primed.current = true;
  }

  useEffect(() => {
    return onVisibleInterval(4000, () => {
      void listIncomingOrders()
        .then(applyIncoming)
        .catch((e) => {
          if (isUnauthorizedError(e)) {
            setAuthLost(true);
            setError("Your desk sign-in expired. Sign in again to Accept tickets.");
          }
        });
    });
  }, [src]);

  useEffect(() => {
    if (!queue.length || muted) return;
    const t = window.setInterval(() => ring(), 10000);
    return () => window.clearInterval(t);
  }, [queue.length, muted, src]);

  const current = queue.find((t) => t.id === currentId) ?? queue[0];

  function take() {
    if (authLost) return;
    if (!current || busy || taken.current.has(current.id)) return;
    const ticket = current;
    taken.current.add(ticket.id);
    setBusy(true);
    setError("");
    const remaining = queue.filter((t) => t.id !== ticket.id);
    setQueue(remaining);
    setCurrentId(remaining[0]?.id ?? "");
    void acceptOrder({ data: { id: ticket.id } })
      .then((order) => {
        const accepted: PosTicket = {
          ...ticket,
          ...order,
          status: "accepted",
          customerName: ticket.customerName,
          customerPhone: ticket.customerPhone,
          chatUnread: ticket.chatUnread,
          chatThreadId: ticket.chatThreadId,
        };
        emitPosAccepted(accepted);
        setToast(formatAcceptedToast({ ticketNo: accepted.ticketNo, formatTicketNo }));
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Could not accept";
        // If another station already accepted, treat as success — do not put it back in the modal.
        if (/already|accepted|preparing|ready|cannot be accepted/i.test(msg)) {
          taken.current.add(ticket.id);
          emitPosAccepted({ ...ticket, status: "accepted" });
          setToast(formatAcceptedToast({ ticketNo: ticket.ticketNo, formatTicketNo }));
          return;
        }
        taken.current.delete(ticket.id);
        if (isUnauthorizedError(e)) {
          setAuthLost(true);
          setError("Your desk sign-in expired. Sign in again to Accept tickets.");
          return;
        }
        setError(msg);
        setQueue((list) => {
          if (list.some((t) => t.id === ticket.id)) return list;
          return fifoIncoming([ticket, ...list]);
        });
        setCurrentId(ticket.id);
      })
      .finally(() => setBusy(false));
  }

  const toastEl = <PosStaffToast toast={toast} />;

  if (!current) return toastEl;

  return (
    <>
      {toastEl}
      <div className="order-alert-scrim" role="dialog" aria-modal="true" aria-labelledby="order-alert-title">
        <section className="order-alert">
          <header className="order-alert-head">
            <p className="shop-brand-kicker">
              <Bell size={14} strokeWidth={2.4} /> Incoming · oldest first
            </p>
            <h2 id="order-alert-title">Ticket #{formatTicketNo(current.ticketNo)}</h2>
            <button
              type="button"
              className="ed-icon-btn"
              aria-label={muted ? "Unmute alarm" : "Mute alarm"}
              onClick={() => {
                mutedRef.current = !mutedRef.current;
                setMuted(mutedRef.current);
                audioRef.current?.pause();
              }}
            >
              {muted ? <VolumeX size={16} strokeWidth={2.2} /> : <Volume2 size={16} strokeWidth={2.2} />}
            </button>
          </header>
          <p className="order-alert-who">
            <strong>{current.pickupName || current.customerName}</strong>
            <span>
              {current.fulfillment === "delivery" ? "Delivery" : "Pickup"} · {formatUsd(current.total)}
            </span>
          </p>
          {current.customerPhone ? <p className="ed-sub">{current.customerPhone}</p> : null}
          <p className="ed-sub">
            Placed {formatShopWhen(current.createdAt)}
            {current.scheduledFor
              ? ` · promised ${formatShopWhen(current.scheduledFor)}`
              : " · as soon as ready"}
          </p>
          <ul className="cart-lines">
            {current.items.slice(0, 8).map((it, i) => (
              <li key={`${it.itemId}-${i}`}>
                <span>{lineSummary(it)}</span>
                <span>{formatUsd(it.unitPrice * it.qty)}</span>
              </li>
            ))}
          </ul>
          {current.notes ? (
            <p className="pos-notes">
              <strong>Notes</strong> {current.notes}
            </p>
          ) : null}
          <dl className="totals">
            <div>
              <dt>Food</dt>
              <dd>{formatUsd(current.subtotal)}</dd>
            </div>
            {current.discount ? (
              <div>
                <dt>Rewards</dt>
                <dd>−{formatUsd(current.discount)}</dd>
              </div>
            ) : null}
            {current.deliveryFee ? (
              <div>
                <dt>Delivery</dt>
                <dd>{formatUsd(current.deliveryFee)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Tax</dt>
              <dd>{formatUsd(current.tax)}</dd>
            </div>
            {current.tip ? (
              <div>
                <dt>Tip</dt>
                <dd>{formatUsd(current.tip)}</dd>
              </div>
            ) : null}
            <div className="totals-grand">
              <dt>Total</dt>
              <dd>{formatUsd(current.total)}</dd>
            </div>
          </dl>
          {error ? (
            <p className="form-error">
              {error}
              {authLost ? (
                <>
                  {" "}
                  <Link to="/login" search={{ next: "/admin/pos" }}>
                    Sign in again
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          <div className="confirm-actions">
            {current.status === "accepted" || current.status === "preparing" || current.status === "ready" || taken.current.has(current.id) ? (
              <button type="button" className="btn-print order-alert-accept" disabled>
                Accepted
              </button>
            ) : (
              <button type="button" className="btn-print order-alert-accept" disabled={busy || authLost} onClick={take}>
                {busy ? "Accepting…" : "Accept order"}
              </button>
            )}
            {queue.length > 1 ? (
              <button
                type="button"
                className="ed-btn"
                disabled={busy}
                onClick={() => {
                  const i = queue.findIndex((t) => t.id === current.id);
                  const next = queue[(i + 1 + queue.length) % queue.length];
                  if (next) setCurrentId(next.id);
                }}
              >
                Show next oldest
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </>
  );
}
