import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Clock, MapPin, Minus, Phone, Plus, Search, X } from "lucide-react";
import { ItemConfirm } from "@/components/item-confirm";
import { PizzaCustomize } from "@/components/pizza-customize";
import { WingsCustomize } from "@/components/wings-customize";
import { StaleCartPrompt } from "@/components/stale-cart";
import { iconFor } from "@/data/icons";
import { itemPhoto } from "@/data/item-photos";
import type { MenuCategory, MenuItem, RestaurantInfo } from "@/data/menu";
import { useCartStore, cartTotals } from "@/lib/cart-store";
import { useDialogLock } from "@/lib/dialog-lock";
import { cardTypeStyle, formatUsd, type ProfileView, type ShopSettingsPublic } from "@/lib/shop-types";
import { isWingsBuild } from "@/lib/wings";

function priceNum(p: string) {
  const n = Number(String(p).replace(/^\$/, ""));
  return Number.isFinite(n) ? n : 0;
}

type MenuHit = { cat: MenuCategory; item: MenuItem; score: number };

function rankMenu(categories: MenuCategory[], query: string): MenuHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hits: MenuHit[] = [];
  for (const cat of categories) {
    for (const item of cat.items) {
      const name = item.name.toLowerCase();
      const desc = (item.description ?? "").toLowerCase();
      const catName = cat.name.toLowerCase();
      let score = 0;
      if (name === needle) score = 100;
      else if (name.startsWith(needle)) score = 80;
      else if (name.split(/\s+/).some((w) => w.startsWith(needle))) score = 70;
      else if (name.includes(needle)) score = 60;
      else if (desc.includes(needle)) score = 40;
      else if (catName.includes(needle)) score = 20;
      if (score) hits.push({ cat, item, score });
    }
  }
  hits.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
  return hits.slice(0, 8);
}

const CatalogItem = memo(function CatalogItem({
  cat,
  item,
  hit,
  onOpen,
}: {
  cat: MenuCategory;
  item: MenuItem;
  hit?: boolean;
  onOpen: () => void;
}) {
  const first = item.prices[0];
  const pizza = cat.kind === "pizza";
  const itemKey = item.id ?? item.name;
  const photo = item.hideImage ? "" : itemPhoto(item, cat.id);
  const price = pizza
    ? `from ${formatUsd(priceNum(item.prices[0]?.price ?? "0"))}`
    : formatUsd(priceNum(first?.price ?? "0"));

  return (
    <button
      type="button"
      className="food-card"
      data-fav={item.highlight ? "true" : undefined}
      data-hit={hit || undefined}
      data-has-photo={photo ? "true" : undefined}
      data-text-only={photo ? undefined : "true"}
      id={`item-${itemKey}`}
      onClick={onOpen}
      aria-label={`${item.name}, ${price}`}
    >
      {photo ? (
        <span className="food-card-photo">
          <img src={photo} alt="" decoding="async" loading="lazy" />
        </span>
      ) : null}
      <span className="food-card-copy">
        <span className="food-card-name">
          {item.name}
          {item.highlight ? <em className="fav-tag">House favorite</em> : null}
        </span>
        {item.description ? <span className="food-card-desc">{item.description}</span> : null}
        <span className="food-price">{price}</span>
      </span>
    </button>
  );
});

