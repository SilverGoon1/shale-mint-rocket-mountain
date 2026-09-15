import { hashPassword, verifyPassword } from "@better-auth/utils/password";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql, dbSource, type Sql } from "@/lib/db";
import { RESTAURANT, type CategoryKind, type MenuCategory, type MenuItem, type PriceCol, type RestaurantInfo } from "@/data/menu";
import { CELL, MAP_CENTER, SHOP_LAT, SHOP_LNG, cellKey, deliveryFailReason, expandDeliveryQuery, isAddressDeliverable, isMapsQuery, milesBetween, nominatimViewboxForRadius, parseMapsLatLng, parseNominatimHit, SEARCH_VIEWBOX, type AddressSuggestion, type DeliveryFailReason } from "@/lib/geo";
import { formatPhone, identifierToEmail, isPhoneAuthEmail, needsEmailOtp, needsPhoneOtp, phoneFromAuthEmail, PHONE_SIGNUP_ENABLED, toE164, toTenDigitPhone, maskPhone } from "@/lib/phone";
import { lineSummary } from "@/lib/ticket-line";
import { generateTotpSecret, totpUri, verifyTotp } from "@/lib/totp";
import { condimentDetail, condimentListedPrice, condimentTotal, isExtraKind, mergeItemDetail, sanitizeCondimentPicks, sanitizeCondiments, upsertExtraCondiments, type ExtraKind } from "@/lib/condiments";
import { isWingsBuild, parseWingQty, sanitizeBuffaloPicks, sanitizeWingPicks, WING_QTY_MIN } from "@/lib/wings";
import { GROUP_BUFFALO, GROUP_PASTA, GROUP_SALAD, GROUP_SAUCE_DIP, hasGroup, isPastaPlatter, parseGroups, pastaBreadFromPicks, pastaBreadPick, pastaDressingFromPicks, pastaDressingPick, pastaShapeFromPicks, pastaShapePick } from "@/lib/modifiers";
import { sanitizeSaladPicks } from "@/lib/salads";
import { isVercelProduction, socialSignInConfigured } from "@/lib/prod-guard.server";
import { seedMenu } from "@/lib/menu-store";
import { hoursSummary, isOpenNow, nyWallToDate, nyYmd, parseWeeklyHours } from "@/lib/hours";
import type {
  AdminInsights,
  ChatMessageView,
  ChatOrderBrief,
  ChatThreadView,
  CustomerRecord,
  DeskAccountRow,
  OrderItem,
  OrderView,
  PosTicket,
  ProfileView,
  RewardsEvent,
  RewardsKind,
  RewardsView,
  ShopSettingsPublic,
} from "@/lib/shop-types";
import { DESK_ACCOUNT_SOFT_MAX, checkoutDeliveryFee, clampDeliveryRadius, clampTip, computeTax, deliveryHasZones, isProcessorPayment, moneyNumber, parseDeliveryZoneMode, parsePaymentAccounts, parsePrinters, parseReceiptOptions, sanitizeCardBg, sanitizeCardSize, sanitizeCardTextColor, sanitizeCardTextSize, sanitizeSeasonEffect } from "@/lib/shop-types";
import {
  DEFAULT_TOPPING_PRICES,
  DEFAULT_XL_ADD,
  DEFAULT_XL_INCHES,
  applyPizzaSizing,
  pricePizzaBuild,
  sanitizeToppings,
  seedToppingPricesById,
} from "@/lib/pizza";
import {
	STAFF_ADMIN_NAME,
	isStaffAdminAccount,
} from "@/lib/staff-admin";
import { isShopAdminEmail, SHOP_ADMIN_EMAILS } from "@/lib/shop-admins";

function num(v: unknown) {
	return moneyNumber(v as string | number | null | undefined);
}
function bool(v: unknown) {
	return v === true || v === "t" || v === "true";
}
async function seedIfEmpty(sql: Sql) {
	if ((await sql`select id from menu_categories limit 1`).length) return;
	const seeded = seedMenu();
	let i = 0;
	for (const cat of seeded.categories) {
		await sql.query(`insert into menu_categories (id, name, note, kind, icon, sort_order)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (id) do nothing`, [
			cat.id,
			cat.name,
			cat.note ?? "",
			cat.kind,
			cat.icon ?? cat.id,
			i
		]);
		let j = 0;
		for (const item of cat.items) {
			await sql.query(`insert into menu_items (id, category_id, name, description, prices, highlight, sort_order, condiments, groups)
         values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8::jsonb,$9::jsonb)
         on conflict (id) do nothing`, [
				item.id,
				cat.id,
				item.name,
				item.description ?? "",
				JSON.stringify(item.prices),
				Boolean(item.highlight),
				j,
				JSON.stringify(sanitizeCondiments(item.condiments)),
				parseGroups(item.groups) == null ? null : JSON.stringify(parseGroups(item.groups)),
			]);
			j += 1;
		}
		i += 1;
	}
	await sql.query(`update shop_settings set restaurant = $1::jsonb, footer = $2 where id = 1`, [JSON.stringify(seeded.restaurant), seeded.footer]);
	const keys = new Set<string>();
	const [lat0, lng0] = MAP_CENTER;
	const span = CELL * 8;
	for (let lat = lat0 - span; lat <= lat0 + span; lat += CELL) for (let lng = lng0 - span; lng <= lng0 + span; lng += CELL) keys.add(cellKey(lat, lng));
	await sql.query(`update delivery_zones set cells = $1::jsonb, name = $2 where id = 1`, [JSON.stringify([...keys]), "Egg Harbor Township"]);
}
async function backfillSeedCondiments(sql: Sql) {
	const existing = await sql`select id from menu_items where jsonb_typeof(condiments) = 'array' and jsonb_array_length(condiments) > 0 limit 1`;
	if (existing.length) return;
	const seeded = seedMenu();
	for (const cat of seeded.categories) {
		for (const item of cat.items) {
			const conds = sanitizeCondiments(item.condiments);
			if (!conds.length) continue;
			await sql.query(
				`update menu_items set condiments = $1::jsonb
         where name = $2 and category_id = $3
         and (condiments is null or condiments = '[]'::jsonb)`,
				[JSON.stringify(conds), item.name, cat.id],
			);
		}
	}
	bustStorefrontCache();
}

async function ensureWingExtraCondiments(sql: Sql) {
	const rows = await sql.query<{ id: string; name: string; condiments: unknown; groups: unknown; category_id: string }>(
		`select id, name, condiments, groups, category_id from menu_items`,
	);
	let ranch = "";
	let blue = "";
	let dressing = "";
	for (const row of rows) {
		const list = sanitizeCondiments(row.condiments);
		const r = list.find((c) => isExtraKind(c, "ranch"));
		const b = list.find((c) => isExtraKind(c, "blue"));
		const d = list.find((c) => isExtraKind(c, "dressing"));
		if (!ranch && condimentListedPrice(r) > 0) ranch = String(condimentListedPrice(r));
		if (!blue && condimentListedPrice(b) > 0) blue = String(condimentListedPrice(b));
		if (!dressing && condimentListedPrice(d) > 0) dressing = String(condimentListedPrice(d));
	}
	for (const row of rows) {
		const list = sanitizeCondiments(row.condiments);
		const groups = parseGroups(row.groups);
		const name = String(row.name ?? "");
		const catId = String(row.category_id ?? "");
		const fakeCat = { id: catId, name: "", kind: "single" as const, items: [] };
		const item = { name, groups, condiments: list };
		let next = list;
		let changed = false;
		const wantsDip =
			hasGroup(fakeCat, item, GROUP_SAUCE_DIP) ||
			hasGroup(fakeCat, item, GROUP_BUFFALO) ||
			/wing/i.test(name) ||
			(/tender|chicken finger/i.test(name) && !/nugget|pizza/i.test(name));
		const wantsDressing = hasGroup(fakeCat, item, GROUP_SALAD) || /salad/i.test(name);
		function apply(kind: ExtraKind, price: string) {
			if (!price) return;
			if (list.some((c) => isExtraKind(c, kind) && condimentListedPrice(c) > 0)) return;
			next = upsertExtraCondiments(next, kind, price);
			changed = true;
		}
		if (wantsDip) {
			apply("ranch", ranch);
			apply("blue", blue);
		}
		if (wantsDressing) apply("dressing", dressing);
		if (!changed) continue;
		await sql.query(`update menu_items set condiments = $1::jsonb where id = $2`, [JSON.stringify(next), String(row.id)]);
	}
}

async function seedDemoSalesIfEmpty(sql: Sql) {
	if (dbSource !== "pglite") return;
	if ((await sql`select id from orders limit 1`).length) return;
	for (const c of [
		{
			id: "demo-tony",
			name: "Tony Bianchi",
			points: 210,
			phone: "(609) 555-0142"
		},
		{
			id: "demo-lisa",
			name: "Lisa Park",
			points: 88,
			phone: "(609) 555-0198"
		},
		{
			id: "demo-devon",
			name: "Devon Hale",
			points: 132,
			phone: "(609) 555-0117"
		},
		{
			id: "demo-rita",
			name: "Rita Gomez",
			points: 54,
			phone: "(609) 555-0164"
		}
	]) await sql.query(`insert into profiles (user_id, role, display_name, points, phone) values ($1,'customer',$2,$3,$4)
       on conflict (user_id) do nothing`, [
		c.id,
		c.name,
		c.points,
		c.phone
	]);
	const tickets = [
		{
			id: "ord-demo-01",
			userId: "demo-tony",
			daysAgo: 0,
			hour: 12,
			fulfillment: "pickup",
			status: "placed",
			pay: "pay_pickup",
			items: [{
				itemId: "pep-lg",
				categoryId: "pizza",
				name: "Pepperoni Pizza",
				size: "LG",
				unitPrice: 18.75,
				qty: 1
			}, {
				itemId: "sticks",
				categoryId: "appetizers",
				name: "Mozzarella Sticks",
				size: "5 pc",
				unitPrice: 8.5,
				qty: 1
			}],
			notes: "Well done, extra ranch",
			tipPct: 15
		},
		{
			id: "ord-demo-02",
			userId: "demo-lisa",
			daysAgo: 0,
			hour: 17,
			fulfillment: "delivery",
			status: "out_for_delivery",
			pay: "pay_delivery",
			items: [{
				itemId: "buff-pizza",
				categoryId: "gourmet",
				name: "Buffalo Chicken Pizza",
				size: "MD",
				unitPrice: 20.75,
				qty: 1
			}],
			notes: "Leave at the side door. Bell is broken.",
			tipPct: 20
		},
		{
			id: "ord-demo-03",
			userId: "demo-devon",
			daysAgo: 1,
			hour: 13,
			fulfillment: "pickup",
			status: "completed",
			pay: "pay_pickup",
			items: [{
				itemId: "cheese-md",
				categoryId: "pizza",
				name: "Cheese Pizza",
				size: "MD",
				unitPrice: 15.75,
				qty: 1
			}, {
				itemId: "wings",
				categoryId: "wings",
				name: "Fresh Wings",
				size: "10 pc",
				unitPrice: 14,
				qty: 1
			}],
			notes: "No onions on the pie",
			tipPct: 10
		},
		{
			id: "ord-demo-04",
			userId: "demo-rita",
			daysAgo: 2,
			hour: 18,
			fulfillment: "delivery",
			status: "completed",
			pay: "pay_delivery",
			items: [{
				itemId: "steak",
				categoryId: "steak-subs",
				name: "Cheesesteak Sub",
				size: "Half",
				unitPrice: 12.95,
				qty: 2
			}, {
				itemId: "fries",
				categoryId: "sides",
				name: "Buffalo Fries",
				unitPrice: 12.75,
				qty: 1
			}],
			notes: "Extra napkins",
			tipPct: 15
		},
		{
			id: "ord-demo-05",
			userId: "demo-tony",
			daysAgo: 3,
			hour: 19,
			fulfillment: "pickup",
			status: "completed",
			pay: "pay_pickup",
			items: [{
				itemId: "sausage",
				categoryId: "pizza",
				name: "Sausage Pizza",
				size: "LG",
				unitPrice: 18.75,
				qty: 1
			}],
			discount: 5
		},
		{
			id: "ord-demo-06",
			userId: "demo-lisa",
			daysAgo: 4,
			hour: 12,
			fulfillment: "pickup",
			status: "completed",
			pay: "pay_pickup",
			items: [{
				itemId: "tenders",
				categoryId: "appetizers",
				name: "Buffalo Chicken Tenders",
				unitPrice: 14.95,
				qty: 1
			}, {
				itemId: "garlic",
				categoryId: "sides",
				name: "Garlic Bread",
				unitPrice: 5.5,
				qty: 1
			}]
		},
		{
			id: "ord-demo-07",
			userId: "demo-devon",
			daysAgo: 5,
			hour: 16,
			fulfillment: "delivery",
			status: "completed",
			pay: "pay_delivery",
			items: [{
				itemId: "pep-md",
				categoryId: "pizza",
				name: "Pepperoni Pizza",
				size: "MD",
				unitPrice: 17.75,
				qty: 2
			}]
		},
		{
			id: "ord-demo-08",
			userId: "demo-rita",
			daysAgo: 6,
			hour: 11,
			fulfillment: "pickup",
			status: "canceled",
			pay: "pay_pickup",
			items: [{
				itemId: "cheese-sm",
				categoryId: "pizza",
				name: "Cheese Pizza",
				size: "SM",
				unitPrice: 14.75,
				qty: 1
			}]
		},
		{
			id: "ord-demo-09",
			userId: "demo-tony",
			daysAgo: 7,
			hour: 18,
			fulfillment: "delivery",
			status: "completed",
			pay: "pay_card",
			items: [{
				itemId: "buff-sub",
				categoryId: "steak-subs",
				name: "Buffalo Chicken Cheesesteak Sub",
				size: "Half",
				unitPrice: 12.95,
				qty: 1
			}, {
				itemId: "sticks2",
				categoryId: "appetizers",
				name: "Mozzarella Sticks",
				size: "5 pc",
				unitPrice: 8.5,
				qty: 1
			}]
		},
		{
			id: "ord-demo-10",
			userId: "demo-lisa",
			daysAgo: 8,
			hour: 14,
			fulfillment: "pickup",
			status: "completed",
			pay: "pay_pickup",
			items: [{
				itemId: "stromboli",
				categoryId: "turnovers",
				name: "Stromboli",
				size: "LG",
				unitPrice: 18.5,
				qty: 1
			}]
		},
		{
			id: "ord-demo-11",
			userId: "demo-devon",
			daysAgo: 9,
			hour: 19,
			fulfillment: "pickup",
			status: "completed",
			pay: "pay_pickup",
			items: [{
				itemId: "cheese-lg",
				categoryId: "pizza",
				name: "Cheese Pizza",
				size: "LG",
				unitPrice: 16.75,
				qty: 1
			}, {
				itemId: "wings2",
				categoryId: "wings",
				name: "Fresh Wings",
				size: "10 pc",
				unitPrice: 14,
				qty: 1
			}]
		},
		{
			id: "ord-demo-12",
			userId: "demo-tony",
			daysAgo: 11,
			hour: 13,
			fulfillment: "delivery",
			status: "completed",
			pay: "pay_delivery",
			items: [{
				itemId: "buff-pizza2",
				categoryId: "gourmet",
				name: "Buffalo Chicken Pizza",
				size: "LG",
				unitPrice: 22.75,
				qty: 1
			}]
		},
		{
			id: "ord-demo-13",
			userId: "demo-rita",
			daysAgo: 12,
			hour: 17,
			fulfillment: "pickup",
			status: "completed",
			pay: "pay_pickup",
			items: [{
				itemId: "steak2",
				categoryId: "steak-subs",
				name: "Cheesesteak Sub",
				size: "Half",
				unitPrice: 12.95,
				qty: 1
			}, {
				itemId: "nuggets",
				categoryId: "wings",
				name: "Chicken Nuggets with Fries",
				size: "9 pc",
				unitPrice: 14.95,
				qty: 1
			}]
		},
		{
			id: "ord-demo-14",
			userId: "demo-lisa",
			daysAgo: 13,
			hour: 12,
			fulfillment: "pickup",
			status: "awaiting_payment",
			pay: "pay_card",
			items: [{
				itemId: "pep-sm",
				categoryId: "pizza",
				name: "Pepperoni Pizza",
				size: "SM",
				unitPrice: 16.75,
				qty: 1
			}]
		}
	];
	const taxRate = 6.625;
	const fee = 3.5;
	for (const t of tickets) {
		const subtotal = t.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
		const discount = t.discount ?? 0;
		const deliveryFee = t.fulfillment === "delivery" ? fee : 0;
		const { tax, total: preTip } = computeTax(subtotal, discount, deliveryFee, taxRate);
		const tip = t.tipPct ? Math.round(Math.max(0, subtotal - discount) * (t.tipPct / 100) * 100) / 100 : 0;
		const total = Math.round((preTip + tip) * 100) / 100;
		const created =  new Date();
		created.setDate(created.getDate() - t.daysAgo);
		created.setHours(t.hour, 18, 0, 0);
		await sql.query(`insert into orders (
        id, user_id, status, fulfillment, notes, address_line, city, zip,
        items, subtotal, discount, delivery_fee, tax, tip, total, points_earned, points_spent, payment_method, created_at
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,0,$17,$18
      ) on conflict (id) do nothing`, [
			t.id,
			t.userId,
			t.status,
			t.fulfillment,
			t.notes ?? "",
			t.fulfillment === "delivery" ? "12 English Creek Ave" : "",
			t.fulfillment === "delivery" ? "Egg Harbor Township" : "",
			t.fulfillment === "delivery" ? "08234" : "",
			JSON.stringify(t.items),
			subtotal.toFixed(2),
			discount.toFixed(2),
			deliveryFee.toFixed(2),
			tax.toFixed(2),
			tip.toFixed(2),
			total.toFixed(2),
			Math.round(Math.max(0, subtotal - discount)),
			t.pay,
			created.toISOString()
		]);
	}
}
const shopBoot = globalThis as typeof globalThis & {
	__southendSchema__?: Promise<void>;
	__southendBoot__?: Promise<void>;
	__southendStaffAdmin__?: Promise<void>;
	__southendHasMenu__?: boolean;
	__adminModeCols__?: Promise<void>;
	__pushSchema__?: Promise<void>;
	__moneyLocks__?: Promise<void>;
};
const profileLocks = new Map<string, Promise<void>>();

async function ensureSettingsSchema(sql: Sql) {
	if (!shopBoot.__southendSchema__) {
		shopBoot.__southendSchema__ = applySettingsSchema(sql).catch((err) => {
			shopBoot.__southendSchema__ = undefined;
			throw err;
		});
	}
	return shopBoot.__southendSchema__;
}

