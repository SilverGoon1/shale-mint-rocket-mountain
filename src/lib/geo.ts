export const ZONE_BOUNDS = {
  south: 39.32,
  north: 39.46,
  west: -74.73,
  east: -74.52,
};

/** Wider than ZONE_BOUNDS so Nominatim can see nearby Atlantic County towns. */
export const SEARCH_BOUNDS = {
  south: 39.28,
  north: 39.50,
  west: -74.78,
  east: -74.32,
};

export const CELL = 0.0032;
/** 443 Zion Rd, Egg Harbor Township */
export const MAP_CENTER: [number, number] = [39.3616, -74.62664];
export const SHOP_LAT = MAP_CENTER[0];
export const SHOP_LNG = MAP_CENTER[1];

/** Nominatim viewbox: west,north,east,south */
export const NOMINATIM_VIEWBOX = `${ZONE_BOUNDS.west},${ZONE_BOUNDS.north},${ZONE_BOUNDS.east},${ZONE_BOUNDS.south}`;
export const SEARCH_VIEWBOX = `${SEARCH_BOUNDS.west},${SEARCH_BOUNDS.north},${SEARCH_BOUNDS.east},${SEARCH_BOUNDS.south}`;

export type DeliveryFailReason = "outside radius" | "outside painted zone" | "Northfield blocked" | "not found" | "";

export type AddressSuggestion = {
  label: string;
  street: string;
  city: string;
  county: string;
  zip: string;
  lat: number;
  lng: number;
  deliverable: boolean;
  miles?: number;
  reason?: DeliveryFailReason;
};

export function parseNominatimHit(hit: {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: Record<string, string | undefined>;
}): AddressSuggestion {
  const a = hit.address ?? {};
  const road = a.road || a.pedestrian || a.residential || a.street || "";
  const street = [a.house_number, road].filter(Boolean).join(" ").trim();
  const city =
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.hamlet ||
    a.suburb ||
    "";
  const county = a.county || "";
  const zip = String(a.postcode || "").replace(/\D/g, "").slice(0, 5);
  const label = String(hit.display_name ?? "");
  return {
    label,
    street: street || label.split(",")[0]?.trim() || "",
    city,
    county,
    zip,
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    deliverable: false,
  };
}

export function cellKey(lat: number, lng: number) {
  const i = Math.floor((lat - ZONE_BOUNDS.south) / CELL);
  const j = Math.floor((lng - ZONE_BOUNDS.west) / CELL);
  return `${i},${j}`;
}

export function cellRect(key: string) {
  const [i, j] = key.split(",").map(Number);
  const south = ZONE_BOUNDS.south + i * CELL;
  const west = ZONE_BOUNDS.west + j * CELL;
  return {
    south,
    west,
    north: south + CELL,
    east: west + CELL,
  };
}

export function inBounds(lat: number, lng: number) {
  return (
    lat >= ZONE_BOUNDS.south &&
    lat <= ZONE_BOUNDS.north &&
    lng >= ZONE_BOUNDS.west &&
    lng <= ZONE_BOUNDS.east
  );
}

export function paintAround(lat: number, lng: number, radius: number) {
  const keys: string[] = [];
  for (let di = -radius; di <= radius; di += 1) {
    for (let dj = -radius; dj <= radius; dj += 1) {
      keys.push(cellKey(lat + di * CELL, lng + dj * CELL));
    }
  }
  return keys;
}

export function cellSetHas(cells: string[], lat: number, lng: number) {
  if (!cells.length) return false;
  return cells.includes(cellKey(lat, lng));
}

export function googleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function googleMapsCoordUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Northfield (08225) is outside the shop zone even if old paint still covers Tilton. */
export function isNorthfieldDelivery(input: {
  query?: string;
  label?: string;
  city?: string;
  zip?: string;
}) {
  const zip = String(input.zip ?? "").replace(/\D/g, "").slice(0, 5);
  if (zip === "08225") return true;
  const blob = [input.query, input.label, input.city]
    .map((s) => String(s ?? "").toLowerCase())
    .join(" , ");
  if (!/\bnorthfield\b/.test(blob)) return false;
  if (/\begg harbor\b/.test(blob)) return false;
  return true;
}

export function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function inRadius(lat: number, lng: number, miles: number) {
  return milesBetween(SHOP_LAT, SHOP_LNG, lat, lng) <= miles;
}

export function isAddressDeliverable(opts: {
  mode: "paint" | "radius";
  radiusMiles: number;
  cells: string[];
  lat: number;
  lng: number;
  query?: string;
  label?: string;
  city?: string;
  zip?: string;
  blockNorthfield?: boolean;
}) {
  return !deliveryFailReason(opts);
}

export function deliveryFailReason(opts: {
  mode: "paint" | "radius";
  radiusMiles: number;
  cells: string[];
  lat: number;
  lng: number;
  query?: string;
  label?: string;
  city?: string;
  zip?: string;
  blockNorthfield?: boolean;
}): DeliveryFailReason {
  if (!Number.isFinite(opts.lat) || !Number.isFinite(opts.lng)) return "not found";
  if (opts.mode === "radius") {
    return inRadius(opts.lat, opts.lng, opts.radiusMiles) ? "" : "outside radius";
  }
  if (opts.blockNorthfield !== false && isNorthfieldDelivery(opts)) return "Northfield blocked";
  if (!opts.cells.length || !cellSetHas(opts.cells, opts.lat, opts.lng)) return "outside painted zone";
  return "";
}

export function isMapsQuery(query: string) {
  return /https?:\/\/(?:www\.)?(?:maps\.google\.|google\.[^/\s]+\/maps|maps\.app\.goo\.gl)/i.test(query);
}

export function parseMapsLatLng(url: string): { lat: number; lng: number } | null {
  const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: Number(at[1]), lng: Number(at[2]) };
  const bang = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (bang) return { lat: Number(bang[1]), lng: Number(bang[2]) };
  const q = url.match(/[?&](?:q|query|ll)=(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/i);
  if (q) return { lat: Number(q[1]), lng: Number(q[2]) };
  return null;
}

export function nominatimViewboxForRadius(miles: number) {
  const padLat = (Math.max(miles, 6) * 1.2) / 69;
  const padLng = padLat / Math.cos((SHOP_LAT * Math.PI) / 180);
  const west = SHOP_LNG - padLng;
  const east = SHOP_LNG + padLng;
  const north = SHOP_LAT + padLat;
  const south = SHOP_LAT - padLat;
  return `${west},${north},${east},${south}`;
}

export function expandDeliveryQuery(query: string) {
  const q = String(query ?? "").trim();
  if (!q) return q;
  if (
    /\b(nj|new jersey|egg harbor|pleasantville|absecon|linwood|somers point|northfield|galloway|atlantic county|brigantine|ventnor|margate|mays landing)\b/i.test(
      q,
    )
  ) {
    return q;
  }
  return `${q}, Atlantic County, NJ`;
}
