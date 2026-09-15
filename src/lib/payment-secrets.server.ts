import type { ProcessorId, ProcessorSecretStatus } from "@/lib/shop-types";
import { PROCESSOR_IDS } from "@/lib/shop-types";

const ENV_SECRET: Record<ProcessorId, string> = {
  stripe: "STRIPE_SECRET_KEY",
  helcim: "HELCIM_API_TOKEN",
  square: "SQUARE_ACCESS_TOKEN",
  stax: "STAX_SECRET_KEY",
  paypal: "PAYPAL_SECRET",
};

const ENV_WEBHOOK: Partial<Record<ProcessorId, string>> = {
  stripe: "STRIPE_WEBHOOK_SECRET",
};

/** Shop DB may only remember that a secret exists — never the raw value. */
export type ProcessorSecretBlob = {
  configured?: boolean;
  last4?: string;
  webhookConfigured?: boolean;
  webhookLast4?: string;
};

export type PaymentSecretsMap = Partial<Record<ProcessorId, ProcessorSecretBlob>>;

function envVal(key: string | undefined) {
  if (!key) return "";
  return String(process.env[key] ?? "").trim();
}

export function maskSecret(value: string) {
  const v = value.trim();
  if (!v) return "";
  if (v.length <= 4) return "••••";
  return `••••${v.slice(-4)}`;
}

function last4Of(value: string) {
  const v = value.trim();
  if (!v) return "";
  return v.slice(-4);
}

function blobFromRaw(rec: Record<string, unknown>): ProcessorSecretBlob | undefined {
  const rawSecret = String(rec.secretKey ?? rec.accessToken ?? rec.apiToken ?? "").trim();
  const rawWebhook = String(rec.webhookSecret ?? "").trim();
  const configured = rec.configured === true || Boolean(rawSecret) || Boolean(String(rec.last4 ?? "").trim());
  const last4 = String(rec.last4 ?? "").trim().slice(-4) || last4Of(rawSecret);
  const webhookConfigured =
    rec.webhookConfigured === true || Boolean(rawWebhook) || Boolean(String(rec.webhookLast4 ?? "").trim());
  const webhookLast4 = String(rec.webhookLast4 ?? "").trim().slice(-4) || last4Of(rawWebhook);
  if (!configured && !webhookConfigured && !last4 && !webhookLast4) return undefined;
  const blob: ProcessorSecretBlob = {};
  if (configured || last4) {
    blob.configured = true;
    if (last4) blob.last4 = last4;
  }
  if (webhookConfigured || webhookLast4) {
    blob.webhookConfigured = true;
    if (webhookLast4) blob.webhookLast4 = webhookLast4;
  }
  return blob;
}

export function parsePaymentSecrets(raw: unknown): PaymentSecretsMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: PaymentSecretsMap = {};
  for (const id of PROCESSOR_IDS) {
    const row = (raw as Record<string, unknown>)[id];
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const blob = blobFromRaw(row as Record<string, unknown>);
    if (blob) out[id] = blob;
  }
  return out;
}

export function mergePaymentSecrets(stored: PaymentSecretsMap, incoming: PaymentSecretsMap): PaymentSecretsMap {
  const next: PaymentSecretsMap = { ...stored };
  for (const id of PROCESSOR_IDS) {
    const patch = incoming[id];
    if (!patch) continue;
    const cur = { ...(next[id] ?? {}) };
    if (patch.configured) {
      cur.configured = true;
      if (patch.last4) cur.last4 = patch.last4;
    }
    if (patch.webhookConfigured) {
      cur.webhookConfigured = true;
      if (patch.webhookLast4) cur.webhookLast4 = patch.webhookLast4;
    }
    next[id] = cur;
  }
  return next;
}

export function persistableSecrets(stored: PaymentSecretsMap): PaymentSecretsMap {
  const out: PaymentSecretsMap = {};
  for (const id of PROCESSOR_IDS) {
    const blob = stored[id];
    if (!blob) continue;
    const clean: ProcessorSecretBlob = {};
    if (blob.configured || blob.last4) {
      clean.configured = true;
      if (blob.last4) clean.last4 = blob.last4.slice(-4);
    }
    if (blob.webhookConfigured || blob.webhookLast4) {
      clean.webhookConfigured = true;
      if (blob.webhookLast4) clean.webhookLast4 = blob.webhookLast4.slice(-4);
    }
    if (clean.configured || clean.webhookConfigured) out[id] = clean;
  }
  return out;
}

export function processorHasSecret(id: ProcessorId, stored: PaymentSecretsMap) {
  if (envVal(ENV_SECRET[id])) return true;
  if (stored[id]?.configured) return true;
  return false;
}

/** Charging adapters must use this — process.env only, never shop_settings. */
export function readProcessorSecret(id: ProcessorId) {
  return envVal(ENV_SECRET[id]);
}

export function readProcessorWebhookSecret(id: ProcessorId) {
  return envVal(ENV_WEBHOOK[id]);
}

export function secretStatusFor(id: ProcessorId, stored: PaymentSecretsMap): ProcessorSecretStatus {
  const blob = stored[id];
  const envSecret = envVal(ENV_SECRET[id]);
  const envWebhook = envVal(ENV_WEBHOOK[id]);
  const usingEnv = Boolean(envSecret);
  const secretConfigured = Boolean(envSecret) || Boolean(blob?.configured);
  const webhookConfigured = Boolean(envWebhook) || Boolean(blob?.webhookConfigured);
  return {
    id,
    secretConfigured,
    secretMask: envSecret ? "Using env var" : blob?.last4 ? maskSecret(blob.last4) : "",
    webhookConfigured,
    webhookMask: envWebhook ? "Using env var" : blob?.webhookLast4 ? maskSecret(blob.webhookLast4) : "",
    usingEnv,
  };
}

export function allSecretStatuses(stored: PaymentSecretsMap): ProcessorSecretStatus[] {
  return PROCESSOR_IDS.map((id) => secretStatusFor(id, stored));
}