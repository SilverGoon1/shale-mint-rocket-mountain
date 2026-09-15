import { useEffect, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { GROK_PROVIDERS, authClient, authEnabled, dropClientSession } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { friendlyAuthError, startSocialSignIn } from "@/lib/login-social";
import { identifierToEmail, maskEmail, maskPhone, needsEmailOtp, needsPhoneOtp } from "@/lib/phone";
import { captureReferral, peekReferral } from "@/lib/referral";
import {
  claimReferral,
  getMe,
  getSocialSignIn,
  getStorefront,
  sendSignupEmailCode,
  sendSignupPhoneCode,
  updateProfile,
  verifySignupEmailCode,
  verifySignupPhoneCode,
} from "@/lib/shop-server";
import { isStaffAdminAccount, isStaffAdminUsername } from "@/lib/staff-admin";
import { noteStaffDeskLogin } from "@/lib/shop-server";
import { BrandMark } from "@/components/brand-mark";
import { PizzaSpinner } from "@/components/pizza-spinner";

function formatOtpLeft(seconds: number) {
  if (seconds >= 60) return `${Math.ceil(seconds / 60)} min`;
  return `${seconds}s`;
}

function safeNext(raw: unknown) {
  if (typeof raw !== "string") return undefined;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) return undefined;
  if (raw === "/") return undefined;
  return raw;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { next?: string; ref?: string; error?: string } => {
    const next = safeNext(search.next);
    const ref = typeof search.ref === "string" ? search.ref.trim().toUpperCase() : "";
    const error = typeof search.error === "string" ? search.error.trim() : "";
    const out: { next?: string; ref?: string; error?: string } = {};
    if (next) out.next = next;
    if (/^[A-Z0-9]{4,16}$/.test(ref)) out.ref = ref;
    if (error) out.error = error.slice(0, 180);
    return out;
  },
  component: Login,
});

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.18v2.96h5.27c-.23 1.37-1.55 4.02-5.27 4.02A6.13 6.13 0 1 1 12.17 5.9c1.75 0 2.93.75 3.6 1.4l2.45-2.36C16.8 3.54 14.7 2.6 12.17 2.6A9.4 9.4 0 1 0 21.57 12c0-.6-.06-.9-.22-.9Z"
      />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.1 10.35 21.2 2h-1.68l-6.16 7.24L8.44 2H2.5l7.45 10.86L2.5 22h1.68l6.52-7.66L15.56 22H21.5l-7.4-11.65Zm-2.3 2.71-.76-1.08-6.02-8.6h2.59l4.86 6.95.76 1.08 6.32 9.04h-2.59l-5.16-7.39Z"
      />
    </svg>
  );
}

function providerMark(label: string) {
  if (label === "X") return <XMark />;
  return <GoogleMark />;
}

type VerifyStep = {
  email: string;
  masked: string;
  previewCode?: string;
  channel: "email" | "phone";
};

