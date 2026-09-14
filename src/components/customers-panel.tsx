import { useEffect, useMemo, useRef, useState } from "react";
import { setAccountBanned, setAccountRole, adjustCustomerPoints, deleteCustomerAccount } from "@/lib/shop-server";
import { formatTicketNo, formatUsd, type CustomerRecord } from "@/lib/shop-types";
import { formatShopWhen } from "@/lib/hours";
import { isStaffAdminAccount } from "@/lib/staff-admin";
import { OrderDateTrays } from "@/components/order-trays";

const TINTS = 8;

function customerTint(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % TINTS;
}

export function CustomersPanel({
  customers,
  setCustomers,
  onMsg,
  onMessage,
  focusId,
}: {
  customers: CustomerRecord[];
  setCustomers: (next: CustomerRecord[]) => void;
  onMsg: (s: string) => void;
  onMessage?: (c: CustomerRecord) => void;
  focusId?: string;
}) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(focusId ?? "");
  const [busyId, setBusyId] = useState("");
  const [pointDelta, setPointDelta] = useState("10");
  const [pendingRemove, setPendingRemove] = useState<CustomerRecord | null>(null);
  const pinnedFor = useRef("");

  useEffect(() => {
    if (!focusId) {
      pinnedFor.current = "";
      return;
    }
    setOpenId(focusId);
    const hit = customers.find((c) => c.userId === focusId);
    if (!hit || pinnedFor.current === focusId) return;
    pinnedFor.current = focusId;
    setQuery(hit.displayName);
    const t = window.setTimeout(() => {
      document.getElementById(`cust-${focusId}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [focusId, customers]);

  useEffect(() => {
    if (!pendingRemove) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busyId) setPendingRemove(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingRemove, busyId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? customers
      : customers.filter((c) =>
          [c.displayName, c.phone, c.email, c.userId, c.role].join(" ").toLowerCase().includes(q),
        );
    if (!focusId) return list;
    return [...list].sort((a, b) => {
      if (a.userId === focusId) return -1;
      if (b.userId === focusId) return 1;
      return 0;
    });
  }, [customers, query, focusId]);

  function toggleAdmin(c: CustomerRecord, on: boolean) {
    setBusyId(c.userId);
    void setAccountRole({ data: { userId: c.userId, role: on ? "admin" : "customer" } })
      .then(() => {
        setCustomers(
          customers.map((row) =>
            row.userId === c.userId ? { ...row, role: on ? "admin" : "customer", adminModeAllowed: on } : row,
          ),
        );
        onMsg(on ? `${c.displayName} can open the desk.` : `${c.displayName} is a customer account.`);
      })
      .catch((e) => onMsg(e instanceof Error ? e.message : "Could not update admin authority"))
      .finally(() => setBusyId(""));
  }

  function changePoints(c: CustomerRecord, sign: 1 | -1) {
    const amount = Math.round(Number(pointDelta) || 0);
    if (!amount) {
      onMsg("Enter how many points to add or remove.");
      return;
    }
    setBusyId(c.userId);
    void adjustCustomerPoints({ data: { userId: c.userId, delta: sign * amount } })
      .then((r) => {
        setCustomers(customers.map((row) => (row.userId === c.userId ? { ...row, points: r.points } : row)));
        onMsg(
          sign > 0
            ? `Added ${amount} points. ${c.displayName} now has ${r.points}.`
            : `Removed ${amount} points. ${c.displayName} now has ${r.points}.`,
        );
      })
      .catch((e) => onMsg(e instanceof Error ? e.message : "Could not update points"))
      .finally(() => setBusyId(""));
  }

  function toggleBan(c: CustomerRecord, on: boolean) {
    setBusyId(c.userId);
    void setAccountBanned({ data: { userId: c.userId, banned: on } })
      .then(() => {
        setCustomers(customers.map((row) => (row.userId === c.userId ? { ...row, banned: on } : row)));
        onMsg(on ? `${c.displayName} is banned.` : `${c.displayName} can order again.`);
      })
      .catch((e) => onMsg(e instanceof Error ? e.message : "Could not update ban"))
      .finally(() => setBusyId(""));
  }

  function removeAccount() {
    const c = pendingRemove;
    if (!c) return;
    setBusyId(c.userId);
    void deleteCustomerAccount({ data: { userId: c.userId } })
      .then(() => {
        setCustomers(customers.filter((row) => row.userId !== c.userId));
        if (openId === c.userId) setOpenId("");
        setPendingRemove(null);
        onMsg(`${c.displayName} was removed from the customer book.`);
      })
      .catch((e) => onMsg(e instanceof Error ? e.message : "Could not remove account"))
      .finally(() => setBusyId(""));
  }

  return (
    <section className="page-card">
      <h2>Customer database</h2>
      <p className="ed-sub">
        Names, phones, order history, and rewards. Turn on admin authority when someone should run the shop.
      </p>
      <label className="ed-field">
        <span>Search</span>
        <input
          className="ed-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, phone, or email"
        />
      </label>
      {filtered.length === 0 ? (
        <p className="ed-empty">No customers match.</p>
      ) : (
        <ul className="cust-list">
          {filtered.map((c) => {
            const open = openId === c.userId;
            const staffDesk = isStaffAdminAccount(c.userId, c.email);
            return (
              <li
                key={c.userId}
                className="cust-card"
                data-open={open}
                data-tint={String(customerTint(c.userId))}
                data-focus={c.userId === focusId || undefined}
                id={`cust-${c.userId}`}
              >
                <button
                  type="button"
                  className="cust-head"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? "" : c.userId)}
                >
                  <span className="cust-who">
                    <strong>{c.displayName}</strong>
                    <em>
                      {c.banned ? "Banned · " : ""}
                      {c.phone || "No phone"}
                      {c.email ? ` · ${c.email}` : ""}
                    </em>
                  </span>
                  <span className="cust-meta">
                    {c.orderCount} orders · {formatUsd(c.spend)} · {c.points} pts
                  </span>
                </button>
                {open ? (
                  <div className="cust-body">
                    <dl className="cust-facts">
                      <div>
                        <dt>Joined</dt>
                        <dd>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</dd>
                      </div>
                      <div>
                        <dt>Last order</dt>
                        <dd>{c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleString() : "None"}</dd>
                      </div>
                      <div>
                        <dt>2FA</dt>
                        <dd>{c.totpEnabled ? "On" : "Off"}</dd>
                      </div>
                      <div>
                        <dt>Role</dt>
                        <dd>{c.role}</dd>
                      </div>
                    </dl>
                    <div className="points-adjust">
                      <label className="ed-field">
                        <span>Reward points ({c.points})</span>
                        <input
                          className="ed-input"
                          inputMode="numeric"
                          value={pointDelta}
                          onChange={(e) => setPointDelta(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                          aria-label="Points to add or remove"
                        />
                      </label>
                      <div className="points-adjust-actions">
                        <button
                          type="button"
                          className="ed-btn"
                          disabled={busyId === c.userId}
                          onClick={() => changePoints(c, 1)}
                        >
                          Add points
                        </button>
                        <button
                          type="button"
                          className="ed-btn"
                          disabled={busyId === c.userId}
                          onClick={() => changePoints(c, -1)}
                        >
                          Remove points
                        </button>
                      </div>
                    </div>
                    <label className="pay-opt">
                      <input
                        type="checkbox"
                        checked={Boolean(c.adminModeAllowed)}
                        disabled={busyId === c.userId}
                        onChange={(e) => toggleAdmin(c, e.target.checked)}
                      />
                      Allow desk access on this account
                    </label>
                    <label className="pay-opt">
                      <input
                        type="checkbox"
                        checked={c.banned}
                        disabled={busyId === c.userId}
                        onChange={(e) => toggleBan(c, e.target.checked)}
                      />
                      Ban this account
                    </label>
                    {onMessage ? (
                      <button
                        type="button"
                        className="ed-btn"
                        disabled={busyId === c.userId}
                        onClick={() => onMessage(c)}
                      >
                        Open in messages
                      </button>
                    ) : null}
                    {staffDesk ? null : (
                      <button
                        type="button"
                        className="ed-btn ed-btn-danger"
                        disabled={busyId === c.userId}
                        onClick={() => setPendingRemove(c)}
                      >
                        Remove account
                      </button>
                    )}
                    <h3 className="settings-subhead">Order history</h3>
                    <OrderDateTrays orders={c.orders}>
                      {(o) => (
                        <li key={o.id}>
                          <span>
                            #{formatTicketNo(o.ticketNo)} · {formatShopWhen(o.createdAt)} · {o.fulfillment}
                            {o.notes ? ` · ${o.notes}` : ""}
                          </span>
                          <strong>
                            {formatUsd(o.total)}{" "}
                            <em>{o.status.replaceAll("_", " ")}</em>
                          </strong>
                        </li>
                      )}
                    </OrderDateTrays>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      {pendingRemove ? (
        <div className="order-alert-scrim" role="dialog" aria-modal="true" aria-labelledby="remove-account-title">
          <section className="order-alert">
            <h2 id="remove-account-title">Remove this account?</h2>
            <p className="ed-sub">
              Remove {pendingRemove.displayName} from the customer book? They will not be able to sign in with this
              account. Past tickets stay on POS.
            </p>
            <div className="confirm-actions">
              <button type="button" className="ed-btn" disabled={busyId === pendingRemove.userId} onClick={() => setPendingRemove(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="ed-btn ed-btn-danger"
                disabled={busyId === pendingRemove.userId}
                onClick={removeAccount}
              >
                {busyId === pendingRemove.userId ? "Removing…" : "Remove account"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
