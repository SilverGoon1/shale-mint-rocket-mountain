import type { RestaurantInfo } from "@/data/menu";
import type { OrderView, PrinterProfile, ReceiptOptions } from "@/lib/shop-types";
import { buildReceiptText, jobsForPrinters, textToEscPos, type ReceiptKind } from "@/lib/receipt";
import { printLanReceipt } from "@/lib/lan-printer";

const NUS = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_RX = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const ISSC = "49535343-fe7d-4ae5-8fa9-9fafd205e455";
const ISSC_RX = "49535343-8841-43f4-a8d4-ecbe34729bb3";
const ISSC_TX = "49535343-aca3-481c-91ec-d85e28a60318";
const FFE0 = "0000ffe0-0000-1000-8000-00805f9b34fb";
const FFE1 = "0000ffe1-0000-1000-8000-00805f9b34fb";
const FF00 = "0000ff00-0000-1000-8000-00805f9b34fb";
const FF02 = "0000ff02-0000-1000-8000-00805f9b34fb";
const AE30 = "0000ae30-0000-1000-8000-00805f9b34fb";
const FEASY = "e7810a71-73ae-499d-8c15-faa9aef0c3f2";
const PRINT_SVC = "000018f0-0000-1000-8000-00805f9b34fb";
const PRINT_DATA = "00002af1-0000-1000-8000-00805f9b34fb";
const FFF0 = "0000fff0-0000-1000-8000-00805f9b34fb";
const FFF1 = "0000fff1-0000-1000-8000-00805f9b34fb";
const FF10 = "0000ff10-0000-1000-8000-00805f9b34fb";

const OPTIONAL_SERVICES = [NUS, ISSC, FFE0, FF00, AE30, FEASY, PRINT_SVC, FFF0, FF10];
const WRITE_CHARS = [NUS_RX, ISSC_RX, ISSC_TX, FFE1, FF02, PRINT_DATA, FFF1];

export const PRINTER_PAIR_CHANNEL = "southend-printer-pair";
export const PRINTER_PAIR_PATH = "/pair-printer";
const PRINT_JOB_KEY = "southend-print-job";

type GattChar = {
  properties: { write?: boolean; writeWithoutResponse?: boolean };
  writeValue(data: BufferSource): Promise<void>;
  writeValueWithoutResponse?(data: BufferSource): Promise<void>;
};

type GattService = {
  getCharacteristic(uuid: string): Promise<GattChar>;
  getCharacteristics(): Promise<GattChar[]>;
};

type GattServer = {
  connected: boolean;
  getPrimaryService(uuid: string): Promise<GattService>;
  getPrimaryServices(): Promise<GattService[]>;
  disconnect(): void;
};

export type BtDevice = {
  id: string;
  name?: string | null;
  gatt?: {
    connected: boolean;
    connect(): Promise<GattServer>;
  };
};

type BtNav = Navigator & {
  bluetooth?: {
    getAvailability?: () => Promise<boolean>;
    requestDevice(opts: {
      acceptAllDevices?: boolean;
      optionalServices?: string[];
      filters?: { namePrefix?: string; services?: string[] }[];
    }): Promise<BtDevice>;
    getDevices?: () => Promise<BtDevice[]>;
  };
};

type PolicyDoc = Document & {
  permissionsPolicy?: { allowsFeature(feature: string): boolean };
  featurePolicy?: { allowsFeature(feature: string): boolean };
};

export type PairedPrinter = {
  bluetoothId: string;
  bluetoothName: string;
};

export type PrintJob = {
  bluetoothId: string;
  b64: string;
  ts: number;
};

const live = new Map<string, BtDevice>();

function framed() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function policyAllowsBluetooth() {
  if (typeof document === "undefined") return false;
  const doc = document as PolicyDoc;
  try {
    if (doc.permissionsPolicy?.allowsFeature) return doc.permissionsPolicy.allowsFeature("bluetooth");
    if (doc.featurePolicy?.allowsFeature) return doc.featurePolicy.allowsFeature("bluetooth");
  } catch {
    // ignore
  }
  return false;
}

export function bluetoothSupported() {
  if (typeof navigator === "undefined") return false;
  if ((navigator as BtNav).bluetooth) return true;
  // Chromium still pairs in a top-level window even when a parent frame hides the API.
  return /Chrome|Edg|Chromium|CriOS/i.test(navigator.userAgent);
}

