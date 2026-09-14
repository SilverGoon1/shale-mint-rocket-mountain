import { useEffect, useMemo, useRef, useState } from "react";
import { Bluetooth, CircleAlert, CircleCheck, HelpCircle, Plus, Printer, RefreshCw, Trash2 } from "lucide-react";
import {
  bluetoothDiagnose,
  bluetoothReady,
  bluetoothSupported,
  pairBluetoothPrinter,
  pingPrinter,
  printOrderReceipts,
  subscribePairedPrinter,
  type BluetoothDiagnose,
  type PairedPrinter,
} from "@/lib/bluetooth-printer";
import { testLanPrint } from "@/lib/lan-printer";
import type { RestaurantInfo } from "@/data/menu";
import { buildReceiptText, sampleOrder } from "@/lib/receipt";
import type { PrinterProfile, ReceiptOptions } from "@/lib/shop-types";
import { newPrinter } from "@/lib/shop-types";

const STEPS = [
  {
    title: "Stay on shop Wi-Fi",
    body: "The Epson talks over the shop network (HTTP 8008 or HTTPS 8043). Enter the printer IP from this tablet, then Test print. Hardware buy is still on hold — save the IP when the printer is on the counter.",
  },
  {
    title: "HTTPS tablets may need the printer certificate",
    body: "This shop is HTTPS. A browser can block HTTP 8008 as mixed content. Prefer the printer’s HTTPS 8043 once its certificate is trusted on this tablet.",
  },
  {
    title: "Bluetooth is a fallback only",
    body: "Chrome or Edge on Android or Windows can pair a spare BLE printer. Safari and iPhone cannot. Completes never wait on a print failure.",
  },
  {
    title: "Test print, then accept an order",
    body: "Tap Test print. If a paper preview opens instead, the tablet is not talking to the printer yet. Auto-print on accept uses the same path and still never blocks Completes.",
  },
] as const;

function hintFor(msg: string, diag: BluetoothDiagnose | null) {
  const d = diag;
  if (d?.ios || d?.safari) {
    return "This tablet’s browser cannot pair a Bluetooth printer. Open the shop in Chrome or Edge on Android or Windows.";
  }
  if (d?.ready === "adapter-off") return "Turn Bluetooth on in this tablet’s settings, then tap Diagnose.";
  if (d?.ready === "unavailable") return "This browser has no Bluetooth printer API. Open the shop in Chrome or Edge.";
  if (d?.ready === "blocked") return "Pairing opens a top window so the tablet chooser can appear. Keep that window in front.";
  if (/cancel/i.test(msg)) return "The chooser was closed. Tap Pair again and pick the thermal printer.";
  if (/not paired/i.test(msg)) return "This tablet forgot the printer. Tap Pair Bluetooth on that printer card.";
  if (/characteristic/i.test(msg)) return "Connected, but the printer did not expose a print channel. Re-pair while it is awake and in range.";
  if (/pop-?up/i.test(msg)) return "Allow pop-ups for this shop, then tap Test print or Pair again.";
  if (/timed out/i.test(msg)) return "The printer slept or walked away. Wake it, stay close, then try again.";
  if (/not available/i.test(msg)) return "Use Chrome or Edge on the shop tablet — not the phone preview.";
  return "";
}