async function applySettingsSchema(sql: Sql) {
	await sql.query(`create table if not exists order_status_audit (
    id text primary key,
    order_id text not null,
    from_status text not null default '',
    to_status text not null,
    actor_id text not null default '',
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists order_status_audit_order_idx on order_status_audit (order_id, created_at desc)`);
	await sql.query(`create table if not exists email_signup_codes (
    id text primary key,
    user_id text not null,
    email text not null,
    code_hash text not null,
    salt text not null,
    expires_at timestamptz not null,
    attempts integer not null default 0,
    consumed_at timestamptz,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists email_signup_codes_user_idx on email_signup_codes (user_id, created_at desc)`);
	await sql.query(`create index if not exists email_signup_codes_email_idx on email_signup_codes (email, created_at desc)`);
	await sql.query(`create table if not exists phone_signup_codes (
    id text primary key,
    user_id text not null,
    phone text not null,
    code_hash text not null,
    salt text not null,
    expires_at timestamptz not null,
    attempts integer not null default 0,
    consumed_at timestamptz,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists phone_signup_codes_user_idx on phone_signup_codes (user_id, created_at desc)`);
	await sql.query(`create index if not exists phone_signup_codes_phone_idx on phone_signup_codes (phone, created_at desc)`);
	const { ensureStaffAdminLoginColumns } = await import("@/lib/staff-credential.server");
	try {
		await ensureStaffAdminLoginColumns(sql);
	} catch {
		/* staff desk columns must not block admin_mode */
	}
	try {
		await ensureAdminModeColumns(sql);
	} catch {
		/* reads catch missing columns and never 500 */
	}
	try {
		await grantListedShopAdmins(sql);
	} catch {
		/* listed emails may not have signed up yet */
	}
	try {
		await sql.query(`alter table shop_settings add column if not exists topping_prices_by_id jsonb not null default '{}'::jsonb`);
	} catch {
		/* reads seed a per-topping map when the column is missing */
	}
	try {
		await sql.query(`alter table shop_settings add column if not exists delivery_zone_mode text not null default 'paint'`);
		await sql.query(`alter table shop_settings add column if not exists delivery_radius_miles numeric not null default 5`);
		await sql.query(`alter table shop_settings add column if not exists block_northfield boolean not null default true`);
		await sql.query(`alter table shop_settings add column if not exists payment_accounts jsonb not null default '[]'::jsonb`);
		await sql.query(`alter table shop_settings add column if not exists payment_secrets jsonb not null default '{}'::jsonb`);
		await sql.query(`alter table orders add column if not exists voided_at timestamptz`);
		await sql.query(`alter table orders add column if not exists void_reason text not null default ''`);
	} catch {
		/* */
	}
	try {
		await sql.query(`alter table menu_items add column if not exists groups jsonb`);
	} catch {
		/* infer groups when column is missing */
	}
	try {
		await sql.query(`alter table profiles add column if not exists avatar_url text not null default ''`);
	} catch {
		/* reads catch missing column */
	}
	try {
		await ensurePushSchema(sql);
	} catch {
		/* push table is optional until alerts ship */
	}
	const cols = await sql.query(
		`select table_name, column_name from information_schema.columns
     where (table_name = 'shop_settings' and column_name = 'invitee_bonus')
        or (table_name = 'profiles' and column_name = 'address_line')`,
	);
	const names = new Set(cols.map((r) => `${String(r.table_name)}.${String(r.column_name)}`));
	const hasInvitee = names.has("shop_settings.invitee_bonus");
	const hasAddress = names.has("profiles.address_line");
	if (hasInvitee && hasAddress) return;
	if (!hasAddress) {
		await sql.query(`alter table profiles add column if not exists address_line text not null default ''`);
		await sql.query(`alter table profiles add column if not exists city text not null default ''`);
		await sql.query(`alter table profiles add column if not exists zip text not null default ''`);
	}
	if (hasInvitee) return;
	await sql.query(`alter table shop_settings add column if not exists tax_rate numeric not null default 6.625`);
	await sql.query(`alter table shop_settings add column if not exists prep_minutes integer not null default 25`);
	await sql.query(`alter table shop_settings add column if not exists delivery_minutes integer not null default 40`);
	await sql.query(`alter table shop_settings add column if not exists weekly_hours jsonb not null default '{
  "sun":{"closed":false,"open":"11:00","close":"20:00"},
  "mon":{"closed":false,"open":"11:00","close":"20:00"},
  "tue":{"closed":false,"open":"11:00","close":"20:00"},
  "wed":{"closed":false,"open":"11:00","close":"20:00"},
  "thu":{"closed":false,"open":"11:00","close":"20:00"},
  "fri":{"closed":false,"open":"11:00","close":"20:00"},
  "sat":{"closed":false,"open":"11:00","close":"20:00"}
}'::jsonb`);
	await sql.query(`alter table shop_settings add column if not exists tagline text not null default 'Egg Harbor Township, New Jersey'`);
	await sql.query(`alter table shop_settings add column if not exists show_mark boolean not null default true`);
	await sql.query(`alter table orders add column if not exists tax numeric not null default 0`);
	await sql.query(`alter table shop_settings add column if not exists printers jsonb not null default '[]'::jsonb`);
	await sql.query(`alter table shop_settings add column if not exists receipt_options jsonb not null default '{}'::jsonb`);
	await sql.query(`alter table orders add column if not exists accepted_at timestamptz`);
	await sql.query(`alter table orders add column if not exists tip numeric not null default 0`);
	await sql.query(`create table if not exists chat_threads (
    id text primary key,
    user_id text not null,
    status text not null default 'open',
    last_message text not null default '',
    last_at timestamptz not null default now(),
    unread_admin integer not null default 0,
    unread_customer integer not null default 0,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists chat_threads_user_idx on chat_threads (user_id)`);
	await sql.query(`create index if not exists chat_threads_last_at_idx on chat_threads (last_at desc)`);
	await sql.query(`create table if not exists chat_messages (
    id text primary key,
    thread_id text not null references chat_threads(id) on delete cascade,
    sender_id text not null,
    sender_role text not null,
    body text not null,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists chat_messages_thread_idx on chat_messages (thread_id, created_at)`);
	await sql.query(`alter table chat_threads add column if not exists order_id text`);
	await sql.query(`create index if not exists chat_threads_order_idx on chat_threads (order_id)`);
	await sql.query(`alter table shop_settings add column if not exists xl_enabled boolean not null default false`);
	await sql.query(`alter table shop_settings add column if not exists xl_inches text not null default '18"'`);
	await sql.query(`alter table shop_settings add column if not exists xl_price_add numeric not null default 2`);
	await sql.query(`alter table shop_settings add column if not exists topping_price_sm numeric not null default 2.25`);
	await sql.query(`alter table shop_settings add column if not exists topping_price_md numeric not null default 3.25`);
	await sql.query(`alter table shop_settings add column if not exists topping_price_lg numeric not null default 4.25`);
	await sql.query(`alter table shop_settings add column if not exists topping_price_xl numeric not null default 5.25`);
	await sql.query(`alter table profiles add column if not exists banned boolean not null default false`);
	await sql.query(`alter table orders add column if not exists pickup_name text not null default ''`);
	await sql.query(`alter table shop_settings add column if not exists backdrop_data text not null default ''`);
	await sql.query(`alter table shop_settings add column if not exists logo_data text not null default ''`);
	await sql.query(`alter table orders add column if not exists scheduled_for timestamptz`);
	await sql.query(`alter table shop_settings add column if not exists notify_audio text not null default ''`);
	await sql.query(`create table if not exists password_reset_codes (
    id text primary key,
    user_id text not null,
    email text not null,
    code_hash text not null,
    salt text not null,
    expires_at timestamptz not null,
    attempts integer not null default 0,
    consumed_at timestamptz,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists password_reset_codes_user_idx on password_reset_codes (user_id, created_at desc)`);
	await sql.query(`alter table chat_threads add column if not exists staff_note text not null default ''`);
	await sql.query(`alter table chat_threads add column if not exists muted boolean not null default false`);
	await sql.query(`alter table chat_threads add column if not exists flagged boolean not null default false`);
	await sql.query(`alter table shop_settings add column if not exists season_effect text not null default 'none'`);
	await sql.query(`alter table orders add column if not exists ticket_no integer`);
	await ensureTicketNumbers(sql);
	try {
		await sql.query(`create unique index if not exists orders_ticket_no_uidx on orders (ticket_no)`);
	} catch {
		/* duplicates or a lock — do not stall the shop */
	}
	await sql.query(`alter table menu_items add column if not exists image_data text not null default ''`);
	await sql.query(`alter table shop_settings add column if not exists card_text_size text not null default 'md'`);
	await sql.query(`alter table shop_settings add column if not exists card_text_color text not null default 'ink'`);
	await sql.query(`alter table menu_items add column if not exists condiments jsonb not null default '[]'::jsonb`);
	await sql.query(`alter table shop_settings add column if not exists guest_card_required boolean not null default false`);
	await sql.query(`alter table shop_settings add column if not exists payment_accounts jsonb not null default '[]'::jsonb`);
	await sql.query(`alter table shop_settings add column if not exists payment_secrets jsonb not null default '{}'::jsonb`);
	await sql.query(`alter table shop_settings add column if not exists admin_totp_required boolean not null default false`);
	await sql.query(`create table if not exists staff_desk_audit (
    id text primary key,
    user_id text not null default '',
    kind text not null,
    diagnostic boolean not null default false,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`alter table shop_settings add column if not exists card_desc_color text not null default 'muted'`);
	await sql.query(`alter table shop_settings add column if not exists card_price_color text not null default 'ink'`);
	await sql.query(`alter table shop_settings add column if not exists card_size text not null default 'md'`);
	await sql.query(`alter table shop_settings add column if not exists card_bg text not null default 'paper'`);
	await sql.query(`alter table menu_items add column if not exists hide_image boolean not null default false`);
	await sql.query(`alter table profiles add column if not exists referral_code text`);
	await sql.query(`alter table profiles add column if not exists referred_by text`);
	try {
		await sql.query(`create unique index if not exists profiles_referral_code_uidx on profiles (referral_code) where referral_code is not null and referral_code <> ''`);
	} catch {
		/* already unique or a lock — do not stall the shop */
	}
	await sql.query(`create index if not exists profiles_referred_by_idx on profiles (referred_by)`);
	await sql.query(`alter table shop_settings add column if not exists invite_bonus integer not null default 100`);
	await sql.query(`alter table shop_settings add column if not exists invitee_bonus integer not null default 50`);
	await sql.query(`create table if not exists rewards_ledger (
    id text primary key,
    user_id text not null,
    kind text not null,
    points integer not null,
    note text not null default '',
    order_id text,
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists rewards_ledger_user_idx on rewards_ledger (user_id, created_at desc)`);
}
function isMissingAdminModeColumn(err: unknown) {
	const msg = err instanceof Error ? err.message : String(err);
	return /admin_mode|desk_grant/i.test(msg);
}

async function applyAdminModeColumns(sql: Sql) {
	for (const stmt of [
		`alter table profiles add column if not exists admin_mode boolean not null default false`,
		`alter table profiles add column if not exists admin_mode_allowed boolean not null default false`,
		`alter table profiles add column if not exists desk_grant boolean not null default false`,
	]) {
		try {
			await sql.query(stmt);
		} catch {
			/* already exists */
		}
	}
	for (const stmt of [
		`alter table profiles alter column role set default 'customer'`,
		`alter table profiles alter column admin_mode set default false`,
		`alter table profiles alter column admin_mode_allowed set default false`,
	]) {
		try {
			await sql.query(stmt);
		} catch {
			/* */
		}
	}
	try {
		await sql.query(
			`update profiles set admin_mode_allowed = true, admin_mode = true, desk_grant = true where role = 'admin' and admin_mode_allowed is not true`,
		);
	} catch {
		/* first boot */
	}
	try {
		await sql.query(`create table if not exists desk_grant_audit (
      id text primary key,
      actor_id text not null default '',
      target_id text not null default '',
      action text not null default '',
      created_at timestamptz not null default now()
    )`);
	} catch {
		/* */
	}
}

async function ensureAdminModeColumns(sql: Sql) {
	if (!shopBoot.__adminModeCols__) {
		shopBoot.__adminModeCols__ = applyAdminModeColumns(sql).catch((err) => {
			shopBoot.__adminModeCols__ = undefined;
			throw err;
		});
	}
	return shopBoot.__adminModeCols__;
}

async function applyPushSchema(sql: Sql) {
	await sql.query(`create table if not exists push_subscriptions (
    endpoint text primary key,
    user_id text not null default '',
    p256dh text not null default '',
    auth text not null default '',
    created_at timestamptz not null default now()
  )`);
	await sql.query(`create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id)`);
	try {
		await sql.query(`alter table shop_settings add column if not exists vapid_public text not null default ''`);
		await sql.query(`alter table shop_settings add column if not exists vapid_private text not null default ''`);
	} catch {
		/* */
	}
}

async function ensurePushSchema(sql: Sql) {
	if (!shopBoot.__pushSchema__) {
		shopBoot.__pushSchema__ = applyPushSchema(sql).catch((err) => {
			shopBoot.__pushSchema__ = undefined;
			throw err;
		});
	}
	return shopBoot.__pushSchema__;
}

function deskOnFrom(row: Record<string, unknown> | undefined) {
	return bool(row?.admin_mode_allowed) || row?.role === "admin";
}

async function ensureTicketNumbers(sql: Sql) {
	await sql.query(`
    with mx as (select coalesce(max(ticket_no), 0) as m from orders),
    numbered as (
      select id, (select m from mx) + row_number() over (order by created_at asc, id asc) as n
      from orders
      where ticket_no is null
    )
    update orders o set ticket_no = numbered.n from numbered where o.id = numbered.id
  `);
}
function moneyEq(v: unknown, n: number) {
	return Math.round(num(v) * 100) === Math.round(n * 100);
}

/** Lift original SQL money defaults to Silver's live locks. Skip any value an admin already saved. */
async function applyLiveMoneyLocks(sql: Sql) {
	if (!shopBoot.__moneyLocks__) {
		shopBoot.__moneyLocks__ = (async () => {
			const row = (
				await sql.query(
					`select topping_price_sm, topping_price_md, topping_price_lg, topping_price_xl, min_order_delivery, delivery_fee from shop_settings where id = 1`,
				)
			)[0] as Record<string, unknown> | undefined;
			if (!row) return;
			const bits: string[] = [];
			const params: unknown[] = [];
			const add = (col: string, value: number) => {
				params.push(value);
				bits.push(`${col} = $${params.length}`);
			};
			if (
				moneyEq(row.topping_price_sm, 1.5) &&
				moneyEq(row.topping_price_md, 1.75) &&
				moneyEq(row.topping_price_lg, 2) &&
				moneyEq(row.topping_price_xl, 2.5)
			) {
				add("topping_price_sm", DEFAULT_TOPPING_PRICES.SM);
				add("topping_price_md", DEFAULT_TOPPING_PRICES.MD);
				add("topping_price_lg", DEFAULT_TOPPING_PRICES.LG);
				add("topping_price_xl", DEFAULT_TOPPING_PRICES.XL);
			}
			if (moneyEq(row.min_order_delivery, 15)) add("min_order_delivery", 5);
			if (moneyEq(row.delivery_fee, 3.5)) add("delivery_fee", 4);
			if (!bits.length) return;
			await sql.query(`update shop_settings set ${bits.join(", ")} where id = 1`, params);
			bustStorefrontCache();
		})().catch((err) => {
			shopBoot.__moneyLocks__ = undefined;
			throw err;
		});
	}
	return shopBoot.__moneyLocks__;
}

async function runShopPatches(sql: Sql) {
	await seedIfEmpty(sql);
	await backfillSeedCondiments(sql);
	await ensureWingExtraCondiments(sql);
	await seedDemoSalesIfEmpty(sql);
	const missingTickets = await sql.query(`select 1 from orders where ticket_no is null limit 1`);
	if (missingTickets.length) await ensureTicketNumbers(sql);
	const hasLedger = await sql.query(`select 1 from rewards_ledger limit 1`);
	if (!hasLedger.length) await backfillRewardsLedger(sql);
}
async function bootShop(sql: Sql) {
	await ensureSettingsSchema(sql);
	await applyLiveMoneyLocks(sql);
	if (!shopBoot.__southendStaffAdmin__) {
		shopBoot.__southendStaffAdmin__ = ensureStaffAdmin(sql).catch((err) => {
			shopBoot.__southendStaffAdmin__ = undefined;
			console.error("[southend] staff admin seed failed", err);
		});
	}
	await shopBoot.__southendStaffAdmin__;
	if (!shopBoot.__southendBoot__) {
		shopBoot.__southendBoot__ = runShopPatches(sql).catch((err) => {
			shopBoot.__southendBoot__ = undefined;
			console.error("[southend] shop boot failed", err);
		});
	}
	if (shopBoot.__southendHasMenu__) return;
	const existing = await sql.query(`select 1 from menu_categories limit 1`);
	if (existing.length) {
		shopBoot.__southendHasMenu__ = true;
		return;
	}
	await shopBoot.__southendBoot__;
	shopBoot.__southendHasMenu__ = (await sql.query(`select 1 from menu_categories limit 1`)).length > 0;
}
async function loadCategories(sql: Sql): Promise<MenuCategory[]> {
	const cats = await sql`select id, name, note, kind, icon from menu_categories order by sort_order, name`;
	const items = await sql`select id, category_id, name, description, prices, highlight, image_data, condiments, hide_image, groups from menu_items order by sort_order, name`;
	const byCat = new Map<string, MenuItem[]>();
	for (const it of items) {
		const catId = String(it.category_id ?? "");
		const list = byCat.get(catId) ?? [];
		const prices: PriceCol[] = Array.isArray(it.prices)
			? it.prices as PriceCol[]
			: JSON.parse(String(it.prices || "[]"));
		list.push({
			id: String(it.id ?? ""),
			name: String(it.name ?? ""),
			description: it.description ? String(it.description) : undefined,
			prices,
			highlight: bool(it.highlight),
			image: it.image_data ? String(it.image_data) : undefined,
			hideImage: bool(it.hide_image),
			condiments: sanitizeCondiments(it.condiments),
			groups: parseGroups(it.groups)
		});
		byCat.set(catId, list);
	}
	return cats.map((c) => {
		const kind: CategoryKind = c.kind === "split" || c.kind === "single" ? c.kind : "pizza";
		return {
			id: String(c.id ?? ""),
			name: String(c.name ?? ""),
			note: c.note ? String(c.note) : undefined,
			kind,
			icon: c.icon ? String(c.icon) : undefined,
			items: byCat.get(String(c.id ?? "")) ?? []
		};
	});
}
async function loadSettingsRow(sql: Sql): Promise<Record<string, unknown>> {
	return (await sql`select * from shop_settings where id = 1`)[0] ?? {};
}
function publicSettings(row: Record<string, unknown>, hasZones: boolean): ShopSettingsPublic {
	const weeklyHours = parseWeeklyHours(row.weekly_hours);
	return {
		vacationOn: bool(row.vacation_on),
		vacationMessage: String(row.vacation_message ?? ""),
		vacationUntil: String(row.vacation_until ?? ""),
		paymentPlaceholder: String(row.payment_placeholder ?? ""),
		guestCardRequired: bool(row.guest_card_required),
		paymentAccounts: parsePaymentAccounts(row.payment_accounts),
		adminTotpRequired: bool(row.admin_totp_required),
		pointsPerDollar: num(row.points_per_dollar) || 1,
		redeemRate: Math.max(1, Math.round(num(row.redeem_rate) || 100)),
		welcomeBonus: Math.round(num(row.welcome_bonus)),
		inviteBonus: Math.max(0, Math.round(num(row.invite_bonus) || 100)),
		inviteeBonus: Math.max(0, Math.round(num(row.invitee_bonus) || 50)),
		minOrderDelivery: num(row.min_order_delivery),
		deliveryFee: num(row.delivery_fee),
		deliveryFeeOn: row.delivery_fee_on === void 0 || row.delivery_fee_on === null ? true : bool(row.delivery_fee_on),
		hasZones,
		deliveryZoneMode: parseDeliveryZoneMode(row.delivery_zone_mode),
		deliveryRadiusMiles: clampDeliveryRadius(row.delivery_radius_miles),
		blockNorthfield: row.block_northfield === void 0 || row.block_northfield === null ? true : bool(row.block_northfield),
		taxRate: row.tax_rate === void 0 || row.tax_rate === null || row.tax_rate === "" ? 6.625 : Math.max(0, num(row.tax_rate)),
		prepMinutes: Math.max(5, Math.round(num(row.prep_minutes) || 25)),
		deliveryMinutes: Math.max(5, Math.round(num(row.delivery_minutes) || 40)),
		tagline: String(row.tagline ?? "Egg Harbor Township, New Jersey"),
		showMark: row.show_mark === void 0 ? true : bool(row.show_mark),
		weeklyHours,
		openNow: isOpenNow(weeklyHours),
		hoursSummary: hoursSummary(weeklyHours),
		xlEnabled: bool(row.xl_enabled),
		xlInches: String(row.xl_inches || DEFAULT_XL_INCHES),
		xlPriceAdd: row.xl_price_add === void 0 || row.xl_price_add === null || row.xl_price_add === "" ? DEFAULT_XL_ADD : Math.max(0, num(row.xl_price_add)),
		toppingPriceSm: row.topping_price_sm === void 0 || row.topping_price_sm === null || row.topping_price_sm === "" ? DEFAULT_TOPPING_PRICES.SM : Math.max(0, num(row.topping_price_sm)),
		toppingPriceMd: row.topping_price_md === void 0 || row.topping_price_md === null || row.topping_price_md === "" ? DEFAULT_TOPPING_PRICES.MD : Math.max(0, num(row.topping_price_md)),
		toppingPriceLg: row.topping_price_lg === void 0 || row.topping_price_lg === null || row.topping_price_lg === "" ? DEFAULT_TOPPING_PRICES.LG : Math.max(0, num(row.topping_price_lg)),
		toppingPriceXl: row.topping_price_xl === void 0 || row.topping_price_xl === null || row.topping_price_xl === "" ? DEFAULT_TOPPING_PRICES.XL : Math.max(0, num(row.topping_price_xl)),
		toppingPricesById: seedToppingPricesById(row.topping_prices_by_id),
		backdropData: sanitizeBackdropData(row.backdrop_data),
		logoData: sanitizeBackdropData(row.logo_data),
		seasonEffect: sanitizeSeasonEffect(row.season_effect),
		cardTextSize: sanitizeCardTextSize(row.card_text_size),
		cardTextColor: sanitizeCardTextColor(row.card_text_color),
		cardDescColor: sanitizeCardTextColor(row.card_desc_color || "muted"),
		cardPriceColor: sanitizeCardTextColor(row.card_price_color || row.card_text_color || "ink"),
		cardSize: sanitizeCardSize(row.card_size),
		cardBg: sanitizeCardBg(row.card_bg || "paper"),
	};
}
function sanitizeBackdropData(raw: unknown) {
	const s = String(raw ?? "");
	if (!s) return "";
	if (s.length > 360000) return "";
	if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(s)) return "";
	return s;
}
function sanitizeNotifyAudio(raw: unknown) {
	const s = String(raw ?? "");
	if (!s) return "";
	if (s.length > 420000) return "";
	if (!/^data:audio\/(wav|x-wav|mpeg|mp3|ogg|webm|mp4);base64,/i.test(s)) return "";
	return s;
}
function restaurantFrom(row: Record<string, unknown>): RestaurantInfo {
	const raw = row.restaurant;
	let parsed: unknown = raw;
	if (typeof raw === "string") {
		try { parsed = JSON.parse(raw || "{}"); } catch { parsed = {}; }
	}
	const r = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
	const name = String(r.name || RESTAURANT.name);
	return {
		name,
		shortName: name,
		address: String(r.address || RESTAURANT.address),
		city: String(r.city || RESTAURANT.city),
		phone: String(r.phone || RESTAURANT.phone),
		phoneHref: String(r.phoneHref || RESTAURANT.phoneHref),
		hours: String(r.hours || RESTAURANT.hours),
		established: String(r.established || RESTAURANT.established)
	};
}
async function zoneCells(sql: Sql): Promise<string[]> {
	const cells = (await sql`select cells from delivery_zones where id = 1`)[0]?.cells;
	if (Array.isArray(cells)) return cells.map(String);
	if (typeof cells === "string") try {
		const parsed = JSON.parse(cells);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
	return [];
}

function zonePolicyFromRow(row: Record<string, unknown>, cells: string[]) {
	const mode = parseDeliveryZoneMode(row.delivery_zone_mode);
	const radiusMiles = clampDeliveryRadius(row.delivery_radius_miles);
	const blockNorthfield = row.block_northfield === void 0 || row.block_northfield === null ? true : bool(row.block_northfield);
	return { mode, radiusMiles, cells, blockNorthfield, hasZones: deliveryHasZones(mode, radiusMiles, cells.length) };
}

async function loadZonePolicy(sql: Sql) {
	const row = await loadSettingsRow(sql);
	const cells = await zoneCells(sql);
	return zonePolicyFromRow(row, cells);
}
async function ledgerId(kind: string) {
	return `rew-${kind}-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
}

async function addLedger(
	sql: Sql,
	userId: string,
	kind: RewardsKind,
	points: number,
	note: string,
	orderId?: string | null,
	at?: Date | string,
) {
	if (!points) return;
	await sql.query(
		`insert into rewards_ledger (id, user_id, kind, points, note, order_id, created_at)
     values ($1,$2,$3,$4,$5,$6,$7)`,
		[await ledgerId(kind), userId, kind, points, note, orderId ?? null, at ?? new Date()],
	);
}

function makeReferralCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let body = "";
	for (let i = 0; i < 5; i++) body += alphabet[randomInt(alphabet.length)];
	return `SE3${body}`;
}

async function ensureReferralCode(sql: Sql, userId: string) {
	const row = await sql`select referral_code from profiles where user_id = ${userId}`;
	const existing = String(row[0]?.referral_code ?? "").trim();
	if (existing) return existing;
	for (let i = 0; i < 8; i++) {
		const code = makeReferralCode();
		try {
			await sql.query(
				`update profiles set referral_code = $1
         where user_id = $2 and (referral_code is null or referral_code = '')`,
				[code, userId],
			);
		} catch {
			continue;
		}
		const check = String((await sql`select referral_code from profiles where user_id = ${userId}`)[0]?.referral_code ?? "");
		if (check) return check;
	}
	return makeReferralCode();
}

async function backfillRewardsLedger(sql: Sql) {
	await sql.query(`
    insert into rewards_ledger (id, user_id, kind, points, note, order_id, created_at)
    select 'earn-' || id, user_id, 'earn', points_earned,
           'Order #' || coalesce(lpad(ticket_no::text, 6, '0'), '------'),
           id, created_at
    from orders
    where points_earned > 0
    on conflict (id) do nothing
  `);
	await sql.query(`
    insert into rewards_ledger (id, user_id, kind, points, note, order_id, created_at)
    select 'redeem-' || id, user_id, 'redeem', -points_spent,
           'Redeemed on order #' || coalesce(lpad(ticket_no::text, 6, '0'), '------'),
           id, created_at
    from orders
    where points_spent > 0
    on conflict (id) do nothing
  `);
	await sql.query(`
    insert into rewards_ledger (id, user_id, kind, points, note, created_at)
    select 'welcome-' || p.user_id, p.user_id, 'welcome',
           greatest(0, coalesce((select welcome_bonus from shop_settings where id = 1), 50)),
           'Welcome bonus', p.created_at
    from profiles p
    where not exists (select 1 from rewards_ledger r where r.user_id = p.user_id and r.kind = 'welcome')
    on conflict (id) do nothing
  `);
}

