import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CircleHelp, LogOut, Monitor, ShoppingBag, UserRound } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { PizzaSpinner } from "@/components/pizza-spinner";
import { SignedOut } from "@/lib/auth/gates";
import { authEnabled, signOut } from "@/lib/auth/client";
import { useCurrentUserState, type AppUser } from "@/lib/auth/use-current-user";
import { onAdminInbox } from "@/lib/admin-inbox";
import { cartTotals, useCartStore } from "@/lib/cart-store";
import { onVisibleInterval } from "@/lib/page-visible";
import { formatPhone } from "@/lib/phone";
import { captureReferral, clearReferral, peekReferral } from "@/lib/referral";
import { claimReferral, getAdminInboxCount } from "@/lib/shop-server";
import type { ProfileView } from "@/lib/shop-types";

function accountLabel(profile?: ProfileView | null, user?: AppUser | null) {
  const raw = String(profile?.displayName || user?.displayName || "").trim();
  if (raw) return raw;
  const email = String(profile?.email || user?.primaryEmail || "").trim();
  const at = email.indexOf("@");
  if (at > 0) return email.slice(0, at);
  return "You";
}

export function AccountAvatar({
  src,
  name,
  size = 40,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  if (src) {
    return <img className="account-avatar" src={src} alt="" width={size} height={size} />;
  }
  return (
    <span className="account-avatar account-avatar-fallback" style={{ width: size, height: size }} aria-hidden>
      <UserRound size={Math.round(size * 0.52)} strokeWidth={2.2} />
      <span className="sr-only">{name}</span>
    </span>
  );
}

function SignOutItem() {
  const [signingOut, setSigningOut] = useState(false);
  const [outMsg, setOutMsg] = useState("");
  if (!authEnabled) return null;
  return (
    <>
      <button
        type="button"
        role="menuitem"
        className="account-menu-out"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          setOutMsg("");
          void signOut().catch((e) => {
            setSigningOut(false);
            setOutMsg(e instanceof Error ? e.message : "Could not sign out. Try again.");
          });
        }}
      >
        <LogOut size={16} strokeWidth={2.2} aria-hidden />
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
      {outMsg ? <p className="ed-sub account-menu-out-msg">{outMsg}</p> : null}
    </>
  );
}

