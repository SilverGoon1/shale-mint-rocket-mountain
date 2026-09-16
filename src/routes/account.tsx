import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Copy, ImagePlus, Link2 } from "lucide-react";
import { AccountAvatar, ShopHeader } from "@/components/shop-header";
import { InviteQr } from "@/components/invite-qr";
import { SessionGate } from "@/components/guards";
import { useCartStore } from "@/lib/cart-store";
import { fileToDataImage } from "@/lib/image-file";
import { formatPhone } from "@/lib/phone";
import { formatShopWhen } from "@/lib/hours";
import { AddressSuggest } from "@/components/address-suggest";
import {
  changeMyPassword,
  confirmTotpSetup,
  deleteMyAccount,
  disableTotp,
  getMyRewards,
  listMyOrders,
  sendPasswordResetCode,
  setMyAvatar,
  startTotpSetup,
  updateProfile,
} from "@/lib/shop-server";
import { signOut } from "@/lib/auth/client";
import {
  formatUsd,
  formatTicketNo,
  type OrderView,
  type ProfileView,
  type RewardsKind,
  type RewardsView,
} from "@/lib/shop-types";
import { OrderDateTrays } from "@/components/order-trays";

const TABS = ["details", "security", "orders", "rewards"] as const;
type AccountTab = (typeof TABS)[number];

function asTab(raw: unknown): AccountTab {
  const s = String(raw ?? "details");
  if (s === "summary") return "details";
  return (TABS as readonly string[]).includes(s) ? (s as AccountTab) : "details";
}

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>): { tab?: AccountTab; ticket?: string } => {
    const tab = asTab(search.tab);
    const ticket = String(search.ticket ?? "").trim();
    const out: { tab?: AccountTab; ticket?: string } = {};
    if (tab !== "details") out.tab = tab;
    if (ticket) out.ticket = ticket;
    return out;
  },
  component: AccountPage,
});

function AccountPage() {
  const { tab, ticket } = Route.useSearch();
  return (
    <div className="shop-shell">
      <SessionGate>
        {({ profile, twoFactor }) => (
          <>
            <ShopHeader profile={profile} />
            <main className="shop-main account-main" id="main">
              <AccountBody
                profile={profile}
                totpLocked={twoFactor.locked}
                tab={asTab(tab)}
                ticket={ticket}
              />
            </main>
          </>
        )}
      </SessionGate>
    </div>
  );
}

