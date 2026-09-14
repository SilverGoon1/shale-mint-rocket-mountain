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

export function CustomizeFooter({
  total,
  ready,
  helper,
  onClose,
  onConfirm,
}: {
  total: number;
  ready: boolean;
  helper?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <footer className="pizza-modal-foot">
      {!ready && helper ? <p className="ed-sub pizza-modal-help">{helper}</p> : null}
      <div className="pizza-modal-actions">
        <button type="button" className="ed-btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn-print" disabled={!ready} onClick={onConfirm}>
          {`Add · ${formatUsd(total)}`}
        </button>
      </div>
    </footer>
  );
}