async function ensureStaffAdmin(sql: Sql) {
	const { applyStaffCredential, applyStaffTotpFromEnv } = await import("@/lib/staff-credential.server");
	const userId = await applyStaffCredential(sql);
	await ensureProfile(sql, userId, STAFF_ADMIN_NAME);
	await ensureAdminModeColumns(sql);
	try {
		await sql`update profiles set admin_mode_allowed = true, display_name = ${STAFF_ADMIN_NAME} where user_id = ${userId}`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		await sql`update profiles set display_name = ${STAFF_ADMIN_NAME} where user_id = ${userId}`;
	}
	await applyStaffTotpFromEnv(sql, userId);
}

async function ensureProfile(sql: Sql, userId: string, displayName?: string) {
	// Serialize per-user inserts so POS boot (getMe + getTwoFactorStatus) cannot race
	// into profiles_pkey. Waiters re-check after the inflight settles — if the first
	// attempt failed before insert, we still create the row instead of returning empty.
	for (let spin = 0; spin < 4; spin += 1) {
		const inflight = profileLocks.get(userId);
		if (inflight) {
			await inflight.catch(() => undefined);
			if ((await sql`select user_id from profiles where user_id = ${userId} limit 1`).length) return;
			continue;
		}
		const run = ensureProfileRow(sql, userId, displayName).finally(() => {
			profileLocks.delete(userId);
		});
		profileLocks.set(userId, run);
		await run;
		return;
	}
	await ensureProfileRow(sql, userId, displayName);
}

async function ensureProfileRow(sql: Sql, userId: string, displayName?: string) {
	if ((await sql`select user_id from profiles where user_id = ${userId} limit 1`).length) return;
	const settings = await loadSettingsRow(sql);
	const bonus = Math.round(num(settings.welcome_bonus));
	for (let i = 0; i < 6; i++) {
		try {
			const inserted = await sql.query(
				`insert into profiles (user_id, role, display_name, points, referral_code, admin_mode, admin_mode_allowed, desk_grant)
         values ($1,'customer',$2,$3,$4,false,false,false)
         on conflict (user_id) do nothing
         returning user_id`,
				[userId, displayName ?? "", bonus, makeReferralCode()],
			);
			if (!inserted.length) return;
			if (bonus) await addLedger(sql, userId, "welcome", bonus, "Welcome bonus");
			return;
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err ?? "");
			if (/profiles_pkey|duplicate key|unique constraint/i.test(msg)) {
				if ((await sql`select user_id from profiles where user_id = ${userId} limit 1`).length) return;
				continue;
			}
			if (isMissingAdminModeColumn(err)) {
				await ensureAdminModeColumns(sql);
				continue;
			}
			if (i === 5) throw err;
		}
	}
}
async function requireAdmin(sql: Sql, userId: string) {
	let on = false;
	try {
		const row = (await sql`select role, admin_mode, admin_mode_allowed from profiles where user_id = ${userId}`)[0] as
			| Record<string, unknown>
			| undefined;
		if (row && "admin_mode" in row) on = deskOnFrom(row);
		else on = row?.role === "admin";
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		on = (await sql`select role from profiles where user_id = ${userId}`)[0]?.role === "admin";
	}
	if (!on) {
		const err = new Error("Forbidden") as Error & { status?: number };
		err.status = 403;
		throw err;
	}
}

async function actorCanGrantDesk(sql: Sql, userId: string) {
	let row: Record<string, unknown> | undefined;
	try {
		row = (
			await sql`select p.role, p.admin_mode, p.admin_mode_allowed, p.desk_grant, p.display_name, u.email, u.name as user_name
        from profiles p
        left join "user" u on u.id = p.user_id
        where p.user_id = ${userId}`
		)[0] as Record<string, unknown> | undefined;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		row = (await sql`select role, display_name from profiles where user_id = ${userId}`)[0] as Record<string, unknown> | undefined;
	}
	if (!row) return false;
	if (row && "admin_mode" in row && !deskOnFrom(row)) return false;
	if (!("admin_mode" in row) && row.role !== "admin") return false;
	const email = String(row.email ?? "");
	const name = String(row.user_name ?? "");
	if (silverAccountMatch(email, name, String(row.display_name ?? ""))) return true;
	return bool(row.desk_grant);
}

async function requireDeskGrant(sql: Sql, userId: string) {
	await requireAdmin(sql, userId);
	if (await actorCanGrantDesk(sql, userId)) return;
	const err = new Error("Only the shop owner can grant Admin mode.") as Error & { status?: number };
	err.status = 403;
	throw err;
}

async function profileDeskOn(sql: Sql, userId: string) {
	try {
		const row = (await sql`select admin_mode, admin_mode_allowed, role from profiles where user_id = ${userId}`)[0] as
			| Record<string, unknown>
			| undefined;
		if (row && "admin_mode" in row) return deskOnFrom(row);
		return row?.role === "admin";
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		return (await sql`select role from profiles where user_id = ${userId}`)[0]?.role === "admin";
	}
}
function silverAccountMatch(email: string, name: string, displayName: string) {
	if (isShopAdminEmail(email)) return true;
	const local = email.split("@")[0]?.trim().toLowerCase() ?? "";
	const labels = [name, displayName].map((s) => s.trim().toLowerCase());
	const handles = new Set(["silver", "silvergoon", "silvergoonist"]);
	if (handles.has(local)) return true;
	if (labels.some((n) => handles.has(n))) return true;
	return `${email} ${name} ${displayName}`.toLowerCase().includes("silvergoon");
}
async function grantListedShopAdmins(sql: Sql) {
	for (const email of SHOP_ADMIN_EMAILS) {
		const users = await sql.query(`select id from "user" where lower(email) = $1 limit 1`, [email]);
		const id = users[0]?.id ? String(users[0].id) : "";
		if (!id) continue;
		await ensureProfile(sql, id);
		try {
			await sql`update profiles set role = 'admin', admin_mode = true, admin_mode_allowed = true, desk_grant = true where user_id = ${id}`;
		} catch (err) {
			if (!isMissingAdminModeColumn(err)) throw err;
			await sql`update profiles set role = 'admin' where user_id = ${id}`;
		}
	}
}
async function grantSilverAdmin(sql: Sql, userId?: string) {
	try {
		await ensureAdminModeColumns(sql);
	} catch {
		/* missing columns handled below */
	}
	let rows: Record<string, unknown>[] = [];
	try {
		rows = userId
			? await sql`
        select p.user_id, p.role, p.admin_mode_allowed, p.display_name, u.email, u.name as user_name
        from profiles p
        left join "user" u on u.id = p.user_id
        where p.user_id = ${userId}`
			: await sql`
        select p.user_id, p.role, p.admin_mode_allowed, p.display_name, u.email, u.name as user_name
        from profiles p
        left join "user" u on u.id = p.user_id`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		rows = userId
			? await sql`
        select p.user_id, p.role, p.display_name, u.email, u.name as user_name
        from profiles p
        left join "user" u on u.id = p.user_id
        where p.user_id = ${userId}`
			: await sql`
        select p.user_id, p.role, p.display_name, u.email, u.name as user_name
        from profiles p
        left join "user" u on u.id = p.user_id`;
	}
	for (const row of rows) {
		const id = String(row.user_id ?? "");
		const email = String(row.email ?? "");
		const name = String(row.user_name ?? "");
		const displayName = String(row.display_name ?? "");
		if (!id) continue;
		if (String(row.role) === "admin" || bool(row.admin_mode_allowed)) continue;
		if (!silverAccountMatch(email, name, displayName)) continue;
		try {
			await sql`update profiles set role = 'admin', admin_mode = true, admin_mode_allowed = true, desk_grant = true where user_id = ${id}`;
		} catch (err) {
			if (!isMissingAdminModeColumn(err)) throw err;
			await sql`update profiles set role = 'admin' where user_id = ${id}`;
		}
	}
}
async function assertNotBanned(sql: Sql, userId: string) {
	if (bool((await sql`select banned from profiles where user_id = ${userId}`)[0]?.banned)) {
		throw new Error("This account has been restricted. Call the shop if you need help.");
	}
}
function parseOrderItems(raw: unknown): OrderItem[] {
	let src: unknown = raw;
	if (typeof raw === "string") {
		try { src = JSON.parse(raw); } catch { src = []; }
	}
	if (!Array.isArray(src)) return [];
	return src.map((it) => {
		const row = it && typeof it === "object" ? it as Record<string, unknown> : {};
		return {
			itemId: String(row.itemId ?? ""),
			categoryId: String(row.categoryId ?? ""),
			name: String(row.name ?? ""),
			size: row.size ? String(row.size) : undefined,
			detail: row.detail ? String(row.detail) : undefined,
			comment: row.comment ? String(row.comment).slice(0, 160) : undefined,
			toppings: sanitizeToppings(row.toppings),
			halfItemId: row.halfItemId ? String(row.halfItemId) : undefined,
			condiments: Array.isArray(row.condiments)
				? row.condiments
					.map((c) => {
						const rec = c && typeof c === "object" ? c as Record<string, unknown> : {};
						const qty = Math.max(0, Math.round(num(rec.qty)));
						if (qty <= 0) return null;
						return {
							id: String(rec.id ?? ""),
							name: String(rec.name ?? ""),
							qty,
							charge: Math.max(0, num(rec.charge))
						};
					})
					.filter((p): p is { id: string; name: string; qty: number; charge: number } => p != null && Boolean(p.name))
				: undefined,
			unitPrice: num(row.unitPrice),
			qty: Math.max(1, Math.round(num(row.qty)))
		};
	});
}
function toOrder(row: Record<string, unknown>): OrderView {
	return {
		id: String(row.id),
		ticketNo: Math.round(num(row.ticket_no)),
		userId: String(row.user_id),
		status: String(row.status),
		fulfillment: row.fulfillment === "delivery" ? "delivery" : "pickup",
		notes: String(row.notes ?? ""),
		addressLine: String(row.address_line ?? ""),
		city: String(row.city ?? ""),
		zip: String(row.zip ?? ""),
		items: parseOrderItems(row.items),
		subtotal: num(row.subtotal),
		discount: num(row.discount),
		deliveryFee: num(row.delivery_fee),
		tax: num(row.tax),
		tip: num(row.tip),
		total: num(row.total),
		pointsEarned: Math.round(num(row.points_earned)),
		pointsSpent: Math.round(num(row.points_spent)),
		paymentMethod: String(row.payment_method),
		pickupName: String(row.pickup_name ?? "").trim() || undefined,
		createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
		acceptedAt: row.accepted_at instanceof Date ? row.accepted_at.toISOString() : row.accepted_at ? String(row.accepted_at) : null,
		scheduledFor: row.scheduled_for instanceof Date ? row.scheduled_for.toISOString() : row.scheduled_for ? String(row.scheduled_for) : null,
		voidedAt: row.voided_at instanceof Date ? row.voided_at.toISOString() : row.voided_at ? String(row.voided_at) : null,
		voidReason: String(row.void_reason ?? "").trim() || undefined,
	};
}

let orderAuditReady = false;

async function writeOrderStatusAudit(
	sql: Sql,
	input: { orderId: string; fromStatus: string; toStatus: string; actorId: string },
) {
	if (input.fromStatus === input.toStatus) return;
	try {
		if (!orderAuditReady) {
			await sql.query(`create table if not exists order_status_audit (
        id text primary key,
        order_id text not null,
        from_status text not null default '',
        to_status text not null,
        actor_id text not null default '',
        created_at timestamptz not null default now()
      )`);
			await sql.query(`create index if not exists order_status_audit_order_idx on order_status_audit (order_id, created_at desc)`);
			orderAuditReady = true;
		}
		await sql.query(
			`insert into order_status_audit (id, order_id, from_status, to_status, actor_id) values ($1,$2,$3,$4,$5)`,
			[`osa-${randomBytes(8).toString("hex")}`, input.orderId, input.fromStatus, input.toStatus, input.actorId],
		);
	} catch (err) {
		console.error("[southend] order status audit", err);
	}
}

let storefrontCache: { at: number; data: Awaited<ReturnType<typeof loadStorefront>> } | null = null;
const STOREFRONT_TTL_MS = 2500;

function bustStorefrontCache() {
	storefrontCache = null;
}

async function loadStorefront() {
	const sql = await getSql();
	await bootShop(sql);
	const cats = await loadCategories(sql);
	const row = await loadSettingsRow(sql);
	const cells = await zoneCells(sql);
	const settings = publicSettings(row, zonePolicyFromRow(row, cells).hasZones);
	return {
		restaurant: restaurantFrom(row),
		footer: String(row.footer || "Ask about extra toppings, wing sauces, and dressing. Prices may change."),
		categories: applyPizzaSizing(cats, settings),
		settings
	};
}

export const getStorefront = createServerFn({ method: "GET" }).handler(async () => {
	if (storefrontCache && Date.now() - storefrontCache.at < STOREFRONT_TTL_MS) return storefrontCache.data;
	const data = await loadStorefront();
	storefrontCache = { at: Date.now(), data };
	return data;
});

export const getSocialSignIn = createServerFn({ method: "GET" }).handler(async () => {
	return { configured: socialSignInConfigured() };
});

export const getShopContact = createServerFn({ method: "GET" }).handler(async () => {
	const sql = await getSql();
	await bootShop(sql);
	const restaurant = restaurantFrom(await loadSettingsRow(sql));
	return {
		name: restaurant.name,
		address: `${restaurant.address}, ${restaurant.city}`,
		phone: restaurant.phone,
		phoneHref: restaurant.phoneHref
	};
});

export const getMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	let p: Record<string, unknown> | undefined;
	try {
		p = (await sql`select role, phone, display_name, points, totp_enabled, banned, created_at, referral_code, address_line, city, zip, admin_mode, admin_mode_allowed, desk_grant, avatar_url from profiles where user_id = ${context.userId} limit 1`)[0] as Record<string, unknown> | undefined;
	} catch {
		try {
			p = (await sql`select role, phone, display_name, points, totp_enabled, banned, created_at, referral_code, address_line, city, zip, admin_mode, admin_mode_allowed, desk_grant from profiles where user_id = ${context.userId} limit 1`)[0] as Record<string, unknown> | undefined;
		} catch {
			try {
				p = (await sql`select role, phone, display_name, points, totp_enabled, banned, created_at, referral_code from profiles where user_id = ${context.userId} limit 1`)[0] as Record<string, unknown> | undefined;
			} catch {
				p = undefined;
			}
		}
	}
	if (!p) {
		try {
			await sql.query(
				`insert into profiles (user_id, role, display_name, points) values ($1,'customer','',0) on conflict (user_id) do nothing`,
				[context.userId],
			);
			p = (await sql`select role, phone, display_name, points, totp_enabled, banned, created_at, referral_code from profiles where user_id = ${context.userId} limit 1`)[0] as Record<string, unknown> | undefined;
		} catch {
			p = { role: "customer", points: 0 };
		}
	}
	let userRow: Record<string, unknown> | undefined;
	try {
		userRow = (await sql.query(`select email, name, "emailVerified" as verified from "user" where id = $1 limit 1`, [context.userId]))[0];
	} catch {
		userRow = undefined;
	}
	const hasModeCol = Boolean(p && "admin_mode" in p);
	const silver = silverAccountMatch(String(userRow?.email ?? ""), String(userRow?.name ?? ""), String(p?.display_name ?? ""));
	const adminModeAllowed = hasModeCol ? bool(p?.admin_mode_allowed) || silver : p?.role === "admin" || silver;
	const adminMode = adminModeAllowed;
	const deskGrant = hasModeCol ? bool(p?.desk_grant) || silver : Boolean(p?.role === "admin" || silver);
	if (silver && hasModeCol && (!bool(p?.admin_mode_allowed) || !bool(p?.desk_grant))) {
		void sql`update profiles set role = 'admin', admin_mode = true, admin_mode_allowed = true, desk_grant = true where user_id = ${context.userId}`.catch(() => undefined);
	}
	let unreadChats = 0;
	let adminInbox = 0;
	try {
		unreadChats = Math.round(num((await sql`select coalesce(sum(unread_customer), 0)::int as n from chat_threads where user_id = ${context.userId} and status <> 'solved'`)[0]?.n));
		if (adminModeAllowed) {
			adminInbox = Math.round(num((await sql`select count(*)::int as n from chat_threads where unread_admin > 0 and status <> 'solved'`)[0]?.n));
		}
	} catch {
		/* badges are optional on account load */
	}
	const email = String(userRow?.email ?? "");
	const me: ProfileView = {
		userId: context.userId,
		role: adminModeAllowed ? "admin" : "customer",
		phone: String(p?.phone || phoneFromAuthEmail(email) || ""),
		displayName: String(p?.display_name || userRow?.name || "").trim(),
		addressLine: String(p?.address_line ?? ""),
		city: String(p?.city ?? ""),
		zip: String(p?.zip ?? ""),
		points: Math.round(num(p?.points)),
		totpEnabled: bool(p?.totp_enabled),
		adminExists: true,
		unreadChats,
		adminInbox,
		banned: bool(p?.banned),
		email,
		emailVerified: bool(userRow?.verified),
		referralCode: String(p?.referral_code ?? ""),
		inviteCount: 0,
		orderCount: 0,
		memberSince: p?.created_at ? String(p.created_at) : "",
		adminMode,
		adminModeAllowed,
		deskGrant,
		avatarUrl: String(p?.avatar_url ?? ""),
	};
	return me;
});
export const getMyRewards = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const referralCode = await ensureReferralCode(sql, context.userId);
	const settings = await loadSettingsRow(sql);
	const profile = await sql`select points from profiles where user_id = ${context.userId}`;
	const rows = await sql`
    select id, kind, points, note, order_id, created_at
    from rewards_ledger
    where user_id = ${context.userId}
    order by created_at desc
    limit 80`;
	const invitedRows = await sql`
    select display_name, created_at from profiles
    where referred_by = ${context.userId}
    order by created_at desc
    limit 40`;
	const kinds = new Set(["welcome", "earn", "redeem", "invite", "invitee", "adjust"]);
	const history: RewardsEvent[] = rows.map((r) => ({
		id: String(r.id),
		kind: kinds.has(String(r.kind)) ? (String(r.kind) as RewardsKind) : "adjust",
		points: Math.round(num(r.points)),
		note: String(r.note ?? ""),
		orderId: r.order_id ? String(r.order_id) : undefined,
		createdAt: String(r.created_at ?? ""),
	}));
	const view: RewardsView = {
		points: Math.round(num(profile[0]?.points)),
		referralCode,
		inviteCount: invitedRows.length,
		inviteBonus: Math.max(0, Math.round(num(settings.invite_bonus) || 100)),
		inviteeBonus: Math.max(0, Math.round(num(settings.invitee_bonus) || 50)),
		welcomeBonus: Math.round(num(settings.welcome_bonus)),
		pointsPerDollar: num(settings.points_per_dollar) || 1,
		redeemRate: Math.max(1, Math.round(num(settings.redeem_rate) || 100)),
		history,
		invited: invitedRows.map((r) => ({
			name: String(r.display_name || "Friend").trim() || "Friend",
			at: String(r.created_at ?? ""),
		})),
	};
	return view;
});
export const claimReferral = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const code = String(data?.code ?? "").trim().toUpperCase();
	if (!/^[A-Z0-9]{4,16}$/.test(code)) throw new Error("That invite code is not valid.");
	const mine = await sql`select referral_code, referred_by from profiles where user_id = ${context.userId}`;
	if (String(mine[0]?.referred_by ?? "")) return { ok: true, already: true };
	if (String(mine[0]?.referral_code ?? "").toUpperCase() === code) throw new Error("You cannot use your own invite.");
	const inviter = await sql`select user_id, display_name from profiles where referral_code = ${code} limit 1`;
	if (!inviter[0]) throw new Error("That invite code is not valid.");
	const inviterId = String(inviter[0].user_id);
	if (inviterId === context.userId) throw new Error("You cannot use your own invite.");
	const settings = await loadSettingsRow(sql);
	const inviteBonus = Math.max(0, Math.round(num(settings.invite_bonus) || 100));
	const inviteeBonus = Math.max(0, Math.round(num(settings.invitee_bonus) || 50));
	await sql.query(`update profiles set referred_by = $1 where user_id = $2 and (referred_by is null or referred_by = '')`, [
		inviterId,
		context.userId,
	]);
	const locked = await sql`select referred_by from profiles where user_id = ${context.userId}`;
	if (String(locked[0]?.referred_by ?? "") !== inviterId) return { ok: true, already: true };
	if (inviteeBonus) {
		await sql.query(`update profiles set points = points + $1 where user_id = $2`, [inviteeBonus, context.userId]);
		await addLedger(sql, context.userId, "invitee", inviteeBonus, "Joined with a friend's invite");
	}
	if (inviteBonus) {
		await sql.query(`update profiles set points = points + $1 where user_id = $2`, [inviteBonus, inviterId]);
		const guestName = String((await sql`select display_name from profiles where user_id = ${context.userId}`)[0]?.display_name || "A friend").trim() || "A friend";
		await addLedger(sql, inviterId, "invite", inviteBonus, `${guestName} joined from your invite`);
	}
	return { ok: true, already: false };
});
export const updateProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId, data.displayName);
	if (data.displayName !== void 0) await sql`update profiles set display_name = ${data.displayName} where user_id = ${context.userId}`;
	if (data.phone !== void 0) await sql`update profiles set phone = ${data.phone} where user_id = ${context.userId}`;
	if (data.addressLine !== void 0) {
		const line = String(data.addressLine ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
		await sql`update profiles set address_line = ${line} where user_id = ${context.userId}`;
	}
	if (data.city !== void 0) {
		const city = String(data.city ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
		await sql`update profiles set city = ${city} where user_id = ${context.userId}`;
	}
	if (data.zip !== void 0) {
		const zip = String(data.zip ?? "").toUpperCase().replace(/[^0-9A-Z-]/g, "").slice(0, 10);
		await sql`update profiles set zip = ${zip} where user_id = ${context.userId}`;
	}
	return { ok: true };
});
export const setMyAvatar = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: { image?: string }) => data)
	.handler(async ({ context, data }) => {
		const sql = await getSql();
		try {
			await sql.query(`alter table profiles add column if not exists avatar_url text not null default ''`);
		} catch {
			/* */
		}
		await ensureProfile(sql, context.userId);
		const image = String(data?.image ?? "").trim();
		if (!image) {
			try {
				await sql`update profiles set avatar_url = '' where user_id = ${context.userId}`;
			} catch {
				/* column missing */
			}
			return { avatarUrl: "" };
		}
		if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(image)) {
			throw new Error("Choose a JPG, PNG, or WebP photo.");
		}
		if (image.length > 200000) throw new Error("That photo is too large. Try a smaller crop.");
		try {
			await sql`update profiles set avatar_url = ${image} where user_id = ${context.userId}`;
		} catch {
			throw new Error("Could not save that photo yet. Try again.");
		}
		return { avatarUrl: image };
	});
