import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, X } from "lucide-react";
import { ADMIN_NAV } from "@/lib/admin-nav";
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

export function AdminDrawer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [outMsg, setOutMsg] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  return (
    <>
      <div className="admin-top-cluster">
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
        {[...ADMIN_NAV]
          .sort((a, b) => {
            const rank = (item: (typeof ADMIN_NAV)[number]) => (item.pin === "start" ? 0 : item.pin === "end" ? 2 : 1);
            const d = rank(a) - rank(b);
            if (d) return d;
            return a.label.localeCompare(b.label, "en");
          })
          .map((item) => {
            const on = item.exact ? pathname === item.to || pathname === `${item.to}/` : pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
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
