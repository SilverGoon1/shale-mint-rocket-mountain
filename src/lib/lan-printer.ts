import type { PrinterProfile } from "@/lib/shop-types";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function eposEnvelope(body: string) {
  const lines = escapeXml(body).replaceAll("\n", "&#10;");
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      <text>${lines}</text>
      <feed line="3"/>
      <cut type="feed"/>
    </epos-print>
  </s:Body>
</s:Envelope>`;
}

export function lanPrinterUrl(printer: PrinterProfile) {
  const host = String(printer.lanHost ?? "").trim();
  if (!host) return "";
  const proto = printer.lanProtocol === "https" ? "https" : "http";
  const port = printer.lanPort === 8043 || proto === "https" ? 8043 : 8008;
  return `${proto}://${host}:${port}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`;
}

export async function printLanReceipt(printer: PrinterProfile, body: string) {
  const url = lanPrinterUrl(printer);
  if (!url) throw new Error("Enter the printer IP on the shop Wi-Fi.");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8" },
    body: eposEnvelope(body),
  });
  if (!res.ok) throw new Error(`Printer answered ${res.status}. Check the IP and that this tablet is on shop Wi-Fi.`);
}

export async function testLanPrint(printer: PrinterProfile) {
  const slip = [
    "SOUTH END PIZZA III",
    "443 Zion Rd",
    "",
    "Test print from the shop tablet",
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
    "",
    "If you can read this, LAN ePOS is working.",
  ].join("\n");
  await printLanReceipt(printer, slip);
}
