import type { MenuCategory, MenuItem, PriceCol } from "@/data/menu";
import { formatUsd, moneyNumber, type ShopSettingsPublic } from "@/lib/shop-types";

export const PIZZA_SIZE_ORDER = ["SM", "MD", "LG", "XL"] as const;
export type PizzaSize = (typeof PIZZA_SIZE_ORDER)[number];
export type ToppingSide = "whole" | "left" | "right";

export const DEFAULT_TOPPING_PRICES: Record<PizzaSize, number> = {
  SM: 2.25,
  MD: 3.25,
  LG: 4.25,
  XL: 5.25,
};

export const DEFAULT_XL_INCHES = '18"';
export const DEFAULT_XL_ADD = 2;

export const PIZZA_TOPPINGS = [
  { id: "xcheese", name: "Extra cheese" },
  { id: "pepperoni", name: "Pepperoni" },
  { id: "sausage", name: "Sausage" },
  { id: "beef", name: "Beef" },
  { id: "ham", name: "Ham" },
  { id: "bacon", name: "Bacon" },
  { id: "chicken", name: "Chicken" },
  { id: "mushrooms", name: "Mushrooms" },
  { id: "peppers", name: "Green peppers" },
  { id: "olives", name: "Olives" },
  { id: "onions", name: "Onions" },
  { id: "spinach", name: "Spinach" },
  { id: "broccoli", name: "Broccoli" },
  { id: "tomatoes", name: "Tomatoes" },
  { id: "garlic", name: "Garlic" },
  { id: "pineapple", name: "Pineapple" },
  { id: "jalapenos", name: "Jalapenos" },
  { id: "feta", name: "Feta" },
] as const;

export type ToppingId = (typeof PIZZA_TOPPINGS)[number]["id"];

const TOPPING_BY_ID = new Map(PIZZA_TOPPINGS.map((t) => [t.id, t]));

export type PizzaToppingPick = {
  id: string;
  side: ToppingSide;
};

export type PizzaBuild = {
  size: string;
  toppings: PizzaToppingPick[];
  halfItemId?: string;
};

export function money2(n: number) {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
}

export function isPizzaSize(label: string | undefined): label is PizzaSize {
  return label === "SM" || label === "MD" || label === "LG" || label === "XL";
}

export function toppingName(id: string) {
  return TOPPING_BY_ID.get(id as ToppingId)?.name ?? id;
}

export function sanitizeToppings(raw: unknown): PizzaToppingPick[] {
  if (!Array.isArray(raw)) return [];
  const out: PizzaToppingPick[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    if (out.length >= 12) break;
    const rec: Record<string, unknown> = row && typeof row === "object" ? (row as Record<string, unknown>) : { id: row };
    const id = String(rec.id ?? "").trim();
    if (!id || !TOPPING_BY_ID.has(id as ToppingId) || seen.has(id)) continue;
    const side: ToppingSide = rec.side === "left" || rec.side === "right" ? rec.side : "whole";
    seen.add(id);
    out.push({ id, side });
  }
  return out;
}

export type ToppingPriceRow = { SM: number; MD: number; LG: number; XL: number };
export type ToppingPricesById = Record<string, ToppingPriceRow>;

export function defaultToppingRow(overrides?: Partial<ToppingPriceRow>): ToppingPriceRow {
  return {
    SM: money2(overrides?.SM ?? DEFAULT_TOPPING_PRICES.SM),
    MD: money2(overrides?.MD ?? DEFAULT_TOPPING_PRICES.MD),
    LG: money2(overrides?.LG ?? DEFAULT_TOPPING_PRICES.LG),
    XL: money2(overrides?.XL ?? DEFAULT_TOPPING_PRICES.XL),
  };
}

function sizeMoney(v: unknown, fallback: number) {
  if (v === undefined || v === null || v === "") return money2(fallback);
  const n = Number(v);
  if (!Number.isFinite(n)) return money2(fallback);
  return money2(Math.max(0, Math.min(20, n)));
}

export function seedToppingPricesById(raw: unknown, defaults?: Partial<ToppingPriceRow>): ToppingPricesById {
  let src: Record<string, unknown> = {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) src = parsed as Record<string, unknown>;
    } catch {
      src = {};
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    src = raw as Record<string, unknown>;
  }
  const fallback = defaultToppingRow(defaults);
  const out: ToppingPricesById = {};
  for (const t of PIZZA_TOPPINGS) {
    const row = src[t.id];
    const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    out[t.id] = {
      SM: sizeMoney(rec.SM ?? rec.sm, fallback.SM),
      MD: sizeMoney(rec.MD ?? rec.md, fallback.MD),
      LG: sizeMoney(rec.LG ?? rec.lg, fallback.LG),
      XL: sizeMoney(rec.XL ?? rec.xl, fallback.XL),
    };
  }
  return out;
}

export function toppingPricesFrom(settings: Pick<ShopSettingsPublic, "toppingPriceSm" | "toppingPriceMd" | "toppingPriceLg" | "toppingPriceXl">) {
  return {
    SM: money2(settings.toppingPriceSm || DEFAULT_TOPPING_PRICES.SM),
    MD: money2(settings.toppingPriceMd || DEFAULT_TOPPING_PRICES.MD),
    LG: money2(settings.toppingPriceLg || DEFAULT_TOPPING_PRICES.LG),
    XL: money2(settings.toppingPriceXl || DEFAULT_TOPPING_PRICES.XL),
  } as ToppingPriceRow;
}

