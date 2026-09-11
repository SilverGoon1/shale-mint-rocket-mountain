import { useEffect, useState } from "react";
import { useCartHydrated } from "@/components/cart-hydrate";
import { useCartStore, wipeCart } from "@/lib/cart-store";

const ACK = "southend-cart-ack";

function alreadyAcked() {
  try {
    return sessionStorage.getItem(ACK) === "1";
  } catch {
    return true;
  }
}

function ack() {
  try {
    sessionStorage.setItem(ACK, "1");
  } catch {
    /* ignore */
  }
}

export function StaleCartPrompt() {
  const hydrated = useCartHydrated();
  const lines = useCartStore((s) => s.lines);
  const [ask, setAsk] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (alreadyAcked()) return;
    if (useCartStore.getState().lines.length > 0) {
      setAsk(true);
      return;
    }
    ack();
  }, [hydrated]);

  if (!ask || !lines.length) return null;

  return (
    <div className="stale-cart" role="dialog" aria-labelledby="stale-cart-title">
      <div>
        <h2 id="stale-cart-title">Resume your order?</h2>
        <p className="ed-sub">You still have items in your bag from last time.</p>
      </div>
      <div className="stale-cart-actions">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            ack();
            setAsk(false);
          }}
        >
          Resume order
        </button>
        <button
          type="button"
          className="ed-btn ed-btn-quiet"
          onClick={() => {
            wipeCart();
            ack();
            setAsk(false);
          }}
        >
          Start fresh
        </button>
      </div>
    </div>
  );
}
