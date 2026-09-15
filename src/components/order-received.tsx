import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { formatTicketNo, formatUsd } from "@/lib/shop-types";

const SPARKS = Array.from({ length: 36 }, (_, i) => {
  const angle = (i / 36) * Math.PI * 2 + (i % 5) * 0.17;
  const dist = 90 + (i % 9) * 26;
  return {
    i,
    x: Math.round(Math.cos(angle) * dist),
    y: Math.round(Math.sin(angle) * dist - 36),
    delay: (i % 9) * 0.07,
    size: 5 + (i % 4),
    tone: i % 3 === 0 ? "gold" : i % 3 === 1 ? "cream" : "tomato",
  };
});

export function OrderReceived({
  ticketNo,
  total,
  guest,
}: {
  ticketNo: number;
  total: number;
  guest: boolean;
}) {
  return (
    <div className="order-recv-scrim" role="dialog" aria-modal="true" aria-labelledby="order-recv-title">
      <div className="order-recv-fx" aria-hidden>
        {SPARKS.map((s) => (
          <i
            key={s.i}
            data-tone={s.tone}
            style={
              {
                "--x": `${s.x}px`,
                "--y": `${s.y}px`,
                "--d": `${s.delay}s`,
                "--s": `${s.size}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <section className="order-recv-card">
        <p className="shop-brand-kicker">South End Pizza III</p>
        <h2 id="order-recv-title">Order Received</h2>
        <p className="order-recv-ticket">
          Ticket #{formatTicketNo(ticketNo)} · {formatUsd(total)}
        </p>
        <p className="ed-sub">
          {guest
            ? "The kitchen has the ticket. Save this number — guest orders are not on an account."
            : "The kitchen has the ticket. Review it under your recent orders."}
        </p>
        <div className="order-recv-actions">
          <Link to="/" className="order-recv-btn">
            Menu
          </Link>
          {guest ? (
            <Link to="/login" search={{ next: "/account" }} className="order-recv-btn">
              Review Order
            </Link>
          ) : (
            <Link to="/account" hash="recent-orders" className="order-recv-btn">
              Review Order
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
