import { useId, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { CookNoteField, cookNoteValue } from "@/components/cook-note-field";
import { itemPhoto } from "@/data/item-photos";
import type { MenuItem } from "@/data/menu";
import { useDialogLock } from "@/lib/dialog-lock";
import { formatUsd } from "@/lib/shop-types";
import {
  WING_EXTRA_MAX,
  WING_EXTRA_STEP,
  WING_INCLUDED_DIPS,
  WING_QTY_MAX,
  WING_QTY_MIN,
  WING_QTY_STEP,
  WING_SAUCES,
  type WingIncludedDip,
  type WingSauce,
  extraDipCharge,
  extraDipUnitPrice,
  snapExtraCups,
  snapWingQty,
  wingBuildPicks,
  wingBuildReady,
  wingQtyMultiplier,
} from "@/lib/wings";
import type { CondimentPick } from "@/lib/condiments";

export type WingsCustomizeResult = {
  size?: string;
  unitPrice: number;
  detail: string;
  comment?: string;
  condiments: CondimentPick[];
};

function priceNum(p: string) {
  const n = Number(String(p).replace(/^\$/, ""));
  return Number.isFinite(n) ? n : 0;
}

export function WingsCustomize({
  item,
  categoryId,
  onClose,
  onConfirm,
}: {
  item: MenuItem;
  categoryId?: string;
  onClose: () => void;
  onConfirm: (result: WingsCustomizeResult) => void;
}) {
  const titleId = useId();
  const noteId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const sizes = item.prices.filter((p) => p.price);
  const [size, setSize] = useState(sizes[0]?.label || "");
  const [pieceQty, setPieceQty] = useState(WING_QTY_MIN);
  const [sauce, setSauce] = useState<WingSauce | "">("");
  const [dip, setDip] = useState<WingIncludedDip | "">("");
  const [extraRanch, setExtraRanch] = useState(0);
  const [extraBlue, setExtraBlue] = useState(0);
  const photo = item.hideImage ? "" : itemPhoto(item, categoryId);
  useDialogLock(onClose, panelRef);

  const chosen = sizes.find((p) => p.label === size) ?? sizes[0];
  const ranchUnit = extraDipUnitPrice(item.condiments, "ranch");
  const blueUnit = extraDipUnitPrice(item.condiments, "blue");
  const extras = extraDipCharge(extraRanch, ranchUnit) + extraDipCharge(extraBlue, blueUnit);
  const unitPrice = Math.round((priceNum(chosen?.price ?? "0") * wingQtyMultiplier(pieceQty) + extras) * 100) / 100;
  const ready = wingBuildReady(sauce, dip);
  const preview = ready
    ? wingBuildPicks({
        sauce: sauce as WingSauce,
        dip: dip as WingIncludedDip,
        extraRanch,
        extraBlue,
        ranchUnit,
        blueUnit,
      })
    : null;

  function bumpExtra(which: "ranch" | "blue", dir: -1 | 1) {
    const cur = which === "ranch" ? extraRanch : extraBlue;
    const next = snapExtraCups(cur + dir * WING_EXTRA_STEP);
    if (which === "ranch") setExtraRanch(next);
    else setExtraBlue(next);
  }

  function confirm() {
    if (!preview) return;
    const note = cookNoteValue(noteRef);
    onConfirm({
      size: `${pieceQty} pc`,
      unitPrice,
      detail: preview.detail,
      comment: note || undefined,
      condiments: preview.condiments,
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
            <p className="shop-brand-kicker">Make it yours</p>
            <h2 id={titleId}>{item.name}</h2>
            {item.description ? <p className="pizza-item-desc">{item.description}</p> : null}
          </div>
          <button type="button" className="ed-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={16} strokeWidth={2.2} />
          </button>
        </header>

        {sizes.length > 1 ? (
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

        <fieldset className="pizza-modal-block pizza-block-tight">
          <legend>Pieces</legend>
          <p className="ed-sub">Sold in tens. Minimum {WING_QTY_MIN}.</p>
          <ul className="condiment-list">
            <li>
              <span>
                <strong>{pieceQty} pc</strong>
                <em>
                  {formatUsd(priceNum(chosen?.price ?? "0"))} per {WING_QTY_MIN}
                </em>
              </span>
              <span className="qty-step">
                <button
                  type="button"
                  aria-label="Fewer wings"
                  disabled={pieceQty <= WING_QTY_MIN}
                  onClick={() => setPieceQty((n) => snapWingQty(n - WING_QTY_STEP))}
                >
                  <Minus size={14} />
                </button>
                <strong>{pieceQty}</strong>
                <button
                  type="button"
                  aria-label="More wings"
                  disabled={pieceQty >= WING_QTY_MAX}
                  onClick={() => setPieceQty((n) => snapWingQty(n + WING_QTY_STEP))}
                >
                  <Plus size={14} />
                </button>
              </span>
            </li>
          </ul>
        </fieldset>

        <fieldset className="pizza-modal-block">
          <legend>Sauce</legend>
          <p className="ed-sub">Required. Pick one.</p>
          <div className="size-pick pizza-size-pick" role="radiogroup" aria-label="Wing sauce">
            {WING_SAUCES.map((s) => (
              <button key={s} type="button" data-on={sauce === s} onClick={() => setSauce(s)}>
                {s}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="pizza-modal-block">
          <legend>Included dips</legend>
          <p className="ed-sub">Required. Two cups, or none.</p>
          <div className="size-pick pizza-size-pick" role="radiogroup" aria-label="Included dips">
            {WING_INCLUDED_DIPS.map((d) => (
              <button key={d.id} type="button" data-on={dip === d.id} onClick={() => setDip(d.id)}>
                {d.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="pizza-modal-block pizza-block-tight">
          <legend>Extra dips</legend>
          <p className="ed-sub">Optional. Sold in sets of {WING_EXTRA_STEP}.</p>
          <ul className="condiment-list">
            {(
              [
                ["ranch", "Extra Ranch", extraRanch, ranchUnit],
                ["blue", "Extra Blue cheese", extraBlue, blueUnit],
              ] as const
            ).map(([id, label, n, unit]) => (
              <li key={id}>
                <span>
                  <strong>{label}</strong>
                  <em>
                    {formatUsd(unit)} per {WING_EXTRA_STEP} cups · up to {WING_EXTRA_MAX}
                  </em>
                </span>
                <span className="qty-step">
                  <button
                    type="button"
                    aria-label={`Fewer ${label}`}
                    disabled={n <= 0}
                    onClick={() => bumpExtra(id, -1)}
                  >
                    <Minus size={14} />
                  </button>
                  <strong>{n}</strong>
                  <button
                    type="button"
                    aria-label={`More ${label}`}
                    disabled={n >= WING_EXTRA_MAX}
                    onClick={() => bumpExtra(id, 1)}
                  >
                    <Plus size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </fieldset>

        <CookNoteField key={item.id || item.name} id={noteId} noteRef={noteRef} placeholder="e.g. extra crispy, sauce on the side" />

        <footer className="pizza-modal-foot">
          <div className="pizza-modal-total">
            <span>This order</span>
            <strong>{formatUsd(unitPrice)}</strong>
          </div>
          {preview ? <p className="ed-sub">{preview.detail}</p> : <p className="ed-sub">Pick a sauce and included dips to add this to your bag.</p>}
          <div className="pizza-modal-actions">
            <button type="button" className="ed-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-print" disabled={!ready} onClick={confirm}>
              Add to bag
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
