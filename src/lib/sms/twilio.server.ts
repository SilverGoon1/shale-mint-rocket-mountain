/**
 * Twilio SMS for phone signup OTP (server-only).
 *
 * Env on Vercel southend/southendpizza:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_VERIFY_SERVICE_SID  (preferred — Twilio Verify owns the code)
 *   TWILIO_FROM_NUMBER         (E.164 fallback — Programmable Messaging)
 */
import { isVercelProduction } from "@/lib/prod-guard.server";

export type SmsChannel = "verify" | "message" | "none";

function env(name: string) {
  return (process.env[name] ?? "").trim();
}

export function smsChannel(): SmsChannel {
  if (!env("TWILIO_ACCOUNT_SID") || !env("TWILIO_AUTH_TOKEN")) return "none";
  if (env("TWILIO_VERIFY_SERVICE_SID")) return "verify";
  if (env("TWILIO_FROM_NUMBER")) return "message";
  return "none";
}

export function isProdSmsRuntime() {
  return isVercelProduction() || (process.env.NODE_ENV ?? "").trim() === "production";
}

function authHeader() {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  if (!sid || !token) return "";
  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
}

async function twilioForm(url: string, body: Record<string, string>) {
  const auth = authHeader();
  if (!auth) throw new Error("SMS is not configured for this shop.");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
  const json = (await res.json().catch(() => ({}))) as { code?: number; message?: string; status?: string; valid?: boolean };
  if (!res.ok) {
    console.error("[sms] Twilio error", res.status, json.code ?? "", json.message ?? "");
    throw new Error("We could not send that text right now. Try again in a minute.");
  }
  return json;
}

export async function startTwilioVerify(toE164: string) {
  const service = env("TWILIO_VERIFY_SERVICE_SID");
  if (!service) throw new Error("SMS is not configured for this shop.");
  await twilioForm(`https://verify.twilio.com/v2/Services/${service}/Verifications`, {
    To: toE164,
    Channel: "sms",
  });
}

export async function checkTwilioVerify(toE164: string, code: string) {
  const service = env("TWILIO_VERIFY_SERVICE_SID");
  if (!service) return false;
  try {
    const json = await twilioForm(`https://verify.twilio.com/v2/Services/${service}/VerificationCheck`, {
      To: toE164,
      Code: code,
    });
    return json.status === "approved" || json.valid === true;
  } catch {
    return false;
  }
}

export async function sendTwilioMessage(toE164: string, body: string) {
  const sid = env("TWILIO_ACCOUNT_SID");
  const from = env("TWILIO_FROM_NUMBER");
  if (!sid || !from) throw new Error("SMS is not configured for this shop.");
  await twilioForm(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    To: toE164,
    From: from,
    Body: body,
  });
}
