/** Shared POS success toast (Accept + Complete). Non-blocking, 3–4s. */
export type PosToastTone = "accepted" | "completed";

export type PosToast = {
  tone: PosToastTone;
  title: string;
  text: string;
};

export const POS_TOAST_MS = 3500;

export function formatCompletedToast(opts: {
  ticketNo: number | string;
  total: number;
  tip?: number | null;
  formatTicketNo: (n: number) => string;
  formatUsd: (n: number) => string;
}): PosToast {
  const tip = Number(opts.tip) || 0;
  const num = typeof opts.ticketNo === "number" ? opts.ticketNo : Number(opts.ticketNo) || 0;
  const ticket = opts.formatTicketNo(num);
  const money = opts.formatUsd(opts.total);
  const tipBit = tip > 0 ? ` (tip ${opts.formatUsd(tip)})` : "";
  return {
    tone: "completed",
    title: "Completed",
    text: `Completed #${ticket} · ${money}${tipBit}`,
  };
}

export function formatAcceptedToast(opts: {
  ticketNo: number | string;
  formatTicketNo: (n: number) => string;
}): PosToast {
  const num = typeof opts.ticketNo === "number" ? opts.ticketNo : Number(opts.ticketNo) || 0;
  return {
    tone: "accepted",
    title: "Accepted",
    text: `Ticket #${opts.formatTicketNo(num)} accepted — sent to the kitchen.`,
  };
}
