import type { CondimentPick } from "@/lib/condiments";
import type { ItemCondiment } from "@/data/menu";
import { condimentListedPrice, isExtraKind, mergeItemDetail } from "@/lib/condiments";

export const SALAD_DRESSINGS = [
  "Light Italian",
  "Caesar",
  "Ranch",
  "Blue cheese",
  "Balsamic",
  "Honey mustard",
] as const;
export type SaladDressing = (typeof SALAD_DRESSINGS)[number];

export const SALAD_EXTRA_STEP = 2;
export const SALAD_EXTRA_MAX = 6;

export function extraDressingUnitPrice(condiments: ItemCondiment[] | undefined) {
  const hit = (condiments ?? []).find((c) => isExtraKind(c, "dressing"));
  return condimentListedPrice(hit);
}

export function extraDressingCharge(cups: number, unit: number) {
  const n = Math.max(0, Math.round(Number(cups) || 0));
  const sets = Math.floor(n / SALAD_EXTRA_STEP);
  const price = unit > 0 ? unit : 0;
  return Math.round(sets * price * 100) / 100;
}

export function snapSaladExtra(n: number) {
  const raw = Math.max(0, Math.min(SALAD_EXTRA_MAX, Math.round(Number(n) || 0)));
  return Math.floor(raw / SALAD_EXTRA_STEP) * SALAD_EXTRA_STEP;
}

export function saladBuildReady(dressing: string) {
  return SALAD_DRESSINGS.includes(dressing as SaladDressing);
}

export function saladDressingSlug(dressing: string) {
  return dressing.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function saladDressingPick(dressing: SaladDressing): CondimentPick {
  return {
    id: `salad-dressing-${saladDressingSlug(dressing)}`,
    name: dressing,
    qty: 1,
    charge: 0,
  };
}

export function dressingFromPicks(raw: unknown): SaladDressing | "" {
  const list = Array.isArray(raw) ? raw : [];
  for (const row of list) {
    const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    const id = String(rec.id ?? "").toLowerCase();
    const name = String(rec.name ?? "").trim();
    const hit = SALAD_DRESSINGS.find(
      (d) => id === `salad-dressing-${saladDressingSlug(d)}` || name.toLowerCase() === d.toLowerCase(),
    );
    if (hit) return hit;
  }
  return "";
}

export function saladBuildPicks(input: {
  dressing: SaladDressing;
  extra: number;
  extraUnit?: number;
}): { condiments: CondimentPick[]; detail: string; extras: number } {
  const extra = snapSaladExtra(input.extra);
  const extraUnit = input.extraUnit && input.extraUnit > 0 ? input.extraUnit : 0;
  const condiments: CondimentPick[] = [saladDressingPick(input.dressing)];
  if (extra > 0) {
    condiments.push({
      id: "salad-extra",
      name: "Extra dressing",
      qty: extra,
      charge: extraDressingCharge(extra, extraUnit),
    });
  }
  const extras = extraDressingCharge(extra, extraUnit);
  const detail = mergeItemDetail(
    input.dressing,
    extra > 0 ? `Extra dressing ×${extra}` : "",
  );
  return { condiments, detail, extras };
}

export function sanitizeSaladPicks(
  raw: unknown,
  condiments?: ItemCondiment[],
): { condiments: CondimentPick[]; detail: string; extras: number } | null {
  const list = Array.isArray(raw) ? raw : [];
  const dressing = dressingFromPicks(list);
  let extra = 0;
  for (const row of list) {
    const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    const id = String(rec.id ?? "").toLowerCase();
    const name = String(rec.name ?? "").trim();
    const qty = Math.max(0, Math.round(Number(rec.qty) || 0));
    if (isExtraKind({ id, name }, "dressing")) extra = snapSaladExtra(qty || extra);
  }
  if (!saladBuildReady(dressing)) return null;
  return saladBuildPicks({
    dressing: dressing as SaladDressing,
    extra,
    extraUnit: extraDressingUnitPrice(condiments),
  });
}
