import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { PenLine } from "lucide-react";
import { listMyChats, listMyOrders, loadChatMessages, sendChatMessage, startChat, attachChatOrder } from "@/lib/shop-server";
import { formatShopClock, formatShopWhen } from "@/lib/hours";
import { formatUsd, formatTicketNo, isActiveOrderStatus, type ChatMessageView, type ChatOrderBrief, type ChatThreadView, type OrderView } from "@/lib/shop-types";

export function OrderTicketCard({ order }: { order: ChatOrderBrief }) {
  return (
    <div className="order-ticket">
      <p className="shop-brand-kicker">Linked ticket</p>
      <strong>
        #{formatTicketNo(order.ticketNo)} · {order.fulfillment === "delivery" ? "Delivery" : "Pickup"}
      </strong>
      <em>
        {order.status.replaceAll("_", " ")} · {formatUsd(order.total)}
        {order.createdAt ? ` · placed ${formatShopWhen(order.createdAt)}` : ""}
      </em>
      <ul>
        {order.items.slice(0, 6).map((it, i) => (
          <li key={`${it.name}-${i}`}>
            {it.qty}× {it.name}
            {it.size ? ` · ${it.size}` : ""}
            {it.detail ? ` · ${it.detail}` : ""}
            {it.comment ? ` · Cook: ${it.comment}` : ""}
          </li>
        ))}
      </ul>
      {order.notes ? <p className="order-ticket-notes">{order.notes}</p> : null}
    </div>
  );
}

