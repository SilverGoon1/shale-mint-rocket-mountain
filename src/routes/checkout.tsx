import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ShopHeader } from "@/components/shop-header";
import { SessionGate } from "@/components/guards";
import { StaleCartPrompt } from "@/components/stale-cart";
import { useCartHydrated } from "@/components/cart-hydrate";
import { AccountLoading } from "@/components/pizza-spinner";
import { cartTotals, useCartStore } from "@/lib/cart-store";
import { googleMapsCoordUrl } from "@/lib/geo";
import { checkDeliveryAddress, getStorefront, placeGuestOrder, placeOrder } from "@/lib/shop-server";
import { retryTransient } from "@/lib/fetch-retry";
import { computeTax, clampTip, CARD_PROCESSOR_LIVE, formatTicketNo, formatUsd, tipFromPercent, type ProfileView, type ShopSettingsPublic } from "@/lib/shop-types";
import { etaMinutes, formatShopWhen, isOpenNow, nextOpenSlot, nyHm, nyWallToDate, nyYmd } from "@/lib/hours";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { RestaurantInfo } from "@/data/menu";

export const Route = createFileRoute("/checkout")({
  loader: () => retryTransient(() => getStorefront()),
  staleTime: 30_000,
  pendingMs: 8_000,
  pendingComponent: CheckoutPending,
  component: CheckoutPage,
});

function CheckoutPending() {
  return (
    <div className="shop-shell">
      <ShopHeader />
      <main className="shop-main" id="main">
        <div className="page-skel">Loading checkout…</div>
      </main>
    </div>
  );
}

const GUEST_CHECKOUT_KEY = "southend-checkout-guest";

function readGuestCheckout() {
  try {
    return sessionStorage.getItem(GUEST_CHECKOUT_KEY) === "1";
  } catch {
    return false;
  }
}

function writeGuestCheckout() {
  try {
    sessionStorage.setItem(GUEST_CHECKOUT_KEY, "1");
  } catch {
    /* ignore */
  }
}

function CheckoutPage() {
  const data = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const [guestAnyway, setGuestAnyway] = useState(readGuestCheckout);

  function stayGuest() {
    writeGuestCheckout();
    setGuestAnyway(true);
  }

  if (isPending) {
    return (
      <div className="shop-shell">
        <ShopHeader />
        <main className="shop-main" id="main">
          <AccountLoading />
        </main>
      </div>
    );
  }

  if (user && !guestAnyway) {
    return (
      <div className="shop-shell">
        <SessionGate
          softGuest
          onContinueAsGuest={stayGuest}
          fallback={({ error }) => (
            <main className="shop-main" id="main">
              <section className="page-card">
                <h1>Could not load your account</h1>
                <p>{error}</p>
                <p className="ed-sub">You can still place a pickup order as a guest.</p>
                <div className="confirm-actions">
                  <button type="button" className="btn-print" onClick={stayGuest}>
                    Continue as guest
                  </button>
                  <Link to="/login" search={{ next: "/checkout" }} className="ed-btn">
                    Sign in
                  </Link>
                </div>
              </section>
            </main>
          )}
        >
          {({ profile }) => (
            <>
              <ShopHeader profile={profile} />
              <main className="shop-main" id="main">
                <CheckoutForm profile={profile} restaurant={data.restaurant} settings={data.settings} onLockGuest={stayGuest} />
              </main>
            </>
          )}
        </SessionGate>
      </div>
    );
  }
  return (
    <div className="shop-shell">
      <ShopHeader />
      <main className="shop-main" id="main">
        {user && guestAnyway ? (
          <p className="ed-sub" style={{ marginBottom: "0.75rem" }}>
            Checking out as a guest.{" "}
            <button
              type="button"
              className="ed-btn ed-btn-quiet"
              onClick={() => {
                try {
                  sessionStorage.removeItem(GUEST_CHECKOUT_KEY);
                } catch {
                  /* ignore */
                }
                setGuestAnyway(false);
              }}
            >
              Use signed-in account
            </button>
          </p>
        ) : null}
        <CheckoutForm
          profile={null}
          restaurant={data.restaurant}
          settings={data.settings}
          onLockGuest={stayGuest}
        />
      </main>
    </div>
  );
}

