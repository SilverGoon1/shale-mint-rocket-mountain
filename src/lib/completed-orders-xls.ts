import { computeTax, formatTicketNo, payMethodLabel } from "@/lib/shop-types";

export type CompletedOrderExport = {
  ticketNo: number;
  createdAt: string;
  acceptedAt?: string;
  status?: string;
  name: string;
  phone: string;
  fulfillment: "pickup" | "delivery";
  paymentMethod: string;
  addressLine: string;
  city: string;
  zip: string;
  items: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  taxRatePct?: number;
  tip: number;
  total: number;
  notes: string;
  voidReason?: string;
};

export type TaxExportPayload = {
  tickets: CompletedOrderExport[];
  voids: CompletedOrderExport[];
  taxRate: number;
  taxId: string;
  from: string;
  to: string;
  includeVoids?: boolean;
};

function xml(value: string) {
  return value.replace(/[&<>"]/g, (ch) => {
    if (ch === "&") return `&${"amp"};`;
    if (ch === "<") return `&${"lt"};`;
    if (ch === ">") return `&${"gt"};`;
    return `&${"quot"};`;
  });
}

function strCell(value: string) {
  return `<Cell><Data ss:Type="String">${xml(value)}</Data></Cell>`;
}

function numCell(value: number, style = "Money") {
  const n = Number.isFinite(value) ? value : 0;
  return `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${n.toFixed(4)}</Data></Cell>`;
}

function etStamp(iso: string) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return { date, time };
}

function moneyBits(o: CompletedOrderExport, shopRate: number) {
  const { taxable } = computeTax(o.subtotal, o.discount, o.deliveryFee, 0);
  const rate = taxable > 0 ? Math.round((o.tax / taxable) * 10000) / 100 : shopRate;
  return { taxable, rate };
}

function sumTickets(rows: CompletedOrderExport[]) {
  return rows.reduce(
    (acc, o) => {
      const { taxable } = moneyBits(o, 0);
      acc.count += 1;
      acc.food += o.subtotal;
      acc.discount += o.discount;
      acc.fee += o.deliveryFee;
      acc.taxable += taxable;
      acc.tax += o.tax;
      acc.tip += o.tip;
      acc.total += o.total;
      if (o.fulfillment === "delivery") acc.delivery += o.total;
      else acc.pickup += o.total;
      const method = payMethodLabel(o.paymentMethod);
      const pay = acc.byPay.get(method) ?? { total: 0, count: 0 };
      pay.total += o.total;
      pay.count += 1;
      acc.byPay.set(method, pay);
      return acc;
    },
    {
      count: 0,
      food: 0,
      discount: 0,
      fee: 0,
      taxable: 0,
      tax: 0,
      tip: 0,
      total: 0,
      pickup: 0,
      delivery: 0,
      byPay: new Map<string, { total: number; count: number }>(),
    },
  );
}

export function taxExportGlance(tickets: CompletedOrderExport[]) {
  const sums = sumTickets(tickets);
  return { taxable: sums.taxable, tax: sums.tax, count: sums.count, total: sums.total };
}

function ticketsSheet(rows: CompletedOrderExport[], shopRate: number) {
  const headers = [
    "Ticket",
    "Date (ET)",
    "Time (ET)",
    "Accepted (ET)",
    "Status",
    "Name",
    "Phone",
    "Type",
    "Payment",
    "Street",
    "City",
    "ZIP",
    "Items",
    "Food",
    "Discount",
    "Delivery fee",
    "Taxable",
    "Sales tax",
    "Tax rate %",
    "Tip (not taxed)",
    "Total collected",
    "Tax ID",
    "Notes",
  ];
  const body = rows.map((o) => {
    const { date, time } = etStamp(o.createdAt);
    const accepted = etStamp(o.acceptedAt ?? "");
    const { taxable, rate } = moneyBits(o, shopRate);
    return [
      strCell(formatTicketNo(o.ticketNo)),
      strCell(date),
      strCell(time),
      strCell(accepted.date ? `${accepted.date} ${accepted.time}` : ""),
      strCell(o.status ?? "completed"),
      strCell(o.name || "Guest"),
      strCell(o.phone || ""),
      strCell(o.fulfillment === "delivery" ? "Delivery" : "Pickup"),
      strCell(payMethodLabel(o.paymentMethod)),
      strCell(o.addressLine || ""),
      strCell(o.city || ""),
      strCell(o.zip || ""),
      strCell(o.items || ""),
      numCell(o.subtotal),
      numCell(o.discount),
      numCell(o.deliveryFee),
      numCell(taxable),
      numCell(o.tax),
      numCell(rate, "Rate"),
      numCell(o.tip),
      numCell(o.total),
      strCell(""),
      strCell(o.notes || ""),
    ].join("");
  });
  const sums = sumTickets(rows);
  const pad = Array.from({ length: 12 }, () => strCell(""));
  const totalRow = [
    strCell("TOTALS"),
    strCell(""),
    strCell(""),
    strCell(""),
    strCell(`${sums.count} paid tickets`),
    ...pad.slice(0, 8),
    numCell(sums.food),
    numCell(sums.discount),
    numCell(sums.fee),
    numCell(sums.taxable),
    numCell(sums.tax),
    strCell(""),
    numCell(sums.tip),
    numCell(sums.total),
    strCell(""),
    strCell("Tips are not taxed in New Jersey."),
  ].join("");
  return `<Worksheet ss:Name="Tickets">
  <Table>
   <Row ss:StyleID="Header">${headers.map(strCell).join("")}</Row>
   ${body.map((r) => `<Row>${r}</Row>`).join("\n   ")}
   <Row ss:StyleID="Header">${totalRow}</Row>
  </Table>
 </Worksheet>`;
}

