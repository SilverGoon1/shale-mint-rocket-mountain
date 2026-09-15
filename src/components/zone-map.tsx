import { useEffect, useRef, useState } from "react";
import { Eraser, Hand, MapPin, Paintbrush, Trash2, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { MAP_CENTER, cellRect, googleMapsSearchUrl, paintAround, type AddressSuggestion } from "@/lib/geo";
import { checkDeliveryAddress } from "@/lib/shop-server";
import { AddressSuggest } from "@/components/address-suggest";

type Mode = "paint" | "erase" | "move";

export function ZoneMap({
  cells,
  onChange,
}: {
  cells: string[];
  onChange: (next: string[]) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const pinLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const cellsRef = useRef(new Set(cells));
  const modeRef = useRef<Mode>("paint");
  const drawing = useRef(false);
  const [mode, setMode] = useState<Mode>("paint");
  const [brush, setBrush] = useState(1);
  const [query, setQuery] = useState("");
  const [lookup, setLookup] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const brushRef = useRef(1);

  useEffect(() => {
    cellsRef.current = new Set(cells);
    const layer = layerRef.current;
    if (layer && mapRef.current) {
      void import("leaflet").then((mod) => drawCells(mod, layer, cellsRef.current, tomatoColor()));
    }
  }, [cells]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    brushRef.current = brush;
  }, [brush]);

  useEffect(() => {
    if (!host.current || mapRef.current) return;
    let dead = false;
    void import("leaflet").then((L) => {
      if (dead || !host.current) return;
      const map = L.map(host.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true,
        touchZoom: true,
        boxZoom: true,
        keyboard: true,
      }).setView(MAP_CENTER, 12);
      map.scrollWheelZoom.enable();
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      const layer = L.layerGroup().addTo(map);
      const pins = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerRef.current = layer;
      pinLayerRef.current = pins;
      drawCells(L, layer, cellsRef.current, tomatoColor());

      const apply = (lat: number, lng: number) => {
        if (modeRef.current === "move") return;
        const keys = paintAround(lat, lng, brushRef.current);
        const set = cellsRef.current;
        let changed = false;
        for (const k of keys) {
          if (modeRef.current === "paint") {
            if (!set.has(k)) {
              set.add(k);
              changed = true;
            }
          } else if (set.delete(k)) changed = true;
        }
        if (changed) {
          drawCells(L, layer, set, tomatoColor());
          onChange([...set]);
        }
      };

      map.on("mousedown", (e) => {
        if (modeRef.current === "move") return;
        drawing.current = true;
        map.dragging.disable();
        apply(e.latlng.lat, e.latlng.lng);
      });
      map.on("click", (e) => {
        if (modeRef.current === "move") return;
        apply(e.latlng.lat, e.latlng.lng);
      });
      map.on("mousemove", (e) => {
        if (!drawing.current || modeRef.current === "move") return;
        apply(e.latlng.lat, e.latlng.lng);
      });
      const stop = () => {
        drawing.current = false;
        map.dragging.enable();
      };
      map.on("mouseup", stop);
      map.on("mouseout", stop);
    });
    return () => {
      dead = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once
  }, []);

  function dropPin(lat: number, lng: number, label: string) {
    const map = mapRef.current;
    const pins = pinLayerRef.current;
    if (!map || !pins) return;
    void import("leaflet").then((L) => {
      pins.clearLayers();
      L.circleMarker([lat, lng], {
        radius: 10,
        color: creamColor(),
        fillColor: tomatoColor(),
        fillOpacity: 1,
        weight: 3,
      })
        .bindPopup(label)
        .addTo(pins)
        .openPopup();
      map.setView([lat, lng], 16, { animate: true });
      setHasPin(true);
    });
  }

  function clearPin() {
    pinLayerRef.current?.clearLayers();
    setHasPin(false);
    setLookup("");
  }

  async function lookupAddress() {
    if (!query.trim()) {
      setLookup("Type a street, then Search.");
      return;
    }
    setLookup("Looking up…");
    try {
      const r = await checkDeliveryAddress({ data: { query } });
      if (!r.found || r.lat == null || r.lng == null) {
        setLookup("No match. Try a street name in Egg Harbor Township.");
        return;
      }
      setLookup(
        r.deliverable
          ? `Inside the painted zone — ${r.label}`
          : `Outside the painted zone — ${r.label}`,
      );
      if (r.street) setQuery(r.street);
      dropPin(r.lat, r.lng, r.label);
    } catch (e) {
      setLookup(e instanceof Error ? e.message : "Lookup failed");
    }
  }

  function pickSuggest(hit: AddressSuggestion) {
    setQuery(hit.street);
    setLookup(
      hit.deliverable
        ? `Inside the painted zone — ${hit.label}`
        : `Outside the painted zone — ${hit.label}`,
    );
    dropPin(hit.lat, hit.lng, hit.label);
  }

  return (
    <div className="zone-wrap">
      <div className="zone-tools">
        <div className="seg" role="group" aria-label="Map mode">
          <button type="button" data-on={mode === "paint"} onClick={() => setMode("paint")}>
            <Paintbrush size={14} />
            Paint
          </button>
          <button type="button" data-on={mode === "erase"} onClick={() => setMode("erase")}>
            <Eraser size={14} />
            Erase
          </button>
          <button type="button" data-on={mode === "move"} onClick={() => setMode("move")}>
            <Hand size={14} />
            Move
          </button>
        </div>
        <div className="seg" role="group" aria-label="Brush size">
          {[0, 1, 2].map((n) => (
            <button key={n} type="button" data-on={brush === n} onClick={() => setBrush(n)}>
              {n === 0 ? "Fine" : n === 1 ? "Medium" : "Wide"}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="ed-btn ed-btn-quiet"
          onClick={() => {
            cellsRef.current = new Set();
            if (layerRef.current) layerRef.current.clearLayers();
            onChange([]);
          }}
        >
          <Trash2 size={14} />
          Clear paint
        </button>
        <span className="zone-count">{cells.length} blocks covered</span>
      </div>
      <div ref={host} className="zone-map" role="application" aria-label="Delivery zone map" />
      <form
        className="zone-lookup"
        onSubmit={(e) => {
          e.preventDefault();
          void lookupAddress();
        }}
      >
        <AddressSuggest
          street={query}
          onStreetChange={setQuery}
          onPick={pickSuggest}
          placeholder="Search a street in Egg Harbor Township"
        />
        <button type="submit" className="ed-btn">
          <MapPin size={14} />
          Search
        </button>
        <button type="button" className="ed-btn ed-btn-quiet" disabled={!hasPin} onClick={clearPin}>
          <X size={14} />
          Clear pin
        </button>
        <a className="ed-btn ed-btn-quiet" href={googleMapsSearchUrl(query || "Egg Harbor Township NJ")} target="_blank" rel="noreferrer">
          Google Maps
        </a>
      </form>
      {lookup ? <p className="zone-lookup-msg">{lookup}</p> : null}
      <p className="ed-sub">
        Scroll or use + / − to zoom. Choose Move to pan without painting. Search drops a pin on the
        match. Drag in Paint to cover streets you deliver — checkout only accepts addresses inside
        the red blocks.
      </p>
    </div>
  );
}

function tomatoColor() {
  if (typeof window === "undefined") return "currentColor";
  const v = getComputedStyle(document.documentElement).getPropertyValue("--color-tomato").trim();
  return v || "currentColor";
}

function creamColor() {
  if (typeof window === "undefined") return "#fbf6ec";
  const v = getComputedStyle(document.documentElement).getPropertyValue("--color-cream").trim();
  return v || "#fbf6ec";
}

function drawCells(
  L: typeof import("leaflet"),
  layer: import("leaflet").LayerGroup,
  cells: Set<string>,
  color: string,
) {
  layer.clearLayers();
  for (const key of cells) {
    const r = cellRect(key);
    L.rectangle(
      [
        [r.south, r.west],
        [r.north, r.east],
      ],
      {
        color,
        weight: 1,
        fillColor: color,
        fillOpacity: 0.35,
      },
    ).addTo(layer);
  }
}
