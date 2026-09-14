import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Share, Smartphone } from "lucide-react";
import { ShopHeader } from "@/components/shop-header";
import { EnableAlertsButton } from "@/components/order-alerts";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMe } from "@/lib/shop-server";
import type { ProfileView } from "@/lib/shop-types";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const Route = createFileRoute("/install")({
  head: () => ({
    meta: [{ title: "Download App" }],
  }),
  component: InstallPage,
});

function detectIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function detectStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function InstallPage() {
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setProfile(null);
      return;
    }
    void getMe()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [isPending, user]);

  useEffect(() => {
    setIos(detectIos());
    setStandalone(detectStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!promptEvent) return;
    setBusy(true);
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setDone(choice.outcome === "accepted");
      setPromptEvent(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shop-shell">
      <ShopHeader profile={profile} />
      <main className="shop-main install-main" id="main">
        <section className="page-card install-hero">
          <img className="install-icon" src="/icon-512.png" width={180} height={180} alt="South End Pizza" />
          <p className="shop-brand-kicker">Egg Harbor Township</p>
          <h1>South End Pizza</h1>
          <p className="ed-sub">
            Put the shop on your home screen. Same menu, same account — opens like an app named South End.
          </p>
          {standalone || done ? (
            <>
              <p className="points-chip">South End is on this device</p>
              <EnableAlertsButton />
            </>
          ) : promptEvent ? (
            <button type="button" className="btn-print" disabled={busy} onClick={() => void install()}>
              <Smartphone size={18} strokeWidth={2.2} />
              {busy ? "Installing…" : "Add South End"}
            </button>
          ) : ios ? (
            <p className="install-cta">
              <Share size={16} strokeWidth={2.2} aria-hidden />
              Tap Share, then Add to Home Screen
            </p>
          ) : (
            <p className="install-cta">Use your browser menu to install or add to the home screen.</p>
          )}
        </section>

        <section className="page-card">
          <h2>iPhone & iPad</h2>
          <ol className="install-steps">
            <li>Open this page in Safari.</li>
            <li>Tap the Share button.</li>
            <li>Choose Add to Home Screen, then Add.</li>
            <li>Look for the buffalo mark named South End.</li>
          </ol>
        </section>

        <section className="page-card">
          <h2>Android</h2>
          <ol className="install-steps">
            <li>Open this page in Chrome.</li>
            <li>Tap the browser menu.</li>
            <li>Choose Install app or Add to Home screen.</li>
            <li>Confirm South End Pizza.</li>
          </ol>
        </section>

        <section className="page-card">
          <h2>Order alerts</h2>
          <p className="ed-sub">
            After you install, tap Enable order alerts so we can ping you when a ticket is ready. iPhone needs Add to
            Home Screen first.
          </p>
          {ios && !standalone ? (
            <p className="ed-sub">Add South End to the Home Screen, open it from the icon, then enable alerts.</p>
          ) : (
            <EnableAlertsButton compact />
          )}
        </section>

        <p className="ed-sub install-back">
          <Link to="/">Back to the menu</Link>
        </p>
      </main>
    </div>
  );
}
