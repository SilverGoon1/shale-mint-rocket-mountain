import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MenuEditor } from "@/components/menu-editor";
import { MenuBoard } from "@/components/menu-board";
import { BoardStudio } from "@/components/board-studio";
import { PrinterSetup } from "@/components/printer-setup";
import { ZoneMap } from "@/components/zone-map";
import {
  DeliveryPanel,
  HoursPanel,
  PaymentsPanel,
  ShopDetailsAccordions,
  SharedExtrasPanel,
  TaxPanel,
  ToppingPricePanel,
  ToppingPricesPanel,
  VacationPanel,
} from "@/components/shop-ops-panels";
import { SaveToast, useSaveFlash } from "@/components/save-toast";
import { useMenuStore, type EditableCategory } from "@/lib/menu-store";
import { getAdminShop, saveDeliveryZone, saveShopMenu, saveShopSettings, savePaymentProcessors } from "@/lib/shop-server";
import {
  DEFAULT_RECEIPT_OPTIONS,
  deliveryHasZones,
  type PrinterProfile,
  type ProcessorSecretStatus,
  type ReceiptOptions,
  type ShopSettingsPublic,
} from "@/lib/shop-types";
import type { RestaurantInfo } from "@/data/menu";

const TABS = ["menu", "toppings", "shop", "payments", "delivery", "printers", "board"] as const;
type MenuTab = (typeof TABS)[number];

function asMenuTab(raw: unknown): MenuTab | undefined {
  let s = typeof raw === "string" ? raw : "";
  if (s === "vacation" || s === "hours" || s === "look" || s === "cards") s = "shop";
  if (s === "tax") s = "payments";
  return (TABS as readonly string[]).includes(s) ? (s as MenuTab) : undefined;
}

export const Route = createFileRoute("/admin/menu")({
  validateSearch: (search: Record<string, unknown>): { tab?: MenuTab } => {
    const tab = asMenuTab(search.tab);
    return tab ? { tab } : {};
  },
  component: AdminMenu,
});

