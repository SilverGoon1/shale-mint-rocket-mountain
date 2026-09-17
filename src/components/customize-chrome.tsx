import { Minus, Plus } from "lucide-react";
import { formatUsd } from "@/lib/shop-types";

export function ExtraStepChip({
  name,
  qty,
  step,
  max,
  unit,
  onChange,
}: {
  name: string;
  qty: number;
  step: number;
  max: number;
  unit: number;
  onChange: (qty: number) => void;
}) {
  const price = unit > 0 ? formatUsd(unit) : "";
  return (
    <div className="extra-step-chip" data-on={qty > 0 || undefined}>
      <button
        type="button"
        className="extra-step-main"
        disabled={qty >= max}
        onClick={() => onChange(Math.min(max, qty + step))}
      >
        +{step} {name}
        {price ? <span> · {price}</span> : null}
      </button>
      {qty > 0 ? (
        <span className="qty-step">
          <button type="button" aria-label={`Fewer ${name}`} onClick={() => onChange(Math.max(0, qty - step))}>
            <Minus size={14} />
          </button>
          <strong>{qty}</strong>
          <button
            type="button"
            aria-label={`More ${name}`}
            disabled={qty >= max}
            onClick={() => onChange(Math.min(max, qty + step))}
          >
            <Plus size={14} />
          </button>
        </span>
      ) : null}
    </div>
  );
}

const CART_QTY_MAX = 99;

export function CustomizeFooter({
  total,
  ready,
  helper,
  onClose,
  onConfirm,
  qty,
  onQtyChange,
}: {
  /** Unit price (or pre-multiplied line total when qty is omitted). */
  total: number;
  ready: boolean;
  helper?: string;
  onClose: () => void;
  onConfirm: () => void;
  /** Cart-line quantity. Pass with onQtyChange to show −/+ (omit for wings piece flows). */
  qty?: number;
  onQtyChange?: (qty: number) => void;
}) {
  const showQty = typeof qty === "number" && typeof onQtyChange === "function";
  const lineTotal = showQty ? Math.round(total * qty * 100) / 100 : total;
  return (
    <footer className="pizza-modal-foot">
      {!ready && helper ? <p className="ed-sub pizza-modal-help">{helper}</p> : null}
      <div className="pizza-modal-actions">
        {showQty ? (
          <span className="qty-step" aria-label="Quantity">
            <button
              type="button"
              aria-label="Fewer items"
              disabled={qty <= 1}
              onClick={() => onQtyChange(Math.max(1, qty - 1))}
            >
              <Minus size={14} />
            </button>
            <strong aria-live="polite">{qty}</strong>
            <button
              type="button"
              aria-label="More items"
              disabled={qty >= CART_QTY_MAX}
              onClick={() => onQtyChange(Math.min(CART_QTY_MAX, qty + 1))}
            >
              <Plus size={14} />
            </button>
          </span>
        ) : null}
        <button type="button" className="ed-btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn-print" disabled={!ready} onClick={onConfirm}>
          {`Add · ${formatUsd(lineTotal)}`}
        </button>
      </div>
    </footer>
  );
}