/** True when this document can call requestDevice without opening another window. */
export function canPairInThisFrame() {
  const bt = typeof navigator !== "undefined" ? (navigator as BtNav).bluetooth : undefined;
  if (!bt) return false;
  if (!framed()) return true;
  return policyAllowsBluetooth();
}

export async function bluetoothReady(): Promise<"ready" | "adapter-off" | "blocked" | "unavailable"> {
  const bt = typeof navigator !== "undefined" ? (navigator as BtNav).bluetooth : undefined;
  if (!bt) return framed() ? "blocked" : "unavailable";
  if (framed() && !policyAllowsBluetooth()) return "blocked";
  try {
    const on = await bt.getAvailability?.();
    if (on === false) return "adapter-off";
  } catch {
    // getAvailability is optional
  }
  return "ready";
}

export type BluetoothDiagnose = {
  chrome: boolean;
  safari: boolean;
  ios: boolean;
  framed: boolean;
  api: boolean;
  policy: boolean;
  ready: "ready" | "adapter-off" | "blocked" | "unavailable";
  knownDevices: number;
  canPairHere: boolean;
};

export async function bluetoothDiagnose(): Promise<BluetoothDiagnose> {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const chrome = /Chrome|Edg|Chromium|CriOS/i.test(ua);
  const safari = /Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua);
  const ios = /iPhone|iPad|iPod/i.test(ua);
  const bt = typeof navigator !== "undefined" ? (navigator as BtNav).bluetooth : undefined;
  let knownDevices = 0;
  try {
    knownDevices = bt?.getDevices ? (await bt.getDevices()).length : 0;
  } catch {
    knownDevices = 0;
  }
  return {
    chrome,
    safari,
    ios,
    framed: framed(),
    api: Boolean(bt),
    policy: policyAllowsBluetooth(),
    ready: await bluetoothReady(),
    knownDevices,
    canPairHere: canPairInThisFrame(),
  };
}

export async function pingPrinter(bluetoothId: string) {
  const device = await deviceFor(bluetoothId);
  if (!device?.gatt) throw new Error("Printer is not paired on this tablet. Tap Pair Bluetooth on that printer card.");
  const server = await device.gatt.connect();
  if (!server.connected) throw new Error("The printer did not stay connected. Wake it, then tap Check connection.");
  return { name: device.name || "Printer", connected: true as const };
}

function remember(device: BtDevice): PairedPrinter {
  live.set(device.id, device);
  return {
    bluetoothId: device.id,
    bluetoothName: device.name || "Bluetooth printer",
  };
}

