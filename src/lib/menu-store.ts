import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CategoryKind, MenuCategory, MenuItem, PriceCol, RestaurantInfo } from "@/data/menu";
import { DEFAULT_FOOTER, MENU, RESTAURANT } from "@/data/menu";

import {
  sanitizeCardBg,
  sanitizeCardSize,
  sanitizeCardTextColor,
  sanitizeCardTextSize,
  type CardSize,
  type CardTextSize,
  type ShopSettingsPublic,
} from "@/lib/shop-types";
import { pizzaNote } from "@/lib/pizza";
import { type ExtraKind, isExtraKind, upsertExtraCondiments } from "@/lib/condiments";
import { GROUP_BUFFALO, GROUP_SALAD, GROUP_SAUCE_DIP, hasGroup } from "@/lib/modifiers";

export type EditableItem = MenuItem & { id: string };

export type EditableCategory = Omit<MenuCategory, "items"> & {
  items: EditableItem[];
};

type MenuState = {
  restaurant: RestaurantInfo;
  footer: string;
  categories: EditableCategory[];
  cardTextSize: CardTextSize;
  cardTextColor: string;
  cardDescColor: string;
  cardPriceColor: string;
  cardSize: CardSize;
  cardBg: string;
  tagline: string;
  showMark: boolean;
  setRestaurant: (patch: Partial<RestaurantInfo>) => void;
  setFooter: (footer: string) => void;
  setCardType: (patch: {
    cardTextSize?: CardTextSize;
    cardTextColor?: string;
    cardDescColor?: string;
    cardPriceColor?: string;
    cardSize?: CardSize;
    cardBg?: string;
  }) => void;
  setShopWeb: (patch: { tagline?: string; showMark?: boolean }) => void;
  patchCategory: (id: string, patch: Partial<Omit<EditableCategory, "items" | "id">>) => void;
  setKind: (id: string, kind: CategoryKind) => void;
  addCategory: () => void;
  deleteCategory: (id: string) => void;
  moveCategory: (id: string, dir: -1 | 1) => void;
  patchItem: (catId: string, itemId: string, patch: Partial<EditableItem>) => void;
  setPrices: (catId: string, itemId: string, prices: PriceCol[]) => void;
  setExtrasByLabel: (kind: ExtraKind, price: string) => void;
  fillXlCohort: (cohort: "cheese" | "one-topping" | "gourmet", price: string) => void;
  applyPizzaNotes: (settings: ShopSettingsPublic) => void;
  addItem: (catId: string) => void;
  duplicateItem: (catId: string, itemId: string) => void;
  deleteItem: (catId: string, itemId: string) => void;
  moveItem: (catId: string, itemId: string, dir: -1 | 1) => void;
  moveItemTo: (fromCat: string, itemId: string, toCat: string) => void;
  reset: () => void;
  replaceAll: (next: {
    restaurant: RestaurantInfo;
    footer: string;
    categories: EditableCategory[];
    cardTextSize?: CardTextSize;
    cardTextColor?: string;
    cardDescColor?: string;
    cardPriceColor?: string;
    cardSize?: CardSize;
    cardBg?: string;
    tagline?: string;
    showMark?: boolean;
  }) => void;
};

function nid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function pizzaPrices(from?: PriceCol[]): PriceCol[] {
  const src = (from ?? []).map((p) => ({ ...p }));
  const byLabel = new Map(src.filter((p) => p.label).map((p) => [String(p.label), p]));
  const core: PriceCol[] = [
    byLabel.get("SM") ?? { label: "SM", inches: '12"', price: "" },
    byLabel.get("MD") ?? { label: "MD", inches: '14"', price: "" },
    byLabel.get("LG") ?? { label: "LG", inches: '16"', price: "" },
    byLabel.get("XL") ?? { label: "XL", inches: '18"', price: "" },
  ];
  const extras = src.filter(
    (p) => p.label !== "SM" && p.label !== "MD" && p.label !== "LG" && p.label !== "XL",
  );
  return [...core, ...extras];
}

function itemXlCohort(cat: EditableCategory, item: EditableItem): "cheese" | "one-topping" | "gourmet" | null {
  if (cat.id === "gourmet") return "gourmet";
  if (cat.id !== "pizza") return null;
  if (/^cheese pizza$/i.test(item.name.trim())) return "cheese";
  return "one-topping";
}

