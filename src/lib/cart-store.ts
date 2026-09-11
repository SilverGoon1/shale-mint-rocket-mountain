import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CondimentPick } from "@/lib/condiments";
import type { PizzaToppingPick } from "@/lib/pizza";

export type CartLine = {
  key: string;
  itemId: string;
  categoryId: string;
  name: string;
  size?: string;
  detail?: string;
  comment?: string;
  toppings?: PizzaToppingPick[];
  halfItemId?: string;
  condiments?: CondimentPick[];
  unitPrice: number;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  notes: string;
  bagOpen: boolean;
  add: (line: Omit<CartLine, "key" | "qty"> & { qty?: number }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
  openBag: () => void;
  closeBag: () => void;
  toggleBag: () => void;
};

function lineKey(
  line: Pick<CartLine, "itemId" | "size" | "detail" | "halfItemId" | "toppings" | "comment" | "condiments">,
) {
  const tops = (line.toppings ?? [])
    .map((t) => `${t.id}:${t.side}`)
    .sort()
    .join(",");
  const conds = (line.condiments ?? [])
    .map((c) => `${c.id}:${c.qty}`)
    .sort()
    .join(",");
  return `${line.itemId}::${line.size ?? ""}::${line.halfItemId ?? ""}::${tops}::${conds}::${line.detail ?? ""}::${line.comment ?? ""}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      notes: "",
      bagOpen: false,
      openBag: () => set({ bagOpen: true }),
      closeBag: () => set({ bagOpen: false }),
      toggleBag: () => set((s) => ({ bagOpen: !s.bagOpen })),
      add: (line) =>
        set((s) => {
          const key = lineKey(line);
          const qtyAdd = Math.max(1, line.qty ?? 1);
          const existing = s.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: s.lines.map((l) => (l.key === key ? { ...l, qty: l.qty + qtyAdd } : l)),
            };
          }
          return {
            lines: [
              ...s.lines,
              {
                key,
                itemId: line.itemId,
                categoryId: line.categoryId,
                name: line.name,
                size: line.size,
                detail: line.detail,
                comment: line.comment,
                toppings: line.toppings,
                halfItemId: line.halfItemId,
                condiments: line.condiments,
                unitPrice: line.unitPrice,
                qty: qtyAdd,
              },
            ],
          };
        }),
      setQty: (key, qty) =>
        set((s) => {
          const lines = qty <= 0 ? s.lines.filter((l) => l.key !== key) : s.lines.map((l) => (l.key === key ? { ...l, qty } : l));
          return { lines, notes: lines.length ? s.notes : "" };
        }),
      remove: (key) =>
        set((s) => {
          const lines = s.lines.filter((l) => l.key !== key);
          return { lines, notes: lines.length ? s.notes : "" };
        }),
      setNotes: (notes) => set({ notes }),
      clear: () => set({ lines: [], notes: "" }),
    }),
    {
      name: "south-end-cart-v1",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
      skipHydration: true,
      partialize: (s) => ({
        lines: s.lines.map((l) => ({ ...l, comment: undefined })),
        notes: s.lines.length ? s.notes : "",
      }),
    },
  ),
);

if (typeof window !== "undefined") {
  void useCartStore.persist.rehydrate();
}

export function wipeCart() {
  useCartStore.getState().clear();
  try {
    useCartStore.persist.clearStorage();
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem("south-end-cart-v1");
    } catch {
      /* ignore */
    }
  }
}

export function cartTotals(lines: CartLine[]) {
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = Math.round(lines.reduce((n, l) => n + l.unitPrice * l.qty, 0) * 100) / 100;
  return { count, subtotal };
}
