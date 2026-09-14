import type { ItemCondiment } from "@/data/menu";
import { moneyNumber } from "@/lib/shop-types";

export type CondimentPick = {
  id: string;
  name: string;
  qty: number;
  charge: number;
};

function nid(name: string, index: number) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return slug || `cond-${index + 1}`;
}

export function condimentMax(raw: unknown) {
  const n = Math.round(Number(raw ?? 9));
  if (!Number.isFinite(n) || n < 1) return 9;
  return Math.min(9, n);
}

export function sanitizeCondiments(raw: unknown): ItemCondiment[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: ItemCondiment[] = [];
  for (const row of raw.slice(0, 24)) {
    const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    const name = String(rec.name ?? "").trim().slice(0, 40);
    if (!name) continue;
    let id = String(rec.id ?? "").trim().slice(0, 40) || nid(name, out.length);
    if (seen.has(id)) id = `${id}-${out.length + 1}`;
    seen.add(id);
    const price = moneyNumber(rec.price as string | number);
    const extraRaw =
      rec.extraPrice === undefined || rec.extraPrice === "" ? price : moneyNumber(rec.extraPrice as string | number);
    out.push({
      id,
      name,
      price: price > 0 ? String(Math.round(price * 100) / 100) : "0",
      extraPrice: extraRaw > 0 ? String(Math.round(extraRaw * 100) / 100) : "0",
      maxQty: String(condimentMax(rec.maxQty)),
    });
  }
  return out;
}

export function condimentCharge(c: Pick<ItemCondiment, "price" | "extraPrice" | "maxQty">, qty: number) {
  const cap = condimentMax(c.maxQty);
  const n = Math.max(0, Math.min(cap, Math.round(Number(qty) || 0)));
  if (n <= 0) return 0;
  const add = Math.max(0, moneyNumber(c.price));
  const extra = Math.max(0, moneyNumber(c.extraPrice || c.price));
  return Math.round((add + extra * Math.max(0, n - 1)) * 100) / 100;
}

export function sanitizeCondimentPicks(raw: unknown, catalog: ItemCondiment[]): CondimentPick[] {
  const list = Array.isArray(raw) ? raw : [];
  const byId = new Map(catalog.map((c) => [c.id, c]));
  const picks: CondimentPick[] = [];
  for (const row of list) {
    const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    const c = byId.get(String(rec.id ?? ""));
    if (!c) continue;
    const cap = condimentMax(c.maxQty);
    const qty = Math.max(0, Math.min(cap, Math.round(moneyNumber(rec.qty as string | number))));
    if (qty <= 0) continue;
    picks.push({ id: c.id, name: c.name, qty, charge: condimentCharge(c, qty) });
  }
  return picks;
}

export function condimentTotal(picks: CondimentPick[]) {
  return Math.round(picks.reduce((n, p) => n + p.charge, 0) * 100) / 100;
}

export function condimentDetail(picks: CondimentPick[]) {
  return picks
    .filter((p) => p.qty > 0)
    .map((p) => (p.qty > 1 ? `${p.name} ×${p.qty}` : p.name))
    .join(", ");
}

export function mergeItemDetail(...parts: (string | undefined)[]) {
  return parts
    .map((p) => String(p ?? "").trim())
    .filter(Boolean)
    .join(" · ");
}

export function condimentListedPrice(c: Pick<ItemCondiment, "price" | "extraPrice"> | undefined) {
  if (!c) return 0;
  const extra = moneyNumber(c.extraPrice);
  if (extra > 0) return extra;
  const price = moneyNumber(c.price);
  return price > 0 ? price : 0;
}

export type ExtraKind = "ranch" | "blue" | "dressing";

export function extraCondimentMeta(kind: ExtraKind) {
  if (kind === "ranch") return { id: "wing-extra-ranch", name: "Extra Ranch" };
  if (kind === "blue") return { id: "wing-extra-blue", name: "Extra Blue cheese" };
  return { id: "salad-extra", name: "Extra dressing" };
}

export function isExtraKind(c: { id?: string; name?: string }, kind: ExtraKind) {
  const id = String(c.id ?? "").toLowerCase();
  const name = String(c.name ?? "");
  if (kind === "ranch") {
    return id === "wing-extra-ranch" || /extra-ranch/.test(id) || /extra ranch/i.test(name);
  }
  if (kind === "blue") {
    return id === "wing-extra-blue" || /extra-blue/.test(id) || /extra blue/i.test(name);
  }
  return id === "salad-extra" || /extra-dressing/.test(id) || /extra dressing/i.test(name);
}

export function upsertExtraCondiments(list: ItemCondiment[] | undefined, kind: ExtraKind, price: string): ItemCondiment[] {
  const meta = extraCondimentMeta(kind);
  const next = [...(list ?? [])];
  const i = next.findIndex((c) => isExtraKind(c, kind));
  const listed = String(price ?? "").trim();
  const row: ItemCondiment = {
    id: meta.id,
    name: meta.name,
    price: listed,
    extraPrice: listed,
    maxQty: "6",
  };
  if (i >= 0) next[i] = { ...next[i], ...row, id: next[i].id || meta.id };
  else next.push(row);
  return next;
}
