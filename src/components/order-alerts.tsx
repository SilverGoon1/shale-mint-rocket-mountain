import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { enableOrderAlerts, registerShopWorker } from "@/lib/push-client";

/** Registers the shop service worker quietly. Permission is requested only from Enable alerts. */
export function OrderAlerts() {
  useEffect(() => {
    void registerShopWorker();
  }, []);
  return null;
}

export function EnableAlertsButton({ compact }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [on, setOn] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported("Notification" in window);
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
