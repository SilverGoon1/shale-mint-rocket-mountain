import type { LucideIcon } from "lucide-react";
import { Pizza } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { CATEGORY_ICONS } from "@/data/icons";
import type { MenuCategory, MenuItem, PriceCol, RestaurantInfo } from "@/data/menu";
import { useMenuStore } from "@/lib/menu-store";
import { pizzaNote } from "@/lib/pizza";
import type { ShopSettingsPublic } from "@/lib/shop-types";

export type PaperSize = "letter" | "tabloid" | "poster" | "letter4p" | "letter4l";

export function isLetterPack(paper: PaperSize) {
  return paper === "letter4p" || paper === "letter4l";
}

const LETTER_GROUPS = [
  ["pizza", "gourmet", "appetizers", "salads", "sides", "wings"],
  [
    "turnovers",
    "sandwiches",
    "clubs",
    "hot-subs",
    "cold-subs",
    "steak-subs",
    "burgers",
    "wraps",
    "gyros",
    "pasta",
    "desserts",
    "beverages",
  ],
];

const WIDE_GROUPS = [
  ["pizza", "gourmet", "turnovers", "pasta"],
  ["appetizers", "salads", "sides", "wings", "sandwiches", "clubs", "desserts", "beverages"],
  ["hot-subs", "cold-subs", "steak-subs", "burgers", "wraps", "gyros"],
];

function money(price: string) {
  const t = price.trim().replace(/^\$/, "");
  if (!t) return "—";
  const n = Number(t);
  if (Number.isFinite(n)) return `$${n.toFixed(2)}`;
  return `$${t}`;
}

function displayName(item: MenuItem, cat: MenuCategory) {
  let n = item.name;
  if (cat.id === "pizza" || cat.id === "gourmet") n = n.replace(/ Pizza$/, "");
  if (cat.id === "hot-subs") n = n.replace(/ Hot Sub$/, "");
  if (cat.id === "cold-subs") n = n.replace(/ Cold Sub$/, "");
  if (cat.id === "sandwiches") n = n.replace(/ Sandwich$/, "");
  if (cat.id === "clubs") n = n.replace(/ Sandwich$/, "");
  if (cat.id === "wraps") n = n.replace(/ Wrap$/, "");
  if (cat.id === "steak-subs") n = n.replace(/ Sub$/, "");
  if (cat.id === "gyros") n = n.replace(/ Sandwich$/, "");
  return n || "Untitled";
}

function usefulPrices(prices: PriceCol[]) {
  if (prices.length === 1 && prices[0].label === "LG") {
    return [{ ...prices[0], label: undefined }];
  }
  return prices;
}

function pizzaHasXl(item: MenuItem) {
  return item.prices.some((p) => p.label === "XL" && p.price);
}

function SizeLegend({ xl, xlInches }: { xl: boolean; xlInches: string }) {
  return (
    <div className="size-legend" aria-label="Pizza sizes">
      <div className="size-pip">
        <span className="size-disc size-disc-sm" aria-hidden>
          <span />
        </span>
        SM 12"
      </div>
      <div className="size-pip">
        <span className="size-disc size-disc-md" aria-hidden>
          <span />
        </span>
        MD 14"
      </div>
      <div className="size-pip">
        <span className="size-disc size-disc-lg" aria-hidden>
          <span />
        </span>
        LG 16"
      </div>
      {xl ? (
        <div className="size-pip">
          <span className="size-disc size-disc-xl" aria-hidden>
            <span />
          </span>
          XL {xlInches}
        </div>
      ) : null}
    </div>
  );
}

function PizzaRow({
  item,
  cat,
  showDesc,
  xl,
}: {
  item: MenuItem;
  cat: MenuCategory;
  showDesc: boolean;
  xl: boolean;
}) {
  const labs = xl ? ["SM", "MD", "LG", "XL"] : ["SM", "MD", "LG"];
  const cols = labs.map((lab) => item.prices.find((p) => p.label === lab));
  return (
    <div className="item-row" data-kind="pizza" data-xl={xl ? "true" : undefined}>
      <span className="bullet" aria-hidden />
      <div className="item-copy">
        <div className="item-name" data-fav={item.highlight ? "true" : undefined}>
          {displayName(item, cat)}
          {item.highlight ? <span className="fav-tag">House favorite</span> : null}
        </div>
        {showDesc && item.description ? <div className="item-desc">{item.description}.</div> : null}
      </div>
      {cols.map((col, i) => (
        <div key={i} className="price" data-size={col?.label}>
          {col ? money(col.price) : "—"}
        </div>
      ))}
    </div>
  );
}