function AdminMenu() {
  const { tab: wanted } = Route.useSearch();
  const tab: MenuTab = wanted ?? "menu";
  const [msg, setMsg] = useState("");
  const [settings, setSettings] = useState<ShopSettingsPublic | null>(null);
  const [secretStatus, setSecretStatus] = useState<ProcessorSecretStatus[]>([]);
  const [printers, setPrinters] = useState<PrinterProfile[]>([]);
  const [receipt, setReceipt] = useState<ReceiptOptions>(DEFAULT_RECEIPT_OPTIONS);
  const [printerStamp, setPrinterStamp] = useState("");
  const [cells, setCells] = useState<string[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const { toast, flashOk, flashFail } = useSaveFlash();
  const navigate = Route.useNavigate();

  useEffect(() => {
    void useMenuStore.persist.rehydrate();
    void getAdminShop().then((d) => {
      useMenuStore.getState().replaceAll({
        restaurant: d.restaurant,
        footer: d.footer,
        categories: d.categories as EditableCategory[],
        cardTextSize: d.settings.cardTextSize,
        cardTextColor: d.settings.cardTextColor,
        cardDescColor: d.settings.cardDescColor,
        cardPriceColor: d.settings.cardPriceColor,
        cardSize: d.settings.cardSize,
        cardBg: d.settings.cardBg,
        tagline: d.settings.tagline,
        showMark: d.settings.showMark,
      });
      setSettings(d.settings);
      setSecretStatus(d.paymentSecretStatus ?? []);
      setRestaurant(d.restaurant);
      setPrinters(d.printers);
      setReceipt(d.receiptOptions);
      setPrinterStamp(JSON.stringify({ printers: d.printers, receipt: d.receiptOptions }));
      setCells(d.cells);
      useMenuStore.getState().applyPizzaNotes(d.settings);
    });
  }, []);

  function go(next: MenuTab) {
    void navigate({ to: "/admin/menu", search: next === "menu" ? {} : { tab: next } });
  }

  function saveMenuAndSettings(ok = "Prices and shop details are live.") {
    const snap = useMenuStore.getState();
    if (settings) snap.applyPizzaNotes(settings);
    const nextSnap = useMenuStore.getState();
    const nextRestaurant = { ...nextSnap.restaurant, shortName: nextSnap.restaurant.name };
    void Promise.all([
      saveShopMenu({
        data: { restaurant: nextRestaurant, footer: nextSnap.footer, categories: nextSnap.categories },
      }),
      saveShopSettings({
        data: {
          tagline: nextSnap.tagline,
          showMark: nextSnap.showMark,
          toppingPriceSm: settings?.toppingPriceSm,
          toppingPriceMd: settings?.toppingPriceMd,
          toppingPriceLg: settings?.toppingPriceLg,
          toppingPriceXl: settings?.toppingPriceXl,
          toppingPricesById: settings?.toppingPricesById,
        },
      }),
    ])
      .then(() => {
        setRestaurant(nextRestaurant);
        setMsg(ok);
        flashOk(true);
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not save"));
  }

  function saveOps(data: Record<string, unknown>, ok = "Saved.") {
    void saveShopSettings({ data })
      .then(() => {
        setMsg(ok);
        flashOk(true);
      })
      .catch((e) => {
        const text = e instanceof Error ? e.message : "Could not save";
        setMsg(text);
        flashFail(text);
      });
  }

  return (
    <div className="menu-ops-page">
      <SaveToast toast={toast} />
      <div className="page-card">
        <h1>Menu & shop details</h1>
        <div className="seg center-tabs menu-ops-tabs" role="tablist" aria-label="Menu and shop details">
          {(
            [
              ["menu", "Menu"],
              ["toppings", "Toppings"],
              ["shop", "Shop details"],
              ["payments", "Payments"],
              ["delivery", "Delivery"],
              ["printers", "Printers"],
              ["board", "Board"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              data-on={tab === id}
              onClick={() => go(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "menu" ? (
        <div className="admin-menu-grid">
          <div>
            <div className="page-card">
              <button type="button" className="btn-print" onClick={() => saveMenuAndSettings()}>
                Save all
              </button>
              {msg ? <p className="ed-sub">{msg}</p> : null}
            </div>
            <MenuEditor settings={settings ?? undefined} />
          </div>
          <div className="preview-wrap">
            <MenuBoard paper="letter" showDesc={false} settings={settings ?? undefined} />
          </div>
        </div>
      ) : null}

      {tab === "toppings" && settings ? (
        <div className="settings-page toppings-ops">
          <ToppingPricesPanel settings={settings} setSettings={setSettings} />
          <SharedExtrasPanel />
          <ToppingPricePanel settings={settings} setSettings={setSettings} />
          <button type="button" className="btn-print" onClick={() => saveMenuAndSettings("Topping prices are live.")}>
            Save toppings
          </button>
          {msg ? <p className="ed-sub">{msg}</p> : null}
        </div>
      ) : null}

      {tab === "shop" && settings ? (
        <div className="settings-page">
          <ShopDetailsAccordions settings={settings} setSettings={setSettings} />
          <button type="button" className="btn-print" onClick={() => saveMenuAndSettings("Shop details are live.")}>
            Save shop details
          </button>
          <HoursPanel settings={settings} setSettings={setSettings} />
          <VacationPanel settings={settings} setSettings={setSettings} />
          <button
            type="button"
            className="btn-print"
            onClick={() =>
              saveOps(
                {
                  weeklyHours: settings.weeklyHours,
                  prepMinutes: settings.prepMinutes,
                  deliveryMinutes: settings.deliveryMinutes,
                  vacationOn: settings.vacationOn,
                  vacationMessage: settings.vacationMessage,
                  vacationUntil: settings.vacationUntil,
                },
                "Hours and vacation are live.",
              )
            }
          >
            Save hours
          </button>
          {msg ? <p className="ed-sub">{msg}</p> : null}
        </div>
      ) : null}

      {tab !== "menu" && !settings ? <div className="page-skel">Loading…</div> : null}

      {tab === "payments" && settings ? (
        <div className="settings-page">
          <PaymentsPanel
            settings={settings}
            setSettings={setSettings}
            secretStatus={secretStatus}
            setSecretStatus={setSecretStatus}
            onSaved={(ok) => {
              setMsg(ok);
              flashOk(true);
            }}
          />
          <button
            type="button"
            className="btn-print"
            onClick={() => {
              void savePaymentProcessors({
                data: {
                  accounts: settings.paymentAccounts,
                  guestCardRequired: settings.guestCardRequired,
                  paymentPlaceholder: settings.paymentPlaceholder,
                },
              })
                .then((res) => {
                  setSettings({ ...settings, paymentAccounts: res.accounts });
                  setSecretStatus(res.secretStatus);
                  setMsg("Payment settings are live.");
                  flashOk(true);
                })
                .catch((e) => {
                  const text = e instanceof Error ? e.message : "Could not save";
                  setMsg(text);
                  flashFail(text);
                });
            }}
          >
            Save payments
          </button>
          <TaxPanel settings={settings} setSettings={setSettings} />
          <button
            type="button"
            className="btn-print"
            onClick={() => saveOps({ taxRate: settings.taxRate }, "Tax rate is live.")}
          >
            Save tax
          </button>
          {msg ? <p className="ed-sub">{msg}</p> : null}
        </div>
      ) : null}

      {tab === "delivery" && settings ? (
        <div className="settings-page">
          <DeliveryPanel settings={settings} setSettings={setSettings} />
          <section className="page-card">
            <h2>Delivery zone</h2>
            <p className="ed-sub">
              {settings.deliveryZoneMode === "radius"
                ? `A tomato circle shows the ${settings.deliveryRadiusMiles || 5}-mile zone around 443 Zion Rd. Search a street to test it.`
                : "Paint the blocks you cover. Customer checkout geocodes the address and only allows delivery inside the painted area. Use the search to confirm a street, then paint it."}
            </p>
            <ZoneMap
              cells={cells}
              onChange={setCells}
              mode={settings.deliveryZoneMode === "radius" ? "radius" : "paint"}
              radiusMiles={settings.deliveryRadiusMiles || 5}
            />
          </section>
          <button
            type="button"
            className="btn-print"
            onClick={() => {
              void Promise.all([
                saveShopSettings({
                  data: {
                    minOrderDelivery: settings.minOrderDelivery,
                    deliveryFee: settings.deliveryFee,
                    deliveryFeeOn: settings.deliveryFeeOn,
                    deliveryMinutes: settings.deliveryMinutes,
                    deliveryZoneMode: settings.deliveryZoneMode,
                    deliveryRadiusMiles: settings.deliveryRadiusMiles,
                    blockNorthfield: false,
                  },
                }),
                saveDeliveryZone({ data: { cells } }),
              ])
                .then(([, zone]) => {
                  const hasZones = deliveryHasZones(
                    settings.deliveryZoneMode === "radius" ? "radius" : "paint",
                    settings.deliveryRadiusMiles || 5,
                    cells.length,
                  );
                  setSettings({ ...settings, hasZones });
                  setMsg(
                    settings.deliveryZoneMode === "radius"
                      ? `Delivery settings are live. ${settings.deliveryRadiusMiles || 5} mile radius from the shop.`
                      : `Delivery settings are live. Saved ${zone.count} blocks.`,
                  );
                  flashOk(true);
                })
                .catch((e) => {
                  const text = e instanceof Error ? e.message : "Could not save";
                  setMsg(text);
                  flashFail(text);
                });
            }}
          >
            Save delivery
          </button>
          {msg ? <p className="ed-sub">{msg}</p> : null}
        </div>
      ) : null}

      {tab === "printers" && settings && restaurant ? (
        <div className="settings-page">
          <PrinterSetup
            printers={printers}
            setPrinters={setPrinters}
            receipt={receipt}
            setReceipt={setReceipt}
            restaurant={restaurant}
            taxRate={settings.taxRate}
            onSave={() => {
              const stamp = JSON.stringify({ printers, receipt });
              if (stamp === printerStamp) {
                flashOk(false);
                return;
              }
              void saveShopSettings({ data: { printers, receiptOptions: receipt } })
                .then(() => {
                  setPrinterStamp(stamp);
                  flashOk(true);
                  setMsg("Printer setup is live.");
                })
                .catch((e) => flashFail(e instanceof Error ? e.message : "Printers were not saved."));
            }}
          />
          {msg ? <p className="ed-sub">{msg}</p> : null}
        </div>
      ) : null}

      {tab === "board" && settings ? <BoardStudio embedded settings={settings} /> : null}
    </div>
  );
}
