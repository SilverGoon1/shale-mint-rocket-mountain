import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { InviteQr } from "@/components/invite-qr";
import { confirmTotpSetup, startTotpSetup } from "@/lib/shop-server";
import { AccountLoading } from "@/components/pizza-spinner";

function safeNext(raw: unknown) {
  if (typeof raw !== "string") return undefined;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) return undefined;
  return raw;
}

export const Route = createFileRoute("/enroll-2fa")({
  validateSearch: (search: Record<string, unknown>): { next?: string } => {
    const next = safeNext(search.next);
    return next ? { next } : {};
  },
  component: Enroll2fa,
});

/** Survives remount storms — one in-flight setup per tab, shared across Enroll2fa mounts. */
const setupCache: {
  userId: string | null;
  promise: Promise<{ secret: string; uri: string }> | null;
} = { userId: null, promise: null };

function loadTotpSetup(userId: string) {
  if (setupCache.userId === userId && setupCache.promise) return setupCache.promise;
  setupCache.userId = userId;
  setupCache.promise = startTotpSetup()
    .then((r) => ({ secret: r.secret, uri: r.uri }))
    .catch((err) => {
      if (setupCache.userId === userId) {
        setupCache.userId = null;
        setupCache.promise = null;
      }
      throw err;
    });
  return setupCache.promise;
}

function Enroll2fa() {
  const { user, isPending } = useCurrentUserState();
  const { next } = Route.useSearch();
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let live = true;
    void loadTotpSetup(user.id)
      .then((r) => {
        if (!live) return;
        setSecret(r.secret);
        setUri(r.uri);
      })
      .catch((err) => {
        if (!live) return;
        setError(err instanceof Error ? err.message : "Could not start setup");
      });
    return () => {
      live = false;
    };
  }, [user?.id]);

  if (isPending) return <AccountLoading />;
  if (!user) return <RedirectToSignIn />;
  if (done) {
    const dest = next || "/admin/pos";
    window.location.replace(dest);
    return <AccountLoading label="Loading account" />;
  }

  return (
    <main className="login-page">
      <form
        className="login-card"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          void confirmTotpSetup({ data: { code } })
            .then(() => setDone(true))
            .catch((err) => setError(err instanceof Error ? err.message : "Could not confirm"))
            .finally(() => setBusy(false));
        }}
      >
        <p className="shop-brand-kicker">Shop desk</p>
        <h1>Set up two-factor</h1>
        <p className="ed-sub">
          Scan with an authenticator app (Google Authenticator, Authy, 1Password), or type the key, then enter a
          6-digit code to confirm.
        </p>
        {uri ? <InviteQr value={uri} label="Authenticator QR code" /> : null}
        {secret ? <code className="totp-secret">{secret}</code> : <p className="ed-sub">Preparing a key…</p>}
        <label className="ed-field">
          <span>Confirm code</span>
          <input
            className="ed-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn-print" disabled={busy || !secret}>
          {busy ? "Saving…" : "Confirm and continue"}
        </button>
      </form>
    </main>
  );
}
