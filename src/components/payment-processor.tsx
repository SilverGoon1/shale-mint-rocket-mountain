import { useMemo, useState } from "react";
import { PROCESSOR_CATALOG } from "@/lib/payment-catalog";
import { savePaymentProcessors } from "@/lib/shop-server";
import {
  anyProcessorLive,
  defaultPaymentAccounts,
  type ProcessorAccountPublic,
  type ProcessorId,
  type ProcessorSecretStatus,
} from "@/lib/shop-types";

type DraftSecrets = Partial<Record<ProcessorId, { secretKey: string; webhookSecret: string }>>;

function statusLabel(acc: ProcessorAccountPublic, secret: ProcessorSecretStatus | undefined) {
  const hasPub = acc.publishableKey.trim().length > 0;
  const hasSecret = Boolean(secret?.secretConfigured);
  if (!hasPub && !hasSecret) return { text: "Not connected", tone: "off" as const };
  if (acc.enabled && acc.live && hasPub && hasSecret) return { text: "Live", tone: "live" as const };
  if (acc.environment === "live") return { text: "Keys saved (live)", tone: "keys" as const };
  return { text: "Keys saved (sandbox)", tone: "keys" as const };
}

function canGoLive(acc: ProcessorAccountPublic, secret: ProcessorSecretStatus | undefined, draft: { secretKey: string } | undefined) {
  const hasPub = acc.publishableKey.trim().length > 0;
  const hasSecret = Boolean(secret?.secretConfigured) || Boolean(draft?.secretKey.trim());
  return hasPub && hasSecret;
}

