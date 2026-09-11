import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUp, MessageCircle, Phone, X } from "lucide-react";
import { CustomerChat } from "@/components/customer-chat";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RESTAURANT } from "@/data/menu";
import { onVisibleInterval } from "@/lib/page-visible";
import { getMe, getShopContact } from "@/lib/shop-server";

const HIDDEN = [/^\/admin/, /^\/board/, /^\/login/, /^\/verify-2fa/, /^\/auth/, /^\/help/, /^\/pair-printer/, /^\/checkout/];

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isScrollable(el: Element) {
  if (!(el instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(el);
  if (!/(auto|scroll|overlay)/.test(style.overflowY)) return false;
  return el.scrollHeight > el.clientHeight + 2;
}

function scrollPageToTop() {
  const instant = prefersReducedMotion();
  const behavior: ScrollBehavior = instant ? "auto" : "smooth";
  const header = document.getElementById("shop-top") ?? document.querySelector(".shop-header");
  const nodes = new Set<HTMLElement>();
  let node: HTMLElement | null = header instanceof HTMLElement ? header : document.body;
  while (node) {
    if (isScrollable(node)) nodes.add(node);
    node = node.parentElement;
  }
  if (document.scrollingElement instanceof HTMLElement) nodes.add(document.scrollingElement);
  nodes.add(document.documentElement);
  if (document.body) nodes.add(document.body);
  document.querySelectorAll<HTMLElement>(".app-root, .shop-shell, .shop-main, .store-layout").forEach((el) => {
    if (isScrollable(el) || el.scrollTop > 0) nodes.add(el);
  });

  const jump = (smooth: boolean) => {
    const how: ScrollBehavior = smooth ? behavior : "auto";
    try {
      window.scrollTo({ top: 0, left: 0, behavior: how });
    } catch {
      window.scrollTo(0, 0);
    }
    try {
      window.parent?.scrollTo?.({ top: 0, left: 0, behavior: how });
    } catch {
      /* cross-origin preview host */
    }
    for (const el of nodes) {
      try {
        el.scrollTo({ top: 0, left: 0, behavior: how });
      } catch {
        el.scrollTop = 0;
      }
    }
    if (header instanceof HTMLElement) {
      try {
        header.scrollIntoView({ block: "start", inline: "nearest", behavior: how });
      } catch {
        /* */
      }
    }
  };

  jump(true);
  window.requestAnimationFrame(() => {
    const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (y > 4) jump(false);
  });
  window.setTimeout(() => {
    const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (y > 4) jump(false);
  }, 320);
}

export function SupportDock() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [phone, setPhone] = useState(RESTAURANT.phone);
  const [phoneHref, setPhoneHref] = useState(RESTAURANT.phoneHref);
  const [titleVisible, setTitleVisible] = useState(true);

  const hide = HIDDEN.some((re) => re.test(pathname));

  useEffect(() => {
    const el = document.querySelector(".shop-header");
    if (!el) {
      setTitleVisible(false);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setTitleVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    void getShopContact()
      .then((d) => {
        setPhone(d.phone);
        setPhoneHref(d.phoneHref);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setUnread(0);
      return;
    }
    return onVisibleInterval(open ? 8000 : 30000, () => {
      void getMe()
        .then((p) => {
          setUnread(p.unreadChats);
        })
        .catch(() => undefined);
    });
  }, [isPending, user, open]);

  if (hide) return null;

  return (
    <div className="support-dock no-print">
      {open ? (
        <section className="dock-panel" aria-label="Chat with the shop">
          <header className="dock-panel-head">
            <div>
              <p className="shop-brand-kicker">South End Pizza III</p>
              <h2>Chat</h2>
            </div>
            <button type="button" className="ed-icon-btn" aria-label="Close chat" onClick={() => setOpen(false)}>
              <X size={16} strokeWidth={2.2} />
            </button>
          </header>
          <SignedOut>
            <p className="ed-sub">Sign in to message the shop. Calling does not need an account.</p>
            <Link to="/login" search={{ next: pathname }} className="btn-print">
              Sign in to chat
            </Link>
          </SignedOut>
          <SignedIn>
            <CustomerChat compact />
          </SignedIn>
        </section>
      ) : null}
      <div className="dock-fabs">
        {!titleVisible ? (
          <button type="button" className="dock-fab dock-top" aria-label="Back to top" onClick={scrollPageToTop}>
            <ArrowUp size={20} strokeWidth={2.2} />
            <span>Top</span>
          </button>
        ) : null}
        <a className="dock-fab dock-call" href={phoneHref} aria-label={`Call the shop at ${phone}`}>
          <Phone size={20} strokeWidth={2.2} />
          <span>Call</span>
        </a>
        <button
          type="button"
          className="dock-fab dock-chat"
          aria-label="Chat with the shop"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <MessageCircle size={20} strokeWidth={2.2} />
          <span>Chat</span>
          {unread > 0 ? <em className="nav-pip">{unread}</em> : null}
        </button>
      </div>
    </div>
  );
}
