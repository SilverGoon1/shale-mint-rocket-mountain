import { useId, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { CookNoteField, cookNoteValue } from "@/components/cook-note-field";
import { CustomizeFooter, ExtraStepChip } from "@/components/customize-chrome";
import { itemPhoto } from "@/data/item-photos";
import type { MenuItem } from "@/data/menu";
import {
  condimentCharge,
  condimentDetail,
  condimentMax,
  condimentTotal,
  isExtraKind,
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
import { formatUsd, type ShopSettingsPublic } from "@/lib/shop-types";
import { useDialogLock } from "@/lib/dialog-lock";
import { GROUP_BUFFALO, hasGroup } from "@/lib/modifiers";
import {
  BUFFALO_INCLUDED_DIPS,
  WING_EXTRA_MAX,
  WING_EXTRA_STEP,
  type WingIncludedDip,
  buffaloBuildPicks,
  buffaloDipReady,
  extraDipCharge,
  extraDipUnitPrice,
  snapExtraCups,
} from "@/lib/wings";

export type PizzaCustomizeResult = {
  size: string;
  unitPrice: number;
  name: string;
  detail: string;
  comment?: string;
  toppings: PizzaToppingPick[];
  condiments: CondimentPick[];
};

function isDipCondiment(c: { id?: string; name?: string }) {
  const id = String(c.id ?? "").toLowerCase();
  return (
    id.startsWith("wing-dip-") ||
    isExtraKind(c, "ranch") ||
    isExtraKind(c, "blue")
  );
}

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
  const [dip, setDip] = useState<WingIncludedDip | "">("");
  const [extraRanch, setExtraRanch] = useState(0);
  const [extraBlue, setExtraBlue] = useState(0);
  const buffalo = hasGroup({ id: categoryId || "" }, item, GROUP_BUFFALO);
  const condiments = (item.condiments ?? []).filter((c) => !buffalo || !isDipCondiment(c));
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
  const ranchUnit = extraDipUnitPrice(item.condiments, "ranch");
  const blueUnit = extraDipUnitPrice(item.condiments, "blue");
  const dipBuilt = buffalo && buffaloDipReady(dip)
    ? buffaloBuildPicks({
        dip: dip as WingIncludedDip,
        extraRanch,
        extraBlue,
        ranchUnit,
        blueUnit,
      })
    : null;
  const dipExtra = dipBuilt?.extras ?? extraDipCharge(extraRanch, ranchUnit) + extraDipCharge(extraBlue, blueUnit);
  const unitPrice = Math.round((priced.unitPrice + extras + (buffalo ? dipExtra : 0)) * 100) / 100;
  const extraDetail = mergeItemDetail(priced.detail, dipBuilt?.detail, condimentDetail(condPicks));

  const chosen = item.prices.find((p) => p.label === size) ?? first;
  const ready = !buffalo || buffaloDipReady(dip);

  function revealTopping(id: string) {
    requestAnimationFrame(() => {
      const chip = document.querySelector(`.pizza-pane .topping-chip[data-topping="${CSS.escape(id)}"]`);
      if (chip instanceof HTMLElement) {
        chip.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      }
    });
  }

  function setTopping(id: string, side: ToppingSide | "off") {
    const turningOn = side !== "off" && (picks[id] ?? "off") === "off";
    setPicks((cur) => ({ ...cur, [id]: side }));
    if (turningOn) revealTopping(id);
  }

  function toggleTopping(id: string) {
    const turningOn = (picks[id] ?? "off") === "off";
    setPicks((cur) => {
      const side = cur[id] ?? "off";
      return { ...cur, [id]: side === "off" ? "whole" : "off" };
    });
    if (turningOn) revealTopping(id);
  }

  function confirm() {
    if (!ready) return;
    const note = cookNoteValue(noteRef);
    onConfirm({
      size: chosen?.label || size,
      unitPrice,
      name: priced.name,
      detail: extraDetail,
      toppings,
      comment: note || undefined,
      condiments: [...(dipBuilt?.condiments ?? []), ...condPicks],
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
          <fieldset className="pizza-modal-block pizza-block-tight pizza-size-block">
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

          {buffalo ? (
            <fieldset className="pizza-modal-block pizza-block-tight">
              <legend>Included dressing</legend>
              <div className="size-pick pizza-size-pick" role="radiogroup" aria-label="Included dressing">
                {BUFFALO_INCLUDED_DIPS.map((d) => (
                  <button key={d.id} type="button" data-on={dip === d.id} onClick={() => setDip(d.id)}>
                    {d.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {buffalo ? (
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
          ) : null}

          <div className="pizza-pane" data-pane="toppings">
            <p className="ed-sub topping-hint">Tap a topping. Price is for this size — half is half of that topping.</p>
            <div className="topping-grid">
              {PIZZA_TOPPINGS.map((t) => {
                const side = picks[t.id] ?? "off";
                const on = side !== "off";
                const unit = toppingUnit(size, settings, t.id);
                const charge = toppingCharge(size, on ? (side as "whole" | "left" | "right") : "whole", settings, t.id);
                return (
                  <div key={t.id} className="topping-chip" data-topping={t.id} data-on={on || undefined}>
                    <button
                      type="button"
                      className="topping-chip-main"
                      aria-pressed={on}
                      onClick={() => toggleTopping(t.id)}
                    >
                      <span>{t.name}</span>
                      <em>{formatUsd(on ? charge : unit)}</em>
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
          </div>

          <CookNoteField
            key={item.id || item.name}
            id={noteId}
            noteRef={noteRef}
            rows={1}
          />
        </div>

        <CustomizeFooter
          total={unitPrice}
          ready={ready}
          helper="Pick Ranch, Blue cheese, or none."
          onClose={onClose}
          onConfirm={confirm}
        />
      </div>
    </div>
  );
}