function AccountMenu({
  label,
  email,
  phone,
  points,
  avatarUrl,
  isAdmin,
  adminUnread,
  unreadChats,
  adminExists,
}: {
  label: string;
  email: string;
  phone: string;
  points: number;
  avatarUrl?: string | null;
  isAdmin: boolean;
  adminUnread: number;
  unreadChats: number;
  adminExists: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const prettyPhone = phone ? formatPhone(phone) || phone : "";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={wrapRef} data-open={open ? "true" : undefined}>
      <button
        type="button"
        className="shop-nav-link shop-nav-avatar-btn"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu, ${label}`}
        onClick={() => setOpen((v) => !v)}
      >
        <AccountAvatar src={avatarUrl} name={label} size={40} />
        {adminUnread + unreadChats > 0 ? <span className="nav-pip">{adminUnread + unreadChats}</span> : null}
      </button>
      {open ? (
        <div className="account-menu-pop" role="menu">
          <div className="account-menu-card">
            <AccountAvatar src={avatarUrl} name={label} size={48} />
            <div className="account-menu-card-copy">
              <strong>{label}</strong>
              {isAdmin ? <span className="admin-mode-badge">Admin</span> : null}
              {email ? <em>{email}</em> : null}
              <span>
                {points} pts
                {prettyPhone ? ` · ${prettyPhone}` : ""}
              </span>
            </div>
          </div>
          {isAdmin ? (
            <Link to="/admin/pos" role="menuitem" onClick={() => setOpen(false)}>
              <Monitor size={16} strokeWidth={2.2} aria-hidden />
              POS
            </Link>
          ) : null}
          <Link to="/account" role="menuitem" onClick={() => setOpen(false)}>
            <UserRound size={16} strokeWidth={2.2} aria-hidden />
            Your account
          </Link>
          <Link to="/install" role="menuitem" className="account-menu-app" onClick={() => setOpen(false)}>
            <img src="/icon-180.png" alt="" width={20} height={20} className="account-menu-app-icon" />
            Download App
          </Link>
          <Link to="/help" role="menuitem" onClick={() => setOpen(false)}>
            <CircleHelp size={16} strokeWidth={2.2} aria-hidden />
            Help
            {unreadChats > 0 ? <span className="nav-pip">{unreadChats}</span> : null}
          </Link>
          {isAdmin ? (
            <Link to="/admin/menu" search={{}} role="menuitem" onClick={() => setOpen(false)}>
              <Monitor size={16} strokeWidth={2.2} aria-hidden />
              Admin
              {adminUnread > 0 ? <span className="nav-pip">{adminUnread}</span> : null}
            </Link>
          ) : null}
          {!isAdmin && !adminExists ? (
            <Link to="/admin/menu" search={{}} role="menuitem" onClick={() => setOpen(false)}>
              Shop admin
            </Link>
          ) : null}
          <SignOutItem />
        </div>
      ) : null}
    </div>
  );
}

export function ShopHeader({
  title,
  profile,
  onOpenCart,
}: {
  title?: string;
  profile?: ProfileView | null;
  onOpenCart?: () => void;
}) {
  const { isPending, user } = useCurrentUserState();
  const [authReady, setAuthReady] = useState(false);
  const [adminUnread, setAdminUnread] = useState(profile?.adminInbox ?? 0);
  const [liveProfile, setLiveProfile] = useState(profile ?? null);
  const lines = useCartStore((s) => s.lines);
  const bagOpen = useCartStore((s) => s.bagOpen);
  const { count } = cartTotals(lines);
  const isAdmin = Boolean(liveProfile?.adminModeAllowed || liveProfile?.role === "admin" || liveProfile?.adminMode);
  const headerRef = useRef<HTMLElement>(null);
  const avatarUrl = liveProfile?.avatarUrl || user?.profileImageUrl || "";

  useEffect(() => {
    setLiveProfile(profile ?? null);
  }, [profile]);

  useEffect(() => {
    setAuthReady(true);
    captureReferral();
  }, []);

  useEffect(() => {
    if (isPending || !user) return;
    const code = peekReferral();
    if (!code) return;
    void claimReferral({ data: { code } })
      .then(() => clearReferral())
      .catch(() => clearReferral());
  }, [isPending, user]);

  useEffect(() => {
    setAdminUnread(liveProfile?.adminInbox ?? 0);
  }, [liveProfile?.adminInbox]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const apply = () => {
      document.documentElement.style.setProperty("--shop-sticky-top", `${el.offsetHeight}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isAdmin, adminUnread, count, authReady, isPending, user, avatarUrl]);

  useEffect(() => {
    if (!isAdmin) return;
    const stopListen = onAdminInbox(setAdminUnread);
    const stopPoll = onVisibleInterval(10000, () => {
      void getAdminInboxCount()
        .then((r) => setAdminUnread(r.unread))
        .catch(() => undefined);
    });
    return () => {
      stopListen();
      stopPoll();
    };
  }, [isAdmin]);

  return (
    <header className="shop-header no-print" id="shop-top" ref={headerRef} data-staff={isAdmin ? "true" : undefined}>
      <div className="shop-header-inner">
        <Link to="/" className="shop-brand">
          <BrandMark variant="stamp" />
          <span className="shop-brand-text">
            <span className="shop-brand-kicker">Egg Harbor Township</span>
            <span className="shop-brand-name">{title ?? "South End Pizza III"}</span>
          </span>
        </Link>
        {authReady && !isPending && user ? (
          <nav className="shop-nav" aria-label="Shop">
            <AccountMenu
              label={accountLabel(liveProfile, user)}
              email={liveProfile?.email || user.primaryEmail || ""}
              phone={liveProfile?.phone || ""}
              points={liveProfile?.points ?? 0}
              avatarUrl={avatarUrl}
              isAdmin={isAdmin}
              adminUnread={adminUnread}
              unreadChats={liveProfile?.unreadChats ?? 0}
              adminExists={liveProfile?.adminExists ?? true}
            />
          </nav>
        ) : null}
        <div className="shop-header-actions">
          {!authReady || isPending ? (
            <span className="header-account-wait">
              <PizzaSpinner size="sm" />
            </span>
          ) : null}
          {authReady && !isPending ? (
            <SignedOut>
              <Link to="/login" className="btn-ghost">
                <UserRound size={16} strokeWidth={2.2} />
                Sign in
              </Link>
            </SignedOut>
          ) : null}
          {onOpenCart ? (
            <button
              type="button"
              className="btn-print cart-btn"
              onClick={onOpenCart}
              aria-expanded={bagOpen}
              aria-haspopup="dialog"
              aria-controls="bag"
            >
              <ShoppingBag size={18} strokeWidth={2.2} />
              <span className="cart-btn-label">Cart</span>
              {count ? (
                <span className="cart-count" aria-live="polite">
                  {count}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
