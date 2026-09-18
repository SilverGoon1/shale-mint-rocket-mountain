import type { CSSProperties } from "react";
import type { WeeklyHours } from "@/lib/hours";

export type ProfileView = {
  userId: string;
  role: "admin" | "customer";
  phone: string;
  displayName: string;
  addressLine: string;
  addressUnit: string;
  city: string;
  zip: string;
  points: number;
  totpEnabled: boolean;
  adminExists: boolean;
  unreadChats: number;
  adminInbox: number;
  banned: boolean;
  email: string;
  emailVerified: boolean;
  referralCode: string;
  inviteCount: number;
  orderCount: number;
  memberSince: string;
  adminMode: boolean;
  adminModeAllowed: boolean;
  deskGrant: boolean;
  avatarUrl: string;
};

export const SEASON_EFFECTS = [
  { id: "none", label: "Off" },
  { id: "newyear", label: "New Year's" },
  { id: "christmas", label: "Christmas" },
  { id: "halloween", label: "Halloween" },
  { id: "july4", label: "4th of July" },
  { id: "valentines", label: "Valentine's Day" },
  { id: "stpatrick", label: "St. Patrick's Day" },
] as const;

export type SeasonEffect = (typeof SEASON_EFFECTS)[number]["id"];

export function sanitizeSeasonEffect(raw: unknown): SeasonEffect {
  const s = String(raw ?? "none");
  return SEASON_EFFECTS.some((e) => e.id === s) ? (s as SeasonEffect) : "none";
}

export const CARD_TEXT_SIZES = [
  { id: "sm", label: "Small" },
  { id: "md", label: "Medium" },
  { id: "lg", label: "Large" },
  { id: "xl", label: "XL" },
] as const;

export type CardTextSize = (typeof CARD_TEXT_SIZES)[number]["id"];
export const CARD_SIZES = CARD_TEXT_SIZES;
export type CardSize = CardTextSize;

export const CARD_TEXT_COLORS = [
  { id: "ink", label: "Ink" },
  { id: "tomato", label: "Tomato" },
  { id: "tomato-dark", label: "Deep red" },
  { id: "muted", label: "Muted" },
  { id: "brass", label: "Brass" },
  { id: "forest", label: "Forest" },
] as const;

export type CardTextColorNamed = (typeof CARD_TEXT_COLORS)[number]["id"];

export const CARD_BG_COLORS = [
  { id: "paper", label: "Paper" },
  { id: "cream", label: "Cream" },
  { id: "wheat", label: "Wheat" },
] as const;

export type CardBgNamed = (typeof CARD_BG_COLORS)[number]["id"];

const CARD_COLOR_HEX: Record<CardTextColorNamed, string> = {
  ink: "#1a1410",
  tomato: "#9a221c",
  "tomato-dark": "#6e1612",
  muted: "#6b5d52",
  brass: "#8a5a12",
  forest: "#2f4a38",
};

const CARD_BG_HEX: Record<CardBgNamed, string> = {
  paper: "#f4ead8",
  cream: "#fbf6ec",
  wheat: "#eadcc4",
};

