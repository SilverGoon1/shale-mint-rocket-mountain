import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { enableOrderAlerts, registerShopWorker } from "@/lib/push-client";

const ASK_KEY = "southend-notif-ask-v1";

function markAsked() {
  try {
    localStorage.setItem(ASK_KEY, "1");
  } catch {
    /* private mode / blocked storage */
  }
}

function wasAsked() {
  try {
    return localStorage.getItem(ASK_KEY) === "1";
  } catch {
    return true;
  }
}

/** Registers the shop service worker quietly. Soft-asks once for permission when signed in. */
export function OrderAlerts() {
  const { user, isPending } = useCurrentUserState();
  const [showAsk, setShowAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    void registerShopWorker();
  }, []);

  useEffect(() => {
    if (isPending || !user) {
      setShowAsk(false);
      return;
    }
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (wasAsked()) return;
    setShowAsk(true);
  }, [user, isPending]);

  if (!showAsk) return null;

  return (
    <div className="order-recv-scrim notif-ask-overlay" role="dialog" aria-modal="true" aria-labelledby="notif-ask-title">
      <section className="order-recv-card notif-ask-card">
        <p className="shop-brand-kicker">South End Pizza III</p>
        <h2 id="notif-ask-title">Get order alerts?</h2>
        <p className="ed-sub">
          We can ping you when the kitchen accepts your order and when it is complete. You can enable this later in
          Account settings under Security.
        </p>
        {err ? <p className="form-error">{err}</p> : null}
        <div className="order-recv-actions notif-ask-actions">
          <button
            type="button"
            className="order-recv-btn"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setErr("");
              void enableOrderAlerts()
                .then(() => {
                  markAsked();
                  setShowAsk(false);
                })
                .catch((e) => {
                  if (typeof Notification !== "undefined" && Notification.permission !== "default") {
                    markAsked();
                    setShowAsk(false);
                    return;
                  }
                  setErr(e instanceof Error ? e.message : "Could not enable alerts.");
                })
                .finally(() => setBusy(false));
            }}
          >
            <Bell size={16} strokeWidth={2.2} />
            {busy ? "Allowing…" : "Enable"}
          </button>
          <button
            type="button"
            className="order-recv-btn"
            data-quiet="true"
            disabled={busy}
            onClick={() => {
              markAsked();
              setShowAsk(false);
            }}
          >
            Not now
          </button>
        </div>
      </section>
    </div>
  );
}

export function EnableAlertsButton({ compact }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported("Notification" in window);
    if ("Notification" in window && Notification.permission === "granted") setOn(true);
  }, []);

  if (!supported) return null;

  return (
    <div className={compact ? "alerts-cta alerts-cta-compact" : "alerts-cta"}>
      <button
        type="button"
        className={compact ? "ed-btn" : "btn-print"}
        disabled={busy || on}
        onClick={() => {
          setBusy(true);
          setMsg("");
          void enableOrderAlerts()
            .then(() => {
              setOn(true);
              setMsg("Order alerts are on.");
              markAsked();
            })
            .catch((e) => setMsg(e instanceof Error ? e.message : "Could not enable alerts."))
            .finally(() => setBusy(false));
        }}
      >
        <Bell size={16} strokeWidth={2.2} />
        {busy ? "Allowing…" : on ? "Alerts on" : "Enable order alerts"}
      </button>
      {msg ? <p className="ed-sub">{msg}</p> : null}
    </div>
  );
}
