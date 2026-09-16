import type { RestaurantInfo } from "@/data/menu";
import type { OrderView, PrinterProfile, ReceiptOptions } from "@/lib/shop-types";
import { formatTicketNo, formatUsd, payMethodLabel } from "@/lib/shop-types";

export type ReceiptKind = "customer" | "store";

const PAPER_COLS = { "58mm": 32, "80mm": 48 } as const;

export function paperCols(paper: PrinterProfile["paper"] = "58mm") {
  return PAPER_COLS[paper] ?? 32;
}

function pad(left: string, right: string, width: number) {
  const gap = Math.max(1, width - left.length - right.length);
  return `${left}${" ".repeat(gap)}${right}`;
}

function wrap(text: string, width: number) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) {
      cur = w.slice(0, width);
      continue;
    }
    if ((cur + " " + w).length <= width) cur += " " + w;
    else {
      lines.push(cur);
      cur = w.slice(0, width);
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function rule(width: number) {
  return ".".repeat(width);
}

function payLabel(method: string) {
  return payMethodLabel(method);
}

export function buildReceiptText(opts: {
  order: OrderView;
  restaurant: RestaurantInfo;
  receipt: ReceiptOptions;
  kind: ReceiptKind;
  taxRate: number;
  paper?: PrinterProfile["paper"];
}) {
  const width = paperCols(opts.paper);
  const o = opts.order;
  const when = new Date(o.createdAt);
  const lines: string[] = [];
  const center = (s: string) => {
    const t = s.slice(0, width);
    const padL = Math.max(0, Math.floor((width - t.length) / 2));
    return " ".repeat(padL) + t;
  };

  lines.push(center("SOUTH END PIZZA III"));
  lines.push(center("Est. 2005"));
  lines.push(center("443 Zion Rd"));
  lines.push(center("Egg Harbor Township, NJ 08234"));
  lines.push(center("(609) 788-8512"));
  lines.push(center("southendpizza.app"));
  if (opts.receipt.taxId.trim()) {
    lines.push(center(`NJ Tax ID ${opts.receipt.taxId.trim()}`));
  }
  lines.push(rule(width));
  lines.push(center(`TICKET #${formatTicketNo(o.ticketNo)}`));
  lines.push(center(o.fulfillment === "delivery" ? "DELIVERY" : "PICKUP"));
  lines.push(rule(width));
  lines.push(pad("Date", when.toLocaleDateString(), width));
  lines.push(pad("Time", when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), width));
  if (o.pickupName) {
    lines.push(pad("Name", o.pickupName, width));
  }
  if (o.scheduledFor) {
    const whenAt = new Date(o.scheduledFor);
    lines.push(
      pad(
        "When",
        whenAt.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
        width,
      ),
    );
  }
  lines.push(pad("Status", o.status.replaceAll("_", " "), width));
  lines.push(rule(width));

  for (const it of o.items) {
    const name = `${it.qty}x ${it.name}${it.size ? ` ${it.size}` : ""}`;
    const price = formatUsd(it.unitPrice * it.qty);
    const chunks = wrap(name, Math.max(10, width - price.length - 1));
    lines.push(pad(chunks[0] ?? name, price, width));
    for (const extra of chunks.slice(1)) lines.push(extra);
    if (it.detail) {
      for (const extra of wrap(it.detail, width - 2)) lines.push(`  ${extra}`);
    }
    if (it.comment) {
      if (opts.kind === "store") {
        lines.push("  *** COOK NOTE ***");
        for (const extra of wrap(it.comment.toUpperCase(), width - 2)) lines.push(`  ${extra}`);
      } else {
        for (const extra of wrap(`Cook: ${it.comment}`, width - 2)) lines.push(`  ${extra}`);
      }
    }
    if (it.qty > 1) {
      lines.push(`  ${formatUsd(it.unitPrice)} each`);
    }
  }

  lines.push(pad("Subtotal", formatUsd(o.subtotal), width));
  if (o.discount) lines.push(pad("Discounts", `-${formatUsd(o.discount)}`, width));
  if (o.deliveryFee) lines.push(pad("Delivery", formatUsd(o.deliveryFee), width));
  lines.push(pad(`NJ sales tax ${opts.taxRate}%`, formatUsd(o.tax), width));
  if (o.tip) lines.push(pad("Tip", formatUsd(o.tip), width));
  lines.push(rule(width));
  lines.push(pad("TOTAL", formatUsd(o.total), width));
  lines.push(rule(width));
  lines.push(pad("Tender", payLabel(o.paymentMethod), width));
  if (o.pointsEarned) lines.push(pad("Points earned", String(o.pointsEarned), width));
  if (o.pointsSpent) lines.push(pad("Points redeemed", String(o.pointsSpent), width));

  if (o.fulfillment === "delivery" && o.addressLine) {
    lines.push("Deliver to");
    lines.push(...wrap(o.addressLine, width));
    const cityZip = `${o.city} ${o.zip}`.trim();
    if (cityZip) lines.push(...wrap(cityZip, width));
  } else if (opts.kind === "customer" && o.fulfillment === "pickup") {
    lines.push(...wrap("Pickup at 443 Zion Rd, Egg Harbor Township.", width));
  }

  if (opts.kind === "customer") {
    lines.push(center("Thank you. Keep this receipt."));
    lines.push(center("Open daily 11 AM - 8 PM"));
    lines.push(center("Sales tax separately stated"));
    lines.push(center("CUSTOMER COPY"));
    const extra = opts.receipt.footer.trim();
    if (extra) {
      for (const row of wrap(extra, width)) lines.push(center(row));
    }
  } else {
    lines.push(center("STORE COPY -- not a customer receipt"));
    lines.push(center("Cook notes are for the kitchen."));
  }

  lines.push("");
  return lines.join("\n");
}

