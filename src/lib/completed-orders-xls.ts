import { computeTax, formatTicketNo, payMethodLabel } from "@/lib/shop-types";

export type CompletedOrderExport = {
  ticketNo: number;
  createdAt: string;
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
  tip: number;
  total: number;
  notes: string;
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

export function buildCompletedOrdersSpreadsheet(rows: CompletedOrderExport[]) {
  const headers = [
    "Ticket",
    "Date (ET)",
    "Time (ET)",
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
    "Notes",
  ];
  const body = rows.map((o) => {
    const { date, time } = etStamp(o.createdAt);
    const { taxable } = computeTax(o.subtotal, o.discount, o.deliveryFee, 0);
    const rate = taxable > 0 ? Math.round((o.tax / taxable) * 10000) / 100 : 0;
    return [
      strCell(formatTicketNo(o.ticketNo)),
      strCell(date),
      strCell(time),
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
      strCell(o.notes || ""),
    ].join("");
  });

  const sums = rows.reduce(
    (acc, o) => {
      const { taxable } = computeTax(o.subtotal, o.discount, o.deliveryFee, 0);
      acc.food += o.subtotal;
      acc.discount += o.discount;
      acc.fee += o.deliveryFee;
      acc.taxable += taxable;
      acc.tax += o.tax;
      acc.tip += o.tip;
      acc.total += o.total;
      return acc;
    },
    { food: 0, discount: 0, fee: 0, taxable: 0, tax: 0, tip: 0, total: 0 },
  );

  const totalRow = [
    strCell("TOTALS"),
    strCell(""),
    strCell(""),
    strCell(`${rows.length} completed tickets`),
    strCell(""),
    strCell(""),
    strCell(""),
    strCell(""),
    strCell(""),
    strCell(""),
    strCell(""),
    numCell(sums.food),
    numCell(sums.discount),
    numCell(sums.fee),
    numCell(sums.taxable),
    numCell(sums.tax),
    strCell(""),
    numCell(sums.tip),
    numCell(sums.total),
    strCell("Tips are not taxed in New Jersey."),
  ].join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#F4EAD8" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Money"><NumberFormat ss:Format="$#,##0.00"/></Style>
  <Style ss:ID="Rate"><NumberFormat ss:Format="0.000"/></Style>
 </Styles>
 <Worksheet ss:Name="Completed orders">
  <Table>
   <Row><Cell ss:MergeAcross="19"><Data ss:Type="String">${xml(
     "South End Pizza III — completed orders. Taxable = food after discounts + delivery fee. Tips are not taxed in New Jersey.",
   )}</Data></Cell></Row>
   <Row ss:StyleID="Header">${headers.map(strCell).join("")}</Row>
   ${body.map((r) => `<Row>${r}</Row>`).join("\n   ")}
   <Row ss:StyleID="Header">${totalRow}</Row>
  </Table>
 </Worksheet>
</Workbook>`;
}

export function downloadCompletedOrdersXls(rows: CompletedOrderExport[]) {
  const xmlDoc = buildCompletedOrdersSpreadsheet(rows);
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
  const blob = new Blob([xmlDoc], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `south-end-completed-orders-${ymd}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
