import { createPortal } from "react-dom";
import { formatTicketNo, formatUsd } from "@/lib/shop-types";
import { formatCompletedToast, type PosToast, type PosToastTone } from "@/lib/pos-toast";

export type PosStaffToastKind = PosToastTone;
export type PosStaffToastState = PosToast;

export function staffCompleteLine(order: { ticketNo?: number; total?: number; tip?: number }) {
  return formatCompletedToast({
    ticketNo: order.ticketNo ?? 0,
    total: Number(order.total) || 0,
    tip: order.tip,
    formatTicketNo,
    formatUsd,
  }).text;
}

/** Same chrome as Accept — portaled to body so POS tabs cannot cover it. */
export function PosStaffToast({ toast }: { toast: PosStaffToastState | null }) {
  if (!toast || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="save-toast pos-accept-toast"
      data-ok="true"
      data-kind={toast.tone}
      data-tone={toast.tone}
      role="status"
    >
      <strong>{toast.title}</strong>
      <span>{toast.text}</span>
    </div>,
    document.body,
  );
}