export const claimAdmin = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureAdminModeColumns(sql);
	await ensureProfile(sql, context.userId);
	let me: Record<string, unknown> | undefined;
	try {
		me = (await sql`select role, admin_mode, admin_mode_allowed from profiles where user_id = ${context.userId}`)[0] as
			| Record<string, unknown>
			| undefined;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		me = (await sql`select role from profiles where user_id = ${context.userId}`)[0] as Record<string, unknown> | undefined;
	}
	const alreadyAdmin =
		String(me?.role ?? "") === "admin" || Boolean(me?.admin_mode) || Boolean(me?.admin_mode_allowed);
	if (alreadyAdmin) return { ok: true as const };
	let taken = 0;
	try {
		taken = num((await sql`select count(*)::int as n from profiles where role = 'admin' or admin_mode_allowed is true`)[0]?.n);
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		taken = num((await sql`select count(*)::int as n from profiles where role = 'admin'`)[0]?.n);
	}
	if (taken > 0) throw new Error("A shop admin already exists.");
	try {
		await sql`update profiles set role = 'admin', admin_mode = true, admin_mode_allowed = true, desk_grant = true where user_id = ${context.userId}`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		await sql`update profiles set role = 'admin' where user_id = ${context.userId}`;
	}
	return { ok: true as const };
});
export const setAdminMode = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: { on?: boolean }) => data)
	.handler(async ({ context, data }) => {
		const sql = await getSql();
		await ensureSettingsSchema(sql);
		await ensureProfile(sql, context.userId);
		await ensureAdminModeColumns(sql);
		const on = Boolean(data?.on);
		let row: Record<string, unknown> | undefined;
		try {
			row = (
				await sql`select role, admin_mode, admin_mode_allowed, display_name from profiles where user_id = ${context.userId}`
			)[0];
		} catch (err) {
			if (!isMissingAdminModeColumn(err)) throw err;
			await ensureAdminModeColumns(sql);
			try {
				row = (
					await sql`select role, admin_mode, admin_mode_allowed, display_name from profiles where user_id = ${context.userId}`
				)[0];
			} catch {
				row = (await sql`select role, display_name from profiles where user_id = ${context.userId}`)[0];
			}
		}
		if (!row) throw new Error("Account not found.");
		const email = String((await sql.query(`select email, name from "user" where id = $1 limit 1`, [context.userId]))[0]?.email ?? "");
		const name = String((await sql.query(`select name from "user" where id = $1 limit 1`, [context.userId]))[0]?.name ?? "");
		const allowed =
			bool(row.admin_mode_allowed) ||
			row.role === "admin" ||
			isStaffAdminAccount(context.userId, email) ||
			silverAccountMatch(email, name, String(row.display_name ?? ""));
		if (!allowed) {
			const err = new Error("Admin mode is not enabled for this account.") as Error & { status?: number };
			err.status = 403;
			throw err;
		}
		if (on) {
			try {
				await sql`update profiles set role = 'admin', admin_mode = true, admin_mode_allowed = true where user_id = ${context.userId}`;
			} catch (err) {
				if (!isMissingAdminModeColumn(err)) throw err;
				await ensureAdminModeColumns(sql);
				await sql`update profiles set role = 'admin', admin_mode = true, admin_mode_allowed = true where user_id = ${context.userId}`;
			}
		} else {
			try {
				await sql`update profiles set role = 'customer', admin_mode = false where user_id = ${context.userId}`;
			} catch (err) {
				if (!isMissingAdminModeColumn(err)) throw err;
				await ensureAdminModeColumns(sql);
				await sql`update profiles set role = 'customer', admin_mode = false where user_id = ${context.userId}`;
			}
		}
		const { writeStaffDeskAudit } = await import("@/lib/staff-credential.server");
		await writeStaffDeskAudit(sql, {
			userId: context.userId,
			kind: on ? "mode-on" : "mode-off",
			diagnostic: false,
		});
		return {
			ok: true,
			adminMode: on,
			adminModeAllowed: true,
			role: on ? ("admin" as const) : ("customer" as const),
		};
	});
export const getTwoFactorStatus = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	let enabled = false;
	try {
		enabled = bool((await sql`select totp_enabled from profiles where user_id = ${context.userId} limit 1`)[0]?.totp_enabled);
	} catch {
		enabled = false;
	}
	if (!enabled) {
		return { required: false, unlocked: true, enabled: false, enroll: false, locked: false };
	}
	const exp = (await sql`select expires_at from two_factor_unlocks where user_id = ${context.userId}`)[0]?.expires_at;
	const unlocked = Boolean(exp && new Date(String(exp)).getTime() > Date.now());
	return {
		required: !unlocked,
		unlocked,
		enabled: true,
		enroll: false,
		locked: true,
	};
});
export const startTotpSetup = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	const existing = (await sql`select totp_secret, totp_enabled from profiles where user_id = ${context.userId}`)[0];
	if (existing?.totp_secret) {
		const secret = String(existing.totp_secret);
		return { secret, uri: totpUri(secret, context.userId) };
	}
	// Mint at most once under concurrency: only the UPDATE that finds a NULL secret wins.
	const minted = generateTotpSecret();
	const written = await sql.query(
		`update profiles set totp_secret = $1
       where user_id = $2 and (totp_secret is null or totp_secret = '')
       returning totp_secret`,
		[minted, context.userId],
	);
	const secret = String(
		written[0]?.totp_secret
			?? (await sql`select totp_secret from profiles where user_id = ${context.userId}`)[0]?.totp_secret
			?? "",
	);
	if (!secret) throw new Error("Could not start authenticator setup.");
	return {
		secret,
		uri: totpUri(secret, context.userId)
	};
});
export const confirmTotpSetup = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	const secret = String((await sql`select totp_secret from profiles where user_id = ${context.userId}`)[0]?.totp_secret ?? "");
	if (!secret || !verifyTotp(secret, String(data.code || ""))) throw new Error("That code did not match. Try again.");
	await sql`update profiles set totp_enabled = true where user_id = ${context.userId}`;
	await sql.query(`insert into two_factor_unlocks (user_id, expires_at) values ($1, now() + interval '12 hours')
       on conflict (user_id) do update set expires_at = now() + interval '12 hours'`, [context.userId]);
	return { ok: true };
});
export const verifyTotpChallenge = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	const rows = await sql`
      select totp_secret, totp_enabled from profiles where user_id = ${context.userId}`;
	if (!bool(rows[0]?.totp_enabled) || !rows[0]?.totp_secret) throw new Error("Two-factor is not enabled.");
	if (!verifyTotp(String(rows[0].totp_secret), String(data.code || ""))) throw new Error("That code did not match.");
	await sql.query(`insert into two_factor_unlocks (user_id, expires_at) values ($1, now() + interval '12 hours')
       on conflict (user_id) do update set expires_at = now() + interval '12 hours'`, [context.userId]);
	return { ok: true };
});
export const disableTotp = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	const email = String((await sql.query(`select email from "user" where id = $1 limit 1`, [context.userId]))[0]?.email ?? "");
	const role = String((await sql`select role from profiles where user_id = ${context.userId}`)[0]?.role ?? "");
	if (role === "admin" || isStaffAdminAccount(context.userId, email)) {
		if (bool((await loadSettingsRow(sql)).admin_totp_required)) {
			throw new Error("Shop admin two-factor is required in Settings.");
		}
	}
	const rows = await sql`select totp_secret from profiles where user_id = ${context.userId}`;
	if (!rows[0]?.totp_secret || !verifyTotp(String(rows[0].totp_secret), String(data.code || ""))) throw new Error("That code did not match.");
	await sql`update profiles set totp_enabled = false, totp_secret = null where user_id = ${context.userId}`;
	await sql`delete from two_factor_unlocks where user_id = ${context.userId}`;
	return { ok: true };
});
async function assertTwoFactor(sql: Sql, userId: string) {
	const profile = (await sql`select totp_enabled, role from profiles where user_id = ${userId}`)[0];
	const email = String((await sql.query(`select email from "user" where id = $1 limit 1`, [userId]))[0]?.email ?? "");
	const isAdmin = profile?.role === "admin" || isStaffAdminAccount(userId, email);
	const shopRequires = isAdmin && bool((await loadSettingsRow(sql)).admin_totp_required);
	const must = bool(profile?.totp_enabled) || shopRequires;
	if (!must) return;
	if (!bool(profile?.totp_enabled)) throw new Error("Two-factor enrollment required.");
	const exp = (await sql`select expires_at from two_factor_unlocks where user_id = ${userId}`)[0]?.expires_at;
	if (!exp || new Date(String(exp)).getTime() <= Date.now()) throw new Error("Two-factor verification required.");
}

async function assertEmailVerifiedForOrder(sql: Sql, userId: string) {
	const rows = await sql.query(`select email, "emailVerified" as verified from "user" where id = $1 limit 1`, [userId]);
	const email = String(rows[0]?.email ?? "");
	const verified = rows[0]?.verified === true || rows[0]?.verified === "t" || rows[0]?.verified === "true";
	if (verified) return;
	if (!needsEmailOtp(email) && !needsPhoneOtp(email)) return;
	const credential = await loadCredentialAccount(sql, userId);
	if (!credential) return;
	if (needsPhoneOtp(email)) {
		throw new Error("Verify your phone before placing an order. Check your texts for the 6-digit code.");
	}
	throw new Error("Verify your email before placing an order. Check your inbox for the 6-digit code.");
}
export const checkDeliveryAddress = createServerFn({ method: "POST" }).validator((data: { query: string }) => ({ query: data.query.trim() })).handler(async ({ data }) => {
	if (!data.query) throw new Error("Enter a street address.");
	const sql = await getSql();
	const policy = await loadZonePolicy(sql);
	const hits = await lookupDeliveryHits(data.query, policy);
	const hit = hits[0];
	if (!hit) {
		return {
			found: false,
			deliverable: false,
			label: "",
			street: data.query,
			city: "",
			county: "",
			zip: "",
			miles: 0,
			reason: "not found" as DeliveryFailReason,
		};
	}
	return {
		found: true,
		deliverable: hit.deliverable,
		label: hit.label,
		street: hit.street,
		city: hit.city,
		county: hit.county,
		zip: hit.zip,
		lat: hit.lat,
		lng: hit.lng,
		miles: hit.miles ?? 0,
		reason: hit.reason ?? "",
		mapsUrl: `https://www.google.com/maps/search/?api=1&query=${hit.lat},${hit.lng}`,
	};
});

const suggestCache = new Map<string, { at: number; hits: AddressSuggestion[] }>();
const SUGGEST_FALLBACK_TOWNS = [
	"Linwood, NJ",
	"Northfield, NJ",
	"Pleasantville, NJ",
	"Somers Point, NJ",
	"Egg Harbor Township, NJ",
	"Absecon, NJ",
	"Brigantine, NJ",
	"Atlantic County, NJ",
];

type ZonePolicy = {
	mode: "paint" | "radius";
	radiusMiles: number;
	cells: string[];
	blockNorthfield: boolean;
};

type NominatimRow = { lat: string; lon: string; display_name: string; address?: Record<string, string> };

function timedFetch(url: string, init: RequestInit = {}, ms = 4000) {
	const ac = new AbortController();
	const timer = setTimeout(() => ac.abort(), ms);
	return fetch(url, { ...init, signal: ac.signal }).finally(() => clearTimeout(timer));
}

async function nominatimSearch(query: string, viewbox: string, limit: number) {
	const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&countrycodes=us&viewbox=${encodeURIComponent(viewbox)}&q=${encodeURIComponent(query)}`;
	try {
		const res = await timedFetch(url, { headers: { "User-Agent": "SouthEndPizzaIII/1.0 (delivery-zone)" } });
		if (!res.ok) return [] as NominatimRow[];
		const data = await res.json();
		return Array.isArray(data) ? (data as NominatimRow[]) : [];
	} catch {
		return [] as NominatimRow[];
	}
}

async function nominatimReverse(lat: number, lng: number): Promise<NominatimRow | null> {
	const url = `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`;
	try {
		const res = await timedFetch(url, { headers: { "User-Agent": "SouthEndPizzaIII/1.0 (delivery-zone)" } });
		if (!res.ok) return null;
		const data = (await res.json()) as NominatimRow;
		if (!data || !data.lat) return null;
		return data;
	} catch {
		return null;
	}
}

async function expandMapsUrl(url: string) {
	if (!/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url)) return url;
	try {
		const res = await timedFetch(url, { method: "GET", redirect: "follow", headers: { "User-Agent": "SouthEndPizzaIII/1.0 (delivery-zone)" } });
		return res.url || url;
	} catch {
		return url;
	}
}

async function censusGeocode(address: string): Promise<NominatimRow | null> {
	const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
	try {
		const res = await timedFetch(url, { headers: { "User-Agent": "SouthEndPizzaIII/1.0 (delivery-zone)" } });
		if (!res.ok) return null;
		const data = (await res.json()) as {
			result?: { addressMatches?: Array<{ matchedAddress?: string; coordinates?: { x?: number; y?: number } }> };
		};
		const match = data.result?.addressMatches?.[0];
		const lng = Number(match?.coordinates?.x);
		const lat = Number(match?.coordinates?.y);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
		return {
			lat: String(lat),
			lon: String(lng),
			display_name: String(match?.matchedAddress ?? address),
			address: {},
		};
	} catch {
		return null;
	}
}

function decorateHit(parsed: AddressSuggestion, policy: ZonePolicy, raw: string): AddressSuggestion {
	const reason = deliveryFailReason({
		mode: policy.mode,
		radiusMiles: policy.radiusMiles,
		cells: policy.cells,
		lat: parsed.lat,
		lng: parsed.lng,
		query: raw,
		label: parsed.label,
		city: parsed.city,
		zip: parsed.zip,
		blockNorthfield: policy.blockNorthfield,
	});
	const miles = Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng) ? milesBetween(SHOP_LAT, SHOP_LNG, parsed.lat, parsed.lng) : 0;
	return {
		...parsed,
		street: parsed.street || parsed.label.split(",")[0]?.trim() || raw,
		deliverable: !reason,
		miles,
		reason,
	};
}

function suggestionFromHit(row: NominatimRow, policy: ZonePolicy, raw: string): AddressSuggestion | null {
	const parsed = parseNominatimHit(row);
	if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) return null;
	return decorateHit(parsed, policy, raw);
}

async function lookupDeliveryHits(raw: string, policy: ZonePolicy): Promise<AddressSuggestion[]> {
	const viewbox = policy.mode === "radius" ? nominatimViewboxForRadius(policy.radiusMiles) : SEARCH_VIEWBOX;
	if (isMapsQuery(raw)) {
		const expanded = await expandMapsUrl(raw);
		const pin = parseMapsLatLng(expanded) ?? parseMapsLatLng(raw);
		if (pin) {
			const rev = await nominatimReverse(pin.lat, pin.lng);
			const row = rev ?? {
				lat: String(pin.lat),
				lon: String(pin.lng),
				display_name: `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`,
				address: {},
			};
			const hit = suggestionFromHit(row, policy, raw);
			return hit ? [hit] : [];
		}
	}
	const q = expandDeliveryQuery(raw);
	const seen = new Set<string>();
	const hits: AddressSuggestion[] = [];
	const absorb = (rows: NominatimRow[]) => {
		for (const row of rows) {
			const hit = suggestionFromHit(row, policy, raw);
			if (!hit) continue;
			const id = `${hit.street.toLowerCase()}|${hit.city.toLowerCase()}|${hit.zip}|${hit.lat.toFixed(4)}|${hit.lng.toFixed(4)}`;
			if (seen.has(id)) continue;
			seen.add(id);
			hits.push(hit);
			if (hits.length >= 8) return;
		}
	};
	absorb(await nominatimSearch(q, viewbox, 12));
	if (hits.length < 3 && !isMapsQuery(raw)) {
		for (const town of SUGGEST_FALLBACK_TOWNS) {
			if (hits.length >= 3) break;
			absorb(await nominatimSearch(`${raw}, ${town}`, viewbox, 5));
		}
	}
	if (!hits.length) {
		const census = await censusGeocode(/nj|new jersey/i.test(raw) ? raw : `${raw}, NJ`);
		if (census) absorb([census]);
	}
	return hits.slice(0, 8);
}

function clearSuggestCache() {
	suggestCache.clear();
}

export const suggestDeliveryAddresses = createServerFn({ method: "POST" }).validator((data: { query: string }) => ({ query: String(data.query ?? "").trim() })).handler(async ({ data }) => {
	const raw = data.query;
	if (raw.length < 3 && !isMapsQuery(raw)) return { hits: [] as AddressSuggestion[] };
	const policy = await loadZonePolicy(await getSql());
	const key = `${policy.mode}:${policy.radiusMiles}:${policy.blockNorthfield}:${policy.cells.length}:${raw.toLowerCase()}`;
	const cached = suggestCache.get(key);
	if (cached && Date.now() - cached.at < 5 * 60_000) return { hits: cached.hits };
	try {
		const capped = await lookupDeliveryHits(raw, policy);
		if (suggestCache.size > 80) suggestCache.clear();
		suggestCache.set(key, { at: Date.now(), hits: capped });
		return { hits: capped };
	} catch {
		return { hits: [] as AddressSuggestion[] };
	}
});
async function ensureGuestCustomer(sql: Sql, name: string, phone: string) {
	const pretty = formatPhone(phone);
	const existing = await sql`select user_id from profiles where phone = ${phone} or phone = ${pretty} limit 1`;
	if (existing[0]?.user_id) {
		const userId = String(existing[0].user_id);
		await assertNotBanned(sql, userId);
		await sql`update profiles set display_name = case when coalesce(display_name, '') = '' then ${name} else display_name end, phone = ${pretty} where user_id = ${userId}`;
		return userId;
	}
	const userId = `guest-${phone}`;
	const email = `${phone}@guest.southend.pizza`;
	const found = (await sql.query(`select id from "user" where email = $1 or id = $2 limit 1`, [email, userId]))[0];
	if (found?.id) {
		const id = String(found.id);
		await ensureProfile(sql, id, name);
		await sql`update profiles set phone = ${pretty}, display_name = case when coalesce(display_name, '') = '' then ${name} else display_name end where user_id = ${id}`;
		await assertNotBanned(sql, id);
		return id;
	}
	await sql.query(
		`insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ($1,$2,$3,false,now(),now())`,
		[userId, name, email],
	);
	await ensureProfile(sql, userId, name);
	await sql`update profiles set phone = ${pretty}, display_name = ${name} where user_id = ${userId}`;
	return userId;
}

async function writePlacedOrder(sql: Sql, userId: string, data: any) {
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, userId);
	await assertNotBanned(sql, userId);
	const settings = await loadSettingsRow(sql);
	if (bool(settings.vacation_on)) throw new Error(String(settings.vacation_message || "The shop is closed for vacation."));
	if (!data.lines?.length) throw new Error("Your cart is empty.");
	if (data.fulfillment === "pickup" && data.paymentMethod === "pay_delivery") throw new Error("Choose pay at pickup.");
	if (data.fulfillment === "delivery" && data.paymentMethod === "pay_pickup") throw new Error("Choose cash.");
	if (isProcessorPayment(String(data.paymentMethod ?? ""))) {
		throw new Error("Card payments are not capturing yet. Pay at pickup or with cash.");
	}
	const pickupName = String(data.pickupName ?? "").trim().slice(0, 80);
	if (data.fulfillment === "pickup" && !pickupName) throw new Error("Enter the name for pickup.");
	const menuItems = await sql`select id, category_id, name, prices, condiments, groups from menu_items`;
	const byId = new Map(menuItems.map((m) => [String(m.id), m]));
	const cats = await loadCategories(sql);
	const kindByCat = new Map(cats.map((c) => [c.id, c.kind]));
	const pub = publicSettings(settings, false);
	const priced: OrderItem[] = [];
	for (const line of data.lines as Array<Record<string, unknown>>) {
		const item = byId.get(String(line.itemId ?? ""));
		if (!item) throw new Error("A menu item is no longer available.");
		const prices: PriceCol[] = Array.isArray(item.prices)
			? item.prices as PriceCol[]
			: JSON.parse(String(item.prices || "[]"));
		const wantSize = line.size ? String(line.size) : "";
		const col = (wantSize && prices.find((p) => p.label === wantSize)) || prices[0];
		const qty = Math.max(1, Math.min(20, Math.round(num(line.qty))));
		const kind = kindByCat.get(String(item.category_id ?? ""));
		const comment = String(line.comment ?? "").trim().slice(0, 160) || undefined;
		const catalogItem = {
			id: String(item.id ?? ""),
			name: String(item.name ?? ""),
			prices,
			groups: parseGroups(item.groups),
		};
		const catMeta = cats.find((c) => c.id === String(item.category_id ?? ""));
		if (catMeta && hasGroup(catMeta, catalogItem, GROUP_SAUCE_DIP)) {
			const catalog = sanitizeCondiments(item.condiments);
			const built = sanitizeWingPicks(line.condiments, catalog);
			if (!built) throw new Error("Pick a sauce and included dressings.");
			if (isWingsBuild(catMeta, catalogItem)) {
				const pieceQty = parseWingQty(wantSize) || parseWingQty(col?.label) || WING_QTY_MIN;
				const baseCol =
					prices.find((p) => parseWingQty(p.label) === WING_QTY_MIN) ??
					prices.find((p) => p.price) ??
					col;
				const bags = pieceQty / WING_QTY_MIN;
				priced.push({
					itemId: String(item.id ?? ""),
					categoryId: String(item.category_id ?? ""),
					name: String(item.name ?? ""),
					size: `${pieceQty} pc`,
					detail: built.detail,
					comment,
					condiments: built.condiments,
					unitPrice: Math.round((num(baseCol?.price) * bags + built.extras) * 100) / 100,
					qty
				});
			} else {
				priced.push({
					itemId: String(item.id ?? ""),
					categoryId: String(item.category_id ?? ""),
					name: String(item.name ?? ""),
					size: col?.label ? String(col.label) : wantSize || undefined,
					detail: built.detail,
					comment,
					condiments: built.condiments,
					unitPrice: Math.round((num(col?.price) + built.extras) * 100) / 100,
					qty
				});
			}
			continue;
		}
		if (catMeta && hasGroup(catMeta, catalogItem, GROUP_SALAD)) {
			const catalog = sanitizeCondiments(item.condiments);
			const built = sanitizeSaladPicks(line.condiments, catalog);
			if (!built) throw new Error("Pick a dressing.");
			priced.push({
				itemId: String(item.id ?? ""),
				categoryId: String(item.category_id ?? ""),
				name: String(item.name ?? ""),
				size: col?.label ? String(col.label) : wantSize || undefined,
				detail: built.detail,
				comment,
				condiments: built.condiments,
				unitPrice: Math.round((num(col?.price) + built.extras) * 100) / 100,
				qty
			});
			continue;
		}
		if (catMeta && (hasGroup(catMeta, catalogItem, GROUP_PASTA) || isPastaPlatter(catMeta, catalogItem))) {
			const shapeRequired = hasGroup(catMeta, catalogItem, GROUP_PASTA);
			const shape = pastaShapeFromPicks(line.condiments);
			if (shapeRequired && !shape) throw new Error("Pick Penne or Spaghetti.");
			const platter = isPastaPlatter(catMeta, catalogItem);
			const dressing = pastaDressingFromPicks(line.condiments);
			if (platter && !dressing) throw new Error("Pick a salad dressing.");
			const bread = pastaBreadFromPicks(line.condiments);
			const catalog = sanitizeCondiments(item.condiments);
			const extras = sanitizeCondimentPicks(line.condiments, catalog);
			const extra = condimentTotal(extras);
			const condiments = [
				...(shape ? [pastaShapePick(shape)] : []),
				...(dressing ? [pastaDressingPick(dressing)] : []),
				...(platter ? [pastaBreadPick(bread)] : []),
				...extras,
			];
			priced.push({
				itemId: String(item.id ?? ""),
				categoryId: String(item.category_id ?? ""),
				name: String(item.name ?? ""),
				size: col?.label ? String(col.label) : wantSize || undefined,
				detail: mergeItemDetail(
					shape,
					dressing,
					platter ? (bread === "none" ? "No bread" : "Keep bread") : "",
					condimentDetail(extras),
				) || undefined,
				comment,
				condiments,
				unitPrice: Math.round((num(col?.price) + extra) * 100) / 100,
				qty
			});
			continue;
		}
		const catalog = sanitizeCondiments(item.condiments);
		const rawCondiments = sanitizeCondimentPicks(line.condiments, catalog);
		const buffalo = kind === "pizza" && catMeta && hasGroup(catMeta, catalogItem, GROUP_BUFFALO);
		const dipBuilt = buffalo ? sanitizeBuffaloPicks(line.condiments, catalog) : null;
		if (buffalo && !dipBuilt) throw new Error("Pick Ranch, Blue cheese, or none.");
		const condiments = rawCondiments.filter((c) => {
			if (!buffalo) return true;
			const id = String(c.id ?? "").toLowerCase();
			if (id.startsWith("wing-dip-") || isExtraKind(c, "ranch") || isExtraKind(c, "blue")) return false;
			return true;
		});
		const extra = condimentTotal(condiments) + (dipBuilt?.extras ?? 0);
		const extrasDetail = mergeItemDetail(dipBuilt?.detail, condimentDetail(condiments));
		if (kind === "pizza") {
			const toppings = sanitizeToppings(line.toppings);
			const halfId = String(line.halfItemId ?? "");
			const otherRow = halfId && halfId !== String(item.id) ? byId.get(halfId) : undefined;
			let other: { name: string; prices: PriceCol[] } | null = null;
			if (otherRow) {
				const otherPrices: PriceCol[] = Array.isArray(otherRow.prices)
					? otherRow.prices as PriceCol[]
					: JSON.parse(String(otherRow.prices || "[]"));
				other = {
					name: String(otherRow.name ?? ""),
					prices: otherPrices
				};
			}
			const built = pricePizzaBuild({
				item: {
					name: String(item.name ?? ""),
					prices
				},
				other,
				size: wantSize || String(col?.label || "LG"),
				toppings,
				settings: pub
			});
			priced.push({
				itemId: String(item.id ?? ""),
				categoryId: String(item.category_id ?? ""),
				name: built.name,
				size: wantSize || (col?.label ? String(col.label) : undefined),
				detail: mergeItemDetail(built.detail, extrasDetail) || undefined,
				comment,
				toppings,
				halfItemId: halfId || undefined,
				condiments: [...(dipBuilt?.condiments ?? []), ...condiments].length
					? [...(dipBuilt?.condiments ?? []), ...condiments]
					: undefined,
				unitPrice: Math.round((built.unitPrice + extra) * 100) / 100,
				qty
			});
		} else {
			priced.push({
				itemId: String(item.id ?? ""),
				categoryId: String(item.category_id ?? ""),
				name: String(item.name ?? ""),
				size: col?.label ? String(col.label) : wantSize || undefined,
				detail: extrasDetail || undefined,
				comment,
				condiments: condiments.length ? condiments : undefined,
				unitPrice: Math.round((num(col?.price) + extra) * 100) / 100,
				qty
			});
		}
	}
	const subtotal = priced.reduce((s, l) => s + l.unitPrice * l.qty, 0);
	const profile = await sql`select points from profiles where user_id = ${userId}`;
	const points = Math.round(num(profile[0]?.points));
	const redeemRate = Math.max(1, Math.round(num(settings.redeem_rate) || 100));
	const want = Math.max(0, Math.round(num(data.redeemPoints)));
	const maxByPoints = Math.floor(points / redeemRate) * redeemRate;
	const maxBySub = Math.floor(subtotal * redeemRate);
	const spent = Math.min(want, maxByPoints, maxBySub);
	const discount = spent / redeemRate;
	const lat = data.lat;
	const lng = data.lng;
	const deliveryFee = checkoutDeliveryFee(
		{
			deliveryFee: num(settings.delivery_fee),
			deliveryFeeOn: settings.delivery_fee_on === void 0 || settings.delivery_fee_on === null ? true : bool(settings.delivery_fee_on),
		},
		String(data.fulfillment ?? ""),
	);
	if (data.fulfillment === "delivery") {
		const min = num(settings.min_order_delivery);
		if (subtotal < min) {
			const need = Math.max(0, Math.round((min - subtotal) * 100) / 100);
			throw new Error(`Add $${need.toFixed(2)} more for delivery (minimum $${min.toFixed(2)}).`);
		}
		const policy = await loadZonePolicy(sql);
		if (!policy.hasZones) throw new Error("Delivery zones are not set yet. Please choose pickup.");
		if (lat == null || lng == null) throw new Error("Check the delivery address first.");
		if (!isAddressDeliverable({
			mode: policy.mode,
			radiusMiles: policy.radiusMiles,
			cells: policy.cells,
			lat: Number(lat),
			lng: Number(lng),
			query: String(data.addressLine ?? ""),
			city: String(data.city ?? ""),
			zip: String(data.zip ?? ""),
			blockNorthfield: policy.blockNorthfield,
		})) {
			throw new Error("That address is outside our delivery zone.");
		}
	}
	const weeklyHours = parseWeeklyHours(settings.weekly_hours);
	const scheduledDate = String(data.scheduledDate ?? "").trim();
	const scheduledTime = String(data.scheduledTime ?? "").trim();
	let scheduledAt: Date | null = null;
	if (scheduledDate || scheduledTime) {
		if (!scheduledDate || !scheduledTime) throw new Error("Pick both a date and a time to schedule.");
		scheduledAt = nyWallToDate(scheduledDate, scheduledTime);
		if (!scheduledAt) throw new Error("Pick a valid pickup or delivery time.");
		const min = Date.now() + 15 * 60 * 1000;
		const max = Date.now() + 14 * 24 * 60 * 60 * 1000;
		if (scheduledAt.getTime() < min) throw new Error("Pick a time at least 15 minutes from now.");
		if (scheduledAt.getTime() > max) throw new Error("Schedule within the next 14 days.");
		if (!isOpenNow(weeklyHours, scheduledAt)) throw new Error(`The kitchen is closed at that time. ${hoursSummary(weeklyHours)}`);
	} else if (!bool(settings.vacation_on) && !isOpenNow(weeklyHours)) {
		throw new Error(`The kitchen is closed. ${hoursSummary(weeklyHours)}`);
	}
	const { tax, total: preTip } = computeTax(subtotal, discount, deliveryFee, settings.tax_rate === void 0 || settings.tax_rate === null || settings.tax_rate === "" ? 6.625 : Math.max(0, num(settings.tax_rate)));
	const tip = clampTip(data.tip);
	const total = Math.round((preTip + tip) * 100) / 100;
	const earnRate = num(settings.points_per_dollar) || 1;
	const earned = Math.max(0, Math.round(Math.max(0, subtotal - discount) * earnRate));
	const id = `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
	const ticketNo = Math.max(1, Math.round(num((await sql`select coalesce(max(ticket_no), 0) + 1 as n from orders`)[0]?.n)));
	await sql.query(`insert into orders (
        id, ticket_no, user_id, status, fulfillment, notes, address_line, city, zip, lat, lng,
        items, subtotal, discount, delivery_fee, tax, tip, total, points_earned, points_spent, payment_method, pickup_name, scheduled_for
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
      )`, [
		id,
		ticketNo,
		userId,
		data.paymentMethod === "pay_card" ? "awaiting_payment" : "placed",
		data.fulfillment,
		data.notes?.slice(0, 500) ?? "",
		data.addressLine ?? "",
		data.city ?? "",
		data.zip ?? "",
		lat ?? null,
		lng ?? null,
		JSON.stringify(priced),
		subtotal.toFixed(2),
		discount.toFixed(2),
		deliveryFee.toFixed(2),
		tax.toFixed(2),
		tip.toFixed(2),
		total.toFixed(2),
		earned,
		spent,
		data.paymentMethod,
		data.fulfillment === "pickup" ? pickupName : "",
		scheduledAt
	]);
	await sql.query(`update profiles set points = points - $1 + $2 where user_id = $3`, [
		spent,
		earned,
		userId
	]);
	if (earned) await addLedger(sql, userId, "earn", earned, `Order #${String(ticketNo).padStart(6, "0")}`, id);
	if (spent) await addLedger(sql, userId, "redeem", -spent, `Redeemed on order #${String(ticketNo).padStart(6, "0")}`, id);
	return {
		id,
		ticketNo,
		total,
		earned,
		spent,
		status: data.paymentMethod === "pay_card" ? "awaiting_payment" : "placed"
	};
}

