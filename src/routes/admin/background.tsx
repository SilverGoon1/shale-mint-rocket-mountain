import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import { CardEditor } from "@/components/card-editor";
import { DEFAULT_BACKDROP, DEFAULT_LOGO, emitShopBackdrop, emitShopLogo } from "@/lib/admin-nav";
import { fileToDataImage } from "@/lib/image-file";
import { useMenuStore } from "@/lib/menu-store";
import { getAdminShop, saveShopSettings } from "@/lib/shop-server";
import { SEASON_EFFECTS, sanitizeSeasonEffect, type SeasonEffect } from "@/lib/shop-types";

export const Route = createFileRoute("/admin/background")({ component: AdminBackground });

function AdminBackground() {
  const [backdrop, setBackdrop] = useState("");
  const [backdropPreview, setBackdropPreview] = useState("");
  const [logo, setLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [notify, setNotify] = useState("");
  const [season, setSeason] = useState<SeasonEffect>("none");
  const [adminTotpRequired, setAdminTotpRequired] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [previewAspect, setPreviewAspect] = useState("16 / 9");

  useEffect(() => {
    void getAdminShop()
      .then((d) => {
        setBackdrop(d.settings.backdropData || "");
        setBackdropPreview(d.settings.backdropData || DEFAULT_BACKDROP);
        setLogo(d.settings.logoData || "");
        setLogoPreview(d.settings.logoData || DEFAULT_LOGO);
        setNotify(d.notifyAudio || "");
        setSeason(sanitizeSeasonEffect(d.settings.seasonEffect));
        setAdminTotpRequired(Boolean(d.settings.adminTotpRequired));
        useMenuStore.getState().setCardType({
          cardTextSize: d.settings.cardTextSize,
          cardTextColor: d.settings.cardTextColor,
          cardDescColor: d.settings.cardDescColor,
          cardPriceColor: d.settings.cardPriceColor,
          cardSize: d.settings.cardSize,
          cardBg: d.settings.cardBg,
        });
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not load"));
  }, []);

  useEffect(() => {
    const apply = () => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      setPreviewAspect(`${w} / ${h}`);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  function applyBackdrop(data: string) {
    setBusy(true);
    setMsg("");
    void saveShopSettings({ data: { backdropData: data } })
      .then(() => {
        setBackdrop(data);
        setBackdropPreview(data || DEFAULT_BACKDROP);
        emitShopBackdrop();
        setMsg(data ? "Backdrop saved. It covers the screen at this window’s shape." : "Restored the buffalo-and-chicken mark.");
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not save"))
      .finally(() => setBusy(false));
  }

  function applyLogo(data: string) {
    setBusy(true);
    setMsg("");
    void saveShopSettings({ data: { logoData: data } })
      .then(() => {
        setLogo(data);
        setLogoPreview(data || DEFAULT_LOGO);
        emitShopBackdrop();
        emitShopLogo();
        setMsg(data ? "Shop icon saved. Header, login, and the tab icon use it." : "Restored the original shop icon.");
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not save"))
      .finally(() => setBusy(false));
  }

  function applySeason(next: SeasonEffect) {
    setBusy(true);
    setMsg("");
    void saveShopSettings({ data: { seasonEffect: next } })
      .then(() => {
        setSeason(next);
        emitShopBackdrop();
        setMsg(next === "none" ? "Seasonal effects are off." : "Seasonal effect is on across the shop.");
      })
      .catch((e) => setMsg(e instanceof Error ? e.message : "Could not save"))
      .finally(() => setBusy(false));
  }

  return (
    <div className="settings-page">
      <header className="page-card">
        <p className="shop-brand-kicker">Admin</p>
        <h1>Settings</h1>
        <p className="ed-sub">
          Swap the website icon, the full-page backdrop, seasonal effects, and the incoming-order alarm. Desk
          authenticator for Admin is optional here.
        </p>
      </header>
      <section className="page-card">
        <h2>Desk security</h2>
        <p className="ed-sub">
          Off by default. When this is on, Admin must enroll an authenticator app before POS and the rest of the desk
          open. Personal 2FA on Account still works either way.
        </p>
        <label className="pay-opt">
          <input
            type="checkbox"
            checked={adminTotpRequired}
            disabled={busy}
            onChange={(e) => {
              const next = e.target.checked;
              setBusy(true);
              setMsg("");
              void saveShopSettings({ data: { adminTotpRequired: next } })
                .then(() => {
                  setAdminTotpRequired(next);
                  setMsg(
                    next
                      ? "Admin must use an authenticator before the desk opens."
                      : "Admin authenticator is optional.",
                  );
                })
                .catch((err) => {
                  setMsg(err instanceof Error ? err.message : "Could not save");
                })
                .finally(() => setBusy(false));
            }}
          />
          Require authenticator for Admin
        </label>
      </section>
      <section className="page-card">
        <h2>Website icon</h2>
        <p className="ed-sub">This is the stamp customers see next to the shop name.</p>
        <div className="logo-preview">
          {logoPreview ? <img src={logoPreview} alt="Shop icon preview" /> : <BrandMark variant="settings" />}
        </div>
        <label className="ed-field">
          <span>Icon file</span>
          <input
            className="ed-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              setMsg("");
              void fileToDataImage(file, { maxEdge: 320, maxChars: 120000, quality: 0.86 })
                .then((url) => {
                  setLogoPreview(url);
                  applyLogo(url);
                })
                .catch((err) => {
                  setMsg(err instanceof Error ? err.message : "Could not read that image");
                  setBusy(false);
                });
            }}
          />
        </label>
        <div className="confirm-actions">
          <button type="button" className="ed-btn" disabled={busy || !logo} onClick={() => applyLogo("")}>
            Restore original icon
          </button>
        </div>
      </section>
      <section className="page-card">
        <h2>Page backdrop</h2>
        <p className="ed-sub">
          Covers the whole window. The photo keeps its own shape; the shop scales it to this screen with cover, so
          nothing is cropped at upload.
        </p>
        <div className="backdrop-preview" style={{ aspectRatio: previewAspect }}>
          {backdropPreview ? <img src={backdropPreview} alt="Shop background preview" /> : null}
        </div>
        <label className="ed-field">
          <span>Backdrop file</span>
          <input
            className="ed-input"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              setMsg("");
              void fileToDataImage(file, { maxEdge: 1920, maxChars: 280000, quality: 0.84 })
                .then((url) => {
                  setBackdropPreview(url);
                  applyBackdrop(url);
                })
                .catch((err) => {
                  setMsg(err instanceof Error ? err.message : "Could not read that image");
                  setBusy(false);
                });
            }}
          />
        </label>
        <div className="confirm-actions">
          <button type="button" className="ed-btn" disabled={busy || !backdrop} onClick={() => applyBackdrop("")}>
            Restore buffalo mark
          </button>
        </div>
        {msg ? <p className="ed-sub">{msg}</p> : null}
      </section>
      <section className="page-card">
        <h2>Card editor</h2>
        <CardEditor />
        <button
          type="button"
          className="btn-print"
          disabled={busy}
          onClick={() => {
            const snap = useMenuStore.getState();
            setBusy(true);
            setMsg("");
            void saveShopSettings({
              data: {
                cardTextSize: snap.cardTextSize,
                cardTextColor: snap.cardTextColor,
                cardDescColor: snap.cardDescColor,
                cardPriceColor: snap.cardPriceColor,
                cardSize: snap.cardSize,
                cardBg: snap.cardBg,
              },
            })
              .then(() => setMsg("Card style is live."))
              .catch((e) => setMsg(e instanceof Error ? e.message : "Could not save"))
              .finally(() => setBusy(false));
          }}
        >
          Save card style
        </button>
      </section>
      <section className="page-card">
        <h2>Seasonal effects</h2>
        <p className="ed-sub">
          Quiet motion for holidays. Off by default. Respects reduced-motion, and never covers buttons or text contrast.
        </p>
        <label className="ed-field">
          <span>Occasion</span>
          <select
            className="ed-input"
            value={season}
            disabled={busy}
            onChange={(e) => applySeason(sanitizeSeasonEffect(e.target.value))}
          >
            {SEASON_EFFECTS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="page-card">
        <h2>Incoming-order alarm</h2>
        <p className="ed-sub">
          Plays when a new ticket lands, including a queue of several at once. Default is a two-tone alarm-clock ring.
        </p>
        <audio className="notify-audio" controls src={notify || "/order-alarm.wav"} preload="none">
          Alarm preview
        </audio>
        <label className="ed-field">
          <span>Alarm file</span>
          <input
            className="ed-input"
            type="file"
            accept="audio/wav,audio/mpeg,audio/mp3,audio/ogg,audio/webm"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (file.size > 280000) {
                setMsg("Keep the alarm under 280 KB.");
                return;
              }
              setBusy(true);
              setMsg("");
              const reader = new FileReader();
              reader.onload = () => {
                const url = String(reader.result || "");
                void saveShopSettings({ data: { notifyAudio: url } })
                  .then(() => {
                    setNotify(url);
                    setMsg("Incoming-order alarm saved.");
                  })
                  .catch((err) => setMsg(err instanceof Error ? err.message : "Could not save"))
                  .finally(() => setBusy(false));
              };
              reader.onerror = () => {
                setMsg("Could not read that audio file.");
                setBusy(false);
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
        <div className="confirm-actions">
          <button
            type="button"
            className="ed-btn"
            disabled={busy || !notify}
            onClick={() => {
              setBusy(true);
              setMsg("");
              void saveShopSettings({ data: { notifyAudio: "" } })
                .then(() => {
                  setNotify("");
                  setMsg("Restored the default alarm-clock ring.");
                })
                .catch((e) => setMsg(e instanceof Error ? e.message : "Could not save"))
                .finally(() => setBusy(false));
            }}
          >
            Restore default alarm
          </button>
        </div>
      </section>
    </div>
  );
}