export function PrinterSetup({
  printers,
  setPrinters,
  receipt,
  setReceipt,
  restaurant,
  taxRate,
  onSave,
  saving,
}: {
  printers: PrinterProfile[];
  setPrinters: (next: PrinterProfile[]) => void;
  receipt: ReceiptOptions;
  setReceipt: (next: ReceiptOptions) => void;
  restaurant: RestaurantInfo;
  taxRate: number;
  onSave: () => void;
  saving?: boolean;
}) {
  const [busyId, setBusyId] = useState("");
  const [pairMsg, setPairMsg] = useState("");
  const [btState, setBtState] = useState<"ready" | "adapter-off" | "blocked" | "unavailable" | "">("");
  const [diag, setDiag] = useState<BluetoothDiagnose | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const printersRef = useRef(printers);
  printersRef.current = printers;
  const pendingRef = useRef<PrinterProfile | undefined>(undefined);
  const sample = useMemo(() => sampleOrder(), []);
  const customerPreview = buildReceiptText({
    order: sample,
    restaurant,
    receipt,
    kind: "customer",
    taxRate,
    paper: "58mm",
  });
  const storePreview = buildReceiptText({
    order: sample,
    restaurant,
    receipt,
    kind: "store",
    taxRate,
    paper: "58mm",
  });
  const bt = bluetoothSupported();
  const hint = hintFor(pairMsg, diag);

  function runDiagnose() {
    void bluetoothDiagnose()
      .then((d) => {
        setDiag(d);
        setBtState(d.ready);
        if (d.ios || d.safari) {
          setPairMsg("This browser cannot pair a Bluetooth printer. Use Chrome or Edge on the shop tablet.");
        } else if (d.ready === "adapter-off") {
          setPairMsg("Bluetooth is off on this tablet.");
        } else if (d.ready === "unavailable") {
          setPairMsg("Bluetooth printing is not available in this browser.");
        } else if (d.ready === "blocked") {
          setPairMsg("Pairing will open a top window so the tablet chooser can appear.");
        } else {
          setPairMsg(
            d.knownDevices
              ? `Bluetooth is ready. This tablet already knows ${d.knownDevices} printer${d.knownDevices === 1 ? "" : "s"}.`
              : "Bluetooth is ready. Tap Pair and pick the thermal printer.",
          );
        }
      })
      .catch((e) => setPairMsg(e instanceof Error ? e.message : "Could not diagnose Bluetooth."));
  }

  useEffect(() => {
    void bluetoothReady().then(setBtState);
    void bluetoothDiagnose().then(setDiag);
  }, []);

  function applyPaired(paired: PairedPrinter, existing?: PrinterProfile) {
    const list = printersRef.current;
    let next = list;
    if (existing) {
      next = list.map((p) =>
        p.id === existing.id
          ? {
              ...p,
              bluetoothId: paired.bluetoothId,
              bluetoothName: paired.bluetoothName,
              name: p.name === "Receipt printer" ? paired.bluetoothName : p.name,
            }
          : p,
      );
    } else if (list.some((p) => p.bluetoothId === paired.bluetoothId)) {
      next = list.map((p) =>
        p.bluetoothId === paired.bluetoothId ? { ...p, bluetoothName: paired.bluetoothName } : p,
      );
    } else {
      next = [
        ...list,
        newPrinter({
          name: paired.bluetoothName,
          bluetoothId: paired.bluetoothId,
          bluetoothName: paired.bluetoothName,
        }),
      ];
    }
    printersRef.current = next;
    setPrinters(next);
    setPairMsg(`Paired ${paired.bluetoothName}. Save to keep it on this shop.`);
  }

  useEffect(() => {
    return subscribePairedPrinter((paired) => {
      applyPaired(paired, pendingRef.current);
      setBusyId("");
    });
  }, [setPrinters]);

  function patch(id: string, next: Partial<PrinterProfile>) {
    setPrinters(printers.map((p) => (p.id === id ? { ...p, ...next } : p)));
  }

  async function pair(existing?: PrinterProfile) {
    setPairMsg("");
    setBusyId(existing?.id || "new");
    pendingRef.current = existing;
    try {
      const paired = await pairBluetoothPrinter();
      applyPaired(paired, existing);
    } catch (e) {
      setPairMsg(e instanceof Error ? e.message : "Could not pair the printer.");
      setHelpOpen(true);
    } finally {
      setBusyId("");
      pendingRef.current = undefined;
    }
  }

  async function testPrint(printer: PrinterProfile) {
    setBusyId(printer.id);
    setPairMsg("");
    try {
      if (printer.lanHost) {
        await testLanPrint(printer);
        setPairMsg(`Sent a LAN test slip to ${printer.name} at ${printer.lanHost}.`);
        return;
      }
      const result = await printOrderReceipts({
        order: sample,
        restaurant,
        receipt,
        printers: [printer],
        taxRate,
        fallback: true,
      });
      setPairMsg(
        result.fallback
          ? `Opened a paper preview for ${printer.name}. Set a LAN IP or pair Bluetooth to send it to the thermal printer.`
          : `Sent a test ticket to ${printer.name}.`,
      );
      if (result.fallback) setHelpOpen(true);
    } catch (e) {
      setPairMsg(e instanceof Error ? e.message : "Test print failed.");
      setHelpOpen(true);
    } finally {
      setBusyId("");
    }
  }

  async function checkConnection(printer: PrinterProfile) {
    if (!printer.bluetoothId) {
      setPairMsg("This printer is not paired on this tablet yet. Tap Pair Bluetooth.");
      setHelpOpen(true);
      return;
    }
    setBusyId(printer.id);
    setPairMsg("");
    try {
      const r = await pingPrinter(printer.bluetoothId);
      setPairMsg(`Connected to ${r.name}. Try a test print next.`);
    } catch (e) {
      setPairMsg(e instanceof Error ? e.message : "Could not reach the printer.");
      setHelpOpen(true);
    } finally {
      setBusyId("");
    }
  }

  const statusLine =
    btState === "adapter-off"
      ? "Turn Bluetooth on on this tablet, then tap Pair."
      : btState === "unavailable"
        ? "Chrome or Edge on the shop tablet is required to reach the printer."
        : btState === "blocked"
          ? "Bluetooth is allowed on this shop. Pairing opens in its own window so the tablet chooser can appear."
          : "Bluetooth is allowed on this shop. Tap Pair, pick the thermal printer, then save. Chrome or Edge on the shop tablet is required.";

  return (
    <div className="printer-setup">
      <section className="page-card">
        <h2>Printer setup</h2>
        <p className="ed-sub">
          Primary path is Wi-Fi / LAN (Epson ePOS, port 8008 or HTTPS 8043). Enter the printer IP from this shop
          tablet on the shop network, then Test print. Bluetooth is a fallback for Chrome/Android only — iPhone
          cannot print over Bluetooth from the browser.
        </p>
        <p className="ed-sub">{statusLine}</p>
        {diag ? (
          <ul className="bt-diag" aria-label="Bluetooth status">
            <li data-ok={diag.chrome && !diag.ios && !diag.safari}>
              {diag.chrome && !diag.ios && !diag.safari ? <CircleCheck size={14} /> : <CircleAlert size={14} />}
              {diag.ios || diag.safari ? "Need Chrome or Edge" : "Chrome or Edge"}
            </li>
            <li data-ok={diag.ready === "ready" || diag.ready === "blocked"}>
              {diag.ready === "adapter-off" ? <CircleAlert size={14} /> : <CircleCheck size={14} />}
              {diag.ready === "adapter-off" ? "Bluetooth off" : diag.ready === "unavailable" ? "No Bluetooth API" : "Bluetooth on"}
            </li>
            <li data-ok={diag.canPairHere}>
              {diag.canPairHere ? <CircleCheck size={14} /> : <HelpCircle size={14} />}
              {diag.canPairHere ? "Can pair here" : "Pairs in a top window"}
            </li>
            <li data-ok={diag.knownDevices > 0}>
              <Printer size={14} />
              {diag.knownDevices} remembered
            </li>
          </ul>
        ) : null}
        <div className="printer-actions">
          <button type="button" className="ed-btn" onClick={runDiagnose} disabled={Boolean(busyId)}>
            <RefreshCw size={16} strokeWidth={2.2} />
            Diagnose
          </button>
          <button type="button" className="ed-btn" onClick={() => setHelpOpen((v) => !v)} aria-expanded={helpOpen}>
            <HelpCircle size={16} strokeWidth={2.2} />
            {helpOpen ? "Hide troubleshooting" : "Troubleshooting"}
          </button>
        </div>
        {helpOpen ? (
          <ol className="printer-help">
            {STEPS.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                <span>{step.body}</span>
              </li>
            ))}
          </ol>
        ) : null}
        <label className="ed-field">
          <span>NJ sales tax ID (printed on receipts)</span>
          <input
            className="ed-input"
            value={receipt.taxId}
            onChange={(e) => setReceipt({ ...receipt, taxId: e.target.value })}
            placeholder="Certificate of Authority number"
          />
        </label>
        <label className="ed-field">
          <span>Customer-copy footer</span>
          <textarea
            className="ed-input ed-area"
            rows={2}
            value={receipt.footer}
            onChange={(e) => setReceipt({ ...receipt, footer: e.target.value })}
          />
        </label>
        <label className="pay-opt">
          <input
            type="checkbox"
            checked={receipt.autoPrintOnAccept}
            onChange={(e) => setReceipt({ ...receipt, autoPrintOnAccept: e.target.checked })}
          />
          Print automatically when an order is accepted
        </label>
        <div className="printer-actions">
          {bt ? (
            <button type="button" className="btn-print" onClick={() => void pair()} disabled={Boolean(busyId)}>
              <Bluetooth size={16} strokeWidth={2.2} />
              {busyId === "new" ? "Waiting for printer…" : "Pair Bluetooth fallback"}
            </button>
          ) : null}
          <button
            type="button"
            className="ed-btn"
            onClick={() => setPrinters([...printers, newPrinter({ name: `Printer ${printers.length + 1}` })])}
          >
            <Plus size={16} strokeWidth={2.2} />
            Add printer
          </button>
        </div>
        {pairMsg ? <p className="ed-sub">{pairMsg}</p> : null}
        {hint ? <p className="ed-sub printer-hint">{hint}</p> : null}
        {!bt ? <p className="ed-sub">If the chooser does not appear, pairing opens in its own window.</p> : null}
      </section>

      {printers.length === 0 ? (
        <section className="page-card">
          <p className="ed-empty">No printers yet. Add one and enter the Epson IP, or pair Bluetooth as a fallback.</p>
        </section>
      ) : (
        printers.map((printer) => (
          <section className="page-card printer-card" key={printer.id}>
            <div className="printer-card-head">
              <Printer size={18} strokeWidth={2.2} />
              <label className="ed-field">
                <span>Printer name</span>
                <input
                  className="ed-input"
                  value={printer.name}
                  onChange={(e) => patch(printer.id, { name: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="ed-btn ed-btn-danger"
                onClick={() => setPrinters(printers.filter((p) => p.id !== printer.id))}
                aria-label={`Remove ${printer.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p className="ed-sub">
              {printer.lanHost
                ? `LAN: ${printer.lanProtocol}://${printer.lanHost}:${printer.lanPort}`
                : "No LAN IP yet — add it for the shop Wi-Fi printer."}
              {printer.bluetoothId
                ? ` · Bluetooth fallback: ${printer.bluetoothName || printer.bluetoothId}`
                : bt
                  ? " · Bluetooth fallback not paired."
                  : ""}
            </p>
            <div className="account-cityzip">
              <label className="ed-field">
                <span>Printer IP (shop Wi-Fi)</span>
                <input
                  className="ed-input"
                  value={printer.lanHost}
                  onChange={(e) => patch(printer.id, { lanHost: e.target.value })}
                  placeholder="192.168.1.50"
                  inputMode="decimal"
                  autoComplete="off"
                />
              </label>
              <label className="ed-field">
                <span>Protocol</span>
                <select
                  className="ed-input"
                  value={printer.lanProtocol === "https" ? "https" : "http"}
                  onChange={(e) => {
                    const https = e.target.value === "https";
                    patch(printer.id, {
                      lanProtocol: https ? "https" : "http",
                      lanPort: https ? 8043 : 8008,
                    });
                  }}
                >
                  <option value="http">HTTP · 8008</option>
                  <option value="https">HTTPS · 8043</option>
                </select>
              </label>
            </div>
            <p className="ed-sub">
              Test print from this tablet on shop Wi-Fi. Completes never wait on a print failure. Hardware buy is
              still on hold — save the IP whenever the Epson is on the counter.
            </p>
            <label className="pay-opt">
              <input
                type="checkbox"
                checked={printer.enabled}
                onChange={(e) => patch(printer.id, { enabled: e.target.checked })}
              />
              Enabled
            </label>
            <div className="printer-copies">
              <label className="pay-opt">
                <input
                  type="checkbox"
                  checked={printer.customerCopy}
                  onChange={(e) => patch(printer.id, { customerCopy: e.target.checked })}
                />
                Customer copy
              </label>
              <label className="pay-opt">
                <input
                  type="checkbox"
                  checked={printer.storeCopy}
                  onChange={(e) => patch(printer.id, { storeCopy: e.target.checked })}
                />
                Store copy
              </label>
              <label className="ed-field">
                <span>Copies of each</span>
                <select
                  className="ed-input"
                  value={printer.copies}
                  onChange={(e) => patch(printer.id, { copies: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ed-field">
                <span>Paper</span>
                <select
                  className="ed-input"
                  value={printer.paper}
                  onChange={(e) => patch(printer.id, { paper: e.target.value as PrinterProfile["paper"] })}
                >
                  <option value="58mm">58 mm</option>
                  <option value="80mm">80 mm</option>
                </select>
              </label>
            </div>
            <div className="printer-actions">
              {bt ? (
                <button
                  type="button"
                  className="ed-btn"
                  disabled={Boolean(busyId)}
                  onClick={() => void pair(printer)}
                >
                  <Bluetooth size={16} strokeWidth={2.2} />
                  {printer.bluetoothId ? "Re-pair Bluetooth fallback" : "Pair Bluetooth fallback"}
                </button>
              ) : null}
              {bt && printer.bluetoothId ? (
                <button
                  type="button"
                  className="ed-btn"
                  disabled={Boolean(busyId)}
                  onClick={() => void checkConnection(printer)}
                >
                  Check Bluetooth
                </button>
              ) : null}
              <button
                type="button"
                className="ed-btn"
                disabled={Boolean(busyId) || busyId === printer.id}
                onClick={() => void testPrint(printer)}
              >
                Test print
              </button>
            </div>
          </section>
        ))
      )}

      <div className="receipt-previews">
        <article className="slip">
          <p className="slip-kind">Customer copy</p>
          <pre>{customerPreview}</pre>
        </article>
        <article className="slip">
          <p className="slip-kind">Store copy</p>
          <pre>{storePreview}</pre>
        </article>
      </div>

      <button type="button" className="btn-print" disabled={saving} onClick={onSave}>
        {saving ? "Saving…" : "Save printer setup"}
      </button>
    </div>
  );
}
