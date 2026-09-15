import { CARD_PROCESSOR_LIVE, isProcessorPayment, payMethodLabel } from "@/lib/shop-types";

export function lineSummary(it: {
  qty?: number;
  name?: string;
  size?: string;
  detail?: string;
  comment?: string;
}) {
  const qty = Math.max(1, Math.round(Number(it.qty) || 1));
  const name = String(it.name ?? "").trim() || "Item";
  const bits = [`${qty}× ${name}`];
  const size = String(it.size ?? "").trim();
  const detail = String(it.detail ?? "").trim();
  const comment = String(it.comment ?? "").trim();
  if (size) bits.push(size);
  if (detail) bits.push(detail);
  if (comment) bits.push(`Cook: ${comment}`);
  return bits.join(" · ");
}

export function payStatusLabel(method: string, status?: string) {
  if (isProcessorPayment(method)) {
    const name = payMethodLabel(method);
    if (!CARD_PROCESSOR_LIVE) return `${name} (not capturing)`;
    return status === "awaiting_payment" ? `${name} · unpaid` : name;
  }
  const label = payMethodLabel(method);
  if (status === "awaiting_payment") return `${label} · unpaid`;
  return label;
}
