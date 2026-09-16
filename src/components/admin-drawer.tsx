import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, X } from "lucide-react";
import { ADMIN_NAV, type AdminNavItem } from "@/lib/admin-nav";
import { onAdminInbox } from "@/lib/admin-inbox";
import { signOut } from "@/lib/auth/client";
import { onVisibleInterval } from "@/lib/page-visible";
import { getAdminInboxCount } from "@/lib/shop-server";

function noDragProps() {
  return {
    draggable: false as const,
    onDragStart: (e: { preventDefault: () => void }) => e.preventDefault(),
    onMouseDown: (e: { stopPropagation: () => void }) => e.stopPropagation(),
    onPointerDown: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  };
}

function menuTab(search: unknown) {
  if (search && typeof search === "object" && "tab" in search) {
    return String((search as { tab?: unknown }).tab ?? "");
  }
  const raw = typeof search === "string" ? search.replace(/^\?/, "") : "";
  return new URLSearchParams(raw).get("tab") ?? "";
}

function navIsOn(item: AdminNavItem, pathname: string, tab: string) {
  const onMenu = pathname === "/admin/menu" || pathname.startsWith("/admin/menu/");
  if (item.to === "/admin/menu" && onMenu) {
    if (item.label === "Shop") return tab === "shop";
    if (item.label === "Menu") return ["menu", "toppings", "shop", "payments", "delivery", "printers", ""].includes(tab);
  }
  if (item.exact) return pathname === item.to || pathname === `${item.to}/`;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function diagUnlocked() {
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("diag") === "1") return true;
    return window.localStorage.getItem("southend-diag") === "1";
  } catch {
    return false;
  }
}

const AdminMenuCtx = createContext<{
  open: boolean;
  setOpen: (next: boolean | ((cur: boolean) => boolean)) => void;
  unread: number;
} | null>(null);

export function AdminMenuProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search });
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setOpen(false);
  }, [pathname, search]);

  useEffect(() => {
    const pull = () => {
      void getAdminInboxCount()
        .then((r) => setUnread(r.unread))
        .catch(() => undefined);
    };
    pull();
    const stopListen = onAdminInbox(setUnread);
    const stopPoll = onVisibleInterval(12000, pull);
    return () => {
      stopListen();
      stopPoll();
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const value = useMemo(() => ({ open, setOpen, unread }), [open, unread]);
  return <AdminMenuCtx.Provider value={value}>{children}</AdminMenuCtx.Provider>;
}

export function AdminMenuToggle() {
  const ctx = useContext(AdminMenuCtx);
  if (!ctx) return null;
  const { open, setOpen, unread } = ctx;
  return (
    <button
      type="button"
      className="admin-drawer-toggle"
      aria-expanded={open}
      aria-controls="admin-drawer"
      {...noDragProps()}
      onClick={() => setOpen((v) => !v)}
    >
      {open ? <X size={18} strokeWidth={2.2} /> : <Menu size={18} strokeWidth={2.2} />}
      {open ? "Close" : "Menu"}
      {!open && unread > 0 ? <span className="nav-pip">{unread}</span> : null}
    </button>
  );
}

function useAdminMenu() {
  const ctx = useContext(AdminMenuCtx);
  if (!ctx) throw new Error("Admin menu needs AdminMenuProvider");
  return ctx;
}

export function AdminDrawer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search });
  const tab = menuTab(search);
  const { open, setOpen, unread } = useAdminMenu();
  const [outMsg, setOutMsg] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [diag, setDiag] = useState(false);

  useEffect(() => {
    setDiag(diagUnlocked());
  }, [pathname, search]);

  return (
    <>
      <div className="admin-top-cluster">
        <div id="admin-top-extra" className="admin-top-extra" />
      </div>
      {open ? (
        <button type="button" className="admin-drawer-scrim" aria-label="Close admin menu" {...noDragProps()} onClick={() => setOpen(false)} />
      ) : null}
      <nav
        id="admin-drawer"
        className="admin-drawer"
        data-open={open}
        aria-label="Admin"
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <Link to="/" className="shop-nav-link" data-on={pathname === "/"} {...noDragProps()}>
          Main menu
        </Link>
        <p className="shop-brand-kicker">Admin</p>
        {ADMIN_NAV.map((item) => {
          const on = navIsOn(item, pathname, tab);
          return (
            <Link
              key={`${item.to}:${item.label}:${item.search?.tab ?? ""}`}
              to={item.to}
              search={item.search}
              className="shop-nav-link"
              data-on={on}
              activeOptions={item.exact ? { exact: true } : undefined}
              {...noDragProps()}
            >
              {item.label}
              {item.pip && unread > 0 ? <span className="nav-pip">{unread}</span> : null}
            </Link>
          );
        })}
        {diag ? (
          <>
            <Link
              to="/admin/bots"
              className="shop-nav-link"
              data-on={pathname === "/admin/bots" || pathname.startsWith("/admin/bots/")}
              {...noDragProps()}
            >
              Bot access
            </Link>
            <Link
              to="/admin/patches"
              className="shop-nav-link"
              data-on={pathname === "/admin/patches" || pathname.startsWith("/admin/patches/")}
              {...noDragProps()}
            >
              Patches
            </Link>
          </>
        ) : null}
        <button
          type="button"
          className="shop-nav-link admin-drawer-logout"
          disabled={signingOut}
          {...noDragProps()}
          onClick={() => {
            setOutMsg("");
            setSigningOut(true);
            void signOut("/").catch((e) => {
              setSigningOut(false);
              setOutMsg(e instanceof Error ? e.message : "Could not sign out");
            });
          }}
        >
          <LogOut size={16} strokeWidth={2.2} />
          {signingOut ? "Signing out…" : "Log out"}
        </button>
        {outMsg ? <p className="ed-sub">{outMsg}</p> : null}
      </nav>
    </>
  );
}