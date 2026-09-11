import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  ImagePlus,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { ICON_CHOICES, iconFor } from "@/data/icons";
import { itemPhoto } from "@/data/item-photos";
import type { CategoryKind, ItemCondiment, PriceCol } from "@/data/menu";
import { fileToDataImage } from "@/lib/image-file";
import { condimentMax } from "@/lib/condiments";
import {
  isCustomMenu,
  useMenuStore,
  type EditableCategory,
  type EditableItem,
} from "@/lib/menu-store";

const KINDS: { id: CategoryKind; label: string }[] = [
  { id: "pizza", label: "Pizza SM/MD/LG" },
  { id: "split", label: "Split prices" },
  { id: "single", label: "Single price" },
];

export function MenuEditor() {
  const restaurant = useMenuStore((s) => s.restaurant);
  const footer = useMenuStore((s) => s.footer);
  const categories = useMenuStore((s) => s.categories);
  const setRestaurant = useMenuStore((s) => s.setRestaurant);
  const setFooter = useMenuStore((s) => s.setFooter);
  const addCategory = useMenuStore((s) => s.addCategory);
  const reset = useMenuStore((s) => s.reset);

  const [query, setQuery] = useState("");
  const [shopOpen, setShopOpen] = useState(false);
  const [openCats, setOpenCats] = useState<Set<string>>(() => new Set());
  const custom = isCustomMenu({ restaurant, footer, categories });

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!q) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((it) => {
          const blob = `${it.name} ${it.description ?? ""} ${cat.name}`.toLowerCase();
          return blob.includes(q);
        }),
      }))
      .filter((cat) => cat.items.length > 0 || cat.name.toLowerCase().includes(q));
  }, [categories, q]);

  useEffect(() => {
    if (!q) return;
    setOpenCats(new Set(visible.map((c) => c.id)));
  }, [q, visible]);

  function toggleCat(id: string) {
    setShopOpen(false);
    setOpenCats((prev) => {
      if (prev.has(id) && prev.size === 1) return new Set();
      return new Set([id]);
    });
  }

  return (
    <aside className="editor-panel no-print" aria-label="Menu editor">
      <div className="ed-head">
        <div>
          <h2 className="ed-title">Edit menu</h2>
          <p className="ed-sub">
            Changes update the wall board and save on this device. Print uses the edited prices.
          </p>
        </div>
        <button
          type="button"
          className="ed-btn ed-btn-quiet"
          disabled={!custom}
          onClick={() => {
            if (window.confirm("Restore the original South End Pizza III menu and shop details?")) {
              reset();
              setOpenCats(new Set());
              setShopOpen(false);
            }
          }}
        >
          <RotateCcw size={14} strokeWidth={2.2} />
          Restore original
        </button>
      </div>

      <label className="ed-search">
        <Search size={16} strokeWidth={2.2} aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items…"
          aria-label="Search menu items"
        />
      </label>

      <section className="ed-block">
        <button
          type="button"
          className="ed-block-toggle"
          aria-expanded={shopOpen}
          onClick={() => {
            setShopOpen((v) => !v);
            setOpenCats(new Set());
          }}
        >
          <span>Shop details</span>
          {shopOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {shopOpen ? (
          <div className="ed-shop">
            <Field label="Address" value={restaurant.address} onChange={(v) => setRestaurant({ address: v })} />
            <Field label="City" value={restaurant.city} onChange={(v) => setRestaurant({ city: v })} />
            <Field label="Phone" value={restaurant.phone} onChange={(v) => setRestaurant({ phone: v })} />
            <Field label="Hours" value={restaurant.hours} onChange={(v) => setRestaurant({ hours: v })} />
            <Field
              label="Established"
              value={restaurant.established}
              onChange={(v) => setRestaurant({ established: v })}
            />
            <ShopWebFields />
            <label className="ed-field">
              <span>Footer note</span>
              <textarea
                className="ed-input ed-area"
                rows={2}
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
              />
            </label>
          </div>
        ) : null}
      </section>

      <div className="ed-cat-list">
        {visible.map((cat, index) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            open={openCats.has(cat.id)}
            onToggle={() => toggleCat(cat.id)}
            isFirst={index === 0 && !q}
            isLast={index === visible.length - 1 && !q}
            allCats={categories}
            querying={Boolean(q)}
          />
        ))}
        {visible.length === 0 ? <p className="ed-empty">No items match that search.</p> : null}
      </div>

      <button type="button" className="ed-btn ed-btn-add" onClick={addCategory}>
        <Plus size={16} strokeWidth={2.2} />
        Add section
      </button>
    </aside>
  );
}