export const placeOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	const { consumeOrderAttempt } = await import("@/lib/rate-limit.server");
	await consumeOrderAttempt(sql, context.userId);
	await assertTwoFactor(sql, context.userId);
	await assertEmailVerifiedForOrder(sql, context.userId);
	return writePlacedOrder(sql, context.userId, data);
});

export const placeGuestOrder = createServerFn({ method: "POST" }).validator((data: any) => data).handler(async ({ data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	const name = String(data.guestName ?? "").trim().slice(0, 80);
	const phone = toTenDigitPhone(String(data.guestPhone ?? ""));
	if (!name) throw new Error("Enter your name.");
	if (!phone) throw new Error("Enter a 10-digit US phone number.");
	const userId = await ensureGuestCustomer(sql, name, phone);
	const pickupName = String(data.pickupName ?? "").trim().slice(0, 80) || name;
	return writePlacedOrder(sql, userId, { ...data, redeemPoints: 0, pickupName });
});
export const listMyOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	const mine = await sql`select * from orders where user_id = ${context.userId} order by created_at desc limit 50`;
	if (mine.length) return mine.map(toOrder);
	let phone = "";
	try {
		phone = String((await sql`select phone from profiles where user_id = ${context.userId} limit 1`)[0]?.phone ?? "").replace(/\D/g, "");
	} catch {
		phone = "";
	}
	if (phone.length < 10) return [];
	const guestId = `guest-${phone}`;
	const extra = await sql`select * from orders where user_id = ${guestId} order by created_at desc limit 50`;
	return extra.map(toOrder);
});
export const saveShopMenu = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	await sql`delete from menu_items`;
	await sql`delete from menu_categories`;
	const settingsRow = await loadSettingsRow(sql);
	const sized = applyPizzaSizing((data.categories ?? []) as MenuCategory[], publicSettings(settingsRow, true));
	let i = 0;
	for (const cat of sized) {
		await sql.query(`insert into menu_categories (id, name, note, kind, icon, sort_order) values ($1,$2,$3,$4,$5,$6)`, [
			cat.id,
			cat.name,
			cat.note ?? "",
			cat.kind,
			cat.icon ?? cat.id,
			i
		]);
		let j = 0;
		for (const item of cat.items) {
			await sql.query(`insert into menu_items (id, category_id, name, description, prices, highlight, sort_order, image_data, condiments, hide_image, groups)
           values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9::jsonb,$10,$11::jsonb)`, [
				item.id ?? `${cat.id}-${j}`,
				cat.id,
				item.name,
				item.description ?? "",
				JSON.stringify(item.prices),
				Boolean(item.highlight),
				j,
				typeof item.image === "string" && item.image.startsWith("data:image/") && item.image.length <= 420000 ? item.image : "",
				JSON.stringify(sanitizeCondiments(item.condiments)),
				Boolean(item.hideImage),
				parseGroups(item.groups) == null ? null : JSON.stringify(parseGroups(item.groups)),
			]);
			j += 1;
		}
		i += 1;
	}
	const restaurant = restaurantFrom({ restaurant: data.restaurant });
	await sql.query(`update shop_settings set restaurant = $1::jsonb, footer = $2 where id = 1`, [JSON.stringify(restaurant), data.footer]);
	bustStorefrontCache();
	return { ok: true };
});
export const saveShopSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const sets: string[] = [];
	const params: unknown[] = [];
	const add = (col: string, val: unknown) => {
		if (val === void 0) return;
		params.push(val);
		sets.push(`${col} = $${params.length}`);
	};
	add("vacation_on", data.vacationOn);
	add("vacation_message", data.vacationMessage);
	add("vacation_until", data.vacationUntil);
	add("payment_placeholder", data.paymentPlaceholder);
	add("guest_card_required", data.guestCardRequired);
	if (data.paymentAccounts !== void 0) {
		params.push(JSON.stringify(parsePaymentAccounts(data.paymentAccounts)));
		sets.push(`payment_accounts = $${params.length}::jsonb`);
	}
	add("admin_totp_required", data.adminTotpRequired);
	add("points_per_dollar", data.pointsPerDollar);
	add("redeem_rate", data.redeemRate === void 0 ? void 0 : Math.round(data.redeemRate));
	add("welcome_bonus", data.welcomeBonus === void 0 ? void 0 : Math.round(data.welcomeBonus));
	add("invite_bonus", data.inviteBonus === void 0 ? void 0 : Math.max(0, Math.round(data.inviteBonus)));
	add("invitee_bonus", data.inviteeBonus === void 0 ? void 0 : Math.max(0, Math.round(data.inviteeBonus)));
	add("min_order_delivery", data.minOrderDelivery);
	add("delivery_fee", data.deliveryFee);
	add("delivery_fee_on", data.deliveryFeeOn === void 0 ? void 0 : Boolean(data.deliveryFeeOn));
	if (data.deliveryZoneMode !== void 0) add("delivery_zone_mode", parseDeliveryZoneMode(data.deliveryZoneMode));
	if (data.deliveryRadiusMiles !== void 0) add("delivery_radius_miles", clampDeliveryRadius(data.deliveryRadiusMiles));
	if (data.blockNorthfield !== void 0) add("block_northfield", Boolean(data.blockNorthfield));
	add("tax_rate", data.taxRate === void 0 ? void 0 : Math.max(0, Math.min(25, Number(data.taxRate))));
	add("prep_minutes", data.prepMinutes === void 0 ? void 0 : Math.max(5, Math.round(data.prepMinutes)));
	add("delivery_minutes", data.deliveryMinutes === void 0 ? void 0 : Math.max(5, Math.round(data.deliveryMinutes)));
	add("tagline", data.tagline);
	add("show_mark", data.showMark);
	add("xl_enabled", data.xlEnabled);
	add("xl_inches", data.xlInches === void 0 ? void 0 : String(data.xlInches).slice(0, 12));
	add("xl_price_add", data.xlPriceAdd === void 0 ? void 0 : Math.max(0, Math.min(40, Number(data.xlPriceAdd))));
	add("topping_price_sm", data.toppingPriceSm === void 0 ? void 0 : Math.max(0, Math.min(20, Number(data.toppingPriceSm))));
	add("topping_price_md", data.toppingPriceMd === void 0 ? void 0 : Math.max(0, Math.min(20, Number(data.toppingPriceMd))));
	add("topping_price_lg", data.toppingPriceLg === void 0 ? void 0 : Math.max(0, Math.min(20, Number(data.toppingPriceLg))));
	add("topping_price_xl", data.toppingPriceXl === void 0 ? void 0 : Math.max(0, Math.min(20, Number(data.toppingPriceXl))));
	if (data.toppingPricesById !== void 0) {
		params.push(JSON.stringify(seedToppingPricesById(data.toppingPricesById)));
		sets.push(`topping_prices_by_id = $${params.length}::jsonb`);
	}
	if (data.backdropData !== void 0) {
		const raw = String(data.backdropData ?? "").trim();
		if (!raw) add("backdrop_data", "");
		else {
			const clean = sanitizeBackdropData(raw);
			if (!clean) throw new Error("Use a PNG, JPEG, WebP, or GIF under 300 KB.");
			add("backdrop_data", clean);
		}
	}
	if (data.logoData !== void 0) {
		const raw = String(data.logoData ?? "").trim();
		if (!raw) add("logo_data", "");
		else {
			const clean = sanitizeBackdropData(raw);
			if (!clean) throw new Error("Use a PNG, JPEG, WebP, or GIF under 300 KB.");
			add("logo_data", clean);
		}
	}
	if (data.notifyAudio !== void 0) {
		const raw = String(data.notifyAudio ?? "").trim();
		if (!raw) add("notify_audio", "");
		else {
			const clean = sanitizeNotifyAudio(raw);
			if (!clean) throw new Error("Use a WAV, MP3, or OGG under 300 KB.");
			add("notify_audio", clean);
		}
	}
	if (data.seasonEffect !== void 0) add("season_effect", sanitizeSeasonEffect(data.seasonEffect));
	if (data.cardTextSize !== void 0) add("card_text_size", sanitizeCardTextSize(data.cardTextSize));
	if (data.cardTextColor !== void 0) add("card_text_color", sanitizeCardTextColor(data.cardTextColor));
	if (data.cardDescColor !== void 0) add("card_desc_color", sanitizeCardTextColor(data.cardDescColor));
	if (data.cardPriceColor !== void 0) add("card_price_color", sanitizeCardTextColor(data.cardPriceColor));
	if (data.cardSize !== void 0) add("card_size", sanitizeCardSize(data.cardSize));
	if (data.cardBg !== void 0) add("card_bg", sanitizeCardBg(data.cardBg));
	if (data.printers) {
		params.push(JSON.stringify(parsePrinters(data.printers)));
		sets.push(`printers = $${params.length}::jsonb`);
	}
	if (data.receiptOptions) {
		params.push(JSON.stringify(parseReceiptOptions(data.receiptOptions)));
		sets.push(`receipt_options = $${params.length}::jsonb`);
	}
	if (data.weeklyHours) {
		const hours = parseWeeklyHours(data.weeklyHours);
		params.push(JSON.stringify(hours));
		sets.push(`weekly_hours = $${params.length}::jsonb`);
		const restaurant = restaurantFrom(await loadSettingsRow(sql));
		restaurant.hours = hoursSummary(hours);
		params.push(JSON.stringify(restaurant));
		sets.push(`restaurant = $${params.length}::jsonb`);
	}
	if (!sets.length) return { ok: true };
	await sql.query(`update shop_settings set ${sets.join(", ")} where id = 1`, params);
	bustStorefrontCache();
	if (
		data.deliveryZoneMode !== void 0 ||
		data.deliveryRadiusMiles !== void 0 ||
		data.blockNorthfield !== void 0
	) {
		clearSuggestCache();
	}
	return { ok: true };
});

export const savePaymentProcessors = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: {
		accounts?: unknown;
		secrets?: Record<string, { secretKey?: string; webhookSecret?: string }>;
		guestCardRequired?: boolean;
		paymentPlaceholder?: string;
	}) => data)
	.handler(async ({ context, data }) => {
		const sql = await getSql();
		await ensureSettingsSchema(sql);
		await ensureProfile(sql, context.userId);
		await requireAdmin(sql, context.userId);
		const {
			parsePaymentSecrets,
			mergePaymentSecrets,
			persistableSecrets,
			processorHasSecret,
			allSecretStatuses,
		} = await import("@/lib/payment-secrets.server");
		const row = await loadSettingsRow(sql);
		const storedSecrets = parsePaymentSecrets(row.payment_secrets);
		const incomingSecrets = parsePaymentSecrets(data.secrets ?? {});
		const nextSecrets = persistableSecrets(mergePaymentSecrets(storedSecrets, incomingSecrets));
		let accounts = parsePaymentAccounts(data.accounts ?? row.payment_accounts);
		accounts = accounts.map((acc) => {
			const hasPub = acc.publishableKey.trim().length > 0;
			const hasSecret = processorHasSecret(acc.id, nextSecrets);
			if (acc.live && (!hasPub || !hasSecret)) return { ...acc, live: false };
			return acc;
		});
		const sets: string[] = [];
		const params: unknown[] = [];
		params.push(JSON.stringify(accounts));
		sets.push(`payment_accounts = $${params.length}::jsonb`);
		params.push(JSON.stringify(nextSecrets));
		sets.push(`payment_secrets = $${params.length}::jsonb`);
		if (data.guestCardRequired !== void 0) {
			params.push(Boolean(data.guestCardRequired));
			sets.push(`guest_card_required = $${params.length}`);
		}
		if (data.paymentPlaceholder !== void 0) {
			params.push(String(data.paymentPlaceholder));
			sets.push(`payment_placeholder = $${params.length}`);
		}
		await sql.query(`update shop_settings set ${sets.join(", ")} where id = 1`, params);
		bustStorefrontCache();
		return {
			ok: true,
			accounts,
			secretStatus: allSecretStatuses(nextSecrets),
		};
	});

export const setDiagnosticDeskAuth = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: { on?: boolean }) => data)
	.handler(async ({ context, data }) => {
		const sql = await getSql();
		await ensureSettingsSchema(sql);
		await ensureProfile(sql, context.userId);
		await requireAdmin(sql, context.userId);
		const on = Boolean(data?.on);
		const { applyStaffCredential, diagnosticDeskAuthStatus, writeStaffDeskAudit, ensureStaffAdminLoginColumns } =
			await import("@/lib/staff-credential.server");
		await ensureStaffAdminLoginColumns(sql);
		try {
			await sql.query(
				`update shop_settings set staff_admin_login_enabled = $1, diagnostic_desk_auth = $1, staff_admin_login_touched = true where id = 1`,
				[on],
			);
		} catch {
			await ensureStaffAdminLoginColumns(sql);
			await sql.query(
				`update shop_settings set staff_admin_login_enabled = $1, diagnostic_desk_auth = $1, staff_admin_login_touched = true where id = 1`,
				[on],
			);
		}
		await applyStaffCredential(sql);
		const status = await diagnosticDeskAuthStatus(sql);
		await writeStaffDeskAudit(sql, {
			userId: context.userId,
			kind: on ? "toggle-on" : "toggle-off",
			diagnostic: status.diagnosticDeskAuth,
		});
		return status;
	});

