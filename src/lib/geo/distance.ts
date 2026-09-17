import { CITIES, type CityCoord } from "@/lib/geo/cities";

const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Best-effort match against the bundled city list: accepts "City", "City, ST",
 * or "City, Country" and looks for a city-name match, preferring one whose
 * state/country also appears in the input when given. Returns null for
 * anything not in the bundled list (a small town, a typo, "Remote", etc.) —
 * callers must treat that as "can't compute a distance," not an error.
 */
export function resolveCity(text: string | null | undefined): CityCoord | null {
  if (!text) return null;
  const parts = text.split(",").map((p) => normalize(p)).filter(Boolean);
  if (parts.length === 0) return null;

  const cityPart = parts[0];
  const qualifier = parts[1];

  const candidates = CITIES.filter((c) => normalize(c.city) === cityPart);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  if (qualifier) {
    const byQualifier = candidates.find(
      (c) => normalize(c.state) === qualifier || normalize(c.country) === qualifier
    );
    if (byQualifier) return byQualifier;
  }
  return candidates[0];
}

export function distanceMiles(fromText: string | null | undefined, toText: string | null | undefined): number | null {
  const from = resolveCity(fromText);
  const to = resolveCity(toText);
  if (!from || !to) return null;
  return Math.round(haversineMiles(from, to));
}
