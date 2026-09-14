import { isStaffAdminAccount, isStaffAdminUsername, STAFF_ADMIN_EMAIL } from "@/lib/staff-admin";

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function looksLikePhone(value: string) {
  const d = digitsOnly(value);
  return d.length === 10 || (d.length === 11 && d.startsWith("1"));
}

export function toTenDigitPhone(value: string) {
  const d = digitsOnly(value);
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  if (d.length === 10) return d;
  return "";
}

export function formatPhone(value: string) {
  const d = toTenDigitPhone(value);
  if (d.length !== 10) return value;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Map an email, shop username, or US phone into the Better Auth email identifier. */
export function identifierToEmail(raw: string) {
  const trimmed = raw.trim();
  const phone = toTenDigitPhone(trimmed);
  if (phone) return { email: `${phone}@phone.southend.pizza`, phone };
  if (isStaffAdminUsername(trimmed)) return { email: STAFF_ADMIN_EMAIL, phone: undefined as string | undefined };
  return { email: trimmed.toLowerCase(), phone: undefined as string | undefined };
}

export function phoneFromAuthEmail(email: string | null | undefined) {
  if (!email) return "";
  const m = email.match(/^(\d{10})@phone\.southend\.pizza$/i);
  return m ? m[1] : "";
}

/** Synthetic Better Auth emails for phone-number accounts — no real inbox. */
export function isPhoneAuthEmail(email: string | null | undefined) {
  if (!email) return false;
  return /@phone\.southend\.pizza$/i.test(email.trim());
}

export function maskEmail(email: string) {
  const [user, domain] = String(email ?? "")
    .trim()
    .toLowerCase()
    .split("@");
  if (!domain) return "***";
  const head = (user || "x").slice(0, 1);
  return `${head}***@${domain}`;
}

/** Real guest emails must verify. Phone, desk Admin, and empty-skip callers stay off OTP. */
export function needsEmailOtp(email: string | null | undefined) {
  const e = String(email ?? "").trim().toLowerCase();
  if (!e) return false;
  if (isPhoneAuthEmail(e)) return false;
  if (isStaffAdminAccount(undefined, e) || isStaffAdminUsername(e)) return false;
  return true;
}