function Login() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const { next, ref, error: searchError } = Route.useSearch();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [tab, setTab] = useState<"in" | "up">("in");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(searchError ? friendlyAuthError(new Error(searchError)) : "");
  const [busy, setBusy] = useState(false);
  const [showMark, setShowMark] = useState(true);
  const [verifyStep, setVerifyStep] = useState<VerifyStep | null>(null);
  const [signupOtp, setSignupOtp] = useState("");
  const [otpLeft, setOtpLeft] = useState(0);
  const [otpExpires, setOtpExpires] = useState(0);
  const [gatePending, setGatePending] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);
  const [connectWaited, setConnectWaited] = useState(false);
  const connectTimer = useRef<number | null>(null);
  const [socialConfigured, setSocialConfigured] = useState<boolean | null>(null);
  const verifyStepRef = useRef<VerifyStep | null>(null);
  verifyStepRef.current = verifyStep;

  const closeTo = (next || "/") as "/";

  useEffect(() => {
    captureReferral(ref);
  }, [ref]);

  useEffect(() => {
    void getStorefront()
      .then((d) => setShowMark(d.settings.showMark))
      .catch(() => setShowMark(true));
    void getSocialSignIn()
      .then((d) => setSocialConfigured(Boolean(d.configured)))
      .catch(() => setSocialConfigured(false));
  }, []);

  // If a credential session exists but is unverified, force the OTP step
  // (blocks refresh / deep-link skip). OAuth + desk Admin skip. Phone uses SMS.
  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setGatePending(false);
      setGateChecked(true);
      return;
    }
    if (verifyStep) {
      setGatePending(false);
      setGateChecked(true);
      return;
    }
    let cancelled = false;
    setGatePending(true);
    setGateChecked(false);
    void (async () => {
      try {
        const me = await getMe();
        if (cancelled) return;
        const email = String(me.email || user.primaryEmail || "")
          .trim()
          .toLowerCase();
        if (!email) {
          setError("Could not confirm your account. Try signing in again.");
          return;
        }
        const phone = needsPhoneOtp(email);
        const mail = needsEmailOtp(email);
        if ((!phone && !mail) || me.emailVerified) return;
        let masked = phone ? maskPhone(email) : maskEmail(email);
        let previewCode: string | undefined;
        let expiresIn = phone ? 600 : 120;
        let resendIn = phone ? 60 : 120;
        try {
          const sent = phone
            ? await sendSignupPhoneCode({ data: { email } })
            : await sendSignupEmailCode({ data: { email } });
          if (cancelled) return;
          if (sent.alreadyVerified) return;
          if ("phone" in sent && sent.phone) masked = sent.phone;
          else if ("email" in sent) masked = sent.email;
          previewCode = sent.previewCode;
          expiresIn = sent.expiresIn || expiresIn;
          resendIn = "resendIn" in sent && sent.resendIn ? sent.resendIn : sent.expiresIn || (phone ? 60 : 120);
        } catch (sendErr) {
          if (cancelled) return;
          const msg = sendErr instanceof Error ? sendErr.message : "Could not send a verification code.";
          if (!/already on the way|wait 60|wait 2/i.test(msg)) setError(msg);
        }
        if (cancelled) return;
        if (verifyStepRef.current) return;
        setVerifyStep({
          email,
          masked,
          previewCode,
          channel: phone ? "phone" : "email",
        });
        setSignupOtp("");
        setOtpLeft(resendIn);
        setOtpExpires(expiresIn);
      } catch {
        if (cancelled || verifyStepRef.current) return;
        const email = String(user.primaryEmail ?? "")
          .trim()
          .toLowerCase();
        if (email && (needsEmailOtp(email) || needsPhoneOtp(email))) {
          const phone = needsPhoneOtp(email);
          setVerifyStep({
            email,
            masked: phone ? maskPhone(email) : maskEmail(email),
            channel: phone ? "phone" : "email",
          });
          setSignupOtp("");
          setOtpLeft(phone ? 60 : 120);
          setOtpExpires(phone ? 600 : 120);
        } else {
          setError("Could not confirm your account. Try signing in again.");
        }
      } finally {
        if (!cancelled) {
          setGatePending(false);
          setGateChecked(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, verifyStep, isPending]);

  useEffect(() => {
    if (otpLeft <= 0) return;
    const t = window.setInterval(() => setOtpLeft((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearInterval(t);
  }, [otpLeft]);

  useEffect(() => {
    if (otpExpires <= 0) return;
    const t = window.setInterval(() => setOtpExpires((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearInterval(t);
  }, [otpExpires]);

  useEffect(() => {
    const connecting = !busy && !verifyStep && (isPending || gatePending || Boolean(user && !gateChecked));
    if (!connecting) {
      if (connectTimer.current) {
        window.clearTimeout(connectTimer.current);
        connectTimer.current = null;
      }
      return;
    }
    if (connectWaited || connectTimer.current) return;
    connectTimer.current = window.setTimeout(() => {
      connectTimer.current = null;
      setConnectWaited(true);
      setGatePending(false);
      setGateChecked(true);
      setError("Could not finish connecting. Sign in again.");
      setTab("in");
    }, 6000);
  }, [isPending, gatePending, user, gateChecked, busy, verifyStep, connectWaited, error]);

  // Keep the form up while a submit is in flight so a session refetch cannot
  // trap the visitor on "Checking sign-in…" after email login.
  // Stay on the OTP step even when a session already exists (unverified email).
  // A failed password MUST stay on this form with the error — never hop into
  // a leftover desk session.
  if ((isPending || gatePending || (user && !gateChecked)) && !busy && !verifyStep && !error && !connectWaited) {
    return (
      <main className="login-page" data-popup="true">
        {user ? <div className="login-scrim" aria-hidden /> : <Link to={closeTo} className="login-scrim" aria-label="Close sign-in" />}
        <section className="login-card login-dialog" role="status" aria-busy="true" aria-labelledby="login-title">
          <PizzaSpinner size="md" />
          <h1 id="login-title">Loading account</h1>
          <p className="ed-sub">Connecting you to the shop…</p>
        </section>
      </main>
    );
  }
  if (user && !isPending && !busy && !verifyStep && !gatePending && gateChecked && !error) return <Navigate to={closeTo} replace />;

  async function abandonVerify() {
    setBusy(true);
    setError("");
    try {
      await dropClientSession();
    } catch {
      /* still leave OTP / signed-out path */
    }
    setVerifyStep(null);
    setBusy(false);
    void navigate({ to: "/", replace: true });
  }

  async function beginVerify(email: string) {
    if (needsPhoneOtp(email)) {
      const sent = await sendSignupPhoneCode({ data: { email } });
      if (sent.alreadyVerified) return true;
      setVerifyStep({
        email,
        masked: sent.phone,
        previewCode: sent.previewCode,
        channel: "phone",
      });
      setSignupOtp("");
      setOtpLeft(sent.resendIn || 60);
      setOtpExpires(sent.expiresIn || 600);
      return false;
    }
    if (!needsEmailOtp(email)) return true;
    const sent = await sendSignupEmailCode({ data: { email } });
    if (sent.alreadyVerified) return true;
    setVerifyStep({
      email,
      masked: sent.email,
      previewCode: sent.previewCode,
      channel: "email",
    });
    setSignupOtp("");
    setOtpLeft(sent.expiresIn || 120);
    setOtpExpires(sent.expiresIn || 120);
    return false;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const parsed = identifierToEmail(identifier);
    if (mode === "phone" && !parsed.phone) {
      setBusy(false);
      setError("Enter a 10-digit US phone number.");
      return;
    }
    if (mode === "email" && !parsed.email.includes("@")) {
      setBusy(false);
      setError("Enter a valid email or the shop username.");
      return;
    }
    if (tab === "up" && password.length < 8) {
      setBusy(false);
      setError("Password needs at least 8 characters.");
      return;
    }
    if (tab === "up" && password !== password2) {
      setBusy(false);
      setError("Password and confirm password do not match.");
      return;
    }
    try {
      if (!authEnabled) throw new Error("Sign-in is disabled.");
      if (tab === "up") {
        const { error: err } = await authClient.signUp.email({
          email: parsed.email,
          password,
          name: name || (parsed.phone ? parsed.phone : parsed.email.split("@")[0]),
        });
        if (err) throw new Error(err.message || "Could not create the account.");
        if (parsed.phone || name) {
          void updateProfile({ data: { phone: parsed.phone ?? "", displayName: name } }).catch(() => undefined);
        }
        const invite = peekReferral();
        if (invite) {
          void claimReferral({ data: { code: invite } }).catch(() => undefined);
        }
        if (needsEmailOtp(parsed.email) || needsPhoneOtp(parsed.email)) {
          const ok = await beginVerify(parsed.email);
          if (!ok) {
            setBusy(false);
            return;
          }
        }
      } else {
        const { data, error: err } = await authClient.signIn.email({
          email: parsed.email,
          password,
        });
        if (err || !data?.user) {
          throw new Error(err?.message || "Invalid email, username, or password.");
        }
        if (isStaffAdminAccount(undefined, parsed.email) || isStaffAdminUsername(identifier)) {
          void noteStaffDeskLogin().catch(() => undefined);
        }
        if (needsEmailOtp(parsed.email) || needsPhoneOtp(parsed.email)) {
          const ok = await beginVerify(parsed.email);
          if (!ok) {
            setBusy(false);
            return;
          }
        }
      }
      void navigate({ to: closeTo, replace: true });
    } catch (err) {
      const username = mode === "email" && !identifier.includes("@");
      setError(friendlyAuthError(err, { username }));
      setBusy(false);
      void dropClientSession();
    }
  }

  async function submitVerify(e: FormEvent) {
    e.preventDefault();
    if (!verifyStep) return;
    setError("");
    setBusy(true);
    try {
      if (verifyStep.channel === "phone") {
        await verifySignupPhoneCode({ data: { email: verifyStep.email, code: signupOtp } });
      } else {
        await verifySignupEmailCode({ data: { email: verifyStep.email, code: signupOtp } });
      }
      setVerifyStep(null);
      void navigate({ to: closeTo, replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify that code.");
      setBusy(false);
    }
  }

  async function resendVerify() {
    if (!verifyStep || otpLeft > 0) return;
    setError("");
    setBusy(true);
    try {
      const sent =
        verifyStep.channel === "phone"
          ? await sendSignupPhoneCode({ data: { email: verifyStep.email } })
          : await sendSignupEmailCode({ data: { email: verifyStep.email } });
      if (sent.alreadyVerified) {
        setVerifyStep(null);
        void navigate({ to: closeTo, replace: true });
        return;
      }
      setVerifyStep({
        email: verifyStep.email,
        masked: "phone" in sent && sent.phone ? sent.phone : "email" in sent ? sent.email : verifyStep.masked,
        previewCode: sent.previewCode,
        channel: verifyStep.channel,
      });
      setSignupOtp("");
      setOtpLeft("resendIn" in sent && sent.resendIn ? sent.resendIn : sent.expiresIn || (verifyStep.channel === "phone" ? 60 : 120));
      setOtpExpires(sent.expiresIn || (verifyStep.channel === "phone" ? 600 : 120));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send another code.");
    } finally {
      setBusy(false);
    }
  }

  async function social(providerId: string) {
    setError("");
    setBusy(true);
    try {
      if (!authEnabled) throw new Error("Sign-in is disabled.");
      await startSocialSignIn(providerId, {
        callbackURL: next || "/",
        errorCallbackURL: "/login?error=social",
      });
      void navigate({ to: closeTo, replace: true });
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  const lockDismiss = Boolean(verifyStep) || Boolean(user);

  return (
    <main className="login-page" data-popup="true">
      {lockDismiss ? (
        <div className="login-scrim" aria-hidden />
      ) : (
        <Link to={closeTo} className="login-scrim" aria-label="Close sign-in" />
      )}
      <section
        className="login-card login-dialog"
        data-error={error ? "true" : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        {lockDismiss ? (
          <button type="button" className="login-close" aria-label="Cancel and sign out" onClick={() => void abandonVerify()}>
            <X size={18} strokeWidth={2.4} aria-hidden />
          </button>
        ) : (
          <Link to={closeTo} className="login-close" aria-label="Back to the menu">
            <X size={18} strokeWidth={2.4} aria-hidden />
          </Link>
        )}
        {showMark ? <BrandMark variant="login" /> : null}
        <p className="shop-brand-kicker">South End Pizza III</p>
        {verifyStep ? (
          <>
            <h1 id="login-title">{verifyStep.channel === "phone" ? "Check your texts" : "Check your inbox"}</h1>
            <p className="ed-sub">
              {verifyStep.channel === "phone"
                ? `We sent a 6-digit code to ${verifyStep.masked}. Enter it below to finish setting up your South End Pizza account.`
                : `We sent a 6-digit code to ${verifyStep.masked}. Enter it below to finish setting up your South End Pizza account.`}
            </p>
            <form className="login-form" onSubmit={(e) => void submitVerify(e)}>
              <div className="mail-slip" role="status">
                <p className="slip-kind">
                  {verifyStep.channel === "phone" ? `Text · ${verifyStep.masked}` : `Inbox · ${verifyStep.masked}`}
                </p>
                <strong>
                  {verifyStep.channel === "phone"
                    ? "Your South End Pizza signup code"
                    : "Your South End Pizza signup code"}
                </strong>
                {verifyStep.previewCode && otpExpires > 0 ? (
                  <p className="otp-code">{verifyStep.previewCode}</p>
                ) : (
                  <p className="ed-sub">
                    {otpExpires > 0
                      ? `Enter the 6-digit code. ${formatOtpLeft(otpExpires)} left.`
                      : "That code expired. Send a new one."}
                  </p>
                )}
                {verifyStep.previewCode && otpExpires > 0 ? (
                  <p className="ed-sub">
                    {verifyStep.channel === "phone"
                      ? `This shop preview shows the text here. It expires in ${formatOtpLeft(otpExpires)}.`
                      : `This shop preview shows the message here. It expires in ${formatOtpLeft(otpExpires)}.`}
                  </p>
                ) : null}
              </div>
              <label className="ed-field">
                <span>One-time code</span>
                <input
                  className="ed-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={signupOtp}
                  onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  minLength={6}
                  maxLength={6}
                  required
                />
              </label>
              {error ? <p className="form-error">{error}</p> : null}
              <button type="submit" className="btn-print" disabled={busy || signupOtp.length !== 6}>
                {busy ? "Please wait…" : "Verify & continue"}
              </button>
              <button
                type="button"
                className="ed-btn ed-btn-quiet"
                disabled={busy || otpLeft > 0}
                onClick={() => void resendVerify()}
              >
                {otpLeft > 0 ? `Send again in ${formatOtpLeft(otpLeft)}` : "Send a new code"}
              </button>
              <button type="button" className="ed-btn ed-btn-quiet" disabled={busy} onClick={() => void abandonVerify()}>
                Cancel — sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 id="login-title">{tab === "up" ? "Create account" : "Welcome back"}</h1>
            <p className="ed-sub login-lede">
              {next === "/checkout"
                ? "Sign in to place your order, or check out as a guest. Your cart stays on this device."
                : socialConfigured
                  ? "Email, the shop username, or a US phone number. Google and X work too."
                  : "Email, the shop username, or a US phone number."}
            </p>
            <div className="seg" role="group" aria-label="Identifier type">
              <button type="button" data-on={mode === "email"} onClick={() => setMode("email")}>
                Email
              </button>
              <button type="button" data-on={mode === "phone"} onClick={() => setMode("phone")}>
                Phone
              </button>
            </div>
            <div className="seg" role="group" aria-label="Create or sign in">
              <button type="button" data-on={tab === "in"} onClick={() => setTab("in")}>
                Sign in
              </button>
              <button type="button" data-on={tab === "up"} onClick={() => setTab("up")}>
                Create account
              </button>
            </div>
            <form className="login-form" onSubmit={(e) => void submit(e)}>
              {tab === "up" ? (
                <label className="ed-field">
                  <span>Name</span>
                  <input className="ed-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </label>
              ) : null}
              <label className="ed-field">
                <span>{mode === "phone" ? "Phone" : "Email or username"}</span>
                <input
                  className="ed-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete={mode === "phone" ? "tel" : "username"}
                  inputMode={mode === "phone" ? "tel" : "email"}
                  placeholder={mode === "phone" ? "(609) 555-0100" : "you@email.com or username"}
                  required
                />
              </label>
              <label className="ed-field">
                <span>Password</span>
                <input
                  className="ed-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={tab === "up" ? "new-password" : "current-password"}
                  placeholder="Password"
                  minLength={isStaffAdminUsername(identifier) ? 4 : 8}
                  required
                />
              </label>
              {tab === "up" ? (
                <label className="ed-field">
                  <span>Confirm password</span>
                  <input
                    className="ed-input"
                    type="password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>
              ) : null}
              {error ? <p className="form-error">{error}</p> : null}
              <button type="submit" className="btn-print" disabled={busy}>
                {busy ? (
                  <span className="login-busy">
                    <PizzaSpinner size="sm" />
                    Loading account
                  </span>
                ) : tab === "up" ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </button>
              {tab === "in" ? (
                <Link to="/recover" className="login-back">
                  Forgot password?
                </Link>
              ) : null}
            </form>
            {socialConfigured === true ? (
              <>
                <div className="login-split">or continue with</div>
                <div className="login-socials">
                  {GROK_PROVIDERS.map((p) => (
                    <button
                      key={p.providerId}
                      type="button"
                      className="login-social"
                      disabled={busy}
                      onClick={() => void social(p.providerId)}
                    >
                      {busy ? <PizzaSpinner size="sm" /> : providerMark(p.label)}
                      {p.label}
                    </button>
                  ))}
                </div>
              </>
            ) : socialConfigured === false ? (
              <p className="ed-sub login-social-off">Social sign-in isn't configured for this shop — use email.</p>
            ) : null}
            {next === "/checkout" ? (
              <Link to="/checkout" className="login-back">
                Checkout as a guest
              </Link>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
