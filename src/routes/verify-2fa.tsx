import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { verifyTotpChallenge } from "@/lib/shop-server";
import { AccountLoading } from "@/components/pizza-spinner";

function safeNext(raw: unknown) {
  if (typeof raw !== "string") return undefined;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) return undefined;
  return raw;
}

export const Route = createFileRoute("/verify-2fa")({
  validateSearch: (search: Record<string, unknown>): { next?: string } => {
    const next = safeNext(search.next);
    return next ? { next } : {};
  },
  component: Verify2fa,
});

function Verify2fa() {
  const { user, isPending } = useCurrentUserState();
  const { next } = Route.useSearch();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (isPending) return <AccountLoading />;
  if (!user) return <RedirectToSignIn />;
  if (done) {
    if (next) {
      window.location.replace(next);
      return <AccountLoading label="Loading account" />;
    }
    return <Navigate to="/" />;
  }

  return (
    <main className="login-page">
      <form
        className="login-card"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          void verifyTotpChallenge({ data: { code } })
            .then(() => setDone(true))
            .catch((err) => setError(err instanceof Error ? err.message : "Could not verify"))
            .finally(() => setBusy(false));
        }}
      >
        <h1>Two-factor code</h1>
        <p className="ed-sub">Open your authenticator app and enter the 6-digit code.</p>
        <label className="ed-field">
          <span>Code</span>
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
        <button type="submit" className="btn-print" disabled={busy}>
          {busy ? "Checking…" : "Verify"}
        </button>
      </form>
    </main>
  );
}
