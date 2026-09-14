import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { CategoryJump, MenuBoard, isLetterPack, type PaperSize } from "@/components/menu-board";
import { SessionGate } from "@/components/guards";
import { useMenuStore } from "@/lib/menu-store";
import { getStorefront } from "@/lib/shop-server";
import type { ShopSettingsPublic } from "@/lib/shop-types";

export const Route = createFileRoute("/board")({ component: BoardPage });

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

function BoardPage() {
  return (
    <SessionGate needAdmin>
      {() => <BoardInner />}
    </SessionGate>
  );
}

function BoardInner() {
  const [paper, setPaper] = useState<PaperSize>("tabloid");
  const [showDesc, setShowDesc] = useState(false);
  const [showMark, setShowMark] = useState(true);
  const [printScale, setPrintScale] = useState(readPrintScale);
  const [settings, setSettings] = useState<ShopSettingsPublic | null>(null);

  useEffect(() => {
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
  }, []);

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

  return (
    <div className="studio-shell">
      <header className="studio-toolbar no-print">
        <div className="toolbar-title">South End Pizza III · Wall Menu</div>
        <div className="toolbar-actions">
          <Link to="/" className="btn-ghost">
            Customer menu
          </Link>
          <button type="button" className="btn-print" onClick={() => window.print()}>
            <Printer size={16} strokeWidth={2.2} />
            Print / Save PDF
          </button>
        </div>
        <div className="toolbar-row">
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
          <label className="ed-field print-scale-slider">
            <span>Print scale {printScale}%</span>
            <input
              type="range"
              min={90}
              max={160}
              step={5}
              value={printScale}
              onChange={(e) => persistScale(Number(e.target.value))}
            />
          </label>
        </div>
        <p className="toolbar-hint">
          {isLetterPack(paper)
            ? "Print / Save PDF makes four 8.5×11 pages — tape them 2 across and 2 down. Portrait is a tall board (17×22). Landscape is a wide board (22×17). Scale only changes the PDF. Turn on background graphics so the cream paper and red headers come through."
            : "Print this board and post it on the wall. Scale only changes Print / Save PDF — the screen stays full size. Turn on background graphics so the cream paper and red headers come through."}
        </p>
        {isLetterPack(paper) ? null : <CategoryJump />}
      </header>
      <main className="preview-wrap">
        <MenuBoard paper={paper} showDesc={showDesc} showMark={showMark} settings={settings ?? undefined} printScale={printScale} />
      </main>
    </div>
  );
}