function setXlPrice(prices: PriceCol[], price: string): PriceCol[] {
  const listed = String(price ?? "").trim();
  const next = prices.map((p) => ({ ...p }));
  const i = next.findIndex((p) => String(p.label ?? "").toUpperCase() === "XL");
  const inches = next[i]?.inches || '18"';
  const row: PriceCol = { label: "XL", inches, price: listed };
  if (i >= 0) next[i] = { ...next[i], ...row };
  else next.push(row);
  return next;
}

function itemWantsExtra(cat: EditableCategory, item: EditableItem, kind: ExtraKind) {
  if ((item.condiments ?? []).some((c) => isExtraKind(c, kind))) return true;
  if (kind === "dressing") return hasGroup(cat, item, GROUP_SALAD);
  return hasGroup(cat, item, GROUP_SAUCE_DIP) || hasGroup(cat, item, GROUP_BUFFALO);
}

function seedItem(item: MenuItem, cat: MenuCategory, index: number): EditableItem {
  return {
    ...item,
    id: item.id ?? `${cat.id}-${index}`,
    prices: item.prices.map((p) => ({ ...p })),
    condiments: (item.condiments ?? []).map((c) => ({ ...c })),
  };
}

export function seedMenu(): { restaurant: RestaurantInfo; footer: string; categories: EditableCategory[] } {
  return {
    restaurant: { ...RESTAURANT },
    footer: DEFAULT_FOOTER,
    categories: MENU.map((cat) => ({
      ...cat,
      items: cat.items.map((item, i) => seedItem(item, cat, i)),
    })),
  };
}

function newItem(kind: CategoryKind): EditableItem {
  if (kind === "pizza") {
    return {
      id: nid("item"),
      name: "New pizza",
      description: "",
      prices: pizzaPrices(),
    };
  }
  if (kind === "split") {
    return {
      id: nid("item"),
      name: "New item",
      description: "",
      prices: [{ label: "Half", price: "" }],
    };
  }
  return {
    id: nid("item"),
    name: "New item",
    description: "",
    prices: [{ price: "" }],
  };
}

function mapCat(
  categories: EditableCategory[],
  catId: string,
  fn: (cat: EditableCategory) => EditableCategory,
): EditableCategory[] {
  return categories.map((c) => (c.id === catId ? fn(c) : c));
}

function mapItem(
  categories: EditableCategory[],
  catId: string,
  itemId: string,
  fn: (item: EditableItem) => EditableItem,
): EditableCategory[] {
  return mapCat(categories, catId, (c) => ({
    ...c,
    items: c.items.map((it) => (it.id === itemId ? fn(it) : it)),
  }));
}

function moveIn<T extends { id: string }>(list: T[], id: string, dir: -1 | 1): T[] {
  const i = list.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const next = list.slice();
  const [row] = next.splice(i, 1);
  next.splice(j, 0, row);
  return next;
}

function toTel(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  if (digits.length) return `tel:+${digits}`;
  return "";
}

function snapshot(s: { restaurant: RestaurantInfo; footer: string; categories: EditableCategory[] }) {
  return JSON.stringify({
    restaurant: s.restaurant,
    footer: s.footer,
    categories: s.categories.map((c) => ({
      id: c.id,
      name: c.name,
      note: c.note ?? "",
      kind: c.kind,
      icon: c.icon ?? "",
      items: c.items.map((it) => ({
        name: it.name,
        description: it.description ?? "",
        highlight: Boolean(it.highlight),
        prices: it.prices,
        image: it.image ?? "",
        hideImage: Boolean(it.hideImage),
        condiments: it.condiments ?? [],
      })),
    })),
  });
}

const DEFAULT = {
  ...seedMenu(),
  cardTextSize: "md" as CardTextSize,
  cardTextColor: "ink",
  cardDescColor: "muted",
  cardPriceColor: "ink",
  cardSize: "md" as CardSize,
  cardBg: "paper",
  tagline: "",
  showMark: true,
};
const DEFAULT_SNAP = snapshot(DEFAULT);