function expandShortHex(s: string) {
  if (!/^#[0-9a-f]{3}$/.test(s)) return s;
  const r = s[1];
  const g = s[2];
  const b = s[3];
  return `#${r}${r}${g}${g}${b}${b}`;
}

function parseNamedOrHex(raw: unknown, named: readonly { id: string }[], fallback: string) {
  const s = String(raw ?? fallback).trim().toLowerCase();
  if (named.some((x) => x.id === s)) return s;
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  if (/^#[0-9a-f]{3}$/.test(s)) return expandShortHex(s);
  return fallback;
}

export function sanitizeCardTextSize(raw: unknown): CardTextSize {
  const s = String(raw ?? "md");
  return CARD_TEXT_SIZES.some((x) => x.id === s) ? (s as CardTextSize) : "md";
}

export const sanitizeCardSize = sanitizeCardTextSize;

export function sanitizeCardTextColor(raw: unknown): string {
  return parseNamedOrHex(raw, CARD_TEXT_COLORS, "ink");
}

export function sanitizeCardBg(raw: unknown): string {
  return parseNamedOrHex(raw, CARD_BG_COLORS, "paper");
}

export function cardColorKind(color: string): CardTextColorNamed | "custom" {
  const c = sanitizeCardTextColor(color);
  if (CARD_TEXT_COLORS.some((x) => x.id === c)) return c as CardTextColorNamed;
  return "custom";
}

export function cardBgKind(color: string): CardBgNamed | "custom" {
  const c = sanitizeCardBg(color);
  if (CARD_BG_COLORS.some((x) => x.id === c)) return c as CardBgNamed;
  return "custom";
}

export function cardColorHex(color: string): string {
  const c = sanitizeCardTextColor(color);
  if (c.startsWith("#")) return c;
  return CARD_COLOR_HEX[c as CardTextColorNamed] ?? CARD_COLOR_HEX.ink;
}

export function cardBgHex(color: string): string {
  const c = sanitizeCardBg(color);
  if (c.startsWith("#")) return c;
  return CARD_BG_HEX[c as CardBgNamed] ?? CARD_BG_HEX.paper;
}

function relLum(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
}

export function cardTextContrastOk(color: string, bg = "paper"): boolean {
  const a = relLum(cardColorHex(color));
  const b = relLum(cardBgHex(bg));
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return ratio >= 3;
}

export function cardTypeStyle(color: string, descColor?: string, priceColor?: string, bg?: string): CSSProperties {
  return {
    ["--food-card-ink"]: cardColorHex(color),
    ["--food-card-muted"]: cardColorHex(descColor || "muted"),
    ["--food-card-price-ink"]: cardColorHex(priceColor || color),
    ["--food-card-bg"]: cardBgHex(bg || "paper"),
  } as CSSProperties;
}


export function isActiveOrderStatus(status: string) {
  return status !== "completed" && status !== "canceled";
}

export function formatTicketNo(n?: number | null) {
  const v = Math.round(Number(n) || 0);
  return v > 0 ? String(v).padStart(6, "0") : "------";
}

export type ShopSettingsPublic = {
  vacationOn: boolean;
  vacationMessage: string;
  vacationUntil: string;
  paymentPlaceholder: string;
  guestCardRequired: boolean;
  paymentAccounts: ProcessorAccountPublic[];
  adminTotpRequired: boolean;
  pointsPerDollar: number;
  redeemRate: number;
  welcomeBonus: number;
  inviteBonus: number;
  inviteeBonus: number;
  minOrderDelivery: number;
  deliveryFee: number;
  deliveryFeeOn: boolean;
  hasZones: boolean;
  deliveryZoneMode: "paint" | "radius";
  deliveryRadiusMiles: number;
  blockNorthfield: boolean;
  taxRate: number;
  prepMinutes: number;
  deliveryMinutes: number;
  tagline: string;
  showMark: boolean;
  weeklyHours: WeeklyHours;
  openNow: boolean;
  hoursSummary: string;
  xlEnabled: boolean;
  xlInches: string;
  xlPriceAdd: number;
  toppingPriceSm: number;
  toppingPriceMd: number;
  toppingPriceLg: number;
  toppingPriceXl: number;
  toppingPricesById: Record<string, { SM: number; MD: number; LG: number; XL: number }>;
  backdropData: string;
  logoData: string;
  seasonEffect: SeasonEffect;
  cardTextSize: CardTextSize;
  cardTextColor: string;
  cardDescColor: string;
  cardPriceColor: string;
  cardSize: CardSize;
  cardBg: string;
};

export type OrderItem = {
  itemId: string;
  categoryId: string;
  name: string;
  size?: string;
  detail?: string;
  comment?: string;
  toppings?: { id: string; side: "whole" | "left" | "right" }[];
  halfItemId?: string;
  condiments?: { id: string; name: string; qty: number; charge: number }[];
  unitPrice: number;
  qty: number;
};

export type OrderView = {
  id: string;
  ticketNo: number;
  userId: string;
  status: string;
  fulfillment: "pickup" | "delivery";
  notes: string;
  addressLine: string;
  city: string;
  zip: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  tip: number;
  total: number;
  pointsEarned: number;
  pointsSpent: number;
  paymentMethod: string;
  pickupName?: string;
  createdAt: string;
  acceptedAt?: string | null;
  scheduledFor?: string | null;
  voidedAt?: string | null;
  voidReason?: string;
};

export type RewardsKind = "welcome" | "earn" | "redeem" | "invite" | "invitee" | "adjust";

export type RewardsEvent = {
  id: string;
  kind: RewardsKind;
  points: number;
  note: string;
  orderId?: string;
  createdAt: string;
};

export type RewardsView = {
  points: number;
  referralCode: string;
  inviteCount: number;
  inviteBonus: number;
  inviteeBonus: number;
  welcomeBonus: number;
  pointsPerDollar: number;
  redeemRate: number;
  history: RewardsEvent[];
  invited: { name: string; at: string }[];
};

export type PosTicket = OrderView & {
  customerName: string;
  customerPhone: string;
  chatUnread: number;
  chatThreadId: string | null;
};

export type DeskAccountRow = {
  userId: string;
  emailLocal: string;
  emailMasked: string;
  displayName: string;
  adminModeAllowed: boolean;
  adminMode: boolean;
};

export type CustomerRecord = {
  userId: string;
  displayName: string;
  phone: string;
  email: string;
  role: "customer" | "admin";
  points: number;
  totpEnabled: boolean;
  createdAt: string;
  orderCount: number;
  spend: number;
  lastOrderAt: string | null;
  banned: boolean;
  adminModeAllowed: boolean;
  orders: OrderView[];
};

export type ChatOrderBrief = {
  id: string;
  ticketNo: number;
  status: string;
  fulfillment: "pickup" | "delivery";
  total: number;
  notes: string;
  createdAt: string;
  items: { name: string; size?: string; qty: number; detail?: string; comment?: string }[];
};

export type ChatThreadView = {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  lastMessage: string;
  lastAt: string;
  unreadAdmin: number;
  unreadCustomer: number;
  createdAt: string;
  orderId: string | null;
  order: ChatOrderBrief | null;
  customerBanned?: boolean;
  staffNote?: string;
  muted?: boolean;
  flagged?: boolean;
};

export type ChatMessageView = {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: "customer" | "admin";
  body: string;
  createdAt: string;
};

export type TwoFactorStatus = {
  required: boolean;
  unlocked: boolean;
  enabled: boolean;
  enroll: boolean;
  locked: boolean;
};

/** Card capture SDKs are not wired. Stay false until authorize/capture exists. */
export const CARD_PROCESSOR_LIVE = false;

export const PROCESSOR_IDS = ["stripe", "helcim", "square", "stax", "paypal"] as const;
export type ProcessorId = (typeof PROCESSOR_IDS)[number];

export type ProcessorAccountPublic = {
  id: ProcessorId;
  enabled: boolean;
  live: boolean;
  environment: "sandbox" | "live";
  publishableKey: string;
  merchantId: string;
  statementDescriptor: string;
  allowCard: boolean;
  allowApplePay: boolean;
  allowGooglePay: boolean;
  allowAch: boolean;
  allowTerminal: boolean;
};

export type ProcessorSecretStatus = {
  id: ProcessorId;
  secretConfigured: boolean;
  secretMask: string;
  webhookConfigured: boolean;
  webhookMask: string;
  usingEnv: boolean;
};

export function defaultProcessorAccount(id: ProcessorId): ProcessorAccountPublic {
  const apple = id === "stripe" || id === "square";
  const google = id === "stripe" || id === "helcim" || id === "square";
  const ach = id === "stripe" || id === "helcim";
  const card = id !== "paypal";
  return {
    id,
    enabled: false,
    live: false,
    environment: "sandbox",
    publishableKey: "",
    merchantId: "",
    statementDescriptor: id === "stripe" ? "SOUTH END PIZZA" : "",
    allowCard: card,
    allowApplePay: apple,
    allowGooglePay: google,
    allowAch: ach,
    allowTerminal: false,
  };
}

export function defaultPaymentAccounts(): ProcessorAccountPublic[] {
  return PROCESSOR_IDS.map(defaultProcessorAccount);
}

export function anyProcessorLive(accounts: ProcessorAccountPublic[] | undefined) {
  return (accounts ?? []).some((a) => a.enabled && a.live && a.publishableKey.trim().length > 0);
}

export function parsePaymentAccounts(raw: unknown): ProcessorAccountPublic[] {
  const byId = new Map<ProcessorId, ProcessorAccountPublic>();
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const rec = row as Record<string, unknown>;
      const id = String(rec.id ?? "") as ProcessorId;
      if (!PROCESSOR_IDS.includes(id)) continue;
      const base = defaultProcessorAccount(id);
      byId.set(id, {
        ...base,
        enabled: rec.enabled === true,
        live: rec.live === true,
        environment: rec.environment === "live" ? "live" : "sandbox",
        publishableKey: String(rec.publishableKey ?? "").trim().slice(0, 200),
        merchantId: String(rec.merchantId ?? "").trim().slice(0, 120),
        statementDescriptor: String(rec.statementDescriptor ?? base.statementDescriptor).trim().slice(0, 22),
        allowCard: rec.allowCard !== false,
        allowApplePay: rec.allowApplePay === true,
        allowGooglePay: rec.allowGooglePay === true,
        allowAch: rec.allowAch === true,
        allowTerminal: rec.allowTerminal === true,
      });
    }
  }
  return PROCESSOR_IDS.map((id) => byId.get(id) ?? defaultProcessorAccount(id));
}