function kvRow(label: string, value: string, money?: number) {
  const right = money === undefined ? strCell(value) : numCell(money);
  return `<Row>${strCell(label)}${right}</Row>`;
}

function summarySheet(opts: TaxExportPayload) {
  const sums = sumTickets(opts.tickets);
  const period =
    opts.from && opts.to ? `${opts.from} – ${opts.to} (ET)` : opts.from || opts.to || "All time (ET)";
  const taxId = opts.taxId.trim() || "ADD TAX ID IN PRINTERS";
  const effective = sums.taxable > 0 ? Math.round((sums.tax / sums.taxable) * 10000) / 100 : opts.taxRate;
  const byPay = [...sums.byPay.entries()].map(
    ([method, row]) => kvRow(`  ${method} (${row.count})`, "", row.total),
  );
  return `<Worksheet ss:Name="Tax summary">
  <Table>
   <Row ss:StyleID="Title">${strCell("South End Pizza III")}${strCell("")}</Row>
   <Row>${strCell("443 Zion Rd, Egg Harbor Township, NJ 08234")}${strCell("")}</Row>
   <Row>${strCell(`NJ sales tax ID: ${taxId}`)}${strCell("")}</Row>
   <Row>${strCell(`Period: ${period}`)}${strCell("")}</Row>
   <Row>${strCell("")}${strCell("")}</Row>
   ${kvRow("Ticket count (paid)", String(sums.count))}
   ${kvRow("Gross food", "", sums.food)}
   ${kvRow("Discounts", "", sums.discount)}
   ${kvRow("Delivery fees (taxable when we deliver)", "", sums.fee)}
   ${kvRow("Taxable sales", "", sums.taxable)}
   ${kvRow("NJ sales tax collected", "", sums.tax)}
   ${kvRow("Tax rate % (shop setting)", opts.taxRate.toFixed(3))}
   ${kvRow("Effective rate % (tax / taxable)", effective.toFixed(3))}
   ${kvRow("Tips (not taxed in New Jersey)", "", sums.tip)}
   ${kvRow("Total collected", "", sums.total)}
   ${kvRow("Pickup sales", "", sums.pickup)}
   ${kvRow("Delivery sales", "", sums.delivery)}
   <Row>${strCell("By payment method")}${strCell("")}</Row>
   ${byPay.join("\n   ") || kvRow("  None", "0")}
   <Row>${strCell("")}${strCell("")}</Row>
   <Row ss:StyleID="Note">${strCell(
     "Prepared food is taxable. Seller delivery fees are taxable. Tips/gratuities are not subject to NJ sales tax. This is a bookkeeping export for your accountant — it is not an ST-50/ST-51 filing.",
   )}${strCell("")}</Row>
  </Table>
 </Worksheet>`;
}

function voidsSheet(rows: CompletedOrderExport[]) {
  const headers = ["Ticket", "Date (ET)", "Time (ET)", "Name", "Total", "Reason"];
  const body = rows.map((o) => {
    const { date, time } = etStamp(o.createdAt);
    return [
      strCell(formatTicketNo(o.ticketNo)),
      strCell(date),
      strCell(time),
      strCell(o.name || "Guest"),
      numCell(o.total),
      strCell(o.voidReason || ""),
    ].join("");
  });
  const sum = rows.reduce((n, o) => n + o.total, 0);
  const totalRow = [
    strCell("VOID TOTAL"),
    strCell(""),
    strCell(""),
    strCell(`${rows.length} voided tickets`),
    numCell(sum),
    strCell("Not included in Tax summary taxable/tax."),
  ].join("");
  return `<Worksheet ss:Name="Voids">
  <Table>
   <Row ss:StyleID="Header">${headers.map(strCell).join("")}</Row>
   ${body.map((r) => `<Row>${r}</Row>`).join("\n   ")}
   <Row ss:StyleID="Header">${totalRow}</Row>
  </Table>
 </Worksheet>`;
}

export function buildTaxSpreadsheet(opts: TaxExportPayload) {
  const sheets = [ticketsSheet(opts.tickets, opts.taxRate), summarySheet(opts)];
  if (opts.includeVoids) sheets.push(voidsSheet(opts.voids));
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#F4EAD8" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="14"/></Style>
  <Style ss:ID="Note"><Font ss:Italic="1"/></Style>
  <Style ss:ID="Money"><NumberFormat ss:Format="$#,##0.00"/></Style>
  <Style ss:ID="Rate"><NumberFormat ss:Format="0.000"/></Style>
 </Styles>
 ${sheets.join("\n ")}
</Workbook>`;
}

export function buildCompletedOrdersSpreadsheet(rows: CompletedOrderExport[]) {
  return buildTaxSpreadsheet({
    tickets: rows,
    voids: [],
    taxRate: 6.625,
    taxId: "",
    from: "",
    to: "",
    includeVoids: false,
  });
}

export function downloadTaxXls(opts: TaxExportPayload) {
  const xmlDoc = buildTaxSpreadsheet(opts);
  const from = opts.from || "all";
  const to = opts.to || new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  const blob = new Blob([xmlDoc], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `south-end-tax-${from}-to-${to}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function downloadCompletedOrdersXls(rows: CompletedOrderExport[]) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  downloadTaxXls({
    tickets: rows,
    voids: [],
    taxRate: 6.625,
    taxId: "",
    from: ymd,
    to: ymd,
    includeVoids: false,
  });
}
