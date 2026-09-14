import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useRouterState } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isTransientFetchError } from "@/lib/fetch-retry";
import { claimAdmin, getMe, getTwoFactorStatus } from "@/lib/shop-server";
import { needsSignupOtp } from "@/lib/phone";
import type { ProfileView, TwoFactorStatus } from "@/lib/shop-types";
import { needsSignupOtp } from "@/lib/phone";
import { AccountLoading } from "@/components/pizza-spinner";

function accountLoadMessage(err: unknown) {
  const raw = err instanceof Error ? err.message : "";
  const lower = raw.toLowerCase();
  if (lower.includes("profiles_pkey") || lower.includes("duplicate key") || lower.includes("unique constraint")) {
    return "The shop is still opening your staff account. Tap Try again.";
  }
  if (isTransientFetchError(err)) {
    return "The shop did not answer. Tap Try again.";
  }
  return raw.trim() || "Could not load your staff account.";
}

function withTimeout<T>(work: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error("Account is taking too long. Tap Try again.")), ms);
    work.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      },
    );
  });
}

const SKIP_2FA: TwoFactorStatus = {
  required: false,
  unlocked: true,
  enabled: false,
  enroll: false,
  locked: false,
};

async function loadStaffAccount() {
  const profile = await withTimeout(getMe(), 6000);
  if (!profile.totpEnabled) return [profile, SKIP_2FA] as const;
  try {
    const twoFactor = await withTimeout(getTwoFactorStatus(), 2500);
    return [profile, twoFactor] as const;
  } catch {
    return [profile, SKIP_2FA] as const;
  }
}