export const noteStaffDeskLogin = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	const { diagnosticDeskEnabled, writeStaffDeskAudit } = await import("@/lib/staff-credential.server");
	if (!isStaffAdminAccount(context.userId)) return { ok: true, diagnostic: false };
	const diagnostic = await diagnosticDeskEnabled(sql);
	if (diagnostic) {
		await writeStaffDeskAudit(sql, { userId: context.userId, kind: "login", diagnostic: true });
	}
	return { ok: true, diagnostic };
});
export const saveWebsite = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const restaurant = restaurantFrom({ restaurant: data.restaurant });
	await sql.query(`update shop_settings set restaurant = $1::jsonb, footer = $2, tagline = $3, show_mark = $4 where id = 1`, [
		JSON.stringify(restaurant),
		data.footer,
		data.tagline,
		data.showMark
	]);
	bustStorefrontCache();
	return { ok: true };
});

async function loadOrCreateVapid(sql: Sql) {
	await ensurePushSchema(sql);
	const row = (await sql`select vapid_public, vapid_private from shop_settings limit 1`)[0] as
		| { vapid_public?: string; vapid_private?: string }
		| undefined;
	if (row?.vapid_public && row?.vapid_private) {
		return { publicKey: String(row.vapid_public), privateKey: String(row.vapid_private) };
	}
	const webpush = await import("web-push");
	const keys = webpush.generateVAPIDKeys();
	try {
		await sql`update shop_settings set vapid_public = ${keys.publicKey}, vapid_private = ${keys.privateKey}`;
	} catch {
		/* columns missing */
	}
	return keys;
}

async function notifyOrderPush(sql: Sql, order: OrderView, status: string) {
	await ensurePushSchema(sql);
	const userId = String(order.userId ?? "");
	if (!userId) return;
	const subs = await sql`select endpoint, p256dh, auth from push_subscriptions where user_id = ${userId}`;
	if (!subs.length) return;
	let keys: { publicKey: string; privateKey: string };
	try {
		keys = await loadOrCreateVapid(sql);
	} catch {
		return;
	}
	const ticket = `#${String(order.ticketNo || 0).padStart(6, "0")}`;
	const body =
		status === "completed"
			? `Ticket ${ticket} is complete. Thanks for ordering from South End Pizza.`
			: status === "out_for_delivery"
				? `Ticket ${ticket} is out for delivery.`
				: status === "accepted"
					? `Ticket ${ticket} is in the kitchen.`
					: `Ticket ${ticket} is ready.`;
	const payload = JSON.stringify({
		title: "South End Pizza",
		body,
		url: "/account",
	});
	try {
		const webpush = await import("web-push");
		webpush.setVapidDetails("mailto:hello@southendpizza.app", keys.publicKey, keys.privateKey);
		await Promise.all(
			subs.map((row) =>
				webpush
					.sendNotification(
						{
							endpoint: String(row.endpoint),
							keys: { p256dh: String(row.p256dh), auth: String(row.auth) },
						},
						payload,
					)
					.catch(async (err: { statusCode?: number }) => {
						if (err?.statusCode === 404 || err?.statusCode === 410) {
							await sql`delete from push_subscriptions where endpoint = ${String(row.endpoint)}`;
						}
					}),
			),
		);
	} catch {
		/* push is best-effort — never block the ticket */
	}
}

export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
	const sql = await getSql();
	try {
		const keys = await loadOrCreateVapid(sql);
		return { publicKey: keys.publicKey };
	} catch {
		return { publicKey: "" };
	}
});

export const savePushSubscription = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } }) => data)
	.handler(async ({ context, data }) => {
		const sql = await getSql();
		await ensurePushSchema(sql);
		const endpoint = String(data?.subscription?.endpoint ?? "").trim();
		const p256dh = String(data?.subscription?.keys?.p256dh ?? "").trim();
		const auth = String(data?.subscription?.keys?.auth ?? "").trim();
		if (!endpoint || !p256dh || !auth) throw new Error("That device could not subscribe to alerts.");
		await sql.query(
			`insert into push_subscriptions (endpoint, user_id, p256dh, auth)
       values ($1, $2, $3, $4)
       on conflict (endpoint) do update set user_id = $2, p256dh = $3, auth = $4`,
			[endpoint, context.userId, p256dh, auth],
		);
		return { ok: true };
	});

export const getAdminShop = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await bootShop(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const row = await loadSettingsRow(sql);
	const cells = await zoneCells(sql);
	const settings = publicSettings(row, zonePolicyFromRow(row, cells).hasZones);
	const { parsePaymentSecrets, allSecretStatuses } = await import("@/lib/payment-secrets.server");
	const secretStatus = allSecretStatuses(parsePaymentSecrets(row.payment_secrets));
	const categories = applyPizzaSizing(await loadCategories(sql), settings);
	const desk = await (await import("@/lib/staff-credential.server")).diagnosticDeskAuthStatus(sql);
	return {
		restaurant: restaurantFrom(row),
		footer: String(row.footer || "Ask about extra toppings, wing sauces, and dressing. Prices may change."),
		categories,
		settings,
		paymentSecretStatus: secretStatus,
		printers: parsePrinters(row.printers),
		receiptOptions: parseReceiptOptions(row.receipt_options),
		cells,
		notifyAudio: sanitizeNotifyAudio(row.notify_audio),
		diagnosticDeskAuth: desk.diagnosticDeskAuth,
		staffAdminLoginEnabled: desk.staffAdminLoginEnabled,
		staffSecretConfigured: desk.staffSecretConfigured,
		prodLikeHost: isVercelProduction(),
	};
});
export const saveDeliveryZone = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	await sql.query(`update delivery_zones set cells = $1::jsonb, name = $2, updated_at = now(), updated_by = $3 where id = 1`, [
		JSON.stringify(data.cells),
		data.name ?? "Delivery area",
		context.userId
	]);
	bustStorefrontCache();
	clearSuggestCache();
	return {
		ok: true,
		count: data.cells.length
	};
});
export const listAllOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	return (await sql`select * from orders order by created_at desc limit 500`).map(toOrder);
});
export const listCompletedOrdersExport = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const pack = await buildTaxExport(sql, { includeOpenPaid: false, includeVoids: false });
	return pack.tickets;
});

const TAX_PAID_STATUSES = ["completed", "accepted", "preparing", "ready", "out_for_delivery"];

function mapTaxRow(row: Record<string, unknown>) {
	const order = toOrder(row);
	return {
		ticketNo: order.ticketNo,
		createdAt: order.createdAt,
		acceptedAt: order.acceptedAt ?? "",
		status: order.status,
		name: String(row.pickup_name || row.display_name || "").trim() || "Guest",
		phone: String(row.customer_phone ?? ""),
		fulfillment: order.fulfillment,
		paymentMethod: order.paymentMethod,
		addressLine: order.addressLine,
		city: order.city,
		zip: order.zip,
		items: order.items.map((it) => lineSummary(it)).join("; "),
		subtotal: order.subtotal,
		discount: order.discount,
		deliveryFee: order.deliveryFee,
		tax: order.tax,
		taxRatePct: 0,
		tip: order.tip,
		total: order.total,
		notes: order.notes,
		voidReason: order.voidReason ?? "",
	};
}

async function buildTaxExport(
	sql: Sql,
	opts: { from?: string; to?: string; includeOpenPaid?: boolean; includeVoids?: boolean },
) {
	const from = String(opts.from ?? "").trim();
	const to = String(opts.to ?? "").trim();
	const includeOpenPaid = opts.includeOpenPaid !== false;
	const includeVoids = opts.includeVoids === true;
	const statuses = includeOpenPaid ? [...TAX_PAID_STATUSES] : ["completed"];
	const paidList = statuses.map((s) => `'${s}'`).join(", ");
	const params: unknown[] = [];
	const where: string[] = [];
	if (includeVoids) {
		where.push(`(o.status in (${paidList}) or o.status = 'canceled')`);
	} else {
		where.push(`o.status in (${paidList})`);
	}
	where.push(`o.status <> 'awaiting_payment'`);
	if (/^\d{4}-\d{2}-\d{2}$/.test(from)) {
		params.push(from);
		where.push(`(o.created_at at time zone 'America/New_York')::date >= $${params.length}::date`);
	}
	if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
		params.push(to);
		where.push(`(o.created_at at time zone 'America/New_York')::date <= $${params.length}::date`);
	}
	const rows = await sql.query(
		`select o.*, p.display_name, p.phone as customer_phone
     from orders o
     left join profiles p on p.user_id = o.user_id
     where ${where.join(" and ")}
     order by o.created_at asc`,
		params,
	);
	const mapped = rows.map((row) => mapTaxRow(row));
	const tickets = mapped.filter((r) => r.status !== "canceled");
	const voids = mapped.filter((r) => r.status === "canceled");
	const settings = await loadSettingsRow(sql);
	const taxRate = settings.tax_rate === void 0 || settings.tax_rate === null || settings.tax_rate === "" ? 6.625 : Math.max(0, num(settings.tax_rate));
	const taxId = parseReceiptOptions(settings.receipt_options).taxId;
	return { tickets, voids, taxRate, taxId, from, to, includeVoids };
}

export const listTaxExport = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: { from?: string; to?: string; includeOpenPaid?: boolean; includeVoids?: boolean }) => data)
	.handler(async ({ context, data }) => {
		const sql = await getSql();
		await ensureSettingsSchema(sql);
		await ensureProfile(sql, context.userId);
		await requireAdmin(sql, context.userId);
		return buildTaxExport(sql, data ?? {});
	});
export const updateOrderStatus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	if (!( new Set([
		"placed",
		"accepted",
		"awaiting_payment",
		"preparing",
		"out_for_delivery",
		"ready",
		"completed",
		"canceled"
	])).has(data.status)) throw new Error("Invalid status.");
	const id = String(data?.id ?? "").trim();
	if (!id) throw new Error("Ticket is missing.");
	const next = String(data.status);
	const existing = await sql.query(`select * from orders where id = $1`, [id]);
	if (!existing[0]) throw new Error("Order not found.");
	const current = String(existing[0].status ?? "");
	if (next === "completed" && current === "completed") {
		return {
			ok: true,
			order: toOrder(existing[0])
		};
	}
	if (next === "preparing" || next === "accepted") await sql.query(`update orders set status = $1, accepted_at = coalesce(accepted_at, now()) where id = $2`, [next, id]);
	else await sql`update orders set status = ${next} where id = ${id}`;
	await writeOrderStatusAudit(sql, {
		orderId: id,
		fromStatus: current,
		toStatus: next,
		actorId: context.userId,
	});
	const rows = await sql`select * from orders where id = ${id}`;
	const order = rows[0] ? toOrder(rows[0]) : null;
	if (order && (next === "ready" || next === "out_for_delivery" || next === "accepted" || next === "completed")) {
		void notifyOrderPush(sql, order, next).catch(() => undefined);
	}
	return {
		ok: true,
		order,
	};
});
export const acceptOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const id = String(data?.id ?? "").trim();
	if (!id) throw new Error("Ticket is missing.");
	const prior = await sql.query(`select status from orders where id = $1`, [id]);
	const taken = await sql.query(
		`update orders
     set status = 'accepted', accepted_at = coalesce(accepted_at, now())
     where id = $1 and status in ('placed', 'awaiting_payment')
     returning *`,
		[id],
	);
	if (taken[0]) {
		await writeOrderStatusAudit(sql, {
			orderId: id,
			fromStatus: String(prior[0]?.status ?? "placed"),
			toStatus: "accepted",
			actorId: context.userId,
		});
		const order = toOrder(taken[0]);
		void notifyOrderPush(sql, order, "accepted").catch(() => undefined);
		return order;
	}
	const rows = await sql`select * from orders where id = ${id}`;
	if (!rows[0]) throw new Error("Order not found.");
	const current = String(rows[0].status);
	if (current === "accepted" || current === "preparing" || current === "ready" || current === "out_for_delivery") {
		return toOrder(rows[0]);
	}
	throw new Error("That ticket cannot be accepted.");
});
export const getAdminInsights = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await bootShop(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const paid = `status not in ('canceled', 'awaiting_payment')`;
	const nyStart = `((current_timestamp at time zone 'America/New_York')::date at time zone 'America/New_York')`;
	const totals = (
		await sql.query<{
			collected: string;
			outstanding: string;
			food: string;
			tax: string;
			discounts: string;
			fees: string;
			tips: string;
			pickup: string;
			delivery: string;
			today: string;
			week: string;
			month: string;
			tickets: number;
			canceled: number;
		}>(
			`select
        coalesce(sum(total) filter (where ${paid}), 0)::text as collected,
        coalesce(sum(total) filter (where status = 'awaiting_payment'), 0)::text as outstanding,
        coalesce(sum(subtotal) filter (where ${paid}), 0)::text as food,
        coalesce(sum(tax) filter (where ${paid}), 0)::text as tax,
        coalesce(sum(discount) filter (where ${paid}), 0)::text as discounts,
        coalesce(sum(delivery_fee) filter (where ${paid}), 0)::text as fees,
        coalesce(sum(tip) filter (where ${paid}), 0)::text as tips,
        coalesce(sum(total) filter (where ${paid} and fulfillment = 'pickup'), 0)::text as pickup,
        coalesce(sum(total) filter (where ${paid} and fulfillment = 'delivery'), 0)::text as delivery,
        coalesce(sum(total) filter (where ${paid} and created_at >= ${nyStart}), 0)::text as today,
        coalesce(sum(total) filter (where ${paid} and created_at >= ${nyStart} - interval '7 days'), 0)::text as week,
        coalesce(sum(total) filter (where ${paid} and created_at >= ${nyStart} - interval '30 days'), 0)::text as month,
        count(*) filter (where ${paid})::int as tickets,
        count(*) filter (where status = 'canceled')::int as canceled
       from orders`,
		)
	)[0];
	const payRows = await sql.query<{ method: string; total: string; count: number }>(
		`select payment_method as method, coalesce(sum(total), 0)::text as total, count(*)::int as count
     from orders where ${paid} group by payment_method`,
	);
	const spendRows = await sql.query<{ user_id: string; orders: number; spend: string }>(
		`select user_id, count(*)::int as orders, coalesce(sum(total), 0)::text as spend
     from orders where ${paid} group by user_id`,
	);
	const itemRows = await sql.query<{ name: string; qty: string; sales: string }>(
		`select coalesce(item->>'name', 'Item') as name,
            coalesce(sum((item->>'qty')::numeric), 0)::text as qty,
            coalesce(sum((item->>'unitPrice')::numeric * (item->>'qty')::numeric), 0)::text as sales
     from orders, jsonb_array_elements(items) as item
     where ${paid}
     group by 1
     order by coalesce(sum((item->>'unitPrice')::numeric * (item->>'qty')::numeric), 0) desc
     limit 8`,
	).catch(async () => [] as { name: string; qty: string; sales: string }[]);
	const seriesRows = await sql.query<{ day: string; total: string; tickets: number }>(
		`select to_char(created_at at time zone 'America/New_York', 'YYYY-MM-DD') as day,
            coalesce(sum(total), 0)::text as total,
            count(*)::int as tickets
     from orders
     where ${paid} and created_at >= ${nyStart} - interval '13 days'
     group by 1`,
	).catch(async () => [] as { day: string; total: string; tickets: number }[]);
	const profiles = await sql`select user_id, display_name, points, totp_enabled, created_at from profiles`;
	const spendByUser = new Map<string, { orders: number; spend: number }>();
	for (const r of spendRows) {
		spendByUser.set(String(r.user_id), { orders: Math.round(Number(r.orders) || 0), spend: num(r.spend) });
	}
	const seriesMap = new Map<string, { total: number; tickets: number }>();
	const now = Date.now();
	for (let i = 13; i >= 0; i--) {
		seriesMap.set(nyYmd(new Date(now - i * 86400000)), { total: 0, tickets: 0 });
	}
	for (const r of seriesRows) {
		const row = seriesMap.get(String(r.day));
		if (!row) continue;
		row.total = num(r.total);
		row.tickets = Math.round(Number(r.tickets) || 0);
	}
	const weekAgo = Date.now() - 6048e5;
	const tickets = Math.round(Number(totals?.tickets) || 0);
	const collected = num(totals?.collected);
	const insights: AdminInsights = {
		customers: {
			total: profiles.length,
			new7d: profiles.filter((p) => new Date(String(p.created_at ?? "")).getTime() >= weekAgo).length,
			twoFactor: profiles.filter((p) => bool(p.totp_enabled)).length,
			avgPoints: profiles.length === 0 ? 0 : Math.round(profiles.reduce((acc, p) => acc + num(p.points), 0) / profiles.length),
			repeat: [...spendByUser.values()].filter((s) => s.orders > 1).length,
			top: profiles.map((p) => {
				const spent = spendByUser.get(String(p.user_id)) ?? { orders: 0, spend: 0 };
				return {
					userId: String(p.user_id ?? ""),
					name: String(p.display_name || "Guest"),
					orders: spent.orders,
					spend: spent.spend,
					points: Math.round(num(p.points)),
				};
			}).sort((a, b) => b.spend - a.spend).slice(0, 12),
		},
		sales: {
			today: num(totals?.today),
			week: num(totals?.week),
			month: num(totals?.month),
			allTime: collected,
			tickets,
			avgTicket: tickets ? collected / tickets : 0,
			canceled: Math.round(Number(totals?.canceled) || 0),
			series: [...seriesMap.entries()].map(([day, v]) => ({ day, ...v })),
			topItems: itemRows.map((r) => ({ name: String(r.name), qty: num(r.qty), sales: num(r.sales) })),
		},
		financials: {
			food: num(totals?.food),
			tax: num(totals?.tax),
			discounts: num(totals?.discounts),
			deliveryFees: num(totals?.fees),
			tips: num(totals?.tips),
			collected,
			pickup: num(totals?.pickup),
			delivery: num(totals?.delivery),
			awaitingPayment: num(totals?.outstanding),
			byPay: payRows.map((r) => ({ method: String(r.method), total: num(r.total), count: Math.round(Number(r.count) || 0) })),
		},
	};
	return insights;
});
function iso(value: unknown) {
	if (!value) return "";
	return value instanceof Date ? value.toISOString() : String(value);
}
function newId(prefix: string) {
	return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
function orderBriefFrom(row: Record<string, unknown>): ChatOrderBrief | null {
	const id = String(row.linked_order_id ?? "");
	if (!id) return null;
	return {
		id,
		ticketNo: Math.round(num(row.order_ticket_no)),
		status: String(row.order_status ?? ""),
		fulfillment: row.order_fulfillment === "delivery" ? "delivery" : "pickup",
		total: num(row.order_total),
		notes: String(row.order_notes ?? ""),
		createdAt: iso(row.order_created),
		items: parseOrderItems(row.order_items).map((it) => ({
			name: it.name,
			size: it.size,
			qty: it.qty,
			detail: it.detail,
			comment: it.comment
		}))
	};
}
function toThread(row: Record<string, unknown>, customerName: string): ChatThreadView {
	const order = orderBriefFrom(row);
	return {
		id: String(row.id),
		userId: String(row.user_id),
		customerName,
		customerPhone: String(row.customer_phone ?? row.phone ?? ""),
		status: String(row.status ?? "open"),
		lastMessage: String(row.last_message ?? ""),
		lastAt: iso(row.last_at),
		unreadAdmin: Math.round(num(row.unread_admin)),
		unreadCustomer: Math.round(num(row.unread_customer)),
		createdAt: iso(row.created_at),
		orderId: order?.id ?? (row.order_id ? String(row.order_id) : null),
		order,
		customerBanned: bool(row.banned ?? row.customer_banned),
		staffNote: String(row.staff_note ?? ""),
		muted: bool(row.muted),
		flagged: bool(row.flagged)
	};
}
function toMessage(row: Record<string, unknown>): ChatMessageView {
	return {
		id: String(row.id),
		threadId: String(row.thread_id),
		senderId: String(row.sender_id),
		senderRole: row.sender_role === "admin" ? "admin" : "customer",
		body: String(row.body ?? ""),
		createdAt: iso(row.created_at)
	};
}
export const listCustomers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	await ensureAdminModeColumns(sql);
	let profiles: Record<string, unknown>[] = [];
	try {
		profiles = await sql`
      select p.user_id, p.role, p.admin_mode, p.admin_mode_allowed, p.phone, p.display_name, p.points, p.totp_enabled, p.created_at, p.banned,
             u.email, u.name as user_name
      from profiles p
      left join "user" u on u.id = p.user_id
      order by p.created_at desc`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		profiles = await sql`
      select p.user_id, p.role, p.phone, p.display_name, p.points, p.totp_enabled, p.created_at, p.banned,
             u.email, u.name as user_name
      from profiles p
      left join "user" u on u.id = p.user_id
      order by p.created_at desc`;
	}
	const orders = await sql`
      select * from orders order by created_at desc limit 800`;
	const byUser = new Map<string, OrderView[]>();
	for (const row of orders) {
		const o = toOrder(row);
		const list = byUser.get(o.userId) ?? [];
		if (list.length < 40) list.push(o);
		byUser.set(o.userId, list);
	}
	return profiles.map((p): CustomerRecord => {
		const hist = byUser.get(String(p.user_id)) ?? [];
		const live = hist.filter((o) => o.status !== "canceled");
		return {
			userId: String(p.user_id ?? ""),
			displayName: String(p.display_name || p.user_name || "Guest").trim() || "Guest",
			phone: String(p.phone ?? ""),
			email: String(p.email ?? ""),
			role: p.role === "admin" || bool(p.admin_mode) ? "admin" : "customer",
			points: Math.round(num(p.points)),
			totpEnabled: bool(p.totp_enabled),
			createdAt: iso(p.created_at),
			orderCount: live.length,
			spend: live.reduce((acc, o) => acc + o.total, 0),
			lastOrderAt: hist[0]?.createdAt ?? null,
			banned: bool(p.banned),
			adminModeAllowed: bool(p.admin_mode_allowed) || p.role === "admin",
			orders: hist
		};
	});
});
export const setAccountRole = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireDeskGrant(sql, context.userId);
	const userId = String(data.userId || "").trim();
	if (!userId) throw new Error("Choose an account.");
	if (data.role !== "admin" && data.role !== "customer") throw new Error("Invalid role.");
	await ensureAdminModeColumns(sql);
	let target: Record<string, unknown>[] = [];
	try {
		target = await sql`select role, admin_mode_allowed from profiles where user_id = ${userId}`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		await ensureAdminModeColumns(sql);
		try {
			target = await sql`select role, admin_mode_allowed from profiles where user_id = ${userId}`;
		} catch {
			target = await sql`select role from profiles where user_id = ${userId}`;
		}
	}
	if (!target[0]) throw new Error("Account not found.");
	if (data.role === "customer" && (target[0].role === "admin" || bool(target[0].admin_mode_allowed))) {
		let remaining = 1;
		try {
			remaining = num((await sql`select count(*)::int as n from profiles where role = 'admin' or admin_mode_allowed is true`)[0]?.n);
		} catch (err) {
			if (!isMissingAdminModeColumn(err)) throw err;
			remaining = num((await sql`select count(*)::int as n from profiles where role = 'admin'`)[0]?.n);
		}
		if (remaining <= 1) throw new Error("Keep at least one admin account.");
	}
	if (data.role === "admin") {
		try {
			await sql`update profiles set admin_mode_allowed = true where user_id = ${userId}`;
		} catch (err) {
			if (!isMissingAdminModeColumn(err)) throw err;
			await ensureAdminModeColumns(sql);
			await sql`update profiles set admin_mode_allowed = true where user_id = ${userId}`;
		}
	} else {
		try {
			await sql`update profiles set role = 'customer', admin_mode = false, admin_mode_allowed = false where user_id = ${userId}`;
		} catch (err) {
			if (!isMissingAdminModeColumn(err)) throw err;
			await ensureAdminModeColumns(sql);
			await sql`update profiles set role = 'customer', admin_mode = false, admin_mode_allowed = false where user_id = ${userId}`;
		}
	}
	return {
		ok: true,
		role: data.role,
		adminModeAllowed: data.role === "admin",
	};
});

