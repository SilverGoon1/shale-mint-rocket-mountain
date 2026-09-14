export const ZONE_BOUNDS = {
  south: 39.32,
  north: 39.46,
  west: -74.73,
  east: -74.52,
};

export const CELL = 0.0032;
export const MAP_CENTER: [number, number] = [39.3787, -74.6051];

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

export function expandDeliveryQuery(query: string) {
  const q = String(query ?? "").trim();
  if (!q) return q;
  if (isNorthfieldDelivery({ query: q })) return q;
  if (/nj|new jersey|egg harbor|pleasantville|absecon|linwood|somers point|northfield/i.test(q)) {
    return q;
  }
  return `${q}, Egg Harbor Township, NJ`;
}