async function requestPair(bt: NonNullable<BtNav["bluetooth"]>): Promise<PairedPrinter> {
  let device: BtDevice;
  try {
    device = await bt.requestDevice({
      acceptAllDevices: true,
      optionalServices: OPTIONAL_SERVICES,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (!/filter|acceptAllDevices|TypeError/i.test(String(err)) && !/must provide/i.test(msg)) {
      throw err;
    }
    device = await bt.requestDevice({
      filters: [
        { namePrefix: "Printer" },
        { namePrefix: "POS" },
        { namePrefix: "MTP" },
        { namePrefix: "MPT" },
        { namePrefix: "RPP" },
        { namePrefix: "XP-" },
        { namePrefix: "Blue" },
        { namePrefix: "BT" },
        { namePrefix: "Inner" },
        { namePrefix: "Gooj" },
        { namePrefix: "Star" },
        { namePrefix: "TM-" },
        { namePrefix: "TSP" },
        { services: [NUS] },
        { services: [ISSC] },
        { services: [PRINT_SVC] },
      ],
      optionalServices: OPTIONAL_SERVICES,
    });
  }
  const paired = remember(device);
  try {
    if (device.gatt) await device.gatt.connect();
  } catch {
    // Pairing still succeeded; connect happens at print time.
  }
  return paired;
}

function openTopLevel(path: string): Window | null {
  const url = `${window.location.origin}${path}`;
  const name = "southend-printer-pair";
  let popup: Window | null = null;
  try {
    popup = window.open(url, name);
  } catch {
    popup = null;
  }
  if (popup) return popup;
  try {
    popup = window.open(url, name, "popup=yes,width=440,height=640");
  } catch {
    popup = null;
  }
  if (popup) return popup;
  const a = document.createElement("a");
  a.href = url;
  a.target = name;
  a.rel = "opener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return null;
}

type PairPayload = { type: "paired"; bluetoothId: string; bluetoothName: string };
type PrintedPayload = { type: "printed" };
type PrintErrorPayload = { type: "print-error"; error: string };

function pairViaTopLevelWindow(): Promise<PairedPrinter> {
  return new Promise((resolve, reject) => {
    const popup = openTopLevel(PRINTER_PAIR_PATH);
    let settled = false;
    const finish = (ok: PairedPrinter | null, error?: string) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      window.clearInterval(watch);
      window.clearTimeout(timer);
      try {
        ch.close();
      } catch {
        // ignore
      }
      if (ok) resolve(ok);
      else reject(new Error(error || "Pairing window closed before a printer was chosen."));
    };

    const onPayload = (data: unknown) => {
      const d = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      if (!d || d.type !== "paired") return;
      const bluetoothId = String(d.bluetoothId || "");
      const bluetoothName = String(d.bluetoothName || "Bluetooth printer");
      if (!bluetoothId) return;
      finish({ bluetoothId, bluetoothName });
      try {
        popup?.close();
      } catch {
        // ignore
      }
    };

    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      onPayload(ev.data);
    };

    const ch = new BroadcastChannel(PRINTER_PAIR_CHANNEL);
    ch.addEventListener("message", (ev) => onPayload(ev.data));
    window.addEventListener("message", onMessage);

    const watch = window.setInterval(() => {
      if (popup && popup.closed) finish(null, "Pairing window closed before a printer was chosen.");
    }, 400);
    const timer = window.setTimeout(() => {
      finish(null, "Pairing timed out. Tap Pair Bluetooth printer and choose the printer again.");
    }, 120000);
  });
}

export async function pairBluetoothPrinter() {
  const bt = typeof navigator !== "undefined" ? (navigator as BtNav).bluetooth : undefined;
  // Open the top-level window on this click. Awaiting requestDevice first in a
  // blocked iframe burns the user gesture and the popup never appears.
  if (!canPairInThisFrame()) {
    if (typeof window === "undefined") {
      throw new Error("Bluetooth is not available in this browser. Use Chrome or Edge on the shop tablet.");
    }
    return pairViaTopLevelWindow();
  }
  if (!bt) {
    throw new Error("Bluetooth is not available in this browser. Use Chrome or Edge on the shop tablet.");
  }
  return requestPair(bt);
}

/** Used by the top-level pairing page. */
export async function pairBluetoothPrinterHere() {
  const bt = (navigator as BtNav).bluetooth;
  if (!bt) {
    throw new Error("Bluetooth is not available in this browser. Use Chrome or Edge on the shop tablet.");
  }
  return requestPair(bt);
}

export function publishPairedPrinter(paired: PairedPrinter) {
  const payload: PairPayload = { type: "paired", ...paired };
  try {
    const ch = new BroadcastChannel(PRINTER_PAIR_CHANNEL);
    ch.postMessage(payload);
    ch.close();
  } catch {
    // ignore
  }
  try {
    window.opener?.postMessage(payload, window.location.origin);
  } catch {
    // ignore
  }
}

export function subscribePairedPrinter(onPaired: (paired: PairedPrinter) => void) {
  if (typeof window === "undefined") return () => {};
  const onPayload = (data: unknown) => {
    const d = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
    if (!d || d.type !== "paired") return;
    const bluetoothId = String(d.bluetoothId || "");
    if (!bluetoothId) return;
    onPaired({
      bluetoothId,
      bluetoothName: String(d.bluetoothName || "Bluetooth printer"),
    });
  };
  const onMessage = (ev: MessageEvent) => {
    if (ev.origin !== window.location.origin) return;
    onPayload(ev.data);
  };
  let ch: BroadcastChannel | null = null;
  try {
    ch = new BroadcastChannel(PRINTER_PAIR_CHANNEL);
    ch.addEventListener("message", (ev) => onPayload(ev.data));
  } catch {
    ch = null;
  }
  window.addEventListener("message", onMessage);
  return () => {
    window.removeEventListener("message", onMessage);
    try {
      ch?.close();
    } catch {
      // ignore
    }
  };
}