function ShopWebFields() {
  const tagline = useMenuStore((s) => s.tagline);
  const showMark = useMenuStore((s) => s.showMark);
  const setShopWeb = useMenuStore((s) => s.setShopWeb);
  return (
    <>
      <Field label="Tagline" value={tagline} onChange={(v) => setShopWeb({ tagline: v })} />
      <label className="pay-opt">
        <input type="checkbox" checked={showMark} onChange={(e) => setShopWeb({ showMark: e.target.checked })} />
        Show the buffalo mark on login and the wall menu
      </label>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="ed-field">
      <span>{label}</span>
      <input className="ed-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function WingExtraPrices({ cat }: { cat: EditableCategory }) {
  const patchItem = useMenuStore((s) => s.patchItem);
  const wing = cat.items.find((it) => /wing/i.test(it.name));
  if (!wing) return null;
  const wingId = wing.id;
  const conds = wing.condiments ?? [];

  function unit(which: "ranch" | "blue") {
    const hit = conds.find((c) =>
      which === "ranch" ? /extra ranch/i.test(c.name) || c.id === "wing-extra-ranch" : /extra blue/i.test(c.name) || c.id === "wing-extra-blue",
    );
    return hit?.price ?? "1.50";
  }

  function setUnit(which: "ranch" | "blue", price: string) {
    const id = which === "ranch" ? "wing-extra-ranch" : "wing-extra-blue";
    const name = which === "ranch" ? "Extra Ranch" : "Extra Blue cheese";
    const next = [...conds];
    const i = next.findIndex((c) => c.id === id || (which === "ranch" ? /extra ranch/i.test(c.name) : /extra blue/i.test(c.name)));
    const row = {
      id,
      name,
      price,
      extraPrice: price,
      maxQty: "6",
    };
    if (i >= 0) next[i] = { ...next[i], ...row };
    else next.push(row);
    patchItem(cat.id, wingId, { condiments: next });
  }

  return (
    <div className="ed-field">
      <span>Extra dips (per 2 cups)</span>
      <p className="ed-sub">Guest wing builder uses these live prices. Included Ranch / Blue cheese / None stay free.</p>
      <div className="two-col">
        <label className="ed-field">
          <span>Extra Ranch</span>
          <input
            className="ed-input ed-price"
            inputMode="decimal"
            value={unit("ranch")}
            onChange={(e) => setUnit("ranch", e.target.value)}
          />
        </label>
        <label className="ed-field">
          <span>Extra Blue cheese</span>
          <input
            className="ed-input ed-price"
            inputMode="decimal"
            value={unit("blue")}
            onChange={(e) => setUnit("blue", e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

function CategoryCard({
  cat,
  open,
  onToggle,
  isFirst,
  isLast,
  allCats,
  querying,
}: {
  cat: EditableCategory;
  open: boolean;
  onToggle: () => void;
  isFirst: boolean;
  isLast: boolean;
  allCats: EditableCategory[];
  querying: boolean;
}) {
  const patchCategory = useMenuStore((s) => s.patchCategory);
  const setKind = useMenuStore((s) => s.setKind);
  const addItem = useMenuStore((s) => s.addItem);
  const deleteCategory = useMenuStore((s) => s.deleteCategory);
  const moveCategory = useMenuStore((s) => s.moveCategory);
  const [confirmDel, setConfirmDel] = useState(false);
  const Icon = iconFor(cat.icon ?? cat.id);

  return (
    <section className="ed-cat" data-open={open ? "true" : "false"}>
      <div className="ed-cat-bar">
        <button type="button" className="ed-cat-toggle" aria-expanded={open} onClick={onToggle}>
          <span className="ed-cat-ico" aria-hidden>
            <Icon strokeWidth={2.2} />
          </span>
          <span className="ed-cat-name">{cat.name || "Untitled section"}</span>
          <span className="ed-cat-count">{cat.items.length}</span>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {!querying ? (
          <div className="ed-icon-btns">
            <IconBtn label="Move section up" disabled={isFirst} onClick={() => moveCategory(cat.id, -1)}>
              <ChevronUp size={15} />
            </IconBtn>
            <IconBtn label="Move section down" disabled={isLast} onClick={() => moveCategory(cat.id, 1)}>
              <ChevronDown size={15} />
            </IconBtn>
          </div>
        ) : null}
      </div>
      {open ? (
        <div className="ed-cat-body">
          <Field label="Section name" value={cat.name} onChange={(v) => patchCategory(cat.id, { name: v })} />
          <Field
            label="Section description"
            value={cat.note ?? ""}
            onChange={(v) => patchCategory(cat.id, { note: v })}
          />
          {cat.id === "wings" || cat.items.some((it) => /wing/i.test(it.name)) ? <WingExtraPrices cat={cat} /> : null}
          <label className="ed-field">
            <span>Icon</span>
            <select
              className="ed-input"
              value={cat.icon ?? cat.id}
              onChange={(e) => patchCategory(cat.id, { icon: e.target.value })}
            >
              {ICON_CHOICES.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <div className="ed-field">
            <span>Price layout</span>
            <div className="seg ed-kind" role="group" aria-label="Price layout">
              {KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  data-on={cat.kind === k.id}
                  onClick={() => setKind(cat.id, k.id)}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ed-items">
            {cat.items.map((item, i) => (
              <ItemCard
                key={item.id}
                cat={cat}
                item={item}
                isFirst={i === 0}
                isLast={i === cat.items.length - 1}
                allCats={allCats}
              />
            ))}
            {cat.items.length === 0 ? <p className="ed-empty">No items in this section yet.</p> : null}
          </div>
          <div className="ed-cat-actions">
            <button type="button" className="ed-btn" onClick={() => addItem(cat.id)}>
              <Plus size={15} strokeWidth={2.2} />
              Add item
            </button>
            {confirmDel ? (
              <button
                type="button"
                className="ed-btn ed-btn-danger"
                onClick={() => deleteCategory(cat.id)}
              >
                Confirm delete section
              </button>
            ) : (
              <button type="button" className="ed-btn ed-btn-quiet" onClick={() => setConfirmDel(true)}>
                <Trash2 size={15} />
                Delete section
              </button>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ItemCard({
  cat,
  item,
  isFirst,
  isLast,
  allCats,
}: {
  cat: EditableCategory;
  item: EditableItem;
  isFirst: boolean;
  isLast: boolean;
  allCats: EditableCategory[];
}) {
  const patchItem = useMenuStore((s) => s.patchItem);
  const setPrices = useMenuStore((s) => s.setPrices);
  const deleteItem = useMenuStore((s) => s.deleteItem);
  const duplicateItem = useMenuStore((s) => s.duplicateItem);
  const moveItem = useMenuStore((s) => s.moveItem);
  const moveItemTo = useMenuStore((s) => s.moveItemTo);
  const [confirmDel, setConfirmDel] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState("");

  return (
    <article className="ed-item" data-fav={item.highlight ? "true" : undefined}>
      <label className="ed-field">
        <span>Item</span>
        <input
          className="ed-input"
          value={item.name}
          onChange={(e) => patchItem(cat.id, item.id, { name: e.target.value })}
        />
      </label>
      <label className="ed-field">
        <span>Description</span>
        <input
          className="ed-input"
          value={item.description ?? ""}
          onChange={(e) => patchItem(cat.id, item.id, { description: e.target.value })}
        />
      </label>
      <div className="ed-field">
        <span>Photo</span>
        <label className="toggle-row">
          <input
            className="toggle"
            type="checkbox"
            role="switch"
            checked={!item.hideImage}
            aria-checked={!item.hideImage}
            onChange={(e) => patchItem(cat.id, item.id, { hideImage: !e.target.checked })}
          />
          <span>
            Show photo
            <em>Off shrinks the card to name, description, and price.</em>
          </span>
        </label>
        <img
          className="ed-item-photo"
          src={itemPhoto(item, cat.id)}
          alt=""
          data-off={item.hideImage ? "true" : undefined}
        />
        <label className="ed-btn ed-btn-quiet ed-photo-pick">
          <ImagePlus size={14} strokeWidth={2.2} />
          {item.image ? "Replace photo" : "Upload photo"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={photoBusy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setPhotoBusy(true);
              setPhotoErr("");
              void fileToDataImage(file, { maxEdge: 1600, maxChars: 350000, quality: 0.92 })
                .then((url) => {
                  patchItem(cat.id, item.id, { image: url });
                })
                .catch((err) => {
                  setPhotoErr(err instanceof Error ? err.message : "Could not read that photo");
                })
                .finally(() => setPhotoBusy(false));
            }}
          />
        </label>
        {item.image ? (
          <button type="button" className="ed-btn ed-btn-quiet" onClick={() => patchItem(cat.id, item.id, { image: "" })}>
            Remove photo
          </button>
        ) : null}
        {photoBusy ? <p className="ed-empty">Compressing photo…</p> : null}
        {photoErr ? <p className="form-error">{photoErr}</p> : null}
      </div>
      <PriceFields kind={cat.kind} prices={item.prices} onChange={(prices) => setPrices(cat.id, item.id, prices)} />
      <CondimentFields
        condiments={item.condiments ?? []}
        onChange={(condiments) => patchItem(cat.id, item.id, { condiments })}
      />
      <div className="ed-item-tools">
        <button
          type="button"
          className="ed-star"
          data-on={item.highlight ? "true" : undefined}
          aria-pressed={Boolean(item.highlight)}
          onClick={() => patchItem(cat.id, item.id, { highlight: !item.highlight })}
        >
          <Star size={14} strokeWidth={2.2} fill={item.highlight ? "currentColor" : "none"} />
          House favorite
        </button>
        <div className="ed-icon-btns">
          <IconBtn label="Move up" disabled={isFirst} onClick={() => moveItem(cat.id, item.id, -1)}>
            <ChevronUp size={15} />
          </IconBtn>
          <IconBtn label="Move down" disabled={isLast} onClick={() => moveItem(cat.id, item.id, 1)}>
            <ChevronDown size={15} />
          </IconBtn>
          <IconBtn label="Duplicate" onClick={() => duplicateItem(cat.id, item.id)}>
            <Copy size={14} />
          </IconBtn>
          {confirmDel ? (
            <button type="button" className="ed-icon-btn ed-btn-danger" onClick={() => deleteItem(cat.id, item.id)}>
              Delete
            </button>
          ) : (
            <IconBtn label="Delete item" onClick={() => setConfirmDel(true)}>
              <Trash2 size={14} />
            </IconBtn>
          )}
        </div>
      </div>
      {allCats.length > 1 ? (
        <label className="ed-field ed-move">
          <span>Move to</span>
          <select
            className="ed-input"
            value={cat.id}
            onChange={(e) => {
              if (e.target.value !== cat.id) moveItemTo(cat.id, item.id, e.target.value);
            }}
          >
            {allCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || "Untitled section"}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </article>
  );
}

function CondimentFields({
  condiments,
  onChange,
}: {
  condiments: ItemCondiment[];
  onChange: (next: ItemCondiment[]) => void;
}) {
  const rows = condiments;

  function patch(i: number, patch: Partial<ItemCondiment>) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div className="ed-field">
      <span>Condiments & extras</span>
      <p className="ed-empty">Guests can add these in the confirm popup. Qty is the most they can add. Extra is the price after the first.</p>
      <div className="ed-condiments">
        {rows.map((c, i) => {
          const cap = condimentMax(c.maxQty);
          return (
          <div className="ed-condiment-row" key={c.id || i}>
            <label className="ed-field">
              <span>Name</span>
              <input className="ed-input" value={c.name} onChange={(e) => patch(i, { name: e.target.value })} />
            </label>
            <div className="ed-field">
              <span>Qty</span>
              <span className="qty-step">
                <button
                  type="button"
                  aria-label={`Fewer ${c.name || "condiment"}`}
                  disabled={cap <= 1}
                  onClick={() => patch(i, { maxQty: String(Math.max(1, cap - 1)) })}
                >
                  <Minus size={14} />
                </button>
                <input
                  className="ed-input ed-qty"
                  inputMode="numeric"
                  aria-label={`${c.name || "Condiment"} quantity cap`}
                  value={c.maxQty ?? String(cap)}
                  onChange={(e) => {
                    const n = Math.max(1, Math.min(9, Math.round(Number(e.target.value.replace(/[^\d]/g, "")) || 1)));
                    patch(i, { maxQty: String(n) });
                  }}
                />
                <button
                  type="button"
                  aria-label={`More ${c.name || "condiment"}`}
                  disabled={cap >= 9}
                  onClick={() => patch(i, { maxQty: String(Math.min(9, cap + 1)) })}
                >
                  <Plus size={14} />
                </button>
              </span>
            </div>
            <label className="ed-field">
              <span>Add $</span>
              <input
                className="ed-input ed-price"
                inputMode="decimal"
                value={c.price}
                onChange={(e) => patch(i, { price: e.target.value })}
              />
            </label>
            <label className="ed-field">
              <span>Extra $</span>
              <input
                className="ed-input ed-price"
                inputMode="decimal"
                value={c.extraPrice}
                onChange={(e) => patch(i, { extraPrice: e.target.value })}
              />
            </label>
            <IconBtn label="Remove condiment" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}>
              <Trash2 size={14} />
            </IconBtn>
          </div>
          );
        })}
      </div>
      <button
        type="button"
        className="ed-btn ed-btn-quiet"
        onClick={() =>
          onChange([
            ...rows,
            {
              id: `cond-${Math.random().toString(36).slice(2, 8)}`,
              name: "",
              price: "0.75",
              extraPrice: "0.75",
              maxQty: "9",
            },
          ])
        }
      >
        <Plus size={14} strokeWidth={2.2} />
        Add condiment
      </button>
    </div>
  );
}

function PriceFields({
  kind,
  prices,
  onChange,
}: {
  kind: CategoryKind;
  prices: PriceCol[];
  onChange: (prices: PriceCol[]) => void;
}) {
  if (kind === "pizza") {
    const rows = prices.length ? prices : [{ label: "SM", inches: '12"', price: "" }];
    return (
      <div className="ed-prices" data-kind="pizza">
        <p className="ed-sub">
          Type a price to offer that size. Leave it blank to hide it. Add XL or any custom size here — no extra toggle.
        </p>
        {rows.map((p, i) => (
          <div className="ed-price-row" key={i}>
            <label className="ed-field">
              <span>Size</span>
              <input
                className="ed-input"
                value={p.label ?? ""}
                onChange={(e) => {
                  const next = rows.map((r, idx) => (idx === i ? { ...r, label: e.target.value } : r));
                  onChange(next);
                }}
                placeholder="SM"
              />
            </label>
            <label className="ed-field">
              <span>Inches</span>
              <input
                className="ed-input"
                value={p.inches ?? ""}
                onChange={(e) => {
                  const next = rows.map((r, idx) => (idx === i ? { ...r, inches: e.target.value } : r));
                  onChange(next);
                }}
                placeholder={'12"'}
              />
            </label>
            <label className="ed-field">
              <span>Price</span>
              <input
                className="ed-input ed-price"
                inputMode="decimal"
                value={p.price}
                onChange={(e) => {
                  const next = rows.map((r, idx) => (idx === i ? { ...r, price: e.target.value } : r));
                  onChange(next);
                }}
                placeholder="0.00"
              />
            </label>
            <IconBtn
              label="Remove size"
              disabled={rows.length <= 1}
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            >
              <Trash2 size={14} />
            </IconBtn>
          </div>
        ))}
        <button
          type="button"
          className="ed-btn ed-btn-quiet"
          onClick={() => {
            const hasXl = rows.some((r) => (r.label ?? "").toUpperCase() === "XL");
            onChange([
              ...rows,
              hasXl
                ? { label: "", inches: "", price: "" }
                : { label: "XL", inches: '18"', price: "" },
            ]);
          }}
        >
          <Plus size={14} />
          Add size
        </button>
      </div>
    );
  }

  const rows = prices.length ? prices : [{ price: "" }];
  return (
    <div className="ed-prices" data-kind={kind}>
      {rows.map((p, i) => (
        <div className="ed-price-row" key={i}>
          {kind === "split" || p.label ? (
            <label className="ed-field">
              <span>Label</span>
              <input
                className="ed-input"
                value={p.label ?? ""}
                onChange={(e) => {
                  const next = rows.map((r, idx) => (idx === i ? { ...r, label: e.target.value } : r));
                  onChange(next);
                }}
              />
            </label>
          ) : null}
          <label className="ed-field">
            <span>Price</span>
            <input
              className="ed-input ed-price"
              inputMode="decimal"
              value={p.price}
              onChange={(e) => {
                const next = rows.map((r, idx) => (idx === i ? { ...r, price: e.target.value } : r));
                onChange(next);
              }}
            />
          </label>
          {kind === "split" ? (
            <IconBtn
              label="Remove price"
              disabled={rows.length <= 1}
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            >
              <Trash2 size={14} />
            </IconBtn>
          ) : null}
        </div>
      ))}
      {kind === "split" ? (
        <button
          type="button"
          className="ed-btn ed-btn-quiet"
          onClick={() => onChange([...rows, { label: "", price: "" }])}
        >
          <Plus size={14} />
          Add size
        </button>
      ) : null}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button type="button" className="ed-icon-btn" aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