export function isProcessorPayment(method: string) {
  return PROCESSOR_IDS.some((id) => method === `pay_${id}` || method === "pay_card");
}

export type AdminInsights = {
  customers: {
    total: number;
    new7d: number;
    twoFactor: number;
    avgPoints: number;
    repeat: number;
    top: { userId: string; name: string; orders: number; spend: number; points: number }[];
  };
  sales: {
    today: number;
    week: number;
    month: number;
    allTime: number;
    tickets: number;
    avgTicket: number;
    canceled: number;
    series: { day: string; total: number; tickets: number }[];
    topItems: { name: string; qty: number; sales: number }[];
  };
  financials: {
    food: number;
    tax: number;
    discounts: number;
    deliveryFees: number;
    tips: number;
    collected: number;
    pickup: number;
    delivery: number;
    awaitingPayment: number;
    byPay: { method: string; total: number; count: number }[];
  };
};

export type PrinterProfile = {
  id: string;
  name: string;
  bluetoothId: string;
  bluetoothName: string;
  lanHost: string;
  lanPort: 8008 | 8043;
  lanProtocol: "http" | "https";
  enabled: boolean;
  copies: number;
  customerCopy: boolean;
  storeCopy: boolean;
  paper: "58mm" | "80mm";
};

export type ReceiptOptions = {
  taxId: string;
  footer: string;
  autoPrintOnAccept: boolean;
};