const DESK_GRANT_MAX = DESK_ACCOUNT_SOFT_MAX;

function maskDeskEmail(email: string) {
	const trimmed = email.trim().toLowerCase();
	const at = trimmed.indexOf("@");
	const local = at > 0 ? trimmed.slice(0, at) : trimmed;
	const domain = at > 0 ? trimmed.slice(at + 1) : "";
	const masked = local
		? `${local.slice(0, 1)}•••${domain ? `@${domain}` : ""}`
		: "—";
	return { emailLocal: local || "—", emailMasked: masked };
}

export const listDeskAccounts = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await requireAdmin(sql, context.userId);
	let rows: Record<string, unknown>[] = [];
	try {
		rows = await sql`
      select p.user_id, p.display_name, p.admin_mode, p.admin_mode_allowed, u.email
      from profiles p
      left join "user" u on u.id = p.user_id
      where coalesce(u.email, '') <> ''
        and u.email not like '%@guest.southend.pizza'
        and p.user_id not like 'demo-%'
      order by p.admin_mode_allowed desc, p.created_at desc
      limit 80`;
	} catch (err) {
		if (!isMissingAdminModeColumn(err)) throw err;
		rows = await sql`
      select p.user_id, p.display_name, u.email
      from profiles p
      left join "user" u on u.id = p.user_id
      where coalesce(u.email, '') <> ''
        and p.user_id not like 'demo-%'
      order by p.created_at desc
      limit 80`;
	}
	const accounts: DeskAccountRow[] = rows.map((r) => {
		const { emailLocal, emailMasked } = maskDeskEmail(String(r.email ?? ""));
		return {
			userId: String(r.user_id ?? ""),
			emailLocal,
			emailMasked,
			displayName: String(r.display_name ?? "").trim() || emailLocal,
			adminModeAllowed: bool(r.admin_mode_allowed) || r.role === "admin",
			adminMode: bool(r.admin_mode),
		};
	});
	const canGrant = await actorCanGrantDesk(sql, context.userId);
	const granted = accounts.filter((a) => a.adminModeAllowed).length;
	return { accounts, canGrant, granted, max: DESK_GRANT_MAX };
});

export const setDeskAllowed = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: { userId?: string; allowed?: boolean }) => data)
	.handler(async ({ context, data }) => {
		const sql = await getSql();
		await ensureSettingsSchema(sql);
		await requireDeskGrant(sql, context.userId);
		const userId = String(data.userId || "").trim();
		if (!userId) throw new Error("Choose an account.");
		if (userId === context.userId) throw new Error("You cannot change your own desk grant here.");
		await ensureAdminModeColumns(sql);
		const allowed = Boolean(data.allowed);
		if (allowed) {
			const n = num((await sql`select count(*)::int as n from profiles where admin_mode_allowed is true`)[0]?.n);
			if (n >= DESK_GRANT_MAX) throw new Error(`14 accounts, 12 extra bots. Existing grants stay.`);
			await sql`update profiles set admin_mode_allowed = true where user_id = ${userId}`;
		} else {
			await sql`update profiles set admin_mode_allowed = false, admin_mode = false, role = 'customer' where user_id = ${userId}`;
		}
		try {
			await sql.query(
				`insert into desk_grant_audit (id, actor_id, target_id, action, created_at) values ($1,$2,$3,$4,now())`,
				[`dga-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, context.userId, userId, allowed ? "grant" : "revoke"],
			);
		} catch {
			/* audit is best-effort */
		}
		return { ok: true, allowed };
	});
export const setAccountBanned = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const userId = String(data.userId || "").trim();
	if (!userId) throw new Error("Choose an account.");
	if (userId === context.userId) throw new Error("You cannot ban your own account.");
	const target = await sql`select role from profiles where user_id = ${userId}`;
	if (!target[0]) throw new Error("Account not found.");
	const banned = Boolean(data.banned);
	if (banned && target[0].role === "admin") {
		if (num((await sql`select count(*)::int as n from profiles where role = 'admin' and banned is not true`)[0]?.n) <= 1) {
			throw new Error("Keep at least one admin account.");
		}
	}
	await sql`update profiles set banned = ${banned} where user_id = ${userId}`;
	return {
		ok: true,
		banned
	};
});
export const deleteCustomerAccount = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const userId = String(data.userId || "").trim();
	if (!userId) throw new Error("Choose an account.");
	if (userId === context.userId) throw new Error("You cannot remove your own account.");
	const target = await sql`select p.role, p.admin_mode_allowed, u.email
    from profiles p
    left join "user" u on u.id = p.user_id
    where p.user_id = ${userId}`;
	if (!target[0]) throw new Error("Account not found.");
	if (isStaffAdminAccount(userId, String(target[0].email ?? ""))) {
		throw new Error("The shop desk login cannot be removed.");
	}
	if (target[0].role === "admin" || bool(target[0].admin_mode_allowed)) {
		const remaining = await remainingAdminsBesides(sql, userId);
		if (remaining < 1) throw new Error("Keep at least one admin account.");
	}
	await purgeAccountRecords(sql, userId, String(target[0].email ?? "").trim());
	return { ok: true, userId };
});

async function remainingAdminsBesides(sql: Sql, userId: string) {
	try {
		return num((await sql`select count(*)::int as n from profiles where (role = 'admin' or admin_mode_allowed is true) and user_id <> ${userId}`)[0]?.n);
	} catch (err) {
		if (!String(err).includes("admin_mode_allowed")) throw err;
		return num((await sql`select count(*)::int as n from profiles where role = 'admin' and user_id <> ${userId}`)[0]?.n);
	}
}

async function purgeAccountRecords(sql: Sql, userId: string, email: string) {
	const threads = await sql`select id from chat_threads where user_id = ${userId}`;
	for (const row of threads) {
		await sql`delete from chat_messages where thread_id = ${String(row.id)}`;
	}
	await sql`delete from chat_threads where user_id = ${userId}`;
	await sql`delete from two_factor_unlocks where user_id = ${userId}`;
	try {
		await sql`delete from rewards_ledger where user_id = ${userId}`;
	} catch {
		/* older shops */
	}
	try {
		await sql`delete from push_subscriptions where user_id = ${userId}`;
	} catch {
		/* older shops */
	}
	try {
		await sql`delete from password_reset_codes where user_id = ${userId}`;
	} catch {
		/* older shops */
	}
	try {
		await sql`delete from email_signup_codes where user_id = ${userId}`;
	} catch {
		/* older shops */
	}
	try {
		await sql`delete from phone_signup_codes where user_id = ${userId}`;
	} catch {
		/* older shops */
	}
	await sql.query(`delete from "session" where "userId" = $1`, [userId]);
	await sql.query(`delete from "account" where "userId" = $1`, [userId]);
	if (email) {
		try {
			await sql.query(`delete from "verification" where lower("identifier") = lower($1)`, [email]);
		} catch {
			/* verification is optional */
		}
	}
	await sql.query(`delete from "user" where id = $1`, [userId]);
	await sql`delete from profiles where user_id = ${userId}`;
}

const deleteAccountFails = new Map<string, { n: number; start: number }>();

function deleteAccountBlocked(userId: string) {
	const cur = deleteAccountFails.get(userId);
	if (!cur) return false;
	if (Date.now() - cur.start > 10 * 60_000) {
		deleteAccountFails.delete(userId);
		return false;
	}
	return cur.n >= 5;
}

function noteDeleteAccountFail(userId: string) {
	const now = Date.now();
	const cur = deleteAccountFails.get(userId);
	if (!cur || now - cur.start > 10 * 60_000) {
		deleteAccountFails.set(userId, { n: 1, start: now });
		return 1;
	}
	cur.n += 1;
	return cur.n;
}

export const deleteMyAccount = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: { password: string }) => data)
	.handler(async ({ context, data }) => {
		const sql = await getSql();
		await ensureSettingsSchema(sql);
		await ensureProfile(sql, context.userId);
		const userId = context.userId;
		const password = String(data.password ?? "");
		if (!password) throw new Error("Enter your password to delete this account.");
		if (deleteAccountBlocked(userId)) throw new Error("Too many tries. Wait a few minutes.");
		const cred = (
			await sql.query(`select password from "account" where "userId" = $1 and "providerId" = 'credential' limit 1`, [userId])
		)[0];
		if (!cred?.password) {
			throw new Error("This login uses Google or X. Set a password under Security first, then delete the account.");
		}
		let ok = false;
		try {
			ok = await verifyPassword(String(cred.password), password);
		} catch {
			ok = false;
		}
		if (!ok) {
			noteDeleteAccountFail(userId);
			if (deleteAccountBlocked(userId)) throw new Error("Too many tries. Wait a few minutes.");
			throw new Error("That password is wrong.");
		}
		deleteAccountFails.delete(userId);
		const target = await sql`select p.role, p.admin_mode_allowed, p.display_name, u.email
      from profiles p
      left join "user" u on u.id = p.user_id
      where p.user_id = ${userId}`;
		if (!target[0]) throw new Error("Account not found.");
		const email = String(target[0].email ?? "").trim();
		if (isStaffAdminAccount(userId, email)) {
			throw new Error("The shop desk login cannot be removed.");
		}
		if (target[0].role === "admin" || bool(target[0].admin_mode_allowed)) {
			const remaining = await remainingAdminsBesides(sql, userId);
			if (remaining < 1) throw new Error("Keep at least one admin account.");
		}
		const displayName = String(target[0].display_name ?? "").trim();
		await sql.query(
			`update orders set pickup_name = 'Deleted account' where user_id = $1 and (pickup_name is null or pickup_name = '' or pickup_name = $2)`,
			[userId, displayName],
		);
		await purgeAccountRecords(sql, userId, email);
		return { ok: true };
	});
export const adjustCustomerPoints = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const userId = String(data.userId || "").trim();
	if (!userId) throw new Error("Choose an account.");
	const delta = Math.round(num(data.delta));
	if (!delta) throw new Error("Enter how many points to add or remove.");
	if (Math.abs(delta) > 100000) throw new Error("That point change is too large.");
	if (!(await sql`select user_id from profiles where user_id = ${userId}`)[0]) throw new Error("Account not found.");
	await sql.query(`update profiles set points = greatest(0, points + $1) where user_id = $2`, [delta, userId]);
	await addLedger(
		sql,
		userId,
		"adjust",
		delta,
		delta > 0 ? `Shop added ${delta} points` : `Shop removed ${Math.abs(delta)} points`,
	);
	const row = await sql`select points from profiles where user_id = ${userId}`;
	return {
		ok: true,
		points: Math.round(num(row[0]?.points))
	};
});
export const voidOrder = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: { id?: string; reason?: string }) => data)
	.handler(async ({ context, data }) => {
		const sql = await getSql();
		await ensureSettingsSchema(sql);
		await ensureProfile(sql, context.userId);
		await requireAdmin(sql, context.userId);
		const id = String(data.id || "").trim();
		if (!id) throw new Error("Choose an order.");
		const existing = await sql.query(`select * from orders where id = $1`, [id]);
		if (!existing[0]) throw new Error("Order not found.");
		const current = String(existing[0].status ?? "");
		if (current === "canceled") {
			return { ok: true, order: toOrder(existing[0]) };
		}
		const reason = String(data.reason ?? "").trim().slice(0, 240);
		await sql.query(
			`update orders set status = 'canceled', voided_at = now(), void_reason = $2 where id = $1`,
			[id, reason],
		);
		await writeOrderStatusAudit(sql, {
			orderId: id,
			fromStatus: current,
			toStatus: "canceled",
			actorId: context.userId,
		});
		const next = await sql.query(`select * from orders where id = $1`, [id]);
		return { ok: true, order: toOrder(next[0]) };
	});

export const deleteOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const id = String(data.id || "").trim();
	if (!id) throw new Error("Choose an order.");
	if (!(await sql`select id from orders where id = ${id}`)[0]) throw new Error("Order not found.");
	await sql.query(`update chat_threads set order_id = null where order_id = $1`, [id]).catch(() => undefined);
	await sql.query(`update rewards_ledger set order_id = null where order_id = $1`, [id]).catch(() => undefined);
	await sql.query(`delete from order_status_audit where order_id = $1`, [id]).catch(() => undefined);
	await sql`delete from orders where id = ${id}`;
	return {
		ok: true,
		id
	};
});
const RECOVER_FAIL = "We could not recover that account. Check the email or phone, and the name or phone on file.";
const OTP_TTL_MS = 2 * 60_000;
const OTP_TTL_SEC = Math.round(OTP_TTL_MS / 1000);
const SMS_OTP_TTL_MS = 10 * 60_000;
const SMS_RESEND_MS = 60_000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_HOUR_CAP = 8;
const TWILIO_VERIFY_SALT = "twilio-verify";

function hashOtp(salt: string, code: string) {
	return createHash("sha256").update(`southend-otp:${salt}:${code}`).digest();
}
function maskEmail(email: string) {
	const [user, domain] = email.split("@");
	if (!domain) return "***";
	const head = (user || "x").slice(0, 1);
	return `${head}***@${domain}`;
}
async function loadCredentialAccount(sql: Sql, userId: string) {
	const accounts = await sql.query(`select id, "providerId" as provider from account where "userId" = $1`, [userId]);
	return accounts.find((row) => String(row.provider) === "credential") ?? null;
}
export const recoverPassword = createServerFn({ method: "POST" }).validator((data: any) => data).handler(async ({ data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	const identifier = String(data.identifier ?? "").trim();
	const proof = String(data.proof ?? "").trim();
	const password = String(data.password ?? "");
	const { consumeAuthAttempt } = await import("@/lib/rate-limit.server");
	await consumeAuthAttempt(sql, identifier || "unknown");
	if (password.length < 8) throw new Error("Use at least 8 characters for the new password.");
	if (password.length > 128) throw new Error("That password is too long.");
	if (!identifier || !proof) throw new Error(RECOVER_FAIL);
	const parsed = identifierToEmail(identifier);
	const email = parsed.email.toLowerCase();
	const users = await sql.query(`select id, email from "user" where lower(email) = $1 limit 1`, [email]);
	const user = users[0];
	if (!user) throw new Error(RECOVER_FAIL);
	const userId = String(user.id);
	const profile = (await sql`select phone, display_name from profiles where user_id = ${userId}`)[0];
	const storedPhone = toTenDigitPhone(String(profile?.phone ?? parsed.phone ?? ""));
	const storedName = String(profile?.display_name ?? "").trim().toLowerCase();
	const proofPhone = toTenDigitPhone(proof);
	const proofName = proof.toLowerCase();
	const phoneOk = Boolean(proofPhone && storedPhone && proofPhone === storedPhone);
	const nameOk = Boolean(proofName.length >= 2 && storedName && proofName === storedName);
	if (!phoneOk && !nameOk) throw new Error(RECOVER_FAIL);
	const accounts = await sql.query(`select id, "providerId" as provider from account where "userId" = $1`, [userId]);
	const credential = accounts.find((row) => String(row.provider) === "credential");
	if (!credential) throw new Error("This account signs in with Google or X. Use that button on the sign-in page.");
	const hash = await hashPassword(password);
	await sql.query(`update account set password = $1, "updatedAt" = now() where id = $2 and "providerId" = 'credential'`, [
		hash,
		String(credential.id)
	]);
	return { ok: true as const };
});
export const sendPasswordResetCode = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const users = await sql.query(`select id, email from "user" where id = $1 limit 1`, [context.userId]);
	const email = String(users[0]?.email ?? "").trim().toLowerCase();
	const { consumeAuthAttempt } = await import("@/lib/rate-limit.server");
	await consumeAuthAttempt(sql, email || context.userId);
	if (!email || !email.includes("@")) throw new Error("This account has no email on file.");
	const credential = await loadCredentialAccount(sql, context.userId);
	if (!credential) throw new Error("This account signs in with Google or X. Use that button on the sign-in page.");
	const recent = await sql.query(
		`select created_at from password_reset_codes where user_id = $1 and created_at > now() - interval '1 hour' order by created_at desc`,
		[context.userId],
	);
	if (recent.length >= OTP_HOUR_CAP) throw new Error("Too many reset emails. Try again in an hour.");
	const last = recent[0]?.created_at ? new Date(String(recent[0].created_at)).getTime() : 0;
	if (last && Date.now() - last < OTP_TTL_MS) throw new Error("A code is already on the way. Wait 2 minutes to send another.");
	await sql.query(`update password_reset_codes set consumed_at = now() where user_id = $1 and consumed_at is null`, [context.userId]);
	const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
	const salt = randomBytes(16).toString("hex");
	const digest = hashOtp(salt, code).toString("hex");
	const id = `otp-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
	const expires = new Date(Date.now() + OTP_TTL_MS);
	await sql.query(
		`insert into password_reset_codes (id, user_id, email, code_hash, salt, expires_at) values ($1,$2,$3,$4,$5,$6)`,
		[id, context.userId, email, digest, salt, expires],
	);
	const { sendEmail } = await import("@/lib/email/resend.server");
	await sendEmail({
		to: email,
		subject: "Your South End Pizza reset code",
		text: `Your South End Pizza password reset code is ${code}. It expires in 2 minutes. If you did not ask for this, you can ignore this message.`,
		html: `<p style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#1a1410">Your South End Pizza password reset code is:</p>
<p style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:28px;letter-spacing:0.28em;font-weight:700;color:#1a1410">${code}</p>
<p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.45;color:#5c534c">It expires in 2 minutes. If you did not ask for this, you can ignore this message — your password stays the same.</p>`,
	});
	return {
		sent: true as const,
		email: maskEmail(email),
		expiresIn: OTP_TTL_SEC,
		previewCode: dbSource === "pglite" ? code : undefined,
	};
});
export const changeMyPassword = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const password = String(data.password ?? "");
	const code = String(data.code ?? "").replace(/\D/g, "");
	if (password.length < 8) throw new Error("Use at least 8 characters for the new password.");
	if (password.length > 128) throw new Error("That password is too long.");
	if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code from your email.");
	const credential = await loadCredentialAccount(sql, context.userId);
	if (!credential) throw new Error("This account signs in with Google or X. Use that button on the sign-in page.");
	const rows = await sql.query(
		`select id, code_hash, salt, expires_at, attempts, consumed_at from password_reset_codes
     where user_id = $1 and consumed_at is null order by created_at desc limit 1`,
		[context.userId],
	);
	const row = rows[0];
	if (!row) throw new Error("Send a new one-time code first.");
	if (new Date(String(row.expires_at)).getTime() < Date.now()) {
		await sql.query(`update password_reset_codes set consumed_at = now() where id = $1`, [String(row.id)]);
		throw new Error("That code expired. Send a new one.");
	}
	const attempts = Math.round(num(row.attempts));
	if (attempts >= OTP_MAX_ATTEMPTS) {
		await sql.query(`update password_reset_codes set consumed_at = now() where id = $1`, [String(row.id)]);
		throw new Error("Too many tries. Send a new code.");
	}
	const expected = Buffer.from(String(row.code_hash), "hex");
	const got = hashOtp(String(row.salt), code);
	if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
		await sql.query(`update password_reset_codes set attempts = attempts + 1 where id = $1`, [String(row.id)]);
		throw new Error("That code does not match. Try again.");
	}
	const hash = await hashPassword(password);
	await sql.query(`update account set password = $1, "updatedAt" = now() where id = $2 and "providerId" = 'credential'`, [
		hash,
		String(credential.id)
	]);
	await sql.query(`update password_reset_codes set consumed_at = now() where user_id = $1 and consumed_at is null`, [context.userId]);
	return { ok: true as const };
});

export const sendSignupEmailCode = createServerFn({ method: "POST" }).validator((data: any) => data).handler(async ({ data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	const email = String(data.email ?? "").trim().toLowerCase();
	if (!email || !email.includes("@")) throw new Error("Enter a valid email address.");
	if (isPhoneAuthEmail(email) || isStaffAdminAccount(undefined, email)) {
		return { alreadyVerified: true as const, skipped: true as const, email: maskEmail(email), expiresIn: 0 };
	}
	const users = await sql.query(`select id, email, "emailVerified" as verified from "user" where lower(email) = $1 limit 1`, [email]);
	const user = users[0];
	if (!user) throw new Error("We could not send a code for that email. Check the address and try again.");
	const userId = String(user.id);
	if (isStaffAdminAccount(userId, email)) {
		return { alreadyVerified: true as const, skipped: true as const, email: maskEmail(email), expiresIn: 0 };
	}
	const verified = user.verified === true || user.verified === "t" || user.verified === "true";
	if (verified) {
		return { alreadyVerified: true as const, email: maskEmail(email), expiresIn: 0 };
	}
	const credential = await loadCredentialAccount(sql, userId);
	if (!credential) {
		// Google / X accounts are treated as verified at the provider.
		await sql.query(`update "user" set "emailVerified" = true, "updatedAt" = now() where id = $1`, [userId]);
		return { alreadyVerified: true as const, email: maskEmail(email), expiresIn: 0 };
	}
	const recent = await sql.query(
		`select created_at from email_signup_codes where user_id = $1 and created_at > now() - interval '1 hour' order by created_at desc`,
		[userId],
	);
	if (recent.length >= OTP_HOUR_CAP) throw new Error("Too many verification emails. Try again in an hour.");
	const last = recent[0]?.created_at ? new Date(String(recent[0].created_at)).getTime() : 0;
	if (last && Date.now() - last < OTP_TTL_MS) throw new Error("A code is already on the way. Wait 2 minutes to send another.");
	await sql.query(`update email_signup_codes set consumed_at = now() where user_id = $1 and consumed_at is null`, [userId]);
	const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
	const salt = randomBytes(16).toString("hex");
	const digest = hashOtp(salt, code).toString("hex");
	const id = `esc-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
	const expires = new Date(Date.now() + OTP_TTL_MS);
	await sql.query(
		`insert into email_signup_codes (id, user_id, email, code_hash, salt, expires_at) values ($1,$2,$3,$4,$5,$6)`,
		[id, userId, email, digest, salt, expires],
	);
	const { sendEmail } = await import("@/lib/email/resend.server");
	await sendEmail({
		to: email,
		subject: "Your South End Pizza signup code",
		text: `Welcome to South End Pizza! Your verification code is ${code}. It expires in 2 minutes.`,
		html: `<p style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#1a1410">Welcome to South End Pizza — almost ready to order.</p>
<p style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.5;color:#1a1410">Your verification code is:</p>
<p style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:28px;letter-spacing:0.28em;font-weight:700;color:#1a1410">${code}</p>
<p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.45;color:#5c534c">It expires in 2 minutes. If you did not create an account, you can ignore this message.</p>`,
	});
	return {
		sent: true as const,
		alreadyVerified: false as const,
		email: maskEmail(email),
		expiresIn: OTP_TTL_SEC,
		previewCode: dbSource === "pglite" ? code : undefined,
	};
});

