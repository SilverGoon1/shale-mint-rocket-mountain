import { useId, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { CookNoteField, cookNoteValue } from "@/components/cook-note-field";
import { itemPhoto } from "@/data/item-photos";
import type { MenuItem } from "@/data/menu";
import {
  condimentCharge,
  condimentDetail,
  condimentMax,
  condimentTotal,
  mergeItemDetail,
  type CondimentPick,
} from "@/lib/condiments";
import {
  PIZZA_TOPPINGS,
  type PizzaToppingPick,
  type ToppingSide,
  colPrice,
  pricePizzaBuild,
  toppingCharge,
  toppingUnit,
} from "@/lib/pizza";
import { formatUsd, moneyNumber, type ShopSettingsPublic } from "@/lib/shop-types";
import { useDialogLock } from "@/lib/dialog-lock";

export type PizzaCustomizeResult = {
  size: string;
  unitPrice: number;
  name: string;
  detail: string;
  comment?: string;
  toppings: PizzaToppingPick[];
  condiments: CondimentPick[];
};

export function PizzaCustomize({
  item,
  categoryId,
  settings,
  initialSize,
  onClose,
  onConfirm,
}: {
  item: MenuItem;
  categoryId?: string;
  settings: ShopSettingsPublic;
  initialSize: string;
  onClose: () => void;
  onConfirm: (result: PizzaCustomizeResult) => void;
}) {
  const titleId = useId();
  const noteId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const first = item.prices[0];
  const [size, setSize] = useState(initialSize || first?.label || "LG");
  const [picks, setPicks] = useState<Record<string, ToppingSide | "off">>({});
  const [condQty, setCondQty] = useState<Record<string, number>>({});
  const condiments = item.condiments ?? [];
  const photo = item.hideImage ? "" : itemPhoto(item, categoryId);
  useDialogLock(onClose, panelRef);

  const toppings: PizzaToppingPick[] = Object.entries(picks)
    .filter(([, side]) => side && side !== "off")
    .map(([id, side]) => ({ id, side: side as ToppingSide }));

  const priced = pricePizzaBuild({
    item,
    other: null,
    size,
    toppings,
    settings,
  });
  const condPicks: CondimentPick[] = condiments
    .map((c) => {
      const n = condQty[c.id] ?? 0;
      if (n <= 0) return null;
      return { id: c.id, name: c.name, qty: n, charge: condimentCharge(c, n) };
    })
    .filter((p): p is CondimentPick => Boolean(p));
  const extras = condimentTotal(condPicks);
  const unitPrice = Math.round((priced.unitPrice + extras) * 100) / 100;
  const extraDetail = mergeItemDetail(priced.detail, condimentDetail(condPicks));

  const chosen = item.prices.find((p) => p.label === size) ?? first;
  const toppingEach = toppingUnit(size, settings);

  function setTopping(id: string, side: ToppingSide | "off") {
    setPicks((cur) => ({ ...cur, [id]: side }));
  }

  function toggleTopping(id: string) {
    setPicks((cur) => {
      const side = cur[id] ?? "off";
      return { ...cur, [id]: side === "off" ? "whole" : "off" };
    });
  }

  function confirm() {
    const note = cookNoteValue(noteRef);
    onConfirm({
      size: chosen?.label || size,
      unitPrice,
      name: priced.name,
      detail: extraDetail,
      toppings,
      comment: note || undefined,
      condiments: condPicks,
    });
  }

  return (
    <div className="pizza-modal-root" role="presentation">
      <button type="button" className="pizza-modal-scrim" aria-label="Close" onClick={onClose} />
      <div
        ref={panelRef}
        className="pizza-modal pizza-build"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="pizza-modal-head pizza-item-head">
          {photo ? <img className="pizza-item-thumb" src={photo} alt="" decoding="async" /> : null}
          <div className="pizza-item-copy">
            <p className="shop-brand-kicker">Customize your pizza</p>
            <h2 id={titleId}>{item.name}</h2>
            {item.description ? <p className="pizza-item-desc">{item.description}</p> : null}
          </div>
          <button type="button" className="ed-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={16} strokeWidth={2.2} />
          </button>
        </header>

        <fieldset className="pizza-modal-block pizza-block-tight">
          <legend>Size</legend>
          <div className="size-pick pizza-size-pick" role="group" aria-label="Pizza size">
            {item.prices.map((p) => {
              const lab = p.label || "Regular";
              return (
                <button key={lab} type="button" data-on={size === lab} onClick={() => setSize(lab)}>
                  {lab}
                  {p.inches ? <em>{p.inches}</em> : null}
                  <span>{formatUsd(colPrice(p))}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="pizza-modal-block pizza-block-tight">
          <legend>Extra toppings</legend>
          <p className="ed-sub topping-hint">
            Tap to add. {formatUsd(toppingEach)} whole · {formatUsd(toppingCharge(size, "left", settings))} half.
          </p>
          <div className="topping-grid">
            {PIZZA_TOPPINGS.map((t) => {
              const side = picks[t.id] ?? "off";
              const on = side !== "off";
              return (
                <div key={t.id} className="topping-chip" data-on={on || undefined}>
                  <button
                    type="button"
                    className="topping-chip-main"
                    aria-pressed={on}
                    onClick={() => toggleTopping(t.id)}
                  >
                    {t.name}
                  </button>
                  {on ? (
                    <div className="topping-half" role="group" aria-label={`${t.name} side`}>
                      {(["left", "whole", "right"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          data-on={side === opt}
                          onClick={() => setTopping(t.id, opt)}
                        >
                          {opt === "whole" ? "Whole" : opt === "left" ? "L" : "R"}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>

        {condiments.length ? (
          <fieldset className="pizza-modal-block pizza-block-tight">
            <legend>Condiments & extras</legend>
            <ul className="condiment-list">
              {condiments.map((c) => {
                const cap = condimentMax(c.maxQty);
                const n = condQty[c.id] ?? 0;
                return (
                  <li key={c.id}>
                    <span>
                      <strong>{c.name}</strong>
                      <em>
                        {moneyNumber(c.price) > 0 ? `${formatUsd(moneyNumber(c.price))} to add` : "Included"}
                        {moneyNumber(c.extraPrice || c.price) > 0
                          ? ` · extra ${formatUsd(moneyNumber(c.extraPrice || c.price))}`
                          : ""}
                        {` · up to ${cap}`}
                      </em>
                    </span>
                    <span className="qty-step">
                      <button
                        type="button"
                        aria-label={`Fewer ${c.name}`}
                        disabled={n <= 0}
                        onClick={() => setCondQty((cur) => ({ ...cur, [c.id]: Math.max(0, n - 1) }))}
                      >
                        <Minus size={14} />
                      </button>
                      <strong>{n}</strong>
                      <button
                        type="button"
                        aria-label={`More ${c.name}`}
                        disabled={n >= cap}
                        onClick={() => setCondQty((cur) => ({ ...cur, [c.id]: Math.min(cap, n + 1) }))}
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

        <CookNoteField key={item.id || item.name} id={noteId} noteRef={noteRef} placeholder="e.g. well done, light sauce, cut in squares" />

        <footer className="pizza-modal-foot">
          <div className="pizza-modal-total">
            <span>This pie</span>
            <strong>{formatUsd(unitPrice)}</strong>
          </div>
          {extraDetail ? <p className="ed-sub">{extraDetail}</p> : null}
          <div className="pizza-modal-actions">
            <button type="button" className="ed-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-print" onClick={confirm}>
              Add to bag
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