export const DEFAULT_RECEIPT_OPTIONS: ReceiptOptions = {
  taxId: "",
  footer: "Thank you for dining with us. Keep this receipt for your records.",
  autoPrintOnAccept: true,
};

export function parseDeliveryZoneMode(raw: unknown): "paint" | "radius" {
  return String(raw ?? "").trim() === "radius" ? "radius" : "paint";
}

export function clampDeliveryRadius(raw: unknown) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 5;
  const stepped = Math.round(n * 2) / 2;
  return Math.min(30, Math.max(0.5, stepped));
}

export function deliveryHasZones(mode: "paint" | "radius", radiusMiles: number, cellCount: number) {
  if (mode === "radius") return radiusMiles > 0;
  return cellCount > 0;
}

export function moneyNumber(value: string | number | null | undefined) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

export const DESK_ACCOUNT_SOFT_MAX = 14;
export const DESK_BOT_SOFT_MAX = 12;

export function checkoutDeliveryFee(
  settings: Pick<ShopSettingsPublic, "deliveryFee" | "deliveryFeeOn">,
  fulfillment: string,
) {
  if (fulfillment !== "delivery") return 0;
  if (settings.deliveryFeeOn === false) return 0;
  return Math.max(0, Math.round(moneyNumber(settings.deliveryFee) * 100) / 100);
}