export const verifySignupEmailCode = createServerFn({ method: "POST" }).validator((data: any) => data).handler(async ({ data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	const email = String(data.email ?? "").trim().toLowerCase();
	const code = String(data.code ?? "").replace(/\D/g, "");
	if (!email || !email.includes("@")) throw new Error("Enter a valid email address.");
	if (isPhoneAuthEmail(email) || isStaffAdminAccount(undefined, email)) {
		return { ok: true as const, skipped: true as const };
	}
	if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code from your email.");
	const users = await sql.query(`select id, "emailVerified" as verified from "user" where lower(email) = $1 limit 1`, [email]);
	const user = users[0];
	if (!user) throw new Error("We could not verify that email. Try signing up again.");
	const userId = String(user.id);
	const verified = user.verified === true || user.verified === "t" || user.verified === "true";
	if (verified) return { ok: true as const, alreadyVerified: true as const };
	const rows = await sql.query(
		`select id, code_hash, salt, expires_at, attempts, consumed_at from email_signup_codes
     where user_id = $1 and consumed_at is null order by created_at desc limit 1`,
		[userId],
	);
	const row = rows[0];
	if (!row) throw new Error("Send a new one-time code first.");
	if (new Date(String(row.expires_at)).getTime() < Date.now()) {
		await sql.query(`update email_signup_codes set consumed_at = now() where id = $1`, [String(row.id)]);
		throw new Error("That code expired. Send a new one.");
	}
	const attempts = Math.round(num(row.attempts));
	if (attempts >= OTP_MAX_ATTEMPTS) {
		await sql.query(`update email_signup_codes set consumed_at = now() where id = $1`, [String(row.id)]);
		throw new Error("Too many tries. Send a new code.");
	}
	const expected = Buffer.from(String(row.code_hash), "hex");
	const got = hashOtp(String(row.salt), code);
	if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
		await sql.query(`update email_signup_codes set attempts = attempts + 1 where id = $1`, [String(row.id)]);
		throw new Error("That code does not match. Try again.");
	}
	await sql.query(`update "user" set "emailVerified" = true, "updatedAt" = now() where id = $1`, [userId]);
	await sql.query(`update email_signup_codes set consumed_at = now() where user_id = $1 and consumed_at is null`, [userId]);
	return { ok: true as const };
});

export const sendSignupPhoneCode = createServerFn({ method: "POST" }).validator((data: any) => data).handler(async ({ data }) => {
	if (!PHONE_SIGNUP_ENABLED) throw new Error("Phone signup is off. Create the account with email.");
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	const rawPhone = String(data.phone ?? "").trim();
	const rawEmail = String(data.email ?? "").trim().toLowerCase();
	const ten = toTenDigitPhone(rawPhone) || phoneFromAuthEmail(rawEmail) || toTenDigitPhone(rawEmail);
	if (!ten) throw new Error("Enter a 10-digit US phone number.");
	const email = `${ten}@phone.southend.pizza`;
	const e164 = toE164(ten);
	const masked = maskPhone(ten);
	if (isStaffAdminAccount(undefined, email)) {
		return { alreadyVerified: true as const, skipped: true as const, phone: masked, expiresIn: 0, resendIn: 0 };
	}
	const users = await sql.query(`select id, email, "emailVerified" as verified from "user" where lower(email) = $1 limit 1`, [email]);
	const user = users[0];
	if (!user) throw new Error("We could not send a code for that phone. Check the number and try again.");
	const userId = String(user.id);
	if (isStaffAdminAccount(userId, email)) {
		return { alreadyVerified: true as const, skipped: true as const, phone: masked, expiresIn: 0, resendIn: 0 };
	}
	const verified = user.verified === true || user.verified === "t" || user.verified === "true";
	if (verified) {
		return { alreadyVerified: true as const, phone: masked, expiresIn: 0, resendIn: 0 };
	}
	const credential = await loadCredentialAccount(sql, userId);
	if (!credential) {
		await sql.query(`update "user" set "emailVerified" = true, "updatedAt" = now() where id = $1`, [userId]);
		return { alreadyVerified: true as const, phone: masked, expiresIn: 0, resendIn: 0 };
	}
	const recent = await sql.query(
		`select created_at from phone_signup_codes where user_id = $1 and created_at > now() - interval '1 hour' order by created_at desc`,
		[userId],
	);
	if (recent.length >= OTP_HOUR_CAP) throw new Error("Too many verification texts. Try again in an hour.");
	const last = recent[0]?.created_at ? new Date(String(recent[0].created_at)).getTime() : 0;
	if (last && Date.now() - last < SMS_RESEND_MS) throw new Error("A code is already on the way. Wait 60 seconds to send another.");
	await sql.query(`update phone_signup_codes set consumed_at = now() where user_id = $1 and consumed_at is null`, [userId]);

	const { smsChannel, startTwilioVerify, sendTwilioMessage } = await import("@/lib/sms/twilio.server");
	const channel = smsChannel();
	if (channel === "none" && isVercelProduction()) {
		throw new Error("SMS is not configured for this shop.");
	}

	const id = `psc-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
	const expires = new Date(Date.now() + SMS_OTP_TTL_MS);
	let previewCode: string | undefined;

	if (channel === "verify") {
		await startTwilioVerify(e164);
		await sql.query(
			`insert into phone_signup_codes (id, user_id, phone, code_hash, salt, expires_at) values ($1,$2,$3,$4,$5,$6)`,
			[id, userId, ten, TWILIO_VERIFY_SALT, TWILIO_VERIFY_SALT, expires],
		);
	} else {
		const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
		const salt = randomBytes(16).toString("hex");
		const digest = hashOtp(salt, code).toString("hex");
		await sql.query(
			`insert into phone_signup_codes (id, user_id, phone, code_hash, salt, expires_at) values ($1,$2,$3,$4,$5,$6)`,
			[id, userId, ten, digest, salt, expires],
		);
		if (channel === "message") {
			await sendTwilioMessage(e164, `South End Pizza code: ${code} (expires in 10 min).`);
		} else {
			console.info(`[sms] Twilio missing — preview send for ${masked}`);
		}
		if (channel === "none" || dbSource === "pglite") previewCode = code;
	}

	return {
		sent: true as const,
		alreadyVerified: false as const,
		phone: masked,
		expiresIn: 600,
		resendIn: 60,
		previewCode,
	};
});

export const verifySignupPhoneCode = createServerFn({ method: "POST" }).validator((data: any) => data).handler(async ({ data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	const rawPhone = String(data.phone ?? "").trim();
	const rawEmail = String(data.email ?? "").trim().toLowerCase();
	const ten = toTenDigitPhone(rawPhone) || phoneFromAuthEmail(rawEmail) || toTenDigitPhone(rawEmail);
	const code = String(data.code ?? "").replace(/\D/g, "");
	if (!ten) throw new Error("Enter a 10-digit US phone number.");
	const email = `${ten}@phone.southend.pizza`;
	if (isStaffAdminAccount(undefined, email)) {
		return { ok: true as const, skipped: true as const };
	}
	if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6-digit code we texted you.");
	const users = await sql.query(`select id, "emailVerified" as verified from "user" where lower(email) = $1 limit 1`, [email]);
	const user = users[0];
	if (!user) throw new Error("We could not verify that phone. Try signing up again.");
	const userId = String(user.id);
	const verified = user.verified === true || user.verified === "t" || user.verified === "true";
	if (verified) return { ok: true as const, alreadyVerified: true as const };
	const rows = await sql.query(
		`select id, code_hash, salt, expires_at, attempts, consumed_at from phone_signup_codes
     where user_id = $1 and consumed_at is null order by created_at desc limit 1`,
		[userId],
	);
	const row = rows[0];
	if (!row) throw new Error("Send a new one-time code first.");
	if (new Date(String(row.expires_at)).getTime() < Date.now()) {
		await sql.query(`update phone_signup_codes set consumed_at = now() where id = $1`, [String(row.id)]);
		throw new Error("That code expired. Send a new one.");
	}
	const attempts = Math.round(num(row.attempts));
	if (attempts >= OTP_MAX_ATTEMPTS) {
		await sql.query(`update phone_signup_codes set consumed_at = now() where id = $1`, [String(row.id)]);
		throw new Error("Too many tries. Send a new code.");
	}

	const salt = String(row.salt);
	let match = false;
	if (salt === TWILIO_VERIFY_SALT || String(row.code_hash) === TWILIO_VERIFY_SALT) {
		const { checkTwilioVerify } = await import("@/lib/sms/twilio.server");
		match = await checkTwilioVerify(toE164(ten), code);
	} else {
		const expected = Buffer.from(String(row.code_hash), "hex");
		const got = hashOtp(salt, code);
		match = expected.length === got.length && timingSafeEqual(expected, got);
	}
	if (!match) {
		await sql.query(`update phone_signup_codes set attempts = attempts + 1 where id = $1`, [String(row.id)]);
		throw new Error("That code does not match. Try again.");
	}
	await sql.query(`update "user" set "emailVerified" = true, "updatedAt" = now() where id = $1`, [userId]);
	await sql.query(`update phone_signup_codes set consumed_at = now() where user_id = $1 and consumed_at is null`, [userId]);
	return { ok: true as const };
});

export const patchPosOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const id = String(data.id || "").trim();
	if (!id) throw new Error("Choose an order.");
	const rows = await sql`select * from orders where id = ${id}`;
	if (!rows[0]) throw new Error("Order not found.");
	const current = toOrder(rows[0]);
	if (current.status === "canceled") throw new Error("A canceled ticket cannot be edited.");
	const items = parseOrderItems(data.items).filter((it) => it.qty > 0 && it.name);
	if (!items.length) throw new Error("Keep at least one item on the ticket.");
	const settings = await loadSettingsRow(sql);
	const subtotal = Math.round(items.reduce((s, l) => s + l.unitPrice * l.qty, 0) * 100) / 100;
	const discount = current.discount;
	const deliveryFee = current.deliveryFee;
	const taxRate = settings.tax_rate === void 0 || settings.tax_rate === null || settings.tax_rate === "" ? 6.625 : Math.max(0, num(settings.tax_rate));
	const { tax, total: preTip } = computeTax(subtotal, discount, deliveryFee, taxRate);
	const tip = current.tip;
	const total = Math.round((preTip + tip) * 100) / 100;
	await sql.query(
		`update orders set items = $1::jsonb, subtotal = $2, tax = $3, total = $4 where id = $5`,
		[JSON.stringify(items), subtotal.toFixed(2), tax.toFixed(2), total.toFixed(2), id],
	);
	const next = (await sql`select * from orders where id = ${id}`)[0];
	return {
		ok: true as const,
		order: next ? toOrder(next) : null
	};
});
export const listPosOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	return (await sql`
      select o.*, p.display_name, p.phone,
        ping.id as chat_thread_id,
        ping.unread_admin as chat_unread
      from orders o
      left join profiles p on p.user_id = o.user_id
      left join (
        select distinct on (order_id) id, order_id, unread_admin
        from chat_threads
        where order_id is not null
          and unread_admin > 0
          and status <> 'solved'
          and muted is not true
        order by order_id, last_at desc
      ) ping on ping.order_id = o.id
      order by o.created_at desc
      limit 120`).map((row) => {
		return {
			...toOrder(row),
			customerName: String(row.display_name || "").trim() || "Guest",
			customerPhone: String(row.phone || ""),
			chatUnread: Math.round(num(row.chat_unread)),
			chatThreadId: row.chat_thread_id ? String(row.chat_thread_id) : null
		};
	});
});
export const listIncomingOrders = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	return (await sql`
      select o.*, p.display_name, p.phone
      from orders o
      left join profiles p on p.user_id = o.user_id
      where o.status = 'placed'
      order by o.created_at asc, coalesce(o.ticket_no, 0) asc, o.id asc
      limit 40`).map((row) => {
		return {
			...toOrder(row),
			customerName: String(row.pickup_name || row.display_name || "").trim() || "Guest",
			customerPhone: String(row.phone || ""),
			chatUnread: 0,
			chatThreadId: null
		};
	});
});
export const getAdminInboxCount = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const rows = await sql`
      select count(*)::int as n from chat_threads where unread_admin > 0 and status <> 'solved' and muted is not true`;
	return { unread: Math.round(num(rows[0]?.n)) };
});
export const listAdminChats = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	return (await sql`
      select t.*, p.display_name, p.phone as customer_phone, p.banned,
        o.id as linked_order_id, o.ticket_no as order_ticket_no, o.status as order_status, o.fulfillment as order_fulfillment,
        o.total as order_total, o.notes as order_notes, o.created_at as order_created, o.items as order_items
      from chat_threads t
      left join profiles p on p.user_id = t.user_id
      left join orders o on o.id = t.order_id
      order by t.flagged desc, t.last_at desc
      limit 80`).map((row) => toThread(row, String(row.display_name || "").trim() || "Guest"));
});
export const listMyChats = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	return (await sql`
      select t.*,
        o.id as linked_order_id, o.ticket_no as order_ticket_no, o.status as order_status, o.fulfillment as order_fulfillment,
        o.total as order_total, o.notes as order_notes, o.created_at as order_created, o.items as order_items
      from chat_threads t
      left join orders o on o.id = t.order_id
      where t.user_id = ${context.userId} and t.status <> 'solved'
      order by t.last_at desc
      limit 20`).map((row) => {
		const t = toThread(row, "You");
		return { ...t, staffNote: "", muted: false, flagged: false };
	});
});
export const loadChatMessages = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const threadId = String(data.threadId || "");
	const thread = await sql`select user_id, status from chat_threads where id = ${threadId}`;
	if (!thread[0]) throw new Error("Chat not found.");
	const isAdmin = await profileDeskOn(sql, context.userId);
	if (!isAdmin && thread[0].user_id !== context.userId) throw new Error("Forbidden");
	if (!isAdmin && String(thread[0].status) === "solved") return [];
	if (isAdmin) await sql`update chat_threads set unread_admin = 0 where id = ${threadId}`;
	else await sql`update chat_threads set unread_customer = 0 where id = ${threadId}`;
	return (await sql`
      select * from chat_messages where thread_id = ${threadId} order by created_at asc limit 200`).map(toMessage);
});
export const startChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await assertNotBanned(sql, context.userId);
	const body = String(data.body || "").trim().slice(0, 1000);
	if (!body) throw new Error("Write a message first.");
	let orderId: string | null = String(data.orderId || "").trim() || null;
	if (!orderId) throw new Error("Pick an active order first.");
	if (!(await sql`
        select id from orders where id = ${orderId} and user_id = ${context.userId}`)[0]) throw new Error("That ticket is not on this account.");
	const forceNew = Boolean(data.forceNew);
	const openRow = forceNew
		? undefined
		: (await sql`
      select id from chat_threads
      where user_id = ${context.userId} and status = 'open'
      order by last_at desc limit 1`)[0];
	let threadId = openRow?.id ? String(openRow.id) : "";
	const preview = body.slice(0, 140);
	if (!threadId) {
		threadId = newId("chat");
		await sql.query(`insert into chat_threads (id, user_id, status, last_message, last_at, unread_admin, unread_customer, order_id)
         values ($1,$2,'open',$3,now(),1,0,$4)`, [
			threadId,
			context.userId,
			preview,
			orderId
		]);
	} else await sql.query(`update chat_threads
         set last_message = $1, last_at = now(), unread_admin = unread_admin + 1, unread_customer = 0,
             status = 'open', order_id = coalesce($3, order_id)
         where id = $2`, [
		preview,
		threadId,
		orderId
	]);
	const msgId = newId("msg");
	await sql.query(`insert into chat_messages (id, thread_id, sender_id, sender_role, body) values ($1,$2,$3,'customer',$4)`, [
		msgId,
		threadId,
		context.userId,
		body
	]);
	return { threadId };
});
export const sendChatMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	const threadId = String(data.threadId || "");
	const body = String(data.body || "").trim().slice(0, 1000);
	if (!body) throw new Error("Write a message first.");
	const thread = await sql`select user_id, status from chat_threads where id = ${threadId}`;
	if (!thread[0]) throw new Error("Chat not found.");
	const isAdmin = await profileDeskOn(sql, context.userId);
	if (!isAdmin && thread[0].user_id !== context.userId) throw new Error("Forbidden");
	if (!isAdmin) await assertNotBanned(sql, context.userId);
	if (!isAdmin && String(thread[0].status) === "solved") throw new Error("This chat has concluded. Start a new chat.");
	const role = isAdmin ? "admin" : "customer";
	const msgId = newId("msg");
	await sql.query(`insert into chat_messages (id, thread_id, sender_id, sender_role, body) values ($1,$2,$3,$4,$5)`, [
		msgId,
		threadId,
		context.userId,
		role,
		body
	]);
	if (isAdmin) await sql.query(`update chat_threads
         set last_message = $1, last_at = now(), unread_customer = unread_customer + 1, unread_admin = 0, status = 'open'
         where id = $2`, [body.slice(0, 140), threadId]);
	else await sql.query(`update chat_threads
         set last_message = $1, last_at = now(), unread_admin = unread_admin + 1, unread_customer = 0, status = 'open'
         where id = $2`, [body.slice(0, 140), threadId]);
	return {
		ok: true,
		id: msgId
	};
});
export const setChatResolution = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const threadId = String(data.threadId || "");
	if (!(await sql`select id from chat_threads where id = ${threadId}`)[0]) throw new Error("Chat not found.");
	const status = data.solved ? "solved" : "open";
	if (data.solved) {
		await sql.query(`update chat_threads
         set status = 'solved', unread_admin = 0, unread_customer = 0, last_at = now()
         where id = $1`, [threadId]);
	} else {
		await sql.query(`update chat_threads set status = $1, unread_admin = 0 where id = $2`, [status, threadId]);
	}
	return {
		ok: true,
		status
	};
});

export const attachChatOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { threadId: string; orderId: string }) => data)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureSettingsSchema(sql);
    await ensureProfile(sql, context.userId);
    const threadId = String(data.threadId || "");
    const orderId = String(data.orderId || "").trim();
    if (!threadId || !orderId) throw new Error("Choose a ticket.");
    const thread = await sql<{ user_id: string }>`select user_id from chat_threads where id = ${threadId}`;
    if (!thread[0]) throw new Error("Chat not found.");
    const me = await sql<{ role: string }>`select role from profiles where user_id = ${context.userId}`;
    const isAdmin = me[0]?.role === "admin";
    if (!isAdmin && thread[0].user_id !== context.userId) throw new Error("Forbidden");
    const ownerId = thread[0].user_id;
    const own = await sql<{ id: string }>`select id from orders where id = ${orderId} and user_id = ${ownerId}`;
    if (!own[0]) throw new Error("That ticket is not on this account.");
    await sql`update chat_threads set order_id = ${orderId} where id = ${threadId}`;
    return { ok: true as const, orderId };
  });

export const startAdminChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const userId = String(data.userId || "").trim();
	if (!userId) throw new Error("Choose a customer.");
	if (!(await sql`select user_id from profiles where user_id = ${userId}`)[0]) throw new Error("Account not found.");
	const open = (await sql`
      select id from chat_threads where user_id = ${userId} and status <> 'solved' order by last_at desc limit 1`)[0];
	if (open?.id) return { threadId: String(open.id) };
	const any = (await sql`select id from chat_threads where user_id = ${userId} order by last_at desc limit 1`)[0];
	if (any?.id) return { threadId: String(any.id) };
	const threadId = newId("chat");
	await sql.query(`insert into chat_threads (id, user_id, status, last_message, last_at, unread_admin, unread_customer)
       values ($1,$2,'open',$3,now(),0,0)`, [threadId, userId, "Shop started a conversation"]);
	return { threadId };
});

export const setChatStaffNote = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const threadId = String(data.threadId || "");
	if (!(await sql`select id from chat_threads where id = ${threadId}`)[0]) throw new Error("Chat not found.");
	const note = String(data.note ?? "").slice(0, 800);
	await sql`update chat_threads set staff_note = ${note} where id = ${threadId}`;
	return { ok: true as const, note };
});

export const setChatMuted = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const threadId = String(data.threadId || "");
	if (!(await sql`select id from chat_threads where id = ${threadId}`)[0]) throw new Error("Chat not found.");
	const muted = Boolean(data.muted);
	await sql`update chat_threads set muted = ${muted} where id = ${threadId}`;
	return { ok: true as const, muted };
});

export const setChatFlagged = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const threadId = String(data.threadId || "");
	if (!(await sql`select id from chat_threads where id = ${threadId}`)[0]) throw new Error("Chat not found.");
	const flagged = Boolean(data.flagged);
	await sql`update chat_threads set flagged = ${flagged} where id = ${threadId}`;
	return { ok: true as const, flagged };
});

export const deleteChatMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const id = String(data.id || "").trim();
	const row = (await sql`select thread_id from chat_messages where id = ${id}`)[0];
	if (!row) throw new Error("Message not found.");
	const threadId = String(row.thread_id);
	await sql`delete from chat_messages where id = ${id}`;
	const last = (await sql`select body from chat_messages where thread_id = ${threadId} order by created_at desc limit 1`)[0];
	await sql.query(`update chat_threads set last_message = $1 where id = $2`, [String(last?.body ?? "").slice(0, 140), threadId]);
	return { ok: true as const, id };
});

export const deleteChatThread = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data: any) => data).handler(async ({ context, data }) => {
	const sql = await getSql();
	await ensureSettingsSchema(sql);
	await ensureProfile(sql, context.userId);
	await requireAdmin(sql, context.userId);
	const threadId = String(data.threadId || "").trim();
	if (!(await sql`select id from chat_threads where id = ${threadId}`)[0]) throw new Error("Chat not found.");
	await sql`delete from chat_messages where thread_id = ${threadId}`;
	await sql`delete from chat_threads where id = ${threadId}`;
	return { ok: true as const, threadId };
});