function CartPop({
  count,
  subtotal,
  vacationOn,
  onClose,
}: {
  count: number;
  subtotal: number;
  vacationOn: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lines = useCartStore((s) => s.lines);
  const setQty = useCartStore((s) => s.setQty);
  const notes = useCartStore((s) => s.notes);
  const setNotes = useCartStore((s) => s.setNotes);
  useDialogLock(onClose, panelRef);

  return (
    <div className="pizza-modal-root cart-pop-root" role="presentation">
      <button type="button" className="pizza-modal-scrim" aria-label="Close cart" onClick={onClose} />
      <div
        ref={panelRef}
        id="bag"
        className="pizza-modal cart-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="pizza-modal-head">
          <div>
            <p className="shop-brand-kicker">Bag</p>
            <h2 id={titleId}>Your order</h2>
          </div>
          <button type="button" className="ed-icon-btn" aria-label="Close cart" onClick={onClose}>
            <X size={16} strokeWidth={2.2} />
          </button>
        </header>
        {lines.length === 0 ? (
          <p className="ed-empty">Add pies, subs, and sides. Pickup or delivery at checkout.</p>
        ) : (
          <ul className="cart-lines">
            {lines.map((l) => (
              <li key={l.key}>
                <div>
                  <strong>{l.name}</strong>
                  {l.size ? <span className="cart-size">{l.size}</span> : null}
                  {l.detail ? <span className="cart-size">{l.detail}</span> : null}
                  {l.comment ? <span className="cook-note">{l.comment}</span> : null}
                  <div className="cart-line-price">{formatUsd(l.unitPrice * l.qty)}</div>
                </div>
                <div className="qty-step">
                  <button type="button" aria-label={`Fewer ${l.name}`} onClick={() => setQty(l.key, l.qty - 1)}>
                    <Minus size={14} />
                  </button>
                  <span>{l.qty}</span>
                  <button type="button" aria-label={`More ${l.name}`} onClick={() => setQty(l.key, l.qty + 1)}>
                    <Plus size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <label className="ed-field cart-notes">
          <span>Order notes</span>
          <textarea
            className="ed-input ed-area"
            rows={3}
            maxLength={500}
            placeholder="e.g. extra napkins, gate code"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            suppressHydrationWarning
          />
        </label>
        <div className="cart-total">
          <span>
            {count} item{count === 1 ? "" : "s"}
          </span>
          <strong>{formatUsd(subtotal)}</strong>
        </div>
        {vacationOn ? (
          <p className="ed-empty">Ordering is paused until the shop reopens.</p>
        ) : count === 0 ? (
          <button type="button" className="btn-print cart-check" disabled>
            Add items to check out
          </button>
        ) : (
          <Link to="/checkout" className="btn-print cart-check" onClick={onClose}>
            Checkout
          </Link>
        )}
      </div>
    </div>
  );
}

export function Storefront({
  restaurant,
  categories,
  settings,
}: {
  restaurant: RestaurantInfo;
  categories: MenuCategory[];
  settings: ShopSettingsPublic;
  profile?: ProfileView | null;
}) {
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const [custom, setCustom] = useState<{ cat: MenuCategory; item: MenuItem; size: string } | null>(null);
  const [confirm, setConfirm] = useState<{ cat: MenuCategory; item: MenuItem } | null>(null);
  const [wings, setWings] = useState<{ cat: MenuCategory; item: MenuItem } | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [hitId, setHitId] = useState("");
  const railRef = useRef<HTMLElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchSlotRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const add = useCartStore((s) => s.add);
  const bagOpen = useCartStore((s) => s.bagOpen);
  const closeBag = useCartStore((s) => s.closeBag);
  const lines = useCartStore((s) => s.lines);
  const { count, subtotal } = cartTotals(lines);
  const suggestions = useMemo(() => rankMenu(categories, query), [categories, query]);
  const pickupAt = `${restaurant.address}, ${restaurant.city}`;
  const spyLock = useRef(false);
  const spyGen = useRef(0);

  function railBehavior(): ScrollBehavior {
    if (typeof window === "undefined") return "smooth";
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }

  function centerActivePill(id: string, smooth = false) {
    const rail = railRef.current;
    if (!rail) return;
    const btn = rail.querySelector<HTMLElement>(`[data-cat="${CSS.escape(id)}"]`);
    if (!btn) return;
    const railRect = rail.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const sticky = rail.querySelector<HTMLElement>(".cat-search-slot");
    const leftPad = sticky ? sticky.getBoundingClientRect().width : 0;
    const visibleLeft = railRect.left + leftPad;
    const visibleWidth = Math.max(1, railRect.width - leftPad);
    const target = visibleLeft + visibleWidth / 2;
    const current = btnRect.left + btnRect.width / 2;
    const left = Math.max(0, rail.scrollLeft + (current - target));
    const behavior: ScrollBehavior = smooth && railBehavior() === "smooth" ? "smooth" : "auto";
    try {
      rail.scrollTo({ left, behavior });
    } catch {
      rail.scrollLeft = left;
    }
  }

  function pulseArrow(btn: HTMLButtonElement) {
    btn.classList.remove("is-pulse");
    void btn.offsetWidth;
    btn.classList.add("is-pulse");
    window.setTimeout(() => btn.classList.remove("is-pulse"), 220);
  }

  function pickCategory(id: string) {
    const stacked = spyLock.current;
    setActive(id);
    const gen = ++spyGen.current;
    spyLock.current = true;
    centerActivePill(id, !stacked);
    window.setTimeout(() => {
      if (gen !== spyGen.current) return;
      const panel = document.getElementById(`menu-${id}`);
      const wrap = document.querySelector(".cat-search-wrap");
      if (!panel) {
        spyLock.current = false;
        return;
      }
      const offset = wrap instanceof HTMLElement ? wrap.getBoundingClientRect().height + 10 : 88;
      const y = window.scrollY + panel.getBoundingClientRect().top - offset;
      const how: ScrollBehavior = stacked || railBehavior() === "auto" ? "auto" : "smooth";
      try {
        window.scrollTo({ top: Math.max(0, y), behavior: how });
      } catch {
        window.scrollTo(0, Math.max(0, y));
      }
      const unlock = () => {
        if (gen !== spyGen.current) return;
        spyLock.current = false;
      };
      const onEnd = () => {
        window.removeEventListener("scrollend", onEnd);
        unlock();
      };
      window.addEventListener("scrollend", onEnd);
      window.setTimeout(() => {
        window.removeEventListener("scrollend", onEnd);
        unlock();
      }, 1100);
    }, 10);
  }

  function openItem(cat: MenuCategory, item: MenuItem) {
    if (cat.kind === "pizza") {
      setCustom({ cat, item, size: item.prices[0]?.label || "" });
      return;
    }
    if (isWingsBuild(cat, item)) {
      setWings({ cat, item });
      return;
    }
    setConfirm({ cat, item });
  }

  function skipCategories(dir: -1 | 1) {
    const n = categories.length;
    if (!n) return;
    const i = Math.max(0, categories.findIndex((c) => c.id === active));
    const next = (i + dir + n) % n;
    if (categories[next]) pickCategory(categories[next].id);
  }

  function jumpTo(hit: MenuHit) {
    setActive(hit.cat.id);
    setHitId(hit.item.id ?? hit.item.name);
    setSearchOpen(false);
    setQuery("");
    pickCategory(hit.cat.id);
    window.setTimeout(() => openItem(hit.cat, hit.item), 80);
  }

  useEffect(() => {
    if (!bagOpen) return;
    const kick = window.setTimeout(() => {
      document.querySelectorAll(".cart-pop .cart-check").forEach((el) => {
        el.classList.remove("is-glow");
        window.requestAnimationFrame(() => el.classList.add("is-glow"));
      });
    }, 40);
    const clear = window.setTimeout(() => {
      document.querySelectorAll(".cart-pop .cart-check").forEach((el) => el.classList.remove("is-glow"));
    }, 1240);
    return () => {
      window.clearTimeout(kick);
      window.clearTimeout(clear);
    };
  }, [bagOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: PointerEvent) => {
      const wrap = searchWrapRef.current;
      if (wrap && !wrap.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen && query.trim()) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".cat-panel[data-cat]"));
    if (!sections.length) return;
    let tick: number | null = null;
    const spyLine = () => {
      const wrap = document.querySelector(".cat-search-wrap");
      return wrap instanceof HTMLElement ? wrap.getBoundingClientRect().bottom + 10 : 96;
    };
    const pickVisible = () => {
      if (spyLock.current) return;
      const line = spyLine();
      let crossed: HTMLElement | null = null;
      for (const s of sections) {
        if (s.getBoundingClientRect().top - line <= 8) crossed = s;
        else break;
      }
      const id = crossed?.dataset.cat;
      if (!id) return;
      setActive((prev) => {
        if (prev === id) return prev;
        const prevEl = sections.find((s) => s.dataset.cat === prev);
        if (prevEl) {
          const top = prevEl.getBoundingClientRect().top;
          const bottom = prevEl.getBoundingClientRect().bottom;
          if (top < line - 12 && bottom > line + 80) return prev;
        }
        const prevIdx = sections.findIndex((s) => s.dataset.cat === prev);
        const nextIdx = sections.findIndex((s) => s.dataset.cat === id);
        if (prevIdx >= 0 && Math.abs(nextIdx - prevIdx) > 1) {
          const neighbor = sections[prevIdx + Math.sign(nextIdx - prevIdx)];
          const nTop = neighbor?.getBoundingClientRect().top ?? 0;
          if (neighbor && nTop - line < 48) return neighbor.dataset.cat ?? id;
        }
        return id;
      });
    };
    const onScroll = () => {
      if (tick != null) window.cancelAnimationFrame(tick);
      tick = window.requestAnimationFrame(pickVisible);
    };
    pickVisible();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (tick != null) window.cancelAnimationFrame(tick);
      window.removeEventListener("scroll", onScroll);
    };
  }, [categories, searchOpen, query]);

  useEffect(() => {
    if (!active || searchOpen) return;
    if (spyLock.current) return;
    centerActivePill(active, false);
  }, [active, searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const rail = railRef.current;
    if (rail) {
      try {
        rail.scrollTo({ left: 0, behavior: railBehavior() });
      } catch {
        rail.scrollLeft = 0;
      }
    }
    window.setTimeout(() => searchInputRef.current?.focus(), 20);
  }, [searchOpen]);

  return (
    <div className="store-layout">
      <StaleCartPrompt />
      <div className="store-main">
        <section className="shop-hero">
          <div className="shop-hero-copy">
            <h1 className="sr-only">{restaurant.name}</h1>
            {settings.tagline ? <p className="shop-hero-tag">{settings.tagline}</p> : null}
            <p className="shop-hero-hours">
              <Clock size={14} strokeWidth={2.2} />
              {settings.hoursSummary || restaurant.hours}
              {settings.openNow ? <span className="open-pip">Open</span> : <span className="closed-pip">Closed</span>}
            </p>
            <p>
              <MapPin size={14} strokeWidth={2.2} />
              {pickupAt}
            </p>
            <p>
              <Phone size={14} strokeWidth={2.2} />
              <a href={restaurant.phoneHref}>{restaurant.phone}</a>
            </p>
          </div>
        </section>
        {settings.vacationOn ? (
          <div className="vac-banner" role="status">
            <strong>Closed for vacation</strong>
            <p>{settings.vacationMessage}</p>
            {settings.vacationUntil ? <p>Back {settings.vacationUntil}</p> : null}
          </div>
        ) : !settings.openNow ? (
          <div className="vac-banner" role="status">
            <strong>Kitchen is closed</strong>
            <p>You can still browse. {settings.hoursSummary}</p>
          </div>
        ) : null}
        <div className="cat-search-wrap" ref={searchWrapRef} data-search-open={searchOpen ? "true" : undefined}>
          <div className="cat-sorter">
            <button
              type="button"
              className="cat-skip"
              aria-label="Previous category"
              onClick={(e) => {
                pulseArrow(e.currentTarget);
                skipCategories(-1);
              }}
            >
              <ChevronLeft size={20} strokeWidth={2.4} />
            </button>
            <nav className="cat-rail" aria-label="Menu categories" ref={railRef}>
              <div className="cat-search-slot" ref={searchSlotRef}>
                <button
                  type="button"
                  className="cat-search cat-search-icon"
                  aria-label={searchOpen ? "Close menu search" : "Search the menu"}
                  aria-expanded={searchOpen}
                  onClick={() => {
                    setSearchOpen((open) => {
                      if (open) setQuery("");
                      return !open;
                    });
                  }}
                >
                  {searchOpen ? <X size={18} strokeWidth={2.2} aria-hidden /> : <Search size={18} strokeWidth={2.2} aria-hidden />}
                </button>
              </div>
              {categories.map((cat) => {
                const Icon = iconFor(cat.icon ?? cat.id);
                const on = active === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    data-on={on}
                    data-cat={cat.id}
                    aria-current={on ? "true" : undefined}
                    onClick={() => {
                      setSearchOpen(false);
                      pickCategory(cat.id);
                    }}
                  >
                    <Icon size={16} strokeWidth={2.2} />
                    {cat.name}
                  </button>
                );
              })}
            </nav>
            <button
              type="button"
              className="cat-skip"
              aria-label="Next category"
              onClick={(e) => {
                pulseArrow(e.currentTarget);
                skipCategories(1);
              }}
            >
              <ChevronRight size={20} strokeWidth={2.4} />
            </button>
          </div>
          {searchOpen ? (
            <div className="cat-suggest" role="listbox" aria-label="Menu suggestions">
              <label className="cat-search-field">
                <Search size={16} strokeWidth={2.2} aria-hidden />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      setQuery("");
                    }
                    if (e.key === "Enter" && suggestions[0]) {
                      e.preventDefault();
                      jumpTo(suggestions[0]);
                    }
                  }}
                  aria-label="Search the menu"
                  autoComplete="off"
                  enterKeyHint="search"
                />
              </label>
              {query.trim() ? (
                suggestions.length === 0 ? (
                  <p className="cat-suggest-empty">No matches for “{query.trim()}”.</p>
                ) : (
                  <ul className="cat-suggest-list">
                    {suggestions.map((hit) => (
                      <li key={`${hit.cat.id}-${hit.item.id ?? hit.item.name}`}>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => jumpTo(hit)}>
                          <strong>{hit.item.name}</strong>
                          <em>{hit.cat.name}</em>
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <p className="cat-suggest-empty">Type a dish name.</p>
              )}
            </div>
          ) : null}
        </div>
        {categories.map((cat) => (
          <section key={cat.id} className="cat-panel" id={`menu-${cat.id}`} data-cat={cat.id}>
            <header className="cat-panel-head">
              <h2>{cat.name}</h2>
            </header>
            <div
              className="food-grid"
              data-count={cat.items.length}
              data-card-size={settings.cardTextSize}
              data-card-fit={settings.cardSize}
              style={cardTypeStyle(settings.cardTextColor, settings.cardDescColor, settings.cardPriceColor, settings.cardBg)}
            >
              {cat.items.map((item) => (
                <CatalogItem
                  key={item.id ?? item.name}
                  cat={cat}
                  item={item}
                  hit={hitId === (item.id ?? item.name)}
                  onOpen={() => openItem(cat, item)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      {bagOpen ? (
        <CartPop
          count={count}
          subtotal={subtotal}
          vacationOn={settings.vacationOn}
          onClose={closeBag}
        />
      ) : null}
      {count > 0 && !settings.vacationOn && !bagOpen ? (
        <div className="mobile-bag">
          <Link to="/checkout" className="btn-print cart-check">
            Checkout · {count} · {formatUsd(subtotal)}
          </Link>
        </div>
      ) : null}
      {custom ? (
        <PizzaCustomize
          item={custom.item}
          categoryId={custom.cat.id}
          settings={settings}
          initialSize={custom.size}
          onClose={() => setCustom(null)}
          onConfirm={(result) => {
            add({
              itemId: custom.item.id ?? custom.item.name,
              categoryId: custom.cat.id,
              name: result.name,
              size: result.size,
              detail: result.detail || undefined,
              comment: result.comment,
              toppings: result.toppings,
              condiments: result.condiments,
              unitPrice: result.unitPrice,
            });
            setCustom(null);
          }}
        />
      ) : null}
      {confirm ? (
        <ItemConfirm
          item={confirm.item}
          categoryName={confirm.cat.name}
          categoryId={confirm.cat.id}
          onClose={() => setConfirm(null)}
          onConfirm={(result) => {
            add({
              itemId: confirm.item.id ?? confirm.item.name,
              categoryId: confirm.cat.id,
              name: confirm.item.name,
              size: result.size,
              detail: result.detail,
              comment: result.comment,
              condiments: result.condiments,
              unitPrice: result.unitPrice,
              qty: result.qty,
            });
            setConfirm(null);
          }}
        />
      ) : null}
      {wings ? (
        <WingsCustomize
          item={wings.item}
          categoryId={wings.cat.id}
          onClose={() => setWings(null)}
          onConfirm={(result) => {
            add({
              itemId: wings.item.id ?? wings.item.name,
              categoryId: wings.cat.id,
              name: wings.item.name,
              size: result.size,
              detail: result.detail,
              comment: result.comment,
              condiments: result.condiments,
              unitPrice: result.unitPrice,
            });
            setWings(null);
          }}
        />
      ) : null}
    </div>
  );
}