function uint8ToB64(bytes: Uint8Array) {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

function b64ToUint8(s: string) {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

export function stashPrintJob(bluetoothId: string, bytes: Uint8Array) {
  const job: PrintJob = { bluetoothId, b64: uint8ToB64(bytes), ts: Date.now() };
  try {
    localStorage.setItem(PRINT_JOB_KEY, JSON.stringify(job));
  } catch {
    // ignore
  }
  return job;
}

export function takePrintJob(): PrintJob | null {
  try {
    const raw = localStorage.getItem(PRINT_JOB_KEY);
    if (!raw) return null;
    localStorage.removeItem(PRINT_JOB_KEY);
    const job = JSON.parse(raw) as PrintJob;
    if (!job?.bluetoothId || !job.b64) return null;
    if (Date.now() - Number(job.ts || 0) > 60_000) return null;
    return job;
  } catch {
    return null;
  }
}

export function bytesFromPrintJob(job: PrintJob) {
  return b64ToUint8(job.b64);
}

function publishPrintResult(ok: boolean, error?: string) {
  const payload: PrintedPayload | PrintErrorPayload = ok
    ? { type: "printed" }
    : { type: "print-error", error: error || "Bluetooth print failed" };
  try {
    const ch = new BroadcastChannel(PRINTER_PAIR_CHANNEL);
    ch.postMessage(payload);
    ch.close();
  } catch {
    // ignore
  }
  try {
    window.opener?.postMessage(payload, window.location.origin);
  } catch {
    // ignore
  }
}

export function notifyPrintResult(ok: boolean, error?: string) {
  publishPrintResult(ok, error);
}

async function deviceFor(id: string): Promise<BtDevice | null> {
  const cached = live.get(id);
  if (cached) return cached;
  const bt = (navigator as BtNav).bluetooth;
  if (!bt?.getDevices) return null;
  const list = await bt.getDevices();
  const found = list.find((d) => d.id === id) ?? null;
  if (found) live.set(id, found);
  return found;
}

async function writableChar(server: GattServer): Promise<GattChar> {
  const tryService = async (uuid: string, charUuid?: string) => {
    try {
      const svc = await server.getPrimaryService(uuid);
      if (charUuid) return await svc.getCharacteristic(charUuid);
      const chars = await svc.getCharacteristics();
      const w = chars.find((c) => c.properties.writeWithoutResponse || c.properties.write);
      if (w) return w;
    } catch {
      return null;
    }
    return null;
  };
  for (const uuid of OPTIONAL_SERVICES) {
    for (const charUuid of WRITE_CHARS) {
      const hit = await tryService(uuid, charUuid);
      if (hit) return hit;
    }
    const any = await tryService(uuid);
    if (any) return any;
  }
  const services = await server.getPrimaryServices();
  for (const svc of services) {
    const chars = await svc.getCharacteristics();
    const w = chars.find((c) => c.properties.writeWithoutResponse || c.properties.write);
    if (w) return w;
  }
  throw new Error("That printer did not expose a writable Bluetooth characteristic.");
}

async function writeChunks(char: GattChar, bytes: Uint8Array) {
  const size = 20;
  for (let i = 0; i < bytes.length; i += size) {
    const chunk = bytes.slice(i, i + size);
    if (char.writeValueWithoutResponse) await char.writeValueWithoutResponse(chunk);
    else await char.writeValue(chunk);
    await new Promise((r) => setTimeout(r, 20));
  }
}

async function printEscPosHere(bluetoothId: string, bytes: Uint8Array) {
  const device = await deviceFor(bluetoothId);
  if (!device?.gatt) throw new Error("Printer is not paired on this device.");
  const gatt = device.gatt;
  const server = await gatt.connect();
  const char = await writableChar(server);
  await writeChunks(char, bytes);
}

function printViaTopLevelWindow(bluetoothId: string, bytes: Uint8Array): Promise<void> {
  stashPrintJob(bluetoothId, bytes);
  const popup = openTopLevel(`${PRINTER_PAIR_PATH}?print=1`);
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (ok: boolean, error?: string) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      window.clearInterval(watch);
      window.clearTimeout(timer);
      try {
        ch.close();
      } catch {
        // ignore
      }
      if (ok) resolve();
      else reject(new Error(error || "Print window closed before the ticket was sent."));
    };
    const onPayload = (data: unknown) => {
      const d = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      if (!d) return;
      if (d.type === "printed") finish(true);
      if (d.type === "print-error") finish(false, String(d.error || "Bluetooth print failed"));
    };
    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      onPayload(ev.data);
    };
    const ch = new BroadcastChannel(PRINTER_PAIR_CHANNEL);
    ch.addEventListener("message", (ev) => onPayload(ev.data));
    window.addEventListener("message", onMessage);
    const watch = window.setInterval(() => {
      if (popup && popup.closed) finish(false, "Print window closed before the ticket was sent.");
    }, 400);
    const timer = window.setTimeout(() => {
      finish(false, "Print timed out. Tap Test print again with the printer on.");
    }, 45000);
  });
}

