import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Bike, Minus, Plus, Store, Trash2 } from "lucide-react";
import { ShopHeader } from "@/components/shop-header";
import { SessionGate } from "@/components/guards";
import { StaleCartPrompt } from "@/components/stale-cart";
import { useCartHydrated } from "@/components/cart-hydrate";
import { AccountLoading } from "@/components/pizza-spinner";
import { OrderReceived } from "@/components/order-received";
import { cartTotals, useCartStore } from "@/lib/cart-store";
import { needsSignupOtp, toTenDigitPhone } from "@/lib/phone";
import { googleMapsCoordUrl } from "@/lib/geo";
import { checkDeliveryAddress, getStorefront, placeGuestOrder, placeOrder, updateProfile } from "@/lib/shop-server";
import { AddressSuggest } from "@/components/address-suggest";
import { retryTransient } from "@/lib/fetch-retry";
import { PROCESSOR_CATALOG } from "@/lib/payment-catalog";
import { computeTax, checkoutDeliveryFee, clampTip, CARD_PROCESSOR_LIVE, formatUsd, tipFromPercent, anyProcessorLive, isProcessorPayment, type ProcessorId, type ProfileView, type ShopSettingsPublic } from "@/lib/shop-types";
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
  const [spinReady, setSpinReady] = useState(false);
  const [connectWaited, setConnectWaited] = useState(false);

  useEffect(() => {
    setSpinReady(true);
  }, []);

  useEffect(() => {
    if (!isPending) return;
    const t = window.setTimeout(() => setConnectWaited(true), 6000);
    return () => window.clearTimeout(t);
  }, [isPending]);

  function stayGuest() {
    writeGuestCheckout();
    setGuestAnyway(true);
  }

  if (isPending && spinReady && !connectWaited && !guestAnyway) {
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
          {({ profile }) =>
            needsSignupOtp(profile.email) && !profile.emailVerified ? (
              <Navigate to="/login" search={{ next: "/checkout" }} replace />
            ) : (
              <>
                <ShopHeader profile={profile} />
                <main className="shop-main" id="main">
                  <CheckoutForm profile={profile} restaurant={data.restaurant} settings={data.settings} onLockGuest={stayGuest} />
                </main>
              </>
            )
          }
        </SessionGate>
      </div>
    );
  }
  return (
    <div className="shop-shell">
      <ShopHeader />
      <main className="shop-main" id="main">
        {connectWaited && !user ? (
          <p className="form-error">Could not finish connecting. Sign in again.</p>
        ) : null}
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
  const savedStreet = (profile?.addressLine || "").trim();
  const savedCity = (profile?.city || "").trim();
  const savedZip = (profile?.zip || "").trim();
  const hasSaved = Boolean(savedStreet);
  const [useSaved, setUseSaved] = useState(hasSaved);
  const [address, setAddress] = useState(profile?.addressLine || "");
  const [city, setCity] = useState(profile?.city || "Egg Harbor Township");
  const [zip, setZip] = useState(profile?.zip || "08234");
  const [geo, setGeo] = useState<{ lat: number; lng: number; label: string; deliverable: boolean; mapsUrl: string } | null>(
    null,
  );
  const [redeem, setRedeem] = useState(0);
  const [pay, setPay] = useState<"pay_pickup" | "pay_delivery" | "pay_card" | `pay_${ProcessorId}`>("pay_pickup");
  const [tipMode, setTipMode] = useState<"none" | 10 | 15 | 20 | "custom">("none");
  const [customTip, setCustomTip] = useState("");
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<{ id: string; ticketNo: number; total: number; status: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pickupName, setPickupName] = useState(profile?.displayName || "");
  const [guestName, setGuestName] = useState(profile?.displayName || "");
  const [guestPhone, setGuestPhone] = useState(profile?.phone || "");
  const [pickupPhone, setPickupPhone] = useState(profile?.phone || "");
  const [savePhone, setSavePhone] = useState(false);
  const guest = !profile;
  const accounts = settings.paymentAccounts ?? [];
  const cardLive = anyProcessorLive(accounts) && CARD_PROCESSOR_LIVE;
  const guestMustCard = cardLive && guest && settings.guestCardRequired;
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
    if (!profile) return;
    const name = profile.displayName.trim();
    const phone = profile.phone.trim();
    if (name) {
      setPickupName((n) => n.trim() || name);
      setGuestName((n) => n.trim() || name);
    }
    if (phone) {
      setPickupPhone((n) => n.trim() || phone);
      setGuestPhone((n) => n.trim() || phone);
    }
  }, [profile]);

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

  useEffect(() => {
    if (fulfillment !== "delivery") return;
    if (!useSaved || !hasSaved) return;
    const q = `${savedStreet}, ${savedCity} ${savedZip}`.trim();
    let live = true;
    void checkDeliveryAddress({ data: { query: q } }).then((r) => {
      if (!live) return;
      if (!r.found || r.lat == null || r.lng == null) {
        setGeo(null);
        return;
      }
      setGeo({
        lat: r.lat,
        lng: r.lng,
        label: r.label,
        deliverable: r.deliverable,
        mapsUrl: r.mapsUrl,
      });
      setError(r.deliverable ? "" : "Delivery unavailable at that address. Choose pickup or another street.");
    });
    return () => {
      live = false;
    };
  }, [fulfillment, useSaved, hasSaved, savedStreet, savedCity, savedZip]);

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
      <OrderReceived ticketNo={placed.ticketNo} total={placed.total} guest={guest} />
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
  const deliveryFee = checkoutDeliveryFee(settings, fulfillment);
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
        setError("Delivery unavailable at that address. Choose pickup or another street.");
        return false;
      }
      if (subtotal < settings.minOrderDelivery) {
        const need = Math.max(0, settings.minOrderDelivery - subtotal);
        setError(`Add ${formatUsd(need)} more for delivery.`);
        return false;
      }
    }
    if (fulfillment === "pickup") {
      const name = (pickupName.trim() || guestName.trim() || profile?.displayName || "").trim();
      const phone = (pickupPhone || guestPhone || profile?.phone || "").replace(/\D/g, "");
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
    const name = (pickupName.trim() || guestName.trim() || profile?.displayName || "").trim();
    const phone = (pickupPhone || guestPhone || profile?.phone || "").replace(/\D/g, "");
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
    if (isProcessorPayment(pay)) {
      setError("Card payments are not capturing yet. Pay at pickup or with cash.");
      return;
    }
    setBusy(true);
    setError("");
    const payload = {
      fulfillment,
      notes: notes.trim() || undefined,
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
        comment: String(l.comment ?? "").trim() || undefined,
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
        if (!guest && savePhone && !(profile?.phone || "").trim()) {
          const n = toTenDigitPhone(pickupPhone || guestPhone);
          if (n.length === 10) void updateProfile({ data: { phone: n } }).catch(() => undefined);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not place the order"))
      .finally(() => setBusy(false));
  }

  return (
    <form
      className="check-grid"
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) return;
        if (!validateCheckout()) return;
        setError("");
        if (guest) onLockGuest?.();
        submitOrder();
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
        <div className="fulfill-pick" role="group" aria-label="Pickup or delivery">
          <button
            type="button"
            className="fulfill-card"
            data-kind="pickup"
            data-on={fulfillment === "pickup"}
            onClick={() => setFulfillment("pickup")}
          >
            <Store size={22} strokeWidth={2.1} aria-hidden />
            <strong>Pickup</strong>
            <em>At the counter</em>
          </button>
          <button
            type="button"
            className="fulfill-card"
            data-kind="delivery"
            data-on={fulfillment === "delivery"}
            disabled={!settings.hasZones}
            onClick={() => setFulfillment("delivery")}
          >
            <Bike size={22} strokeWidth={2.1} aria-hidden />
            <strong>Delivery</strong>
            <em>{settings.hasZones ? "To your door" : "Zones not painted yet"}</em>
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
            {!(profile.phone || "").trim() ? (
              <label className="pay-opt">
                <input
                  type="checkbox"
                  checked={savePhone}
                  onChange={(e) => setSavePhone(e.target.checked)}
                />
                Use this number for future orders
              </label>
            ) : null}
          </div>
        ) : null}
        {!settings.hasZones ? (
          <p className="ed-sub">Delivery is off until the shop paints a zone on the admin map.</p>
        ) : null}
        {fulfillment === "delivery" ? (
          <div className="ed-shop fulfill-delivery">
            <p className="ed-sub">
              Delivery minimum {formatUsd(settings.minOrderDelivery)}
              {settings.deliveryFeeOn !== false && settings.deliveryFee > 0
                ? `. Fee ${formatUsd(settings.deliveryFee)}`
                : ""}
              . We check the painted zone after you pick an address.
            </p>
            {!guest && !(profile?.phone || "").trim() ? (
              <>
                <label className="ed-field">
                  <span>Phone</span>
                  <input
                    className="ed-input"
                    value={pickupPhone}
                    onChange={(e) => setPickupPhone(e.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="e.g. (609) 555-0100"
                  />
                </label>
                <label className="pay-opt">
                  <input
                    type="checkbox"
                    checked={savePhone}
                    onChange={(e) => setSavePhone(e.target.checked)}
                  />
                  Use this number for future orders
                </label>
              </>
            ) : null}
            {hasSaved && useSaved ? (
              <div className="saved-address">
                <p className="shop-brand-kicker">Primary delivery</p>
                <strong>
                  {savedStreet}
                  {savedCity ? `, ${savedCity}` : ""} {savedZip}
                </strong>
                <p className="ed-sub">Saved on your account. Used for this order unless you change it.</p>
                <button
                  type="button"
                  className="ed-btn ed-btn-quiet"
                  onClick={() => {
                    setUseSaved(false);
                    setGeo(null);
                    setError("");
                  }}
                >
                  Deliver to a different address
                </button>
              </div>
            ) : (
              <>
                {hasSaved ? (
                  <button
                    type="button"
                    className="ed-btn ed-btn-quiet"
                    onClick={() => {
                      setUseSaved(true);
                      setAddress(savedStreet);
                      setCity(savedCity || "Egg Harbor Township");
                      setZip(savedZip || "08234");
                      setGeo(null);
                      setError("");
                    }}
                  >
                    Use saved address
                  </button>
                ) : null}
                <label className="ed-field">
                  <span>Street</span>
                  <AddressSuggest
                    street={address}
                    onStreetChange={(v) => {
                      setAddress(v);
                      setGeo(null);
                    }}
                    onPick={(hit) => {
                      setAddress(hit.street);
                      if (hit.city) setCity(hit.city);
                      if (hit.zip) setZip(hit.zip);
                      setGeo({
                        lat: hit.lat,
                        lng: hit.lng,
                        label: hit.label,
                        deliverable: hit.deliverable,
                        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${hit.lat},${hit.lng}`,
                      });
                      setError(hit.deliverable ? "" : "Delivery unavailable at that address. Choose pickup or another street.");
                    }}
                    placeholder="Start typing a street"
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
                      if (r.street) setAddress(r.street);
                      if (r.city) setCity(r.city);
                      if (r.zip) setZip(r.zip);
                      setGeo({
                        lat: r.lat,
                        lng: r.lng,
                        label: r.label,
                        deliverable: r.deliverable,
                        mapsUrl: r.mapsUrl,
                      });
                      setError(r.deliverable ? "" : "Delivery unavailable at that address. Choose pickup or another street.");
                    });
                  }}
                >
                  Check delivery zone
                </button>
              </>
            )}
            {geo ? (
              <p className="ed-sub">
                {geo.deliverable ? "We deliver here." : "Delivery unavailable at that address. Choose pickup or another street."} {geo.label}{" "}
                <a href={geo.mapsUrl || googleMapsCoordUrl(geo.lat, geo.lng)} target="_blank" rel="noreferrer">
                  Google Maps
                </a>
              </p>
            ) : null}
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

        <label className="ed-field">
          <span>Notes for the kitchen</span>
          <textarea
            className="ed-input ed-area"
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What's happening?"
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
          {settings.paymentPlaceholder ? <p className="ed-sub">{settings.paymentPlaceholder}</p> : null}
          {accounts.some((a) => a.enabled) ? (
            <div className="pay-now">
              <p className="ed-sub">Pay now</p>
              {accounts
                .filter((a) => a.enabled)
                .map((a) => {
                  const cat = PROCESSOR_CATALOG.find((c) => c.id === a.id);
                  const ready = a.live && a.publishableKey.trim().length > 0;
                  const method = `pay_${a.id}` as `pay_${ProcessorId}`;
                  return (
                    <label key={a.id} className={ready ? "pay-opt" : "pay-opt pay-disabled"}>
                      <input
                        type="radio"
                        name="pay"
                        checked={pay === method}
                        disabled={!ready}
                        onChange={() => {
                          if (!ready) return;
                          setPay(method);
                        }}
                      />
                      <span>
                        {cat?.name ?? a.id}
                        {ready ? (
                          <em>Connected — charging is not on yet</em>
                        ) : (
                          <em>Coming soon — South End will turn this on after the processor account is connected</em>
                        )}
                      </span>
                    </label>
                  );
                })}
            </div>
          ) : null}
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
          {busy ? "Placing…" : "Checkout"}
        </button>
      </aside>
    </form>
  );
}