function AccountBody({
  profile,
  totpLocked,
  tab,
  ticket,
}: {
  profile: ProfileView;
  totpLocked: boolean;
  tab: AccountTab;
  ticket?: string;
}) {
  const navigate = useNavigate();
  const add = useCartStore((s) => s.add);
  const setNotes = useCartStore((s) => s.setNotes);
  const [phone, setPhone] = useState(profile.phone);
  const [name, setName] = useState(profile.displayName);
  const [address, setAddress] = useState(profile.addressLine);
  const [city, setCity] = useState(profile.city);
  const [zip, setZip] = useState(profile.zip);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [rewards, setRewards] = useState<RewardsView | null>(null);
  const [msg, setMsg] = useState("");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [totpOn, setTotpOn] = useState(profile.totpEnabled);
  const email = profile.email;
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passBusy, setPassBusy] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState("");
  const [previewCode, setPreviewCode] = useState("");
  const [otpLeft, setOtpLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState("");
  const [deletePass, setDeletePass] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    void listMyOrders().then(setOrders).catch(() => setOrders([]));
    void getMyRewards().then(setRewards).catch(() => setRewards(null));
  }, []);

  useEffect(() => {
    if (otpLeft <= 0) return;
    const t = window.setInterval(() => setOtpLeft((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearInterval(t);
  }, [otpLeft]);

  const inviteUrl = useMemo(() => {
    const code = rewards?.referralCode || profile.referralCode;
    if (typeof window === "undefined" || !code) return "";
    return `${window.location.origin}/login?ref=${encodeURIComponent(code)}`;
  }, [rewards?.referralCode, profile.referralCode]);

  function go(next: AccountTab) {
    void navigate({ to: "/account", search: next === "details" ? {} : { tab: next } });
  }

  const who = name.trim() || profile.displayName || "there";
  const points = rewards?.points ?? profile.points;

  return (
    <>
      <header className="page-card account-hero">
        <p className="shop-brand-kicker">Your account</p>
        <div className="account-hero-who">
          <AccountAvatar src={avatarUrl} name={who} size={72} />
          <div>
            <h1>Hello, {who}</h1>
            <p className="ed-sub">
              {email || "Signed in"}
              {phone ? ` · ${formatPhone(phone) || phone}` : ""}
            </p>
            <p className="points-chip">{points} reward points</p>
          </div>
        </div>
      </header>

      <div className="account-tabs" role="tablist" aria-label="Account">
        {(
          [
            ["details", "Details"],
            ["security", "Security"],
            ["orders", "Orders"],
            ["rewards", "Rewards"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            data-on={tab === id}
            onClick={() => go(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "orders" ? (
        <section className="page-card">
          <h2>Order history</h2>
          <OrderDateTrays
            orders={orders}
            empty="No orders yet."
            openTicket={ticket || orders[0]?.ticketNo}
          >
            {(o) => (
              <li key={o.id} className="account-order" data-ticket={String(o.ticketNo ?? "").replace(/\D/g, "")}>
                <div>
                  <strong>#{formatTicketNo(o.ticketNo)}</strong>
                  <span className="order-meta">
                    {formatShopWhen(o.createdAt)} · {o.fulfillment} · {o.status}
                    {o.tax ? ` · tax ${formatUsd(o.tax)}` : ""}
                  </span>
                  {o.notes ? <p className="ed-sub">Note: {o.notes}</p> : null}
                  {o.pickupName ? <p className="ed-sub">Pickup for {o.pickupName}</p> : null}
                  {o.scheduledFor ? <p className="ed-sub">Scheduled {formatShopWhen(o.scheduledFor)}</p> : null}
                  <ul>
                    {o.items.map((it, i) => (
                      <li key={i}>
                        {it.qty}× {it.name}
                        {it.size ? ` (${it.size})` : ""}
                        {it.detail ? ` — ${it.detail}` : ""}
                        {it.comment ? <span className="cook-note">{it.comment}</span> : null}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="ed-btn"
                    onClick={() => {
                      for (const it of o.items) {
                        add({
                          itemId: it.itemId,
                          categoryId: it.categoryId,
                          name: it.name,
                          size: it.size,
                          detail: it.detail,
                          comment: it.comment,
                          toppings: it.toppings,
                          halfItemId: it.halfItemId,
                          unitPrice: it.unitPrice,
                          qty: it.qty,
                        });
                      }
                      if (o.notes) setNotes(o.notes);
                      void navigate({ to: "/" });
                    }}
                  >
                    Reorder
                  </button>
                </div>
                <strong>{formatUsd(o.total)}</strong>
              </li>
            )}
          </OrderDateTrays>
        </section>
      ) : null}

      {tab === "details" ? (
        <section className="page-card">
          <h2>Account details</h2>
          <p className="ed-sub">The name on tickets, the phone the shop texts, and the address used for delivery.</p>
          <div className="ed-shop">
            <div className="account-icon-edit">
              <AccountAvatar src={avatarUrl} name={who} size={72} />
              <div>
                <span className="ed-field">
                  <span>Account icon</span>
                </span>
                <p className="ed-sub">This picture shows in the title bar. Square photos work best.</p>
                <div className="account-icon-actions">
                  <label className="ed-btn ed-btn-quiet ed-photo-pick">
                    <ImagePlus size={14} strokeWidth={2.2} />
                    {avatarUrl ? "Replace photo" : "Upload photo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={photoBusy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        setPhotoBusy(true);
                        setPhotoErr("");
                        void fileToDataImage(file, { maxEdge: 384, maxChars: 120000, quality: 0.84 })
                          .then((url) => setMyAvatar({ data: { image: url } }).then((r) => setAvatarUrl(r.avatarUrl)))
                          .catch((err) => setPhotoErr(err instanceof Error ? err.message : "Could not save that photo"))
                          .finally(() => setPhotoBusy(false));
                      }}
                    />
                  </label>
                  {avatarUrl ? (
                    <button
                      type="button"
                      className="ed-btn ed-btn-quiet"
                      disabled={photoBusy}
                      onClick={() => {
                        setPhotoBusy(true);
                        setPhotoErr("");
                        void setMyAvatar({ data: { image: "" } })
                          .then((r) => setAvatarUrl(r.avatarUrl))
                          .catch((err) => setPhotoErr(err instanceof Error ? err.message : "Could not remove that photo"))
                          .finally(() => setPhotoBusy(false));
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                {photoBusy ? <p className="ed-empty">Saving photo…</p> : null}
                {photoErr ? <p className="form-error">{photoErr}</p> : null}
              </div>
            </div>
            <label className="ed-field">
              <span>Name</span>
              <input className="ed-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label className="ed-field">
              <span>Phone</span>
              <input
                className="ed-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <label className="ed-field">
              <span>Email</span>
              <input className="ed-input" type="email" value={email} readOnly autoComplete="email" />
            </label>
            <label className="ed-field">
              <span>Street address</span>
              <AddressSuggest
                street={address}
                onStreetChange={setAddress}
                onPick={(hit) => {
                  setAddress(hit.street);
                  if (hit.city) setCity(hit.city);
                  if (hit.zip) setZip(hit.zip);
                }}
                placeholder="Start typing a street"
              />
            </label>
            <div className="account-cityzip">
              <label className="ed-field">
                <span>City</span>
                <input
                  className="ed-input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                  placeholder="Egg Harbor Township"
                />
              </label>
              <label className="ed-field">
                <span>ZIP</span>
                <input
                  className="ed-input"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  placeholder="08234"
                />
              </label>
            </div>
            <button
              type="button"
              className="ed-btn"
              onClick={() => {
                void updateProfile({
                  data: { phone, displayName: name, addressLine: address, city, zip },
                })
                  .then(() => setMsg("Saved."))
                  .catch((e) => setMsg(e instanceof Error ? e.message : "Could not save"));
              }}
            >
              Save profile
            </button>
            {msg ? <p className="ed-sub">{msg}</p> : null}
          </div>
        </section>
      ) : null}

      {tab === "security" ? (
        <>
          <section className="page-card">
            <h2>Reset password</h2>
            <p className="ed-sub">
              We email a 60-second one-time code to the address on this account. Enter that code, then choose a new
              password. Google and X logins keep using those buttons.
            </p>
            <div className="login-form">
              <label className="ed-field">
                <span>Email on this account</span>
                <input className="ed-input" type="email" value={email} readOnly autoComplete="email" />
              </label>
              <button
                type="button"
                className="ed-btn"
                disabled={passBusy || otpLeft > 0}
                onClick={() => {
                  setPassBusy(true);
                  setMsg("");
                  void sendPasswordResetCode()
                    .then((r) => {
                      setOtpSent(r.email);
                      setPreviewCode(r.previewCode || "");
                      setOtpLeft(r.expiresIn);
                      setOtp("");
                      setMsg(`Code sent to ${r.email}. It expires in 60 seconds.`);
                    })
                    .catch((err) => setMsg(err instanceof Error ? err.message : "Could not send the code"))
                    .finally(() => setPassBusy(false));
                }}
              >
                {otpLeft > 0 ? `Send again in ${otpLeft}s` : "Send one-time code"}
              </button>
              {otpSent ? (
                <div className="mail-slip" role="status">
                  <p className="slip-kind">Inbox · {otpSent}</p>
                  <strong>Your South End Pizza III reset code</strong>
                  {previewCode && otpLeft > 0 ? (
                    <p className="otp-code">{previewCode}</p>
                  ) : (
                    <p className="ed-sub">
                      {otpLeft > 0 ? `Enter the 6-digit code. ${otpLeft}s left.` : "That code expired. Send a new one."}
                    </p>
                  )}
                  {previewCode && otpLeft > 0 ? (
                    <p className="ed-sub">This shop preview shows the message here. It expires in {otpLeft}s.</p>
                  ) : null}
                </div>
              ) : null}
              <form
                className="login-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newPass !== confirmPass) {
                    setMsg("The new passwords do not match.");
                    return;
                  }
                  setPassBusy(true);
                  setMsg("");
                  void changeMyPassword({ data: { code: otp, password: newPass } })
                    .then(() => {
                      setNewPass("");
                      setConfirmPass("");
                      setOtp("");
                      setPreviewCode("");
                      setOtpLeft(0);
                      setMsg("Password updated. Use it the next time you sign in.");
                    })
                    .catch((err) => setMsg(err instanceof Error ? err.message : "Could not update password"))
                    .finally(() => setPassBusy(false));
                }}
              >
                <label className="ed-field">
                  <span>One-time code</span>
                  <input
                    className="ed-input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                    placeholder="6 digits"
                  />
                </label>
                <label className="ed-field">
                  <span>New password</span>
                  <input
                    className="ed-input"
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>
                <label className="ed-field">
                  <span>Confirm password</span>
                  <input
                    className="ed-input"
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </label>
                <button type="submit" className="btn-print" disabled={passBusy || otp.length !== 6}>
                  {passBusy ? "Saving…" : "Set new password"}
                </button>
              </form>
            </div>
          </section>

          <section className="page-card">
            <h2>Two-factor authentication</h2>
            <p className="ed-sub">
              Protect the account with an authenticator app (Google Authenticator, Authy, 1Password). This is app-based
              2FA — not SMS.
            </p>
            {totpOn ? (
              totpLocked ? (
                <p className="ed-sub">
                  Settings requires shop admin two-factor. Turn that off under Admin → Settings if you want to drop the
                  authenticator, or rotate it by enrolling a new key after a verified session.
                </p>
              ) : (
              <form
                className="login-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void disableTotp({ data: { code } })
                    .then(() => {
                      setTotpOn(false);
                      setCode("");
                      setMsg("Two-factor turned off.");
                    })
                    .catch((err) => setMsg(err instanceof Error ? err.message : "Could not disable"));
                }}
              >
                <label className="ed-field">
                  <span>Code to turn off</span>
                  <input className="ed-input" value={code} onChange={(e) => setCode(e.target.value)} />
                </label>
                <button type="submit" className="ed-btn">
                  Turn off 2FA
                </button>
              </form>
              )
            ) : (
              <div className="login-form">
                <button
                  type="button"
                  className="ed-btn"
                  onClick={() => {
                    void startTotpSetup().then((r) => {
                      setSecret(r.secret);
                      setUri(r.uri);
                    });
                  }}
                >
                  Set up authenticator
                </button>
                {secret ? (
                  <>
                    <p className="ed-sub">
                      Add this key in your app, then enter a code to confirm. {formatPhone(phone)}
                    </p>
                    <code className="totp-secret">{secret}</code>
                    <p className="ed-sub break-all">{uri}</p>
                    <label className="ed-field">
                      <span>Confirm code</span>
                      <input className="ed-input" value={code} onChange={(e) => setCode(e.target.value)} />
                    </label>
                    <button
                      type="button"
                      className="btn-print"
                      onClick={() => {
                        void confirmTotpSetup({ data: { code } })
                          .then(() => {
                            setTotpOn(true);
                            setSecret("");
                            setMsg("Two-factor is on.");
                          })
                          .catch((err) => setMsg(err instanceof Error ? err.message : "Could not enable"));
                      }}
                    >
                      Confirm 2FA
                    </button>
                  </>
                ) : null}
              </div>
            )}
            {msg ? <p className="ed-sub">{msg}</p> : null}
          </section>

          <section className="page-card">
            <h2>Delete account</h2>
            <p className="ed-sub">
              Permanently removes your login, saved address, rewards, and chats. Past tickets stay on the shop books
              with the name “Deleted account.” This cannot be undone.
            </p>
            <form
              className="login-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!deletePass) {
                  setMsg("Enter your password to delete this account.");
                  return;
                }
                if (!window.confirm("Delete your South End account? Tickets stay with the shop. This cannot be undone.")) {
                  return;
                }
                setDeleteBusy(true);
                setMsg("");
                void deleteMyAccount({ data: { password: deletePass } })
                  .then(() => signOut("/"))
                  .catch((err) => {
                    setMsg(err instanceof Error ? err.message : "Could not delete the account.");
                    setDeleteBusy(false);
                  });
              }}
            >
              <label className="ed-field">
                <span>Current password</span>
                <input
                  className="ed-input"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={deletePass}
                  onChange={(e) => setDeletePass(e.target.value)}
                />
              </label>
              <button type="submit" className="ed-btn ticket-del" disabled={deleteBusy}>
                {deleteBusy ? "Deleting…" : "Delete my account"}
              </button>
            </form>
          </section>
        </>
      ) : null}

      {tab === "rewards" ? (
        <RewardsTab
          rewards={rewards}
          inviteUrl={inviteUrl}
          copied={copied}
          onCopied={() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          }}
        />
      ) : null}
    </>
  );
}

function kindLabel(kind: RewardsKind) {
  if (kind === "welcome") return "Welcome";
  if (kind === "earn") return "Earned";
  if (kind === "redeem") return "Redeemed";
  if (kind === "invite") return "Invite bonus";
  if (kind === "invitee") return "Friend invite";
  return "Adjustment";
}

function RewardsTab({
  rewards,
  inviteUrl,
  copied,
  onCopied,
}: {
  rewards: RewardsView | null;
  inviteUrl: string;
  copied: boolean;
  onCopied: () => void;
}) {
  if (!rewards) return <div className="page-skel">Loading rewards…</div>;
  const earn = Math.round(20 * (rewards.pointsPerDollar || 0));

  return (
    <>
      <section className="page-card">
        <h2>Rewards program</h2>
        <p className="ed-sub">
          Earn {rewards.pointsPerDollar} point{rewards.pointsPerDollar === 1 ? "" : "s"} per dollar on food. {rewards.redeemRate}{" "}
          points = $1 off at checkout.
        </p>
        <div className="rewards-preview">
          <span className="points-chip">{rewards.points} pts in wallet</span>
          <span className="points-chip">{earn} pts on a $20 pie</span>
          <span className="points-chip">{rewards.welcomeBonus} welcome pts</span>
        </div>
      </section>

      <section className="page-card">
        <h2>Invite friends</h2>
        <p className="ed-sub">
          Share your link or QR. A friend who creates an account gets {rewards.inviteeBonus} extra points. You get{" "}
          {rewards.inviteBonus} points when they join.
        </p>
        <label className="ed-field">
          <span>Your invite link</span>
          <input className="ed-input" value={inviteUrl} readOnly />
        </label>
        <div className="account-quick">
          <button
            type="button"
            className="ed-btn"
            onClick={() => {
              if (!inviteUrl) return;
              void navigator.clipboard.writeText(inviteUrl).then(onCopied).catch(() => undefined);
            }}
          >
            <Copy size={16} strokeWidth={2.2} />
            {copied ? "Copied" : "Copy link"}
          </button>
          <a className="ed-btn" href={inviteUrl || "#"} onClick={(e) => !inviteUrl && e.preventDefault()}>
            <Link2 size={16} strokeWidth={2.2} />
            Open link
          </a>
        </div>
        {inviteUrl ? (
          <div className="invite-qr-wrap">
            <InviteQr value={inviteUrl} label="Invite QR code" />
            <p className="ed-sub">
              Code {rewards.referralCode}. {rewards.inviteCount} friend{rewards.inviteCount === 1 ? "" : "s"} joined.
            </p>
          </div>
        ) : null}
        {rewards.invited.length ? (
          <ul className="invite-friends">
            {rewards.invited.map((row, i) => (
              <li key={`${row.at}-${i}`}>
                <strong>{row.name}</strong>
                <span>{row.at ? formatShopWhen(row.at) : ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ed-sub">No friends have joined with your code yet.</p>
        )}
      </section>

      <section className="page-card">
        <h2>Rewards history</h2>
        {rewards.history.length ? (
          <ul className="rewards-log">
            {rewards.history.map((row) => (
              <li key={row.id}>
                <div>
                  <strong>{kindLabel(row.kind)}</strong>
                  <span className="order-meta">
                    {row.createdAt ? formatShopWhen(row.createdAt) : ""}
                    {row.note ? ` · ${row.note}` : ""}
                  </span>
                </div>
                <strong data-neg={row.points < 0 ? "true" : undefined}>
                  {row.points > 0 ? "+" : ""}
                  {row.points}
                </strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ed-sub">No points movement yet. Place an order or invite a friend.</p>
        )}
      </section>
    </>
  );
}