export async function printEscPos(bluetoothId: string, bytes: Uint8Array) {
  const bt = typeof navigator !== "undefined" ? (navigator as BtNav).bluetooth : undefined;
  if (bt && (!framed() || policyAllowsBluetooth())) {
    try {
      await printEscPosHere(bluetoothId, bytes);
      return;
    } catch (err) {
      if (!framed()) throw err;
    }
  }
  if (framed() && typeof window !== "undefined") {
    await printViaTopLevelWindow(bluetoothId, bytes);
    return;
  }
  if (!bt) {
    throw new Error("Bluetooth is not available in this browser. Use Chrome or Edge on the shop tablet.");
  }
  throw new Error("Printer is not paired on this device.");
}

function openFallbackWindow(slips: { title: string; body: string }[]) {
  const html = `<!doctype html><html><head><title>Receipts</title>
<style>
  @page { size: 80mm auto; margin: 6mm; }
  body { background: #fbf6ec; color: #1a1410; font: 13px/1.35 ui-monospace, Menlo, Consolas, monospace; margin: 0; }
  .slip { width: 72mm; margin: 12px auto; white-space: pre; background: #fff; padding: 10px 12px; border: 1px dashed #c9b79a; }
  .kind { letter-spacing: .12em; text-transform: uppercase; font-size: 11px; color: #9a221c; }
  @media print { body { background: #fff; } .slip { border: 0; page-break-after: always; } }
</style></head><body>
${slips
  .map(
    (s) =>
      `<section class="slip"><div class="kind">${escapeHtml(s.title)}</div><pre>${escapeHtml(s.body)}</pre></section>`,
  )
  .join("")}
<script>window.onload=function(){setTimeout(function(){window.print()},150)}</script>
</body></html>`;
  const w = window.open("", "receipts", "width=420,height=720");
  if (!w) throw new Error("Allow pop-ups to print a paper copy.");
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export async function printOrderReceipts(opts: {
  order: OrderView;
  restaurant: RestaurantInfo;
  receipt: ReceiptOptions;
  printers: PrinterProfile[];
  taxRate: number;
  kinds?: ReceiptKind[];
  fallback?: boolean;
}) {
  const kinds = opts.kinds ?? (["customer", "store"] as ReceiptKind[]);
  const jobs = jobsForPrinters(opts.printers, kinds);
  if (!jobs.length) throw new Error("No enabled printers with a customer or store copy selected.");

  const slips: { title: string; body: string }[] = [];
  const errors: string[] = [];

  for (const job of jobs) {
    const body = buildReceiptText({
      order: opts.order,
      restaurant: opts.restaurant,
      receipt: opts.receipt,
      kind: job.kind,
      taxRate: opts.taxRate,
      paper: job.printer.paper,
    });
    const title = `${job.printer.name} · ${job.kind === "store" ? "Store copy" : "Customer copy"}`;
    if (job.printer.lanHost) {
      try {
        await printLanReceipt(job.printer, body);
        continue;
      } catch (e) {
        errors.push(`${job.printer.name}: ${e instanceof Error ? e.message : "LAN print failed"}`);
      }
    }
    if (job.printer.bluetoothId) {
      try {
        await printEscPos(job.printer.bluetoothId, textToEscPos(body));
        continue;
      } catch (e) {
        errors.push(
          `${job.printer.name}: ${e instanceof Error ? e.message : "Bluetooth print failed"}`,
        );
      }
    }
    slips.push({ title, body });
  }

  if (slips.length && opts.fallback !== false) openFallbackWindow(slips);
  if (errors.length && !slips.length) throw new Error(errors.join(" "));
  return { printed: jobs.length, fallback: slips.length, errors };
}