export function payMethodLabel(method: string) {
  if (method === "pay_delivery") return "Cash";
  if (method === "pay_pickup") return "Pay at pickup";
  if (method === "pay_card") return "Card";
  if (method === "pay_stripe") return "Stripe";
  if (method === "pay_helcim") return "Helcim";
  if (method === "pay_square") return "Square";
  if (method === "pay_stax") return "Stax";
  if (method === "pay_paypal") return "PayPal";
  return method.replaceAll("_", " ");
}

export function computeTax(subtotal: number, discount: number, deliveryFee: number, taxRate: number) {
  const taxable = Math.max(0, subtotal - discount) + Math.max(0, deliveryFee);
  const rate = Math.max(0, taxRate) / 100;
  const tax = Math.round(taxable * rate * 100) / 100;
  return { taxable, tax, total: Math.round((taxable + tax) * 100) / 100 };
}

export function tipFromPercent(subtotal: number, discount: number, percent: number) {
  const food = Math.max(0, subtotal - discount);
  return Math.round((Math.max(0, percent) / 100) * food * 100) / 100;
}

export function clampTip(value: number) {
  const n = Math.round(Math.max(0, moneyNumber(value)) * 100) / 100;
  return Math.min(n, 500);
}

export function newPrinter(init?: Partial<PrinterProfile>): PrinterProfile {
  const https = init?.lanProtocol === "https" || init?.lanPort === 8043;
  return {
    id: `ptr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: init?.name || "Receipt printer",
    bluetoothId: init?.bluetoothId || "",
    bluetoothName: init?.bluetoothName || "",
    lanHost: init?.lanHost || "",
    lanPort: https ? 8043 : 8008,
    lanProtocol: https ? "https" : "http",
    enabled: init?.enabled ?? true,
    copies: init?.copies ?? 1,
    customerCopy: init?.customerCopy ?? true,
    storeCopy: init?.storeCopy ?? true,
    paper: init?.paper === "80mm" ? "80mm" : "58mm",
  };
}

export function parsePrinters(raw: unknown): PrinterProfile[] {
  let src: unknown = raw;
  if (typeof raw === "string") {
    try {
      src = JSON.parse(raw);
    } catch {
      src = [];
    }
  }
  if (!Array.isArray(src)) return [];
  return src.map((row) => {
    const r = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
    return {
      id: String(r.id || `ptr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`),
      name: String(r.name || "Receipt printer"),
      bluetoothId: String(r.bluetoothId || ""),
      bluetoothName: String(r.bluetoothName || ""),
      lanHost: String(r.lanHost || ""),
      lanPort: r.lanPort === 8043 || r.lanProtocol === "https" ? 8043 : 8008,
      lanProtocol: r.lanProtocol === "https" ? "https" : "http",
      enabled: r.enabled !== false,
      copies: Math.max(1, Math.round(moneyNumber(r.copies as number) || 1)),
      customerCopy: r.customerCopy !== false,
      storeCopy: r.storeCopy !== false,
      paper: r.paper === "80mm" ? "80mm" : "58mm",
    };
  });
}

export function parseReceiptOptions(raw: unknown): ReceiptOptions {
  let src: unknown = raw;
  if (typeof raw === "string") {
    try {
      src = JSON.parse(raw);
    } catch {
      src = {};
    }
  }
  const r = src && typeof src === "object" ? (src as Record<string, unknown>) : {};
  return {
    taxId: String(r.taxId ?? ""),
    footer: String(r.footer ?? DEFAULT_RECEIPT_OPTIONS.footer),
    autoPrintOnAccept: r.autoPrintOnAccept !== false,
  };
}

export function orderStatusLabel(status: string) {
  if (status === "awaiting_payment") return "Awaiting payment";
  if (status === "out_for_delivery") return "Out for delivery";
  if (status === "placed") return "Placed";
  if (status === "accepted") return "Accepted";
  if (status === "preparing") return "Preparing";
  if (status === "ready") return "Ready";
  if (status === "completed") return "Completed";
  if (status === "canceled") return "Canceled";
  return status.replaceAll("_", " ");
}

export function orderStatusTone(status: string) {
  if (status === "completed") return "completed";
  if (status === "canceled") return "canceled";
  if (status === "placed" || status === "awaiting_payment") return "placed";
  return "accepted";
}