export function PaymentProcessorPanel({
  accounts,
  setAccounts,
  secretStatus,
  setSecretStatus,
  onSaved,
}: {
  accounts: ProcessorAccountPublic[];
  setAccounts: (next: ProcessorAccountPublic[]) => void;
  secretStatus: ProcessorSecretStatus[];
  setSecretStatus: (next: ProcessorSecretStatus[]) => void;
  onSaved?: (msg: string) => void;
}) {
  const list = accounts.length ? accounts : defaultPaymentAccounts();
  const [draft, setDraft] = useState<DraftSecrets>({});
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");

  const statusById = useMemo(() => {
    const m = new Map<ProcessorId, ProcessorSecretStatus>();
    for (const s of secretStatus) m.set(s.id, s);
    return m;
  }, [secretStatus]);

  function patch(id: ProcessorId, next: Partial<ProcessorAccountPublic>) {
    setAccounts(list.map((a) => (a.id === id ? { ...a, ...next } : a)));
  }

  function patchSecret(id: ProcessorId, key: "secretKey" | "webhookSecret", value: string) {
    setDraft((cur) => ({
      ...cur,
      [id]: {
        secretKey: cur[id]?.secretKey ?? "",
        webhookSecret: cur[id]?.webhookSecret ?? "",
        [key]: value,
      },
    }));
  }

  async function save(which: ProcessorId | "all") {
    setBusy(which);
    setError("");
    const secrets: Record<string, { secretKey?: string; webhookSecret?: string }> = {};
    const ids = which === "all" ? list.map((a) => a.id) : [which];
    for (const id of ids) {
      const d = draft[id];
      if (!d) continue;
      const payload: { secretKey?: string; webhookSecret?: string } = {};
      if (d.secretKey.trim()) payload.secretKey = d.secretKey.trim();
      if (d.webhookSecret.trim()) payload.webhookSecret = d.webhookSecret.trim();
      if (payload.secretKey || payload.webhookSecret) secrets[id] = payload;
    }
    try {
      const res = await savePaymentProcessors({
        data: {
          accounts: list,
          secrets,
        },
      });
      setAccounts(res.accounts);
      setSecretStatus(res.secretStatus);
      setDraft((cur) => {
        const next = { ...cur };
        for (const id of ids) delete next[id];
        return next;
      });
      onSaved?.(which === "all" ? "All processors saved." : `${PROCESSOR_CATALOG.find((c) => c.id === which)?.name ?? "Processor"} saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save processors.");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      {PROCESSOR_CATALOG.map((cat) => {
        const acc = list.find((a) => a.id === cat.id) ?? list[0];
        const secret = statusById.get(cat.id);
        const pill = statusLabel(acc, secret);
        const liveOk = canGoLive(acc, secret, draft[cat.id]);
        return (
          <section key={cat.id} className="page-card processor-card">
            <header className="processor-card-head">
              <div>
                <h2>
                  {cat.name}
                  {cat.recommended ? <em className="processor-rec">Recommended</em> : null}
                </h2>
                <p className="ed-sub">{cat.rate}</p>
              </div>
              <span className="processor-pill" data-tone={pill.tone}>
                {pill.text}
              </span>
            </header>
            <p className="ed-sub">{cat.blurb}</p>
            <p className="ed-sub">Methods: {cat.methods}</p>
            {cat.defaultOffNote ? <p className="ed-sub processor-note">{cat.defaultOffNote}</p> : null}

            <label className="pay-opt">
              <input
                type="checkbox"
                checked={acc.enabled}
                onChange={(e) => patch(cat.id, { enabled: e.target.checked })}
              />
              Enable at checkout
            </label>
            <label className="pay-opt" title={liveOk ? undefined : "Paste a publishable key and secret first"}>
              <input
                type="checkbox"
                checked={acc.live}
                disabled={!liveOk}
                onChange={(e) => patch(cat.id, { live: e.target.checked })}
              />
              Live — actually charge (needs keys)
            </label>

            <label className="ed-field">
              <span>Environment</span>
              <select
                className="ed-input"
                value={acc.environment}
                onChange={(e) => patch(cat.id, { environment: e.target.value === "live" ? "live" : "sandbox" })}
              >
                <option value="sandbox">Sandbox</option>
                <option value="live">Live</option>
              </select>
            </label>

            {cat.fields.map((field) => {
              if (field.secret) {
                const val = draft[cat.id]?.[field.key === "webhookSecret" ? "webhookSecret" : "secretKey"] ?? "";
                const mask =
                  field.key === "webhookSecret" ? secret?.webhookMask : secret?.secretMask;
                const usingEnv =
                  field.key !== "webhookSecret" && secret?.usingEnv
                    ? "Using env var"
                    : mask;
                return (
                  <label key={field.key} className="ed-field">
                    <span>{field.label}</span>
                    <input
                      className="ed-input"
                      type="password"
                      autoComplete="off"
                      value={val}
                      placeholder={usingEnv || field.placeholder}
                      onChange={(e) =>
                        patchSecret(cat.id, field.key === "webhookSecret" ? "webhookSecret" : "secretKey", e.target.value)
                      }
                    />
                  </label>
                );
              }
              const publicKey = field.key === "merchantId" ? "merchantId" : field.key === "statementDescriptor" ? "statementDescriptor" : "publishableKey";
              return (
                <label key={field.key} className="ed-field">
                  <span>{field.label}</span>
                  <input
                    className="ed-input"
                    value={acc[publicKey]}
                    placeholder={field.placeholder}
                    onChange={(e) => patch(cat.id, { [publicKey]: e.target.value })}
                  />
                </label>
              );
            })}

            <div className="processor-methods">
              {(
                [
                  ["allowCard", "Card"],
                  ["allowApplePay", "Apple Pay"],
                  ["allowGooglePay", "Google Pay"],
                  ["allowAch", "ACH"],
                  ["allowTerminal", "Terminal"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="pay-opt">
                  <input
                    type="checkbox"
                    checked={acc[key]}
                    onChange={(e) => patch(cat.id, { [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>

            <button
              type="button"
              className="btn-print"
              disabled={Boolean(busy)}
              onClick={() => void save(cat.id)}
            >
              {busy === cat.id ? "Saving…" : `Save ${cat.name}`}
            </button>
          </section>
        );
      })}

      <section className="page-card processor-card">
        <header className="processor-card-head">
          <div>
            <h2>Cash / pay at pickup</h2>
            <p className="ed-sub">Always available. No keys.</p>
          </div>
          <span className="processor-pill" data-tone="live">
            Always on
          </span>
        </header>
        <p className="ed-sub">Pay at pickup and cash on delivery stay on checkout even when a card processor is connected.</p>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      <button
        type="button"
        className="btn-print"
        disabled={Boolean(busy)}
        onClick={() => void save("all")}
      >
        {busy === "all" ? "Saving…" : "Save all processors"}
      </button>
      {anyProcessorLive(list) ? (
        <p className="ed-sub">A processor is marked Live. Charging still waits until authorize/capture is wired — checkout will not hit Stripe, Helcim, or Square yet.</p>
      ) : null}
    </>
  );
}
