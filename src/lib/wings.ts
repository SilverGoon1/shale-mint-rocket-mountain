import type { CondimentPick } from "@/lib/condiments";
import type { ItemCondiment, MenuCategory, MenuItem } from "@/data/menu";
import { condimentListedPrice, isExtraKind, mergeItemDetail } from "@/lib/condiments";

export const WING_SAUCES = ["Hot", "Mild", "Dry", "BBQ"] as const;
export type WingSauce = (typeof WING_SAUCES)[number];

export const WING_INCLUDED_DIPS = [
  { id: "ranch", label: "2 Ranch" },
  { id: "blue", label: "2 Blue cheese" },
  { id: "none", label: "None" },
] as const;
export type WingIncludedDip = (typeof WING_INCLUDED_DIPS)[number]["id"];

export const BUFFALO_INCLUDED_DIPS = [
  { id: "ranch", label: "Ranch" },
  { id: "blue", label: "Blue cheese" },
  { id: "none", label: "None" },
] as const;

export const WING_EXTRA_STEP = 2;
export const WING_EXTRA_MAX = 6;

export const WING_QTY_MIN = 10;
export const WING_QTY_STEP = 10;
export const WING_QTY_MAX = 50;

export function isTendersBuild(_cat: MenuCategory, item: Pick<MenuItem, "name">) {
  if (/nugget/i.test(item.name) || /pizza/i.test(item.name)) return false;
  return /tender|chicken finger/i.test(item.name);
}

export function isWingsBuild(cat: MenuCategory, item: Pick<MenuItem, "name">) {
  if (cat.id === "wings" && /wing/i.test(item.name)) return true;
  return /fresh wings|chicken wings/i.test(item.name);
}

export function isSauceDipBuild(cat: MenuCategory, item: Pick<MenuItem, "name">) {
  return isWingsBuild(cat, item) || isTendersBuild(cat, item);
}

export function extraDipUnitPrice(condiments: ItemCondiment[] | undefined, which: "ranch" | "blue") {
  const hit = (condiments ?? []).find((c) => isExtraKind(c, which));
  return condimentListedPrice(hit);
}

export function extraDipCharge(cups: number, unit = 0) {
  const n = Math.max(0, Math.round(Number(cups) || 0));
  const sets = Math.floor(n / WING_EXTRA_STEP);
  const price = unit > 0 ? unit : 0;
  return Math.round(sets * price * 100) / 100;
}

export function snapExtraCups(n: number) {
  const raw = Math.max(0, Math.min(WING_EXTRA_MAX, Math.round(Number(n) || 0)));
  return Math.floor(raw / WING_EXTRA_STEP) * WING_EXTRA_STEP;
}

export function snapWingQty(n: number) {
  const raw = Math.max(WING_QTY_MIN, Math.min(WING_QTY_MAX, Math.round(Number(n) || WING_QTY_MIN)));
  return Math.round(raw / WING_QTY_STEP) * WING_QTY_STEP;
}

export function parseWingQty(label?: string | null) {
  const m = String(label ?? "").match(/(\d+)\s*pc/i);
  if (!m) return 0;
  return snapWingQty(Number(m[1]));
}

export function wingQtyMultiplier(qty: number) {
  return snapWingQty(qty) / WING_QTY_MIN;
}

export function wingBuildReady(sauce: string, dip: string) {
  return WING_SAUCES.includes(sauce as WingSauce) && WING_INCLUDED_DIPS.some((d) => d.id === dip);
}

export function wingBuildPicks(input: {
  sauce: WingSauce;
  dip: WingIncludedDip;
  extraRanch: number;
  extraBlue: number;
  ranchUnit?: number;
  blueUnit?: number;
}): { condiments: CondimentPick[]; detail: string; extras: number } {
  const extraRanch = snapExtraCups(input.extraRanch);
  const extraBlue = snapExtraCups(input.extraBlue);
  const ranchUnit = input.ranchUnit && input.ranchUnit > 0 ? input.ranchUnit : 0;
  const blueUnit = input.blueUnit && input.blueUnit > 0 ? input.blueUnit : 0;
  const condiments: CondimentPick[] = [
    { id: `wing-sauce-${input.sauce.toLowerCase()}`, name: input.sauce, qty: 1, charge: 0 },
  ];
  const dipRow = WING_INCLUDED_DIPS.find((d) => d.id === input.dip);
  if (dipRow) {
    condiments.push({
      id: `wing-dip-${dipRow.id}`,
      name: dipRow.label,
      qty: 1,
      charge: 0,
    });
  }
  if (extraRanch > 0) {
    condiments.push({
      id: "wing-extra-ranch",
      name: "Extra Ranch",
      qty: extraRanch,
      charge: extraDipCharge(extraRanch, ranchUnit),
    });
  }
  if (extraBlue > 0) {
    condiments.push({
      id: "wing-extra-blue",
      name: "Extra Blue cheese",
      qty: extraBlue,
      charge: extraDipCharge(extraBlue, blueUnit),
    });
  }
  const extras = extraDipCharge(extraRanch, ranchUnit) + extraDipCharge(extraBlue, blueUnit);
  const detail = mergeItemDetail(
    input.sauce,
    dipRow?.label,
    extraRanch > 0 ? `Extra Ranch ×${extraRanch}` : "",
    extraBlue > 0 ? `Extra Blue cheese ×${extraBlue}` : "",
  );
  return { condiments, detail, extras };
}

