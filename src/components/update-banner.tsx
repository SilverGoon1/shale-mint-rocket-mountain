import { useEffect, useState } from "react";
import { registerShopWorker } from "@/lib/push-client";

const SEEN_KEY = "southend-build-seen";
const LATER_KEY = "southend-update-later";
const POLL_MS = 5 * 60_000;

function inGrokPreview() {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  return host.endsWith(".grok-sandbox.com") || host.endsWith(".grok.me");
}

async function remoteStamp() {
  try {
    const res = await fetch("/version.json", { cache: "no-store" });
    if (res.ok) {
      const body = (await res.json()) as { builtAt?: string; sha?: string };
      const stamp = String(body.builtAt || body.sha || "").trim();
      if (stamp) return stamp;
    }
  } catch {
    /* fall through */
  }
  try {
    const sw = await fetch("/sw.js", { cache: "no-store" });
    const tag = sw.headers.get("etag") || sw.headers.get("last-modified") || "";
    if (tag) return tag;
  } catch {
    /* fall through */
  }
  try {
    const home = await fetch("/", { cache: "no-store", method: "HEAD" });
    return home.headers.get("etag") || home.headers.get("last-modified") || "";
  } catch {
    return "";
  }
}

async function pokeWorker() {
  try {
    const reg = await registerShopWorker();
    await reg?.update();
  } catch {
    /* push worker stays registered even if update() fails */
  }
}

export function UpdateBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (inGrokPreview()) return;
    if (sessionStorage.getItem(LATER_KEY) === "1") return;

    let cancelled = false;

    async function check() {
      if (cancelled || document.visibilityState !== "visible") return;
      if (sessionStorage.getItem(LATER_KEY) === "1") return;
      await pokeWorker();
      const stamp = await remoteStamp();
      if (!stamp || cancelled) return;
      const seen = sessionStorage.getItem(SEEN_KEY);
      if (!seen) {
        sessionStorage.setItem(SEEN_KEY, stamp);
        return;
      }
      if (stamp !== seen) setOpen(true);
    }

    void check();
    const tick = window.setInterval(() => void check(), POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="update-overlay" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <div className="update-dialog page-card">
        <h2 id="update-title">South End has an update</h2>
        <p>Reload to get the latest menu and shop tools.</p>
        <div className="update-banner-actions">
          <button
            type="button"
            className="btn-print"
            onClick={() => {
              void remoteStamp()
                .then((stamp) => {
                  if (stamp) sessionStorage.setItem(SEEN_KEY, stamp);
                })
                .finally(() => {
                  window.location.reload();
                });
            }}
          >
            Reload
          </button>
          <button
            type="button"
            className="ed-btn ed-btn-quiet"
            onClick={() => {
              sessionStorage.setItem(LATER_KEY, "1");
              setOpen(false);
            }}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
