/**
 * Shared Resend mailer for South End Pizza (server-only).
 *
 * Env (Vercel Marketplace Resend on southend/southendpizza):
 *   RESEND_API_KEY
 *   RESEND_EMAIL_DOMAIN — e.g. southendpizza.app
 *   EMAIL_FROM — optional full From override; else
 *     `South End Pizza <orders@${RESEND_EMAIL_DOMAIN}>`
 */
import { Resend } from "resend";
import { isVercelProduction } from "@/lib/prod-guard.server";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function isProdMailRuntime() {
  return isVercelProduction() || (process.env.NODE_ENV ?? "").trim() === "production";
}

export function emailFromAddress() {
  const override = (process.env.EMAIL_FROM ?? "").trim();
  if (override) return override;
  const domain = (process.env.RESEND_EMAIL_DOMAIN ?? "").trim().replace(/^@/, "");
  if (domain) return `South End Pizza <orders@${domain}>`;
  return "South End Pizza <orders@southendpizza.app>";
}

/**
 * Send transactional email via Resend.
 * - Missing key in non-prod: no-op + clear console log; returns { skipped: true }.
 * - Missing key in production when send is required: throws a friendly Error.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ id?: string; skipped?: boolean }> {
  const to = String(input.to ?? "").trim().toLowerCase();
  const subject = String(input.subject ?? "").trim();
  const html = String(input.html ?? "");
  const text = String(input.text ?? "");
  if (!to || !to.includes("@")) throw new Error("That email address does not look right.");
  if (!subject) throw new Error("Email subject is required.");

  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
  if (!apiKey) {
    if (isProdMailRuntime()) {
      throw new Error("Email is not configured yet. Please try again in a few minutes, or call the shop.");
    }
    console.info(`[email] RESEND_API_KEY missing — skipped send to ${to} · ${subject}`);
    return { skipped: true };
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: emailFromAddress(),
    to,
    subject,
    html,
    text,
  });

  if (result.error) {
    const msg = result.error.message || "Could not send email.";
    console.error("[email] Resend error:", msg);
    if (/testing emails|only send testing|verify a domain|own email/i.test(msg)) {
      throw new Error("The shop cannot email new accounts yet. Try again in a few minutes, or call the shop.");
    }
    throw new Error("We could not send that email right now. Try again in a minute.");
  }

  return { id: result.data?.id };
}