function BeverageRow({ item }: { item: MenuItem }) {
  const prices = usefulPrices(item.prices);
  return (
    <div className="item-row" data-kind="split" data-bev="true">
      <span className="bullet" aria-hidden />
      <div className="item-copy">
        <div className="item-name">{item.name}</div>
      </div>
      <div className="split-prices">
        {prices.map((p, i) => (
          <div className="pair" key={i}>
            {p.label ? <span className="lbl">{p.label}</span> : null}
            <span className="price">{money(p.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  cat,
  showDesc,
}: {
  item: MenuItem;
  cat: MenuCategory;
  showDesc: boolean;
}) {
  const prices = usefulPrices(item.prices);
  const multi = prices.length > 1 || Boolean(prices[0]?.label);

  return (
    <div className="item-row" data-kind={multi ? "split" : "single"}>
      <span className="bullet" aria-hidden />
      <div className="item-copy">
        <div className="item-name">{displayName(item, cat)}</div>
        {showDesc && item.description ? <div className="item-desc">{item.description}.</div> : null}
      </div>
      {multi ? (
        <div className="split-prices">
          {prices.map((p, i) => (
            <div className="pair" key={i}>
              {p.label ? <span className="lbl">{p.label}</span> : null}
              <span className="price">{money(p.price)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="lead-price">
          <span className="dots" aria-hidden />
          <span className="price">{money(prices[0]?.price ?? "")}</span>
        </div>
      )}
    </div>
  );
}

function Section({
  cat,
  showDesc,
  settings,
  anchor = true,
}: {
  cat: MenuCategory;
  showDesc: boolean;
  settings?: ShopSettingsPublic;
  anchor?: boolean;
}) {
  const Icon: LucideIcon = CATEGORY_ICONS[cat.icon ?? cat.id] ?? Pizza;
  const pizza = cat.kind === "pizza";
  const xl = pizza && cat.items.some(pizzaHasXl);
  const xlInches = cat.items.flatMap((it) => it.prices).find((p) => p.label === "XL")?.inches || '18"';
  const note = pizza && settings ? pizzaNote(settings, cat.items) : cat.note;

  return (
    <section className="menu-section" id={anchor ? cat.id : undefined}>
      <div className="section-head">
        <span className="section-icon" aria-hidden>
          <Icon strokeWidth={2.2} />
        </span>
        <h2 className="section-title">{cat.name || "Untitled"}</h2>
      </div>
      {note ? <p className="section-note">{note}</p> : null}
      {pizza ? (
        <div className="pizza-cols" data-xl={xl ? "true" : undefined} aria-hidden>
          <span />
          <span />
          <span>
            SM
            <span className="inches">12"</span>
          </span>
          <span>
            MD
            <span className="inches">14"</span>
          </span>
          <span>
            LG
            <span className="inches">16"</span>
          </span>
          {xl ? (
            <span>
              XL
              <span className="inches">{xlInches}</span>
            </span>
          ) : null}
        </div>
      ) : null}
      {cat.items.map((item, i) =>
        pizza ? (
          <PizzaRow key={item.id ?? `${item.name}-${i}`} item={item} cat={cat} showDesc={showDesc} xl={xl} />
        ) : cat.id === "beverages" ? (
          <BeverageRow key={item.id ?? `${item.name}-${i}`} item={item} />
        ) : (
          <ItemRow key={item.id ?? `${item.name}-${i}`} item={item} cat={cat} showDesc={showDesc} />
        ),
      )}
    </section>
  );
}

function layoutColumns(paper: PaperSize, cats: MenuCategory[]): MenuCategory[][] {
  const presets = paper === "letter" ? LETTER_GROUPS : WIDE_GROUPS;
  const byId = new Map(cats.map((c) => [c.id, c]));
  const used = new Set<string>();
  const cols = presets.map((group) => {
    const col: MenuCategory[] = [];
    for (const id of group) {
      const c = byId.get(id);
      if (c) {
        col.push(c);
        used.add(id);
      }
    }
    return col;
  });
  for (const c of cats) {
    if (!used.has(c.id)) cols[cols.length - 1].push(c);
  }
  return cols.filter((col) => col.length > 0);
}

const LETTER4_QUADS = [
  { id: "tl", x: 0, y: 0 },
  { id: "tr", x: 1, y: 0 },
  { id: "bl", x: 0, y: 1 },
  { id: "br", x: 1, y: 1 },
] as const;

function pageCss(paper: PaperSize, printScale: number) {
  const scale = Math.max(0.9, Math.min(1.6, printScale / 100));
  if (paper === "letter4p") return `@media print { @page { size: letter portrait; margin: 0; } :root { --print-scale: ${scale}; } }`;
  if (paper === "letter4l") return `@media print { @page { size: letter landscape; margin: 0; } :root { --print-scale: ${scale}; } }`;
  const page =
    paper === "letter" ? "letter portrait" : paper === "poster" ? "18in 24in landscape" : "11in 17in landscape";
  return `@media print { @page { size: ${page}; margin: 0.38in; } :root { --print-scale: ${scale}; } }`;
}

function BoardFace({
  paper,
  showDesc,
  showMark,
  settings,
  printScale,
  anchor = true,
}: {
  paper: PaperSize;
  showDesc: boolean;
  showMark: boolean;
  settings?: ShopSettingsPublic;
  printScale: number;
  anchor?: boolean;
}) {
  const restaurant = useMenuStore((s) => s.restaurant);
  const footer = useMenuStore((s) => s.footer);
  const categories = useMenuStore((s) => s.categories);
  const face = isLetterPack(paper) ? "poster" : paper;
  const groups = layoutColumns(paper, categories);
  const xl = categories.some((c) => c.kind === "pizza" && c.items.some(pizzaHasXl));
  const xlInches =
    categories.flatMap((c) => c.items).flatMap((it) => it.prices).find((p) => p.label === "XL")?.inches || '18"';

  return (
    <article
      className="paper"
      data-paper={face}
      data-pack={isLetterPack(paper) ? paper : undefined}
      style={{ ["--print-scale" as string]: String(Math.max(0.9, Math.min(1.6, printScale / 100))) }}
    >
      <header className="masthead">
        {showMark ? <BrandMark variant="mast" /> : null}
        <div className="mast-kicker">
          Egg Harbor Township · Est. {restaurant.established}
        </div>
        <h1 className="mast-name">{restaurant.name}</h1>
        <div className="mast-meta">
          <span>{restaurant.address}</span>
          <span>{restaurant.city}</span>
          <a href={restaurant.phoneHref}>{restaurant.phone}</a>
          <span>{restaurant.hours}</span>
        </div>
        <SizeLegend xl={xl} xlInches={xlInches} />
      </header>

      <div className="menu-columns">
        {groups.map((col) => (
          <div className="menu-col" key={col.map((c) => c.id).join("-")}>
            {col.map((cat) => (
              <Section key={cat.id} cat={cat} showDesc={showDesc} settings={settings} anchor={anchor} />
            ))}
          </div>
        ))}
      </div>

      <footer className="board-foot">
        <span>{footer}</span>
        <span>Wall menu · {restaurant.name}</span>
      </footer>
    </article>
  );
}

export function MenuBoard({
  paper,
  showDesc,
  showMark = true,
  settings,
  printScale = 100,
}: {
  paper: PaperSize;
  showDesc: boolean;
  showMark?: boolean;
  settings?: ShopSettingsPublic;
  printScale?: number;
}) {
  const face = (
    <BoardFace paper={paper} showDesc={showDesc} showMark={showMark} settings={settings} printScale={printScale} />
  );

  if (!isLetterPack(paper)) {
    return (
      <>
        <style>{pageCss(paper, printScale)}</style>
        {face}
      </>
    );
  }

  const landscape = paper === "letter4l";
  return (
    <div className="letter-pack" data-orient={landscape ? "landscape" : "portrait"}>
      <style>{pageCss(paper, printScale)}</style>
      {LETTER4_QUADS.map((q) => (
        <section className="letter-sheet" key={q.id} data-quad={q.id}>
          <div className="letter-sheet-clip">
            <div className="letter-sheet-shift">
              <BoardFace
                paper={paper}
                showDesc={showDesc}
                showMark={showMark}
                settings={settings}
                printScale={printScale}
                anchor={q.id === "tl"}
              />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

export function CategoryJump() {
  const categories = useMenuStore((s) => s.categories);
  return (
    <nav className="jump-nav no-print" aria-label="Menu sections">
      {categories.map((cat) => (
        <a key={cat.id} href={`#${cat.id}`}>
          {cat.name || "Untitled"}
        </a>
      ))}
    </nav>
  );
}

export type { RestaurantInfo };
