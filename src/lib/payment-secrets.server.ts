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

export type ProcessorSecretBlob = {
  secretKey?: string;
  webhookSecret?: string;
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

export function parsePaymentSecrets(raw: unknown): PaymentSecretsMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: PaymentSecretsMap = {};
  for (const id of PROCESSOR_IDS) {
    const row = (raw as Record<string, unknown>)[id];
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const rec = row as Record<string, unknown>;
    const secretKey = String(rec.secretKey ?? rec.accessToken ?? rec.apiToken ?? "").trim();
    const webhookSecret = String(rec.webhookSecret ?? "").trim();
    if (secretKey || webhookSecret) {
      out[id] = {
        secretKey: secretKey.slice(0, 400) || undefined,
        webhookSecret: webhookSecret.slice(0, 400) || undefined,
      };
    }
  }
  return out;
}

export function mergePaymentSecrets(stored: PaymentSecretsMap, incoming: PaymentSecretsMap): PaymentSecretsMap {
  const next: PaymentSecretsMap = { ...stored };
  for (const id of PROCESSOR_IDS) {
    const patch = incoming[id];
    if (!patch) continue;
    const cur = { ...(next[id] ?? {}) };
    if (typeof patch.secretKey === "string" && patch.secretKey.trim()) {
      cur.secretKey = patch.secretKey.trim().slice(0, 400);
    }
    if (typeof patch.webhookSecret === "string" && patch.webhookSecret.trim()) {
      cur.webhookSecret = patch.webhookSecret.trim().slice(0, 400);
    }
    next[id] = cur;
  }
  return next;
}

export function processorHasSecret(id: ProcessorId, stored: PaymentSecretsMap) {
  const blob = stored[id];
  if (blob?.secretKey?.trim()) return true;
  if (envVal(ENV_SECRET[id])) return true;
  return false;
}

export function secretStatusFor(id: ProcessorId, stored: PaymentSecretsMap): ProcessorSecretStatus {
  const blob = stored[id];
  const envSecret = envVal(ENV_SECRET[id]);
  const envWebhook = envVal(ENV_WEBHOOK[id]);
  const secret = blob?.secretKey?.trim() || envSecret;
  const webhook = blob?.webhookSecret?.trim() || envWebhook;
  const usingEnv = Boolean(envSecret) && !blob?.secretKey?.trim();
  return {
    id,
    secretConfigured: Boolean(secret),
    secretMask: usingEnv ? "Using env var" : maskSecret(secret),
    webhookConfigured: Boolean(webhook),
    webhookMask: envWebhook && !blob?.webhookSecret?.trim() ? "Using env var" : maskSecret(webhook),
    usingEnv,
  };
}

export function allSecretStatuses(stored: PaymentSecretsMap): ProcessorSecretStatus[] {
  return PROCESSOR_IDS.map((id) => secretStatusFor(id, stored));
}
