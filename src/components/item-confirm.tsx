import { useId, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { MenuItem } from "@/data/menu";
import { CookNoteField, cookNoteValue } from "@/components/cook-note-field";
import { CustomizeFooter } from "@/components/customize-chrome";
import {
  condimentCharge,
  condimentDetail,
  condimentMax,
  condimentTotal,
  mergeItemDetail,
  type CondimentPick,
} from "@/lib/condiments";
import { useDialogLock } from "@/lib/dialog-lock";
import { formatUsd } from "@/lib/shop-types";
import { WING_QTY_MIN, parseWingQty, snapWingQty } from "@/lib/wings";
import {
  GROUP_PASTA,
  PASTA_BREAD,
  PASTA_SHAPES,
  hasGroup,
  isPastaPlatter,
  pastaBreadPick,
  pastaDressingPick,
  pastaShapePick,
  type PastaBread,
  type PastaShape,
} from "@/lib/modifiers";
import { SALAD_DRESSINGS, type SaladDressing } from "@/lib/salads";

export type ItemConfirmResult = {
  size?: string;
  unitPrice: number;
  detail?: string;
  comment?: string;
  condiments: CondimentPick[];
  /** Cart-line qty (default 1). Wings piece count stays in `size`; wings pass qty 1. */
  qty?: number;
};

function priceNum(p: string) {
  const n = Number(String(p).replace(/^\$/, ""));
  return Number.isFinite(n) ? n : 0;
}

export function ItemConfirm({
  item,
  categoryName,
  categoryId,
  onClose,
  onConfirm,
}: {
  item: MenuItem;
  categoryName: string;
  categoryId?: string;
  onClose: () => void;
  onConfirm: (result: ItemConfirmResult) => void;
}) {
  const titleId = useId();
  const noteId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const sizes = item.prices.filter((p) => p.price);
  const [size, setSize] = useState(sizes[0]?.label || "");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [pastaShape, setPastaShape] = useState<PastaShape | "">("");
  const [dressing, setDressing] = useState<SaladDressing | "">("");
  const [bread, setBread] = useState<PastaBread>("keep");
  const cat = { id: categoryId || "" };
  const isWings = categoryId === "wings" || /wing/i.test(item.name) || /wing/i.test(categoryName);
  const pasta = hasGroup(cat, item, GROUP_PASTA);
  const platter = isPastaPlatter(cat, item);
  const pack = parseWingQty(sizes[0]?.label) || WING_QTY_MIN;
  const [pieceQty, setPieceQty] = useState(pack);
  const [cartQty, setCartQty] = useState(1);
  const condiments = item.condiments ?? [];
  useDialogLock(onClose, panelRef);

  const chosen = sizes.find((p) => p.label === size) ?? sizes[0];
  const picks: CondimentPick[] = condiments
    .map((c) => {
      const n = qty[c.id] ?? 0;
      if (n <= 0) return null;
      return { id: c.id, name: c.name, qty: n, charge: condimentCharge(c, n) };
    })
    .filter((p): p is CondimentPick => Boolean(p));
  const extras = condimentTotal(picks);
  const pastaPick = pasta && pastaShape ? pastaShapePick(pastaShape) : null;
  const dressingPick = platter && dressing ? pastaDressingPick(dressing) : null;
  const breadPick = platter ? pastaBreadPick(bread) : null;
  const allPicks = [pastaPick, dressingPick, breadPick, ...picks].filter((p): p is CondimentPick => Boolean(p));
  const base = priceNum(chosen?.price ?? "0");
  const bags = pieceQty / Math.max(pack, 1);
  const unitPrice = isWings
    ? Math.round((base * bags + extras) * 100) / 100
    : Math.round((base + extras) * 100) / 100;
  const detail = mergeItemDetail(
    pastaShape,
    dressing,
    platter ? (bread === "none" ? "No bread" : "Keep bread") : "",
    condimentDetail(picks),
  );
  const ready = (!pasta || Boolean(pastaShape)) && (!platter || Boolean(dressing));
  const helper = pasta && !pastaShape
    ? "Pick Penne or Spaghetti to add this to your bag."
    : platter && !dressing
      ? "Pick a salad dressing to add this to your bag."
      : undefined;

  function confirm() {
    if (!ready) return;
    const note = cookNoteValue(noteRef);
    if (isWings) {
      onConfirm({
        size: `${pieceQty} pc`,
        unitPrice,
        detail: detail || undefined,
        comment: note || undefined,
        condiments: allPicks,
        qty: 1,
      });
      return;
    }
    onConfirm({
      size: chosen?.label || size || undefined,
      unitPrice,
      detail: detail || undefined,
      comment: note || undefined,
      condiments: allPicks,
      qty: cartQty,
    });
  }

  return (
    <div className="pizza-modal-root" role="presentation">
      <button type="button" className="pizza-modal-scrim" aria-label="Close" onClick={onClose} />
      <div
        ref={panelRef}
        className="pizza-modal size-add-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="pizza-modal-head">
          <div>
            <p className="shop-brand-kicker">{categoryName}</p>
            <h2 id={titleId}>{item.name}</h2>
          </div>
          <button type="button" className="ed-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={16} strokeWidth={2.2} />
          </button>
        </header>

        <div className="pizza-modal-body">
          {isWings ? (
            <fieldset className="pizza-modal-block">
              <legend>Quantity</legend>
              <span className="qty-step wings-qty-step">
                <button
                  type="button"
                  aria-label="Fewer wings"
                  disabled={pieceQty <= pack}
                  onClick={() => setPieceQty((n) => snapWingQty(n - pack))}
                >
                  <Minus size={14} />
                </button>
                <strong aria-live="polite">{pieceQty}</strong>
                <button
                  type="button"
                  aria-label="More wings"
                  onClick={() => setPieceQty((n) => snapWingQty(n + pack))}
                >
                  <Plus size={14} />
                </button>
              </span>
            </fieldset>
          ) : sizes.length > 1 ? (
            <fieldset className="pizza-modal-block">
              <legend>Size</legend>
              <div className="size-pick pizza-size-pick" role="group" aria-label="Size">
                {sizes.map((p) => {
                  const lab = p.label || "Regular";
                  return (
                    <button key={lab} type="button" data-on={(chosen?.label || "") === lab} onClick={() => setSize(lab)}>
                      {lab}
                      <span>{formatUsd(priceNum(p.price))}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {pasta ? (
            <fieldset className="pizza-modal-block">
              <legend>Pasta shape</legend>
              <div className="size-pick pizza-size-pick" role="radiogroup" aria-label="Pasta shape">
                {PASTA_SHAPES.map((s) => (
                  <button key={s} type="button" data-on={pastaShape === s} onClick={() => setPastaShape(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {platter ? (
            <>
              <fieldset className="pizza-modal-block">
                <legend>Salad dressing</legend>
                <div className="size-pick pizza-size-pick" role="radiogroup" aria-label="Salad dressing">
                  {SALAD_DRESSINGS.map((d) => (
                    <button key={d} type="button" data-on={dressing === d} onClick={() => setDressing(d)}>
                      {d}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="pizza-modal-block">
                <legend>Bread</legend>
                <div className="size-pick pizza-size-pick" role="radiogroup" aria-label="Bread">
                  {PASTA_BREAD.map((b) => (
                    <button key={b.id} type="button" data-on={bread === b.id} onClick={() => setBread(b.id)}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          ) : null}

          {condiments.length ? (
            <fieldset className="pizza-modal-block">
              <legend>Condiments & extras</legend>
              <ul className="condiment-list">
                {condiments.map((c) => {
                  const cap = condimentMax(c.maxQty);
                  const n = qty[c.id] ?? 0;
                  const step = /ranch|blue\s*cheese|dip/i.test(c.name) && isWings ? 2 : 1;
                  const nextDown = Math.max(0, n - step);
                  const nextUp = Math.min(cap, n + step);
                  return (
                    <li key={c.id}>
                      <span>
                        <strong>{c.name}</strong>
                      </span>
                      <span className="qty-step">
                        <button
                          type="button"
                          aria-label={`Fewer ${c.name}`}
                          disabled={n <= 0}
                          onClick={() => setQty((cur) => ({ ...cur, [c.id]: nextDown }))}
                        >
                          <Minus size={14} />
                        </button>
                        <strong>{n}</strong>
                        <button
                          type="button"
                          aria-label={`More ${c.name}`}
                          disabled={n >= cap}
                          onClick={() => setQty((cur) => ({ ...cur, [c.id]: nextUp }))}
                        >
                          <Plus size={14} />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ) : null}

          <CookNoteField key={item.id || item.name} id={noteId} noteRef={noteRef} />
        </div>

        <CustomizeFooter
          total={unitPrice}
          ready={ready}
          helper={helper}
          onClose={onClose}
          onConfirm={confirm}
          qty={isWings ? undefined : cartQty}
          onQtyChange={isWings ? undefined : setCartQty}
        />
      </div>
    </div>
  );
}