export function toppingRowFor(settings: ShopSettingsPublic, toppingId?: string): ToppingPriceRow {
  if (toppingId) {
    const row = settings.toppingPricesById?.[toppingId];
    if (row) return defaultToppingRow(row);
  }
  return toppingPricesFrom(settings);
}

export function toppingUnit(size: string, settings: ShopSettingsPublic, toppingId?: string) {
  const key: PizzaSize = isPizzaSize(size) ? size : "LG";
  return toppingRowFor(settings, toppingId)[key];
}

export function toppingCharge(size: string, side: ToppingSide, settings: ShopSettingsPublic, toppingId?: string) {
  const unit = toppingUnit(size, settings, toppingId);
  return money2(side === "whole" ? unit : unit / 2);
}

export function colPrice(col: PriceCol | undefined) {
  return money2(moneyNumber(col?.price));
}

export function itemSizePrice(item: Pick<MenuItem, "prices">, size: string, settings: ShopSettingsPublic) {
	const want = size || item.prices[0]?.label || "";
	const exact = item.prices.find((p) => p.label === want);
	if (exact && colPrice(exact) > 0) return colPrice(exact);
	if (want === "XL") {
		const lg = item.prices.find((p) => p.label === "LG") ?? item.prices[item.prices.length - 1];
		if (lg && colPrice(lg) > 0 && settings.xlPriceAdd > 0) return money2(colPrice(lg) + Math.max(0, settings.xlPriceAdd));
	}
	const first = pizzaSizesFor(item, settings).find((p) => colPrice(p) > 0) ?? item.prices[0];
	return colPrice(first);
}
export function pizzaSizesFor(item: Pick<MenuItem, "prices">, _settings?: ShopSettingsPublic): PriceCol[] {
	const priced = item.prices.filter((p) => String(p.price ?? "").trim() !== "");
	return priced.length ? priced : item.prices;
}
export function pizzaNote(settings: ShopSettingsPublic, items?: MenuItem[]) {
	const t = toppingPricesFrom(settings);
	const fallbackInch: Record<PizzaSize, string> = {
		SM: '12"',
		MD: '14"',
		LG: '16"',
		XL: DEFAULT_XL_INCHES,
	};
	const inchBySize: Partial<Record<PizzaSize, string>> = {};
	for (const item of items ?? []) {
		for (const p of item.prices) {
			const label = String(p.label ?? "").trim();
			if (!isPizzaSize(label)) continue;
			const inches = String(p.inches ?? "").trim();
			if (inches && !inchBySize[label]) inchBySize[label] = inches;
		}
	}
	const bits = PIZZA_SIZE_ORDER.map((sz) => `${inchBySize[sz] || fallbackInch[sz]} ${sz}`);
	const tops = `${formatUsd(t.SM)} / ${formatUsd(t.MD)} / ${formatUsd(t.LG)} / ${formatUsd(t.XL)}`;
	return `${bits.join(" · ")}. Extra toppings ${tops} by size. Half toppings are half price.`;
}
export function applyPizzaSizing(categories: MenuCategory[], settings: ShopSettingsPublic): MenuCategory[] {
	return categories.map((cat) => {
		if (cat.kind !== "pizza") return cat;
		return {
			...cat,
			note: pizzaNote(settings, cat.items),
			items: cat.items.map((item) => ({ ...item, prices: pizzaSizesFor(item, settings) })),
		};
	});
}

export function shortPizzaName(name: string) {
  return name.replace(/ Pizza$/i, "").trim() || name;
}

export function describeBuild(_itemName: string, _size: string | undefined, toppings: PizzaToppingPick[], halfName?: string) {
  const bits: string[] = [];
  if (halfName) bits.push(`half ${shortPizzaName(halfName)}`);
  const whole = toppings.filter((t) => t.side === "whole").map((t) => toppingName(t.id));
  const left = toppings.filter((t) => t.side === "left").map((t) => toppingName(t.id));
  const right = toppings.filter((t) => t.side === "right").map((t) => toppingName(t.id));
  if (whole.length) bits.push(`+ ${whole.join(", ")}`);
  if (left.length) bits.push(`left: ${left.join(", ")}`);
  if (right.length) bits.push(`right: ${right.join(", ")}`);
  return bits.join(" · ");
}

export function pricePizzaBuild(opts: {
  item: Pick<MenuItem, "name" | "prices">;
  other?: Pick<MenuItem, "name" | "prices"> | null;
  size: string;
  toppings: PizzaToppingPick[];
  settings: ShopSettingsPublic;
}) {
  const size = opts.size || "LG";
  const left = itemSizePrice(opts.item, size, opts.settings);
  const right = opts.other ? itemSizePrice(opts.other, size, opts.settings) : 0;
  const base = money2(Math.max(left, right));
  const extras = opts.toppings.reduce((n, t) => n + toppingCharge(size, t.side, opts.settings, t.id), 0);
  const unitPrice = money2(base + extras);
  const halfName = opts.other && opts.other.name !== opts.item.name ? opts.other.name : undefined;
  const detail = describeBuild(opts.item.name, size, opts.toppings, halfName);
  const name = halfName ? `${shortPizzaName(opts.item.name)} / ${shortPizzaName(halfName)} Pizza` : opts.item.name;
  return { unitPrice, detail, name, halfName };
}

export function lineCaption(line: { name: string; size?: string; detail?: string }) {
  const size = line.size ? ` · ${line.size}` : "";
  return `${line.name}${size}`;
}
