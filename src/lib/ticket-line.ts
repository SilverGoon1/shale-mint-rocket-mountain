import { CARD_PROCESSOR_LIVE, payMethodLabel } from "@/lib/shop-types";

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
  if (method === "pay_card") {
    if (!CARD_PROCESSOR_LIVE) return "Card (not live)";
    return status === "awaiting_payment" ? "Card · unpaid" : "Card";
  }
  const label = payMethodLabel(method);
  if (status === "awaiting_payment") return `${label} · unpaid`;
  return label;
}
