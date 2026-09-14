import type { MenuCategory, MenuItem } from "@/data/menu";
import type { CondimentPick } from "@/lib/condiments";
import { dressingFromPicks, saladDressingPick, type SaladDressing } from "@/lib/salads";

export const GROUP_SAUCE_DIP = "sauce_dip";
export const GROUP_SALAD = "salad_dressing";
export const GROUP_PASTA = "pasta_shape";
export const GROUP_BUFFALO = "buffalo_dip";

export const PASTA_SHAPES = ["Penne", "Spaghetti"] as const;
export type PastaShape = (typeof PASTA_SHAPES)[number];

export const PASTA_BREAD = [
  { id: "keep", label: "Keep bread" },
  { id: "none", label: "No bread" },
] as const;
export type PastaBread = (typeof PASTA_BREAD)[number]["id"];

export const MODIFIER_GROUPS = [
  { id: GROUP_SAUCE_DIP, label: "Sauce & dressings (wings style)" },
  { id: GROUP_SALAD, label: "Salad dressings" },
  { id: GROUP_PASTA, label: "Pasta shape (Penne / Spaghetti)" },
  { id: GROUP_BUFFALO, label: "Buffalo dressings (Ranch / Blue / None)" },
] as const;

export type ModifierGroupId = (typeof MODIFIER_GROUPS)[number]["id"];

const KNOWN_GROUPS = new Set<string>(MODIFIER_GROUPS.map((g) => g.id));

export function parseGroups(raw: unknown): string[] | undefined {
  if (raw == null || raw === "") return undefined;
  let list: unknown = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(list)) return undefined;
  const out: string[] = [];
  for (const row of list) {
    const id = String(row ?? "").trim();
    if (KNOWN_GROUPS.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function defaultGroups(cat: Pick<MenuCategory, "id">, item: Pick<MenuItem, "name">): string[] {
  const n = String(item.name ?? "").toLowerCase();
  if (/nugget/i.test(n)) return [];
  if (cat.id === "salads") return [GROUP_SALAD];
  if (/buffalo/i.test(n) && /pizza/i.test(n)) return [GROUP_BUFFALO];
  if ((cat.id === "wings" && /wing/i.test(n)) || /fresh wings|chicken wings/i.test(n)) return [GROUP_SAUCE_DIP];
  if (/tender|chicken finger/i.test(n)) return [GROUP_SAUCE_DIP];
  if (/manicotti|ravioli|\bziti\b/i.test(n)) return [];
  if (cat.id === "pasta" || /pasta/i.test(n) || n === "spaghetti" || /spaghetti with/i.test(n) || /side of pasta/i.test(n)) {
    return [GROUP_PASTA];
  }
  return [];
}

export function itemGroups(
  cat: Pick<MenuCategory, "id">,
  item: Pick<MenuItem, "name" | "groups">,
): string[] {
  const explicit = parseGroups(item.groups);
  if (explicit) return explicit;
  return defaultGroups(cat, item);
}

export function hasGroup(
  cat: Pick<MenuCategory, "id">,
  item: Pick<MenuItem, "name" | "groups">,
  group: ModifierGroupId,
) {
  return itemGroups(cat, item).includes(group);
}

export function isPastaPlatter(cat: Pick<MenuCategory, "id">, item: Pick<MenuItem, "name">) {
  if (/side of pasta/i.test(item.name)) return false;
  return cat.id === "pasta";
}

export function pastaShapeFromPicks(raw: unknown): PastaShape | "" {
  const list = Array.isArray(raw) ? raw : [];
  for (const row of list) {
    const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    const id = String(rec.id ?? "").toLowerCase();
    const name = String(rec.name ?? "").trim();
    const hit = PASTA_SHAPES.find(
      (s) => id === `pasta-shape-${s.toLowerCase()}` || name.toLowerCase() === s.toLowerCase(),
    );
    if (hit) return hit;
  }
  return "";
}

export function pastaShapePick(shape: PastaShape): CondimentPick {
  return {
    id: `pasta-shape-${shape.toLowerCase()}`,
    name: shape,
    qty: 1,
    charge: 0,
  };
}

export function pastaBreadFromPicks(raw: unknown): PastaBread {
  const list = Array.isArray(raw) ? raw : [];
  for (const row of list) {
    const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    const id = String(rec.id ?? "").toLowerCase();
    const name = String(rec.name ?? "").toLowerCase();
    if (id === "pasta-bread-none" || name === "no bread") return "none";
    if (id === "pasta-bread-keep" || name === "keep bread") return "keep";
  }
  return "keep";
}

export function pastaBreadPick(which: PastaBread): CondimentPick {
  const row = PASTA_BREAD.find((b) => b.id === which) ?? PASTA_BREAD[0];
  return {
    id: `pasta-bread-${row.id}`,
    name: row.label,
    qty: 1,
    charge: 0,
  };
}

export function pastaDressingFromPicks(raw: unknown): SaladDressing | "" {
  return dressingFromPicks(raw);
}

export function pastaDressingPick(dressing: SaladDressing): CondimentPick {
  return saladDressingPick(dressing);
}
