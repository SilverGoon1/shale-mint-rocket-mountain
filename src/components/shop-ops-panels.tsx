import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PaymentProcessorPanel } from "@/components/payment-processor";
import { DAY_KEYS, DAY_LABELS, etaMinutes, type DayKey, type WeeklyHours } from "@/lib/hours";
import {
  DEFAULT_TOPPING_PRICES,
  PIZZA_SIZE_ORDER,
  PIZZA_TOPPINGS,
  pizzaNote,
  seedToppingPricesById,
  toppingPricesFrom,
  type PizzaSize,
} from "@/lib/pizza";
import { checkoutDeliveryFee, computeTax, formatUsd, anyProcessorLive, type ProcessorSecretStatus, type ShopSettingsPublic } from "@/lib/shop-types";
import { isExtraKind, type ExtraKind } from "@/lib/condiments";
import { useMenuStore } from "@/lib/menu-store";

export function HoursPanel({
  settings,
  setSettings,
}: {
  settings: ShopSettingsPublic;
  setSettings: (s: ShopSettingsPublic) => void;
}) {
  function patchDay(key: DayKey, next: Partial<WeeklyHours[DayKey]>) {
    setSettings({
      ...settings,
      weeklyHours: {
        ...settings.weeklyHours,
        [key]: { ...settings.weeklyHours[key], ...next },
      },
    });
  }
  const etaPickup = etaMinutes(settings.prepMinutes, settings.deliveryMinutes, "pickup");
  const etaDelivery = etaMinutes(settings.prepMinutes, settings.deliveryMinutes, "delivery");
  return (
    <section className="page-card">
      <h2>Time management</h2>
      <p className="ed-sub">
        Kitchen hours use America/New_York. Checkout blocks new tickets when the shop is closed (vacation still
        overrides this).
      </p>
      <p className="points-chip">{settings.openNow ? "Kitchen is open" : "Kitchen is closed"}</p>
      <div className="hours-grid">
        {DAY_KEYS.map((key) => {
          const day = settings.weeklyHours[key];
          return (
            <div className="hours-row" key={key}>
              <span>{DAY_LABELS[key]}</span>
              <label className="pay-opt">
                <input
                  type="checkbox"
                  checked={day.closed}
                  onChange={(e) => patchDay(key, { closed: e.target.checked })}
                />
                Closed
              </label>
              <input
                className="ed-input"
                type="time"
                value={day.open}
                disabled={day.closed}
                onChange={(e) => patchDay(key, { open: e.target.value })}
              />
              <input
                className="ed-input"
                type="time"
                value={day.close}
                disabled={day.closed}
                onChange={(e) => patchDay(key, { close: e.target.value })}
              />
            </div>
          );
        })}
      </div>
      <div className="two-col">
        <label className="ed-field">
          <span>Kitchen prep (minutes)</span>
          <input
            className="ed-input"
            type="number"
            min={5}
            value={settings.prepMinutes}
            onChange={(e) => setSettings({ ...settings, prepMinutes: Number(e.target.value) })}
          />
        </label>
        <label className="ed-field">
          <span>Delivery travel (minutes)</span>
          <input
            className="ed-input"
            type="number"
            min={5}
            value={settings.deliveryMinutes}
            onChange={(e) => setSettings({ ...settings, deliveryMinutes: Number(e.target.value) })}
          />
        </label>
      </div>
      <p className="ed-sub">
        Shown at checkout: pickup about {etaPickup} min · delivery about {etaDelivery} min.
      </p>
    </section>
  );
}

export function VacationPanel({
  settings,
  setSettings,
}: {
  settings: ShopSettingsPublic;
  setSettings: (s: ShopSettingsPublic) => void;
}) {
  return (
    <section className="page-card">
      <h2>Vacation</h2>
      <p className="ed-sub">Vacation pauses new tickets. The shop stays browsable; checkout is closed.</p>
      <label className="pay-opt">
        <input
          type="checkbox"
          checked={settings.vacationOn}
          onChange={(e) => setSettings({ ...settings, vacationOn: e.target.checked })}
        />
        Vacation mode — shop closed for orders
      </label>
      <label className="ed-field">
        <span>Vacation message</span>
        <textarea
          className="ed-input ed-area"
          rows={3}
          value={settings.vacationMessage}
          onChange={(e) => setSettings({ ...settings, vacationMessage: e.target.value })}
        />
      </label>
      <label className="ed-field">
        <span>Back date</span>
        <input
          className="ed-input"
          value={settings.vacationUntil}
          onChange={(e) => setSettings({ ...settings, vacationUntil: e.target.value })}
          placeholder="Monday, Sept 14"
        />
      </label>
    </section>
  );
}