export function CustomerChat({ compact }: { compact?: boolean }) {
  const [threads, setThreads] = useState<ChatThreadView[]>([]);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [active, setActive] = useState("");
  const [orderId, setOrderId] = useState("");
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const freshStart = useRef(false);
  const hadMail = useRef(false);

  function beginFresh() {
    freshStart.current = true;
    setFresh(true);
    setActive("");
    setDraft("");
    setMessages([]);
    setError("");
    hadMail.current = false;
  }

  function refreshThreads() {
    return listMyChats()
      .then((list) => {
        const live = list.filter((t) => t.status !== "solved");
        setThreads(live);
        setActive((cur) => {
          if (freshStart.current) return "";
          if (cur && live.some((t) => t.id === cur)) return cur;
          if (cur) {
            freshStart.current = true;
            setFresh(true);
            setMessages([]);
            return "";
          }
          return live.find((t) => t.unreadCustomer > 0)?.id || live[0]?.id || "";
        });
        return live;
      })
      .catch(() => setThreads([]));
  }

  function refreshOrders() {
    return listMyOrders()
      .then((list) => {
        const live = list.filter((o) => isActiveOrderStatus(o.status));
        setOrders(live);
        setOrderId((cur) => (cur && live.some((o) => o.id === cur) ? cur : live[0]?.id ?? ""));
      })
      .catch(() => setOrders([]));
  }

  useEffect(() => {
    void refreshThreads();
    void refreshOrders();
    const t = window.setInterval(() => {
      if (!document.hidden) {
        void refreshThreads();
        void refreshOrders();
      }
    }, 8000);
    const onVis = () => {
      if (!document.hidden) {
        void refreshThreads();
        void refreshOrders();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (!active || freshStart.current) {
      if (!active) setMessages([]);
      return;
    }
    let live = true;
    hadMail.current = false;
    const pull = () => {
      if (freshStart.current) return;
      void loadChatMessages({ data: { threadId: active } })
        .then((msgs) => {
          if (!live) return;
          if (msgs.length === 0 && hadMail.current) {
            beginFresh();
            return;
          }
          if (msgs.length > 0) hadMail.current = true;
          setMessages(msgs);
        })
        .catch(() => undefined);
    };
    pull();
    const onVis = () => {
      if (!document.hidden) pull();
    };
    const t = window.setInterval(() => {
      if (!document.hidden) pull();
    }, 8000);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      live = false;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active]);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const current = threads.find((t) => t.id === active);
  const blank = fresh || !active;
  const chosenTicket = current?.order?.id || orderId;
  const canSend = Boolean(draft.trim()) && !busy && Boolean(chosenTicket || (active && !blank));

  function send(e?: FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const startNew = !active || freshStart.current;
    const ticket = current?.order?.id || orderId;
    if (startNew && !ticket) {
      setError("Pick an active order first.");
      return;
    }
    setBusy(true);
    setError("");
    const work = startNew
      ? startChat({ data: { body, orderId: ticket, forceNew: true } }).then((r) => String(r.threadId))
      : sendChatMessage({ data: { threadId: active, body } }).then(() => active);
    void work
      .then(async (id) => {
        freshStart.current = false;
        setFresh(false);
        setDraft("");
        setActive(id);
        await refreshThreads();
        const msgs = await loadChatMessages({ data: { threadId: id } });
        setMessages(msgs);
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Could not send";
        if (/concluded/i.test(msg)) {
          freshStart.current = true;
          setFresh(true);
          setActive("");
          setMessages([]);
          setError("");
          hadMail.current = false;
        } else {
          setError(msg);
        }
      })
      .finally(() => setBusy(false));
  }

  function linkTicket() {
    if (!active || !orderId) return;
    setBusy(true);
    void attachChatOrder({ data: { threadId: active, orderId } })
      .then(async () => {
        await refreshThreads();
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not link ticket"))
      .finally(() => setBusy(false));
  }

  return (
    <div className="chat-box" data-compact={compact ? "true" : "false"}>
      {blank || !current ? (
        <label className="ed-field">
          <span>About this order</span>
          <select className="ed-input" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
            <option value="">{orders.length ? "Choose a ticket" : "No ticket yet"}</option>
            {orders.slice(0, 12).map((o) => (
                <option key={o.id} value={o.id}>
                  #{formatTicketNo(o.ticketNo)} · {o.fulfillment} · {formatUsd(o.total)} · {formatShopWhen(o.createdAt)}
                </option>
              ))}
          </select>
        </label>
      ) : current.order ? (
        <OrderTicketCard order={current.order} />
      ) : (
        <label className="ed-field">
          <span>Link a ticket</span>
          <select className="ed-input" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
            <option value="">Choose ticket</option>
            {orders.slice(0, 12).map((o) => (
                <option key={o.id} value={o.id}>
                  #{formatTicketNo(o.ticketNo)} · {o.fulfillment} · {formatUsd(o.total)} · {formatShopWhen(o.createdAt)}
                </option>
              ))}
          </select>
          <button type="button" className="ed-btn" disabled={busy || !orderId} onClick={linkTicket}>
            Link ticket
          </button>
        </label>
      )}
      {!fresh && threads.length > 1 ? (
        <label className="ed-field">
          <span>Conversation</span>
          <select className="ed-input" value={active} onChange={(e) => setActive(e.target.value)}>
            {threads.map((t) => (
              <option key={t.id} value={t.id}>
                {t.unreadCustomer > 0 ? "New · " : ""}
                {t.lastMessage.slice(0, 36) || "Chat"}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <section className="chat-history" aria-label="Sent messages">
        <header className="chat-history-head">
          <p className="chat-log-kicker">Sent messages</p>
          <p className="chat-history-hint">What you and the shop already sent. This is not where you type.</p>
        </header>
        <div className="chat-log" aria-live="polite" ref={logRef}>
          {messages.length === 0 ? (
            <p className="ed-empty">Nothing sent yet. Write below to message the kitchen.</p>
          ) : (
            messages.map((m) => (
              <p key={m.id} className="chat-bubble" data-role={m.senderRole}>
                <span>
                  {m.senderRole === "admin" ? "Shop replied" : "You sent"}
                  {m.createdAt ? <time dateTime={m.createdAt}>{formatShopClock(m.createdAt)}</time> : null}
                </span>
                {m.body}
              </p>
            ))
          )}
        </div>
      </section>
      <form className="chat-compose" aria-label="Write a new message" onSubmit={(e) => send(e)}>
        <div className="chat-compose-head">
          <PenLine size={16} strokeWidth={2.2} aria-hidden />
          <p className="chat-compose-kicker">Type a new message here</p>
        </div>
        <label className="ed-field">
          <span>Your new message</span>
          <textarea
            className="ed-input ed-area chat-draft"
            rows={compact ? 2 : 3}
            maxLength={1000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What's happening?"
            aria-label="Type a new message to the shop"
            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) send();
              }
            }}
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        {orders.length === 0 ? (
          <p className="ed-empty">Place an order first, then chat about that ticket.</p>
        ) : !chosenTicket ? (
          <p className="ed-empty">Pick an active order to send a message.</p>
        ) : null}
        <button type="submit" className="btn-print" disabled={!canSend}>
          {busy ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
