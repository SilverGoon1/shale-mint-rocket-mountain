/** Emails that always get desk Admin (role + Admin mode + POS). */
export const SHOP_ADMIN_EMAILS = new Set([
  "friendlyneigh@proton.me",
  "michaellaporte609@gmail.com",
]);

export function isShopAdminEmail(email: string | null | undefined) {
  return SHOP_ADMIN_EMAILS.has(String(email ?? "").trim().toLowerCase());
}