export function sampleOrder(): OrderView {
  return {
    id: "ord-sample-001",
    ticketNo: 1,
    userId: "sample",
    status: "preparing",
    fulfillment: "pickup",
    notes: "Well done, extra ranch",
    addressLine: "",
    city: "",
    zip: "",
    items: [
      {
        itemId: "pep",
        categoryId: "pizza",
        name: "Pepperoni Pizza",
        size: "LG",
        unitPrice: 18.75,
        qty: 1,
      },
      {
        itemId: "sticks",
        categoryId: "appetizers",
        name: "Mozzarella Sticks",
        size: "5 pc",
        unitPrice: 8.5,
        qty: 1,
      },
    ],
    subtotal: 27.25,
    discount: 0,
    deliveryFee: 0,
    tax: 1.81,
    tip: 4.09,
    total: 33.15,
    pointsEarned: 27,
    pointsSpent: 0,
    paymentMethod: "pay_pickup",
    createdAt: new Date().toISOString(),
  };
}

function ascii(text: string) {
  return text.replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "?");
}

export function textToEscPos(text: string) {
  const init = [0x1b, 0x40];
  const left = [0x1b, 0x61, 0x00];
  const body = Array.from(new TextEncoder().encode(ascii(text).replaceAll("\n", "\r\n")));
  const feed = [0x0a, 0x0a, 0x0a, 0x0a];
  const cut = [0x1d, 0x56, 0x41, 0x10];
  return Uint8Array.from([...init, ...left, ...body, ...feed, ...cut]);
}

export function jobsForPrinters(printers: PrinterProfile[], kinds: ReceiptKind[]) {
  const jobs: { printer: PrinterProfile; kind: ReceiptKind }[] = [];
  for (const printer of printers) {
    if (!printer.enabled) continue;
    const copies = Math.max(1, Math.min(5, Math.round(printer.copies || 1)));
    const want: ReceiptKind[] = [];
    if (printer.customerCopy && kinds.includes("customer")) want.push("customer");
    if (printer.storeCopy && kinds.includes("store")) want.push("store");
    for (let i = 0; i < copies; i++) {
      for (const kind of want) jobs.push({ printer, kind });
    }
  }
  return jobs;
}