export function PaymentsPanel({
  settings,
  setSettings,
  secretStatus,
  setSecretStatus,
  onSaved,
}: {
  settings: ShopSettingsPublic;
  setSettings: (s: ShopSettingsPublic) => void;
  secretStatus: ProcessorSecretStatus[];
  setSecretStatus: (s: ProcessorSecretStatus[]) => void;
  onSaved?: (msg: string) => void;
}) {
  const live = anyProcessorLive(settings.paymentAccounts);
  return (
    <>
      <section className="page-card">
        <h2>Payments</h2>
        <p className="ed-sub">This copy shows at checkout next to cash / pay at pickup.</p>
        <label className="ed-field">
          <span>Payment note at checkout</span>
          <textarea
            className="ed-input ed-area"
            rows={3}
            value={settings.paymentPlaceholder}
            onChange={(e) => setSettings({ ...settings, paymentPlaceholder: e.target.value })}
          />
        </label>
        <label className="pay-opt">
          <input
            type="checkbox"
            checked={settings.guestCardRequired}
            disabled={!live}
            onChange={(e) => setSettings({ ...settings, guestCardRequired: e.target.checked })}
          />
          <span>
            Require card when a live processor exists
            <em>
              {live
                ? "Guests must pick a connected card option. Cash / pay at pickup still show."
                : "No live processor yet. Guests stay on cash / pay at pickup."}
            </em>
          </span>
        </label>
      </section>
      <PaymentProcessorPanel
        accounts={settings.paymentAccounts}
        setAccounts={(paymentAccounts) => setSettings({ ...settings, paymentAccounts })}
        secretStatus={secretStatus}
        setSecretStatus={setSecretStatus}
        onSaved={onSaved}
      />
    </>
  );
}

export function TaxPanel({
  settings,
  setSettings,
}: {
  settings: ShopSettingsPublic;
  setSettings: (s: ShopSettingsPublic) => void;
}) {
  const sampleFood = 20;
  const sampleFee = checkoutDeliveryFee(settings, "delivery");
  const { tax, total } = computeTax(sampleFood, 0, sampleFee, settings.taxRate);
  const feeOn = settings.deliveryFeeOn !== false;
  return (
    <section className="page-card">
      <h2>Tax rate</h2>
      <p className="ed-sub">
        Applied at checkout on food after rewards{feeOn ? ", plus the delivery fee when delivery is on" : ""}. Pickup has no
        delivery fee. New Jersey prepared-food default is 6.625%. Tips are collected after tax and are not taxed.
      </p>
      <label className="ed-field">
        <span>Sales tax percent</span>
        <input
          className="ed-input"
          type="number"
          step="0.001"
          min={0}
          max={25}
          value={settings.taxRate}
          onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
        />
      </label>
      <p className="ed-sub">
        {feeOn && sampleFee > 0
          ? `A ${formatUsd(sampleFood)} pie plus a ${formatUsd(sampleFee)} delivery fee adds ${formatUsd(tax)} tax (${
              settings.taxRate || 0
            }%). Checkout would collect ${formatUsd(total)}.`
          : `A ${formatUsd(sampleFood)} food subtotal adds ${formatUsd(tax)} tax (${
              settings.taxRate || 0
            }%). Delivery fee is off, so tax is food after rewards only. Checkout would collect ${formatUsd(total)}.`}
      </p>
    </section>
  );
}