function CheckoutForm({
  profile,
  restaurant,
  settings: loadedSettings,
  onLockGuest,
}: {
  profile: ProfileView | null;
  restaurant: RestaurantInfo;
  settings: ShopSettingsPublic;
  onLockGuest?: () => void;
}) {
  const hydrated = useCartHydrated();
  const lines = useCartStore((s) => s.lines);
  const notes = useCartStore((s) => s.notes);
  const setNotes = useCartStore((s) => s.setNotes);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const { subtotal } = cartTotals(lines);
  const settings = loadedSettings;
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState(profile?.addressLine || "");
  const [city, setCity] = useState(profile?.city || "Egg Harbor Township");
  const [zip, setZip] = useState(profile?.zip || "08234");
  const [geo, setGeo] = useState<{ lat: number; lng: number; label: string; deliverable: boolean; mapsUrl: string } | null>(
    null,
  );
  const [redeem, setRedeem] = useState(0);
  const [pay, setPay] = useState<"pay_pickup" | "pay_delivery" | "pay_card">("pay_pickup");
  const [tipMode, setTipMode] = useState<"none" | 10 | 15 | 20 | "custom">("none");
  const [customTip, setCustomTip] = useState("");
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ id: string; ticketNo: number; total: number; status: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"form" | "review">("form");
  const [pickupName, setPickupName] = useState(profile?.displayName || "");
  const [guestName, setGuestName] = useState(profile?.displayName || "");
  const [guestPhone, setGuestPhone] = useState(profile?.phone || "");
  const [pickupPhone, setPickupPhone] = useState(profile?.phone || "");
  const guest = !profile;
  const guestMustCard = CARD_PROCESSOR_LIVE && guest && settings.guestCardRequired;
  const [whenMode, setWhenMode] = useState<"asap" | "schedule">(loadedSettings.openNow ? "asap" : "schedule");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const pickupAt = `${restaurant.address}, ${restaurant.city}`;

  const dateBounds = useMemo(() => {
    const min = nyYmd();
    const maxAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    return { min, max: nyYmd(maxAt) };
  }, []);

  useEffect(() => {
    if (guestMustCard) {
      setPay("pay_card");
      return;
    }
    setPay(fulfillment === "delivery" ? "pay_delivery" : "pay_pickup");
  }, [fulfillment, guestMustCard]);

  useEffect(() => {
    if (!settings.openNow) setWhenMode("schedule");
  }, [settings.openNow]);

  useEffect(() => {
    if (whenMode !== "schedule") return;
    if (schedDate && schedTime) return;
    const slot = nextOpenSlot(settings.weeklyHours);
    if (slot) {
      setSchedDate(nyYmd(slot));
      setSchedTime(nyHm(slot));
    } else {
      setSchedDate(dateBounds.min);
      setSchedTime("12:00");
    }
  }, [whenMode, schedDate, schedTime, dateBounds.min, settings.weeklyHours]);

  const eta = etaMinutes(settings.prepMinutes, settings.deliveryMinutes, fulfillment);
  const scheduledAt =
    whenMode === "schedule" && schedDate && schedTime ? nyWallToDate(schedDate, schedTime) : null;
  const scheduledOpen = scheduledAt ? isOpenNow(settings.weeklyHours, scheduledAt) : true;
  const whenLabel =
    whenMode === "schedule" && scheduledAt
      ? `Scheduled ${formatShopWhen(scheduledAt.toISOString())}`
      : `About ${eta} minutes`;

  if (!hydrated) return <div className="page-skel">Loading your bag…</div>;
  if (lines.length === 0 && !placed) {
    return (
      <div className="page-card">
        <h1>Cart is empty</h1>
        <p className="ed-sub">Add something from the menu, then come back to check out.</p>
        <Link to="/" className="btn-print">
          Browse the menu
        </Link>
      </div>
    );
  }
  if (placed) {
    return (
      <div className="page-card">
        <p className="shop-brand-kicker">South End Pizza III</p>
        <h1>Order received</h1>
        <p>
          Ticket #{formatTicketNo(placed.ticketNo)} · {formatUsd(placed.total)} · {placed.status.replaceAll("_", " ")}
        </p>
        {placed.status === "awaiting_payment" ? (
          <p className="ed-sub">{settings.paymentPlaceholder}</p>
        ) : (
          <p className="ed-sub">
            {guest
              ? "The kitchen has the ticket. Save this number — guest orders are not on an account."
              : "The kitchen has the ticket. Track it under Account"}
            {fulfillment === "pickup" ? ` · pickup at ${pickupAt}` : ""}
            {whenMode === "schedule" && scheduledAt ? ` · ${whenLabel}.` : guest ? "" : "."}
          </p>
        )}
        <div className="confirm-actions">
          {guest ? (
            <Link to="/login" search={{ next: "/account" }} className="btn-print">
              Create an account
            </Link>
          ) : (
            <Link to="/account" className="btn-print">
              View history
            </Link>
          )}
          <Link to="/" className="ed-btn">
            Back to the menu
          </Link>
        </div>
      </div>
    );
  }
  if (settings.vacationOn) {
    return (
      <div className="page-card">
        <h1>Closed for vacation</h1>
        <p>{settings.vacationMessage}</p>
        <Link to="/" className="btn-ghost">
          Back
        </Link>
      </div>
    );
  }

  const redeemRate = settings.redeemRate;
  const points = profile?.points ?? 0;
  const maxRedeem = Math.min(Math.floor(points / redeemRate) * redeemRate, Math.floor(subtotal * redeemRate));
  const discount = redeem / redeemRate;
  const deliveryFee = fulfillment === "delivery" ? settings.deliveryFee : 0;
  const { tax, total: preTip } = computeTax(subtotal, discount, deliveryFee, settings.taxRate);
  const tip =
    tipMode === "custom"
      ? clampTip(Number(customTip) || 0)
      : tipMode === "none"
        ? 0
        : tipFromPercent(subtotal, discount, tipMode);
  const total = Math.round((preTip + tip) * 100) / 100;

  function validateCheckout() {
    if (fulfillment === "delivery") {
      if (!settings.hasZones) {
        setError("Delivery zones are not set yet. Please choose pickup.");
        return false;
      }
      if (!geo?.deliverable) {
        setError("Check a deliverable address first.");
        return false;
      }
      if (subtotal < settings.minOrderDelivery) {
        setError(`Delivery minimum is ${formatUsd(settings.minOrderDelivery)}.`);
        return false;
      }
    }
    if (fulfillment === "pickup") {
      const name = (pickupName.trim() || guestName.trim());
      const phone = (pickupPhone || guestPhone).replace(/\D/g, "");
      if (!name) {
        setError("Enter the name for pickup.");
        return false;
      }
      if (phone.length < 10) {
        setError("Enter a 10-digit US phone number.");
        return false;
      }
    }
    if (whenMode === "schedule") {
      if (!scheduledAt) {
        setError("Pick a date and time for pickup or delivery.");
        return false;
      }
      if (scheduledAt.getTime() < Date.now() + 15 * 60 * 1000) {
        setError("Pick a time at least 15 minutes from now.");
        return false;
      }
      if (!scheduledOpen) {
        setError(`The kitchen is closed at that time. ${settings.hoursSummary}`);
        return false;
      }
    } else if (!settings.openNow) {
      setError("The kitchen is closed. Schedule a later pickup or delivery.");
      return false;
    }
    return true;
  }

  function submitOrder() {
    const name = (pickupName.trim() || guestName.trim());
    const phone = (pickupPhone || guestPhone).replace(/\D/g, "");
    if (fulfillment === "pickup") {
      if (!name) {
        setError("Enter the name for pickup.");
        return;
      }
      if (phone.length < 10) {
        setError("Enter a 10-digit US phone number.");
        return;
      }
    } else if (guest) {
      if (!guestName.trim()) {
        setError("Enter your name.");
        return;
      }
      if (guestPhone.replace(/\D/g, "").length < 10) {
        setError("Enter a 10-digit US phone number.");
        return;
      }
    }
    if (pay === "pay_card" && !CARD_PROCESSOR_LIVE) {
      setError("Card payments are not live yet. Pay at pickup or with cash.");
      return;
    }
    setBusy(true);
    setError("");
    const payload = {
      fulfillment,
      notes,
      addressLine: address,
      city,
      zip,
      lat: geo?.lat,
      lng: geo?.lng,
      lines: lines.map((l) => ({
        itemId: l.itemId,
        categoryId: l.categoryId,
        size: l.size,
        qty: l.qty,
        toppings: l.toppings,
        halfItemId: l.halfItemId,
        comment: l.comment,
        condiments: l.condiments,
      })),
      redeemPoints: guest ? 0 : redeem,
      paymentMethod: pay,
      tip,
      pickupName: fulfillment === "pickup" ? name : "",
      scheduledDate: whenMode === "schedule" ? schedDate : "",
      scheduledTime: whenMode === "schedule" ? schedTime : "",
      guestName: guestName.trim() || name,
      guestPhone: guestPhone || pickupPhone,
    };
    const work = guest ? placeGuestOrder({ data: payload }) : placeOrder({ data: payload });
    void work
      .then((r) => {
        clear();
        setPlaced({ id: r.id, ticketNo: r.ticketNo, total: r.total, status: r.status });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not place the order"))
      .finally(() => setBusy(false));
  }

  function payLabel() {
    if (pay === "pay_pickup") return "Pay at pickup";
    if (pay === "pay_delivery") return "Cash";
    return CARD_PROCESSOR_LIVE ? "Card" : "Card coming soon";
  }

  if (step === "review") {
    return (
      <div className="confirm-page">
        <section className="page-card">
          <p className="shop-brand-kicker">Review before placing</p>
          <h1>Confirm your order</h1>
          <p className="ed-sub">Check every line. Nothing goes to the kitchen until you confirm.</p>
          <div className="order-ticket">
            <p className="shop-brand-kicker">{fulfillment === "delivery" ? "Deliver to" : "Pickup"}</p>
            <strong>{fulfillment === "delivery" ? `${address}, ${city} ${zip}` : pickupAt}</strong>
            {fulfillment === "pickup" ? (
              <>
                <label className="ed-field">
                  <span>Name for pickup</span>
                  <input
                    className="ed-input"
                    value={pickupName}
                    onChange={(e) => setPickupName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </label>
                <label className="ed-field">
                  <span>Phone</span>
                  <input
                    className="ed-input"
                    value={pickupPhone || guestPhone}
                    onChange={(e) => {
                      setPickupPhone(e.target.value);
                      if (guest) setGuestPhone(e.target.value);
                    }}
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="e.g. (609) 555-0100"
                  />
                </label>
              </>
            ) : null}
            <em>
              {whenLabel} · {payLabel()}
              {geo?.deliverable && fulfillment === "delivery" ? " · In the painted zone" : ""}
            </em>
            {geo?.mapsUrl && fulfillment === "delivery" ? (
              <p className="ed-sub">
                <a href={geo.mapsUrl} target="_blank" rel="noreferrer">
                  Open in Google Maps
                </a>
              </p>
            ) : null}
          </div>
          <ul className="cart-lines">
            {lines.map((l) => (
              <li key={l.key}>
                <span>
                  {l.qty}× {l.name}
                  {l.size ? ` · ${l.size}` : ""}
                  {l.detail ? ` · ${l.detail}` : ""}
                  {l.comment ? ` · Cook: ${l.comment}` : ""}
                </span>
                <span className="bag-line-tools">
                  <span>{formatUsd(l.unitPrice * l.qty)}</span>
                  <button type="button" className="bag-remove" aria-label={`Remove ${l.name}`} onClick={() => remove(l.key)}>
                    <Trash2 size={15} strokeWidth={2.2} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          {notes.trim() ? (
            <div className="pos-notes">
              <strong>Kitchen notes</strong>
              {notes}
            </div>
          ) : null}
          <dl className="totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatUsd(subtotal)}</dd>
            </div>
            {discount ? (
              <div>
                <dt>Rewards</dt>
                <dd>−{formatUsd(discount)}</dd>
              </div>
            ) : null}
            {deliveryFee ? (
              <div>
                <dt>Delivery</dt>
                <dd>{formatUsd(deliveryFee)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Tax ({settings.taxRate}%)</dt>
              <dd>{formatUsd(tax)}</dd>
            </div>
            {tip ? (
              <div>
                <dt>Tip</dt>
                <dd>{formatUsd(tip)}</dd>
              </div>
            ) : null}
            <div className="totals-grand">
              <dt>Total</dt>
              <dd>{formatUsd(total)}</dd>
            </div>
          </dl>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="confirm-actions">
            <button type="button" className="btn-print checkout-primary" disabled={busy || (fulfillment === "pickup" && (!(pickupName.trim() || guestName.trim()) || (pickupPhone || guestPhone).replace(/\D/g, "").length < 10))} onClick={submitOrder}>
              {busy ? "Placing…" : "Confirm and place"}
            </button>
            <button type="button" className="ed-btn" disabled={busy} onClick={() => setStep("form")}>
              Edit order
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <form
      className="check-grid"
      onSubmit={(e) => {
        e.preventDefault();
        if (!validateCheckout()) return;
        setError("");
        onLockGuest?.();
        setStep("review");
      }}
    >
      <StaleCartPrompt />
      <section className="page-card">
        <h1>Checkout</h1>
        {guest ? (
          <div className="guest-banner">
            <p className="ed-sub">
              Checking out as a guest. We only need a name and phone for the ticket.{" "}
              <Link to="/login" search={{ next: "/checkout" }}>
                Sign in
              </Link>{" "}
              to use reward points and track orders.
            </p>
            <label className="ed-field">
              <span>Your name</span>
              <input
                className="ed-input"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  if (!pickupName || pickupName === guestName) setPickupName(e.target.value);
                }}
                autoComplete="name"
                required
              />
            </label>
            <label className="ed-field">
              <span>Phone</span>
              <input
                className="ed-input"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                placeholder="(609) 555-0100"
                required
              />
            </label>
          </div>
        ) : null}
        <div className="seg" role="group" aria-label="Fulfillment">
          <button type="button" data-on={fulfillment === "pickup"} onClick={() => setFulfillment("pickup")}>
            Pickup
          </button>
          <button
            type="button"
            data-on={fulfillment === "delivery"}
            onClick={() => setFulfillment("delivery")}
            disabled={!settings.hasZones}
          >
            Delivery
          </button>
        </div>
        {fulfillment === "pickup" ? (
          <p className="ed-sub">Pickup at {pickupAt}. Pay when you arrive.</p>
        ) : null}
        {fulfillment === "pickup" && !guest ? (
          <div className="two-col">
            <label className="ed-field">
              <span>Name for pickup</span>
              <input
                className="ed-input"
                value={pickupName}
                onChange={(e) => setPickupName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
            <label className="ed-field">
              <span>Phone</span>
              <input
                className="ed-input"
                value={pickupPhone}
                onChange={(e) => setPickupPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                placeholder="e.g. (609) 555-0100"
                required
              />
            </label>
          </div>
        ) : null}
        {!settings.openNow ? (
          <p className="ed-sub">
            The kitchen is closed right now. {settings.hoursSummary} You can still schedule a later pickup or delivery.
          </p>
        ) : null}
        <fieldset className="tip-box">
          <legend>When</legend>
          <p className="ed-sub">Times are Eastern, for Egg Harbor Township. Scheduled orders need 15 minutes of notice.</p>
          <div className="seg" role="group" aria-label="When to fulfill">
            <button
              type="button"
              data-on={whenMode === "asap"}
              disabled={!settings.openNow}
              onClick={() => setWhenMode("asap")}
            >
              As soon as ready
            </button>
            <button type="button" data-on={whenMode === "schedule"} onClick={() => setWhenMode("schedule")}>
              Schedule
            </button>
          </div>
          {whenMode === "schedule" ? (
            <div className="two-col sched-fields">
              <label className="ed-field">
                <span>Date</span>
                <input
                  className="ed-input"
                  type="date"
                  min={dateBounds.min}
                  max={dateBounds.max}
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  required
                />
              </label>
              <label className="ed-field">
                <span>Time</span>
                <input
                  className="ed-input"
                  type="time"
                  step={900}
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  required
                />
              </label>
            </div>
          ) : (
            <p className="ed-sub">About {eta} minutes for {fulfillment === "delivery" ? "delivery" : "pickup"}.</p>
          )}
        </fieldset>
        {!settings.hasZones ? (
          <p className="ed-sub">Delivery is off until the shop paints a zone on the admin map.</p>
        ) : null}
        {fulfillment === "delivery" ? (
          <div className="ed-shop">
            <p className="ed-sub">
              Delivery minimum {formatUsd(settings.minOrderDelivery)}. Fee {formatUsd(settings.deliveryFee)}. We
              check the painted zone after you look up the address.
            </p>
            <label className="ed-field">
              <span>Street</span>
              <input
                className="ed-input"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setGeo(null);
                }}
                required
              />
            </label>
            <label className="ed-field">
              <span>City</span>
              <input className="ed-input" value={city} onChange={(e) => { setCity(e.target.value); setGeo(null); }} />
            </label>
            <label className="ed-field">
              <span>ZIP</span>
              <input className="ed-input" value={zip} onChange={(e) => { setZip(e.target.value); setGeo(null); }} />
            </label>
            <button
              type="button"
              className="ed-btn"
              onClick={() => {
                void checkDeliveryAddress({ data: { query: `${address}, ${city} ${zip}` } }).then((r) => {
                  if (!r.found || r.lat == null || r.lng == null) {
                    setGeo(null);
                    setError("We could not find that address.");
                    return;
                  }
                  setGeo({
                    lat: r.lat,
                    lng: r.lng,
                    label: r.label,
                    deliverable: r.deliverable,
                    mapsUrl: r.mapsUrl,
                  });
                  setError(r.deliverable ? "" : "That pin is outside the delivery zone.");
                });
              }}
            >
              Check delivery zone
            </button>
            {geo ? (
              <p className="ed-sub">
                {geo.deliverable ? "We deliver here." : "Outside the zone."} {geo.label}{" "}
                <a href={geo.mapsUrl || googleMapsCoordUrl(geo.lat, geo.lng)} target="_blank" rel="noreferrer">
                  Google Maps
                </a>
              </p>
            ) : null}
          </div>
        ) : null}

        <label className="ed-field">
          <span>Notes for the kitchen</span>
          <textarea
            className="ed-input ed-area"
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. extra napkins, doorbell is broken"
            suppressHydrationWarning
          />
        </label>

        <fieldset className="tip-box">
          <legend>Tip</legend>
          <p className="ed-sub">Quick percents are on food after rewards. Tips are not taxed in New Jersey.</p>
          <div className="tip-chips" role="group" aria-label="Tip percent">
            {(
              [
                ["none", "No tip"],
                [10, "10%"],
                [15, "15%"],
                [20, "20%"],
                ["custom", "Custom"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={String(mode)}
                type="button"
                data-on={tipMode === mode}
                onClick={() => setTipMode(mode)}
              >
                {label}
                {typeof mode === "number" ? (
                  <em>{formatUsd(tipFromPercent(subtotal, discount, mode))}</em>
                ) : null}
              </button>
            ))}
          </div>
          {tipMode === "custom" ? (
            <label className="ed-field">
              <span>Custom tip</span>
              <input
                className="ed-input"
                inputMode="decimal"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0.00"
              />
            </label>
          ) : null}
        </fieldset>

        <fieldset className="pay-box">
          <legend>Payment</legend>
          <p className="ed-sub">
            {fulfillment === "pickup" ? "Pay at pickup when you arrive." : "Pay the driver with cash."}
          </p>
          {fulfillment === "pickup" ? (
            <label className="pay-opt">
              <input type="radio" name="pay" checked={pay === "pay_pickup"} onChange={() => setPay("pay_pickup")} />
              Pay at pickup
            </label>
          ) : (
            <label className="pay-opt">
              <input
                type="radio"
                name="pay"
                checked={pay === "pay_delivery"}
                onChange={() => setPay("pay_delivery")}
              />
              Cash
            </label>
          )}
          <p className="ed-sub pay-card-note">Card coming soon. Pay at pickup or with cash today.</p>
        </fieldset>
      </section>

      <aside className="page-card">
        <h2>Bag</h2>
        <ul className="cart-lines">
          {lines.map((l) => (
            <li key={l.key}>
              <div>
                <strong>{l.name}</strong>
                {l.size ? <span className="cart-size">{l.size}</span> : null}
                {l.detail ? <span className="cart-size">{l.detail}</span> : null}
                <div className="cart-line-price">{formatUsd(l.unitPrice * l.qty)}</div>
              </div>
              <div className="bag-line-tools">
                <div className="qty-step">
                  <button type="button" aria-label={`Fewer ${l.name}`} onClick={() => setQty(l.key, l.qty - 1)}>
                    <Minus size={14} />
                  </button>
                  <span>{l.qty}</span>
                  <button type="button" aria-label={`More ${l.name}`} onClick={() => setQty(l.key, l.qty + 1)}>
                    <Plus size={14} />
                  </button>
                </div>
                <button type="button" className="bag-remove" aria-label={`Remove ${l.name}`} onClick={() => remove(l.key)}>
                  <Trash2 size={16} strokeWidth={2.2} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        {guest ? null : (
        <label className="ed-field">
          <span>
            Redeem points ({points} available, {redeemRate} pts = $1)
          </span>
          <input
            className="ed-input"
            type="number"
            min={0}
            step={redeemRate}
            max={maxRedeem}
            value={redeem}
            onChange={(e) => setRedeem(Math.max(0, Math.min(maxRedeem, Number(e.target.value) || 0)))}
          />
        </label>
        )}
        <dl className="totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatUsd(subtotal)}</dd>
          </div>
          {discount ? (
            <div>
              <dt>Rewards</dt>
              <dd>−{formatUsd(discount)}</dd>
            </div>
          ) : null}
          {deliveryFee ? (
            <div>
              <dt>Delivery</dt>
              <dd>{formatUsd(deliveryFee)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Tax ({settings.taxRate}%)</dt>
            <dd>{formatUsd(tax)}</dd>
          </div>
          {tip ? (
            <div>
              <dt>Tip</dt>
              <dd>{formatUsd(tip)}</dd>
            </div>
          ) : null}
          <div className="totals-grand">
            <dt>Total</dt>
            <dd>{formatUsd(total)}</dd>
          </div>
        </dl>
        <p className="ed-sub">
          {whenMode === "schedule" ? whenLabel : `About ${eta} minutes for ${fulfillment === "delivery" ? "delivery" : "pickup"}.`}
        </p>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="btn-print checkout-primary" disabled={busy}>
          Review order
        </button>
      </aside>
    </form>
  );
}