export function SessionGate({
  children,
  needAdmin,
  fallback,
  softGuest,
  onContinueAsGuest,
}: {
  children: (ctx: { profile: ProfileView; twoFactor: TwoFactorStatus }) => ReactNode;
  needAdmin?: boolean;
  fallback?: (ctx: { error: string; retry: () => void }) => ReactNode;
  /** Checkout: on account-load failure, offer Continue as guest instead of trapping mid-review. */
  softGuest?: boolean;
  onContinueAsGuest?: () => void;
}) {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [twoFactor, setTwoFactor] = useState<TwoFactorStatus | null>(null);
  const [error, setError] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [retry, setRetry] = useState(0);
  const [authWaited, setAuthWaited] = useState(false);
  const userId = user?.id ?? "";
  const heldAdmin = useRef<ProfileView | null>(null);

  useEffect(() => {
    if (userId) return;
    heldAdmin.current = null;
    setProfile(null);
    setTwoFactor(null);
    setError("");
  }, [userId]);

  useEffect(() => {
    if (!isPending) {
      setAuthWaited(false);
      return;
    }
    const ms = needAdmin ? 2500 : 8000;
    const t = window.setTimeout(() => setAuthWaited(true), ms);
    return () => window.clearTimeout(t);
  }, [isPending, needAdmin]);

  useEffect(() => {
    if (isPending || !userId) return;
    let live = true;
    const timeout = window.setTimeout(() => {
      if (!live) return;
      if (heldAdmin.current && heldAdmin.current.userId === userId) return;
      setError("Account is taking too long. Tap Try again.");
    }, 9000);
    void loadStaffAccount()
      .then(([p, t]) => {
        if (!live) return;
        window.clearTimeout(timeout);
        heldAdmin.current = p;
        setError("");
        setProfile(p);
        setTwoFactor(t);
      })
      .catch((e) => {
        if (!live) return;
        window.clearTimeout(timeout);
        if (heldAdmin.current && heldAdmin.current.userId === userId) {
          setProfile(heldAdmin.current);
          setError("");
          return;
        }
        setProfile(null);
        setTwoFactor(null);
        setError(accountLoadMessage(e));
      });
    return () => {
      live = false;
      window.clearTimeout(timeout);
    };
  }, [isPending, userId, retry, needAdmin]);

  const shownProfile = profile || (userId && heldAdmin.current?.userId === userId ? heldAdmin.current : null);
  const shownTwoFactor = twoFactor || (shownProfile ? SKIP_2FA : null);

  if (!userId) {
    if (!isPending) {
      const next =
        needAdmin && (!pathname.startsWith("/admin") || pathname.startsWith("/login"))
          ? "/admin"
          : pathname.startsWith("/") && !pathname.startsWith("//") && !pathname.startsWith("/login")
            ? pathname
            : needAdmin
              ? "/admin"
              : "/";
      return <Navigate to="/login" search={{ next }} />;
    }
    if (needAdmin && authWaited) {
      return <Navigate to="/login" search={{ next: "/admin" }} />;
    }
    return <AccountLoading />;
  }
  if (isPending && !shownProfile) {
    return <AccountLoading />;
  }
  if (error && !shownProfile) {
    const retryFn = () => {
      setError("");
      setProfile(null);
      setTwoFactor(null);
      setRetry((n) => n + 1);
    };
    if (fallback) return <>{fallback({ error, retry: retryFn })}</>;
    return (
      <div className="page-card">
        <h1>Could not load your account</h1>
        <p>{error}</p>
        <p className="ed-sub">
          {softGuest
            ? "Nothing was lost. Continue as guest to finish checkout, or try loading the account again."
            : "Nothing was lost. Tap Try again to open the shop desk."}
        </p>
        <div className="confirm-actions">
          {softGuest && onContinueAsGuest ? (
            <button type="button" className="btn-print" onClick={onContinueAsGuest}>
              Continue as guest
            </button>
          ) : null}
          <button type="button" className={softGuest ? "ed-btn" : "btn-print"} onClick={retryFn}>
            Try again
          </button>
        </div>
      </div>
    );
  }
  if (!shownProfile || !shownTwoFactor) return <AccountLoading />;
  if (needsSignupOtp(shownProfile.email) && !shownProfile.emailVerified && pathname !== "/login") {
    return <Navigate to="/login" search={{ next: pathname || "/" }} replace />;
  }
  if (shownProfile.banned) {
    return (
      <div className="page-card">
        <h1>Account restricted</h1>
        <p>This account has been restricted. Call the shop if you need help.</p>
        <Link to="/" className="btn-ghost">
          Back to menu
        </Link>
      </div>
    );
  }
  if (shownTwoFactor.enroll) {
    return (
      <div className="page-card">
        <h1>Set up two-factor</h1>
        <p>Settings requires an authenticator app before the desk can open.</p>
        <Link to="/enroll-2fa" search={{ next: pathname }} className="btn-print">
          Enroll authenticator
        </Link>
      </div>
    );
  }
  if (shownTwoFactor.required) {
    return (
      <div className="page-card">
        <h1>Two-factor check</h1>
        <p>Enter the code from your authenticator app to continue.</p>
        <Link to="/verify-2fa" search={{ next: pathname }} className="btn-print">
          Verify
        </Link>
      </div>
    );
  }
  if (needAdmin && !(shownProfile.adminModeAllowed || shownProfile.role === "admin" || shownProfile.adminMode)) {
    if (!shownProfile.adminExists) {
      return (
        <div className="page-card">
          <h1>Set up shop admin</h1>
          <p>
            No administrator exists yet. Claim this account as the shop admin to manage delivery
            zones, rewards, vacation mode, and the live menu.
          </p>
          <button
            type="button"
            className="btn-print"
            disabled={claiming}
            onClick={() => {
              setClaiming(true);
              void claimAdmin()
                .then(() => getMe().then(setProfile))
                .catch((e) => setError(e instanceof Error ? e.message : "Could not claim admin"))
                .finally(() => setClaiming(false));
            }}
          >
            {claiming ? "Saving…" : "Make this the admin account"}
          </button>
        </div>
      );
    }
    return (
      <div className="page-card">
        <h1>Staff only</h1>
        <p>This area is for the shop administrator.</p>
        <Link to="/" className="btn-ghost">
          Back to menu
        </Link>
      </div>
    );
  }
  return <>{children({ profile: shownProfile, twoFactor: shownTwoFactor })}</>;
}
