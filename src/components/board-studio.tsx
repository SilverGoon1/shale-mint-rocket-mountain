import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { CategoryJump, MenuBoard, isLetterPack, type PaperSize } from "@/components/menu-board";
import { useMenuStore } from "@/lib/menu-store";
import { getStorefront } from "@/lib/shop-server";
import type { ShopSettingsPublic } from "@/lib/shop-types";

const PRINT_SCALE_KEY = "wallMenuPrintScale";
const PRINT_SCALE_PRESETS = [100, 110, 125, 150] as const;

function readPrintScale() {
  try {
    const n = Number(localStorage.getItem(PRINT_SCALE_KEY));
    if (Number.isFinite(n) && n >= 90 && n <= 160) return Math.round(n);
  } catch {
    /* ignore */
  }
  return 100;
}

export function BoardStudio({
  embedded,
  settings: givenSettings,
}: {
  embedded?: boolean;
  settings?: ShopSettingsPublic;
}) {
  const [paper, setPaper] = useState<PaperSize>(embedded ? "letter4p" : "tabloid");
  const [showDesc, setShowDesc] = useState(false);
  const [showMark, setShowMark] = useState(true);
  const [printScale, setPrintScale] = useState(readPrintScale);
  const [settings, setSettings] = useState<ShopSettingsPublic | null>(givenSettings ?? null);

  useEffect(() => {
    if (givenSettings) setSettings(givenSettings);
  }, [givenSettings]);

  useEffect(() => {
    if (embedded && givenSettings) {
      setShowMark(givenSettings.showMark);
      return;
    }
    let live = true;
    void Promise.all([useMenuStore.persist.rehydrate(), getStorefront()]).then(([, data]) => {
      if (!live) return;
      setShowMark(data.settings.showMark);
      setSettings(data.settings);
      useMenuStore.getState().replaceAll({
        restaurant: data.restaurant,
        footer: data.footer,
        categories: data.categories.map((c) => ({
          ...c,
          items: c.items.map((it, i) => ({
            ...it,
            id: it.id ?? `${c.id}-${i}`,
          })),
        })),
      });
    });
    return () => {
      live = false;
    };
  }, [embedded, givenSettings]);

  useEffect(() => {
    document.documentElement.dataset.paper = paper;
    document.documentElement.style.setProperty("--print-scale", String(printScale / 100));
    return () => {
      delete document.documentElement.dataset.paper;
      document.documentElement.style.removeProperty("--print-scale");
    };
  }, [paper, printScale]);

  function persistScale(n: number) {
    const next = Math.max(90, Math.min(160, Math.round(n)));
    setPrintScale(next);
    try {
      localStorage.setItem(PRINT_SCALE_KEY, String(next));
    } catch {
      /* ignore */
    }
  }

  const toolbar = (
    <>
      <div className="toolbar-row board-ops-row">
        <div className="seg" role="group" aria-label="Paper size">
          {(
            [
              ["letter", "Letter"],
              ["tabloid", "Tabloid 11×17"],
              ["poster", "Poster 18×24"],
              ["letter4p", "4 × Letter"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              data-on={id === "letter4p" ? isLetterPack(paper) : paper === id}
              onClick={() => setPaper(id === "letter4p" ? (paper === "letter4l" ? "letter4l" : "letter4p") : id)}
            >
              {label}
            </button>
          ))}
        </div>
        {isLetterPack(paper) ? (
          <div className="seg" role="group" aria-label="Sheet orientation">
            <button type="button" data-on={paper === "letter4p"} onClick={() => setPaper("letter4p")}>
              Portrait
            </button>
            <button type="button" data-on={paper === "letter4l"} onClick={() => setPaper("letter4l")}>
              Landscape
            </button>
          </div>
        ) : null}
        <div className="seg" role="group" aria-label="Descriptions">
          <button type="button" data-on={showDesc} onClick={() => setShowDesc(true)}>
            Full
          </button>
          <button type="button" data-on={!showDesc} onClick={() => setShowDesc(false)}>
            Compact
          </button>
        </div>
        <div className="seg" role="group" aria-label="Print scale">
          {PRINT_SCALE_PRESETS.map((n) => (
            <button key={n} type="button" data-on={printScale === n} onClick={() => persistScale(n)}>
              {n}%
            </button>
          ))}
        </div>
        <button type="button" className="btn-print" onClick={() => window.print()}>
          <Printer size={16} strokeWidth={2.2} />
          Print / Save PDF
        </button>
      </div>
      <p className="ed-sub">
        {isLetterPack(paper)
          ? "Four letter pages. Portrait or landscape. Categories stay whole on a sheet so the cut does not slice a heading or an item."
          : "Print this board and post it on the wall. Turn on background graphics so the cream paper and red headers come through."}
      </p>
      {isLetterPack(paper) ? null : <CategoryJump />}
    </>
  );

  const preview = (
    <div className="preview-wrap">
      <MenuBoard paper={paper} showDesc={showDesc} showMark={showMark} settings={settings ?? undefined} printScale={printScale} />
    </div>
  );

  if (embedded) {
    return (
      <div className="board-ops">
        <div className="page-card no-print">
          <h2>Wall board</h2>
          {toolbar}
        </div>
        {preview}
      </div>
    );
  }

  return (
    <div className="studio-shell">
      <header className="studio-toolbar no-print">
        <div className="toolbar-title">South End Pizza III · Wall Menu</div>
        <div className="toolbar-actions">
          <Link to="/" className="btn-ghost">
            Customer menu
          </Link>
        </div>
        {toolbar}
      </header>
      <main className="preview-wrap">{preview}</main>
    </div>
  );
}
