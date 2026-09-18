# Workshop HOTFIX — Await shop patches so pasta/desserts/beverages backfill
**Date:** 2026-09-18  
**Severity:** Production guest menu missing whole categories  
**Live target:** https://southendpizza.app/

## Diagnosis
- Live `data-cat` ends at `gyros` (15 cats). **Missing:** `pasta`, `desserts`, `beverages`.
- Seed `src/data/menu.ts` has Pasta Dishes / Desserts / Beverages after Gyro Sandwiches.
- `backfillMissingSeedCategories` already exists in `runShopPatches` (commit `0a511bd`) but **never reliably applied** on Neon:
  - `bootShop` started `runShopPatches` then **early-returned** when any menu row existed (`__southendHasMenu__` / `select 1 from menu_categories`).
  - Patches were fire-and-forget; serverless response could finish before insert; `loadStorefront` read categories without waiting.
- Not a storefront filter bug — Neon simply lacks those category rows.

## MUST — `src/lib/shop-server.ts` `bootShop`
Always **await** `shopBoot.__southendBoot__` (i.e. `runShopPatches`) before returning. Keep `backfillMissingSeedCategories` + `bustStorefrontCache()` on insert. Do not early-return past the await when the menu already exists.

Replace `bootShop` with:

```ts
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
	// Always await patches. Early-return when menu already exists skipped
	// backfillMissingSeedCategories (pasta/desserts/beverages never inserted).
	await shopBoot.__southendBoot__;
	if (!shopBoot.__southendHasMenu__) {
		shopBoot.__southendHasMenu__ = (await sql.query(`select 1 from menu_categories limit 1`)).length > 0;
	}
}
```

## KEEP
- `backfillMissingSeedCategories` (insert missing seed cats/items only; `on conflict do nothing`)
- Existing seed / condiment / wing patch pipeline in `runShopPatches`
- No Neon manual writes from agents

## MUST NOT
- Wipe or re-seed the whole menu
- Commit `.vercel/output`
- Invent DB credentials / direct Neon writes outside app boot

## Smoke
1. Deploy / Export so production cold-boots with this `bootShop`
2. Hit https://southendpizza.app/ (hard refresh)
3. `data-cat` must include `pasta`, `desserts`, `beverages` after `gyros`
4. Category rail + page body show **Pasta Dishes**, **Desserts**, **Beverages**

## Evidence (pre-fix)
- Screenshots: `screenshots/menu-diag-2026-09-18/` (`01-home-top.png`, `02-category-rail-scrolled.png`, `04-bottom.png`)
- Live `data-cat`: pizza, gourmet, appetizers, salads, sides, wings, turnovers, sandwiches, clubs, hot-subs, cold-subs, steak-subs, burgers, wraps, **gyros** — stop.

**Status:** Code fix on main + this paste for Workshop. Verify live `data-cat` after deploy.