export function isCustomMenu(s: { restaurant: RestaurantInfo; footer: string; categories: EditableCategory[] }) {
  return snapshot(s) !== DEFAULT_SNAP;
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set) => ({
      ...DEFAULT,
      setRestaurant: (patch) =>
        set((s) => {
          const restaurant = { ...s.restaurant, ...patch };
          if (patch.phone !== undefined) restaurant.phoneHref = toTel(patch.phone);
          return { restaurant };
        }),
      setFooter: (footer) => set({ footer }),
      setCardType: (patch) =>
        set((s) => ({
          cardTextSize: patch.cardTextSize !== undefined ? sanitizeCardTextSize(patch.cardTextSize) : s.cardTextSize,
          cardTextColor: patch.cardTextColor !== undefined ? sanitizeCardTextColor(patch.cardTextColor) : s.cardTextColor,
          cardDescColor: patch.cardDescColor !== undefined ? sanitizeCardTextColor(patch.cardDescColor) : s.cardDescColor,
          cardPriceColor: patch.cardPriceColor !== undefined ? sanitizeCardTextColor(patch.cardPriceColor) : s.cardPriceColor,
          cardSize: patch.cardSize !== undefined ? sanitizeCardSize(patch.cardSize) : s.cardSize,
          cardBg: patch.cardBg !== undefined ? sanitizeCardBg(patch.cardBg) : s.cardBg,
        })),
      setShopWeb: (patch) =>
        set((s) => ({
          tagline: patch.tagline !== undefined ? patch.tagline : s.tagline,
          showMark: patch.showMark !== undefined ? patch.showMark : s.showMark,
        })),
      patchCategory: (id, patch) =>
        set((s) => ({
          categories: mapCat(s.categories, id, (c) => ({ ...c, ...patch })),
        })),
      setKind: (id, kind) =>
        set((s) => ({
          categories: mapCat(s.categories, id, (c) => ({
            ...c,
            kind,
            items: kind === "pizza" ? c.items.map((it) => ({ ...it, prices: pizzaPrices(it.prices) })) : c.items,
          })),
        })),
      addCategory: () =>
        set((s) => ({
          categories: [
            ...s.categories,
            {
              id: nid("cat"),
              name: "New section",
              kind: "single" as const,
              icon: "appetizers",
              items: [],
            },
          ],
        })),
      deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
      moveCategory: (id, dir) => set((s) => ({ categories: moveIn(s.categories, id, dir) })),
      patchItem: (catId, itemId, patch) =>
        set((s) => ({
          categories: mapItem(s.categories, catId, itemId, (it) => ({ ...it, ...patch })),
        })),
      setPrices: (catId, itemId, prices) =>
        set((s) => ({
          categories: mapItem(s.categories, catId, itemId, (it) => ({ ...it, prices })),
        })),
      setExtrasByLabel: (kind, price) =>
        set((s) => ({
          categories: s.categories.map((cat) => ({
            ...cat,
            items: cat.items.map((it) => {
              if (!itemWantsExtra(cat, it, kind)) return it;
              return { ...it, condiments: upsertExtraCondiments(it.condiments, kind, price) };
            }),
          })),
        })),
      fillXlCohort: (cohort, price) =>
        set((s) => ({
          categories: s.categories.map((cat) => ({
            ...cat,
            items: cat.items.map((it) => {
              if (itemXlCohort(cat, it) !== cohort) return it;
              return { ...it, prices: setXlPrice(it.prices, price) };
            }),
          })),
        })),
      applyPizzaNotes: (settings) =>
        set((s) => ({
          categories: s.categories.map((cat) =>
            cat.kind === "pizza" ? { ...cat, note: pizzaNote(settings, cat.items) } : cat,
          ),
        })),
      addItem: (catId) =>
        set((s) => ({
          categories: mapCat(s.categories, catId, (c) => ({
            ...c,
            items: [...c.items, newItem(c.kind)],
          })),
        })),
      duplicateItem: (catId, itemId) =>
        set((s) => ({
          categories: mapCat(s.categories, catId, (c) => {
            const i = c.items.findIndex((it) => it.id === itemId);
            if (i < 0) return c;
            const src = c.items[i];
            const copy: EditableItem = {
              ...src,
              id: nid("item"),
              name: src.name.endsWith(" copy") ? src.name : `${src.name} copy`,
              prices: src.prices.map((p) => ({ ...p })),
              condiments: (src.condiments ?? []).map((c) => ({ ...c, id: nid("cond") })),
            };
            const items = c.items.slice();
            items.splice(i + 1, 0, copy);
            return { ...c, items };
          }),
        })),
      deleteItem: (catId, itemId) =>
        set((s) => ({
          categories: mapCat(s.categories, catId, (c) => ({
            ...c,
            items: c.items.filter((it) => it.id !== itemId),
          })),
        })),
      moveItem: (catId, itemId, dir) =>
        set((s) => ({
          categories: mapCat(s.categories, catId, (c) => ({
            ...c,
            items: moveIn(c.items, itemId, dir),
          })),
        })),
      moveItemTo: (fromCat, itemId, toCat) =>
        set((s) => {
          if (fromCat === toCat) return s;
          const src = s.categories.find((c) => c.id === fromCat);
          const item = src?.items.find((it) => it.id === itemId);
          if (!item) return s;
          return {
            categories: s.categories.map((c) => {
              if (c.id === fromCat) return { ...c, items: c.items.filter((it) => it.id !== itemId) };
              if (c.id === toCat) {
                const moved =
                  c.kind === "pizza" ? { ...item, prices: pizzaPrices(item.prices) } : { ...item, prices: item.prices.map((p) => ({ ...p })) };
                return { ...c, items: [...c.items, moved] };
              }
              return c;
            }),
          };
        }),
      reset: () => set(seedMenu()),
      replaceAll: (next) =>
        set({
          restaurant: next.restaurant,
          footer: next.footer,
          categories: next.categories,
          ...(next.cardTextSize !== undefined ? { cardTextSize: sanitizeCardTextSize(next.cardTextSize) } : {}),
          ...(next.cardTextColor !== undefined ? { cardTextColor: sanitizeCardTextColor(next.cardTextColor) } : {}),
          ...(next.cardDescColor !== undefined ? { cardDescColor: sanitizeCardTextColor(next.cardDescColor) } : {}),
          ...(next.cardPriceColor !== undefined ? { cardPriceColor: sanitizeCardTextColor(next.cardPriceColor) } : {}),
          ...(next.cardSize !== undefined ? { cardSize: sanitizeCardSize(next.cardSize) } : {}),
          ...(next.cardBg !== undefined ? { cardBg: sanitizeCardBg(next.cardBg) } : {}),
          ...(next.tagline !== undefined ? { tagline: next.tagline } : {}),
          ...(next.showMark !== undefined ? { showMark: next.showMark } : {}),
        }),
    }),
    {
      name: "south-end-menu-v1",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      skipHydration: true,
      version: 1,
      partialize: (s) => ({
        restaurant: s.restaurant,
        footer: s.footer,
        categories: s.categories,
        cardTextSize: s.cardTextSize,
        cardTextColor: s.cardTextColor,
        cardDescColor: s.cardDescColor,
        cardPriceColor: s.cardPriceColor,
        cardSize: s.cardSize,
        cardBg: s.cardBg,
        tagline: s.tagline,
        showMark: s.showMark,
      }),
      merge: (persisted, current) => {
        const p = persisted as
          | Partial<
              Pick<
                MenuState,
                | "restaurant"
                | "footer"
                | "categories"
                | "cardTextSize"
                | "cardTextColor"
                | "cardDescColor"
                | "cardPriceColor"
                | "cardSize"
                | "cardBg"
                | "tagline"
                | "showMark"
              >
            >
          | undefined;
        if (!p || !Array.isArray(p.categories) || !p.restaurant) return current;
        return {
          ...current,
          restaurant: { ...current.restaurant, ...p.restaurant },
          footer: typeof p.footer === "string" ? p.footer : current.footer,
          cardTextSize: sanitizeCardTextSize(p.cardTextSize ?? current.cardTextSize),
          cardTextColor: sanitizeCardTextColor(p.cardTextColor ?? current.cardTextColor),
          cardDescColor: sanitizeCardTextColor(p.cardDescColor ?? current.cardDescColor),
          cardPriceColor: sanitizeCardTextColor(p.cardPriceColor ?? current.cardPriceColor),
          cardSize: sanitizeCardSize(p.cardSize ?? current.cardSize),
          cardBg: sanitizeCardBg(p.cardBg ?? current.cardBg),
          tagline: typeof p.tagline === "string" ? p.tagline : current.tagline,
          showMark: typeof p.showMark === "boolean" ? p.showMark : current.showMark,
          categories: p.categories.map((cat) => ({
            ...cat,
            items: (cat.items ?? []).map((it, i) => ({
              ...it,
              id: it.id ?? `${cat.id}-${i}`,
              prices: Array.isArray(it.prices) ? it.prices.map((pr) => ({ ...pr })) : [{ price: "" }],
              condiments: Array.isArray(it.condiments) ? it.condiments.map((c) => ({ ...c })) : [],
            })),
          })),
        };
      },
    },
  ),
);