export function ToppingPricePanel({
  settings,
  setSettings,
  embedded,
}: {
  settings: ShopSettingsPublic;
  setSettings: (s: ShopSettingsPublic) => void;
  embedded?: boolean;
}) {
  const applyPizzaNotes = useMenuStore((s) => s.applyPizzaNotes);
  const categories = useMenuStore((s) => s.categories);
  const pizzaItems = categories.filter((c) => c.kind === "pizza").flatMap((c) => c.items);
  const blurb = pizzaNote(settings, pizzaItems);
  return (
    <section className={embedded ? "shop-acc-body" : "page-card"}>
      {embedded ? null : <h2>Extra topping prices</h2>}
      <p className="ed-sub">
        Default template for new toppings and Reset. Guest customize charges each topping from the Toppings tab, not
        this ladder. Half-and-half is half of that topping’s own price.
      </p>
      <div className="topping-price-grid">
        {(
          [
            ["toppingPriceSm", "Small"],
            ["toppingPriceMd", "Medium"],
            ["toppingPriceLg", "Large"],
            ["toppingPriceXl", "Extra large"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="ed-field">
            <span>{label}</span>
            <input
              className="ed-input"
              type="number"
              step="0.25"
              min={0}
              max={20}
              value={settings[key]}
              onChange={(e) => {
                const next = { ...settings, [key]: Number(e.target.value) };
                setSettings(next);
                applyPizzaNotes(next);
              }}
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        className="ed-btn"
        onClick={() => {
          const ladder = toppingPricesFrom(settings);
          const next = { ...settings, toppingPricesById: seedToppingPricesById({}, ladder) };
          setSettings(next);
          applyPizzaNotes(next);
        }}
      >
        Apply this ladder to all toppings
      </button>
      <p className="ed-sub">Pizza blurb (live): {blurb}</p>
    </section>
  );
}

export function BulkXlFillPanel({ embedded }: { embedded?: boolean }) {
  const fillXlCohort = useMenuStore((s) => s.fillXlCohort);
  const categories = useMenuStore((s) => s.categories);
  const [cheese, setCheese] = useState("20.95");
  const [oneTop, setOneTop] = useState("23.95");
  const [gourmet, setGourmet] = useState("");
  const pizzaItems = categories.filter((c) => c.id === "pizza" || c.id === "gourmet").flatMap((c) => c.items);
  const cheeseXl = pizzaItems.find((it) => /^cheese pizza$/i.test(it.name.trim()))?.prices.find((p) => p.label === "XL")?.price;
  const gourmetBlank = categories.find((c) => c.id === "gourmet")?.items.every((it) => !it.prices.some((p) => p.label === "XL" && String(p.price ?? "").trim()));

  return (
    <section className={embedded ? "shop-acc-body" : "page-card"}>
      {embedded ? null : <h2>Bulk XL fill</h2>}
      <p className="ed-sub">
        Cheese and one-topping pies get an XL column from these fields. Gourmet XL stays blank until you type a price
        — blank is not $0.
      </p>
      <div className="two-col">
        <label className="ed-field">
          <span>Cheese XL</span>
          <input className="ed-input ed-price" inputMode="decimal" value={cheese} onChange={(e) => setCheese(e.target.value)} placeholder="20.95" />
        </label>
        <div className="ed-field">
          <span>Fill</span>
          <button
            type="button"
            className="ed-btn"
            disabled={!cheese.trim()}
            aria-label="Fill Cheese XL"
            onClick={() => fillXlCohort("cheese", cheese.trim())}
          >
            Fill XL
          </button>
        </div>
        <label className="ed-field">
          <span>One-topping XL</span>
          <input className="ed-input ed-price" inputMode="decimal" value={oneTop} onChange={(e) => setOneTop(e.target.value)} placeholder="23.95" />
        </label>
        <div className="ed-field">
          <span>Fill</span>
          <button
            type="button"
            className="ed-btn"
            disabled={!oneTop.trim()}
            aria-label="Fill one-topping XL"
            onClick={() => fillXlCohort("one-topping", oneTop.trim())}
          >
            Fill XL
          </button>
        </div>
        <label className="ed-field">
          <span>Gourmet XL</span>
          <input className="ed-input ed-price" inputMode="decimal" value={gourmet} onChange={(e) => setGourmet(e.target.value)} placeholder="Leave blank" />
        </label>
        <div className="ed-field">
          <span>Fill</span>
          <button
            type="button"
            className="ed-btn"
            disabled={!gourmet.trim()}
            aria-label="Fill gourmet XL"
            onClick={() => fillXlCohort("gourmet", gourmet.trim())}
          >
            Fill XL
          </button>
        </div>
      </div>
      <p className="ed-sub">
        {cheeseXl ? `Cheese XL on the menu is $${cheeseXl}. ` : "Cheese XL is not on the menu yet. "}
        {gourmetBlank ? "Gourmet XL is blank." : "Gourmet XL has at least one price."}
      </p>
    </section>
  );
}

export function SharedExtrasPanel({ embedded }: { embedded?: boolean }) {
  const setExtrasByLabel = useMenuStore((s) => s.setExtrasByLabel);
  const categories = useMenuStore((s) => s.categories);

  function unit(kind: ExtraKind) {
    for (const cat of categories) {
      for (const it of cat.items) {
        const hit = (it.condiments ?? []).find((c) => isExtraKind(c, kind));
        if (!hit) continue;
        const listed = String(hit.extraPrice || hit.price || "").trim();
        if (listed) return listed;
      }
    }
    return "";
  }

  const ranchCount = categories.reduce(
    (n, c) => n + c.items.filter((it) => (it.condiments ?? []).some((x) => isExtraKind(x, "ranch"))).length,
    0,
  );

  return (
    <section className={embedded ? "shop-acc-body" : "page-card"}>
      {embedded ? null : <h2>Shared extras</h2>}
      <p className="ed-sub">
        One Extra Ranch, Extra Blue, or Extra dressing field writes every matching item (wings, tenders, buffalo pizza,
        salads). Leave blank until you set a price. Save all still publishes in one click.
      </p>
      <div className="two-col">
        <label className="ed-field">
          <span>Extra Ranch</span>
          <input
            className="ed-input ed-price"
            inputMode="decimal"
            placeholder="0.75"
            value={unit("ranch")}
            onChange={(e) => setExtrasByLabel("ranch", e.target.value)}
          />
        </label>
        <label className="ed-field">
          <span>Extra Blue cheese</span>
          <input
            className="ed-input ed-price"
            inputMode="decimal"
            placeholder="0.75"
            value={unit("blue")}
            onChange={(e) => setExtrasByLabel("blue", e.target.value)}
          />
        </label>
        <label className="ed-field">
          <span>Extra dressing</span>
          <input
            className="ed-input ed-price"
            inputMode="decimal"
            placeholder="0.75"
            value={unit("dressing")}
            onChange={(e) => setExtrasByLabel("dressing", e.target.value)}
          />
        </label>
      </div>
      <p className="ed-sub">{ranchCount} items carry Extra Ranch. Typing a price here updates all of them.</p>
    </section>
  );
}

export function DeliveryPanel({
  settings,
  setSettings,
}: {
  settings: ShopSettingsPublic;
  setSettings: (s: ShopSettingsPublic) => void;
}) {
  const feeOn = settings.deliveryFeeOn !== false;
  return (
    <section className="page-card">
      <h2>Delivery settings</h2>
      <p className="ed-sub">
        Checkout only allows delivery inside the painted map below. Addresses outside it stay pickup-only.
      </p>
      <label className="toggle-row">
        <input
          className="toggle"
          type="checkbox"
          role="switch"
          checked={feeOn}
          aria-checked={feeOn}
          onChange={(e) => setSettings({ ...settings, deliveryFeeOn: e.target.checked })}
        />
        <span>
          Enable delivery fee
          <em>
            {feeOn
              ? "On: checkout shows the fee and tax includes it."
              : "Off: no Delivery line, and tax is food after rewards only."}
          </em>
        </span>
      </label>
      <div className="two-col">
        <label className="ed-field">
          <span>Minimum order</span>
          <input
            className="ed-input"
            type="number"
            step="0.01"
            min={0}
            value={settings.minOrderDelivery}
            onChange={(e) => setSettings({ ...settings, minOrderDelivery: Number(e.target.value) })}
          />
        </label>
        <label className="ed-field">
          <span>Delivery fee</span>
          <input
            className="ed-input"
            type="number"
            step="0.01"
            min={0}
            disabled={!feeOn}
            value={settings.deliveryFee}
            onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
          />
        </label>
      </div>
      <label className="ed-field">
        <span>Travel time added at checkout (minutes)</span>
        <input
          className="ed-input"
          type="number"
          min={5}
          value={settings.deliveryMinutes}
          onChange={(e) => setSettings({ ...settings, deliveryMinutes: Number(e.target.value) })}
        />
      </label>
      <p className="ed-sub">
        {settings.hasZones
          ? "A delivery zone is painted. Addresses outside it stay pickup-only."
          : "No zone painted yet — customers can only choose pickup."}
      </p>
    </section>
  );
}

export function RewardsPanel({
  settings,
  setSettings,
}: {
  settings: ShopSettingsPublic;
  setSettings: (s: ShopSettingsPublic) => void;
}) {
  const earn = Math.round(20 * (settings.pointsPerDollar || 0));
  const dollar = settings.redeemRate > 0 ? 1 : 0;
  return (
    <section className="page-card">
      <h2>Points program</h2>
      <p className="ed-sub">
        Points accrue on paid food totals (minus delivery). Guests do not earn or redeem — that stays on signed-in
        accounts. Customers redeem at checkout.
      </p>
      <div className="rewards-preview" aria-hidden>
        <span className="points-chip">{earn} pts on a $20 pie</span>
        <span className="points-chip">
          {settings.redeemRate || 0} pts = {formatUsd(dollar)}
        </span>
        <span className="points-chip">{settings.welcomeBonus || 0} welcome pts</span>
        <span className="points-chip">{settings.inviteBonus || 0} for inviting</span>
        <span className="points-chip">{settings.inviteeBonus || 0} for joining with a code</span>
      </div>
      <div className="two-col">
        <label className="ed-field">
          <span>Points per dollar spent</span>
          <input
            className="ed-input"
            type="number"
            step="0.1"
            min={0}
            value={settings.pointsPerDollar}
            onChange={(e) => setSettings({ ...settings, pointsPerDollar: Number(e.target.value) })}
          />
        </label>
        <label className="ed-field">
          <span>Points needed for $1 off</span>
          <input
            className="ed-input"
            type="number"
            min={1}
            value={settings.redeemRate}
            onChange={(e) => setSettings({ ...settings, redeemRate: Number(e.target.value) })}
          />
        </label>
      </div>
      <label className="ed-field">
        <span>Welcome bonus for new accounts</span>
        <input
          className="ed-input"
          type="number"
          min={0}
          value={settings.welcomeBonus}
          onChange={(e) => setSettings({ ...settings, welcomeBonus: Number(e.target.value) })}
        />
      </label>
      <div className="two-col">
        <label className="ed-field">
          <span>Points you get when a friend joins</span>
          <input
            className="ed-input"
            type="number"
            min={0}
            value={settings.inviteBonus}
            onChange={(e) => setSettings({ ...settings, inviteBonus: Number(e.target.value) })}
          />
        </label>
        <label className="ed-field">
          <span>Extra points the friend gets</span>
          <input
            className="ed-input"
            type="number"
            min={0}
            value={settings.inviteeBonus}
            onChange={(e) => setSettings({ ...settings, inviteeBonus: Number(e.target.value) })}
          />
        </label>
      </div>
    </section>
  );
}

const SHOP_ACC_KEY = "southend-shop-accordion";
const SHOP_SECTIONS = [
  ["topping-defaults", "Extra topping prices"],
  ["xl", "Bulk XL fill"],
  ["extras", "Shared extras"],
  ["identity", "Shop identity"],
] as const;
type ShopSection = (typeof SHOP_SECTIONS)[number][0];

function ShopAccItem({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: ShopSection;
  title: string;
  open: boolean;
  onToggle: (id: ShopSection) => void;
  children: ReactNode;
}) {
  return (
    <section className="shop-acc-item page-card" data-open={open ? "true" : undefined}>
      <button type="button" className="shop-acc-toggle" aria-expanded={open} onClick={() => onToggle(id)}>
        <span>{title}</span>
        {open ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
      </button>
      {open ? children : null}
    </section>
  );
}

export function ShopIdentityPanel({ embedded }: { embedded?: boolean }) {
  const restaurant = useMenuStore((s) => s.restaurant);
  const footer = useMenuStore((s) => s.footer);
  const tagline = useMenuStore((s) => s.tagline);
  const showMark = useMenuStore((s) => s.showMark);
  const setRestaurant = useMenuStore((s) => s.setRestaurant);
  const setFooter = useMenuStore((s) => s.setFooter);
  const setShopWeb = useMenuStore((s) => s.setShopWeb);
  return (
    <div className={embedded ? "shop-acc-body" : "page-card"}>
      {embedded ? null : <h2>Shop identity</h2>}
      <label className="ed-field">
        <span>Shop name</span>
        <input className="ed-input" value={restaurant.name} onChange={(e) => setRestaurant({ name: e.target.value })} />
      </label>
      <label className="ed-field">
        <span>Address</span>
        <input className="ed-input" value={restaurant.address} onChange={(e) => setRestaurant({ address: e.target.value })} />
      </label>
      <label className="ed-field">
        <span>City</span>
        <input className="ed-input" value={restaurant.city} onChange={(e) => setRestaurant({ city: e.target.value })} />
      </label>
      <label className="ed-field">
        <span>Phone</span>
        <input className="ed-input" value={restaurant.phone} onChange={(e) => setRestaurant({ phone: e.target.value })} />
      </label>
      <label className="ed-field">
        <span>Hours</span>
        <input className="ed-input" value={restaurant.hours} onChange={(e) => setRestaurant({ hours: e.target.value })} />
      </label>
      <label className="ed-field">
        <span>Established</span>
        <input
          className="ed-input"
          value={restaurant.established}
          onChange={(e) => setRestaurant({ established: e.target.value })}
        />
      </label>
      <label className="ed-field">
        <span>Tagline</span>
        <input className="ed-input" value={tagline} onChange={(e) => setShopWeb({ tagline: e.target.value })} />
      </label>
      <label className="pay-opt">
        <input type="checkbox" checked={showMark} onChange={(e) => setShopWeb({ showMark: e.target.checked })} />
        Show the buffalo mark on login and the wall menu
      </label>
      <label className="ed-field">
        <span>Footer note</span>
        <textarea className="ed-input ed-area" rows={2} value={footer} onChange={(e) => setFooter(e.target.value)} />
      </label>
    </div>
  );
}

export function ShopDetailsAccordions({
  settings,
  setSettings,
}: {
  settings: ShopSettingsPublic;
  setSettings: (s: ShopSettingsPublic) => void;
}) {
  const [open, setOpen] = useState<ShopSection | "">(() => {
    try {
      const v = localStorage.getItem(SHOP_ACC_KEY);
      if (SHOP_SECTIONS.some(([id]) => id === v)) return v as ShopSection;
    } catch {
      /* ignore */
    }
    return "";
  });
  function toggle(id: ShopSection) {
    const next = open === id ? "" : id;
    setOpen(next);
    try {
      localStorage.setItem(SHOP_ACC_KEY, next);
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="shop-acc">
      <ShopAccItem id="topping-defaults" title="Extra topping prices" open={open === "topping-defaults"} onToggle={toggle}>
        <ToppingPricePanel settings={settings} setSettings={setSettings} embedded />
      </ShopAccItem>
      <ShopAccItem id="xl" title="Bulk XL fill" open={open === "xl"} onToggle={toggle}>
        <BulkXlFillPanel embedded />
      </ShopAccItem>
      <ShopAccItem id="extras" title="Shared extras" open={open === "extras"} onToggle={toggle}>
        <SharedExtrasPanel embedded />
      </ShopAccItem>
      <ShopAccItem id="identity" title="Shop identity" open={open === "identity"} onToggle={toggle}>
        <ShopIdentityPanel embedded />
      </ShopAccItem>
    </div>
  );
}

export function ToppingPricesPanel({
  settings,
  setSettings,
}: {
  settings: ShopSettingsPublic;
  setSettings: (s: ShopSettingsPublic) => void;
}) {
  const rows = seedToppingPricesById(settings.toppingPricesById);
  function patch(id: string, size: PizzaSize, value: string) {
    const next = seedToppingPricesById(settings.toppingPricesById);
    next[id] = { ...next[id], [size]: Number(value) };
    setSettings({ ...settings, toppingPricesById: next });
  }
  function resetRow(id: string) {
    const next = seedToppingPricesById(settings.toppingPricesById);
    next[id] = { ...DEFAULT_TOPPING_PRICES };
    setSettings({ ...settings, toppingPricesById: next });
  }
  function resetAll() {
    setSettings({ ...settings, toppingPricesById: seedToppingPricesById({}, DEFAULT_TOPPING_PRICES) });
  }
  return (
    <section className="page-card">
      <h2>Topping prices</h2>
      <p className="ed-sub">
        Each topping has its own SM / MD / LG / XL add-on. Guest customize and POS charge this table. Half is half of
        that topping’s unit. Reset puts $2.25 / $3.25 / $4.25 / $5.25 back.
      </p>
      <div className="table-wrap topping-price-table-wrap">
        <table className="plain-table topping-price-table">
          <thead>
            <tr>
              <th>Topping</th>
              {PIZZA_SIZE_ORDER.map((sz) => (
                <th key={sz}>{sz}</th>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {PIZZA_TOPPINGS.map((t) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.name}</strong>
                </td>
                {PIZZA_SIZE_ORDER.map((sz) => (
                  <td key={sz}>
                    <input
                      className="ed-input ed-price"
                      inputMode="decimal"
                      aria-label={`${t.name} ${sz}`}
                      value={rows[t.id]?.[sz] ?? DEFAULT_TOPPING_PRICES[sz]}
                      onChange={(e) => patch(t.id, sz, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <button type="button" className="ed-btn" onClick={() => resetRow(t.id)}>
                    Reset
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="ed-btn" onClick={resetAll}>
        Reset all to $2.25 / $3.25 / $4.25 / $5.25
      </button>
    </section>
  );
}
