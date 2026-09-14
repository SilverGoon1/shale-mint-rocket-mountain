import { useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { CookNoteField, cookNoteValue } from "@/components/cook-note-field";
import { CustomizeFooter, ExtraStepChip } from "@/components/customize-chrome";
import { itemPhoto } from "@/data/item-photos";
import type { MenuItem } from "@/data/menu";
import { useDialogLock } from "@/lib/dialog-lock";
import { formatUsd } from "@/lib/shop-types";
import {
  SALAD_DRESSINGS,
  SALAD_EXTRA_MAX,
  SALAD_EXTRA_STEP,
  extraDressingCharge,
  extraDressingUnitPrice,
  saladBuildPicks,
  saladBuildReady,
  snapSaladExtra,
  type SaladDressing,
} from "@/lib/salads";
import type { CondimentPick } from "@/lib/condiments";

export type SaladCustomizeResult = {
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

export function SaladCustomize({
  item,
  categoryId,
  onClose,
  onConfirm,
}: {
  item: MenuItem;
  categoryId?: string;
  onClose: () => void;
  onConfirm: (result: SaladCustomizeResult) => void;
}) {
  const titleId = useId();
  const noteId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const sizes = item.prices.filter((p) => p.price);
  const [size, setSize] = useState(sizes[0]?.label || "");
  const [dressing, setDressing] = useState<SaladDressing | "">("");
  const [extra, setExtra] = useState(0);
  const photo = item.hideImage ? "" : itemPhoto(item, categoryId);
  useDialogLock(onClose, panelRef);

  const chosen = sizes.find((p) => p.label === size) ?? sizes[0];
  const extraUnit = extraDressingUnitPrice(item.condiments);
  const extras = extraDressingCharge(extra, extraUnit);
  const unitPrice = Math.round((priceNum(chosen?.price ?? "0") + extras) * 100) / 100;
  const ready = saladBuildReady(dressing);
  const preview = ready
    ? saladBuildPicks({
        dressing: dressing as SaladDressing,
        extra,
        extraUnit,
      })
    : null;

  function confirm() {
    if (!preview) return;
    const note = cookNoteValue(noteRef);
    onConfirm({
      size: chosen?.label || size || undefined,
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

          <fieldset className="pizza-modal-block">
            <legend>Dressing</legend>
            <div className="size-pick pizza-size-pick" role="radiogroup" aria-label="Dressing">
              {SALAD_DRESSINGS.map((d) => (
                <button key={d} type="button" data-on={dressing === d} onClick={() => setDressing(d)}>
                  {d}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="pizza-modal-block pizza-block-tight">
            <legend>Extra dressing</legend>
            <ExtraStepChip
              name="Extra dressing"
              qty={extra}
              step={SALAD_EXTRA_STEP}
              max={SALAD_EXTRA_MAX}
              unit={extraUnit}
              onChange={(n) => setExtra(snapSaladExtra(n))}
            />
          </fieldset>

          <CookNoteField key={item.id || item.name} id={noteId} noteRef={noteRef} />
        </div>

        <CustomizeFooter
          total={unitPrice}
          ready={ready}
          helper="Pick a dressing to add this to your bag."
          onClose={onClose}
          onConfirm={confirm}
        />
      </div>
    </div>
  );
}
