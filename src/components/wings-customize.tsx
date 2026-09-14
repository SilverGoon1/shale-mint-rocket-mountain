import { useId, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { CookNoteField, cookNoteValue } from "@/components/cook-note-field";
import { CustomizeFooter, ExtraStepChip } from "@/components/customize-chrome";
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
  tens = true,
  onClose,
  onConfirm,
}: {
  item: MenuItem;
  categoryId?: string;
  tens?: boolean;
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
  const bags = tens ? wingQtyMultiplier(pieceQty) : 1;
  const unitPrice = Math.round((priceNum(chosen?.price ?? "0") * bags + extras) * 100) / 100;
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

  function confirm() {
    if (!preview) return;
    const note = cookNoteValue(noteRef);
    onConfirm({
      size: tens ? `${pieceQty} pc` : chosen?.label || size || undefined,
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
            <h2 id={titleId}>{item.name}</h2>
            {item.description ? <p className="pizza-item-desc">{item.description}</p> : null}
          </div>
          <button type="button" className="ed-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={16} strokeWidth={2.2} />
          </button>
        </header>

        <div className="pizza-modal-body">
          {tens ? (
            <fieldset className="pizza-modal-block pizza-block-tight">
              <legend>Pieces</legend>
              <span className="qty-step wings-qty-step">
                <button
                  type="button"
                  aria-label="Fewer wings"
                  disabled={pieceQty <= WING_QTY_MIN}
                  onClick={() => setPieceQty((n) => snapWingQty(n - WING_QTY_STEP))}
                >
                  <Minus size={14} />
                </button>
                <strong aria-live="polite">{pieceQty} pc</strong>
                <button
                  type="button"
                  aria-label="More wings"
                  disabled={pieceQty >= WING_QTY_MAX}
                  onClick={() => setPieceQty((n) => snapWingQty(n + WING_QTY_STEP))}
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

          <fieldset className="pizza-modal-block">
            <legend>Sauce</legend>
            <div className="size-pick pizza-size-pick" role="radiogroup" aria-label="Wing sauce">
              {WING_SAUCES.map((s) => (
                <button key={s} type="button" data-on={sauce === s} onClick={() => setSauce(s)}>
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="pizza-modal-block">
            <legend>Included dressings</legend>
            <div className="size-pick pizza-size-pick" role="radiogroup" aria-label="Included dressings">
              {WING_INCLUDED_DIPS.map((d) => (
                <button key={d.id} type="button" data-on={dip === d.id} onClick={() => setDip(d.id)}>
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="pizza-modal-block pizza-block-tight pizza-extra-dressing">
            <legend>Extra dressings</legend>
            <div className="extra-step-row">
              <ExtraStepChip
                name="Extra Ranch"
                qty={extraRanch}
                step={WING_EXTRA_STEP}
                max={WING_EXTRA_MAX}
                unit={ranchUnit}
                onChange={(n) => setExtraRanch(snapExtraCups(n))}
              />
              <ExtraStepChip
                name="Extra Blue cheese"
                qty={extraBlue}
                step={WING_EXTRA_STEP}
                max={WING_EXTRA_MAX}
                unit={blueUnit}
                onChange={(n) => setExtraBlue(snapExtraCups(n))}
              />
            </div>
          </fieldset>

          <CookNoteField key={item.id || item.name} id={noteId} noteRef={noteRef} />
        </div>

        <CustomizeFooter
          total={unitPrice}
          ready={ready}
          helper="Pick a sauce and included dressings to add this to your bag."
          onClose={onClose}
          onConfirm={confirm}
        />
      </div>
    </div>
  );
}