export function sanitizeWingPicks(
  raw: unknown,
  condiments?: ItemCondiment[],
): { condiments: CondimentPick[]; detail: string; extras: number } | null {
  const list = Array.isArray(raw) ? raw : [];
  let sauce: WingSauce | "" = "";
  let dip: WingIncludedDip | "" = "";
  let extraRanch = 0;
  let extraBlue = 0;
  for (const row of list) {
    const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    const id = String(rec.id ?? "").toLowerCase();
    const name = String(rec.name ?? "").trim();
    const qty = Math.max(0, Math.round(Number(rec.qty) || 0));
    const sauceHit = WING_SAUCES.find(
      (s) => id === `wing-sauce-${s.toLowerCase()}` || name.toLowerCase() === s.toLowerCase(),
    );
    if (sauceHit) {
      sauce = sauceHit;
      continue;
    }
    const dipHit = WING_INCLUDED_DIPS.find(
      (d) => id === `wing-dip-${d.id}` || name.toLowerCase() === d.label.toLowerCase(),
    ) || BUFFALO_INCLUDED_DIPS.find(
      (d) => id === `wing-dip-${d.id}` || name.toLowerCase() === d.label.toLowerCase(),
    );
    if (dipHit) {
      dip = dipHit.id;
      continue;
    }
    if (isExtraKind({ id, name }, "ranch")) extraRanch = snapExtraCups(qty || extraRanch);
    if (isExtraKind({ id, name }, "blue")) extraBlue = snapExtraCups(qty || extraBlue);
  }
  if (!wingBuildReady(sauce, dip)) return null;
  return wingBuildPicks({
    sauce: sauce as WingSauce,
    dip: dip as WingIncludedDip,
    extraRanch,
    extraBlue,
    ranchUnit: extraDipUnitPrice(condiments, "ranch"),
    blueUnit: extraDipUnitPrice(condiments, "blue"),
  });
}

export function buffaloDipReady(dip: string) {
  return BUFFALO_INCLUDED_DIPS.some((d) => d.id === dip) || WING_INCLUDED_DIPS.some((d) => d.id === dip);
}

export function buffaloBuildPicks(input: {
  dip: WingIncludedDip;
  extraRanch: number;
  extraBlue: number;
  ranchUnit?: number;
  blueUnit?: number;
}): { condiments: CondimentPick[]; detail: string; extras: number } {
  const extraRanch = snapExtraCups(input.extraRanch);
  const extraBlue = snapExtraCups(input.extraBlue);
  const ranchUnit = input.ranchUnit && input.ranchUnit > 0 ? input.ranchUnit : 0;
  const blueUnit = input.blueUnit && input.blueUnit > 0 ? input.blueUnit : 0;
  const dipRow = BUFFALO_INCLUDED_DIPS.find((d) => d.id === input.dip) ?? WING_INCLUDED_DIPS.find((d) => d.id === input.dip);
  const condiments: CondimentPick[] = dipRow
    ? [{ id: `wing-dip-${dipRow.id}`, name: dipRow.label, qty: 1, charge: 0 }]
    : [];
  if (extraRanch > 0) {
    condiments.push({
      id: "wing-extra-ranch",
      name: "Extra Ranch",
      qty: extraRanch,
      charge: extraDipCharge(extraRanch, ranchUnit),
    });
  }
  if (extraBlue > 0) {
    condiments.push({
      id: "wing-extra-blue",
      name: "Extra Blue cheese",
      qty: extraBlue,
      charge: extraDipCharge(extraBlue, blueUnit),
    });
  }
  const extras = extraDipCharge(extraRanch, ranchUnit) + extraDipCharge(extraBlue, blueUnit);
  const detail = mergeItemDetail(
    dipRow?.label,
    extraRanch > 0 ? `Extra Ranch ×${extraRanch}` : "",
    extraBlue > 0 ? `Extra Blue cheese ×${extraBlue}` : "",
  );
  return { condiments, detail, extras };
}

export function sanitizeBuffaloPicks(
  raw: unknown,
  condiments?: ItemCondiment[],
): { condiments: CondimentPick[]; detail: string; extras: number } | null {
  const list = Array.isArray(raw) ? raw : [];
  let dip: WingIncludedDip | "" = "";
  let extraRanch = 0;
  let extraBlue = 0;
  for (const row of list) {
    const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    const id = String(rec.id ?? "").toLowerCase();
    const name = String(rec.name ?? "").trim();
    const qty = Math.max(0, Math.round(Number(rec.qty) || 0));
    const dipHit =
      BUFFALO_INCLUDED_DIPS.find((d) => id === `wing-dip-${d.id}` || name.toLowerCase() === d.label.toLowerCase()) ||
      WING_INCLUDED_DIPS.find((d) => id === `wing-dip-${d.id}` || name.toLowerCase() === d.label.toLowerCase());
    if (dipHit) {
      dip = dipHit.id as WingIncludedDip;
      continue;
    }
    if (isExtraKind({ id, name }, "ranch")) extraRanch = snapExtraCups(qty || extraRanch);
    if (isExtraKind({ id, name }, "blue")) extraBlue = snapExtraCups(qty || extraBlue);
  }
  if (!buffaloDipReady(dip)) return null;
  return buffaloBuildPicks({
    dip: dip as WingIncludedDip,
    extraRanch,
    extraBlue,
    ranchUnit: extraDipUnitPrice(condiments, "ranch"),
    blueUnit: extraDipUnitPrice(condiments, "blue"),
  });
}
